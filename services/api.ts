/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */


import { Student, FeeRecord, TransportRoute, LibraryBook, ClassSession, Assignment, SchoolConfig } from '../types';
import { authService } from './auth';

// In production, this comes from the build environment. In dev, it falls back to localhost.
const getApiUrl = () => {
  // 1. Prioritize explicit environment variable (e.g., EC2 Backend IP)
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  
  // If we are in production (Vercel) and the URL is HTTP, it will be blocked.
  // We recommend using /api relative path to trigger the Vercel Proxy Rewrite.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envUrl?.startsWith('http:')) {
    console.warn('[LUMIX] Mixed Content detected. Proxying through /api to avoid browser blocks.');
    return '/api';
  }

  if (envUrl) return envUrl;

  // 2. Fallback to same-origin /api if on a public domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && 
        hostname !== '127.0.0.1' &&
        !hostname.startsWith('192.168.') &&
        !hostname.startsWith('10.') &&
        !hostname.startsWith('172.')) {
      return `${window.location.origin}/api`;
    }
  }
  
  // 3. Default to local development backend
  return 'http://localhost:8000';
};

const API_URL = getApiUrl();
console.log(`[LUMIX] API_URL initialized as: ${API_URL}`);

type ApiError = Error & { status?: number; code?: string };

const getHeaders = (isMultipart = false) => {
    const user = authService.getUser();
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${user.token}`
    };
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

// Demo Mode Guard: Intercepts API calls in demo mode to prevent production usage
const demoGuard = async (path: string, options: any = {}) => {
    const user = authService.getUser();
    if (user.token === 'demo_session_token' || user.role === 'demo') {
        // Prevent sensitive data modifications in demo mode
        const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
        const method = options.method || 'GET';
        
        if (sensitiveMethods.includes(method) && !path.includes('/db/test-connection') && !path.includes('/nexus/upload')) {
            console.warn(`[DEMO GUARD] Intercepted ${method} request to ${path}. Data persistence is disabled in demo mode.`);
            return new Response(JSON.stringify({ 
                message: "Demonstration Mode: Changes are not saved to the persistent database.",
                demo: true 
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    }
    return null;
};

const dispatchAccessEvent = (detail: any) => {
  try {
    window.dispatchEvent(new CustomEvent('lumix:access', { detail }));
  } catch {}
};

const parseErrorBody = async (res: Response): Promise<any | null> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const throwHttpError = async (res: Response): Promise<never> => {
  const body = await parseErrorBody(res);
  const detail = body?.detail;
  const code = typeof detail === 'object' && detail ? detail.code : undefined;
  const message =
    (typeof detail === 'string' && detail) ||
    (typeof detail === 'object' && detail ? detail.message : undefined) ||
    body?.message ||
    body?.error ||
    res.statusText ||
    'Request failed';

  const err = new Error(message) as ApiError;
  err.status = res.status;
  if (code) err.code = String(code);

  if (res.status === 401) {
    const user = authService.getUser();
    if (user.token === 'demo_session_token') {
      console.warn('[LUMIX] Demo session API call returned 401. Ignoring redirect.');
    } else {
      authService.logout();
      dispatchAccessEvent({ type: 'auth', status: 401 });
    }
  } else if (res.status === 403 && err.code) {
    dispatchAccessEvent({ type: 'paywall', status: 403, code: err.code });
  }

  throw err;
};

export const api = {
  // Check System Status
  checkHealth: async () => {
    try {
      console.log(`[LUMIX] Checking health at ${API_URL}/`);
      const res = await fetch(`${API_URL}/`);
      const responseText = await res.text();
      try {
        const data = JSON.parse(responseText);
        console.log(`[LUMIX] Health check response:`, data);
        return data;
      } catch (parseError) {
        console.warn(`[LUMIX] Health check returned non-JSON (HTTP ${res.status}):`, responseText);
        return { status: res.status === 200 ? "ONLINE" : "OFFLINE", detail: responseText };
      }
    } catch (e) {
      console.error("[LUMIX] Health check failed:", e);
      return { status: "OFFLINE" };
    }
  },

  // --- SCHOOL CONFIG ---
  getSchoolConfig: async (): Promise<SchoolConfig | null> => {
    try {
      const res = await fetch(`${API_URL}/school/config`, { headers: getHeaders() });
      if (!res.ok) await throwHttpError(res);
      const data = await res.json();
      return {
        name: data.name,
        motto: data.motto,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        logoUrl: data.logo_url,
        websiteContext: data.website_context,
        isConfigured: true,
        modules: data.modules_json ? JSON.parse(data.modules_json) : { transport: true, library: true, finance: true, nexus: true },
        systemSettings: {
          securityLevel: data.security_level as 'standard' | 'high' | 'fortress',
          aiCreativity: data.ai_creativity
        }
      };
    } catch (e) { return null; }
  },

  updateSchoolConfig: async (config: SchoolConfig): Promise<boolean> => {
    try {
      const path = `${API_URL}/school/config`;
      const payload = {
        name: config.name,
        motto: config.motto,
        primary_color: config.primaryColor,
        secondary_color: config.secondaryColor,
        logo_url: config.logoUrl,
        website_context: config.websiteContext,
        modules_json: JSON.stringify(config.modules),
        security_level: config.systemSettings?.securityLevel,
        ai_creativity: config.systemSettings?.aiCreativity
      };
      const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      };

      const intercepted = await demoGuard(path, options);
      if (intercepted) return true;

      const res = await fetch(path, options);
      if (!res.ok) await throwHttpError(res);
      return true;
    } catch (e) { return false; }
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    try {
      const res = await fetch(`${API_URL}/students/`, { headers: getHeaders() });
      if (!res.ok) await throwHttpError(res);
      const data = await res.json();
      return data.map((s: any) => ({
        ...s,
        gradeLevel: s.grade_level,
        behaviorScore: s.behavior_score,
        riskLevel: s.risk_level
      }));
    } catch (e) { return []; }
  },

  getSelfStudent: async (): Promise<Student | null> => {
    try {
      const res = await fetch(`${API_URL}/students/self`, { headers: getHeaders() });
      if (!res.ok) await throwHttpError(res);
      const s: any = await res.json();
      return {
        ...s,
        gradeLevel: s.grade_level,
        behaviorScore: s.behavior_score,
        riskLevel: s.risk_level,
      };
    } catch {
      return null;
    }
  },

  addStudent: async (student: Student) => {
    const payload = {
        id: student.id,
        name: student.name,
        grade_level: student.gradeLevel,
        gpa: student.gpa,
        attendance: student.attendance,
        behavior_score: student.behaviorScore,
        notes: student.notes,
        risk_level: student.riskLevel
    };
    const res = await fetch(`${API_URL}/students/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) await throwHttpError(res);
    return await res.json();
  },

  

  createSelfStudentProfile: async (student: Student) => {
    const payload = {
      id: student.id,
      name: student.name,
      grade_level: student.gradeLevel,
      gpa: student.gpa ?? 0,
      attendance: student.attendance ?? 100,
      behavior_score: student.behaviorScore ?? 100,
      notes: student.notes ?? "",
      risk_level: student.riskLevel ?? "Low",
    };
    const res = await fetch(`${API_URL}/students/self`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await throwHttpError(res);
    }
    return await res.json();
  },

  sendLandingChat: async (prompt: string, history: { role: string, content: string }[] = [], language: string = 'en') => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
          const url = `${API_URL}/ai/landing-chat`;
          console.log(`[LUMIX] Sending landing chat to: ${url} (API_URL: ${API_URL}, hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'N/A'})`);
          
          const res = await fetch(url, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({ prompt, history, language }),
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Get the response text first to handle non-JSON errors
          const responseText = await res.text();
          let data;
          try {
              data = JSON.parse(responseText);
          } catch (parseError) {
              console.error(`[LUMIX] Failed to parse response as JSON:`, responseText);
              return { 
                  response: `System error (HTTP ${res.status}). The server returned a non-JSON response. Please check backend logs.` 
              };
          }

          if (!res.ok) {
              console.error(`[LUMIX] Landing chat error (${res.status}):`, data);
              return { response: data.detail || data.message || "My neural link is currently unstable. Please try again later." };
          }
          return data;
      } catch (e: any) {
          clearTimeout(timeoutId);
          console.error("[LUMIX] Connection to NOVA core failed:", e);
          
          // Detect if it's a browser-level block (like Mixed Content or PNA)
          let reason = e.message || 'Network Error';
          if (e.name === 'AbortError') {
              reason = 'Request timed out (30s).';
          } else if (reason === 'Failed to fetch' && typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http:')) {
              reason = 'Insecure Connection Blocked (Mixed Content). Use HTTPS for backend or visit via HTTP.';
          }
          
          return { response: `Connection to NOVA core failed. (Reason: ${reason})` };
      }
  },

  

  // --- TRANSPORT ---
  getTransport: async (): Promise<TransportRoute[]> => {
    try {
        const res = await fetch(`${API_URL}/transport/routes`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        const data = await res.json();
        return data.map((r: any) => ({
            id: r.id,
            route: r.route_name,
            driver: r.driver_name,
            status: r.status,
            fuel: r.fuel_level,
            plate: r.license_plate
        }));
    } catch (e) { return []; }
  },

  // --- LIBRARY ---
  getLibrary: async (): Promise<LibraryBook[]> => {
    try {
        const res = await fetch(`${API_URL}/library/books`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        return await res.json();
    } catch (e) { return []; }
  },

  // --- ACADEMICS ---
  getClasses: async (): Promise<any[]> => {
    try {
        const role = authService.getUser()?.role;
        const endpoint = role === 'teacher' ? '/teacher/classes' : '/student/schedule';
        const res = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        const data = await res.json();
        if (role === 'teacher') {
          return data.map((c: any) => ({
            id: Math.random().toString(),
            name: c.name,
            room: c.room,
            schedule: c.time,
            students: c.students_count,
            subject: 'Academic'
          }));
        } else {
          return data.map((i: any) => ({
            id: Math.random().toString(),
            name: i.subject,
            room: i.room,
            schedule: `${i.day} ${i.time}`,
            students: 0,
            subject: i.subject
          }));
        }
    } catch (e) { return []; }
  },

  getAssignments: async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/student/assignments`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        const data = await res.json();
        return data.map((a: any) => ({
          id: Math.random().toString(),
          title: a.title,
          dueDate: a.due_date,
          status: a.status,
          subject: a.subject,
          submissions: 0,
          total: 100
        }));
    } catch (e) { return []; }
  },

  getParentTransport: async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/parent/transport`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        return await res.json();
    } catch (e) { return []; }
  },

  // --- FEES ---
  getFees: async (): Promise<FeeRecord[]> => {
    try {
        const res = await fetch(`${API_URL}/fees/`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        return await res.json();
    } catch (e) { return []; }
  },

  // --- AI GRADER ---
  analyzeReference: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/ai/analyze-reference`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) await throwHttpError(res);
    return await res.json();
  },

  gradeAssignment: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/ai/grade`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) await throwHttpError(res);
    return await res.json();
  },

  // --- OTHERS ---

  // --- CSV UPLOAD ---
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/nexus/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
    if (!res.ok) await throwHttpError(res);
    return await res.json();
  },

  // --- DATABASE TEST ---
  testDbConnection: async (host: string, port: string, connectionString: string) => {
    const res = await fetch(`${API_URL}/db/test-connection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ host, port, connection_string: connectionString })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Connection failed");
    return data;
  },

  // --- ASSIGNMENT UPLOAD (Teacher/Admin) ---
  uploadAssignment: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/assignments/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
    if (!res.ok) {
      await throwHttpError(res);
    }
    return await res.json();
  },

  getSubscriptionStatus: async (): Promise<{ status: string; expiry?: string | null; role?: string } | null> => {
    try {
      const res = await fetch(`${API_URL}/subscription/status`, { headers: getHeaders() });
      if (!res.ok) await throwHttpError(res);
      return await res.json();
    } catch {
      return null;
    }
  },

  billingCheckout: async (plan: string): Promise<{ checkout_url: string }> => {
    const res = await fetch(`${API_URL}/billing/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ plan })
    });

    if (!res.ok) {
      await throwHttpError(res);
    }

    return await res.json();
  }
};

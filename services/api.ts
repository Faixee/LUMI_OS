
import { Student, FeeRecord, TransportRoute, LibraryBook, ClassSession, Assignment } from '../types';
import { authService } from './auth';

// In production, this comes from the build environment. In dev, it falls back to localhost.
const getApiUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
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
    authService.logout();
    dispatchAccessEvent({ type: 'auth', status: 401 });
  } else if (res.status === 403 && err.code) {
    dispatchAccessEvent({ type: 'paywall', status: 403, code: err.code });
  }

  throw err;
};

export const api = {
  // Check System Status
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, running in offline simulation mode.");
      return { status: "OFFLINE" };
    }
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

  sendLandingChat: async (prompt: string, history: { role: string, content: string }[] = []) => {
      try {
          const res = await fetch(`${API_URL}/ai/landing-chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, history })
          });
          const data = await res.json();
          if (!res.ok) {
              return { response: data.detail || data.message || "My neural link is currently unstable. Please try again later." };
          }
          return data;
      } catch (e) {
          return { response: "Connection to NOVA core failed. Please check your network." };
      }
  },

  

  // --- TRANSPORT ---
  getTransport: async (): Promise<TransportRoute[]> => {
    try {
        const res = await fetch(`${API_URL}/transport/`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        return await res.json();
    } catch (e) { return []; }
  },

  // --- LIBRARY ---
  getLibrary: async (): Promise<LibraryBook[]> => {
    try {
        const res = await fetch(`${API_URL}/library/`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        return await res.json();
    } catch (e) { return []; }
  },

  // --- FEES ---
  getFees: async (): Promise<FeeRecord[]> => {
    try {
        const res = await fetch(`${API_URL}/fees/`, { headers: getHeaders() });
        if (!res.ok) await throwHttpError(res);
        const data = await res.json();
        return data.map((f: any) => ({
            ...f,
            studentId: f.student_id,
            studentName: f.student_name,
            dueDate: f.due_date
        }));
    } catch (e) { return []; }
  },

  // --- CLASSES ---
  getClasses: async (): Promise<ClassSession[]> => {
      // Mock or implement backend endpoint
      return []; 
  },

  // --- ASSIGNMENTS ---
  getAssignments: async (): Promise<Assignment[]> => {
      // Mock or implement backend endpoint
      return []; 
  },

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

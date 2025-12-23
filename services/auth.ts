const getApiUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.startsWith('192.168.')) {
    return '/api';
  }

  return 'http://127.0.0.1:8000';
};

const API_URL = getApiUrl();

export interface AuthResponse {
    access_token: string;
    role: string;
    name: string;
}

export interface RegisterProfile {
    email?: string;
    phone?: string;
    grade_level?: number;
    class_name?: string;
    subject?: string;
    child_name?: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        let res: Response;
        try {
            res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
        } catch (e: any) {
            throw new Error('Network error: please ensure the backend is running and CORS allows this origin.');
        }
        if (!res.ok) {
            if (res.status === 429) throw new Error('Too many attempts. Please wait a minute and try again.');
            if (res.status === 401) throw new Error('Invalid username or password.');
            try { const err = await res.json(); throw new Error(err.detail || 'Authentication failed'); } catch { throw new Error('Authentication failed'); }
        }
        
        return await res.json();
    },

    demoLogin: async (role: string = 'demo'): Promise<any> => {
        let res: Response;
        try {
            res = await fetch(`${API_URL}/auth/demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
        } catch {
            throw new Error('Network error: please ensure the backend is running and CORS allows this origin.');
        }
        if (!res.ok) {
            if (res.status === 429) throw new Error('Too many attempts. Please wait a minute and try again.');
            try { const err = await res.json(); throw new Error(err.detail || 'Demo authentication failed'); } catch { throw new Error('Demo authentication failed'); }
        }
        return await res.json();
    },

    emailLogin: async (email: string): Promise<any> => {
        // Since we don't have a real email service, we'll simulate a magic link sent
        // In a real app, this would call an endpoint to send a magic link
        await new Promise(resolve => setTimeout(resolve, 800));
        return { message: "Magic link sent to your email." };
    },

    register: async (username: string, password: string, name: string, role: string, profile?: RegisterProfile & { invite_code?: string }): Promise<void> => {
        const payload = { username, password, name, role, ...(profile || {}) };
        let res: Response;
        try {
            res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e: any) {
            throw new Error('Network error: Failed to reach API. Start backend at http://127.0.0.1:8000 and retry.');
        }

        if (!res.ok) {
            try { const err = await res.json(); throw new Error(err.detail || "Registration Failed"); } catch { throw new Error("Registration Failed"); }
        }
    },

    logout: () => {
        const prefix = 'lumix_demo_ai_quota:';
        try {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(prefix)) sessionStorage.removeItem(key);
            }
        } catch { }
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) localStorage.removeItem(key);
            }
        } catch { }
        localStorage.removeItem('lumix_token');
        localStorage.removeItem('lumix_role');
        localStorage.removeItem('lumix_user');
        localStorage.removeItem('lumix_subscription');
        sessionStorage.removeItem('lumix_token');
        sessionStorage.removeItem('lumix_role');
        sessionStorage.removeItem('lumix_user');
        sessionStorage.removeItem('lumix_subscription');
    },

    getUser: () => {
        const token = localStorage.getItem('lumix_token') || sessionStorage.getItem('lumix_token');
        const role = localStorage.getItem('lumix_role') || sessionStorage.getItem('lumix_role');
        const name = localStorage.getItem('lumix_user') || sessionStorage.getItem('lumix_user');
        const subscription = localStorage.getItem('lumix_subscription') || sessionStorage.getItem('lumix_subscription');
        
        // Clean up stringified nulls/undefineds
        const cleanToken = (token === 'null' || token === 'undefined') ? null : token;
        
        return { token: cleanToken, role, name, subscription };
    },

    isAuthenticated: () => {
        const user = authService.getUser();
        return !!(user.token && user.token.length > 0);
    },

    saveUser: (token: string, role: string, name: string, subscription: string, useSession: boolean = false) => {
        const store = useSession ? sessionStorage : localStorage;
        store.setItem('lumix_token', token);
        store.setItem('lumix_role', role);
        store.setItem('lumix_user', name);
        store.setItem('lumix_subscription', subscription);
    }
};

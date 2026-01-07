/**
 * LUMIX OS - MAIN ENTRY POINT
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import SystemApp from './components/SystemApp';
import SubscriptionView from './components/SubscriptionView';
import DevLogin from './components/DevLogin';
import AboutPage from './components/AboutPage';
import DocsPage from './components/DocsPage';
import { authService } from './services/auth';

// Demo Handler Component
const DemoHandler = () => {
    const navigate = useNavigate();
    const { role } = useParams<{ role?: string }>();
    const location = useLocation();
    
    // Parse the dashboard type from query parameters
    const queryParams = new URLSearchParams(location.search);
    const dashboardType = queryParams.get('type') || 'development';
    const isExplicitInit = sessionStorage.getItem('lumix_demo_init_active') === 'true';

    React.useEffect(() => {
        const run = async () => {
            // Security: Prevent direct URL access to demo mode
            if (!isExplicitInit) {
                authService.logAudit('SECURITY_VIOLATION', { detail: 'Unauthorized demo access attempt via URL manipulation' });
                navigate('/', { replace: true });
                return;
            }

            // No backend login needed for demo mode as per user request
            // Directly set demo credentials in session storage
            const targetRole = role || 'admin';
            const demoName = dashboardType === 'paid' ? "LumiX Premium User" : "LumiX Demo User";
            
            // Mapping for demo mode based on dashboard type
            const subStatus = dashboardType === 'paid' ? 'pro' : 'demo';
            const demoToken = dashboardType === 'paid' ? 'premium_demo_token' : 'demo_session_token';
            
            const store = sessionStorage;
            store.setItem('lumix_token', demoToken);
            store.setItem('lumix_role', targetRole);
            store.setItem('lumix_user', demoName);
            store.setItem('lumix_subscription', subStatus);
            store.setItem('lumix_mode', 'demo'); // Explicit mode flag
            
            // SECURITY: Clear the initialization flag after use to prevent re-use or bookmarks
            sessionStorage.removeItem('lumix_demo_init_active');
            
            // Clear any real user data
            localStorage.removeItem('lumix_token');
            localStorage.removeItem('lumix_role');
            localStorage.removeItem('lumix_user');
            localStorage.removeItem('lumix_subscription');
            localStorage.removeItem('lumix_mode');

            authService.logAudit('DEMO_INITIALIZED', { role: targetRole, type: dashboardType });
            
            // Small delay to show initialization UI
            setTimeout(() => {
                navigate('/app', { replace: true });
            }, 800);
        };
        run();
    }, [navigate, role, dashboardType, isExplicitInit]);

    if (!isExplicitInit) return null;
    return (
        <div className="flex items-center justify-center h-screen bg-[#030014] text-white font-mono">
            <div className="animate-pulse text-cyan-400 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <div className="tracking-widest uppercase text-xs">
                    Initializing {role || 'Demo'} {dashboardType} Environment...
                </div>
            </div>
        </div>
    );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = authService.getUser();
    const isAuthenticated = !!(user.token && user.token !== 'null' && user.token !== 'undefined' && user.token.length > 0);
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    const subscription = (user.subscription || '').toLowerCase().trim();
    const role = (user.role || '').toLowerCase().trim();
    const mode = (sessionStorage.getItem('lumix_mode') || localStorage.getItem('lumix_mode') || 'paid').toLowerCase();

    // Strict Mode Enforcement: If we are in demo mode, subscription must be 'demo' or 'pro' (mapped from dashboard types)
    // If we are in paid mode, subscription MUST NOT be 'demo'
    if (mode === 'demo' && !['demo', 'pro'].includes(subscription)) {
        authService.logAudit('SECURITY_VIOLATION', { detail: 'Inconsistent demo session detected' });
        authService.logout();
        return <Navigate to="/login" replace />;
    }

    if (mode === 'paid' && subscription === 'demo') {
        authService.logAudit('SECURITY_VIOLATION', { detail: 'Demo bypass attempt detected in paid flow' });
        authService.logout();
        return <Navigate to="/login" replace />;
    }
    
    const isPaid = ['active', 'enterprise', 'pro', 'basic'].includes(subscription);
    const isDev = ['developer', 'owner', 'admin'].includes(role);
    const isDemo = mode === 'demo';
    
    if (!isPaid && !isDev && !isDemo) {
        // If authenticated but not paid and not demo, redirect to subscription page
        authService.logAudit('ACCESS_DENIED', { detail: 'Unpaid account access attempt', subscription });
        return <Navigate to="/subscribe" replace />;
    }
    
    return <>{children}</>;
};

// Wrapper for LandingPage to handle internal navigation if needed
const LandingPageWrapper = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    
    // Auto-redirect if already logged in and visiting landing? 
    // This provides a smoother experience for authenticated users
    React.useEffect(() => {
        if (user.token) {
            const subscription = (user.subscription || '').toLowerCase().trim();
            const role = (user.role || '').toLowerCase().trim();
            const isPaid = ['active', 'enterprise', 'pro', 'basic'].includes(subscription);
            const isDev = ['owner', 'admin'].includes(role);
            
            if (isPaid || isDev) {
                // We could auto-redirect here, but let's keep it to handleSystemLogin for now
                // to allow users to see the landing page if they want.
            }
        }
    }, [user.token, user.subscription, user.role, navigate]);
    
    return <LandingPage onNavigateLogin={() => {
        sessionStorage.setItem('allow_login_access', 'true');
        navigate('/login');
    }} />;
};

// Wrapper for LoginView
const LoginViewWrapper = () => {
    const navigate = useNavigate();
    return <LoginView onLoginSuccess={() => navigate('/app')} onBack={() => navigate('/')} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginViewWrapper />} />
        <Route path="/dev" element={<DevLogin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/demo" element={<DemoHandler />} />
        <Route path="/demo/:role" element={<DemoHandler />} />
        
        {/* Subscription can be accessed publicly or privately. 
            For now, let's make it a standalone page. 
            If it needs layout, we can wrap it. */}
        <Route path="/subscribe" element={
            <div className="bg-[#030014] min-h-screen p-8 text-white">
                <SubscriptionView />
                <div className="fixed top-6 right-6 z-50">
                    <button 
                        onClick={() => window.history.back()} 
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold border border-white/10 transition-all"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        } />
        
        <Route path="/app/*" element={
            <ProtectedRoute>
                <SystemApp />
            </ProtectedRoute>
        } />

        {/* Catch all - redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

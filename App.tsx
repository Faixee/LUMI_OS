import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import SystemApp from './components/SystemApp';
import SubscriptionView from './components/SubscriptionView';
import DevLogin from './components/DevLogin';
import { authService } from './services/auth';

// Demo Handler Component
const DemoHandler = () => {
    const navigate = useNavigate();
    const { role } = useParams<{ role?: string }>();

    React.useEffect(() => {
        const run = async () => {
            // No backend login needed for demo mode as per user request
            // Directly set demo credentials in session storage
            const targetRole = role || 'admin';
            const demoName = "LumiX Demo User";
            
            const store = sessionStorage;
            store.setItem('lumix_token', 'demo_session_token');
            store.setItem('lumix_role', targetRole);
            store.setItem('lumix_user', demoName);
            store.setItem('lumix_subscription', 'demo');
            
            // Clear any real user data
            localStorage.removeItem('lumix_token');
            localStorage.removeItem('lumix_role');
            localStorage.removeItem('lumix_user');
            localStorage.removeItem('lumix_subscription');
            
            // Small delay to show initialization UI
            setTimeout(() => {
                navigate('/app', { replace: true });
            }, 800);
        };
        run();
    }, [navigate, role]);
    return (
        <div className="flex items-center justify-center h-screen bg-[#030014] text-white font-mono">
            <div className="animate-pulse text-cyan-400 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <div className="tracking-widest uppercase text-xs">Initializing {role || 'Demo'} Environment...</div>
            </div>
        </div>
    );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = authService.getUser();
    if (!user.token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Wrapper for LandingPage to handle internal navigation if needed
const LandingPageWrapper = () => {
    const navigate = useNavigate();
    // If user is already authenticated, redirect to app?
    // Uncomment below if we want auto-redirect for logged in users
    /*
    const user = authService.getUser();
    if (user.token) {
        return <Navigate to="/app" />;
    }
    */
    
    // We pass empty onNavigateLogin because we are now using Link or useNavigate inside LandingPage, 
    // but for backward compatibility with the prop interface:
    return <LandingPage onNavigateLogin={() => navigate('/login')} />;
};

// Wrapper for LoginView
const LoginViewWrapper = () => {
    const navigate = useNavigate();
    const handleLoginSuccess = (role: string, name: string) => {
        navigate('/app');
    };
    return <LoginView onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginViewWrapper />} />
        <Route path="/dev" element={<DevLogin />} />
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

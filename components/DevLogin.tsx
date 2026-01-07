/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Key, Mail, ArrowRight, Terminal, Unlock, Sparkles } from 'lucide-react';

const DevLogin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginState, setLoginState] = useState<'idle' | 'granted' | 'welcome'>('idle');
    const processedRef = React.useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlEmail = params.get('email');
        const urlSecret = params.get('secret');
        const auto = params.get('auto');

        if (urlEmail && urlSecret) {
            setEmail(urlEmail);
            setSecret(urlSecret);
            
            if (auto === 'true' && !processedRef.current) {
                processedRef.current = true;
                console.log('⚡ Auto-Login Triggered (Delayed):', { email: urlEmail, secret: '***' });
                // Small delay to prevent ERR_ABORTED during initial page load/hydration
                setTimeout(() => {
                    performUnlock(urlEmail, urlSecret);
                }, 1000);
            }
        }
    }, [location.search]);

    const performUnlock = async (targetEmail: string, targetSecret: string) => {
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const getApiUrl = () => {
                const envUrl = (import.meta as any).env?.VITE_API_URL;
                if (envUrl) return envUrl;
                if (typeof window !== 'undefined') {
                    const hostname = window.location.hostname;
                    if (hostname !== 'localhost' && 
                        hostname !== '127.0.0.1' &&
                        !hostname.startsWith('192.168.') &&
                        !hostname.startsWith('10.') &&
                        !hostname.startsWith('172.')) {
                        return '/api';
                    }
                }
                return 'http://localhost:54322';
            };
            const API_URL = getApiUrl();
            console.log('🔌 Connecting to:', API_URL);
            
            const res = await fetch(`${API_URL}/internal/dev/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Dev-Secret': targetSecret
                },
                body: JSON.stringify({ email: targetEmail })
            });

            const data = await res.json();
            console.log('📡 Response:', res.status, data);

            if (!res.ok) {
                throw new Error(data.detail || 'Unlock failed');
            }

            // Success
            sessionStorage.setItem('lumix_token', data.access_token);
            sessionStorage.setItem('lumix_role', 'developer');
            sessionStorage.setItem('lumix_user', 'Developer Session');
            sessionStorage.setItem('lumix_subscription', 'active');
            
            // Clear local storage to avoid conflicts
            localStorage.removeItem('lumix_token');
            localStorage.removeItem('lumix_role');
            localStorage.removeItem('lumix_user');
            localStorage.removeItem('lumix_subscription');
            
            // Set login state for animations
            setLoginState('granted');
            setTimeout(() => {
                setLoginState('welcome');
            }, 1500);
            setTimeout(() => {
                navigate('/app');
            }, 4000);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        performUnlock(email, secret);
    };

    if (loginState === 'welcome') {
        return (
            <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
                </div>
                
                <div className="relative z-10 text-center space-y-8 animate-in zoom-in-95 duration-1000">
                    <div className="relative inline-block">
                        <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                        <Sparkles size={80} className="text-white relative animate-float" />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white font-sci-fi tracking-[0.2em] text-glow-animate">
                            WELCOME TO LUMIX
                        </h1>
                        <p className="text-cyan-400/60 font-mono text-sm md:text-base tracking-[0.5em] uppercase animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                            System Core Initialized
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-12">
                        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 animate-[loading_3s_ease-in-out_forwards]" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest animate-pulse uppercase">
                            Loading secure environment...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4 font-sans relative overflow-hidden">
             {/* Access Granted Modal */}
             {loginState === 'granted' && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-emerald-500/5 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="glass-panel max-w-md w-full p-10 rounded-[2rem] border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center space-y-8 animate-unlock">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Unlock size={48} className="text-emerald-400" />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white font-sci-fi tracking-widest uppercase text-glow">Access Granted</h2>
                            <p className="text-emerald-400/60 text-xs font-mono tracking-[0.2em] uppercase">
                                Identity Verified • Developer Session
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-4">
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-emerald-500/40 tracking-[0.4em] uppercase">Initialising Core...</span>
                        </div>
                    </div>
                </div>
            )}

             {/* Background Ambience */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[100px]"></div>

            <div className={`glass-panel w-full max-w-md p-8 rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] relative z-10 transition-all duration-700 ${loginState === 'granted' ? 'opacity-0 scale-95' : ''}`}>
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/30 mb-4 animate-pulse">
                        <Shield size={32} className="text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-sci-fi tracking-wider">DEVELOPER UNLOCK</h1>
                    <p className="text-purple-400/60 font-mono text-xs mt-2 tracking-widest">INTERNAL ACCESS ONLY</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Mail size={12} /> Authorized Email
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            placeholder="dev@lumios.internal"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Key size={12} /> Master Secret Key
                        </label>
                        <input 
                            type="password" 
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            placeholder="••••••••••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold font-sci-fi tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.3)] group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Terminal size={20} className="group-hover:text-cyan-400 transition-colors" />
                                EXECUTE UNLOCK
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
                        Terminal ID: <span className="text-purple-500/50">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DevLogin;

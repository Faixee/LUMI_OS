import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, ArrowRight, Terminal } from 'lucide-react';

const DevLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
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
            
            const res = await fetch(`${API_URL}/internal/dev/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Dev-Secret': secret
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

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
            
            navigate('/app');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4 font-sans relative overflow-hidden">
             {/* Background Ambience */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[100px]"></div>

            <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] relative z-10">
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
                            <Key size={12} /> Access Secret
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
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2">
                            <Terminal size={14} />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'AUTHENTICATING...' : 'INITIATE UNLOCK SEQUENCE'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DevLogin;


import React, { useState, useEffect } from 'react';
import { Lock, ScanFace, ArrowRight, ShieldCheck, AlertCircle, UserPlus, LogIn, Eye, EyeOff, Info, CheckCircle2, Github, Mail, Unlock, Sparkles, ShieldAlert, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (role: string, name: string) => void;
  onBack?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBack }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState(9);
  const [classSection, setClassSection] = useState('');
  const [subject, setSubject] = useState('');
  const [childName, setChildName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'denied' | 'granted' | 'welcome'>('idle');
  const [authData, setAuthData] = useState<any>(null);

  // Check for existing session and lock page on mount
  useEffect(() => {
    // Lock the login page unless accessed via System Login
    const allowAccess = sessionStorage.getItem('allow_login_access');
    if (!allowAccess) {
      navigate('/', { replace: true });
      return;
    }

    const user = authService.getUser();
    if (user.token && user.token !== 'null' && user.token !== 'undefined') {
        const subStatus = (user.subscription || 'free').toLowerCase();
        const role = (user.role || '').toLowerCase();
        const isPaid = ['active', 'enterprise', 'pro', 'basic', 'demo'].includes(subStatus) || role === 'demo';
        const isDev = ['developer', 'owner', 'admin'].includes(role);
        
        if (!isPaid && !isDev) {
            setLoginState('denied');
            setTimeout(() => {
                navigate('/subscribe');
            }, 3000);
        }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginState('authenticating');
    setError('');
    setSuccessMsg('');

    try {
      if (isRegister) {
          if (!fullName.trim()) {
            setError('Enter your full name');
            setLoading(false);
            return;
          }
          if (passwordStrength < 60) {
            setError('Use a stronger password');
            setLoading(false);
            return;
          }
          await authService.register(
            username,
            password,
            fullName,
            role,
            {
              email: contactEmail || undefined,
              phone: contactPhone || undefined,
              grade_level: role === 'student' ? gradeLevel : undefined,
              class_name: role === 'student' ? classSection : undefined,
              subject: role === 'teacher' ? subject : undefined,
              child_name: role === 'parent' ? childName : undefined,
              invite_code: role === 'admin' ? inviteCode : undefined,
            }
          );
          setSuccessMsg("Registration Successful! Initializing Login...");

          setTimeout(async () => {
             const data = await authService.login(username, password);
             handleAuthSuccess(data);
             try {
               if (role === 'student') {
                  const student = {
                    id: `s${Date.now()}`,
                    name: fullName,
                    gradeLevel: gradeLevel,
                    gpa: 0,
                    attendance: 100,
                    behaviorScore: 100,
                    notes: `Class: ${classSection} | Email: ${contactEmail} | Phone: ${contactPhone}`,
                    riskLevel: 'Low'
                  };
                  await api.createSelfStudentProfile(student as any);
                  setSuccessMsg("Student profile created successfully.");
               }
             } catch (e: any) {
               setError(e.message || 'Failed to create student profile');
             }
          }, 1500);
      } else {
          const data = await authService.login(username, password);
          handleAuthSuccess(data);
      }
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data: any) => {
      setAuthData(data);
      const store = rememberMe ? localStorage : sessionStorage;
      
      const subStatus = (data.subscription_status || data.subscription || 'free').toLowerCase();
      const role = (data.role || '').toLowerCase();
      
      const isDev = role === 'developer' || role === 'owner' || role === 'admin';
      const isPaid = ['active', 'enterprise', 'pro', 'basic', 'demo'].includes(subStatus) || role === 'demo';
      
      // Store session data
      store.setItem('lumix_token', data.access_token);
      store.setItem('lumix_role', data.role);
      store.setItem('lumix_user', data.name);
      store.setItem('lumix_subscription', isPaid && subStatus === 'free' ? 'demo' : subStatus);

      if (!rememberMe) {
        // Clear persistent storage if not remembering
        localStorage.removeItem('lumix_token');
        localStorage.removeItem('lumix_role');
        localStorage.removeItem('lumix_user');
        localStorage.removeItem('lumix_subscription');
      }
      
      if (isDev || isPaid) {
          setLoginState('granted');
          // Start the polished welcome sequence
          setTimeout(() => {
              setLoginState('welcome');
          }, 1500); // 1.5s for "Access Granted"
          
          setTimeout(() => {
              onLoginSuccess(data.role, data.name);
          }, 4500); // 1.5s granted + 3s welcome
      } else {
          setLoginState('denied');
          setLoading(false);
      }
  };

  const computeStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return Math.min(100, score);
  };

  const handleDemoMode = async () => {
        setLoading(true);
        setLoginState('authenticating');
        try {
            const data = await authService.demoLogin();
            handleAuthSuccess(data);
        } catch (err: any) {
            setError(err.message || "Demo Access Failed");
            setLoading(false);
            setLoginState('idle');
        }
    };

    if (loginState === 'welcome') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-cyan-900/20 animate-pulse" />
                <div className="relative z-10 text-center space-y-8 animate-welcome">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                            <Sparkles size={60} className="text-cyan-400 animate-pulse" />
                        </div>
                        <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
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
        <div className="responsive-container">
            {/* Access Denied Modal */}
            {loginState === 'denied' && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
                    <div className="glass-panel max-w-md w-full p-10 rounded-[2rem] border border-rose-500/30 shadow-[0_0_100px_rgba(244,63,94,0.15)] text-center space-y-8 animate-lock-shake relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                        
                        <div className="w-24 h-24 bg-rose-500/10 rounded-3xl mx-auto flex items-center justify-center border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-float">
                            <Lock size={48} className="text-rose-500" />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white font-sci-fi tracking-widest uppercase">Access Denied</h2>
                            <p className="text-rose-400 text-sm font-mono leading-relaxed font-bold">
                                Get subscription first to execute to the Lumix.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <button 
                                onClick={() => navigate('/subscribe')}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white p-5 rounded-2xl font-bold font-sci-fi tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                            >
                                <Zap size={20} />
                                BUY SUBSCRIPTION
                            </button>
                            <button 
                                onClick={handleDemoMode}
                                className="w-full bg-white/5 hover:bg-white/10 text-white p-5 rounded-2xl font-bold font-sci-fi tracking-[0.2em] transition-all border border-white/10 flex items-center justify-center gap-3 group"
                            >
                                <ScanFace size={20} className="group-hover:text-cyan-400 transition-colors" />
                                TRY DEMO MODE
                            </button>
                            <button 
                                onClick={() => setLoginState('idle')}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors font-mono uppercase tracking-[0.3em] pt-4"
                            >
                                ← Return to System Authentication
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                Identity Verified • Subscription Active
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

            <div className={`glass-panel login-panel rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)] relative z-10 animate-in zoom-in-95 duration-700 ${loginState === 'granted' ? 'opacity-0' : ''}`}>
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white transition-colors"
                title="Back to Home"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
            )}
            <div className="text-center mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-500/10 rounded-2xl mx-auto flex items-center justify-center border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                    {isRegister ? (
                        <UserPlus size={40} className="text-cyan-400 w-8 h-8 md:w-10 md:h-10" />
                    ) : (
                        <ScanFace size={40} className="text-cyan-400 w-8 h-8 md:w-10 md:h-10 animate-pulse" />
                    )}
                </div>
                <h1 className="login-title text-3xl md:text-4xl font-bold text-white font-sci-fi tracking-wide text-glow">LUMIX OS</h1>
                <p className="login-subtitle text-cyan-400/60 font-mono text-[10px] md:text-xs tracking-[0.3em] mt-2">
                    {isRegister ? 'NEW USER REGISTRATION' : 'SECURE ACCESS GATEWAY'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                {isRegister && (
                    <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
                        <label htmlFor="fullName" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Full Designation</label>
                        <input 
                            id="fullName"
                            name="fullName"
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required={isRegister}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 md:p-4 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none text-sm md:text-base"
                            placeholder="John Doe"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label htmlFor="contactEmail" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Contact Email</label>
                            <input 
                              id="contactEmail"
                              name="contactEmail"
                              type="email" 
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                              placeholder="name@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="contactPhone" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Contact Phone</label>
                            <input 
                              id="contactPhone"
                              name="contactPhone"
                              type="tel" 
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                              placeholder="+92 3XX XXXXXXX"
                            />
                          </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="username" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Identity ID</label>
                    <input 
                        id="username"
                        name="username"
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                        placeholder="Enter Username"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Passcode</label>
                    <div className="relative">
                      <input 
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'} 
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setPasswordStrength(computeStrength(e.target.value)); }}
                          required
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                          placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="mt-2 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`${passwordStrength < 40 ? 'bg-rose-500' : passwordStrength < 70 ? 'bg-amber-500' : 'bg-emerald-500'} h-full transition-all`} 
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-cyan-500" />
                        Remember me
                      </label>
                      <button type="button" className="underline decoration-cyan-400/30 hover:text-white" onClick={() => setSuccessMsg('Password reset link sent (demo)')}>Forgot password?</button>
                    </div>
                </div>

                {isRegister && (
                     <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                        <label htmlFor="role" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Clearance Level</label>
                        <select 
                            id="role"
                            name="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="parent">Parent</option>
                            <option value="admin">Admin (Restricted)</option>
                        </select>
                        <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} className="mt-3 text-[10px] text-cyan-400 underline decoration-cyan-400/30">{advancedOpen ? 'Hide advanced details' : 'Show advanced details'}</button>
                        {advancedOpen && role === 'student' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="space-y-2">
                              <label htmlFor="gradeLevel" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Grade Level</label>
                              <select 
                                id="gradeLevel"
                                name="gradeLevel"
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                              >
                                {[...Array(12)].map((_, i) => (
                                  <option key={i} value={i + 1}>Grade {i + 1}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="classSection" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Class/Section</label>
                              <input 
                                id="classSection"
                                name="classSection"
                                type="text"
                                value={classSection}
                                onChange={(e) => setClassSection(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                                placeholder="e.g. 10-B"
                              />
                            </div>
                          </div>
                        )}
                        {advancedOpen && role === 'teacher' && (
                          <div className="space-y-2 mt-3">
                            <label htmlFor="subject" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Subject</label>
                            <input 
                              id="subject"
                              name="subject"
                              type="text"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                              placeholder="e.g. Physics"
                            />
                          </div>
                        )}
                        {advancedOpen && role === 'parent' && (
                          <div className="space-y-2 mt-3">
                            <label htmlFor="childName" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Child Name</label>
                            <input 
                              id="childName"
                              name="childName"
                              type="text"
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                              placeholder="e.g. Ali R."
                            />
                          </div>
                        )}
                        {advancedOpen && role === 'admin' && (
                          <div className="space-y-2 mt-3">
                            <label htmlFor="inviteCode" className="text-xs font-mono text-indigo-300 uppercase tracking-widest ml-1">Admin Invite Code</label>
                            <input 
                              id="inviteCode"
                              name="inviteCode"
                              type="text"
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-cyan-500 outline-none"
                              placeholder="Enter invite code"
                              aria-label="Admin Invite Code"
                            />
                          </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg flex items-center gap-3 text-rose-400 text-xs font-mono animate-pulse">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                
                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-3 text-emerald-400 text-xs font-mono">
                        <ShieldCheck size={16} />
                        {successMsg}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white p-4 rounded-xl font-bold font-sci-fi tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                    {loading ? (
                        <>
                            <ScanFace className="animate-spin" size={20} />
                            {isRegister ? 'REGISTERING...' : 'AUTHENTICATING...'}
                        </>
                    ) : (
                        <>
                            {isRegister ? 'CREATE IDENTITY' : 'INITIALIZE SESSION'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                {!isRegister && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#050018] px-2 text-slate-500 font-mono tracking-widest">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setSuccessMsg('Google Login initialized... (demo simulation)')}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-slate-300 hover:text-white transition-all group"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.16-7.27c1.61 0 3.08.59 4.23 1.57l2.14-2.05C16.66 2.52 14.4 2 12.16 2C6.4 2 2 6.4 2 12s4.4 10 10.16 10c7.1 0 10.64-5.28 9.19-10.9z"/></svg>
                    <span className="font-mono text-xs">Google</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!username.includes('@')) {
                        setError('Please enter a valid email in the Identity ID field.');
                        return;
                      }
                      setLoading(true);
                      try {
                        const res = await authService.emailLogin(username);
                        setSuccessMsg(res.message);
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-slate-300 hover:text-white transition-all group"
                  >
                    <Mail size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="font-mono text-xs">Email</span>
                  </button>
                </div>
                  </>
                )}
            </form>

            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/5 text-center">
                <button 
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="text-xs md:text-sm text-cyan-400 hover:text-white transition-colors font-mono tracking-wide underline decoration-cyan-400/30 underline-offset-4"
                >
                    {isRegister ? 'ALREADY HAVE CLEARANCE? LOGIN' : 'NO ACCESS? REQUEST IDENTITY'}
                </button>
            </div>

            <div className="mt-3 md:mt-4 flex justify-between items-center text-[9px] md:text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-1 md:gap-2">
                    <ShieldCheck size={12} className="text-emerald-500 w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">256-BIT ENCRYPTION ACTIVE</span>
                    <span className="sm:hidden">SECURE</span>
                </div>
                <div>v.3.2.0-LUMIX</div>
            </div>
        </div>
    </div>
  );
};

export default LoginView;

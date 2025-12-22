
import React, { useState } from 'react';
import { Lock, ScanFace, ArrowRight, ShieldCheck, AlertCircle, UserPlus, LogIn, Eye, EyeOff, Info, CheckCircle2, Github, Mail } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem('lumix_token', data.access_token);
      store.setItem('lumix_role', data.role);
      store.setItem('lumix_user', data.name);
      
      const subStatus = (data.subscription_status || 'free').toLowerCase();
      const role = (data.role || '').toLowerCase();
      
      store.setItem('lumix_subscription', subStatus);

      if (!rememberMe) {
        localStorage.removeItem('lumix_token');
        localStorage.removeItem('lumix_role');
        localStorage.removeItem('lumix_user');
        localStorage.removeItem('lumix_subscription');
      }
      
      // Logic: If Developer/Owner/Admin -> Always Allow
      // If Paid (active, enterprise, pro, basic) -> Allow
      // If Free/Demo -> Redirect to Subscribe
      
      const isDev = role === 'developer' || role === 'owner' || role === 'admin';
      const isPaid = ['active', 'enterprise', 'pro', 'basic'].includes(subStatus);
      
      if (isDev || isPaid) {
          setTimeout(() => {
              onLoginSuccess(data.role, data.name);
          }, 500);
      } else {
          // Free user trying to login via System Login -> Redirect to Subscribe
          navigate('/subscribe');
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

  return (
    <div className="responsive-container">
        {/* Background Effects are inherited from body/index.html */}

        <div className="glass-panel login-panel rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)] relative z-10 animate-in zoom-in-95 duration-700">
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

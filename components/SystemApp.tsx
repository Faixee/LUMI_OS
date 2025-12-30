/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import StudentManager from './StudentManager';
import AgentConsole from './AgentConsole';
import AnalyticsView from './AnalyticsDashboard';
import FinanceModule from './FinanceModule';
import AcademicView from './AcademicView';
import TeacherAITools from './TeacherAITools';
import AssignmentsView from './AssignmentsView';
import StudentAITutor from './StudentAITutor';
import ParentAIGuardian from './ParentAIGuardian';
import DataNexus from './DataNexus';
import TransportView from './TransportView';
import LibraryView from './LibraryView';
import SubscriptionView from './SubscriptionView';
import AboutPage from './AboutPage';
import SystemConfig from './SystemConfig';
import GenesisEngine from './GenesisEngine';
import {
  Student, AgentLog, AgentName, Insight, UserRole,
  FeeRecord, SchoolConfig, TransportRoute, LibraryBook
} from '../types';
import {
  MOCK_CLASSES, MOCK_ASSIGNMENTS, MOCK_STUDENTS,
  MOCK_FEES, MOCK_TRANSPORT, MOCK_LIBRARY
} from '../constants';
import { predictStudentOutcome, generateInsights, askSystemAgent } from '../services/geminiService';
import { api } from '../services/api';
import { authService } from '../services/auth';
import { MessageSquare, Send, X, Bot, ChevronDown, LogOut, UserCircle2, RefreshCw, Menu, Shield } from 'lucide-react';

const SystemApp: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [initialRole] = useState<UserRole>(() => (authService.getUser().role as UserRole) || 'admin');
  const [userName, setUserName] = useState('System Admin');
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => authService.getUser().subscription || 'demo');
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accessBlock, setAccessBlock] = useState<{ code?: string } | null>(null);

  // App Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [transport, setTransport] = useState<TransportRoute[]>([]);
  const [library, setLibrary] = useState<LibraryBook[]>([]);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((agent: AgentName, action: string, status: 'success' | 'warning' | 'error' | 'processing', details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      agent,
      action,
      status,
      details
    }]);
  }, []);

  const subscriptionValue = (subscriptionStatus || '').toLowerCase().trim();
  const nonPaidValues = new Set(['', 'demo', 'free', 'visitor', 'expired', 'inactive', 'trial']);
  const userToken = authService.getUser().token;
  const isDemoUser = nonPaidValues.has(subscriptionValue) || userRole === 'demo' || userToken === 'demo_session_token';

  // Authentication & initial user
  useEffect(() => {
    const user = authService.getUser();
    if (user.token && user.role) {
      setIsAuthenticated(true);
      setUserRole(user.role as UserRole);
      setUserName(user.name || 'User');
      setSubscriptionStatus(user.subscription || 'demo');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      if (detail?.type === 'auth' && detail?.status === 401) {
        const isDev = userRole === 'developer';
        authService.logout();
        setIsAuthenticated(false);
        
        if (isDev) {
            // Developers go back to dev login, not standard login
            navigate('/dev', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
        return;
      }

      if (detail?.type === 'paywall' && detail?.status === 403) {
        setAccessBlock({ code: detail?.code });
        setCurrentView('subscription');
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('lumix:access', handler as any);
    return () => window.removeEventListener('lumix:access', handler as any);
  }, [navigate, userRole]);

  useEffect(() => {
    if (!isAuthenticated || isDemoUser) return;
    const syncSubscription = async () => {
      const data = await api.getSubscriptionStatus();
      const status = (data?.status || '').toString();
      if (!status) return;

      setSubscriptionStatus(status);
      const useSessionStore = !!sessionStorage.getItem('lumix_token') && !localStorage.getItem('lumix_token');
      const store = useSessionStore ? sessionStorage : localStorage;
      store.setItem('lumix_subscription', status);
    };
    syncSubscription();
  }, [isAuthenticated]);

  // System Initialization & Data Sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const initSystem = async () => {
      if (isDemoUser) {
          addLog(AgentName.NOVA, "Initializing Demo Mode Environment...", "processing");
          setStudents(MOCK_STUDENTS);
          setFees(MOCK_FEES);
          setTransport(MOCK_TRANSPORT);
          setLibrary(MOCK_LIBRARY);
          addLog(AgentName.LUMIX, "Demo environment loaded successfully.", "success");
          return;
        }

        // Paid users: API fetch
        try {
          const health = await api.checkHealth();
          if (health.status !== 'LumiX Core Online') {
            addLog(AgentName.NOVA, `Core Network Offline [Status: ${health.status}]. System Standby.`, "warning");
            return;
          }
          addLog(AgentName.NOVA, "Secure uplink to Core Server established.", "success");

          // Fetch School Config First
          const config = await api.getSchoolConfig();
          if (config) {
            setSchoolConfig(config);
            addLog(AgentName.NOVA, `Branding Identity [${config.name}] Loaded.`, "success");
          }

          let studentsForInsights: Student[] = [];

        if (userRole === 'student') {
          const [selfStudent, dbTransport, dbLibrary] = await Promise.all([
            api.getSelfStudent(),
            api.getTransport(),
            api.getLibrary(),
          ]);
          if (selfStudent) setStudents([selfStudent]);
          if (dbTransport.length) setTransport(dbTransport);
          if (dbLibrary.length) setLibrary(dbLibrary);
          if (selfStudent) studentsForInsights = [selfStudent];
        } else if (userRole === 'teacher') {
          const [dbStudents, dbTransport, dbLibrary] = await Promise.all([
            api.getStudents(),
            api.getTransport(),
            api.getLibrary(),
          ]);
          if (dbStudents.length) setStudents(dbStudents);
          if (dbTransport.length) setTransport(dbTransport);
          if (dbLibrary.length) setLibrary(dbLibrary);
          studentsForInsights = dbStudents;
        } else if (userRole === 'parent') {
          const [dbFees, dbTransport, dbLibrary] = await Promise.all([
            api.getFees(),
            api.getTransport(),
            api.getLibrary(),
          ]);
          if (dbFees.length) setFees(dbFees);
          if (dbTransport.length) setTransport(dbTransport);
          if (dbLibrary.length) setLibrary(dbLibrary);
        } else {
          const [dbStudents, dbFees, dbTransport, dbLibrary] = await Promise.all([
            api.getStudents(),
            api.getFees(),
            api.getTransport(),
            api.getLibrary(),
          ]);
          if (dbStudents.length) setStudents(dbStudents);
          if (dbFees.length) setFees(dbFees);
          if (dbTransport.length) setTransport(dbTransport);
          if (dbLibrary.length) setLibrary(dbLibrary);
          studentsForInsights = dbStudents;
        }

        addLog(AgentName.LUMIX, "Telemetry sync complete.", "success");

        if (studentsForInsights.length) {
          const newInsights = await generateInsights(studentsForInsights);
          setInsights(newInsights.map(i => ({ ...i, id: Math.random().toString(), agent: AgentName.LUMEN })));
        }
      } catch (err) {
        addLog(AgentName.NOVA, "Database connection failed or empty.", "warning");
      }
    };

    initSystem();
  }, [isAuthenticated, addLog, isDemoUser, userRole]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatOpen]);

  // Logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  // GOD MODE ROLE SWITCHER
  const handleRoleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setUserRole(newRole);
    setCurrentView('dashboard');

    switch (newRole) {
      case 'admin': setUserName('System Admin'); break;
      case 'teacher': setUserName('Sarah J. (Physics)'); break;
      case 'student': setUserName('Ali R. (Grade 10)'); break;
      case 'parent': setUserName('Dr. Ahmed'); break;
      case 'developer': setUserName('Developer Session'); break;
    }
    addLog(AgentName.NOVA, `Identity Override: Switched to ${newRole.toUpperCase()}`, "warning");
  };

  const handleSchoolConfigUpdate = (config: SchoolConfig) => {
    setSchoolConfig(prev => ({
      ...prev,
      ...config,
      modules: config.modules || prev?.modules || { transport: true, library: true, finance: true, nexus: true }
    }));
    addLog(AgentName.NOVA, `System Rebrand: ${config.name}`, "success");
  };

  const handleAddStudent = async (student: Student) => {
    setStudents(prev => [...prev, student]);
    addLog(AgentName.NOVA, `Student ${student.name} added`, "success");
    try { await api.addStudent(student); } catch { }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    addLog(AgentName.NOVA, `Record ${id} deleted`, "warning");
  };

  const runAstraPrediction = async (student: Student) => {
    addLog(AgentName.ASTRA, `Analyzing ${student.name}...`, "processing");
    try {
      const result = await predictStudentOutcome(student);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, riskLevel: result.riskLevel as any, predictedOutcome: result.prediction } : s));
      addLog(AgentName.ASTRA, `Analysis complete`, "success");
    } catch {
      addLog(AgentName.ASTRA, `Analysis failed (AI unavailable)`, "error");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsChatLoading(true);
    try {
      const response = await askSystemAgent(userMsg, students, userRole, schoolConfig);
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch { setChatHistory(prev => [...prev, { role: 'ai', text: "Error accessing neural link." }]); }
    finally { setIsChatLoading(false); }
  };

  // --- Render Content with Paid/Demo logic ---
  const renderContent = () => {
    // Stricter Demo Mode: Only allow dashboard and about
    const allowedDemoViews = ['dashboard', 'about', 'subscription'];
    if (isDemoUser && !allowedDemoViews.includes(currentView)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0B1120] rounded-3xl border border-white/5">
                <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
                    <Shield className="text-amber-500" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Premium Feature Locked</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    You are currently in Demo Mode. Features like Genesis Engine, AI Tutor, and Advanced Analytics are reserved for paid subscribers.
                </p>
                <button 
                    onClick={() => setCurrentView('subscription')}
                    className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
                >
                    UPGRADE TO UNLOCK
                </button>
            </div>
        );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard students={students} insights={insights} userRole={userRole} schoolName={schoolConfig?.name} onNavigate={setCurrentView} />;
      case 'students':
        return <StudentManager students={students} onAddStudent={handleAddStudent} onDeleteStudent={handleDeleteStudent} onRunAstra={runAstraPrediction} logAgentAction={addLog} />;
      case 'agents':
        return <AgentConsole logs={logs} />;
      case 'analytics':
        return <AnalyticsView students={students} />;
      case 'finance':
        return <FinanceModule fees={fees} />;
      case 'genesis':
        return <GenesisEngine />;

      // Paid vs Demo Academics
      case 'academics':
        if (isDemoUser) return <AcademicView classes={MOCK_CLASSES} assignments={MOCK_ASSIGNMENTS} />;
        return <AcademicViewWrapper />;

      case 'assignments':
        if (isDemoUser) return <AssignmentsView assignments={MOCK_ASSIGNMENTS} />;
        return <AssignmentsViewWrapper />;

      case 'assistant':
        return <TeacherAITools />;
      case 'ai-tutor':
        return <StudentAITutor students={students} />;
      case 'ai-guardian':
        return <ParentAIGuardian />;
      case 'nexus':
        return <DataNexus />;
      case 'transport':
        return <TransportView fleet={transport} />;
      case 'library':
        return <LibraryView books={library} />;
      case 'subscription':
        return <SubscriptionView />;
      case 'about':
        return <AboutPage />;
      case 'system-config':
        return <SystemConfig currentConfig={schoolConfig} onUpdateConfig={handleSchoolConfigUpdate} />;
      default:
        return <Dashboard students={students} insights={insights} userRole={userRole} schoolName={schoolConfig?.name} />;
    }
  };

  // Paid User Wrappers for API fetch
  const AcademicViewWrapper: React.FC = () => {
    const [realClasses, setRealClasses] = useState<any[]>([]);
    const [realAssignments, setRealAssignments] = useState<any[]>([]);
    useEffect(() => { (async () => {
      try {
        const classesData = await api.getClasses();
        const assignmentsData = await api.getAssignments();
        setRealClasses(classesData); setRealAssignments(assignmentsData);
      } catch { addLog(AgentName.NOVA, "Failed to fetch academics data", "error"); }
    })(); }, []);
    return <AcademicView classes={realClasses} assignments={realAssignments} />;
  };

  const AssignmentsViewWrapper: React.FC = () => {
    const [realAssignments, setRealAssignments] = useState<any[]>([]);
    useEffect(() => { (async () => {
      try { const data = await api.getAssignments(); setRealAssignments(data); }

      catch { addLog(AgentName.NOVA, "Failed to fetch assignments data", "error"); }
    })(); }, []);
    return <AssignmentsView assignments={realAssignments} />;
  };

  if (!isAuthenticated) return null;

  const cockpitViews = ['genesis', 'assistant', 'agents', 'ai-tutor', 'ai-guardian'];
  const isCockpit = cockpitViews.includes(currentView);

  return (
    <div className="flex bg-[#030014] text-slate-200 h-[100dvh] w-[100vw] relative font-sans overflow-hidden selection:bg-cyan-500/30">
      {isDemoUser && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-md border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-center gap-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-white animate-pulse" />
            <span className="text-[10px] font-bold font-sci-fi tracking-[0.2em] text-white uppercase">DEMO MODE ACTIVE</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <p className="text-[10px] font-mono text-white/90">AI responses are simulated for demonstration purposes. Features may have limited quotas.</p>
          <button 
            onClick={() => setCurrentView('subscription')}
            className="ml-4 px-3 py-0.5 bg-white text-orange-600 rounded-full text-[9px] font-bold font-sci-fi hover:bg-orange-50 transition-colors uppercase tracking-wider"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Background Ambience - Fixed and behind everything */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {accessBlock && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-white font-sci-fi tracking-widest text-lg">ACCESS RESTRICTED</div>
                <div className="text-xs font-mono text-slate-400">
                  {accessBlock.code === 'PLAN_UPGRADE_REQUIRED' ? 'Upgrade your plan to unlock this module.' : 'Activate a plan to unlock the full system.'}
                </div>
              </div>
              <button
                onClick={() => setAccessBlock(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => { setAccessBlock(null); setCurrentView('subscription'); }}
                className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg font-bold font-sci-fi tracking-widest transition-all"
              >
                VIEW PLANS
              </button>
              <button
                onClick={() => setAccessBlock(null)}
                className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold font-mono text-xs tracking-[0.2em] transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={userRole} 
        schoolConfig={schoolConfig} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={handleLogout}
        initialRole={initialRole}
        onRoleSwitch={handleRoleSwitch}
      />

      <main className={`flex-1 relative z-10 transition-all duration-300 flex flex-col ${isCockpit ? 'lg:h-full lg:overflow-hidden overflow-y-auto' : 'h-full overflow-y-auto overscroll-contain'} ${isSidebarOpen ? 'blur-sm md:blur-none' : ''} lg:ml-72 min-w-0 p-4 sm:p-6 lg:p-8 ${isDemoUser ? 'pt-16 sm:pt-20 lg:pt-12' : ''}`}>
        {/* Mobile Header & Controls */}
        <div className="flex lg:hidden items-center justify-between mb-6 shrink-0 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/5 sticky top-0 z-[50]">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 transition-all active:scale-90 touch-manipulation"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-bold text-white font-sci-fi tracking-wider uppercase truncate max-w-[120px]">{userName}</div>
              <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{userRole}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-[#030014] flex items-center justify-center overflow-hidden">
                <UserCircle2 size={20} className="text-white/70" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {renderContent()}
        </div>

        {/* Persistent Footer */}
        <footer className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
          <div>System Created by Faizain Murtuza &copy; {new Date().getFullYear()}</div>
          <div className="flex gap-6">
            <button onClick={() => setCurrentView('about')} className="hover:text-cyan-400 transition-colors">Architecture</button>
            <span className="text-white/10">|</span>
            <span className="text-cyan-400/50">LUMIX CORE V1.0</span>
          </div>
        </footer>
      </main>

      {/* Floating Chat Agent */}
      {/* ... keep your existing chat UI code here ... */}

      {/* Subtle Watermark Branding */}
      <div className="fixed bottom-6 right-24 pointer-events-none opacity-[0.03] select-none z-0 hidden lg:block">
          <div className="text-[60px] font-black font-sci-fi tracking-tighter text-white uppercase">
              MURTUZA_CORE
          </div>
      </div>

      {/* Subtle UI Watermark */}
      <div className="fixed bottom-4 right-4 z-[100] pointer-events-none select-none opacity-10 hover:opacity-30 transition-opacity duration-700">
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-sci-fi tracking-[0.3em] text-white uppercase">LUMIX OS</div>
          <div className="text-[7px] font-mono text-cyan-400 uppercase tracking-widest">Authored by Faizain Murtuza</div>
        </div>
      </div>
    </div>
  );
};

export default SystemApp;

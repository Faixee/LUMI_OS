
import React, { useMemo } from 'react';
import { Student, DashboardMetrics, Insight, UserRole } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Users, BookOpen, Activity, Zap, Shield, Target, Server, Clock, Database, Lock, Unlock, Cpu, Signal, Bus, Library, DollarSign, Brain } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  insights: Insight[];
  userRole: UserRole;
  schoolName?: string;
  onNavigate?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, insights, userRole, schoolName, onNavigate }) => {
  const metrics: DashboardMetrics = useMemo(() => {
    const total = students.length;
    const avgGPA = total > 0 ? students.reduce((acc, s) => acc + (s.gpa || 0), 0) / total : 0;
    const avgAtt = total > 0 ? students.reduce((acc, s) => acc + (s.attendance || 0), 0) / total : 0;
    const atRisk = students.filter(s => s.riskLevel === 'High').length;

    return {
      totalStudents: total,
      averageGPA: parseFloat(avgGPA.toFixed(2)),
      averageAttendance: Math.round(avgAtt),
      atRiskCount: atRisk,
    };
  }, [students]);

  // Data Health Calculation
  const dataHealth = useMemo(() => {
      if (students.length === 0) return { score: 0, missing: [] };
      let hasGPA = 0, hasAtt = 0, hasNotes = 0;
      students.forEach(s => {
          if (s.gpa !== undefined && s.gpa > 0) hasGPA++;
          if (s.attendance !== undefined && s.attendance > 0) hasAtt++;
          if (s.notes) hasNotes++;
      });
      const score = Math.round(((hasGPA + hasAtt + hasNotes) / (students.length * 3)) * 100);
      return { 
          score, 
          hasGPA: hasGPA > students.length * 0.5,
          hasAtt: hasAtt > students.length * 0.5 
      };
  }, [students]);

  const chartData = useMemo(() => {
    return students.map(s => ({
      name: s.name.split(' ')[0],
      gpa: s.gpa || 0,
      attendance: s.attendance || 0,
      xp: s.xp || 0
    })).slice(0, 10);
  }, [students]);

  // Stats Configuration
  const renderStats = () => {
    if (userRole === 'admin' || userRole === 'developer') {
        return [
          { label: 'Active Scholars', value: metrics.totalStudents, icon: Users, color: 'text-indigo-400', borderColor: 'border-indigo-500/50' },
          { label: 'Mean GPA', value: dataHealth.hasGPA ? metrics.averageGPA : 'N/A', icon: Target, color: dataHealth.hasGPA ? 'text-emerald-400' : 'text-slate-600', borderColor: 'border-emerald-500/50' },
          { label: 'Data Density', value: `${dataHealth.score}%`, icon: Database, color: dataHealth.score > 80 ? 'text-cyan-400' : 'text-amber-400', borderColor: 'border-cyan-500/50' },
          { label: 'At Risk', value: dataHealth.hasAtt ? metrics.atRiskCount : '--', icon: AlertTriangle, color: 'text-rose-400', borderColor: 'border-rose-500/50' }
        ];
    }
    return [
        { label: 'Students', value: metrics.totalStudents, icon: Users, color: 'text-purple-400', borderColor: 'border-purple-500/50' },
        { label: 'Avg Attendance', value: `${metrics.averageAttendance}%`, icon: Clock, color: 'text-cyan-400', borderColor: 'border-cyan-500/50' }
    ];
  };

  const stats = renderStats();

  const getModules = () => {
    const common = [];
    if (userRole === 'admin' || userRole === 'developer') {
      return [
        { id: 'students', label: 'Students', icon: Users, color: 'text-indigo-400', desc: 'Manage student records' },
        { id: 'finance', label: 'Finance', icon: DollarSign, color: 'text-emerald-400', desc: 'Financial oversight' },
        { id: 'analytics', label: 'Lumen AI', icon: Activity, color: 'text-cyan-400', desc: 'Predictive analytics' },
        { id: 'nexus', label: 'Nexus Bridge', icon: Database, color: 'text-purple-400', desc: 'Data integration' },
        { id: 'transport', label: 'Transport', icon: Bus, color: 'text-amber-400', desc: 'Fleet management' },
        { id: 'library', label: 'Library', icon: Library, color: 'text-rose-400', desc: 'Resource tracking' },
        { id: 'genesis', label: 'Genesis', icon: Cpu, color: 'text-blue-400', desc: 'Core configuration' },
        { id: 'agents', label: 'Agent Grid', icon: Signal, color: 'text-orange-400', desc: 'System processes' }
      ];
    } else if (userRole === 'teacher') {
      return [
        { id: 'academics', label: 'My Classes', icon: BookOpen, color: 'text-indigo-400', desc: 'Manage your classes' },
        { id: 'students', label: 'Students', icon: Users, color: 'text-purple-400', desc: 'Student performance' },
        { id: 'library', label: 'Library', icon: Library, color: 'text-rose-400', desc: 'Academic resources' },
        { id: 'assistant', label: 'AI Copilot', icon: Zap, color: 'text-cyan-400', desc: 'Teacher AI tools' }
      ];
    } else if (userRole === 'student') {
      return [
        { id: 'ai-tutor', label: 'AI Tutor', icon: Brain, color: 'text-purple-400', desc: 'Personal learning' },
        { id: 'academics', label: 'Schedule', icon: Clock, color: 'text-cyan-400', desc: 'Class timetable' },
        { id: 'assignments', label: 'Tasks', icon: BookOpen, color: 'text-amber-400', desc: 'Assignments' },
        { id: 'library', label: 'Library', icon: Library, color: 'text-rose-400', desc: 'Digital library' }
      ];
    } else if (userRole === 'parent') {
      return [
        { id: 'ai-guardian', label: 'AI Guardian', icon: Shield, color: 'text-indigo-400', desc: 'Student safety' },
        { id: 'students', label: 'Children', icon: Users, color: 'text-purple-400', desc: 'Academic progress' },
        { id: 'finance', label: 'Invoices', icon: DollarSign, color: 'text-emerald-400', desc: 'Fee payments' },
        { id: 'transport', label: 'Transport', icon: Bus, color: 'text-amber-400', desc: 'Bus tracking' }
      ];
    }
    return common;
  };

  const modules = getModules();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-sci-fi tracking-wider text-glow truncate">
            {schoolName || 'LUMIX OS'}
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-mono tracking-[0.2em] uppercase mt-1">
            {userRole.toUpperCase()} COCKPIT
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
            <Signal size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 border border-white/5 px-3 py-1.5 rounded-full">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-300 font-mono">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i}
            className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${stat.borderColor} bg-[#0f172a]/40 backdrop-blur-xl hover:bg-[#0f172a]/60 transition-all duration-500 group relative overflow-hidden`}
          >
            {/* Background Gradient Glow */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-transparent to-${stat.color.split('-')[1]}-500/20 rounded-full blur-3xl group-hover:blur-2xl transition-all`}></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-1 opacity-70 group-hover:opacity-100 transition-opacity">{stat.label}</p>
                <h3 className={`text-4xl md:text-5xl font-bold font-sci-fi text-white drop-shadow-lg tracking-tight mt-2`}>
                    {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                <stat.icon size={24} className={`${stat.color}`} />
              </div>
            </div>
            
            {/* Bottom Tech Bar */}
            <div className="mt-6 flex items-center gap-2">
                <div className="h-1 w-2 bg-white/20 rounded-full"></div>
                <div className="h-1 w-2 bg-white/20 rounded-full"></div>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color.replace('text', 'bg')} w-full shadow-[0_0_10px_currentColor] animate-[shimmer_2s_infinite]`}></div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Modules Grid */}
      <div className="space-y-4">
          <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em]">System Modules</h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {modules.map((mod) => (
                  <button
                      key={mod.id}
                      onClick={() => onNavigate?.(mod.id)}
                      className="group relative p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 flex flex-col items-center text-center gap-3 overflow-hidden"
                  >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-all duration-500 ${mod.color}`}>
                          <mod.icon size={20} />
                      </div>
                      
                      <div>
                          <div className="text-xs font-bold text-white font-sci-fi tracking-wider group-hover:text-cyan-400 transition-colors uppercase">{mod.label}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                              {mod.desc}
                          </div>
                      </div>
                      
                      {/* Animated Corner */}
                      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                          <div className="absolute top-2 right-2 w-1 h-1 bg-white/20 rounded-full group-hover:bg-cyan-500 transition-colors"></div>
                      </div>
                  </button>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-0 rounded-2xl flex flex-col relative tech-border min-h-[400px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Activity size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-sci-fi tracking-wide">
                            {dataHealth.hasGPA ? "ACADEMIC VELOCITY" : "DATA INGESTION REQUIRED"}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Performance Vector Analysis</p>
                    </div>
                </div>
                {dataHealth.hasGPA && (
                    <div className="flex gap-4 text-[10px] font-mono text-slate-400 hidden sm:flex">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> GPA</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> XP</span>
                    </div>
                )}
            </div>
            
            <div className="flex-1 w-full p-4 relative h-[300px]">
                {dataHealth.hasGPA ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                            <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#64748b" tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#64748b'}} axisLine={false} tickLine={false} dx={-10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(10, 10, 25, 0.9)', border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} 
                                itemStyle={{ color: '#fff', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                                labelStyle={{ color: '#00f3ff', marginBottom: '5px', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="gpa" stroke="#00f3ff" strokeWidth={3} fillOpacity={1} fill="url(#neonGradient)" animationDuration={2000} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                         <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
                            <AlertTriangle size={48} className="text-amber-500 mb-4 animate-bounce relative z-10" />
                         </div>
                         <h4 className="text-2xl font-bold text-white font-sci-fi tracking-widest">PARTIAL DATA DETECTED</h4>
                         <p className="text-slate-400 text-sm max-w-md mt-2 font-mono">
                             Academic vectors hidden. Please initiate academic record upload via Nexus Bridge.
                         </p>
                         <button className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                             + INITIATE UPLOAD PROTOCOL
                         </button>
                    </div>
                )}
            </div>
        </div>

        {/* System Capability Monitor */}
        <div className="holo-card p-6 flex flex-col relative overflow-hidden h-full">
            <h3 className="text-lg font-bold text-white font-sci-fi mb-6 flex items-center gap-2 relative z-10">
                <Shield size={20} className="text-purple-400" />
                SYSTEM CAPABILITIES
            </h3>

            <div className="space-y-4 relative z-10 flex-1">
                {[
                    { label: 'Identity Core', count: metrics.totalStudents, active: true, icon: Users, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                    { label: 'Astra Predictions', status: dataHealth.hasGPA ? 'ACTIVE' : 'OFFLINE', active: dataHealth.hasGPA, icon: Target, color: 'text-indigo-400', border: 'border-indigo-500/30' },
                    { label: 'Risk Engine', status: dataHealth.hasAtt ? 'MONITORING' : 'STANDBY', active: dataHealth.hasAtt, icon: AlertTriangle, color: 'text-rose-400', border: 'border-rose-500/30' }
                ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:bg-white/5 ${item.active ? 'bg-black/20 ' + item.border : 'bg-white/5 border-white/5 opacity-50'}`}>
                        <div className="flex items-center gap-3">
                            <item.icon size={16} className={item.active ? item.color : "text-slate-500"} />
                            <div>
                                <div className="text-sm font-bold text-white">{item.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                                    {item.count ? `${item.count} RECORDS` : item.status}
                                </div>
                            </div>
                        </div>
                        {item.active ? <Unlock size={14} className={item.color} /> : <Lock size={14} className="text-slate-600" />}
                    </div>
                ))}
            </div>
            
            <div className="mt-auto pt-6">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-2 uppercase">
                    <span>Data Integrity</span>
                    <span className="text-cyan-400">{dataHealth.score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-1000 shadow-[0_0_10px_#06b6d4]" style={{ width: `${dataHealth.score}%` }}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

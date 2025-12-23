
import React from 'react';
import { LayoutDashboard, Users, Activity, Cpu, Radio, School, DollarSign, BookOpen, GraduationCap, Calendar, Bell, Database, Bus, Library, Settings, Brain, Shield, X } from 'lucide-react';
import { UserRole, SchoolConfig } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  schoolConfig?: SchoolConfig | null;
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, schoolConfig, isOpen, onClose, isDemo }) => {
  
  const getMenuItems = () => {
    let items = [];
    const common = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    if (userRole === 'admin' || userRole === 'developer') {
        items = [
            ...common,
            { id: 'students', label: 'Students', icon: <Users size={20} /> },
            { id: 'genesis', label: 'Genesis Engine', icon: <Cpu size={20} /> },
            { id: 'finance', label: 'Finance', icon: <DollarSign size={20} /> },
            { id: 'analytics', label: 'Lumen AI', icon: <Activity size={20} /> },
            { id: 'nexus', label: 'Nexus Bridge', icon: <Database size={20} /> },
            { id: 'transport', label: 'Transport', icon: <Bus size={20} /> },
            { id: 'library', label: 'Library', icon: <Library size={20} /> },
            { id: 'agents', label: 'Agent Grid', icon: <Cpu size={20} /> },
            { id: 'subscription', label: 'Subscription', icon: <DollarSign size={20} /> },
            { id: 'system-config', label: 'System Config', icon: <Settings size={20} /> },
        ];
    } else if (userRole === 'teacher') {
        items = [
            ...common,
            { id: 'academics', label: 'My Classes', icon: <BookOpen size={20} /> },
            { id: 'genesis', label: 'Genesis Engine', icon: <Cpu size={20} /> },
            { id: 'students', label: 'Students', icon: <Users size={20} /> },
            { id: 'library', label: 'Library', icon: <Library size={20} /> },
            { id: 'assistant', label: 'AI Copilot', icon: <Cpu size={20} /> },
        ];
    } else if (userRole === 'student') {
        items = [
            ...common,
            { id: 'ai-tutor', label: 'AI Tutor', icon: <Brain size={20} /> },
            { id: 'academics', label: 'My Schedule', icon: <Calendar size={20} /> },
            { id: 'assignments', label: 'Assignments', icon: <BookOpen size={20} /> }, 
            { id: 'library', label: 'Library', icon: <Library size={20} /> },
            { id: 'finance', label: 'Fee Status', icon: <DollarSign size={20} /> },
        ];
    } else if (userRole === 'parent') {
        items = [
            ...common,
            { id: 'ai-guardian', label: 'AI Guardian', icon: <Shield size={20} /> },
            { id: 'students', label: 'My Children', icon: <Users size={20} /> },
            { id: 'finance', label: 'Invoices', icon: <DollarSign size={20} /> },
            { id: 'transport', label: 'Transport', icon: <Bus size={20} /> },
            { id: 'dashboard', label: 'Notices', icon: <Bell size={20} /> },
        ];
    } else {
        items = common;
    }

    // Restrict based on school configuration modules
    if (schoolConfig?.modules) {
        const moduleMapping: Record<string, keyof typeof schoolConfig.modules> = {
            'transport': 'transport',
            'library': 'library',
            'finance': 'finance',
            'nexus': 'nexus'
        };

        items = items.filter(item => {
            const moduleKey = moduleMapping[item.id];
            if (moduleKey) {
                return schoolConfig.modules[moduleKey] !== false;
            }
            return true;
        });
    }

    // Restrict premium/admin features in Demo Mode
    if (isDemo) {
        const restrictedIds = ['genesis', 'nexus', 'agents', 'system-config', 'analytics'];
        return items.filter(item => !restrictedIds.includes(item.id));
    }

    return items;
  };

  const menuItems = getMenuItems();

  const brandName = schoolConfig?.isConfigured ? schoolConfig.name : 'LUMIX';
  const brandMotto = schoolConfig?.isConfigured ? schoolConfig.motto : 'OS MODE';
  const brandColor = schoolConfig?.isConfigured ? schoolConfig.primaryColor : '#06b6d4'; // Default Cyan

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed z-50 flex flex-col transition-all duration-300 
        backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black/80
        
        /* Mobile: Full height slide-in drawer */
        top-0 left-0 h-full w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        
        /* Desktop: Floating card style */
        md:translate-x-0 md:top-4 md:left-4 md:h-[calc(100vh-2rem)] md:w-64 md:rounded-3xl md:border-white/10
      `}>
        
        {/* Sidebar Header with Glow */}
        <div className="p-6 relative overflow-hidden group shrink-0">
          <div className="absolute top-0 left-0 w-full h-1/2 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${brandColor}, transparent 70%)` }}></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative group/logo">
                <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all duration-500 shadow-lg ${isDemo ? 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20' : 'border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                    style={!isDemo ? { 
                        backgroundColor: `${brandColor}22`, 
                        color: brandColor,
                        borderColor: `${brandColor}44`,
                        boxShadow: `0 0 15px ${brandColor}33`
                    } : { color: '#f59e0b' }}
                >
                   {isDemo ? (
                     <Shield size={24} />
                   ) : schoolConfig?.logoUrl ? (
                     <img src={schoolConfig.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                   ) : userRole === 'student' ? (
                     <GraduationCap size={24} />
                   ) : (
                     <School size={24} />
                   )}
                </div>
                {/* Logo Glow */}
                <div className={`absolute -inset-2 rounded-full blur-xl opacity-0 group-hover/logo:opacity-40 transition-opacity duration-700 ${isDemo ? 'bg-amber-500' : ''}`} style={!isDemo ? { backgroundColor: brandColor } : {}} />
                {/* Online Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-black rounded-full animate-pulse shadow-[0_0_10px_#10b981] ${isDemo ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500'}`}></div>
              </div>
              
              <div className="overflow-hidden">
                 <h1 className={`text-xl font-bold tracking-tight font-sci-fi transition-colors duration-500 truncate max-w-[140px] ${isDemo ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}>
                     {brandName}
                 </h1>
                 <p className={`text-[9px] tracking-[0.2em] uppercase font-mono truncate max-w-[140px] opacity-70 ${isDemo ? 'text-amber-500/80' : 'text-slate-400'}`}>
                    {isDemo ? 'DEMO ENVIRONMENT' : (userRole === 'admin' && !schoolConfig?.isConfigured ? 'GOD MODE' : brandMotto)}
                 </p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, idx) => {
              const isActive = currentView === item.id;
              return (
                  <button
                      key={`${item.id}-${idx}`}
                      onClick={() => { onChangeView(item.id); onClose(); }}
                      className={`group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive
                          ? 'bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] translate-x-1'
                          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 hover:translate-x-1'
                      }`}
                  >
                      {isActive && (
                          <>
                              <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: brandColor }}></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
                          </>
                      )}
                      
                      <div 
                          className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_currentColor]' : 'group-hover:text-cyan-200'}`}
                          style={{ color: isActive ? brandColor : undefined }}
                      >
                          {item.icon}
                      </div>
                      
                      <span className={`font-medium relative z-10 tracking-wide font-sci-fi text-sm transition-colors ${
                          isActive ? 'text-white font-bold tracking-widest' : ''
                      }`}>
                          {item.label}
                      </span>
                  </button>
              )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 text-cyan-500/80 text-[10px] font-mono bg-cyan-950/20 border border-cyan-500/20 p-2 rounded-lg">
            <Radio size={12} className="animate-pulse" />
            <span className="tracking-widest flex-1">NET: SECURE</span>
            <span className="opacity-50">50ms</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

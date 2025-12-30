/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';
import { Terminal, Circle, CheckCircle2, AlertTriangle, Loader2, XCircle, Code2 } from 'lucide-react';

interface AgentConsoleProps {
  logs: AgentLog[];
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'error': return <XCircle size={14} className="text-rose-500" />;
      case 'processing': return <Loader2 size={14} className="text-indigo-400 animate-spin" />;
      default: return <Circle size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
       <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <Code2 size={24} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-sci-fi text-glow">NEURAL LINK</h2>
            <p className="text-cyan-400/60 font-mono text-xs">REAL-TIME AGENT TELEMETRY STREAM</p>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0a12] border border-indigo-500/20 rounded-xl p-0 font-mono text-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
          
          <div className="flex items-center gap-2 bg-[#12121a] p-3 border-b border-white/5 text-xs text-slate-500 select-none">
            <div className="flex gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            <Terminal size={14} />
            <span>root@lumix-os:~# tail -f /var/log/neural_net</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar p-4 relative z-0" ref={scrollRef}>
            {logs.length === 0 && (
              <div className="text-slate-600 italic opacity-50">System initialized. Waiting for agent activity...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-4 duration-200 hover:bg-white/5 p-1 rounded">
                 <span className="text-slate-600 shrink-0 text-[10px] mt-0.5">[{log.timestamp.toLocaleTimeString()}]</span>
                 <div className="shrink-0 w-24 font-bold uppercase tracking-wider text-xs mt-0.5" style={{
                   color: log.agent === 'Astra' ? '#818cf8' : 
                          log.agent === 'Lexi' ? '#f472b6' : 
                          log.agent === 'Lumen' ? '#34d399' : 
                          log.agent === 'LumiX Assistant' ? '#fbbf24' : '#94a3b8',
                   textShadow: `0 0 5px ${
                          log.agent === 'Astra' ? '#818cf8' : 
                          log.agent === 'Lexi' ? '#f472b6' : 
                          log.agent === 'Lumen' ? '#34d399' : 
                          log.agent === 'LumiX Assistant' ? '#fbbf24' : '#94a3b8'
                   }40`
                 }}>
                   {log.agent}
                 </div>
                 <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                 <div className="text-slate-300 flex-1 break-all">
                   <span className="opacity-90">{log.action}</span>
                   {log.details && (
                     <div className="text-slate-500 mt-1 text-xs border-l border-slate-700 pl-2 font-mono opacity-70">
                       {`>> ${log.details}`}
                     </div>
                   )}
                 </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default AgentConsole;

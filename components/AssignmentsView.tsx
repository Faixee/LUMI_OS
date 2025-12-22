import React, { useMemo, useState } from 'react';
import { Assignment } from '../types';
import { BookOpen, CalendarClock, Search, CheckCircle2, AlertTriangle, Upload, Clock, FolderOpen } from 'lucide-react';

interface AssignmentsViewProps {
  assignments: Assignment[];
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return assignments.filter(a => a.title.toLowerCase().includes(q));
  }, [assignments, query]);

  const dueStatus = (due: string) => {
    const d = new Date(due);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Overdue', color: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/30' };
    if (diff <= 3) return { label: `${diff}d left`, color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30' };
    return { label: `${diff}d left`, color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
            <BookOpen size={22} className="text-cyan-400" />
            ASSIGNMENTS
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono">Manage tasks, due dates, and submissions</p>
        </div>
        <div className="glass-panel p-2 rounded-xl border border-white/10 w-full md:w-96">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assignments"
              className="w-full bg-transparent border-none pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-0 rounded-2xl tech-border overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-indigo-400" />
              <span className="text-xs font-mono text-slate-400">Assignment Queue</span>
            </div>
            <button className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-2">
              <Upload size={14} />
              BULK IMPORT
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.map(a => {
              const s = Math.min(100, Math.round((a.submissions / Math.max(a.total, 1)) * 100));
              const ds = dueStatus(a.dueDate);
              return (
                <div key={a.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <FolderOpen size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-white font-bold font-sci-fi">{a.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Class: {a.classId}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${ds.badge}`}>{ds.label}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Due Date</div>
                      <div className="flex items-center gap-2 text-white font-sci-fi"><Clock size={14} className="text-indigo-400" />{new Date(a.dueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Submissions</div>
                      <div className="text-white font-sci-fi">{a.submissions}/{a.total}</div>
                      <div className="h-2 bg-white/10 rounded mt-2 overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${s}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Actions</div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono flex items-center gap-1">
                          <CheckCircle2 size={14} /> MARK SUBMITTED
                        </button>
                        <button className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono flex items-center gap-1">
                          <AlertTriangle size={14} /> REMIND
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-mono">NO ASSIGNMENTS FOUND</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white font-sci-fi mb-4 flex items-center gap-2">
            <CalendarClock size={20} className="text-amber-400" />
            QUICK CREATE
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-2">
              <BookOpen size={14} className="text-indigo-400" /> New Essay
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-2">
              <BookOpen size={14} className="text-indigo-400" /> Weekly Quiz
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-2">
              <BookOpen size={14} className="text-indigo-400" /> Lab Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsView;

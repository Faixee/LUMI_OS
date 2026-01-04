/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useMemo, useState } from 'react';
import { Assignment } from '../types';
import { BookOpen, CalendarClock, Search, CheckCircle2, AlertTriangle, Upload, Clock, FolderOpen, ScanLine } from 'lucide-react';
import AIGrader from './AIGrader';

interface AssignmentsViewProps {
  assignments: Assignment[];
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments }) => {
  const [query, setQuery] = useState('');
  const [showGrader, setShowGrader] = useState(false);
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
            <BookOpen size={22} className="text-cyan-400" />
            ASSIGNMENTS
          </h2>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-mono tracking-widest uppercase opacity-70">Manage tasks, due dates, and submissions</p>
        </div>
        <div className="p-2 rounded-2xl border border-white/5 bg-white/5 w-full lg:w-96">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assignments"
              className="w-full bg-transparent border-none pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none font-sans"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        <div className="xl:col-span-2 rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-indigo-400" />
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest">Assignment Queue</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowGrader(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 flex items-center gap-2 transition-all active:scale-95 touch-manipulation">
                <ScanLine size={14} />
                AI GRADER
              </button>
              <button className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-2 transition-colors active:scale-95 touch-manipulation">
                <Upload size={14} />
                BULK IMPORT
              </button>
            </div>
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

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Due Date</div>
                      <div className="flex items-center gap-2 text-white font-sci-fi text-sm"><Clock size={14} className="text-indigo-400" />{new Date(a.dueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Submissions</div>
                      <div className="text-white font-sci-fi text-sm">{a.submissions} <span className="text-slate-500 text-[10px]">/ {a.total}</span></div>
                      <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${s}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Actions</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="flex-1 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation border border-emerald-500/20">
                          <CheckCircle2 size={14} /> SUBMIT
                        </button>
                        <button className="flex-1 px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation border border-amber-500/20">
                          <AlertTriangle size={14} /> REMIND
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-slate-600 font-mono text-xs tracking-widest uppercase">No assignments detected in current sector</div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 h-fit">
          <h3 className="text-xl font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
            <CalendarClock size={20} className="text-amber-400" />
            QUICK CREATE
          </h3>
          <div className="space-y-3">
            {[
              { label: 'New Essay', icon: BookOpen },
              { label: 'Weekly Quiz', icon: BookOpen },
              { label: 'Lab Report', icon: BookOpen }
            ].map((item, i) => (
              <button key={i} className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs text-slate-300 flex items-center justify-between group transition-all active:scale-[0.98] touch-manipulation">
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
      {showGrader && <AIGrader onClose={() => setShowGrader(false)} />}
                  <span className="font-mono tracking-wider">{item.label}</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={12} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsView;

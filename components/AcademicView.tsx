/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React from 'react';
import { ClassSession, Assignment } from '../types';
import { Clock, MapPin, Users, BookOpen, CheckSquare, PlusCircle } from 'lucide-react';

interface AcademicViewProps {
  classes: ClassSession[];
  assignments: Assignment[];
}

const AcademicView: React.FC<AcademicViewProps> = ({ classes, assignments }) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi text-glow tracking-wider">ACADEMIC OVERSIGHT</h2>
            <p className="text-purple-400/70 font-mono text-[10px] sm:text-xs mt-1 tracking-[0.2em] uppercase">CLASS SCHEDULE • ATTENDANCE • ASSIGNMENTS</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* Class Schedule */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white font-sci-fi flex items-center gap-2">
                        <Clock size={20} className="text-cyan-400" />
                        TODAY'S SESSIONS
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                    {classes.map((cls) => (
                        <div key={cls.id} className="p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-purple-500/30 transition-all hover:translate-x-1 group relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">{cls.name}</h4>
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-slate-400 font-mono">
                                        <span className="flex items-center gap-1 shrink-0"><MapPin size={12} /> {cls.room}</span>
                                        <span className="flex items-center gap-1 shrink-0"><Users size={12} /> {cls.students} Students</span>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                    <div className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-mono border border-purple-500/20 whitespace-nowrap">
                                        {cls.schedule}
                                    </div>
                                    <button className="text-[9px] sm:text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-mono uppercase tracking-widest active:scale-95 touch-manipulation shrink-0">MARK ATTENDANCE</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No sessions scheduled</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignments & Tasks */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white font-sci-fi flex items-center gap-2">
                        <CheckSquare size={20} className="text-emerald-400" />
                        ACTIVE ASSIGNMENTS
                    </h3>
                    <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition-all active:scale-90 touch-manipulation">
                        <PlusCircle size={18} />
                    </button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5 divide-y divide-white/5">
                    {assignments.map((asm) => (
                        <div key={asm.id} className="p-4 sm:p-5 hover:bg-white/5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h4 className="text-sm sm:text-base font-bold text-slate-200 truncate">{asm.title}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1">Due: {asm.dueDate}</p>
                            </div>
                            <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                    {asm.submissions} / {asm.total} SUBMITTED
                                </div>
                                <div className="w-full sm:w-32 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                                        style={{ width: `${(asm.submissions / asm.total) * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No active assignments</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AcademicView;
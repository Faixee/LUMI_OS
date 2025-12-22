import React from 'react';
import { ClassSession, Assignment } from '../types';
import { Clock, MapPin, Users, BookOpen, CheckSquare, PlusCircle } from 'lucide-react';

interface AcademicViewProps {
  classes: ClassSession[];
  assignments: Assignment[];
}

const AcademicView: React.FC<AcademicViewProps> = ({ classes, assignments }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div>
            <h2 className="text-3xl font-bold text-white font-sci-fi text-glow">ACADEMIC OVERSIGHT</h2>
            <p className="text-purple-400/70 font-mono text-xs mt-1">CLASS SCHEDULE • ATTENDANCE • ASSIGNMENTS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class Schedule */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-white font-sci-fi flex items-center gap-2">
                        <Clock size={20} className="text-cyan-400" />
                        TODAY'S SESSIONS
                    </h3>
                </div>
                <div className="space-y-4">
                    {classes.map((cls) => (
                        <div key={cls.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:translate-x-1 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{cls.name}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {cls.room}</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {cls.students} Students</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-lg text-xs font-bold font-mono border border-purple-500/20">
                                        {cls.schedule}
                                    </div>
                                    <button className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2">MARK ATTENDANCE</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Assignments & Tasks */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-white font-sci-fi flex items-center gap-2">
                        <CheckSquare size={20} className="text-emerald-400" />
                        ACTIVE ASSIGNMENTS
                    </h3>
                    <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors">
                        <PlusCircle size={18} />
                    </button>
                </div>
                <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                    {assignments.map((asm) => (
                        <div key={asm.id} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-200">{asm.title}</h4>
                                <p className="text-xs text-slate-500 font-mono mt-1">Due: {asm.dueDate}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-emerald-400 mb-1">
                                    {asm.submissions} / {asm.total} SUBMITTED
                                </div>
                                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000" 
                                        style={{ width: `${(asm.submissions / asm.total) * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AcademicView;
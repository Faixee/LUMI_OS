import React from 'react';
import { X, GraduationCap, Users, User, ShieldCheck } from 'lucide-react';

type DemoSelectorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectRole: (role: string) => void;
};

const DemoSelectorModal: React.FC<DemoSelectorModalProps> = ({ isOpen, onClose, onSelectRole }) => {
    if (!isOpen) return null;

    const roles = [
        {
            id: 'admin',
            title: 'ADMIN PORTAL',
            description: 'Full school management, analytics, and system controls.',
            icon: ShieldCheck,
            color: 'text-indigo-400',
            borderColor: 'border-indigo-500/30',
            hoverBg: 'hover:bg-indigo-500/10'
        },
        {
            id: 'teacher',
            title: 'TEACHER PORTAL',
            description: 'Classroom management, AI tools, and student tracking.',
            icon: GraduationCap,
            color: 'text-cyan-400',
            borderColor: 'border-cyan-500/30',
            hoverBg: 'hover:bg-cyan-500/10'
        },
        {
            id: 'student',
            title: 'STUDENT PORTAL',
            description: 'Personalized learning, AI tutor, and progress dashboard.',
            icon: User,
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/30',
            hoverBg: 'hover:bg-emerald-500/10'
        },
        {
            id: 'parent',
            title: 'PARENT PORTAL',
            description: 'Child performance monitoring and school communication.',
            icon: Users,
            color: 'text-amber-400',
            borderColor: 'border-amber-500/30',
            hoverBg: 'hover:bg-amber-500/10'
        }
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <div className="w-full max-w-2xl bg-[#050018]/95 border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] p-8 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
                    <div>
                        <div className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase mb-2">Simulation Environment</div>
                        <h2 className="text-3xl font-bold text-white font-sci-fi tracking-tight">SELECT DEMO PORTAL</h2>
                        <p className="text-slate-400 mt-2 text-sm max-w-md">
                            Choose a specialized interface to experience how LumiX OS empowers different users in the education ecosystem.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => onSelectRole(role.id)}
                            className={`flex flex-col items-start p-5 rounded-xl border ${role.borderColor} bg-white/5 ${role.hoverBg} transition-all duration-300 text-left group`}
                        >
                            <div className={`p-3 rounded-lg bg-black/40 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <role.icon size={24} className={role.color} />
                            </div>
                            <h3 className="text-white font-bold tracking-wider font-mono text-sm mb-1">{role.title}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                                {role.description}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        Node: Simulation-Alpha-01
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">System Ready</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoSelectorModal;

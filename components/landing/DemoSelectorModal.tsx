import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Users, User, ShieldCheck, Zap, Terminal, ArrowLeft, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

type DashboardType = 'development' | 'paid';

type DemoSelectorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectRole: (role: string, type: DashboardType) => void;
};

const DemoSelectorModal: React.FC<DemoSelectorModalProps> = ({ isOpen, onClose, onSelectRole }) => {
    const [step, setStep] = useState<'role' | 'type'>('role');
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('role');
            setSelectedRole(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const roles = [
        {
            id: 'admin',
            title: 'ADMIN PORTAL',
            description: 'Full school management, analytics, and system controls.',
            icon: ShieldCheck,
            color: 'text-indigo-400',
            borderColor: 'border-indigo-500/30',
            hoverBg: 'hover:bg-indigo-500/10',
            glowColor: 'shadow-indigo-500/20'
        },
        {
            id: 'teacher',
            title: 'TEACHER PORTAL',
            description: 'Classroom management, AI tools, and student tracking.',
            icon: GraduationCap,
            color: 'text-cyan-400',
            borderColor: 'border-cyan-500/30',
            hoverBg: 'hover:bg-cyan-500/10',
            glowColor: 'shadow-cyan-500/20'
        },
        {
            id: 'student',
            title: 'STUDENT PORTAL',
            description: 'Personalized learning, AI tutor, and progress dashboard.',
            icon: User,
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/30',
            hoverBg: 'hover:bg-emerald-500/10',
            glowColor: 'shadow-emerald-500/20'
        },
        {
            id: 'parent',
            title: 'PARENT PORTAL',
            description: 'Child performance monitoring and school communication.',
            icon: Users,
            color: 'text-amber-400',
            borderColor: 'border-amber-500/30',
            hoverBg: 'hover:bg-amber-500/10',
            glowColor: 'shadow-amber-500/20'
        }
    ];

    const handleRoleSelect = (role: any) => {
        setSelectedRole(role);
        setStep('type');
    };

    const handleFinalSelection = (type: DashboardType) => {
        try {
            if (!selectedRole) throw new Error("No role selected");
            onSelectRole(selectedRole.id, type);
        } catch (err) {
            setError("Failed to initialize session. Please try again.");
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="w-full max-w-2xl bg-[#050018]/95 border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] p-6 md:p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        {step === 'type' && (
                            <button 
                                onClick={() => setStep('role')}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                                aria-label="Go back to role selection"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <div className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase mb-2">
                                {step === 'role' ? 'Step 1: Identity Selection' : 'Step 2: Environment Config'}
                            </div>
                            <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-white font-sci-fi tracking-tight uppercase">
                                {step === 'role' ? 'SELECT PORTAL' : `CONFIGURING ${selectedRole?.title}`}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all group"
                        aria-label="Close modal"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {step === 'role' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleRoleSelect(role)}
                                className={`flex flex-col items-start p-5 rounded-xl border ${role.borderColor} bg-white/5 ${role.hoverBg} transition-all duration-300 text-left group relative overflow-hidden`}
                                aria-label={`Select ${role.title}`}
                            >
                                <div className={`p-3 rounded-lg bg-black/40 mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-lg ${role.glowColor}`}>
                                    <role.icon size={24} className={role.color} />
                                </div>
                                <h3 className="text-white font-bold tracking-wider font-mono text-sm mb-1 relative z-10 uppercase">{role.title}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed group-hover:text-slate-300 transition-colors relative z-10">
                                    {role.description}
                                </p>
                                
                                {/* Hover Effect Background */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-transparent to-${role.color.split('-')[1]}-500/5`} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Development Dashboard Option */}
                        <button
                            onClick={() => handleFinalSelection('development')}
                            className="flex flex-col items-center p-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 group relative overflow-hidden"
                            aria-label="Select Development Dashboard"
                        >
                            <div className="absolute top-0 right-0 p-2">
                                <div className="text-[8px] font-mono text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-widest">Sandbox</div>
                            </div>
                            
                            <div className="p-4 rounded-2xl bg-black/40 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <Terminal size={40} className="text-amber-400" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-white font-sci-fi tracking-widest mb-3 uppercase">Development</h3>
                            <p className="text-slate-400 text-xs text-center leading-relaxed mb-6">
                                Unrestricted testing environment with mock data and full system access.
                            </p>
                            
                            <ul className="space-y-2 w-full">
                                {[
                                    'Simulated Database',
                                    'Edge Case Testing',
                                    'Mock AI Responses',
                                    'System Logs View'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                        <CheckCircle2 size={12} className="text-amber-500" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </button>

                        {/* Paid Dashboard Option */}
                        <button
                            onClick={() => handleFinalSelection('paid')}
                            className="flex flex-col items-center p-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all duration-300 group relative overflow-hidden"
                            aria-label="Select Paid Dashboard"
                        >
                            <div className="absolute top-0 right-0 p-2">
                                <div className="text-[8px] font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded uppercase tracking-widest">Premium</div>
                            </div>

                            <div className="p-4 rounded-2xl bg-black/40 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                <Sparkles size={40} className="text-cyan-400" />
                            </div>

                            <h3 className="text-xl font-bold text-white font-sci-fi tracking-widest mb-3 uppercase">Production</h3>
                            <p className="text-slate-400 text-xs text-center leading-relaxed mb-6">
                                Real-world performance metrics, advanced AI, and institution management.
                            </p>

                            <ul className="space-y-2 w-full">
                                {[
                                    'Live Neural Insights',
                                    'Full AI Agent Grid',
                                    'Financial Intelligence',
                                    'Enterprise Security'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                        <CheckCircle2 size={12} className="text-cyan-400" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        Node: {step === 'role' ? 'Identification-Grid' : 'Environment-Deployer'}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">System Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoSelectorModal;

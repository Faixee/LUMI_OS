import React from 'react';
import { X, Shield, Activity, FileText, Cpu, Globe, Zap, Server, Database, CheckCircle2 } from 'lucide-react';

type ModalType = 'privacy' | 'status' | 'license' | null;

interface FooterModalProps {
    isOpen: boolean;
    type: ModalType;
    onClose: () => void;
}

const FooterModal: React.FC<FooterModalProps> = ({ isOpen, type, onClose }) => {
    if (!isOpen || !type) return null;

    const renderContent = () => {
        switch (type) {
            case 'privacy':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-cyan-400 mb-4">
                            <Shield size={24} />
                            <h2 className="text-xl font-bold font-sci-fi tracking-widest">PRIVACY PROTOCOL</h2>
                        </div>
                        <div className="space-y-4 text-sm text-slate-300 font-mono leading-relaxed">
                            <p>
                                <span className="text-cyan-500">[01] NEURAL ENCRYPTION:</span> All cognitive data processed via LumiX OS is protected by 1024-bit quantum-resistant encryption.
                            </p>
                            <p>
                                <span className="text-cyan-500">[02] ZERO-KNOWLEDGE PROOFS:</span> Our architecture ensures that even LumiX Intelligence Systems cannot access raw neural patterns.
                            </p>
                            <p>
                                <span className="text-cyan-500">[03] DATA SOVEREIGNTY:</span> All institutional data remains local to your node's sovereign boundaries unless explicitly bridged.
                            </p>
                            <p>
                                <span className="text-cyan-500">[04] BIOMETRIC HASHING:</span> Identity verification uses irreversible biometric hashes, never storing actual biological signatures.
                            </p>
                        </div>
                    </div>
                );
            case 'status':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-400 mb-4">
                            <Activity size={24} />
                            <h2 className="text-xl font-bold font-sci-fi tracking-widest">SYSTEM STATUS</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'CORE LOAD', value: '12%', icon: Cpu, color: 'text-cyan-400' },
                                { label: 'LATENCY', value: '24ms', icon: Activity, color: 'text-emerald-400' },
                                { label: 'ACTIVE NODES', value: '45', icon: Globe, color: 'text-indigo-400' },
                                { label: 'AI TEMP', value: '38°C', icon: Zap, color: 'text-amber-400' },
                                { label: 'UPTIME', value: '99.99%', icon: Server, color: 'text-purple-400' },
                                { label: 'INTEGRITY', value: 'VERIFIED', icon: CheckCircle2, color: 'text-emerald-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon size={14} className={stat.color} />
                                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                    <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">All Subsystems Operational</span>
                        </div>
                    </div>
                );
            case 'license':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-400 mb-4">
                            <FileText size={24} />
                            <h2 className="text-xl font-bold font-sci-fi tracking-widest">NEURAL LICENSE</h2>
                        </div>
                        <div className="space-y-4 text-xs text-slate-400 font-mono leading-relaxed h-64 overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-white font-bold">END-USER COGNITIVE LICENSE AGREEMENT (EUCLA)</p>
                            <p>
                                By initializing LumiX OS, you agree to the deployment of neural bridge agents within your institutional network. These agents are strictly governed by the LumiX Ethics Core.
                            </p>
                            <p>
                                1. GRANT OF LICENSE: LumiX Intelligence Systems grants a non-exclusive, non-transferable license to utilize the LumiX OS for educational and cognitive enhancement purposes.
                            </p>
                            <p>
                                2. RESTRICTIONS: Reverse engineering of the Genesis Engine or the Astra Prediction Model is strictly prohibited and will result in immediate neural disconnect.
                            </p>
                            <p>
                                3. LIABILITY: LumiX Intelligence Systems is not liable for any cognitive dissonance or temporal displacement caused by over-exposure to AI-generated curricula.
                            </p>
                            <p>
                                4. TERMINATION: License may be revoked if ethics violations exceed Level 3 parameters.
                            </p>
                            <p>
                                [REMAINDER OF LICENSE REDACTED FOR SECURITY CLEARANCE]
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#050018]/95 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.15)] p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                >
                    <X size={18} />
                </button>

                <div className="relative z-10">
                    {renderContent()}
                    
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold font-mono text-xs tracking-[0.2em] transition-all"
                        >
                            CLOSE_TERMINAL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterModal;

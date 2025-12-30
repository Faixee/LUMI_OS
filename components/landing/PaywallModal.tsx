/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React from 'react';
import { X } from 'lucide-react';

type PaywallModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onViewPlans: () => void;
    onContinueDemo: () => void;
};

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onViewPlans, onContinueDemo }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-[#050018]/95 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.12)] p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70">ACCESS CONTROL</div>
                        <div className="text-xl font-bold text-white mt-2 font-sci-fi tracking-wide">SUBSCRIPTION REQUIRED</div>
                        <div className="text-sm text-slate-400 mt-3 leading-relaxed">
                            Your session is in demo/free mode. Activate a plan to unlock the full system.
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={onViewPlans}
                        className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg font-bold font-sci-fi tracking-widest transition-all"
                    >
                        SUBSCRIBE NOW
                    </button>
                    <button
                        onClick={onContinueDemo}
                        className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold font-mono text-xs tracking-[0.2em] transition-all"
                    >
                        CONTINUE AS GUEST
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaywallModal;

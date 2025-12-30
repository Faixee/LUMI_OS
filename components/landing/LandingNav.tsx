/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React from 'react';
import { Hexagon, Lock, Menu, X } from 'lucide-react';

type LandingNavProps = {
    onScrollToTop: () => void;
    onScrollToSection: (id: string) => void;
    onNavigate: (path: string) => void;
    onSystemLogin: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
};

const LandingNav: React.FC<LandingNavProps> = ({
    onScrollToTop,
    onScrollToSection,
    onNavigate,
    onSystemLogin,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
}) => {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={onScrollToTop}>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-950/50 rounded-lg flex items-center justify-center border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
                        <Hexagon size={20} className="text-cyan-400 relative z-10 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold font-sci-fi tracking-wide text-white group-hover:text-cyan-200 transition-colors flex items-center gap-2">
                            LUMIX <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1 rounded border border-cyan-500/30">OS</span>
                        </h1>
                        <p className="text-[8px] md:text-[9px] text-indigo-400 font-mono tracking-[0.3em] uppercase hidden sm:block">Architecture v3.0</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-10 text-[10px] font-mono font-bold text-slate-400">
                    <button onClick={onScrollToTop} className="hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        Initialize
                    </button>
                    <button onClick={() => onScrollToSection('intelligence')} className="hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-slate-600 group-hover:bg-cyan-400 rounded-full transition-colors" />
                        Intelligence
                    </button>
                    <button onClick={() => onScrollToSection('architecture')} className="hover:text-indigo-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-slate-600 group-hover:bg-indigo-400 rounded-full transition-colors" />
                        Architecture
                    </button>
                    <button onClick={() => onScrollToSection('specs')} className="hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-slate-600 group-hover:bg-emerald-400 rounded-full transition-colors" />
                        Blueprint
                    </button>
                    <button onClick={() => onNavigate('/subscribe')} className="hover:text-purple-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-slate-600 group-hover:bg-purple-400 rounded-full transition-colors" />
                        Pricing
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onSystemLogin}
                        className="hidden md:flex relative px-6 py-2 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 text-white rounded-lg font-mono text-xs font-bold transition-all items-center gap-2 group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Lock size={12} className="text-cyan-400" /> SYSTEM LOGIN
                    </button>

                    <button
                        className="md:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-black/95 border-b border-white/10 backdrop-blur-xl animate-in slide-in-from-top-5">
                    <div className="flex flex-col p-6 space-y-6 text-sm font-mono font-bold text-slate-400">
                        {/* Mobile Demo Button now triggers the modal flow via the main onDemo prop if we had one, but here we direct navigate. 
                            Ideally, we should bubble this up to LandingPage. 
                            For now, we'll route to /demo/student as a default or keep generic /demo which defaults to admin?
                            Let's assume generic demo goes to admin or we can't easily open modal from here without prop drilling.
                            Let's just route to /demo/student as a "Try It" experience or keep generic /demo. 
                            Actually, the user said "options box select the portal". 
                            Since we can't easily prop drill without changing interface, let's leave this as generic demo (which defaults to admin) or maybe we should change it?
                            Given the prompt, let's try to fix this too if possible, but LandingNav prop interface is limited.
                            I'll leave it pointing to /demo which defaults to admin/generic for now to avoid breaking changes, 
                            OR I can assume LandingPage handles /demo routing?
                            Wait, I changed /demo to use params. If I go to /demo, role is undefined -> defaults to 'demo' -> backend handles it.
                            So it's safe.
                        */}
                        <button onClick={() => { onScrollToTop(); setIsMobileMenuOpen(false); }} className="text-cyan-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" /> Initialize System
                        </button>
                        <button onClick={() => { onScrollToSection('intelligence'); setIsMobileMenuOpen(false); }} className="hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Intelligence
                        </button>
                        <button onClick={() => { onScrollToSection('architecture'); setIsMobileMenuOpen(false); }} className="hover:text-indigo-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Architecture
                        </button>
                        <button onClick={() => { onScrollToSection('specs'); setIsMobileMenuOpen(false); }} className="hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Blueprint
                        </button>
                        <button onClick={() => { onNavigate('/subscribe'); setIsMobileMenuOpen(false); }} className="hover:text-purple-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> Pricing
                        </button>
                        <div className="h-[1px] bg-white/10 w-full my-2" />
                        <button
                            onClick={onSystemLogin}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg w-full"
                        >
                            <Lock size={14} /> SYSTEM LOGIN
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default LandingNav;

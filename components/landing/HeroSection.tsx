import React from 'react';
import { Play, Terminal, Zap, Radio, ShieldCheck } from 'lucide-react';
import HUDCorner from './HUDCorner';

type HeroSectionProps = {
    sloganIndex: number;
    slogans: string[];
    isSystemTourActive: boolean;
    onDemo: () => void;
    onToggleSystemTour: () => void;
};

const HeroSection: React.FC<HeroSectionProps> = ({ sloganIndex, slogans, isSystemTourActive, onDemo, onToggleSystemTour }) => {
    return (
        <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-6 overflow-hidden min-h-[100dvh] md:min-h-[90vh] flex items-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full border-dashed animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 min-w-0 relative z-20">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-md">
                        <Radio size={14} className="text-indigo-400 animate-pulse" />
                        <span className="text-indigo-300 text-[10px] font-mono tracking-[0.2em] uppercase">Neural Link Established</span>
                    </div>

                    <div>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-5xl xl:text-7xl 2xl:text-8xl font-bold font-sci-fi leading-[0.9] tracking-tighter text-white mb-6">
                            LUMIX <br />
                            <span key={sloganIndex} className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 text-glow animate-in fade-in slide-in-from-bottom-4 duration-500 inline-block min-h-[1.2em]">
                                {slogans[sloganIndex]}
                            </span>
                        </h1>
                        <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-transparent" />
                    </div>

                    <p className="text-lg text-slate-400 max-w-xl leading-relaxed font-light border-l-2 border-white/10 pl-6">
                        The world's first <span className="text-white font-bold">Autonomous Education Infrastructure</span>.
                        Replace fragmented tools with a single, self-healing operating system powered by Astra Prediction Engines.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 pt-4">
                        <button
                            onClick={onDemo}
                            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-black rounded-sm font-bold font-sci-fi tracking-widest shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3 relative group overflow-hidden clip-path-slant"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <Zap size={20} className="relative z-10" />
                            <span className="relative z-10">INITIALIZE DEMO</span>
                        </button>
                        <button
                            type="button"
                            onClick={onToggleSystemTour}
                            aria-pressed={isSystemTourActive}
                            className="px-8 py-4 bg-black/50 hover:bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-sm font-bold font-sci-fi tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                            <Play size={20} className="text-white" /> {isSystemTourActive ? 'CANCEL TOUR' : 'SYSTEM TOUR'}
                        </button>
                    </div>
                </div>

                <div className="relative hidden lg:block perspective-1000 pl-8">
                    <div className="absolute -inset-10 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />

                    <div className="relative bg-[#05050a]/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transform rotateY-[-5deg] rotateX-[2deg] transition-all duration-700 hover:rotateY-0 hover:rotateX-0 hover:scale-[1.02] group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <HUDCorner />

                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-cyan-500/70" />
                                <span className="text-[10px] font-mono text-slate-400">ROOT@LUMIX-CORE:~/AGENTS</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                        </div>

                        <div className="p-6 font-mono text-xs space-y-3 h-[380px] bg-black/40 relative">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                            <div className="relative z-10 space-y-3">
                                <div className="text-slate-500"># System Boot Sequence Initiated...</div>
                                <div className="flex gap-2 text-emerald-400/90">
                                    <span>[OK]</span> <span>Loading Neural Weights (v4.5.2)</span>
                                </div>
                                <div className="flex gap-2 text-emerald-400/90">
                                    <span>[OK]</span> <span>Nexus Data Bridge Connected</span>
                                </div>
                                <div className="text-slate-300 mt-4">$ run astra_prediction --target=all</div>
                                <div className="pl-4 border-l border-indigo-500/30 text-indigo-300 space-y-1 my-2 bg-indigo-500/5 py-2 rounded-r">
                                    <div>&gt; Analyzing 1,240 Student Vectors...</div>
                                    <div>&gt; Pattern Recognition: <span className="text-white font-bold text-glow">ACTIVE</span></div>
                                    <div>&gt; Risk Factors Identified: <span className="text-rose-400 font-bold">3 High Priority</span></div>
                                </div>
                                <div className="text-slate-300">$ generate_intervention --auto</div>
                                <div className="text-cyan-400 typing-cursor">
                                    &gt; Generating personalized study plans...
                                </div>
                            </div>

                            <div className="absolute bottom-6 right-6 bg-[#0a0a0f]/95 border border-emerald-500/30 p-4 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-[float_4s_ease-in-out_infinite] z-20 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                                        <ShieldCheck size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">System Status</div>
                                        <div className="text-emerald-400 font-bold text-sm tracking-wide text-glow">SECURE • OPTIMAL</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

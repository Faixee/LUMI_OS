import React from 'react';
import { Play, Terminal, Zap, Radio, ShieldCheck, TrendingUp, Brain, Target, Award, BarChart3, Microscope, Sparkles } from 'lucide-react';
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

            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 xl:gap-32 items-center relative z-10 px-6 md:px-12">
                <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 min-w-0 relative z-20 pr-4">
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
                        The world's first <span className="text-white font-bold text-glow">Generative Education OS</span>.
                        Beyond automation: A self-evolving neural infrastructure that predicts learning outcomes with <span className="text-cyan-400 font-mono">98.2%</span> accuracy. Invest in the future of human capital.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 pt-4">
                        <button
                            onClick={onDemo}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm font-bold font-sci-fi tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3 relative group overflow-hidden clip-path-slant"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <Zap size={20} className="relative z-10" />
                            <span className="relative z-10">INITIALIZE SYSTEM</span>
                        </button>
                        <button
                            type="button"
                            onClick={onToggleSystemTour}
                            aria-pressed={isSystemTourActive}
                            className="px-8 py-4 bg-black/50 hover:bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-sm font-bold font-sci-fi tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                            <TrendingUp size={20} className="text-cyan-400" /> {isSystemTourActive ? 'CANCEL ANALYSIS' : 'MARKET ANALYSIS'}
                        </button>
                    </div>
                </div>

                <div className="relative hidden lg:block perspective-1000 pl-16 xl:pl-24">
                    <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />

                    <div className="relative bg-[#05050a]/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transform rotateY-[-5deg] rotateX-[2deg] translate-x-4 lg:translate-x-12 transition-all duration-700 hover:rotateY-0 hover:rotateX-0 hover:scale-[1.02] group min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <HUDCorner />

                        {/* Top Bar: Cognitive Status */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.2em] uppercase">Cognitive Growth Engine v4.5</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <Brain size={12} className="text-purple-400" />
                                    <span className="text-[9px] font-mono text-slate-400">98.2% SYNAPSE EFFICIENCY</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 relative min-h-[420px]">
                            {/* Background Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

                            <div className="relative z-10 grid grid-cols-2 gap-6 h-full">
                                {/* Left Side: Intelligence Feed */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Autonomous Learning Feed</h4>
                                        <div className="h-0.5 w-8 bg-indigo-500/50" />
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { icon: Target, text: "Identifying learning gaps in STEM vectors", color: "text-cyan-400" },
                                            { icon: TrendingUp, text: "Optimizing retention for 1,240 students", color: "text-emerald-400" },
                                            { icon: Award, text: "Generating personalized mastery paths", color: "text-amber-400" },
                                            { icon: Sparkles, text: "Synthesizing real-time cognitive insights", color: "text-purple-400" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-sm hover:bg-white/10 transition-colors group/item">
                                                <item.icon size={14} className={`${item.color} mt-0.5 group-hover/item:scale-110 transition-transform`} />
                                                <span className="text-[11px] text-slate-300 font-light leading-tight">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Microscope size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-mono text-indigo-300 uppercase">Predictive ROI</span>
                                        </div>
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-sm">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[9px] text-slate-400 font-mono">ESTIMATED GROWTH</span>
                                                <span className="text-sm font-bold text-white">+42.8%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[75%] animate-[shimmer_2s_infinite]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Visual Core */}
                                <div className="flex flex-col items-center justify-center relative">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-48 border border-indigo-500/10 rounded-full animate-[ping_4s_ease-in-out_infinite]" />
                                        <div className="w-32 h-32 border border-purple-500/10 rounded-full animate-[ping_3s_ease-in-out_infinite]" />
                                    </div>

                                    <div className="relative w-32 h-32 flex items-center justify-center bg-black/40 border border-white/10 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                                        <Brain size={48} className="text-indigo-400 animate-pulse" />
                                        <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                                    </div>

                                    <div className="mt-8 space-y-4 w-full">
                                        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                                                    <BarChart3 size={20} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Investor Metric</div>
                                                    <div className="text-emerald-400 font-bold text-sm tracking-wide">SCALABLE • SECURE</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                            ))}
                                        </div>
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

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Cpu, 
    Shield, 
    Zap, 
    Globe, 
    Database, 
    BrainCircuit, 
    Layout, 
    Server, 
    Lock, 
    ArrowLeft,
    Terminal,
    Code,
    Layers,
    Bot
} from 'lucide-react';

const DocsPage: React.FC = () => {
    const navigate = useNavigate();

    const modules = [
        {
            icon: Database,
            title: "01. Nexus Data Layer",
            desc: "Ingests SQL, CSV, and Legacy data into a unified vector database.",
            color: "text-cyan-400",
            border: "border-cyan-500/20"
        },
        {
            icon: BrainCircuit,
            title: "02. Agentic Neural Grid",
            desc: "Autonomous agents (Astra, Lumen, Nova) continuously process data.",
            color: "text-purple-400",
            border: "border-purple-500/20"
        },
        {
            icon: Layout,
            title: "03. Generative Interface",
            desc: "UI that adapts to the user role, generating content on the fly.",
            color: "text-emerald-400",
            border: "border-emerald-500/20"
        }
    ];

    const comparisons = [
        {
            legacy: "Reactive Insights",
            legacyDesc: "Alerts you only after a student has failed.",
            lumix: "Predictive Engine",
            lumixDesc: "Forecasts risks months in advance with 98.2% accuracy."
        },
        {
            legacy: "Manual Data Entry",
            legacyDesc: "Teachers waste hours on grading and scheduling.",
            lumix: "Autonomous Agents",
            lumixDesc: "Agents handle grading, scheduling, and logistics."
        },
        {
            legacy: "Static Interface",
            legacyDesc: "Clunky, spreadsheet-like UI.",
            lumix: "Generative UI",
            lumixDesc: "Cinematic, glassmorphic interface that adapts to context."
        }
    ];

    return (
        <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-cyan-500/30">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030014]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                    >
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Terminal size={18} className="text-cyan-400" />
                        <span className="font-sci-fi font-bold tracking-widest text-lg">LUMIX<span className="text-cyan-400">DOCS</span></span>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden md:block">
                    Architecture v3.0 // Neural Link Established
                </div>
            </nav>

            <main className="max-w-5xl mx-auto pt-32 pb-20 px-6 space-y-24">
                
                {/* Header */}
                <header className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                        <Cpu size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-[0.2em]">Cognitive Economy</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold font-sci-fi leading-tight">
                        ENGINEERED <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">INTELLIGENCE</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                        The world's first Generative Education OS. Beyond automation: A self-evolving neural infrastructure that predicts learning outcomes with 98.2% accuracy.
                    </p>
                </header>

                {/* Core Architecture */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3">
                        <Layers size={24} className="text-cyan-400" />
                        <h2 className="text-2xl font-bold font-sci-fi tracking-widest">SYSTEM ARCHITECTURE</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {modules.map((mod, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-6 bg-black/40 border ${mod.border} rounded-2xl backdrop-blur-sm hover:bg-white/5 transition-colors group`}
                            >
                                <div className={`mb-4 p-3 rounded-xl bg-white/5 w-fit ${mod.color} group-hover:scale-110 transition-transform`}>
                                    <mod.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold font-mono mb-2 text-white">{mod.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stack Diagram */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Code size={120} />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-4 p-4 border border-emerald-500/30 bg-emerald-900/10 rounded-xl">
                                <Layout size={20} className="text-emerald-400" />
                                <div>
                                    <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Frontend Layer</div>
                                    <div className="font-bold">Adaptive Dashboard (React + Vite)</div>
                                </div>
                            </div>
                            <div className="flex justify-center h-6">
                                <div className="w-px bg-white/10" />
                            </div>
                            <div className="flex items-center gap-4 p-4 border border-purple-500/30 bg-purple-900/10 rounded-xl">
                                <Bot size={20} className="text-purple-400" />
                                <div>
                                    <div className="text-xs font-mono text-purple-400 uppercase tracking-widest">Processing Layer</div>
                                    <div className="font-bold">Gemini Agent Swarm (FastAPI + Python)</div>
                                </div>
                            </div>
                            <div className="flex justify-center h-6">
                                <div className="w-px bg-white/10" />
                            </div>
                            <div className="flex items-center gap-4 p-4 border border-cyan-500/30 bg-cyan-900/10 rounded-xl">
                                <Database size={20} className="text-cyan-400" />
                                <div>
                                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Data Layer</div>
                                    <div className="font-bold">Nexus SQL Bridge (PostgreSQL)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Legacy vs LumiX */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3">
                        <Zap size={24} className="text-amber-400" />
                        <h2 className="text-2xl font-bold font-sci-fi tracking-widest">OUTCLASSING THE LEGACY</h2>
                    </div>

                    <div className="grid gap-4">
                        {comparisons.map((item, i) => (
                            <div key={i} className="grid md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-xl bg-rose-900/10 border border-rose-500/20 flex flex-col justify-center">
                                    <div className="text-xs font-mono text-rose-500 uppercase tracking-widest mb-1">Traditional Systems</div>
                                    <div className="font-bold text-white text-lg mb-1">{item.legacy}</div>
                                    <div className="text-sm text-rose-200/60">{item.legacyDesc}</div>
                                </div>
                                <div className="p-6 rounded-xl bg-emerald-900/10 border border-emerald-500/20 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                                    <div className="relative z-10">
                                        <div className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-1">LumiX OS</div>
                                        <div className="font-bold text-white text-lg mb-1">{item.lumix}</div>
                                        <div className="text-sm text-emerald-200/60">{item.lumixDesc}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-white/5">
                    {[
                        { label: "Accuracy", value: "99.9%", icon: Globe, color: "text-cyan-400" },
                        { label: "Neural Latency", value: "< 15ms", icon: Zap, color: "text-amber-400" },
                        { label: "Encryption", value: "Quantum", icon: Lock, color: "text-purple-400" },
                        { label: "Uptime", value: "100%", icon: Server, color: "text-emerald-400" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center space-y-2">
                            <stat.icon size={20} className={`mx-auto ${stat.color} mb-2`} />
                            <div className="text-2xl md:text-3xl font-bold font-sci-fi">{stat.value}</div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </section>

                <footer className="pt-20 text-center space-y-4">
                    <p className="text-xs text-slate-600 font-mono uppercase tracking-[0.2em]">
                        Designed & Engineered by Faizain Murtuza
                    </p>
                    <div className="text-[10px] text-slate-700">
                        © {new Date().getFullYear()} LUMIX INTELLIGENCE SYSTEMS
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default DocsPage;

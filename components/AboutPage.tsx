/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { User, Code, Shield, Cpu, Globe, ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const techStack = [
        { name: 'React 19', category: 'Frontend', icon: <Globe size={16} /> },
        { name: 'FastAPI', category: 'Backend', icon: <Cpu size={16} /> },
        { name: 'PostgreSQL', category: 'Database', icon: <Code size={16} /> },
        { name: 'Gemini 3 Flash', category: 'Intelligence', icon: <Shield size={16} /> },
        { name: 'Tailwind CSS', category: 'Styling', icon: <Globe size={16} /> },
        { name: 'Framer Motion', category: 'Animation', icon: <Heart size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-cyan-500/30">
            {/* Navigation */}
            <nav className="p-6 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <h1 className="text-xl font-bold font-sci-fi tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        SYSTEM_ARCHIVE
                    </h1>
                </div>
                <div className="text-[10px] font-mono text-slate-500 tracking-[0.3em] uppercase">
                    v1.0.0 // PRODUCTION_READY
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-8 pt-16 space-y-24">
                {/* Hero Attribution */}
                <section className="text-center space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block p-4 rounded-3xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 mb-4"
                    >
                        <User size={48} className="text-cyan-400 mx-auto" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-5xl font-bold font-sci-fi tracking-tighter">
                            FAIZAIN <span className="text-cyan-400">MURTUZA</span>
                        </h2>
                        <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                            Lead Architect & Full-Stack Developer of the LumiX OS ecosystem. 
                            Crafting the future of educational intelligence through elegant code and predictive neural networks.
                        </p>
                    </motion.div>
                </section>

                {/* Architecture Credits */}
                <section className="grid md:grid-cols-2 gap-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-bold font-sci-fi flex items-center gap-3">
                            <Code className="text-purple-400" /> SYSTEM_DESIGN
                        </h3>
                        <p className="text-slate-400 leading-relaxed">
                            LumiX was engineered as a high-concurrency, intelligence-first School Management System. 
                            The architecture leverages a reactive frontend coupled with an asynchronous Python backend, 
                            optimized for low-latency AI interactions and real-time data synchronization.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {techStack.map((tech, i) => (
                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/30 transition-colors group">
                                <div className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform">{tech.icon}</div>
                                <div className="text-xs font-bold text-white mb-1">{tech.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{tech.category}</div>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Copyright Section */}
                <section className="pt-16 border-t border-white/5 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-sm">
                        <span>&copy; {currentYear}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                        <span className="text-white font-bold">FAIZAIN MURTUZA</span>
                    </div>
                    <p className="text-xs text-slate-600 tracking-widest uppercase">
                        All Rights Reserved // Unauthorized reproduction is strictly prohibited
                    </p>
                </section>
            </main>

            {/* Subtle Watermark Branding */}
            <div className="fixed bottom-8 left-8 pointer-events-none opacity-10 select-none">
                <div className="text-[40px] font-black font-sci-fi tracking-tighter text-white">
                    MURTUZA_OS
                </div>
            </div>
        </div>
    );
};

export default AboutPage;

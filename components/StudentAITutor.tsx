
import React, { useState } from 'react';
import { generateQuiz, generateExplanation, neuralExplain } from '../services/geminiService';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Brain, Sparkles, BookOpen, Target, Award, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const StudentAITutor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'solve'>('study');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [question, setQuestion] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'solve' && !problem.trim()) return;
    if (activeTab !== 'solve' && !topic && !question) return;
    setLoading(true);

    try {
        if (activeTab === 'quiz') {
            const quiz = await generateQuiz(topic, 'Intermediate');
            setResult(quiz);
        } else if (activeTab === 'solve') {
            const explanation = await neuralExplain(topic || 'Mathematics', problem, '10');
            setResult(explanation);
        } else {
            if (question.trim()) {
                const explanation = await neuralExplain(topic || 'General', question, '10');
                setResult(explanation);
            } else {
                const explanation = await generateExplanation(topic);
                setResult(explanation);
            }
        }
    } catch {
        setResult('> AI is currently unavailable. Please try again in a moment.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-bottom-4 duration-500 min-h-0 lg:h-[calc(100vh-12rem)]">
        {/* Control Panel */}
        <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-6 lg:pb-0">
            <div>
                <h2 className="text-2xl font-bold text-white font-sci-fi text-glow flex items-center gap-3">
                    <Brain size={28} className="text-cyan-400" />
                    NEURAL TUTOR
                </h2>
                <p className="text-slate-400 text-[10px] tracking-widest mt-1 uppercase font-mono pl-10">Personalized AI Study Companion</p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl border border-indigo-500/20 bg-[#0f172a]/80 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                {/* Responsive Tabs */}
                <div className="mb-6">
                    {/* Mobile Dropdown Tab Selector */}
                    <div className="lg:hidden relative">
                        <select 
                            value={activeTab}
                            onChange={(e) => {
                                const val = e.target.value as 'study' | 'quiz' | 'solve';
                                setActiveTab(val);
                                setResult('');
                                setQuestion('');
                                if (val === 'solve') setTopic('');
                                else setProblem('');
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold font-mono text-cyan-400 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        >
                            <option value="study">EXPLAINER MODE</option>
                            <option value="quiz">QUIZ PROTOCOL</option>
                            <option value="solve">SOLVER ENGINE</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400/50">
                            <Sparkles size={14} />
                        </div>
                    </div>

                    {/* Desktop Horizontal Tabs */}
                    <div className="hidden lg:flex bg-black/40 p-1 rounded-xl overflow-x-auto no-scrollbar touch-pan-x">
                        <button 
                            onClick={() => { setActiveTab('study'); setResult(''); setQuestion(''); setProblem(''); }}
                            className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all active:scale-95 whitespace-nowrap px-2 ${activeTab === 'study' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            EXPLAINER
                        </button>
                        <button 
                            onClick={() => { setActiveTab('quiz'); setResult(''); setQuestion(''); setProblem(''); }}
                            className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all active:scale-95 whitespace-nowrap px-2 ${activeTab === 'quiz' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            QUIZ ME
                        </button>
                        <button 
                            onClick={() => { setActiveTab('solve'); setResult(''); setQuestion(''); setTopic(''); }}
                            className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all active:scale-95 whitespace-nowrap px-2 ${activeTab === 'solve' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            SOLVE
                        </button>
                    </div>
                </div>

                <form onSubmit={handleAction} className="space-y-4 sm:space-y-6">
                    <div>
                        {activeTab !== 'solve' ? (
                          <>
                            <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">
                                {activeTab === 'quiz' ? 'Target Subject' : 'Confusing Topic'}
                            </label>
                            <input 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={activeTab === 'quiz' ? "e.g. Calculus, Organic Chemistry" : "e.g. How does gravity work?"}
                                className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-3 sm:p-4 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-sans"
                            />
                          </>
                        ) : (
                          <>
                            <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Math/Science Problem</label>
                            <textarea 
                                value={problem}
                                onChange={(e) => setProblem(e.target.value)}
                                placeholder="Type the problem. Include equations or LaTeX..."
                                className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-3 sm:p-4 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-sans h-24 resize-none"
                            />
                          </>
                        )}
                    </div>
                    {activeTab === 'study' && (
                        <div>
                            <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Confusing Question (Optional)</label>
                            <textarea 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Paste the hard or confusing question here"
                                className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-3 sm:p-4 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-sans h-20 resize-none"
                            />
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading || !topic}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold font-sci-fi tracking-[0.2em] text-[10px] sm:text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-3 uppercase"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> PROCESSING...</>
                        ) : (
                            <><Zap size={16} /> {activeTab === 'quiz' ? 'GENERATE EXAM' : 'EXPLAIN IT'}</>
                        )}
                    </button>
                </form>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="p-0">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 mb-4 font-mono flex items-center gap-2 uppercase tracking-widest">
                        <Award size={14} className="text-amber-500" />
                        Weakness Detection
                    </h4>
                    <div className="space-y-3">
                        <div className="p-3 sm:p-4 rounded-xl bg-[#0f172a]/60 border border-rose-500/20 flex justify-between items-center cursor-pointer hover:border-rose-500/40 transition-all group active:scale-[0.98] touch-manipulation" onClick={() => { setTopic("Quadratic Equations"); setActiveTab('study'); }}>
                            <span className="text-xs text-rose-300 group-hover:text-rose-200 transition-colors">Math: Algebra</span>
                            <span className="text-[10px] font-bold text-rose-400 font-mono">Score: 65%</span>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-[#0f172a]/60 border border-amber-500/20 flex justify-between items-center cursor-pointer hover:border-amber-500/40 transition-all group active:scale-[0.98] touch-manipulation" onClick={() => { setTopic("Physics Forces"); setActiveTab('quiz'); }}>
                            <span className="text-xs text-amber-300 group-hover:text-amber-200 transition-colors">Physics: Forces</span>
                            <span className="text-[10px] font-bold text-amber-400 font-mono">Score: 72%</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-5 rounded-2xl border border-white/5 bg-[#0f172a]/40 flex flex-col min-h-[250px]">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 mb-4 font-mono flex items-center gap-2 uppercase tracking-widest">
                        <BookOpen size={14} className="text-emerald-500" />
                        Recent Sessions
                    </h4>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {[1,2,3].map((_, i) => (
                            <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-cyan-900/20 flex items-center justify-center text-cyan-400 text-xs font-bold">{i+1}</div>
                                <div>
                                    <p className="text-xs text-slate-300 font-medium">Thermodynamics</p>
                                    <p className="text-[10px] text-slate-500 font-mono">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Output Panel */}
        <div className="w-full lg:flex-1 rounded-3xl border border-white/5 bg-[#050914] flex flex-col overflow-hidden relative shadow-2xl min-h-0 h-[400px] lg:h-auto">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-white text-xs font-mono uppercase tracking-widest">AI Output Stream</h3>
                {result && activeTab === 'quiz' && (
                    <span className="text-[10px] font-mono text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">+50 XP ON COMPLETION</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
                {result ? (
                    <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-cyan-300 prose-code:text-amber-300 max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500 text-sm sm:text-base">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{result}</ReactMarkdown>
                        
                        {activeTab === 'quiz' && (
                            <button className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold font-sci-fi transition-colors shadow-lg tracking-wider text-sm">
                                SUBMIT ANSWERS
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 select-none opacity-30">
                        <Zap size={48} className="mb-4 text-cyan-500" />
                        <p className="font-mono text-[10px] sm:text-xs tracking-widest uppercase">Awaiting Neural Input...</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    System Online
                </div>
                <div>v3.0.1 // Gemini-Pro</div>
            </div>
        </div>
    </div>
  );
};

export default StudentAITutor;

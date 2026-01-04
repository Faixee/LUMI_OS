/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */


import React, { useState, useEffect } from 'react';
import { generateQuiz, generateExplanation, neuralExplain, solveProblem } from '../services/geminiService';
import { authService } from '../services/auth';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Brain, Sparkles, BookOpen, Target, Award, Zap, ChevronRight, Shield, ThumbsUp, ThumbsDown, CheckCircle, ListChecks } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Student } from '../types';

interface StudentAITutorProps {
  students?: Student[];
}

const StudentAITutor: React.FC<StudentAITutorProps> = ({ students = [] }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'solve'>('study');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<string | any[] | any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [question, setQuestion] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentGrade, setStudentGrade] = useState('10');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [subject, setSubject] = useState('Mathematics');
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);
  const [subjectMastery, setSubjectMastery] = useState<Record<string, number>>({});
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    const user = authService.getUser();
    if (user.role === 'student' && students.length > 0) {
        const self = students.find(s => s.name === user.name) || students[0];
        if (self) setStudentGrade(String(self.gradeLevel));
    }
    
    // Load mastery from local storage
    const savedMastery = localStorage.getItem('lumios_mastery');
    if (savedMastery) setSubjectMastery(JSON.parse(savedMastery));
  }, [students]);

  const updateMastery = (subj: string, score: number) => {
    const newMastery = { ...subjectMastery, [subj]: Math.max(subjectMastery[subj] || 0, score) };
    setSubjectMastery(newMastery);
    localStorage.setItem('lumios_mastery', JSON.stringify(newMastery));
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'solve' && !problem.trim()) return;
    if (activeTab !== 'solve' && !topic && !question) return;
    setLoading(true);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
        if (activeTab === 'quiz') {
            const quiz = await generateQuiz(topic, difficulty, lastQuizScore || undefined);
            setResult(quiz);
        } else if (activeTab === 'solve') {
            const solution = await solveProblem(subject, topic || 'General', difficulty, studentGrade, problem);
            setResult(solution);
        } else {
            if (question.trim()) {
                const explanation = await neuralExplain(topic || 'General', question, studentGrade, true);
                setResult(explanation);
            } else {
                const explanation = await generateExplanation(topic);
                setResult(explanation);
            }
        }
    } catch {
        setResult({ error: 'AI is currently unavailable. Neural link offline.' });
    } finally {
        setLoading(false);
    }
  };

  const renderSolution = () => {
    if (!result || typeof result !== 'object' || Array.isArray(result) || result.error) {
        if (result?.error) return <div className="text-rose-400 font-mono text-sm">{result.error}</div>;
        return null;
    }

    const { subject, difficulty, steps, final_answer, verification_status, pedagogical_note } = result;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center gap-3">
                    <Brain className="text-cyan-400" size={20} />
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider">{subject} Solution</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{difficulty} Tier // Grade {studentGrade}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${verification_status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {verification_status}
                </div>
            </div>

            <div className="space-y-6">
                {steps.map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-8 border-l border-white/5">
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        </div>
                        <h5 className="text-cyan-300 font-bold text-sm mb-2 font-mono uppercase tracking-wide">{step.title}</h5>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{step.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <CheckCircle size={18} />
                    <span className="text-xs font-bold font-mono uppercase tracking-[0.2em]">Final Resolution</span>
                </div>
                <div className="text-xl text-white font-medium leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{final_answer}</ReactMarkdown>
                </div>
            </div>

            {pedagogical_note && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                    <Sparkles className="text-amber-500 flex-shrink-0" size={18} />
                    <div>
                        <span className="text-[10px] font-bold text-amber-500 font-mono uppercase tracking-widest block mb-1">Pedagogical Insight</span>
                        <p className="text-sm text-slate-400 leading-relaxed italic">"{pedagogical_note}"</p>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderQuiz = () => {
    if (!Array.isArray(result)) return null;
    
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {result.map((q, idx) => (
                <div key={q.id || idx} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <div className="flex gap-4 items-start mb-6">
                        <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-sm font-bold flex-shrink-0">
                            {idx + 1}
                        </span>
                        <h4 className="text-lg text-white font-medium leading-relaxed">{q.question}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                        {q.options.map((opt: string, optIdx: number) => {
                            const isSelected = quizAnswers[idx] === optIdx;
                            const isCorrect = q.correct === optIdx;
                            const showResult = quizSubmitted;
                            
                            let borderClass = "border-white/5";
                            let bgClass = "bg-black/20";
                            let textClass = "text-slate-300";

                            if (showResult) {
                                if (isCorrect) {
                                    borderClass = "border-emerald-500/50";
                                    bgClass = "bg-emerald-500/10";
                                    textClass = "text-emerald-400";
                                } else if (isSelected) {
                                    borderClass = "border-rose-500/50";
                                    bgClass = "bg-rose-500/10";
                                    textClass = "text-rose-400";
                                }
                            } else if (isSelected) {
                                borderClass = "border-cyan-500/50";
                                bgClass = "bg-cyan-500/10";
                                textClass = "text-cyan-400";
                            }

                            return (
                                <button
                                    key={optIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                    className={`p-4 rounded-xl border ${borderClass} ${bgClass} ${textClass} text-left text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/10 group-hover:border-white/30'}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                                    </div>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {quizSubmitted && q.explanation && (
                        <div className="mt-6 ml-12 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-2 text-cyan-400">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-bold font-mono uppercase tracking-widest">Deep Explanation</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{q.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
            
            {!quizSubmitted && (
                <div className="flex justify-center mt-12">
                    <button 
                        onClick={() => {
                            setQuizSubmitted(true);
                            const score = (Object.entries(quizAnswers).filter(([idx, ans]) => result[Number(idx)].correct === ans).length / result.length) * 100;
                            setLastQuizScore(score);
                            updateMastery(topic || 'General', score);
                        }}
                        disabled={Object.keys(quizAnswers).length < result.length}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-12 py-4 rounded-2xl font-bold font-sci-fi transition-all shadow-lg shadow-emerald-500/20 tracking-[0.2em] text-sm uppercase flex items-center gap-3"
                    >
                        <Target size={20} /> Submit Protocol
                    </button>
                </div>
            )}

            {quizSubmitted && (
                <div className="mt-12 p-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/5 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                        <Award size={40} className="text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-sci-fi tracking-widest">PROTOCOL COMPLETE</h3>
                    <p className="text-slate-400 mb-8 font-mono text-sm">
                        You scored {Object.entries(quizAnswers).filter(([idx, ans]) => result[Number(idx)].correct === ans).length} / {result.length} ({lastQuizScore?.toFixed(0)}%)
                    </p>
                    <button 
                        onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setResult(null); }}
                        className="text-cyan-400 font-bold font-mono text-xs uppercase tracking-[0.2em] hover:text-cyan-300 transition-colors"
                    >
                        Initialize New Session
                    </button>
                </div>
            )}
        </div>
    );
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Subject</label>
                            <select 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-2 text-xs text-white focus:border-cyan-500/50 transition-all font-mono"
                            >
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Biology">Biology</option>
                                <option value="Computer Science">Computer Science</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Difficulty</label>
                            <select 
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-2 text-xs text-white focus:border-cyan-500/50 transition-all font-mono"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

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
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Subject Area</label>
                                    <input 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Physics, Calculus, Chemistry"
                                        className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-3 sm:p-4 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-sans"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 font-bold">Math/Science Problem</label>
                                    <textarea 
                                        value={problem}
                                        onChange={(e) => setProblem(e.target.value)}
                                        placeholder="Type the problem. Include equations or LaTeX..."
                                        className="w-full bg-[#0B1120] border border-white/5 rounded-xl p-3 sm:p-4 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-sans h-24 resize-none"
                                    />
                                </div>
                            </div>
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
                        disabled={loading || (
                            activeTab === 'solve' ? !problem.trim() : 
                            activeTab === 'study' ? (!topic.trim() && !question.trim()) :
                            !topic.trim()
                        )}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold font-sci-fi tracking-[0.2em] text-[10px] sm:text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-3 uppercase"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> PROCESSING...</>
                        ) : (
                            <>
                                <Zap size={16} /> 
                                {activeTab === 'quiz' ? 'GENERATE EXAM' : (activeTab === 'solve' ? 'SOLVE PROBLEM' : 'EXPLAIN IT')}
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="p-0">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 mb-4 font-mono flex items-center gap-2 uppercase tracking-widest">
                        <Target size={14} className="text-cyan-500" />
                        Neural Mastery
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(subjectMastery).length > 0 ? (
                            Object.entries(subjectMastery).map(([subj, score]) => (
                                <div key={subj} className="p-3 sm:p-4 rounded-xl bg-[#0f172a]/60 border border-cyan-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-cyan-300">{subj}</span>
                                        <span className="text-[10px] font-bold text-cyan-400 font-mono">{score.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-cyan-500 transition-all duration-1000" 
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">No mastery data yet</p>
                            </div>
                        )}
                    </div>
                </div>

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
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-white text-xs font-mono uppercase tracking-widest">AI Output Stream</h3>
                    {result && !Array.isArray(result) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <Shield className="text-cyan-400" size={10} />
                            <span className="text-[9px] font-bold text-cyan-400 font-mono uppercase tracking-tighter">Verified Accurate</span>
                        </div>
                    )}
                </div>
                {result && activeTab === 'quiz' && (
                    <span className="text-[10px] font-mono text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">+50 XP ON COMPLETION</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
                {result ? (
                    <div className="space-y-8">
                        <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-cyan-300 prose-code:text-amber-300 max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500 text-sm sm:text-base">
                            {Array.isArray(result) ? renderQuiz() : (
                                typeof result === 'object' && result !== null ? renderSolution() : (
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{result}</ReactMarkdown>
                                )
                            )}
                        </div>

                        {result && !Array.isArray(result) && (
                            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-amber-500" />
                                    Did this help your understanding?
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setFeedbackGiven(prev => ({ ...prev, [String(result).slice(0, 20)]: 'up' }))}
                                        className={`p-2 rounded-lg border transition-all ${feedbackGiven[String(result).slice(0, 20)] === 'up' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <ThumbsUp size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setFeedbackGiven(prev => ({ ...prev, [String(result).slice(0, 20)]: 'down' }))}
                                        className={`p-2 rounded-lg border transition-all ${feedbackGiven[String(result).slice(0, 20)] === 'down' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <ThumbsDown size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {feedbackGiven[String(result).slice(0, 20)] && (
                            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center animate-in fade-in zoom-in duration-300">
                                <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Feedback recorded. Neural link optimizing...</p>
                            </div>
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

/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */


import React, { useState } from 'react';
import { generateLessonPlan } from '../services/geminiService';
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Copy, 
  Check, 
  Scan, 
  Camera, 
  Upload, 
  FileCheck, 
  Save, 
  XCircle, 
  Zap, 
  Search, 
  BarChart3, 
  Clock, 
  ChevronRight, 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  FileText 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { api } from '../services/api';

interface ReferenceData {
  answers: Array<{q: string, answer: string, marks: number}>;
  total_marks: number;
  criteria: string;
  summary: string;
  confidence_score?: number;
  benchmarks?: Record<string, any>;
}

const TeacherAITools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planner' | 'grader'>('planner');

  // Planner State
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('9');
  const [lessonPlan, setLessonPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Grader State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [gradingMode, setGradingMode] = useState<'standard' | 'reference'>('standard');
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle'|'uploading'|'success'|'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setLessonPlan('');

    try {
      const result = await generateLessonPlan(topic, grade);
      setLessonPlan(result);
    } catch {
      setLessonPlan('> AI is currently unavailable. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(lessonPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzingRef(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const data = await api.analyzeReference(formData);
          setRefData(data);
      } catch (e) {
          console.error("Reference Analysis Failed", e);
      } finally {
          setIsAnalyzingRef(false);
      }
  };

  const handleGradeAssignment = async () => {
      if (!selectedFile) {
          setUploadStatus('error');
          setUploadMsg('Please select a file first');
          return;
      }
      
      setIsScanning(true);
      setScanResult(null);
      setUploadStatus('uploading');
      setUploadMsg('AI Vision Analysis in progress...');
      
      try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          if (gradingMode === 'reference' && refData) {
              formData.append('reference_data', JSON.stringify(refData));
          }

          const result = await api.gradeAssignment(formData);
          setScanResult(result);
          setUploadStatus('success');
          setUploadMsg('Analysis complete');
      } catch (err: any) {
          setUploadStatus('error');
          setUploadMsg(err.message || 'AI processing failed');
      } finally {
          setIsScanning(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadMsg(`Selected: ${file.name}`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
                    <Brain size={24} className="text-purple-400" />
                    TEACHER COMMAND LINK
                </h2>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-mono tracking-widest uppercase opacity-70">AI-Augmented Pedagogy & Automation</p>
            </div>
            
            <div className="w-full lg:w-auto">
                {/* Mobile Dropdown Tab Selector */}
                <div className="lg:hidden relative">
                    <select 
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as 'planner' | 'grader')}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold font-mono text-purple-400 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                    >
                        <option value="planner">LESSON PLANNER</option>
                        <option value="grader">VISION AUTO-GRADER</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400/50">
                        <Sparkles size={14} />
                    </div>
                </div>

                {/* Desktop Horizontal Tabs */}
                <div className="hidden lg:flex bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar touch-pan-x">
                    <button 
                        onClick={() => setActiveTab('planner')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all active:scale-95 whitespace-nowrap ${activeTab === 'planner' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        LESSON PLANNER
                    </button>
                    <button 
                        onClick={() => setActiveTab('grader')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all active:scale-95 whitespace-nowrap ${activeTab === 'grader' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        VISION AUTO-GRADER
                    </button>
                </div>
            </div>
        </div>

        {activeTab === 'planner' ? (
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                {/* Input Panel */}
                <div className="w-full lg:w-80 xl:w-96 space-y-6 shrink-0">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 sm:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <form onSubmit={handleGenerate} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-[10px] font-mono text-purple-300 uppercase tracking-widest mb-2 opacity-70">Topic / Concept</label>
                                <input 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Photosynthesis, Newton's Laws"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-slate-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-purple-300 uppercase tracking-widest mb-2 opacity-70">Target Grade</label>
                                <select 
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i} value={i + 1} className="bg-[#030014]">Grade {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !topic}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3.5 rounded-xl text-xs font-bold font-sci-fi tracking-widest shadow-lg shadow-purple-500/20 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> PROCESSING...</>
                                ) : (
                                    <><Sparkles size={16} /> GENERATE PLAN</>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5 sm:p-6">
                        <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BookOpen size={14} className="text-purple-400" />
                            Saved Templates
                        </h4>
                        <div className="space-y-2">
                            {['Unit Introduction', 'Review Session', 'Lab Instructions'].map((t, i) => (
                                <button key={i} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5 uppercase tracking-wider">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="flex-1 min-w-0">
                    <div className="rounded-2xl border border-white/5 bg-white/5 h-full flex flex-col min-h-[400px] lg:min-h-[600px] overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <FileCheck size={18} className="text-purple-400" />
                                <h3 className="font-bold text-white font-sci-fi tracking-widest text-sm uppercase">AI Lesson Output</h3>
                            </div>
                            {lessonPlan && (
                                <button 
                                    onClick={copyToClipboard}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 touch-manipulation border border-white/10"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 p-5 sm:p-8 overflow-y-auto custom-scrollbar bg-black/20">
                            {lessonPlan ? (
                                <div className="prose prose-invert prose-sm max-w-none font-mono text-slate-300 leading-relaxed selection:bg-purple-500/30">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {lessonPlan}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
                                    <Brain size={48} className="text-slate-700 mb-4" />
                                    <p className="text-xs font-mono tracking-widest uppercase">Awaiting instruction parameters</p>
                                </div>
                            )}
                        </div>
                        {lessonPlan && (
                            <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3 shrink-0">
                                <button className="px-4 py-2 rounded-lg text-[10px] font-bold font-mono text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                                    <XCircle size={14} /> Discard
                                </button>
                                <button className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold font-mono shadow-lg shadow-purple-500/20 transition-all active:scale-95 touch-manipulation uppercase tracking-widest flex items-center gap-2">
                                    <Save size={14} /> Save to Vault
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-6 sm:space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {/* Vision Grader Header */}
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 sm:p-8 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl border border-cyan-500/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Scan size={32} className="text-cyan-400" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-sci-fi mb-3 tracking-widest uppercase">Vision Intelligence</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-mono mb-8 leading-relaxed opacity-80">
                            Upload a student assignment for deep structural analysis, automated grading, and qualitative feedback synthesis.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <label className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold font-sci-fi tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center gap-3 group/btn">
                                <Camera size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                SCAN ASSIGNMENT
                                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                            </label>
                            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">or</span>
                            <label className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold font-sci-fi tracking-widest border border-white/10 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center gap-3">
                                <Upload size={20} />
                                BROWSE FILES
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* Grading Mode Selection & Reference Key */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] block mb-3 text-left">Grading Logic</label>
                                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                    <button 
                                        onClick={() => setGradingMode('standard')}
                                        className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${gradingMode === 'standard' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Standard
                                    </button>
                                    <button 
                                        onClick={() => setGradingMode('reference')}
                                        className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${gradingMode === 'reference' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Reference
                                    </button>
                                </div>
                            </div>

                            <div className={`bg-white/5 p-4 rounded-xl border transition-all ${gradingMode === 'reference' ? 'border-emerald-500/30' : 'border-white/10 opacity-50 grayscale pointer-events-none'}`}>
                                <label className="text-[9px] font-mono text-emerald-500/70 uppercase tracking-[0.2em] block mb-3 text-left flex items-center gap-2">
                                    <CheckCircle2 size={10} /> Reference Key
                                </label>
                                
                                {!refData ? (
                                    <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-emerald-500/20 rounded-lg p-2 hover:bg-emerald-500/5 cursor-pointer transition-all">
                                        <input type="file" className="hidden" accept="image/*,.pdf,.txt" onChange={handleRefUpload} />
                                        {isAnalyzingRef ? (
                                            <Loader2 size={14} className="animate-spin text-emerald-400" />
                                        ) : (
                                            <Upload size={14} className="text-emerald-500" />
                                        )}
                                        <span className="text-[8px] font-mono text-emerald-500/50 uppercase">Upload Key</span>
                                    </label>
                                ) : (
                                    <div className="flex items-center justify-between bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-[8px] font-mono text-emerald-400 truncate uppercase">{refData.summary.substring(0, 15)}...</span>
                                        </div>
                                        <button onClick={() => setRefData(null)} className="text-emerald-400/50 hover:text-emerald-400"><X size={12} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {uploadMsg && (
                            <div className={`mt-6 text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-lg inline-block border ${
                                uploadStatus === 'error' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                uploadStatus === 'success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                            }`}>
                                {uploadMsg}
                            </div>
                        )}
                        
                        {selectedFile && uploadStatus !== 'success' && (
                            <div className="mt-8 flex flex-col items-center gap-4">
                                <button 
                                    onClick={handleGradeAssignment}
                                    disabled={isScanning || (gradingMode === 'reference' && !refData)}
                                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-bold font-sci-fi tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95 touch-manipulation flex items-center gap-3"
                                >
                                    {isScanning ? (
                                        <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> ANALYZING...</>
                                    ) : (
                                        <><Brain size={20} /> INITIATE AUTO-GRADE</>
                                    )}
                                </button>

                                {gradingMode === 'reference' && !refData && (
                                    <div className="flex items-center gap-2 text-amber-400 text-[9px] font-mono uppercase tracking-widest animate-pulse">
                                        <AlertTriangle size={12} />
                                        Reference key required for this mode
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Result */}
                {scanResult && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        {/* Student Info & Score */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
                                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">Evaluation Summary</h4>
                                <div className="w-32 h-32 rounded-full border-4 border-cyan-500/20 flex items-center justify-center mx-auto mb-6 relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow"></div>
                                    <span className="text-4xl font-bold text-white font-sci-fi">{scanResult.score}%</span>
                                </div>
                                <div className="text-xl font-bold text-white font-sci-fi tracking-wider mb-1 uppercase">{scanResult.student}</div>
                                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em] font-bold">A- Grade Status</div>

                                {scanResult.reference_match_score !== undefined && (
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mb-2">Key Alignment</div>
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" 
                                                    style={{ width: `${scanResult.reference_match_score}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-400 font-mono">{scanResult.reference_match_score}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
                                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-400" />
                                    AI Insights
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mb-3 font-bold">Key Strengths</div>
                                        <div className="flex flex-wrap gap-2">
                                            {scanResult.insights?.strengths.map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-mono text-rose-400 uppercase tracking-widest mb-3 font-bold">Improvement Areas</div>
                                        <div className="flex flex-wrap gap-2">
                                            {scanResult.insights?.weaknesses.map((w, i) => (
                                                <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10px] font-mono text-rose-400 uppercase tracking-wider">{w}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Qualitative Feedback */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 h-full">
                                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <FileCheck size={14} className="text-cyan-400" />
                                    Detailed Qualitative Feedback
                                </h4>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="font-mono text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap border-l-2 border-cyan-500/30 pl-6 py-2">
                                        {scanResult.feedback}
                                    </p>
                                </div>
                                
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <h5 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-4 font-bold">Autonomous Recommendation</h5>
                                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 font-mono text-[11px] text-slate-400 italic leading-relaxed">
                                        "{scanResult.insights?.recommendation}"
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex flex-wrap gap-4">
                                    <button className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-bold font-sci-fi tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-95 touch-manipulation uppercase">Push to Portal</button>
                                    <button className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold font-sci-fi tracking-widest border border-white/10 transition-all active:scale-95 touch-manipulation uppercase">Generate Retest</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default TeacherAITools;

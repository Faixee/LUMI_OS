
import React, { useState } from 'react';
import { generateLessonPlan } from '../services/geminiService';
import { Brain, Sparkles, BookOpen, Copy, Check, Scan, Camera, Upload, FileCheck, Save, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { api } from '../services/api';

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
  const [scanResult, setScanResult] = useState<{
    student: string, 
    score: number, 
    feedback: string, 
    annotations?: {point: string, comment: string}[],
    insights?: {strengths: string[], weaknesses: string[], recommendation: string}
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle'|'uploading'|'success'|'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          const result = await api.gradeAssignment(selectedFile);
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
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
                    <Brain size={24} className="text-purple-400" />
                    TEACHER COMMAND LINK
                </h2>
                <p className="text-slate-400 text-xs mt-1">AI-AUGMENTED PEDAGOGY & AUTOMATION</p>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                <button 
                    onClick={() => setActiveTab('planner')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'planner' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    LESSON PLANNER
                </button>
                <button 
                    onClick={() => setActiveTab('grader')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'grader' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    VISION AUTO-GRADER
                </button>
            </div>
        </div>

        {activeTab === 'planner' ? (
            <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)]">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-900/10">
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-purple-300 uppercase mb-2">Topic / Concept</label>
                                <input 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Photosynthesis, Newton's Laws"
                                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-purple-300 uppercase mb-2">Target Grade</label>
                                <select 
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i} value={i + 1}>Grade {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !topic}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold font-sci-fi tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> GENERATING...</>
                                ) : (
                                    <><Sparkles size={18} /> GENERATE PLAN</>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-white/5">
                        <h4 className="text-sm font-bold text-slate-300 mb-2 font-mono">SUGGESTED ACTIONS</h4>
                        <div className="space-y-2">
                            <button className="w-full text-left p-2 rounded hover:bg-white/5 text-xs text-purple-300 flex items-center gap-2 transition-colors">
                                <BookOpen size={14} /> Draft Quiz for Grade 10 Math
                            </button>
                            <button className="w-full text-left p-2 rounded hover:bg-white/5 text-xs text-purple-300 flex items-center gap-2 transition-colors">
                                <BookOpen size={14} /> Explain "Quantum Mechanics" simply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:flex-1 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden relative min-h-0">
                    <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <h3 className="font-bold text-white font-sci-fi">GENERATED CONTENT</h3>
                        {lessonPlan && (
                            <button 
                                onClick={copyToClipboard}
                                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copied ? 'COPIED' : 'COPY MARKDOWN'}
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/50">
                        {lessonPlan ? (
                            <div className="prose prose-invert prose-purple max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{lessonPlan}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <Brain size={64} className="mb-4" />
                                <p className="font-mono text-sm">AWAITING INPUT PARAMETERS...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)]">
                {/* Scan Area */}
                <div className="w-full lg:w-1/2 glass-panel p-8 rounded-2xl border border-cyan-500/30 bg-cyan-900/10 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[300px]">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[gradient_4s_linear_infinite] pointer-events-none"></div>
                    
                    {isScanning ? (
                        <div className="space-y-6 relative z-10">
                            <div className="w-32 h-32 relative mx-auto">
                                <div className="absolute inset-0 border-4 border-cyan-500 rounded-lg animate-ping opacity-20"></div>
                                <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#06b6d4] absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                                    <Scan size={48} className="text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white font-sci-fi animate-pulse">VISION CORE ACTIVE</h3>
                                <p className="text-cyan-400 font-mono text-xs mt-2">ANALYZING HANDWRITING VECTORS...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                          <div className={`w-32 h-32 bg-black/40 border-2 ${selectedFile ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-dashed border-cyan-500/50'} rounded-2xl flex items-center justify-center mx-auto group-hover:border-cyan-400 group-hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
                                <label className="cursor-pointer flex flex-col items-center justify-center" aria-label="Upload assignment">
                                  {selectedFile ? (
                                      <FileCheck size={48} className="text-cyan-400" />
                                  ) : (
                                      <Camera size={48} className="text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                                  )}
                                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                                </label>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-white font-sci-fi">
                                  {selectedFile ? 'FILE READY' : 'UPLOAD ASSIGNMENT'}
                              </h3>
                              <p className="text-slate-400 font-mono text-xs mt-2">
                                  {selectedFile ? selectedFile.name : 'Drag & Drop or Click to Scan Paper'}
                              </p>
                          </div>
                            <div className="flex flex-col items-center justify-center gap-3">
                              <button 
                                onClick={handleGradeAssignment} 
                                disabled={!selectedFile || isScanning}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold font-sci-fi tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                              >
                                  {isScanning ? 'ANALYZING...' : 'INITIATE SCAN'}
                              </button>
                              {uploadStatus !== 'idle' && (
                                <span className={`text-xs font-mono ${uploadStatus==='success' ? 'text-emerald-400' : uploadStatus==='error' ? 'text-rose-400' : 'text-cyan-400'}`}>{uploadMsg}</span>
                              )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Area */}
                <div className="w-full lg:w-1/2 glass-panel p-0 rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-white/10 bg-black/20">
                        <h3 className="font-bold text-white font-sci-fi flex items-center gap-2">
                            <FileCheck size={18} className="text-emerald-400" />
                            GRADING REPORT
                        </h3>
                    </div>
                    
                    <div className="flex-1 p-8 bg-slate-900/50 relative overflow-y-auto custom-scrollbar">
                        {scanResult ? (
                            <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-mono text-slate-400 uppercase">Student Identity</p>
                                        <h3 className="text-xl font-bold text-white">{scanResult.student}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-slate-400 uppercase">Calculated Score</p>
                                        <div className="text-4xl font-bold text-emerald-400 font-sci-fi">{scanResult.score}/100</div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-[300px] overflow-y-auto custom-scrollbar scroll-smooth pr-2">
                                    <p className="text-xs font-mono text-cyan-400 uppercase mb-2">AI Analysis Feedback</p>
                                    <div className="prose prose-invert prose-sm">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{scanResult.feedback}</ReactMarkdown>
                                    </div>
                                </div>

                                {scanResult.annotations && scanResult.annotations.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-mono text-purple-400 uppercase">Key Annotations</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {scanResult.annotations.map((ann, idx) => (
                                                <div key={idx} className="bg-purple-900/20 border border-purple-500/20 p-2 rounded-lg text-xs">
                                                    <span className="font-bold text-purple-300">{ann.point}:</span> {ann.comment}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {scanResult.insights && (
                                    <div className="bg-cyan-900/20 border border-cyan-500/20 p-4 rounded-xl space-y-3">
                                        <p className="text-xs font-mono text-cyan-400 uppercase">Learning Insights</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase mb-1">Strengths</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {scanResult.insights.strengths.map((s, i) => (
                                                        <span key={i} className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase mb-1">Focus Areas</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {scanResult.insights.weaknesses.map((w, i) => (
                                                        <span key={i} className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[10px]">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-cyan-500/10">
                                            <p className="text-[10px] text-slate-400 uppercase mb-1">Recommendation</p>
                                            <p className="text-xs text-white italic">"{scanResult.insights.recommendation}"</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button 
                                        onClick={() => setScanResult(null)}
                                        className="flex-1 py-3 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold font-sci-fi transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={18} /> REJECT
                                    </button>
                                    <button className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-sci-fi shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                                        <Save size={18} /> SAVE TO GRADEBOOK
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <Scan size={64} className="mb-4" />
                                <p className="font-mono text-sm">WAITING FOR SCANNED DATA...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TeacherAITools;

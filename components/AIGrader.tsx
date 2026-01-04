/**
 * LUMIX OS - AI Vision Grader
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ScanLine, Brain, ArrowRight, Loader2, Save, X, Eye, Camera, FolderOpen } from 'lucide-react';
import { api } from '../services/api';

interface AIGraderProps {
  onClose: () => void;
}

interface ReferenceData {
  answers: Array<{q: string, answer: string, marks: number}>;
  total_marks: number;
  criteria: string;
  summary: string;
  confidence_score?: number;
  benchmarks?: Record<string, any>;
}

const AIGrader: React.FC<AIGraderProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'standard' | 'reference'>('standard');
  const [refInputMode, setRefInputMode] = useState<'upload' | 'manual'>('upload');
  const [step, setStep] = useState(1); // 1: Setup, 2: Grading, 3: Results
  
  // Reference State
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refText, setRefText] = useState('');
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  
  // Student State
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [gradingContext, setContext] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string>('');

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Use a timeout to ensure the video element is mounted and ref is populated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError('Unable to access camera. Please ensure permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "scanned_assignment.jpg", { type: "image/jpeg" });
            setStudentFile(file);
            stopCamera();
            setStep(2);
          }
        }, 'image/jpeg');
      }
    }
  };

  // Drag & Drop Refs
  const refDropRef = useRef<HTMLDivElement>(null);
  const studentDropRef = useRef<HTMLDivElement>(null);

  const handleRefUpload = async (file: File) => {
    setRefFile(file);
    setIsAnalyzingRef(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const data = await api.analyzeReference(formData);
      setRefData(data);
    } catch (e) {
      console.error("Reference Analysis Failed", e);
      // Fallback/Error handling
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  const handleGrade = async () => {
    if (!studentFile) return;
    
    setIsGrading(true);
    const formData = new FormData();
    formData.append('file', studentFile);
    formData.append('context', gradingContext);
    
    if (mode === 'reference' && refData) {
      formData.append('reference_data', JSON.stringify(refData));
    }

    try {
      const data = await api.gradeAssignment(formData);
      setResult(data);
      setStep(3);
    } catch (e) {
      console.error("Grading Failed", e);
    } finally {
      setIsGrading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const textContent = `
GRADING REPORT
Student: ${result.student}
Score: ${result.score}/100
${result.reference_match_score ? `Reference Match: ${result.reference_match_score}%` : ''}

FEEDBACK:
${result.feedback}

INSIGHTS:
Strengths: ${result.insights?.strengths?.join(', ')}
Weaknesses: ${result.insights?.weaknesses?.join(', ')}
Recommendation: ${result.insights?.recommendation}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grading_Report_${result.student || 'Unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ScanLine className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sci-fi">AI VISION GRADER</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                <span className={mode === 'standard' ? 'text-indigo-400' : 'text-slate-600'}>Standard</span>
                <span className="text-slate-700">|</span>
                <span className={mode === 'reference' ? 'text-emerald-400' : 'text-slate-600'}>Reference-Based</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar / Configuration */}
          <div className="w-80 border-r border-white/10 bg-black/20 p-6 overflow-y-auto hidden lg:block">
            <div className="space-y-8">
              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-3">Grading Mode</label>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button 
                    onClick={() => setMode('standard')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'standard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Standard
                  </button>
                  <button 
                    onClick={() => setMode('reference')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'reference' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Reference
                  </button>
                </div>
              </div>

              {mode === 'reference' && (
                <div>
                  <label className="text-xs font-mono text-emerald-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Reference Key
                  </label>
                  
                  {!refData ? (
                    <div 
                      className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                      onClick={() => document.getElementById('ref-upload')?.click()}
                    >
                      <input 
                        type="file" 
                        id="ref-upload" 
                        className="hidden" 
                        accept="image/*,.pdf,.txt"
                        onChange={(e) => e.target.files?.[0] && handleRefUpload(e.target.files[0])}
                      />
                      {isAnalyzingRef ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                          <Loader2 size={24} className="animate-spin" />
                          <span className="text-[10px] font-mono">ANALYZING...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-emerald-400">
                          <Upload size={24} />
                          <span className="text-[10px] font-mono">UPLOAD KEY</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-emerald-400 font-bold text-xs font-mono">KEY ANALYZED</div>
                        <button onClick={() => setRefData(null)} className="text-emerald-400/50 hover:text-emerald-400"><X size={12} /></button>
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono mb-2">
                        {refData.summary.substring(0, 50)}...
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400/80">
                        <CheckCircle2 size={10} />
                        <span>{refData.answers.length} Answers Extracted</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-3">Context / Instructions</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-mono h-32 focus:border-indigo-500/50 focus:outline-none resize-none"
                  placeholder="E.g., 'Focus on step-by-step logic', 'Strict grading on grammar'..."
                  value={gradingContext}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-black/40 p-6 sm:p-10 flex flex-col items-center justify-center overflow-y-auto">
            
            {step === 1 && (
              <div className="w-full max-w-2xl text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white font-sci-fi">UPLOAD STUDENT PAPER</h3>
                  <p className="text-slate-400 text-sm">Supported formats: JPG, PNG, PDF (Max 10MB)</p>
                </div>

                <div 
                  className="border-2 border-dashed border-white/10 rounded-3xl p-12 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group"
                  onClick={() => document.getElementById('student-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="student-upload" 
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={(e) => {
                        if(e.target.files?.[0]) {
                            setStudentFile(e.target.files[0]);
                            setStep(2);
                        }
                    }}
                  />
                  <div className="flex flex-col items-center gap-4 text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText size={40} />
                    </div>
                    <span className="text-lg font-mono tracking-widest">DRAG & DROP OR CLICK</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && studentFile && (
              <div className="w-full max-w-2xl space-y-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
                  {studentFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(studentFile)} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                  ) : (
                    <div className="w-24 h-24 bg-white/5 rounded-xl flex items-center justify-center">
                        <FileText size={32} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">{studentFile.name}</h4>
                    <p className="text-slate-400 text-xs font-mono">{(studentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => { setStudentFile(null); setStep(1); }} className="text-slate-500 hover:text-white"><X /></button>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={handleGrade}
                    disabled={isGrading || (mode === 'reference' && !refData)}
                    className={`
                        px-8 py-4 rounded-xl font-bold font-sci-fi tracking-widest text-sm flex items-center gap-3 transition-all
                        ${isGrading ? 'bg-indigo-600/50 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/25 active:scale-95'}
                        ${(mode === 'reference' && !refData) ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                    `}
                  >
                    {isGrading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            ANALYZING NEURAL PATTERNS...
                        </>
                    ) : (
                        <>
                            <Brain size={18} />
                            INITIATE GRADING SEQUENCE
                        </>
                    )}
                  </button>
                </div>
                
                {mode === 'reference' && !refData && (
                    <div className="text-center text-amber-400 text-xs font-mono flex items-center justify-center gap-2">
                        <AlertTriangle size={14} />
                        REFERENCE KEY REQUIRED FOR THIS MODE
                    </div>
                )}
              </div>
            )}

            {step === 3 && result && (
              <div className="w-full h-full flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
                    
                    {/* Left: Student Paper Preview (Side-by-Side) */}
                    <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden">
                        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText size={12} /> Student Submission
                        </h4>
                        <div className="flex-1 bg-black/40 rounded-xl border border-white/5 overflow-auto flex items-center justify-center relative">
                            {studentFile && studentFile.type.startsWith('image/') ? (
                                <img 
                                    src={URL.createObjectURL(studentFile)} 
                                    alt="Student Work" 
                                    className="max-w-full max-h-full object-contain" 
                                />
                            ) : (
                                <div className="text-center p-6">
                                    <FileText size={48} className="text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 text-xs font-mono">{studentFile?.name}</p>
                                    <p className="text-slate-600 text-[10px] mt-1">Preview unavailable for this format</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Grading Results */}
                    <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                            {/* Score Card */}
                            <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-1">Total Score</div>
                                    <div className="text-3xl font-bold text-white font-sci-fi">{result.score} <span className="text-sm text-white/50">/ 100</span></div>
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center text-sm font-bold text-white bg-indigo-500/20">
                                    {result.score}%
                                </div>
                            </div>

                            {/* Match Score (Ref Mode) */}
                            {result.reference_match_score !== undefined && (
                                <div className="bg-emerald-600/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">Key Match</div>
                                        <div className="text-3xl font-bold text-white font-sci-fi">{result.reference_match_score}%</div>
                                    </div>
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                </div>
                            )}
                            
                            {/* Student Info */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Student Detected</div>
                                <div className="text-lg font-bold text-white truncate">{result.student}</div>
                            </div>

                            {/* Grading Confidence */}
                            {result.grading_confidence !== undefined && (
                              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">AI Confidence</div>
                                <div className="text-lg font-bold text-white truncate">{(result.grading_confidence * 100).toFixed(0)}%</div>
                              </div>
                            )}
                        </div>

                        <div className="flex-1 grid grid-cols-1 gap-6 overflow-y-auto custom-scrollbar pr-2">
                            {/* Flags / Alerts */}
                            {result.flags && result.flags.length > 0 && (
                              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={18} />
                                <div>
                                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Grading Alerts</h4>
                                  <ul className="space-y-1">
                                    {result.flags.map((flag: string, i: number) => (
                                      <li key={i} className="text-xs text-rose-300">• {flag}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* Feedback */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-white font-sci-fi mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-400" />
                                    DETAILED FEEDBACK
                                </h4>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="whitespace-pre-line text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                                </div>
                            </div>

                            {/* Insights & Annotations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Insights */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h4 className="text-sm font-bold text-white font-sci-fi mb-4 flex items-center gap-2">
                                        <Brain size={16} className="text-amber-400" />
                                        AI INSIGHTS
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2">Strengths</div>
                                            <div className="flex flex-wrap gap-2">
                                                {result.insights?.strengths?.map((s: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-2">Areas for Improvement</div>
                                            <div className="flex flex-wrap gap-2">
                                                {result.insights?.weaknesses?.map((s: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Annotations */}
                                {result.annotations && result.annotations.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-sm font-bold text-white font-sci-fi mb-4 flex items-center gap-2">
                                            <Eye size={16} className="text-cyan-400" />
                                            SPECIFIC OBSERVATIONS
                                        </h4>
                                        <div className="space-y-3">
                                            {result.annotations.map((ann: any, i: number) => (
                                                <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/5 text-xs">
                                                    <span className="text-indigo-400 font-bold mr-2">{ann.point}:</span>
                                                    <span className="text-slate-300">{ann.comment}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => { setStep(1); setStudentFile(null); setResult(null); }}
                                className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-colors"
                            >
                                GRADE ANOTHER
                            </button>
                            <button 
                                onClick={handleExport}
                                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all">
                                <Save size={16} /> EXPORT REPORT
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGrader;

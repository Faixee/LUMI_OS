
import React, { useState } from 'react';
import { generateParentReport } from '../services/geminiService';
import { Shield, FileText, Mail, Activity, AlertTriangle, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Student } from '../types';

const ParentAIGuardian: React.FC = () => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftMode, setDraftMode] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  
  // Drafting State
  const [selectedSubject, setSelectedSubject] = useState('Math');
  const [selectedTone, setSelectedTone] = useState('Professional');

  const generateReport = async () => {
      setLoading(true);
      const mockStudent: Student = {
          id: 'ali-rahman',
          name: "Ali Rahman",
          gradeLevel: 10,
          gpa: 3.5,
          attendance: 85,
          behaviorScore: 92,
          notes: ''
      };
      try {
          const res = await generateParentReport(mockStudent);
          setReport(res);
      } catch {
          setReport('> AI is currently unavailable. Please try again in a moment.');
      } finally {
          setLoading(false);
          setDraftMode(false);
      }
  };

  const openDrafter = () => {
      setDraftMode(true);
      setReport('');
      setEmailDraft('');
  };

  const generateEmailWithAI = async () => {
      if (!selectedSubject) return;
      setLoading(true);
      
      // Simulate AI generation delay
      await new Promise(r => setTimeout(r, 1500));
      
      const teacherName = selectedSubject === 'Math' ? 'Mr. Anderson' : selectedSubject === 'Science' ? 'Ms. Frizzle' : 'Mrs. Smith';
      
      let prompt = `Subject: Regarding Ali Rahman's progress in ${selectedSubject}\n\nDear ${teacherName},\n\n`;
      
      if (selectedTone === 'Concerned') {
          prompt += `I hope you are having a good week. I've been reviewing Ali's recent grades on the LumiX Portal, and I'm quite worried about his drop in performance in ${selectedSubject}. He seems to be struggling with the latest concepts.\n\nCould we perhaps schedule a brief call to discuss how we can support him better at home?`;
      } else if (selectedTone === 'Urgent') {
          prompt += `I am writing to urgently discuss Ali's recent behavior in ${selectedSubject}. I noticed the alerts on the dashboard and want to address this immediately before it impacts his final grade.\n\nPlease let me know when you are available for a meeting.`;
      } else {
          prompt += `I noticed on the dashboard that Ali has an upcoming project in ${selectedSubject}. I just wanted to check in and see if there are any specific materials or support he needs from us to ensure he stays on track.\n\nThank you for your continued support.`;
      }
      
      prompt += `\n\nBest regards,\nDr. Ahmed`;
      
      setEmailDraft(prompt);
      setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 h-[calc(100vh-8rem)] flex flex-col">
        <div>
            <h2 className="text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-3">
                <Shield size={32} className="text-emerald-400" />
                AI GUARDIAN
            </h2>
            <p className="text-emerald-400/70 font-mono text-xs mt-1">AUTOMATED PROGRESS MONITORING & ASSISTANCE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Action Cards */}
            <div onClick={generateReport} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity size={24} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-white font-sci-fi text-lg">Generate Pulse Report</h3>
                <p className="text-xs text-slate-400 mt-2">Get a simple, plain-English summary of your child's week across all subjects.</p>
            </div>

            <div onClick={openDrafter} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Mail size={24} className="text-indigo-400" />
                </div>
                <h3 className="font-bold text-white font-sci-fi text-lg">Draft Teacher Inquiry</h3>
                <p className="text-xs text-slate-400 mt-2">AI will help you write a professional email addressing specific concerns.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-900/5">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} className="text-rose-500" />
                    <span className="text-xs font-bold text-rose-400 font-mono uppercase">Active Alerts</span>
                </div>
                <ul className="space-y-3">
                    <li className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span>
                        Attendance below 85% in Math.
                    </li>
                    <li className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                        Upcoming Fee Due: 15th Oct.
                    </li>
                </ul>
            </div>
        </div>

        {/* Content Display */}
        {(report || draftMode) && (
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden animate-in fade-in duration-500 flex-1 min-h-0">
                <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                    <h3 className="font-bold text-white font-sci-fi flex items-center gap-2">
                        {draftMode ? <Mail size={18} /> : <FileText size={18} />}
                        {draftMode ? 'SMART EMAIL COMPOSER' : 'WEEKLY PULSE REPORT'}
                    </h3>
                    {loading && <span className="text-xs font-mono text-emerald-400 animate-pulse">AI PROCESSING...</span>}
                </div>
                
                <div className="p-8 bg-slate-900/50 min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-32 space-y-3">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-mono text-slate-500">SYNTHESIZING ACADEMIC DATA...</p>
                        </div>
                    ) : (
                        draftMode ? (
                            <div className="space-y-6">
                                {/* AI Controls */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-indigo-300 uppercase">Target Subject</label>
                                        <select 
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="Math">Mathematics (Mr. Anderson)</option>
                                            <option value="Science">Physics (Ms. Frizzle)</option>
                                            <option value="History">History (Mrs. Smith)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-indigo-300 uppercase">Email Tone</label>
                                        <select 
                                            value={selectedTone}
                                            onChange={(e) => setSelectedTone(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="Professional">Professional & Inquiry</option>
                                            <option value="Concerned">Concerned & Supportive</option>
                                            <option value="Urgent">Urgent Issue</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={generateEmailWithAI}
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/40 rounded-xl font-bold font-sci-fi transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} /> GENERATE DRAFT WITH AI
                                </button>

                                <div className="relative">
                                    <textarea 
                                        className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-slate-300 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                        value={emailDraft}
                                        onChange={(e) => setEmailDraft(e.target.value)}
                                        placeholder="AI generated draft will appear here..."
                                    />
                                    {!emailDraft && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                                            <Mail size={48} className="text-slate-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{report}</ReactMarkdown>
                            </div>
                        )
                    )}

                    {draftMode && emailDraft && !loading && (
                        <div className="flex justify-end gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                             <button onClick={() => setDraftMode(false)} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-colors">Discard</button>
                             <button className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sci-fi text-sm shadow-lg flex items-center gap-2">
                                <Send size={14} /> SEND TO TEACHER
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default ParentAIGuardian;

import React, { useState } from 'react';
import { Book, Layers, HelpCircle, Loader2, Sparkles, Plus, Play, RotateCw, CheckCircle2, XCircle } from 'lucide-react';
import { generateSyllabus, generateFlashcards, generateStructuredQuiz } from '../services/geminiService';

type Mode = 'syllabus' | 'flashcards' | 'quiz';

const Flashcard: React.FC<{ card: any }> = ({ card }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="group h-48 w-full [perspective:1000px]" onClick={() => setFlipped(!flipped)}>
      <div className={`relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] cursor-pointer ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-xl border border-emerald-500/30 rounded-xl flex items-center justify-center p-6 text-center [backface-visibility:hidden]">
          <h3 className="text-xl font-bold text-emerald-300 font-sci-fi tracking-wide">{card.term}</h3>
          <div className="absolute bottom-4 right-4 text-emerald-500/50 text-xs font-mono">CLICK TO REVEAL</div>
        </div>
        <div className="absolute inset-0 bg-black/80 border border-emerald-500 rounded-xl flex items-center justify-center p-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-sm text-slate-200 leading-relaxed">{card.def}</p>
        </div>
      </div>
    </div>
  );
};

const GenesisEngine: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('syllabus');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Inputs
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setGeneratedData(null);
    setQuizAnswers({});
    setError(null);

    try {
      let data;
      if (activeMode === 'syllabus') {
        data = await generateSyllabus(topic, grade, weeks);
      } else if (activeMode === 'flashcards') {
        data = await generateFlashcards(topic, 5);
      } else {
        data = await generateStructuredQuiz(topic, 5);
      }
      setGeneratedData(data);
    } catch (e) {
      setError('AI is currently unavailable. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const getColor = (mode: Mode) => {
    switch (mode) {
      case 'syllabus': return 'text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]';
      case 'flashcards': return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.2)]';
      case 'quiz': return 'text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
    }
  };

  const getBgColor = (mode: Mode) => {
    switch (mode) {
      case 'syllabus': return 'bg-amber-500';
      case 'flashcards': return 'bg-emerald-500';
      case 'quiz': return 'bg-indigo-500';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] w-full animate-in fade-in duration-500">
      
      {/* 1. TOP BAR NAVIGATION */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-2xl w-full sm:w-fit mx-auto">
        <button
          onClick={() => { setActiveMode('syllabus'); setGeneratedData(null); }}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-sci-fi tracking-wider text-xs sm:text-base transition-all duration-300 flex-1 sm:flex-none ${activeMode === 'syllabus' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Book size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">SYLLABUS</span><span className="sm:hidden">SYL</span>
        </button>
        <button
          onClick={() => { setActiveMode('flashcards'); setGeneratedData(null); }}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-sci-fi tracking-wider text-xs sm:text-base transition-all duration-300 flex-1 sm:flex-none ${activeMode === 'flashcards' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Layers size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">FLASHCARDS</span><span className="sm:hidden">CRD</span>
        </button>
        <button
          onClick={() => { setActiveMode('quiz'); setGeneratedData(null); }}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-sci-fi tracking-wider text-xs sm:text-base transition-all duration-300 flex-1 sm:flex-none ${activeMode === 'quiz' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">QUIZ BUILDER</span><span className="sm:hidden">QUZ</span>
        </button>
      </div>

      {/* 2. SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
        
        {/* LEFT PANEL: INPUTS */}
        <div className="w-full lg:w-1/3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto custom-scrollbar relative overflow-hidden group flex-shrink-0">
           <div className={`absolute top-0 left-0 w-full h-1 ${getBgColor(activeMode)} opacity-50`}></div>
           
           <div className="space-y-2">
             <h2 className={`text-2xl font-bold font-sci-fi tracking-widest ${activeMode === 'syllabus' ? 'text-amber-400' : activeMode === 'flashcards' ? 'text-emerald-400' : 'text-indigo-400'}`}>
               INPUT PARAMETERS
             </h2>
             <p className="text-xs font-mono text-slate-500 uppercase">Define generation vector</p>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Core Topic / Concept</label>
               <input 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="e.g. Quantum Mechanics, World War II"
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:border-white/30 outline-none transition-all font-mono"
               />
             </div>

             {activeMode === 'syllabus' && (
               <>
                 <div>
                   <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Target Grade Level</label>
                   <select 
                     value={grade}
                     onChange={(e) => setGrade(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none font-mono"
                   >
                     <option value="" disabled>Select Grade</option>
                     <optgroup label="Primary/Elementary" className="bg-slate-900 text-slate-400">
                       <option value="beginner">Beginners (Pre-K/K)</option>
                       <option value="1">Grade 1</option>
                       <option value="2">Grade 2</option>
                       <option value="3">Grade 3</option>
                       <option value="4">Grade 4</option>
                       <option value="5">Grade 5</option>
                     </optgroup>
                     <optgroup label="Middle School" className="bg-slate-900 text-slate-400">
                       <option value="6">Grade 6</option>
                       <option value="7">Grade 7</option>
                       <option value="8">Grade 8</option>
                     </optgroup>
                     <optgroup label="High School" className="bg-slate-900 text-slate-400">
                       <option value="9">Grade 9</option>
                       <option value="10">Grade 10</option>
                       <option value="11">Grade 11</option>
                       <option value="12">Grade 12</option>
                     </optgroup>
                     <optgroup label="Higher Education" className="bg-slate-900 text-slate-400">
                       <option value="undergrad">Undergraduate (University)</option>
                       <option value="postgrad">Postgraduate (Masters/PhD)</option>
                     </optgroup>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Duration (Weeks): {weeks}</label>
                   <input 
                     type="range" min="1" max="12" value={weeks} onChange={(e) => setWeeks(e.target.value)}
                     className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                   />
                 </div>
               </>
             )}
           </div>

           <div className="mt-auto">
             <button
               onClick={handleGenerate}
               disabled={loading || !topic}
               className={`w-full py-4 rounded-xl font-bold font-sci-fi tracking-widest text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                 activeMode === 'syllabus' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20' :
                 activeMode === 'flashcards' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' :
                 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
               }`}
             >
               {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
               INITIATE GENESIS
             </button>
           </div>
        </div>

        {/* RIGHT PANEL: OUTPUT (HOLO-PROJECTOR) */}
        <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden flex flex-col min-h-[500px]">
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,255,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-20"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="font-mono text-sm text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : generatedData ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                OUTPUT STREAM
              </h3>
              <div className="font-mono text-xs text-slate-600">SYS.VER.4.2</div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative w-24 h-24">
                  <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${activeMode === 'syllabus' ? 'border-amber-500' : activeMode === 'flashcards' ? 'border-emerald-500' : 'border-indigo-500'}`}></div>
                  <div className="absolute inset-4 rounded-full border-4 border-b-transparent animate-spin-reverse opacity-50 border-white"></div>
                </div>
                <p className="font-sci-fi text-xl tracking-widest animate-pulse text-white">FABRICATING CONTENT...</p>
                <p className="font-mono text-xs text-slate-500">Neural Engines Spinning Up</p>
              </div>
            ) : !generatedData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-40">
                <RotateCw size={64} className="mb-4" />
                <p className="font-mono text-sm tracking-widest">{error ? error.toUpperCase() : 'AWAITING INPUT VECTORS'}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                {/* MODE A: SYLLABUS OUTPUT */}
                {activeMode === 'syllabus' && (
                  <div className="space-y-0 relative pl-8 border-l-2 border-amber-500/20 ml-6 py-4">
                    {generatedData.map((item: any, idx: number) => (
                      <div key={idx} className="relative group pl-8 pb-12 last:pb-0">
                        {/* Timeline Node */}
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-black border-2 border-amber-500 flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Connecting Line Glow */}
                        <div className="absolute -left-[34px] top-6 bottom-0 w-0.5 bg-amber-500/20 group-last:hidden"></div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-amber-500/40 transition-all hover:bg-white/10 group-hover:translate-x-2 duration-300 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <span className="font-sci-fi text-4xl font-bold text-amber-500">0{item.week}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-amber-400 font-mono text-xs uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Week {item.week}</span>
                             <h4 className="text-xl font-bold text-white font-sci-fi tracking-wide">{item.topic}</h4>
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-4 leading-relaxed font-sans border-l-2 border-white/10 pl-3">{item.details}</p>
                          
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono uppercase tracking-wider shadow-sm">
                            <Sparkles size={14} className="text-amber-400" /> 
                            <span>Mission: {item.activity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MODE B: FLASHCARDS OUTPUT */}
                {activeMode === 'flashcards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {generatedData.map((card: any, idx: number) => (
                      <Flashcard key={idx} card={card} />
                    ))}
                  </div>
                )}

                {/* MODE C: QUIZ OUTPUT */}
                {activeMode === 'quiz' && (
                  <div className="space-y-6 max-w-3xl mx-auto py-4">
                    {generatedData.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden transition-all hover:border-indigo-500/30">
                        {/* Question Header */}
                        <div className="flex gap-4 mb-6">
                          <span className="flex-shrink-0 w-8 h-8 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-mono font-bold">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-lg font-bold text-white font-sans leading-relaxed pt-1">{q.q}</h4>
                        </div>

                        {/* Options Grid */}
                        <div className="grid gap-3">
                          {q.options.map((opt: string, oIdx: number) => {
                            const isSelected = quizAnswers[qIdx] === oIdx;
                            const isCorrect = q.correct === oIdx;
                            const hasAnswered = quizAnswers[qIdx] !== undefined;
                            
                            let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300";
                            
                            if (hasAnswered) {
                              if (isCorrect) {
                                btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                              } else if (isSelected && !isCorrect) {
                                btnClass = "bg-rose-500/20 border-rose-500/50 text-rose-300";
                              } else {
                                btnClass = "opacity-50 grayscale border-transparent";
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={hasAnswered}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 flex justify-between items-center group ${btnClass}`}
                              >
                                <span className="font-mono text-sm">{opt}</span>
                                {hasAnswered && isCorrect && <CheckCircle2 size={20} className="text-emerald-400 animate-in zoom-in spin-in-90 duration-300" />}
                                {hasAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-rose-400 animate-in zoom-in duration-300" />}
                                {!hasAnswered && <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-indigo-400 transition-colors"></div>}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Result Feedback */}
                        {quizAnswers[qIdx] !== undefined && (
                          <div className={`mt-4 text-xs font-mono uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${q.correct === quizAnswers[qIdx] ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {q.correct === quizAnswers[qIdx] ? 'Correct Answer' : 'Incorrect Selection'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GenesisEngine;

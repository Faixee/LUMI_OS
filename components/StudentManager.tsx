/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */


import React, { useState } from 'react';
import { Student, AgentName } from '../types';
import { Search, Trash2, Brain, AlertCircle, ScanLine, UserPlus, Fingerprint, CheckCircle2 } from 'lucide-react';
import { checkEthics } from '../services/geminiService';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onRunAstra: (student: Student) => void;
  logAgentAction: (agent: AgentName, action: string, status: 'success' | 'warning' | 'error' | 'processing', details?: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, onAddStudent, onDeleteStudent, onRunAstra, logAgentAction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    gradeLevel: 9,
    gpa: 0,
    attendance: 100,
    behaviorScore: 100,
    notes: ''
  });
  const [isCheckingEthics, setIsCheckingEthics] = useState(false);
  const [ethicsError, setEthicsError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({
      ...prev,
      [name]: name === 'notes' || name === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name) return;

    // Lexi Check
    setIsCheckingEthics(true);
    setEthicsError(null);
    logAgentAction(AgentName.LEXI, "Initiating ethical compliance scan...", "processing");
    
    const ethicsResult = await checkEthics(newStudent.notes || "");
    setIsCheckingEthics(false);

    if (!ethicsResult.isSafe) {
      setEthicsError(ethicsResult.message);
      logAgentAction(AgentName.LEXI, "ETHICAL VIOLATION DETECTED", "error", ethicsResult.message);
      return;
    }

    logAgentAction(AgentName.LEXI, "Record cleared for insertion", "success");

    const student: Student = {
      id: `s${Date.now()}`,
      name: newStudent.name,
      gradeLevel: newStudent.gradeLevel || 9,
      gpa: newStudent.gpa || 0,
      attendance: newStudent.attendance || 100,
      behaviorScore: newStudent.behaviorScore || 100,
      notes: newStudent.notes || '',
      riskLevel: 'Low' // Default
    };

    onAddStudent(student);
    setIsModalOpen(false);
    setNewStudent({
      name: '',
      gradeLevel: 9,
      gpa: 0,
      attendance: 100,
      behaviorScore: 100,
      notes: ''
    });
    
    // Auto-trigger Astra
    logAgentAction(AgentName.ASTRA, "Submitting to predictive engine", "processing");
    onRunAstra(student);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-sci-fi text-glow tracking-tight flex items-center gap-3">
             <Fingerprint size={28} className="text-indigo-400" />
             STUDENT DATABASE
          </h2>
          <p className="text-indigo-400/60 font-mono text-[10px] sm:text-xs mt-1 tracking-widest uppercase">SECURE RECORD MANAGEMENT</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 touch-manipulation"
        >
          <UserPlus size={18} />
          ADD STUDENT
        </button>
      </div>

      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <ScanLine className="text-indigo-400 group-focus-within:text-cyan-400 transition-colors" size={18} />
        </div>
        <input 
          type="text"
          placeholder="SEARCH BIOMETRIC RECORDS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredStudents.map(student => (
          <div 
            key={student.id} 
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-300 group relative overflow-hidden"
          >
            {/* ID Badge */}
            <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-600 tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">
              ID: {student.id}
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold font-sci-fi text-xl">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white truncate max-w-[140px]">{student.name}</h3>
                <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Grade {student.gradeLevel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter mb-1">GPA Score</div>
                <div className="text-xl font-bold text-cyan-400 font-sci-fi">{student.gpa.toFixed(2)}</div>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter mb-1">Attendance</div>
                <div className="text-xl font-bold text-emerald-400 font-sci-fi">{student.attendance}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  student.riskLevel === 'Low' ? 'bg-emerald-500' :
                  student.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">{student.riskLevel} Risk</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onRunAstra(student)}
                  className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors active:scale-90 touch-manipulation"
                  title="Run Predictive Analysis"
                >
                  <Brain size={18} />
                </button>
                <button 
                  onClick={() => onDeleteStudent(student.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-90 touch-manipulation"
                  title="Expunge Record"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4">
              <Search className="text-slate-500" size={24} />
            </div>
            <p className="text-slate-500 font-mono tracking-widest uppercase text-sm">No biometric records found matching your query</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-0 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 border border-indigo-500/30 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500"></div>
            
            <div className="bg-[#0a0a15] p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white font-sci-fi flex items-center gap-3 tracking-wide">
                    <ScanLine size={24} className="text-cyan-400" />
                    NEW IDENTITY ENTRY
                </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#0a0a15]/80">
              <div>
                <label className="block text-[10px] text-cyan-400 font-mono mb-2 uppercase tracking-[0.2em]">Full Designation</label>
                <input required name="name" value={newStudent.name} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none font-sci-fi text-lg tracking-wide" placeholder="ENTER NAME..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] text-cyan-400 font-mono mb-2 uppercase tracking-[0.2em]">Grade Level</label>
                  <input type="number" name="gradeLevel" value={newStudent.gradeLevel} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-400 font-mono mb-2 uppercase tracking-[0.2em]">GPA Factor</label>
                  <input type="number" step="0.1" max="4.0" name="gpa" value={newStudent.gpa} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 outline-none font-mono" />
                </div>
              </div>
              <div>
                 <label className="block text-[10px] text-cyan-400 font-mono mb-2 uppercase tracking-[0.2em]">Observations / Behavioral Notes</label>
                 <textarea name="notes" rows={3} value={newStudent.notes} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 outline-none font-mono text-sm" placeholder="Raw behavioral data..." />
                 <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
                    <Brain size={12} className="text-purple-400" />
                    LEXI ETHICS ENGINE: <span className="text-emerald-500">ACTIVE</span>
                 </p>
              </div>

              {ethicsError && (
                <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-rose-200">
                    <p className="font-bold font-sci-fi tracking-wide">VIOLATION DETECTED</p>
                    <p className="text-xs opacity-80 font-mono mt-1">{ethicsError}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 hover:text-white font-mono text-xs tracking-widest hover:bg-white/5 rounded-xl transition-all">ABORT</button>
                <button 
                  type="submit" 
                  disabled={isCheckingEthics}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold font-sci-fi tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center gap-2"
                >
                  {isCheckingEthics ? <ScanLine className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isCheckingEthics ? 'SCANNING...' : 'CONFIRM ENTRY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;

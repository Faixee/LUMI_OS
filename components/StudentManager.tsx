
import React, { useState } from 'react';
import { Student, AgentName } from '../types';
import { Plus, Search, Trash2, Brain, AlertCircle, ScanLine, UserPlus, Fingerprint, Activity, ChevronRight } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white font-sci-fi text-glow tracking-tight flex items-center gap-3">
             <Fingerprint size={32} className="text-indigo-400" />
             STUDENT DATABASE
          </h2>
          <p className="text-indigo-400/60 font-mono text-xs mt-1 tracking-widest uppercase">SECURE RECORD MANAGEMENT • ENCRYPTION: AES-256</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/50 px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
        >
          <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <UserPlus size={18} className="relative z-10" /> 
          <span className="relative z-10 font-bold font-sci-fi tracking-widest">NEW ENTRY</span>
        </button>
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <div className="relative flex items-center bg-[#0a0a15] rounded-xl border border-white/10">
            <Search className="absolute left-4 text-indigo-400" size={20} />
            <input 
            type="text" 
            placeholder="SEARCH DATABASE BY ID OR DESIGNATION..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-white pl-12 pr-4 py-4 focus:ring-0 font-mono text-sm placeholder-slate-600 tracking-wide"
            />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500 opacity-50"></div>
        
        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 font-sci-fi text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white font-sci-fi text-lg tracking-wide">{student.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-wider">ID: {student.id}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${
                  student.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  student.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {student.riskLevel}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-black/20 p-2 rounded flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 uppercase">GPA</span>
                  <span className={`font-mono font-bold ${student.gpa >= 3.0 ? 'text-emerald-400' : 'text-amber-400'}`}>{student.gpa.toFixed(2)}</span>
                </div>
                <div className="bg-black/20 p-2 rounded flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 uppercase">PERC</span>
                  <span className={`font-mono font-bold ${student.gpa >= 3.0 ? 'text-emerald-400' : 'text-amber-400'}`}>{((student.gpa / 4) * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-black/20 p-2 rounded flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 uppercase">ATT</span>
                  <span className={`font-mono font-bold ${student.attendance >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>{student.attendance}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => onRunAstra(student)} className="flex-1 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 text-xs font-mono flex items-center justify-center gap-2">
                  <Brain size={14} /> ASTRA
                </button>
                <button onClick={() => onDeleteStudent(student.id)} className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em]">
                <th className="p-6 font-semibold opacity-70">Identity</th>
                <th className="p-6 font-semibold opacity-70">Grade</th>
                <th className="p-6 font-semibold opacity-70">Metrics</th>
                <th className="p-6 font-semibold opacity-70">Risk Vector</th>
                <th className="p-6 font-semibold opacity-70">Astra Prediction</th>
                <th className="p-6 font-semibold text-right opacity-70">Protocols</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-all duration-200 group relative">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 font-sci-fi text-lg">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-white font-sci-fi text-lg tracking-wide group-hover:text-cyan-300 transition-colors">{student.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono tracking-wider">ID: <span className="text-slate-400">{student.id}</span></div>
                        </div>
                    </div>
                  </td>
                  <td className="p-6 text-slate-300 font-mono text-sm">
                      <span className="bg-white/5 px-3 py-1 rounded border border-white/10">Year {student.gradeLevel}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold font-mono ${student.gpa >= 3.5 ? 'text-emerald-400' : student.gpa >= 2.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {student.gpa.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-slate-600 uppercase">GPA</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold font-mono ${student.gpa >= 3.5 ? 'text-emerald-400' : student.gpa >= 2.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {((student.gpa / 4) * 100).toFixed(0)}%
                            </span>
                            <span className="text-[9px] text-slate-600 uppercase">PERC</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold font-mono ${student.attendance >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {student.attendance}%
                            </span>
                            <span className="text-[9px] text-slate-600 uppercase">ATT</span>
                        </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md flex w-fit items-center gap-2 ${
                      student.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' :
                      student.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      <Activity size={12} />
                      {student.riskLevel || 'ANALYZING'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                         {student.predictedOutcome ? (
                            <span className="text-xs text-indigo-300/80 font-mono border-l-2 border-indigo-500/50 pl-2 line-clamp-2 max-w-[200px]">
                                {student.predictedOutcome}
                            </span>
                         ) : (
                            <span className="text-[10px] text-slate-600 font-mono animate-pulse flex items-center gap-1">
                                <ScanLine size={10} /> AWAITING ANALYSIS
                            </span>
                         )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={() => onRunAstra(student)}
                        title="Run Astra Prediction"
                        className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-400 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        >
                        <Brain size={16} />
                        </button>
                        <button 
                        onClick={() => onDeleteStudent(student.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-400 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    NO RECORDS FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg p-0 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-indigo-500/30 relative">
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

// Missing Import fix
import { CheckCircle2 } from 'lucide-react';

export default StudentManager;

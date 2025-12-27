import React from 'react';
import { Student } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  students: Student[];
}

const AnalyticsDashboard: React.FC<AnalyticsViewProps> = ({ students }) => {
  if (students.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 p-10 bg-white/5 rounded-3xl border border-white/5">
              <BarChart3 size={48} className="text-slate-700 mb-4" />
              <h2 className="text-xl font-bold font-sci-fi mb-2 tracking-widest uppercase">No Data Stream</h2>
              <p className="font-mono text-xs opacity-60">Add students to the system to visualize analytics.</p>
          </div>
      );
  }

  const data = students.map(s => ({
    x: s.attendance,
    y: s.gpa,
    z: s.behaviorScore,
    name: s.name,
    risk: s.riskLevel
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
              <BarChart3 size={24} className="text-cyan-400" />
              ANALYTICS ENGINE
            </h2>
            <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-mono tracking-widest uppercase opacity-70">Deep dive correlation analysis</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <TrendingUp size={16} className="text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">Live Monitoring</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-6 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap size={64} className="text-cyan-400" />
             </div>
             <h3 className="text-base sm:text-lg font-bold text-white font-sci-fi mb-2 flex items-center gap-2">
               <TrendingUp size={18} className="text-cyan-400" />
               CORRELATION MATRIX
             </h3>
             <p className="text-[10px] sm:text-xs text-slate-400 mb-8 font-mono uppercase tracking-wider opacity-60">Attendance Record vs. GPA Metrics</p>
             <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Attendance" 
                      unit="%" 
                      stroke="#475569" 
                      fontSize={10}
                      tickFormatter={(val) => `${val}%`}
                      domain={[0, 100]} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="GPA" 
                      stroke="#475569" 
                      fontSize={10}
                      domain={[0, 4]} 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        color: '#f1f5f9',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }} 
                    />
                    <Legend iconType="circle" />
                    <Scatter name="Students" data={data} fill="#8884d8">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.risk === 'High' ? '#f43f5e' : entry.risk === 'Medium' ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-6 flex flex-col">
             <h3 className="text-base sm:text-lg font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
               <AlertCircle size={18} className="text-amber-400" />
               COHORT DISTRIBUTION
             </h3>
             <div className="space-y-6 sm:space-y-8 flex-1">
                {[
                  { label: 'High Risk', count: data.filter(d => d.risk === 'High').length, color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
                  { label: 'Medium Risk', count: data.filter(d => d.risk === 'Medium').length, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
                  { label: 'Low Risk', count: data.filter(d => d.risk === 'Low').length, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' }
                ].map((risk) => (
                  <div key={risk.label} className="group">
                     <div className="flex justify-between text-[10px] sm:text-xs font-mono mb-2">
                       <span className="text-slate-400 uppercase tracking-widest">{risk.label} SECTOR</span>
                       <span className="text-white font-bold">{risk.count} STUDENTS</span>
                     </div>
                     <div className="w-full bg-white/5 rounded-full h-2 sm:h-2.5 p-[1px] border border-white/5">
                       <div 
                         className={`${risk.color} ${risk.shadow} h-full rounded-full transition-all duration-1000 shadow-lg`} 
                         style={{ width: `${(risk.count / data.length) * 100}%` }}
                       ></div>
                     </div>
                  </div>
                ))}
             </div>

             <div className="mt-8 bg-black/40 p-4 sm:p-5 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors"></div>
                <h4 className="text-cyan-400 text-[10px] sm:text-xs font-bold font-sci-fi mb-3 tracking-widest uppercase flex items-center gap-2">
                  <Zap size={14} />
                  LUMIX OBSERVATION
                </h4>
                <p className="text-slate-400 text-[10px] sm:text-xs font-mono leading-relaxed opacity-80">
                  Data indicates a strong positive correlation between attendance rates above 90% and GPA &gt; 3.0.
                  Behavioral scores appear to be a trailing indicator for academic performance drops.
                </p>
             </div>
          </div>
        </div>
    </div>
  );
};

export default AnalyticsDashboard;

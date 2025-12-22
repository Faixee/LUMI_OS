import React from 'react';
import { Student } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface AnalyticsViewProps {
  students: Student[];
}

const AnalyticsDashboard: React.FC<AnalyticsViewProps> = ({ students }) => {
  if (students.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-10">
              <h2 className="text-xl font-bold font-sci-fi mb-2">NO DATA AVAILABLE</h2>
              <p>Add students to the system to visualize analytics.</p>
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
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold text-white">Lumen Analytics Engine</h2>
          <p className="text-slate-400">Deep dive correlation analysis.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
             <h3 className="text-lg font-semibold text-white mb-4">Attendance vs. GPA Correlation</h3>
             <p className="text-sm text-slate-400 mb-6">Visualizing the impact of attendance records on student grade point averages.</p>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="x" name="Attendance" unit="%" stroke="#94a3b8" domain={[0, 100]} />
                    <YAxis type="number" dataKey="y" name="GPA" stroke="#94a3b8" domain={[0, 4]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                    <Legend />
                    <Scatter name="Students" data={data} fill="#8884d8">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.risk === 'High' ? '#ef4444' : entry.risk === 'Medium' ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg flex flex-col justify-center">
             <h3 className="text-lg font-semibold text-white mb-4">Cohort Distribution Analysis</h3>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-sm text-slate-300 mb-2">
                     <span>High Risk Students</span>
                     <span>{data.filter(d => d.risk === 'High').length}</span>
                   </div>
                   <div className="w-full bg-slate-700 rounded-full h-2">
                     <div 
                       className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: `${(data.filter(d => d.risk === 'High').length / data.length) * 100}%` }}
                     ></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm text-slate-300 mb-2">
                     <span>Medium Risk Students</span>
                     <span>{data.filter(d => d.risk === 'Medium').length}</span>
                   </div>
                   <div className="w-full bg-slate-700 rounded-full h-2">
                     <div 
                       className="bg-amber-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: `${(data.filter(d => d.risk === 'Medium').length / data.length) * 100}%` }}
                     ></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm text-slate-300 mb-2">
                     <span>Low Risk Students</span>
                     <span>{data.filter(d => d.risk === 'Low').length}</span>
                   </div>
                   <div className="w-full bg-slate-700 rounded-full h-2">
                     <div 
                       className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: `${(data.filter(d => d.risk === 'Low').length / data.length) * 100}%` }}
                     ></div>
                   </div>
                </div>
             </div>

             <div className="mt-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h4 className="text-indigo-400 text-sm font-bold mb-2">LumiX Observation</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
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

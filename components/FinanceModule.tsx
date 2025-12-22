import React, { useEffect, useState } from 'react';
import { FeeRecord } from '../types';
import { analyzeFinancials } from '../services/geminiService';
import { DollarSign, PieChart, TrendingUp, AlertCircle, CheckCircle2, Bot } from 'lucide-react';

interface FinanceModuleProps {
  fees: FeeRecord[];
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ fees }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      const result = await analyzeFinancials(fees);
      setAnalysis(result);
      setLoading(false);
    };
    runAnalysis();
  }, [fees]);

  const totalCollected = fees.filter(f => f.status === 'Paid').reduce((acc, f) => acc + f.amount, 0);
  const totalPending = fees.filter(f => f.status === 'Pending').reduce((acc, f) => acc + f.amount, 0);
  const totalOverdue = fees.filter(f => f.status === 'Overdue').reduce((acc, f) => acc + f.amount, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white font-sci-fi text-glow">FINANCIAL CONTROL</h2>
        <p className="text-cyan-400/70 font-mono text-xs mt-1">REVENUE STREAMS • FEE COLLECTION • AI AUDIT</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><DollarSign size={64} /></div>
            <p className="text-slate-400 font-mono text-xs uppercase">Total Collected</p>
            <h3 className="text-3xl font-bold text-white font-sci-fi mt-2">PKR {totalCollected.toLocaleString()}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={64} /></div>
            <p className="text-slate-400 font-mono text-xs uppercase">Pending Invoices</p>
            <h3 className="text-3xl font-bold text-white font-sci-fi mt-2">PKR {totalPending.toLocaleString()}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><AlertCircle size={64} /></div>
            <p className="text-slate-400 font-mono text-xs uppercase">Overdue Amount</p>
            <h3 className="text-3xl font-bold text-white font-sci-fi mt-2">PKR {totalOverdue.toLocaleString()}</h3>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="glass-panel p-6 rounded-xl border border-indigo-500/30 bg-indigo-900/10">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Bot size={24} className="text-indigo-400" />
            </div>
            <div className="flex-1">
                <h4 className="text-lg font-bold text-white font-sci-fi mb-2">AI FINANCIAL AUDIT</h4>
                {loading ? (
                    <div className="flex gap-2 items-center text-xs font-mono text-indigo-300">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                        PROCESSING LEDGER DATA...
                    </div>
                ) : (
                    <p className="text-sm text-slate-300 leading-relaxed font-mono border-l-2 border-indigo-500 pl-4">
                        {analysis}
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* Fee Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white font-sci-fi">TRANSACTION LEDGER</h3>
            <button className="text-xs bg-indigo-600 px-3 py-1 rounded text-white font-mono hover:bg-indigo-500">EXPORT CSV</button>
        </div>
        <table className="w-full text-left">
            <thead>
                <tr className="text-xs text-slate-500 font-mono uppercase bg-black/20">
                    <th className="p-4">Invoice ID</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {fees.map(fee => (
                    <tr key={fee.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-xs opacity-70">{fee.id}</td>
                        <td className="p-4 font-semibold text-white">{fee.studentName}</td>
                        <td className="p-4">{fee.type}</td>
                        <td className="p-4 font-mono">PKR {fee.amount.toLocaleString()}</td>
                        <td className="p-4">{fee.dueDate}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                fee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                fee.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                                {fee.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceModule;
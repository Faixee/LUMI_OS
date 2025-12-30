/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

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
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-2">
            <DollarSign size={24} className="text-emerald-400" />
            FINANCIAL CONTROL
          </h2>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-mono tracking-widest uppercase opacity-70">Revenue Streams • Fee Collection • AI Audit</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <PieChart size={16} className="text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Live Ledger</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Total Collected', value: totalCollected, color: 'border-l-emerald-500', icon: DollarSign, textColor: 'text-emerald-400' },
          { label: 'Pending Invoices', value: totalPending, color: 'border-l-amber-500', icon: TrendingUp, textColor: 'text-amber-400' },
          { label: 'Overdue Amount', value: totalOverdue, color: 'border-l-rose-500', icon: AlertCircle, textColor: 'text-rose-400' }
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border border-white/5 bg-white/5 p-5 sm:p-6 border-l-4 ${stat.color} relative overflow-hidden group transition-all hover:translate-y-[-2px]`}>
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={64} />
            </div>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-sci-fi">PKR {stat.value.toLocaleString()}</h3>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 sm:p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shrink-0">
                <Bot size={24} className="text-indigo-400" />
            </div>
            <div className="flex-1">
                <h4 className="text-base sm:text-lg font-bold text-white font-sci-fi mb-3 tracking-wider flex items-center gap-2">
                  AI FINANCIAL AUDIT
                  <span className="text-[10px] font-mono text-indigo-400 font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 uppercase">Autonomous</span>
                </h4>
                {loading ? (
                    <div className="flex gap-3 items-center text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Processing Ledger Data...
                    </div>
                ) : (
                    <div className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-mono border-l-2 border-indigo-500/30 pl-4 py-1">
                        {analysis}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Fee Ledger */}
      <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5">
        <div className="p-4 sm:p-5 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="font-bold text-white font-sci-fi tracking-wider text-sm sm:text-base uppercase">Transaction Ledger</h3>
            </div>
            <button className="w-full sm:w-auto text-[10px] font-bold font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-slate-300 transition-all active:scale-95 touch-manipulation uppercase tracking-widest">Export CSV</button>
        </div>
        
        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
              <thead>
                  <tr className="text-[10px] text-slate-500 font-mono uppercase bg-black/20 tracking-widest">
                      <th className="p-4 border-b border-white/5">Invoice ID</th>
                      <th className="p-4 border-b border-white/5">Student</th>
                      <th className="p-4 border-b border-white/5">Type</th>
                      <th className="p-4 border-b border-white/5">Amount</th>
                      <th className="p-4 border-b border-white/5">Due Date</th>
                      <th className="p-4 border-b border-white/5">Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-mono">
                  {fees.map(fee => (
                      <tr key={fee.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 opacity-50 group-hover:opacity-100">{fee.id}</td>
                          <td className="p-4 font-bold text-white font-sans">{fee.studentName}</td>
                          <td className="p-4 opacity-70 uppercase">{fee.type}</td>
                          <td className="p-4 font-bold text-emerald-400">PKR {fee.amount.toLocaleString()}</td>
                          <td className="p-4 opacity-70">{fee.dueDate}</td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
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

        {/* Mobile View Cards */}
        <div className="lg:hidden divide-y divide-white/5">
          {fees.map(fee => (
            <div key={fee.id} className="p-4 sm:p-5 hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{fee.id}</div>
                  <div className="text-sm font-bold text-white font-sans">{fee.studentName}</div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
                  fee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  fee.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {fee.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Type</div>
                  <div className="text-[10px] text-slate-300 font-mono uppercase">{fee.type}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono">PKR {fee.amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Due Date</div>
                  <div className="text-[10px] text-slate-300 font-mono">{fee.dueDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;
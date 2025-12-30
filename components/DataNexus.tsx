/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */


import React, { useState } from 'react';
import { Database, UploadCloud, Server, FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface DataNexusProps {
    onSync?: () => void;
}

const DataNexus: React.FC<DataNexusProps> = ({ onSync }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'connect'>('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // DB Connection States
  const [dbConfig, setDbConfig] = useState({
    host: '',
    port: '',
    connectionString: ''
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setProgress(10);

    // Simulate progress while uploading
    const timer = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
        await api.uploadCSV(file);
        clearInterval(timer);
        setProgress(100);
        setUploadStatus('success');
        if (onSync) onSync();
    } catch (e) {
        clearInterval(timer);
        setUploadStatus('error');
        setErrorMessage("Connection refused by Nexus Gateway");
    }
  };

  const handleTestConnection = async () => {
    if (!dbConfig.connectionString) {
      setTestStatus('error');
      setTestMessage('Connection string is required.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Initiating handshake...');

    try {
      const result = await api.testDbConnection(dbConfig.host, dbConfig.port, dbConfig.connectionString);
      setTestStatus('success');
      setTestMessage(result.message || 'Connection established successfully.');
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-3">
            <Server size={32} className="text-cyan-400" />
            NEXUS DATA BRIDGE
          </h2>
          <p className="text-slate-400 font-mono text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            SECURE PIPELINE ESTABLISHED • ENCRYPTION: TLS 1.3
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Method Selector */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 h-fit order-2 lg:order-1">
           <h3 className="text-lg font-bold text-white font-sci-fi mb-4">INGESTION METHOD</h3>
           
           <button 
             onClick={() => setActiveTab('upload')}
             className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${activeTab === 'upload' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
           >
             <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><FileSpreadsheet size={24} /></div>
             <div className="text-left">
                <div className="font-bold font-sci-fi">FILE IMPORT</div>
                <div className="text-[10px] font-mono opacity-70">CSV / EXCEL / JSON</div>
             </div>
           </button>

           <button 
             onClick={() => setActiveTab('connect')}
             className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${activeTab === 'connect' ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
           >
             <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400"><Database size={24} /></div>
             <div className="text-left">
                <div className="font-bold font-sci-fi">DATABASE SYNC</div>
                <div className="text-[10px] font-mono opacity-70">SQL / POSTGRES / ORACLE</div>
             </div>
           </button>
        </div>

        {/* Main Action Area */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden order-1 lg:order-2">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

          {activeTab === 'upload' ? (
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-6 min-h-[300px]">
               {(uploadStatus === 'idle' || uploadStatus === 'error') && (
                 <>
                    <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-slate-600 flex items-center justify-center animate-pulse group-hover:border-cyan-500">
                        <UploadCloud size={40} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white font-sci-fi">DRAG DATA SOURCE HERE</h3>
                        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                            Import CSV containing: name, grade_level, gpa, attendance.
                        </p>
                    </div>
                    <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold font-sci-fi tracking-wide transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer">
                        SELECT FILE LOCALLY
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {uploadStatus === 'error' && (
                        <p className="text-rose-400 text-xs font-mono">{errorMessage}</p>
                    )}
                 </>
               )}

               {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                  <div className="w-full max-w-md space-y-4">
                      <div className="flex justify-between text-xs font-mono text-cyan-400">
                          <span>UPLOADING TO CORE...</span>
                          <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 transition-all duration-100 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
               )}

               {uploadStatus === 'success' && (
                   <div className="space-y-4 animate-in zoom-in-50 duration-300">
                       <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/50">
                           <CheckCircle2 size={40} className="text-emerald-400" />
                       </div>
                       <h3 className="text-2xl font-bold text-white font-sci-fi">IMPORT COMPLETE</h3>
                       <p className="text-slate-400">Data synchronized with LumiX Core.</p>
                       <button onClick={() => setUploadStatus('idle')} className="text-sm text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 hover:text-cyan-300">
                           IMPORT ANOTHER BATCH
                       </button>
                   </div>
               )}
            </div>
          ) : (
            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck size={24} className="text-emerald-400" />
                    <h3 className="text-xl font-bold text-white font-sci-fi">DIRECT SQL CONNECTION</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Host / Server IP</label>
                        <input 
                            type="text" 
                            placeholder="192.168.1.X" 
                            value={dbConfig.host}
                            onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Port</label>
                        <input 
                            type="text" 
                            placeholder="5432" 
                            value={dbConfig.port}
                            onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none" 
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                         <label className="text-xs font-mono text-slate-400 uppercase">Connection String / API Key</label>
                         <input 
                            type="password" 
                            placeholder="postgres://user:pass@host:port/db" 
                            value={dbConfig.connectionString}
                            onChange={(e) => setDbConfig({...dbConfig, connectionString: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none" 
                        />
                    </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" />
                    <div className="text-xs text-amber-200/80 leading-relaxed">
                        <strong>Security Protocol:</strong> Direct database connections require whitelisting the LumiX System IP (104.22.15.XX) on your firewall. Ensure SSL mode is enabled.
                    </div>
                </div>

                {testStatus !== 'idle' && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                        testStatus === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 
                        testStatus === 'testing' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 
                        'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}>
                        {testStatus === 'success' ? <CheckCircle2 size={18} /> : 
                         testStatus === 'testing' ? <RefreshCw size={18} className="animate-spin" /> : 
                         <AlertTriangle size={18} />}
                        <span className="text-xs font-mono uppercase tracking-wider">{testMessage}</span>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold font-sci-fi transition-all ${
                            testStatus === 'testing' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                        <RefreshCw size={18} className={testStatus === 'testing' ? 'animate-spin' : ''} />
                        {testStatus === 'testing' ? 'NEURAL LINKING...' : 'TEST CONNECTION'}
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Information Panel */}
      <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-500 font-sci-fi text-xl shrink-0">
                  API
              </div>
              <div>
                  <h4 className="text-white font-bold font-sci-fi">DEVELOPER API ACCESS</h4>
                  <p className="text-xs text-slate-500 font-mono">Use the REST API to push data programmatically.</p>
              </div>
          </div>
          <button className="text-indigo-400 text-sm font-mono flex items-center gap-2 hover:text-indigo-300">
              VIEW DOCUMENTATION <ArrowRight size={14} />
          </button>
      </div>
    </div>
  );
};

export default DataNexus;

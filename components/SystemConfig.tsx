/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SchoolConfig } from '../types';
import { analyzeSchoolUrl } from '../services/geminiService';
import { api } from '../services/api';
import { Globe, RefreshCw, CheckCircle2, Cpu, Hash, Layout, Sparkles, AlertTriangle, Power, Shield, Zap, Server, Activity, Lock, ToggleRight, ToggleLeft } from 'lucide-react';

interface SystemConfigProps {
  currentConfig: SchoolConfig | null;
  onUpdateConfig: (config: SchoolConfig) => void;
}

const SystemConfig: React.FC<SystemConfigProps> = ({ currentConfig, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'core'>('identity');
  
  // Crawler State
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Identity State
  const [schoolName, setSchoolName] = useState(currentConfig?.name || '');
  const [motto, setMotto] = useState(currentConfig?.motto || '');
  const [color, setColor] = useState(currentConfig?.primaryColor || '#06b6d4');
  const [secondaryColor, setSecondaryColor] = useState(currentConfig?.secondaryColor || '#6366f1');
  const [logoUrl, setLogoUrl] = useState(currentConfig?.logoUrl || '');
  const [context, setContext] = useState(currentConfig?.websiteContext || '');

  // Core Module State
  const [modules, setModules] = useState({
      transport: currentConfig?.modules?.transport ?? true,
      library: currentConfig?.modules?.library ?? true,
      finance: currentConfig?.modules?.finance ?? true,
      nexus: currentConfig?.modules?.nexus ?? true,
  });

  const [securityLevel, setSecurityLevel] = useState<'standard' | 'high' | 'fortress'>(currentConfig?.systemSettings?.securityLevel || 'standard');
  const [aiCreativity, setAiCreativity] = useState(currentConfig?.systemSettings?.aiCreativity || 50);

  // Visual Effects
  const [flashFields, setFlashFields] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scanLogs]);

  useEffect(() => {
    if (currentConfig && !isScanning && scanStatus === 'idle') {
        setSchoolName(currentConfig.name);
        setMotto(currentConfig.motto);
        setColor(currentConfig.primaryColor);
        setContext(currentConfig.websiteContext || '');
        if (currentConfig.modules) setModules(currentConfig.modules);
        if (currentConfig.systemSettings) {
            setSecurityLevel(currentConfig.systemSettings.securityLevel);
            setAiCreativity(currentConfig.systemSettings.aiCreativity);
        }
    }
  }, [currentConfig, isScanning, scanStatus]);

  const startNeuralScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsScanning(true);
    setScanStatus('scanning');
    setScanLogs(['> Initializing Neural Crawler v5.0...', '> Establishing secure handshake...', '> Connecting to secure gateway...']);

    try {
        await new Promise(r => setTimeout(r, 800));
        setScanLogs(prev => [...prev, `> Analyzing vector space of: ${url}`, '> Sending packets to Gemini Core...']);

        const config = await analyzeSchoolUrl(url);

        // Check for total failure vs partial success
        const isFallback = config.websiteContext?.toLowerCase().includes('failed') || 
                          config.websiteContext?.toLowerCase().includes('unavailable');

        if (isFallback && !config.name) {
            setScanLogs(prev => [...prev, '> ERROR: CRAWL INTERRUPTED.', '> REASON: Neural extraction incomplete', '> Reverting to local heuristics...']);
            setScanStatus('idle');
            return;
        }

        setScanLogs(prev => [
            ...prev, 
            '> Connection established.', 
            `> Found school: ${config.name}`,
            isFallback ? '> WARNING: Neural link weak. Using heuristic synthesis...' : '> Extracting color signatures...', 
            '> Synthesizing brand context...'
        ]);
        
        await new Promise(r => setTimeout(r, 1000));
        
        setSchoolName(config.name);
        setMotto(config.motto);
        setColor(config.primaryColor);
        setSecondaryColor(config.secondaryColor || '#6366f1');
        setLogoUrl(config.logoUrl || '');
        setContext(config.websiteContext || '');

        setScanLogs(prev => [...prev, '> RE-INDEXING COMPLETE.', '> IDENTITY MATRIX READY.']);
        setScanStatus('complete');
        setFlashFields(true);
        setTimeout(() => setFlashFields(false), 2000);

    } catch (err: any) {
        setScanLogs(prev => [
            ...prev, 
            '> ERROR: CRAWL INTERRUPTED.', 
            `> REASON: ${err.message || 'Neural extraction incomplete'}`,
            '> Reverting to local heuristics...'
        ]);
        setScanStatus('idle');
    } finally {
        setIsScanning(false);
    }
  };

  const handleApply = async () => {
    setIsRebooting(true);
    // Visual feedback for settings change
    console.log(`[SYSTEM] Applying Security Protocol: ${securityLevel.toUpperCase()}`);
    console.log(`[SYSTEM] AI Creativity Index set to: ${aiCreativity}%`);
    
    const newConfig: SchoolConfig = {
        name: schoolName,
        motto: motto,
        primaryColor: color,
        secondaryColor: secondaryColor,
        logoUrl: logoUrl,
        isConfigured: true,
        websiteContext: context,
        modules: modules,
        systemSettings: {
            securityLevel,
            aiCreativity
        }
    };

    // Save to backend if not in a pure demo session (this check is handled by api.ts auth headers)
    try {
        await api.updateSchoolConfig(newConfig);
    } catch (err) {
        console.error("Failed to persist school config:", err);
    }
    
    setTimeout(() => {
        onUpdateConfig(newConfig);
        setIsRebooting(false);
        // Trigger a slight UI refresh effect
        window.dispatchEvent(new CustomEvent('lumix:reboot_complete'));
    }, 1500);
  };

  const toggleModule = (key: keyof typeof modules) => {
      setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-3">
                <Cpu size={32} className="text-purple-400" />
                SYSTEM COMMAND CORE
            </h2>
            <p className="text-slate-400 font-mono text-xs mt-2">ADMIN CLEARANCE LEVEL 5 REQUIRED</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('identity')}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${activeTab === 'identity' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
                IDENTITY MATRIX
            </button>
            <button 
                onClick={() => setActiveTab('core')}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${activeTab === 'core' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
                CORE ARCHITECTURE
            </button>
        </div>
      </div>

      {activeTab === 'identity' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Neural Crawler */}
            <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Globe size={120} /></div>
                
                <h3 className="text-xl font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
                    <Globe size={20} className="text-cyan-400" />
                    NEURAL WEB CRAWLER
                </h3>
                <p className="text-sm text-slate-300 mb-6 font-mono leading-relaxed">
                    Target URL ingestion. Gemini AI will analyze the endpoint and synthesize a brand identity matrix.
                </p>

                <form onSubmit={startNeuralScan} className="space-y-4 relative z-10">
                    <div className="relative">
                        <input 
                            type="url" 
                            placeholder="https://www.stanford.edu" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isScanning}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
                        />
                        {isScanning && (
                            <div className="absolute right-3 top-3">
                                <RefreshCw size={20} className="text-cyan-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit"
                        disabled={isScanning || !url}
                        className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-400 py-3 rounded-xl font-bold font-sci-fi tracking-widest transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isScanning ? 'SCANNING SECTOR...' : 'INITIATE CRAWL'}
                    </button>
                </form>

                {/* Scan Terminal */}
                <div className="mt-6 bg-black/60 rounded-lg p-4 font-mono text-xs h-40 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
                    {scanLogs.length === 0 && <span className="text-slate-600 opacity-50">Waiting for target URL...</span>}
                    {scanLogs.map((log, i) => (
                        <div key={i} className="text-emerald-400/80 mb-1">{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                    {scanStatus === 'complete' && (
                        <div className="text-white font-bold mt-2 flex items-center gap-2 animate-pulse">
                            <CheckCircle2 size={12} className="text-emerald-500" /> SCAN COMPLETE. ASSETS ACQUIRED.
                        </div>
                    )}
                    {scanStatus === 'error' && (
                        <div className="text-rose-400 font-bold mt-2 flex items-center gap-2">
                            <AlertTriangle size={12} /> SCAN FAILED.
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Identity */}
            <div className={`glass-panel p-8 rounded-2xl border border-white/10 flex flex-col transition-all duration-500 ${scanStatus === 'complete' ? 'shadow-[0_0_30px_rgba(245,158,11,0.2)] border-amber-500/30' : ''}`}>
                <h3 className="text-xl font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
                    <Layout size={20} className="text-purple-400" />
                    IDENTITY MATRIX
                    {scanStatus === 'complete' && <Sparkles size={16} className="text-amber-400 animate-bounce" />}
                </h3>

                <div className="space-y-6 flex-1">
                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase flex justify-between">
                            School Designation
                            {scanStatus === 'complete' && <span className="text-[10px] text-emerald-500 animate-pulse">EXTRACTED</span>}
                        </label>
                        <div className="relative">
                            <Hash size={16} className={`absolute left-3 top-3.5 transition-colors ${scanStatus === 'complete' ? 'text-amber-500' : 'text-slate-500'}`} />
                            <input 
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                placeholder="Enter School Name"
                                className={`w-full bg-slate-900/50 border rounded-xl py-3 pl-10 text-white font-bold outline-none transition-all duration-700 
                                ${flashFields ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : ''}
                                ${scanStatus === 'complete' ? 'border-amber-500/50 text-amber-400' : 'border-white/10 focus:border-purple-500'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase flex justify-between">
                            Core Motto
                            {scanStatus === 'complete' && <span className="text-[10px] text-emerald-500 animate-pulse">SYNTHESIZED</span>}
                        </label>
                        <input 
                            value={motto}
                            onChange={(e) => setMotto(e.target.value)}
                            placeholder="Enter School Motto"
                            className={`w-full bg-slate-900/50 border rounded-xl py-3 px-4 text-white outline-none transition-all duration-700
                            ${flashFields ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : ''} 
                            ${scanStatus === 'complete' ? 'border-amber-500/50' : 'border-white/10 focus:border-purple-500'}`}
                        />
                    </div>

                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase flex justify-between">
                            Logo Matrix (URL)
                            {scanStatus === 'complete' && <span className="text-[10px] text-emerald-500 animate-pulse">ACQUIRED</span>}
                        </label>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Layout size={20} className="text-slate-600" />
                                )}
                            </div>
                            <input 
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://school.edu/logo.png"
                                className={`flex-1 bg-slate-900/50 border rounded-xl py-3 px-4 text-white font-mono text-xs outline-none transition-all duration-700
                                ${flashFields ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : ''} 
                                ${scanStatus === 'complete' ? 'border-amber-500/50' : 'border-white/10 focus:border-purple-500'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase flex justify-between">
                            Primary Vector
                            {scanStatus === 'complete' && <span className="text-[10px] text-emerald-500 animate-pulse">MATCHED</span>}
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative group/color">
                                <input 
                                    type="color" 
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg bg-transparent cursor-pointer border-none relative z-10"
                                />
                                <div className="absolute inset-0 rounded-lg blur-sm opacity-50 group-hover/color:opacity-100 transition-opacity" style={{ backgroundColor: color }}></div>
                            </div>
                            <div className={`flex-1 bg-slate-900/50 border rounded-xl py-3 px-4 text-slate-300 font-mono uppercase transition-all duration-700 
                            ${flashFields ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : ''}
                            ${scanStatus === 'complete' ? 'border-amber-500/50 text-amber-400' : 'border-white/10'}`}>
                                {color}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase flex justify-between">
                            Secondary Vector
                            {scanStatus === 'complete' && <span className="text-[10px] text-emerald-500 animate-pulse">MATCHED</span>}
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative group/color">
                                <input 
                                    type="color" 
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg bg-transparent cursor-pointer border-none relative z-10"
                                />
                                <div className="absolute inset-0 rounded-lg blur-sm opacity-50 group-hover/color:opacity-100 transition-opacity" style={{ backgroundColor: secondaryColor }}></div>
                            </div>
                            <div className={`flex-1 bg-slate-900/50 border rounded-xl py-3 px-4 text-slate-300 font-mono uppercase transition-all duration-700 
                            ${flashFields ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : ''}
                            ${scanStatus === 'complete' ? 'border-amber-500/50 text-amber-400' : 'border-white/10'}`}>
                                {secondaryColor}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 group/field">
                        <label className="text-xs font-mono text-slate-400 uppercase">LumiX Context (Deep Knowledge)</label>
                        <div className="relative">
                            <textarea 
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Neural context for AI agents..."
                                className={`w-full bg-slate-900/30 border border-white/10 rounded-xl p-3 text-xs text-slate-400 font-mono resize-none h-24 focus:outline-none transition-all duration-700 custom-scrollbar
                                ${scanStatus === 'complete' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
                            />
                            {scanStatus === 'complete' && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-black/40 px-2 py-1 rounded">
                                    <Sparkles size={10} /> AI GENERATED
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Modules */}
               <div className="glass-panel p-8 rounded-2xl border border-white/10">
                   <h3 className="text-xl font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
                        <Server size={20} className="text-emerald-400" />
                        ACTIVE SUBSYSTEMS
                   </h3>
                   <div className="grid grid-cols-1 gap-4">
                       {[
                           { key: 'transport', label: 'Fleet Command', desc: 'GPS Telemetry & Route Optimization' },
                           { key: 'library', label: 'Neural Library', desc: 'AI Curation & Inventory' },
                           { key: 'finance', label: 'Finance Ledger', desc: 'Automated Billing & Auditing' },
                           { key: 'nexus', label: 'Nexus Bridge', desc: 'SQL & CSV Data Pipeline' },
                       ].map((mod) => (
                           <div key={mod.key} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                               modules[mod.key as keyof typeof modules] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 opacity-60'
                           }`} onClick={() => toggleModule(mod.key as keyof typeof modules)}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modules[mod.key as keyof typeof modules] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                                        <Power size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white font-sci-fi">{mod.label}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{mod.desc}</div>
                                    </div>
                                </div>
                                {modules[mod.key as keyof typeof modules] ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-slate-500" />}
                           </div>
                       ))}
                   </div>
               </div>

               {/* Advanced Settings */}
               <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col">
                    <h3 className="text-xl font-bold text-white font-sci-fi mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-rose-400" />
                        SECURITY PROTOCOLS
                    </h3>
                    
                    <div className="space-y-8 flex-1">
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-mono text-slate-400 uppercase">
                                <span>Defcon Level</span>
                                <span className={securityLevel === 'fortress' ? 'text-rose-400 font-bold' : 'text-cyan-400'}>{securityLevel.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {['standard', 'high', 'fortress'].map((lvl) => (
                                    <button 
                                        key={lvl}
                                        onClick={() => setSecurityLevel(lvl as any)}
                                        className={`py-2 rounded-lg text-[10px] font-bold font-mono border transition-all ${
                                            securityLevel === lvl 
                                            ? lvl === 'fortress' ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-cyan-500 text-white border-cyan-400'
                                            : 'bg-white/5 text-slate-500 border-white/10'
                                        }`}
                                    >
                                        {lvl.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-mono text-slate-400 uppercase">
                                <span>AI Creativity Index (Gamma)</span>
                                <span className="text-purple-400">{aiCreativity}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={aiCreativity}
                                onChange={(e) => setAiCreativity(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <p className="text-[10px] text-slate-500 font-mono text-right">
                                {aiCreativity > 80 ? 'WARNING: HIGH HALLUCINATION RISK' : 'OPTIMAL PARAMETERS'}
                            </p>
                        </div>
                        
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                             <Activity size={24} className="text-emerald-400 animate-pulse" />
                             <div className="w-full">
                                 <div className="flex justify-between text-[10px] text-emerald-400 font-mono mb-1">
                                     <span>SYSTEM HEARTBEAT</span>
                                     <span>STABLE</span>
                                 </div>
                                 <div className="flex items-end gap-1 h-8">
                                     {[40, 60, 45, 70, 50, 80, 55, 65, 45, 60, 50, 75, 55, 60, 45, 70, 50, 80].map((h, i) => (
                                         <div 
                                            key={i} 
                                            className="flex-1 bg-emerald-500/20 rounded-sm animate-pulse" 
                                            style={{ 
                                                height: `${h}%`,
                                                animationDelay: `${i * 0.1}s`,
                                                animationDuration: '1.5s'
                                            }}
                                        ></div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
               </div>
          </div>
      )}

      {/* Save Button */}
      <div className="pt-6 border-t border-white/10">
            <button 
            onClick={handleApply}
            disabled={isRebooting}
            className={`w-full py-4 rounded-xl font-bold font-sci-fi tracking-widest transition-all relative overflow-hidden ${isRebooting ? 'bg-emerald-600' : 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`}
            >
                {isRebooting ? (
                    <span className="flex items-center justify-center gap-2 animate-pulse text-white">
                        <RefreshCw className="animate-spin" /> REBOOTING SYSTEM KERNEL...
                    </span>
                ) : (
                    'SAVE & RESTART SYSTEM'
                )}
            </button>
      </div>
    </div>
  );
};

export default SystemConfig;
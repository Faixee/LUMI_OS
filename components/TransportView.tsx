import React, { useState, useEffect } from 'react';
import { Bus, Navigation, Fuel, AlertTriangle, ShieldCheck, Zap, Radio, Phone } from 'lucide-react';
import { TransportRoute } from '../types';

// Extended interface for simulation physics
interface SimBus extends TransportRoute {
  x: number;
  y: number;
  dx: number;
  dy: number;
  passengers: number;
  eta: number;
}

interface TransportViewProps {
    fleet?: TransportRoute[];
}

const TransportView: React.FC<TransportViewProps> = ({ fleet = [] }) => {
  const [simFleet, setSimFleet] = useState<SimBus[]>([]);
  const [selectedBus, setSelectedBus] = useState<SimBus | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  
  // Initialize Physics State based on Props
  useEffect(() => {
    if (fleet.length === 0) {
        setSimFleet([]);
        return;
    }

    const initialFleet = fleet.map((bus, i) => ({
        ...bus,
        x: 20 + (i * 15) % 60 + (Math.random() * 10),
        y: 30 + (i * 10) % 50 + (Math.random() * 10),
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        passengers: Math.floor(Math.random() * 30) + 10,
        eta: Math.floor(Math.random() * 20) + 5
    }));
    setSimFleet(initialFleet);
  }, [fleet]);

  // Physics Loop
  useEffect(() => {
    if (simFleet.length === 0) return;

    let animationFrameId: number;

    const updatePosition = () => {
        setSimFleet(prevFleet => prevFleet.map(bus => {
            if (bus.status === 'Maintenance') return bus;

            let newX = bus.x + bus.dx;
            let newY = bus.y + bus.dy;
            let newDx = bus.dx;
            let newDy = bus.dy;

            // Bounce off map edges
            if (newX <= 5 || newX >= 95) newDx *= -1;
            if (newY <= 5 || newY >= 95) newDy *= -1;

            if (Math.random() < 0.005) {
                newDx = (Math.random() - 0.5) * 0.2;
                newDy = (Math.random() - 0.5) * 0.2;
            }

            return { ...bus, x: newX, y: newY, dx: newDx, dy: newDy };
        }));
        animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simFleet.length > 0]);

  // Update selected bus data
  useEffect(() => {
      if (selectedBus) {
          const liveData = simFleet.find(b => b.id === selectedBus.id);
          if (liveData) setSelectedBus(liveData);
      }
  }, [simFleet, selectedBus]);

  const handleOptimize = () => {
      setOptimizing(true);
      setTimeout(() => {
          setOptimizing(false);
          setSimFleet(prev => prev.map(b => ({
              ...b,
              fuel: Math.min(b.fuel + 5, 100),
              eta: Math.max(b.eta - 2, 1)
          })));
      }, 2000);
  };

  const toggleEmergency = (id: string) => {
      setSimFleet(prev => prev.map(b => {
          if (b.id === id) {
              const newStatus = b.status === 'Active' ? 'Maintenance' : 'Active';
              return { ...b, status: newStatus, dx: 0, dy: 0 };
          }
          return b;
      }));
  };

  if (fleet.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[400px] md:h-[600px] glass-panel rounded-2xl border border-white/10 text-center">
              <Bus size={64} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white font-sci-fi">FLEET OFFLINE</h3>
              <p className="text-slate-400 font-mono text-sm mt-2 max-w-md">No transport units detected in the database. Add vehicles via the Nexus Bridge or Admin Console to activate Fleet Command.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white font-sci-fi text-glow flex items-center gap-3">
                <Navigation size={32} className="text-cyan-400" />
                FLEET COMMAND
            </h2>
            <p className="text-cyan-400/70 font-mono text-xs mt-1">REAL-TIME GPS TELEMETRY • LUMIX TRAFFIC AI</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={handleOptimize}
                disabled={optimizing}
                className="w-full md:w-auto bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 px-4 py-2 rounded-lg font-bold font-sci-fi flex items-center justify-center gap-2 transition-all"
            >
                {optimizing ? <Zap size={16} className="animate-spin" /> : <Zap size={16} />}
                {optimizing ? 'REROUTING...' : 'OPTIMIZE ROUTES'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Simulation */}
        <div className="lg:col-span-2 glass-panel p-0 rounded-2xl overflow-hidden border border-white/10 relative h-[400px] md:h-[600px] bg-[#050510] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
             
             {simFleet.map((bus) => (
                <div 
                    key={bus.id} 
                    onClick={() => setSelectedBus(bus)}
                    className="absolute flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:scale-125 z-10"
                    style={{ 
                        top: `${bus.y}%`, 
                        left: `${bus.x}%`,
                        transform: `translate(-50%, -50%)`,
                        transition: 'top 0.1s linear, left 0.1s linear'
                    }}
                >
                    <div className={`absolute w-8 h-8 rounded-full ${bus.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-20 animate-ping`}></div>
                    <div className={`relative p-1.5 rounded-lg border-2 shadow-[0_0_15px_currentColor] transition-colors ${
                        selectedBus?.id === bus.id 
                            ? 'bg-white text-black border-white' 
                            : bus.status === 'Active' 
                                ? 'bg-[#050510] text-emerald-400 border-emerald-500' 
                                : 'bg-[#050510] text-rose-500 border-rose-500'
                    }`}>
                         <Bus size={14} />
                    </div>
                </div>
             ))}

             <div className="absolute top-4 left-4 p-4 bg-black/60 backdrop-blur rounded-xl border border-white/10 max-w-[200px]">
                <h4 className="text-[10px] font-mono text-cyan-400 mb-1">SECTOR SCAN</h4>
                <div className="flex items-center gap-2 text-white font-bold font-sci-fi text-lg">
                    <Navigation size={18} className="text-emerald-400" />
                    LIVE TRACKING
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    ACTIVE UNITS: <span className="text-white">{simFleet.filter(b => b.status === 'Active').length}</span>
                </div>
             </div>

             {selectedBus && (
                 <div className="absolute bottom-4 right-4 w-64 bg-black/90 backdrop-blur rounded-xl border border-white/20 overflow-hidden animate-in slide-in-from-right-10">
                     <div className="p-3">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-white text-sm">{selectedBus.route}</h4>
                             <span className="text-xs font-mono text-emerald-400">{selectedBus.fuel}% FUEL</span>
                         </div>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => toggleEmergency(selectedBus.id)}
                                className={`flex-1 py-1.5 rounded text-[10px] font-mono text-white flex items-center justify-center gap-1 ${selectedBus.status === 'Active' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40'}`}
                             >
                                 <AlertTriangle size={10} /> {selectedBus.status === 'Active' ? 'HALT' : 'ACTIVATE'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>

        {/* Fleet Sidebar */}
        <div className="space-y-4 h-[300px] lg:h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {simFleet.map(bus => (
                <div 
                    key={bus.id} 
                    onClick={() => setSelectedBus(bus)}
                    className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer group ${
                        selectedBus?.id === bus.id 
                            ? 'border-cyan-500 bg-cyan-900/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                            : 'border-white/5 hover:border-white/20'
                    }`}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                <Bus size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{bus.route}</h4>
                                <p className="text-[10px] text-slate-500 font-mono">ID: {bus.id}</p>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${bus.status === 'Active' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10'}`}>
                            {bus.status}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TransportView;
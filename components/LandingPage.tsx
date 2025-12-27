import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Cpu, Shield, Globe, ArrowRight, CheckCircle2, Scan, Lock, Unlock, Users, Server, Database, Activity, Code, Folder, FileCode, Layers, Box, Aperture, Terminal, Zap, Power, MousePointer2, XCircle, Layout, Gamepad2, Sparkles, Eye } from 'lucide-react';
import LandingChatBot from './LandingChatBot';
import { authService } from '../services/auth';
import LandingNav from './landing/LandingNav';
import PaywallModal from './landing/PaywallModal';
import FooterModal from './landing/FooterModal';
import HeroSection from './landing/HeroSection';
import HUDCorner from './landing/HUDCorner';
import DemoSelectorModal from './landing/DemoSelectorModal';

interface LandingPageProps {
  onNavigateLogin: () => void;
}

type EngineeredFeature = {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  border: string;
};

const StatusTicker = React.memo(() => {
  return (
    <section className="border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden py-3">
      <div className="flex w-full whitespace-nowrap overflow-hidden">
        <div className="animate-marquee flex gap-12 items-center text-slate-500 font-mono text-xs uppercase tracking-[0.2em] px-6">
          <span className="flex items-center gap-2">
            <Activity size={12} className="text-emerald-500" /> System Load: 12%
          </span>
          <span className="flex items-center gap-2">
            <Globe size={12} className="text-cyan-500" /> Global Nodes: 45
          </span>
          <span className="flex items-center gap-2">
            <Shield size={12} className="text-purple-500" /> Threat Level: 0
          </span>
          <span className="flex items-center gap-2">
            <Zap size={12} className="text-amber-500" /> Energy Efficiency: 98%
          </span>
          <span className="flex items-center gap-2">
            <Server size={12} className="text-indigo-500" /> Database Latency: 24ms
          </span>
          <span className="flex items-center gap-2">
            <Activity size={12} className="text-emerald-500" /> System Load: 12%
          </span>
          <span className="flex items-center gap-2">
            <Globe size={12} className="text-cyan-500" /> Global Nodes: 45
          </span>
          <span className="flex items-center gap-2">
            <Shield size={12} className="text-purple-500" /> Threat Level: 0
          </span>
        </div>
      </div>
    </section>
  );
});

const EngineeredFeatureCard = React.memo(
  ({
    feature,
    innerRef,
  }: {
    feature: EngineeredFeature;
    innerRef?: (node: HTMLDivElement | null) => void;
  }) => {
    return (
      <div
        ref={innerRef}
        className={`glass-panel p-6 md:p-8 rounded-none border border-white/5 transition-all hover:-translate-y-2 group relative overflow-hidden ${feature.border} shrink-0 w-[18rem] sm:w-[20rem] md:w-[22rem]`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <HUDCorner />

        <div className="w-12 h-12 bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
          <feature.icon size={24} className={feature.color} />
        </div>
        <h3 className="text-xl font-bold text-white font-sci-fi mb-3 tracking-wide">{feature.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed font-light">{feature.desc}</p>

        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className={feature.color} />
        </div>
      </div>
    );
  }
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [demoStep, setDemoStep] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isDemoSelectorOpen, setIsDemoSelectorOpen] = useState(false);
  const [footerModalType, setFooterModalType] = useState<'privacy' | 'status' | 'license' | null>(null);
  const [loginState, setLoginState] = useState<'idle' | 'denied' | 'granted' | 'welcome'>('idle');
  
  // Dynamic Slogan State
  const [sloganIndex, setSloganIndex] = useState(0);
  const slogans = [
      "COGNITIVE_ECONOMY",
      "PREDICTIVE_ALPHA",
      "GENERATIVE_FUTURE",
      "INVEST_IN_INTELLECT"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
        setSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 3000); // Cycles every 3 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Reference for the main scrollable container to handle scroll-to-top correctly
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSystemLogin = () => {
    const user = authService.getUser();
    const token = user.token;
    
    // Check if token is valid (not 'null', 'undefined', or empty)
    const isValidToken = token && token !== 'null' && token !== 'undefined' && token.length > 0;

    // Set a flag to allow login page access only via System Login
    sessionStorage.setItem('allow_login_access', 'true');

    // Filter out developer roles from system login
    const role = (user.role || '').toLowerCase().trim();
    if (role === 'developer') {
        navigate('/dev');
        return;
    }

    if (isValidToken) {
      const subscription = (user.subscription || '').toLowerCase().trim();
      
      const isPaid = ['active', 'enterprise', 'pro', 'basic', 'demo'].includes(subscription);
      const isDev = ['owner', 'admin'].includes(role) || role === 'demo';
      
      if (isPaid || isDev) {
        setLoginState('granted');
        setTimeout(() => {
            setLoginState('welcome');
        }, 1500);
        setTimeout(() => {
            navigate('/app');
        }, 4000);
      } else {
        setLoginState('denied');
        setTimeout(() => {
            if (loginState === 'denied') { // Check if still denied
                setLoginState('idle');
                navigate('/subscribe');
            }
        }, 3000);
      }
    } else {
      // If not logged in, also show access denied and redirect to pricing
      // as per user request: "system login... instantly triggers to pricing page"
      setLoginState('denied');
      setTimeout(() => {
          setLoginState('idle');
          navigate('/subscribe');
      }, 3000);
    }
  };

  const [isSystemTourActive, setIsSystemTourActive] = useState(false);
  const systemTourTimeoutsRef = useRef<number[]>([]);

  const stopSystemTour = () => {
    systemTourTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    systemTourTimeoutsRef.current = [];
    setIsSystemTourActive(false);
  };

  const startSystemTour = () => {
    stopSystemTour();
    setIsSystemTourActive(true);

    const steps: Array<'intelligence' | 'architecture' | 'specs' | 'demo'> = [
      'intelligence',
      'architecture',
      'specs',
      'demo',
    ];

    const stepMs = 2400;

    steps.forEach((id, i) => {
      systemTourTimeoutsRef.current.push(
        window.setTimeout(() => {
          scrollToSection(id);
        }, i * stepMs)
      );
    });

    systemTourTimeoutsRef.current.push(
      window.setTimeout(() => {
        setIsSystemTourActive(false);
        systemTourTimeoutsRef.current = [];
      }, steps.length * stepMs + 200)
    );
  };

  useEffect(() => {
    if (!isSystemTourActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSystemTour();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSystemTourActive]);

  useEffect(() => {
    return () => {
      systemTourTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setDemoStep('scanning');
    
    // Simulate AI Handshake
    setTimeout(() => {
        setDemoStep('success');
    }, 2000);
  };

  // Real Project Structure for Client Transparency
  const projectStructure = [
      { name: 'src', type: 'folder', children: [
        { name: 'components', type: 'folder', children: [
           { name: 'Dashboard.tsx', type: 'file' },
           { name: 'AgentConsole.tsx', type: 'file' },
           { name: 'GenesisEngine.tsx', type: 'file' },
           { name: 'StudentManager.tsx', type: 'file' },
           { name: 'SystemConfig.tsx', type: 'file' },
        ]},
        { name: 'services', type: 'folder', children: [
           { name: 'geminiService.ts', type: 'file', highlight: true },
           { name: 'api.ts', type: 'file' },
           { name: 'auth.ts', type: 'file' },
        ]},
        { name: 'App.tsx', type: 'file' },
        { name: 'types.ts', type: 'file' },
      ]},
      { name: 'backend', type: 'folder', children: [
         { name: 'main.py', type: 'file' },
         { name: 'agents.py', type: 'file' },
         { name: 'database.py', type: 'file' },
      ]}
  ];

  const renderTree = (items: any[], depth = 0) => {
      return items.map((item, idx) => (
          <div key={idx} style={{ paddingLeft: `${depth * 20}px` }} className="font-mono text-xs py-1.5 hover:bg-white/5 rounded cursor-default group border-l border-transparent hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2">
                  {item.type === 'folder' ? (
                      <Folder size={14} className="text-indigo-400 group-hover:text-indigo-300" />
                  ) : (
                      <FileCode size={14} className={item.highlight ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'} />
                  )}
                  <span className={`${item.highlight ? 'text-cyan-400 font-bold shadow-cyan-500/50' : 'text-slate-400'} group-hover:text-white transition-colors`}>
                      {item.name}
                  </span>
                  {item.highlight && <span className="ml-auto text-[9px] text-cyan-500 bg-cyan-950/50 px-1.5 rounded border border-cyan-500/20">CORE</span>}
              </div>
              {item.children && renderTree(item.children, depth + 1)}
          </div>
      ));
  };

  const engineeredIntelligenceTicker = useMemo(
    () => ({
      durationMs: 30000,
      direction: 'left' as const,
    }),
    []
  );

  const engineeredIntelligenceFeatures = useMemo<EngineeredFeature[]>(
    () => [
      {
        icon: Terminal,
        title: 'Astra Prediction',
        desc: 'Uses historical data to forecast student grades and dropout risks before they happen.',
        color: 'text-indigo-400',
        border: 'group-hover:border-indigo-500/50',
      },
      {
        icon: Activity,
        title: 'Lumen Analytics',
        desc: 'Continuously generates insights from attendance, GPA, and engagement signals.',
        color: 'text-emerald-400',
        border: 'group-hover:border-emerald-500/50',
      },
      {
        icon: Zap,
        title: 'Genesis Content',
        desc: 'Instantly generate syllabi, quizzes, and lesson plans using integrated Gemini LLMs.',
        color: 'text-amber-400',
        border: 'group-hover:border-amber-500/50',
      },
      {
        icon: Shield,
        title: 'Lexi Guardian',
        desc: 'Real-time ethical monitoring of student communications and behavioral notes.',
        color: 'text-rose-400',
        border: 'group-hover:border-rose-500/50',
      },
      {
        icon: Server,
        title: 'Nova Orchestrator',
        desc: 'Coordinates autonomous workflows across modules and maintains system continuity.',
        color: 'text-cyan-400',
        border: 'group-hover:border-cyan-500/50',
      },
      {
        icon: Layout,
        title: 'Vega Interface',
        desc: 'Adapts dashboards and experiences per role with contextual UI intelligence.',
        color: 'text-purple-400',
        border: 'group-hover:border-purple-500/50',
      },
      {
        icon: Cpu,
        title: 'LumiX Copilot',
        desc: 'An embedded assistant that helps users navigate, generate, and act instantly.',
        color: 'text-indigo-300',
        border: 'group-hover:border-indigo-400/50',
      },
    ],
    []
  );

  const engineeredTickerRef = useRef<HTMLDivElement>(null);
  const engineeredInnerRef = useRef<HTMLDivElement>(null);
  const engineeredSequenceRef = useRef<HTMLDivElement>(null);
  const engineeredItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const engineeredRafRef = useRef<number | null>(null);
  const engineeredLastTsRef = useRef<number>(0);
  const engineeredXRef = useRef<number>(0);
  const engineeredSequenceWidthRef = useRef<number>(0);
  const engineeredItemOffsetsRef = useRef<number[]>([]);
  const engineeredActiveIndexRef = useRef<number>(0);

  const [engineeredActiveIndex, setEngineeredActiveIndex] = useState(0);
  const [engineeredHoverPaused, setEngineeredHoverPaused] = useState(false);
  const [engineeredUserPaused, setEngineeredUserPaused] = useState(false);
  const [engineeredReducedMotion, setEngineeredReducedMotion] = useState(false);

  const engineeredIsPaused = engineeredHoverPaused || engineeredUserPaused;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onChange = () => setEngineeredReducedMotion(media.matches);
    onChange();

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const ticker = engineeredTickerRef.current;
    const sequence = engineeredSequenceRef.current;
    if (!ticker || !sequence) return;

    const updateMeasurements = () => {
      const width = sequence.getBoundingClientRect().width;
      engineeredSequenceWidthRef.current = width;

      const offsets = engineeredIntelligenceFeatures
        .map((_, idx) => engineeredItemRefs.current[idx])
        .filter(Boolean)
        .map((el) => (el as HTMLDivElement).offsetLeft);
      engineeredItemOffsetsRef.current = offsets;

      if (width > 0) {
        const normalized = ((ticker.scrollLeft % width) + width) % width;
        ticker.scrollLeft = normalized;
      }
    };

    updateMeasurements();
    const raf = requestAnimationFrame(updateMeasurements);

    const onResize = () => updateMeasurements();
    window.addEventListener('resize', onResize);

    let observer: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(() => updateMeasurements());
      observer.observe(ticker);
      observer.observe(sequence);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [engineeredIntelligenceFeatures]);

  const updateEngineeredActiveIndex = (scrollLeft: number) => {
    const width = engineeredSequenceWidthRef.current;
    const offsets = engineeredItemOffsetsRef.current;
    const ticker = engineeredTickerRef.current;

    if (!ticker || width <= 0 || offsets.length === 0) return;

    const normalized = ((scrollLeft % width) + width) % width;
    const focusPoint = normalized + ticker.clientWidth / 2;

    let lo = 0;
    let hi = offsets.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] <= focusPoint) lo = mid + 1;
      else hi = mid - 1;
    }
    const idx = Math.max(0, Math.min(offsets.length - 1, hi));

    if (idx !== engineeredActiveIndexRef.current) {
      engineeredActiveIndexRef.current = idx;
      setEngineeredActiveIndex(idx);
    }
  };

  useEffect(() => {
    const ticker = engineeredTickerRef.current;
    const inner = engineeredInnerRef.current;
    if (!ticker || !inner) return;

    const step = (ts: number) => {
      const width = engineeredSequenceWidthRef.current;

      if (engineeredLastTsRef.current === 0) {
        engineeredLastTsRef.current = ts;
      }

      const deltaMs = ts - engineeredLastTsRef.current;
      engineeredLastTsRef.current = ts;

      if (!engineeredReducedMotion && !engineeredIsPaused && width > 0) {
        const pxPerMs = width / engineeredIntelligenceTicker.durationMs;
        // Move left continuously
        engineeredXRef.current -= pxPerMs * deltaMs;
        
        // Wrap around logic
        // We move negative. If abs(x) >= width, we add width to reset.
        if (Math.abs(engineeredXRef.current) >= width) {
            engineeredXRef.current += width;
        }

        inner.style.transform = `translate3d(${engineeredXRef.current}px, 0, 0)`;
      }

      // Update active index based on position relative to center
      const currentX = Math.abs(engineeredXRef.current);
      updateEngineeredActiveIndex(currentX);
      
      engineeredRafRef.current = requestAnimationFrame(step);
    };

    engineeredRafRef.current = requestAnimationFrame(step);
    return () => {
      if (engineeredRafRef.current !== null) {
        cancelAnimationFrame(engineeredRafRef.current);
        engineeredRafRef.current = null;
      }
      engineeredLastTsRef.current = 0;
    };
  }, [engineeredIntelligenceTicker, engineeredHoverPaused, engineeredReducedMotion, engineeredUserPaused]);

  return (
    <div ref={mainContainerRef} className="h-[100dvh] bg-[#030014] text-white font-sans overflow-y-auto custom-scrollbar relative selection:bg-cyan-500/30 scroll-smooth">
        
        {/* Dynamic Background Grid */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[150px]"></div>
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20 transform perspective-1000 rotateX(10deg)"></div>
        </div>

        <PaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          onViewPlans={() => { setIsPaywallOpen(false); navigate('/subscribe'); }}
          onContinueDemo={() => { setIsPaywallOpen(false); setIsDemoSelectorOpen(true); }}
        />

        <DemoSelectorModal
          isOpen={isDemoSelectorOpen}
          onClose={() => setIsDemoSelectorOpen(false)}
          onSelectRole={(role, type) => {
            setIsDemoSelectorOpen(false);
            // Append type as a query parameter for the demo handler to process
            navigate(`/demo/${role}?type=${type}`);
          }}
        />

        <LandingNav
          onScrollToTop={scrollToTop}
          onScrollToSection={scrollToSection}
          onNavigate={(path) => navigate(path)}
          onSystemLogin={handleSystemLogin}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <HeroSection
          sloganIndex={sloganIndex}
          slogans={slogans}
          isSystemTourActive={isSystemTourActive}
          onDemo={() => setIsDemoSelectorOpen(true)}
          onToggleSystemTour={() => {
            if (isSystemTourActive) {
              stopSystemTour();
              return;
            }
            startSystemTour();
          }}
        />

        <StatusTicker />

        {/* Intelligence Grid */}
        <section id="intelligence" className="py-16 md:py-24 relative">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-16 gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-2 tracking-widest uppercase">
                            <Aperture size={14} className="animate-spin-slow" /> Core Modules
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold font-sci-fi text-white">ENGINEERED INTELLIGENCE</h2>
                    </div>
                    <p className="text-slate-400 max-w-md text-sm leading-relaxed text-left md:text-left">
                        A suite of autonomous agents working in the background to optimize educational outcomes.
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-[#030014] to-transparent pointer-events-none z-10"></div>
                    <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-[#030014] to-transparent pointer-events-none z-10"></div>

                    <div
                        ref={engineeredTickerRef}
                        className="relative overflow-hidden"
                        onMouseEnter={() => setEngineeredHoverPaused(true)}
                        onMouseLeave={() => setEngineeredHoverPaused(false)}
                    >
                        <div 
                            ref={engineeredInnerRef}
                            className="flex items-stretch gap-6 w-max py-2 px-4 md:px-6 will-change-transform"
                        >
                            <div ref={engineeredSequenceRef} className="flex items-stretch gap-6">
                                {engineeredIntelligenceFeatures.map((feature, idx) => (
                                    <EngineeredFeatureCard
                                        key={feature.title}
                                        feature={feature}
                                        innerRef={(el) => {
                                            engineeredItemRefs.current[idx] = el;
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-stretch gap-6" aria-hidden="true">
                                {engineeredIntelligenceFeatures.map((feature) => (
                                    <EngineeredFeatureCard key={`${feature.title}-dup`} feature={feature} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Engineered Intelligence ticker navigation">
                        {engineeredIntelligenceFeatures.map((feature, idx) => {
                            const isActive = idx === engineeredActiveIndex;
                            return (
                                <button
                                    key={`${feature.title}-dot`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-label={`Jump to ${feature.title}`}
                                    className={`w-2.5 h-2.5 rounded-full border transition-all ${isActive ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'bg-white/5 border-white/15 hover:border-white/40'}`}
                                    onClick={() => {
                                        const el = engineeredTickerRef.current;
                                        const inner = engineeredInnerRef.current;
                                        if (!el || !inner) return;
                                        const width = engineeredSequenceWidthRef.current;
                                        const offsets = engineeredItemOffsetsRef.current;
                                        if (width <= 0 || offsets.length === 0) return;
                                        
                                        const target = offsets[idx] ?? 0;
                                        setEngineeredUserPaused(true);
                                        
                                        // Update XRef for the JS loop
                                        engineeredXRef.current = -target;
                                        inner.style.transform = `translate3d(${-target}px, 0, 0)`;
                                        
                                        setEngineeredActiveIndex(idx);
                                        engineeredActiveIndexRef.current = idx;
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>

        {/* COMPETITOR ANALYSIS SECTION */}
        <section className="py-16 md:py-24 px-4 md:px-6 relative border-t border-white/5 bg-black/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-sci-fi text-white mb-4">OUTCLASSING THE LEGACY</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
                        Traditional systems are glorified spreadsheets. LumiX is a predictive engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex w-16 h-16 bg-black border border-white/20 rounded-full items-center justify-center font-bold font-sci-fi text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        VS
                    </div>

                    {/* Legacy Side */}
                    <div className="glass-panel p-6 md:p-8 rounded-2xl border border-rose-500/20 bg-rose-900/5 grayscale-[0.5] hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-rose-500/10 rounded-lg">
                                <XCircle size={24} className="text-rose-500" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-rose-500 font-sci-fi">LEGACY SYSTEMS</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { title: "Reactive Insights", desc: "Alerts you only after a student has failed." },
                                { title: "Manual Data Entry", desc: "Teachers waste hours on grading and scheduling." },
                                { title: "Static Interface", desc: "Clunky, spreadsheet-like UI that bores students." },
                                { title: "Zero Engagement", desc: "No motivation mechanics or interactivity." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 opacity-70">
                                    <XCircle size={20} className="text-rose-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-white font-mono text-sm">{item.title}</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LumiX Side */}
                    <div className="glass-panel p-6 md:p-8 rounded-2xl border border-cyan-500/30 bg-cyan-900/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <HUDCorner />
                        
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                                <CheckCircle2 size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-white font-sci-fi text-glow">LUMIX OS</h3>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {[
                                { title: "Predictive Intelligence", desc: "Astra Agent forecasts risks months in advance." },
                                { title: "Vision AI Automation", desc: "Auto-grade assignments instantly with computer vision." },
                                { title: "Immersive UI/UX", desc: "Glassmorphic, cinematic interface users love." },
                                { title: "Gamified Growth", desc: "XP, badges, and streaks drive student motivation." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <CheckCircle2 size={20} className="text-cyan-400 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-white font-mono text-sm">{item.title}</h4>
                                        <p className="text-xs text-cyan-100/70 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* System Architecture Visualization */}
        <section id="architecture" className="py-16 md:py-24 px-4 md:px-6 relative border-t border-white/5 bg-black/20">
             <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
                    <div className="md:w-1/2 space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold font-sci-fi text-white mb-2">NEURAL ARCHITECTURE</h2>
                            <div className="h-0.5 w-20 bg-indigo-500"></div>
                        </div>
                        
                        <div className="space-y-2">
                            {[
                                { title: "Nexus Data Layer", desc: "Ingests SQL, CSV, and Legacy data into a unified vector database." },
                                { title: "Agentic Neural Grid", desc: "Autonomous agents (Astra, Lumen, Nova) continuously process data." },
                                { title: "Generative Interface", desc: "UI that adapts to the user role, generating content on the fly." }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex gap-4 md:gap-6 p-4 md:p-6 border-l-2 transition-all cursor-pointer ${activeFeature === idx ? 'border-cyan-500 bg-white/5' : 'border-white/10 hover:border-white/30'}`} 
                                    onMouseEnter={() => setActiveFeature(idx)}
                                >
                                    <div className="text-xs font-mono text-slate-500 mt-1">0{idx + 1}</div>
                                    <div>
                                        <h4 className={`font-bold font-sci-fi text-base md:text-lg mb-1 transition-colors ${activeFeature === idx ? 'text-white' : 'text-slate-400'}`}>{item.title}</h4>
                                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-1/2 relative h-[400px] md:h-[500px] w-full glass-panel border border-white/10 flex items-center justify-center p-4 md:p-8 bg-black/40">
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                         
                         {/* Visualization for each step */}
                         <div className="relative w-full h-full flex flex-col justify-between items-center py-4 md:py-8 z-10">
                             {/* Top Node */}
                             <div className={`relative w-full max-w-[14rem] md:max-w-[16rem] p-4 border transition-all duration-500 ${activeFeature === 2 ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'bg-black/80 border-white/10 opacity-40'}`}>
                                 <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
                                 <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>
                                 <div className="text-[10px] md:text-xs font-mono text-cyan-400 mb-1">FRONTEND LAYER</div>
                                 <div className="font-bold text-white font-sci-fi text-sm md:text-lg">ADAPTIVE DASHBOARD</div>
                             </div>
                             
                             {/* Middle Node */}
                             <div className={`relative w-full max-w-[14rem] md:max-w-[16rem] p-4 border transition-all duration-500 ${activeFeature === 1 ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-black/80 border-white/10 opacity-40'}`}>
                                 <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
                                 <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>
                                 <div className="text-[10px] md:text-xs font-mono text-indigo-400 mb-1">PROCESSING LAYER</div>
                                 <div className="font-bold text-white font-sci-fi text-sm md:text-lg">GEMINI AGENT SWARM</div>
                             </div>

                             {/* Bottom Node */}
                             <div className={`relative w-full max-w-[14rem] md:max-w-[16rem] p-4 border transition-all duration-500 ${activeFeature === 0 ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-black/80 border-white/10 opacity-40'}`}>
                                 <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
                                 <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>
                                 <div className="text-[10px] md:text-xs font-mono text-emerald-400 mb-1">DATA LAYER</div>
                                 <div className="font-bold text-white font-sci-fi text-sm md:text-lg">NEXUS SQL BRIDGE</div>
                             </div>

                             {/* Animated Connecting Line */}
                             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[-1]">
                                 <div className="w-[1px] h-[80%] bg-white/10 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-[flow_2s_linear_infinite]"></div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
             </div>
        </section>

        {/* NEURAL CORE - INTERACTIVE AI VISUALIZATION */}
        <section id="specs" className="py-16 md:py-24 px-4 md:px-6 relative border-t border-white/5 bg-[#050508] overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left: Interactive Neural Core Visualization */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1">
                        <div className="relative aspect-square max-w-[500px] mx-auto group">
                            {/* Outer Ring */}
                            <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                            <div className="absolute inset-4 border border-cyan-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                            
                            {/* Core Hexagon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 relative animate-float">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 backdrop-blur-3xl rounded-2xl rotate-45 border border-white/10 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 relative">
                                            <div className="absolute inset-0 bg-indigo-500/40 rounded-full blur-2xl animate-pulse"></div>
                                            <Cpu size={64} className="text-white relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                                        </div>
                                    </div>
                                    
                                    {/* Data Particles */}
                                    {[...Array(6)].map((_, i) => (
                                        <div 
                                            key={i}
                                            className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping"
                                            style={{
                                                top: `${50 + 40 * Math.sin(i * Math.PI / 3)}%`,
                                                left: `${50 + 40 * Math.cos(i * Math.PI / 3)}%`,
                                                animationDelay: `${i * 0.5}s`,
                                                animationDuration: '3s'
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Tech Labels */}
                            <div className="absolute top-0 right-0 p-4 glass-panel border border-cyan-500/30 rounded-lg animate-bounce-slow">
                                <div className="text-[10px] font-mono text-cyan-400 mb-1 tracking-widest uppercase">Cognitive Processing</div>
                                <div className="text-sm font-bold text-white font-sci-fi">99.9% ACCURACY</div>
                            </div>
                            <div className="absolute bottom-10 left-0 p-4 glass-panel border border-indigo-500/30 rounded-lg animate-bounce-slow delay-700">
                                <div className="text-[10px] font-mono text-indigo-400 mb-1 tracking-widest uppercase">Neural Latency</div>
                                <div className="text-sm font-bold text-white font-sci-fi">{'<'} 15MS RESPONSE</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Persuasion Content */}
                    <div className="w-full lg:w-1/2 order-1 lg:order-2 space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-4">
                                <Zap size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-[0.2em]">The Lumix Secret</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold font-sci-fi text-white leading-tight">
                                BEYOND THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">NEURAL CORE</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mt-6">
                                We don't just process data; we orchestrate intelligence. LumiX is powered by a proprietary agent swarm that thinks, adapts, and evolves with your institution.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { title: "Cognitive Synthesis", desc: "Our agents analyze patterns invisible to standard software.", icon: Aperture },
                                { title: "Quantum Security", desc: "Military-grade encryption protecting every byte of data.", icon: Shield },
                                { title: "Autonomous Growth", desc: "The system learns your workflows and automates them.", icon: Activity },
                                { title: "Vision AI Integration", desc: "Advanced image recognition for automated physical tasks.", icon: Eye }
                            ].map((item, i) => (
                                <div key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-500">
                                    <item.icon size={24} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-bold text-white font-sci-fi text-sm mb-2">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => scrollToSection('demo')}
                            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-none font-bold font-sci-fi tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all flex items-center gap-3 group clip-path-slant"
                        >
                            UNLEASH THE POWER <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        {/* BOOK A DEMO - INTERACTIVE SECTION */}
        <section id="demo" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden bg-gradient-to-b from-[#030014] to-black">
            <div className="max-w-5xl mx-auto relative z-10">
                <div className="glass-panel rounded-none border border-indigo-500/30 overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(79,70,229,0.1)]">
                    <HUDCorner />
                    
                    {/* Left: Content */}
                    <div className="p-6 md:p-14 md:w-1/2 bg-black/40 flex flex-col justify-center relative border-b md:border-b-0 md:border-r border-white/5">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                        
                        <h2 className="text-2xl md:text-4xl font-bold font-sci-fi text-white mb-4">INITIATE PARTNERSHIP</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed text-sm font-light">
                            Ready to upgrade your institution? Enter your credentials to schedule a classified demonstration with a LumiX Architect.
                        </p>
                        
                        <div className="space-y-4 md:space-y-6">
                            {[
                                { icon: Globe, text: "Global Infrastructure Supported", color: "text-emerald-400" },
                                { icon: Lock, text: "Enterprise-Grade Encryption", color: "text-cyan-400" },
                                { icon: Users, text: "Unlimited User Licenses", color: "text-purple-400" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`p-2 rounded bg-white/5 border border-white/10 ${item.color}`}>
                                        <item.icon size={16} />
                                    </div>
                                    <span className="text-xs md:text-sm text-slate-300 font-mono">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Interactive Form */}
                    <div className="p-6 md:p-14 md:w-1/2 bg-indigo-950/10 relative">
                        {demoStep === 'idle' && (
                            <form onSubmit={handleBookDemo} className="space-y-6 h-full flex flex-col justify-center animate-in fade-in">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex justify-between">
                                        <span>Institutional Frequency (Email)</span>
                                        <span className="text-white/20">*REQUIRED</span>
                                    </label>
                                    <input 
                                        id="email"
                                        name="email"
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@university.edu"
                                        className="w-full bg-black/40 border border-indigo-500/30 rounded-none p-4 text-white focus:border-cyan-500 focus:bg-black/60 outline-none transition-all font-mono text-sm"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Administrator Name</label>
                                    <input 
                                        id="name"
                                        name="name"
                                        type="text" 
                                        placeholder="Dr. Jane Doe"
                                        className="w-full bg-black/40 border border-indigo-500/30 rounded-none p-4 text-white focus:border-cyan-500 focus:bg-black/60 outline-none transition-all font-mono text-sm"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-black p-4 rounded-none font-bold font-sci-fi tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 group mt-4 clip-path-slant"
                                >
                                    ESTABLISH UPLINK <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        )}

                        {demoStep === 'scanning' && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center">
                                         <div className="w-full h-full border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Scan size={32} className="text-cyan-400 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-sci-fi animate-pulse">VERIFYING CREDENTIALS</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-2 uppercase tracking-widest">Handshake in progress...</p>
                                </div>
                            </div>
                        )}

                        {demoStep === 'success' && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 size={40} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white font-sci-fi">UPLINK ESTABLISHED</h3>
                                    <p className="text-slate-300 mt-2 max-w-xs mx-auto text-sm">
                                        A LumiX Architect will contact <span className="text-cyan-400 font-mono">{email}</span> within 24 standard hours.
                                    </p>
                                </div>
                                <button onClick={() => setDemoStep('idle')} className="text-xs text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4 font-mono uppercase tracking-widest">
                                    Register Another Node
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Decorative BG Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-lg py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-900/50 rounded border border-indigo-500/30">
                        <Cpu size={20} className="text-indigo-400" />
                    </div>
                    <span className="font-bold font-sci-fi text-white tracking-widest text-lg">LUMIX OS</span>
                </div>
                <div className="flex gap-8 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <button 
                        onClick={() => setFooterModalType('privacy')}
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Privacy Protocol
                    </button>
                    <button 
                        onClick={() => setFooterModalType('status')}
                        className="hover:text-cyan-400 transition-colors"
                    >
                        System Status
                    </button>
                    <button 
                        onClick={() => setFooterModalType('license')}
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Neural License
                    </button>
                </div>
                <div className="text-[10px] font-mono text-slate-600">
                    &copy; 2050 LUMIX INTELLIGENCE SYSTEMS.
                </div>
            </div>
        </footer>

        {/* AI Sales & Support Agent */}
        <LandingChatBot onScrollTo={scrollToSection} />

        {/* Footer Information Modals */}
        <FooterModal 
            isOpen={footerModalType !== null}
            type={footerModalType}
            onClose={() => setFooterModalType(null)}
        />

        {/* Login Status Modals */}
        {loginState === 'welcome' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-cyan-900/20 animate-pulse" />
                <div className="relative z-10 text-center space-y-8 animate-welcome">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                            <Sparkles size={60} className="text-cyan-400 animate-pulse" />
                        </div>
                        <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white font-sci-fi tracking-[0.2em] text-glow-animate">
                            WELCOME TO LUMIX
                        </h1>
                        <p className="text-cyan-400/60 font-mono text-sm md:text-base tracking-[0.5em] uppercase animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                            System Core Initialized
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-12">
                        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 animate-[loading_3s_ease-in-out_forwards]" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest animate-pulse uppercase">
                            Loading secure environment...
                        </span>
                    </div>
                </div>
            </div>
        )}

        {loginState === 'denied' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
                <div className="glass-panel max-w-md w-full p-10 rounded-[2rem] border border-rose-500/30 shadow-[0_0_100px_rgba(244,63,94,0.15)] text-center space-y-8 animate-lock-shake relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                    
                    <div className="w-24 h-24 bg-rose-500/10 rounded-3xl mx-auto flex items-center justify-center border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-float">
                        <Lock size={48} className="text-rose-500" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-white font-sci-fi tracking-widest uppercase">Access Denied</h2>
                        <p className="text-rose-400 text-sm font-mono leading-relaxed font-bold">
                            Get subscription first to execute to the Lumix.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-mono text-rose-500/40 tracking-[0.4em] uppercase mb-4">Redirecting to Pricing...</span>
                        
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setLoginState('idle');
                                onNavigateLogin();
                            }}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-mono text-white transition-all uppercase tracking-widest"
                        >
                            Already have access? Login
                        </button>
                    </div>
                </div>
            </div>
        )}

        {loginState === 'granted' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-emerald-500/5 backdrop-blur-md animate-in fade-in duration-500">
                <div className="glass-panel max-w-md w-full p-10 rounded-[2rem] border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center space-y-8 animate-unlock">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <Unlock size={48} className="text-emerald-400" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-white font-sci-fi tracking-widest uppercase text-glow">Access Granted</h2>
                        <p className="text-emerald-400/60 text-xs font-mono tracking-[0.2em] uppercase">
                            Identity Verified • Subscription Active
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-500/40 tracking-[0.4em] uppercase">Initialising Core...</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default LandingPage;

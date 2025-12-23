
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles, Globe, Settings, Phone, PhoneOff, Signal, Sliders, Activity } from 'lucide-react';

// --- NEW VOICE TYPES ---
interface VoiceCallState {
    isActive: boolean;
    isConnecting: boolean;
    isMuted: boolean;
    volume: number; // 0 to 1
    quality: 'green' | 'yellow' | 'red';
    latency: number;
    packetLoss: number;
}

import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface Language {
    code: string;
    name: string;
    native: string;
    voice: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English', native: 'English', voice: 'Google US English' },
    { code: 'ur', name: 'Urdu', native: 'اردو', voice: 'Microsoft Uzma - Urdu (Pakistan)' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', voice: 'Google हिन्दी' },
    { code: 'ar', name: 'Arabic', native: 'العربية', voice: 'Google Arabic' },
    { code: 'fr', name: 'French', native: 'Français', voice: 'Google Français' },
    { code: 'es', name: 'Spanish', native: 'Español', voice: 'Google Español' }
];

// Phonetic dictionary for South Asian languages to fix synthesis issues
const PHONETIC_MAP: Record<string, Record<string, string>> = {
    'ur': {
        'LumiX': 'لومکس',
        'SMS': 'ایس ایم ایس',
        'Genesis': 'جینیسس',
        'AI': 'اے آئی'
    },
    'hi': {
        'LumiX': 'ल्यूमिक्स',
        'SMS': 'एसएमएस',
        'Genesis': 'जेनेसिस',
        'AI': 'एआई'
    }
};

interface LandingChatBotProps {
    onScrollTo: (id: string) => void;
}

const LandingChatBot: React.FC<LandingChatBotProps> = ({ onScrollTo }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [currentLang, setCurrentLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
    
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I'm NOVA. I'm the architect behind LumiX. It's truly a pleasure to meet you! Are you ready to explore how we're reshaping education together?", sender: 'ai', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const inputRef = useRef('');
    useEffect(() => {
        inputRef.current = input;
    }, [input]);

    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);
    
    const [isSpeaking, setIsSpeaking] = useState(true);
    const [speechError, setSpeechError] = useState<string | null>(null);

    const speak = useCallback((text: string) => {
        if (!isSpeaking || !('speechSynthesis' in window)) return;
        
        // Increment speech ID to invalidate previous chains
        const currentSpeechId = ++speechIdRef.current;
        
        // Cancel existing speech
        window.speechSynthesis.cancel();

        // Small delay to ensure the browser has cleared the queue
        setTimeout(() => {
            if (currentSpeechId !== speechIdRef.current) return;

            // Apply phonetic overrides for South Asian languages
            let processedText = text;
            const langMap = PHONETIC_MAP[currentLang.code];
            if (langMap) {
                Object.entries(langMap).forEach(([eng, native]) => {
                    processedText = processedText.replace(new RegExp(eng, 'gi'), native);
                });
            }

            // Split long text into smaller chunks for better browser support
            const chunks = processedText.match(/[^.!?]+[.!?]*|[^.!?]+/g) || [processedText];
            
            let chunkIndex = 0;

            const speakNextChunk = () => {
                if (currentSpeechId !== speechIdRef.current || chunkIndex >= chunks.length) return;

                const chunk = chunks[chunkIndex].trim();
                if (!chunk) {
                    chunkIndex++;
                    speakNextChunk();
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(chunk);
                let voices = window.speechSynthesis.getVoices();
                
                if (voices.length === 0) {
                    // Try one more time after a short delay if voices aren't loaded
                    setTimeout(() => {
                        if (currentSpeechId !== speechIdRef.current) return;
                        voices = window.speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            proceedWithUtterance(utterance, voices);
                        }
                    }, 100);
                } else {
                    proceedWithUtterance(utterance, voices);
                }
            };

            const proceedWithUtterance = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) => {
                if (currentSpeechId !== speechIdRef.current) return;

                const langCode = currentLang.code === 'ur' ? 'ur-PK' : 
                                 currentLang.code === 'hi' ? 'hi-IN' : 
                                 currentLang.code === 'ar' ? 'ar-SA' : 
                                 currentLang.code;

                utterance.lang = langCode;

                let voice = voices.find(v => v.lang === langCode) || 
                            voices.find(v => v.lang.startsWith(currentLang.code)) ||
                            voices.find(v => v.lang.includes(langCode));
                
                if (currentLang.code === 'ur') {
                    voice = voices.find(v => (v.name.includes('Uzma') || v.name.includes('Urdu') || v.lang.startsWith('ur')) && v.lang.includes('PK')) ||
                            voices.find(v => v.name.includes('Urdu')) ||
                            voices.find(v => v.lang.startsWith('ur'));
                } else if (currentLang.code === 'hi') {
                    voice = voices.find(v => (v.name.includes('Hindi') || v.lang.startsWith('hi')) && v.lang.includes('IN')) ||
                            voices.find(v => v.name.includes('Hindi')) ||
                            voices.find(v => v.lang.startsWith('hi'));
                }

                if (voice) {
                    utterance.voice = voice;
                }
                
                utterance.pitch = 1.0;
                utterance.rate = currentLang.code === 'ur' || currentLang.code === 'hi' ? 0.9 : 1.0; 
                
                utterance.onend = () => {
                    if (currentSpeechId === speechIdRef.current) {
                        chunkIndex++;
                        speakNextChunk();
                    }
                };

                utterance.onerror = (event: any) => {
                    // Ignore 'interrupted' as it happens normally when we cancel or skip
                    if (event.error !== 'interrupted' && currentSpeechId === speechIdRef.current) {
                        console.error("SpeechSynthesisUtterance error:", event.error);
                    }
                    // Continue to next chunk even on error if it's still the current speech
                    if (currentSpeechId === speechIdRef.current) {
                        chunkIndex++;
                        speakNextChunk();
                    }
                };

                window.speechSynthesis.speak(utterance);
            };

            speakNextChunk();
        }, 50);
    }, [currentLang.code, isSpeaking]);

    const handleSend = useCallback(async (textOverride?: string) => {
        const textToSend = textOverride || inputRef.current;
        if (!textToSend.trim()) return;

        // Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Convert current messages to API history format
            // We use functional update or a ref to get the latest messages without making handleSend depend on 'messages'
            setMessages(currentMessages => {
                const history = currentMessages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));

                // Start API call in the background
                api.sendLandingChat(textToSend, history, currentLang.code).then(data => {
                    let responseText = data.response;
                    
                    // Check for JSON Tools
                    try {
                        let cleanText = responseText.trim();
                        if (cleanText.includes('```')) {
                            const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) {
                                cleanText = match[1].trim();
                            }
                        }

                        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
                            const toolAction = JSON.parse(cleanText);
                            responseText = toolAction.text || "Executing command...";
                            
                            if (toolAction.action === 'scroll' || toolAction.action === 'navigate') {
                                const target = String(toolAction.target || '').trim();
                                if (target.startsWith('/')) {
                                    navigate(target);
                                } else if (target && document.getElementById(target)) {
                                    onScrollTo(target);
                                } else if (target === 'pricing' || target === 'plans') {
                                    navigate('/subscribe');
                                } else if (target) {
                                    onScrollTo(target);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Failed to parse AI tool action:", e);
                    }

                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        text: responseText,
                        sender: 'ai',
                        timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, aiMsg]);
                    speak(responseText);
                    setIsTyping(false);
                }).catch(e => {
                    console.error("Landing chat error:", e);
                    const errorMessage = e.response?.data?.detail || e.message || "";
                    let text = currentLang.code === 'ur' 
                        ? "میرا اعصابی لنک فی الحال غیر مستحکم ہے۔ براہ کرم بعد میں دوبارہ کوشش کریں۔"
                        : "My neural link is currently unstable. Please try again later.";
                    
                    if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("429")) {
                        text = "AI quota exceeded. Please try again later.";
                    }

                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text,
                        sender: 'ai',
                        timestamp: new Date()
                    }]);
                    setIsTyping(false);
                });

                return currentMessages;
            });
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
        }
    }, [currentLang.code, navigate, onScrollTo, speak]);

    // --- NEW VOICE STATE ---
    const [callState, setCallState] = useState<VoiceCallState>({
        isActive: false,
        isConnecting: false,
        isMuted: false,
        volume: 0.8,
        quality: 'green',
        latency: 0,
        packetLoss: 0
    });
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>();
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const speechIdRef = useRef<number>(0);
    const recognitionRetryRef = useRef<number>(0);
    const MAX_RECOGNITION_RETRIES = 3;

    // Update greeting when language changes
    useEffect(() => {
        if (currentLang.code === 'en') return;
        
        const greetings: Record<string, string> = {
            'ur': "ہیلو! میں نووا ہوں۔ میں لومکس کے پیچھے معمار ہوں۔ آپ سے مل کر واقعی خوشی ہوئی! کیا آپ یہ جاننے کے لیے تیار ہیں کہ ہم مل کر تعلیم کو کس طرح نئی شکل دے رہے ہیں؟",
            'hi': "नमस्ते! मैं नोवा हूँ। मैं ल्यूमिक्स के पीछे की वास्तुकार हूँ। आपसे मिलकर वास्तव में खुशी हुई! क्या आप यह पता लगाने के लिए तैयार हैं कि हम मिलकर शिक्षा को कैसे नया आकार दे रहे हैं?",
            'ar': "مرحباً! أنا نوفا. أنا المهندسة المعمارية وراء لوميكس. إنه لمن دواعي سروري حقاً مقابلتك! هل أنت مستعد لاستكشاف كيف نعيد تشكيل التعليم معاً؟",
            'fr': "Bonjour ! Je suis NOVA. Je suis l'architecte derrière LumiX. C'est un réel plaisir de vous rencontrer ! Êtes-vous prêt à explorer comment nous remodelons ensemble l'éducation ?",
            'es': "¡Hola! Soy NOVA. Soy la arquitecta detrás de LumiX. ¡Es un verdadero placer conocerte! ¿Estás listo para explorar cómo estamos remodelando la educación juntos?"
        };

        if (greetings[currentLang.code]) {
            setMessages([{
                id: '1',
                text: greetings[currentLang.code],
                sender: 'ai',
                timestamp: new Date()
            }]);
        }
    }, [currentLang]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // --- VOICE TO VOICE LOGIC ---
    const startCall = async () => {
        setSpeechError(null);
        recognitionRetryRef.current = 0;
        try {
            setCallState(prev => ({ ...prev, isConnecting: true }));
            
            // 1. Request Microphone Access with Consent
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                } 
            });
            streamRef.current = stream;

            // 2. Initialize Audio Processing Layer (WebAudio API)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            // 3. Setup WebRTC (Simulated P2P with server for now)
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Network Monitoring Simulation
            const monitorInterval = setInterval(() => {
                if (pc.getStats) {
                    pc.getStats().then(stats => {
                        stats.forEach(report => {
                            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                                const jitter = report.jitter * 1000;
                                const packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100;
                                setCallState(prev => ({
                                    ...prev,
                                    latency: Math.round(jitter),
                                    packetLoss: Math.round(packetLoss),
                                    quality: packetLoss > 10 ? 'red' : packetLoss > 5 ? 'yellow' : 'green'
                                }));
                            }
                        });
                    });
                }
            }, 2000);

            // 4. Visualization
            drawWaveform();

            setCallState(prev => ({ ...prev, isActive: true, isConnecting: false }));
            
            // Notify AI that a voice session started
            handleSend("NOVA, I'm starting a voice link. Are you there?");

        } catch (err) {
            console.error("Failed to start voice call:", err);
            setCallState(prev => ({ ...prev, isConnecting: false, isActive: false }));
            alert("Microphone access is required for voice interaction.");
        }
    };

    const endCall = () => {
        setSpeechError(null);
        recognitionRetryRef.current = 0;
        streamRef.current?.getTracks().forEach(track => track.stop());
        peerConnectionRef.current?.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setCallState({
            isActive: false,
            isConnecting: false,
            isMuted: false,
            volume: 0.8,
            quality: 'green',
            latency: 0,
            packetLoss: 0
        });
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyzerRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyzerRef.current!.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
                gradient.addColorStop(1, 'rgba(6, 182, 212, 0.8)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };
        draw();
    };

    const toggleMute = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
        }
    };

    const isMutedRef = useRef(false);
    useEffect(() => {
        isMutedRef.current = callState.isMuted;
    }, [callState.isMuted]);

    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // --- SPEECH RECOGNITION SETUP ---
    const initRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window)) return;

        // Clean up existing instance if any
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            } catch (e) {}
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = callState.isActive;
        recognition.interimResults = false;
        recognition.lang = currentLang.code === 'ur' ? 'ur-PK' : currentLang.code === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event: any) => {
            recognitionRetryRef.current = 0;
            setSpeechError(null);
            const transcript = event.results[event.results.length - 1][0].transcript;
            
            if (callState.isActive) {
                handleSend(transcript);
            } else {
                setInput(transcript);
                handleSend(transcript);
                setIsListening(false);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'network' && event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error("Speech recognition error:", event.error);
            }
            
            if (event.error === 'network' || event.error === 'no-speech') {
                if (recognitionRetryRef.current < MAX_RECOGNITION_RETRIES && (callState.isActive || isListeningRef.current)) {
                    recognitionRetryRef.current++;
                    setSpeechError(`Connection unstable. Retrying... (${recognitionRetryRef.current}/${MAX_RECOGNITION_RETRIES})`);
                    (recognition as any).isRetrying = true;

                    setTimeout(() => {
                        try {
                            if (!isMutedRef.current) {
                                (recognition as any).isRetrying = false;
                                recognition.start();
                            }
                        } catch (e) {}
                    }, 1000 * recognitionRetryRef.current);
                    return;
                } else if (recognitionRetryRef.current >= MAX_RECOGNITION_RETRIES) {
                    setSpeechError("Speech recognition unavailable. Please check your connection.");
                }
            } else if (event.error === 'not-allowed') {
                setSpeechError("Microphone access denied.");
            }

            if (!callState.isActive) setIsListening(false);
        };

        recognition.onend = () => {
            if ((recognition as any).isRetrying) return;

            // Use the ref to check current listening state to avoid stale closure issues
            if ((callState.isActive && !isMutedRef.current) || (isListeningRef.current && recognitionRetryRef.current === 0)) {
                try {
                    recognition.start();
                } catch (e) {}
            } else if (!callState.isActive) {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
    }, [currentLang.code, callState.isActive, handleSend]);

    // 1. Initialize recognition object when core settings change
    useEffect(() => {
        initRecognition();
    }, [initRecognition]);

    // 2. Manage recognition lifecycle (start/stop) based on state
    useEffect(() => {
        if (!recognitionRef.current) return;

        const shouldBeRunning = (callState.isActive || isListening) && !callState.isMuted;
        
        if (shouldBeRunning) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Already started or other error
            }
        } else {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
        }
    }, [callState.isActive, isListening, callState.isMuted]);

    // 3. Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.onerror = null;
                    recognitionRef.current.onend = null;
                    recognitionRef.current.stop();
                } catch (e) {}
            }
        };
    }, []);

    const toggleListening = () => {
        setSpeechError(null);
        recognitionRetryRef.current = 0;
        setIsListening(!isListening);
    };

    return (
        <>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-110 ${
                    isOpen ? 'bg-red-500 rotate-90' : 'bg-cyan-500 animate-pulse'
                }`}
            >
                {isOpen ? <X size={24} className="text-white" /> : <Bot size={24} className="text-black" />}
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[70vh] glass-panel border border-cyan-500/30 rounded-2xl flex flex-col shadow-2xl z-40 transition-all duration-500 origin-bottom-right overflow-hidden ${
                isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
            }`}>
                
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-cyan-950/30 flex items-center justify-between backdrop-blur-md relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500 relative">
                            <Bot size={20} className="text-cyan-400" />
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold font-sci-fi tracking-wider">NOVA AI</h3>
                            <p className="text-[10px] text-cyan-400 font-mono">SYSTEM: ONLINE</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {/* Call Button */}
                        <button 
                            onClick={callState.isActive ? endCall : startCall}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
                                callState.isActive 
                                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                                : 'border-transparent text-cyan-400 hover:bg-cyan-500/10'
                            }`}
                            title={callState.isActive ? "End Voice Link" : "Start Voice Link"}
                        >
                            {callState.isActive ? <PhoneOff size={18} /> : <Phone size={18} />}
                        </button>

                        {/* Language Selector */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1 border ${
                                    showLangMenu ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'border-transparent text-slate-400 hover:bg-white/5'
                                }`}
                                title="Change Language"
                            >
                                <Globe size={18} />
                                <span className="text-[10px] font-bold uppercase">{currentLang.code}</span>
                            </button>

                            {showLangMenu && (
                                <div className="absolute top-full right-0 mt-2 w-32 glass-panel border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setCurrentLang(lang);
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between ${
                                                currentLang.code === lang.code ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <span>{lang.native}</span>
                                            {currentLang.code === lang.code && <div className="w-1 h-1 bg-cyan-500 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setIsSpeaking(!isSpeaking)}
                            className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-slate-600 hover:bg-white/5'}`}
                        >
                            {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/40 relative">
                    {/* Call Overlay */}
                    {callState.isActive && (
                        <div className="absolute inset-x-0 top-0 z-10 p-4 bg-cyan-950/80 backdrop-blur-xl border-b border-cyan-500/30 animate-in slide-in-from-top duration-300">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity size={16} className="text-cyan-400 animate-pulse" />
                                        <span className="text-xs font-sci-fi text-cyan-100 tracking-widest uppercase">Voice Link Active</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Signal size={12} className={callState.quality === 'green' ? 'text-green-400' : callState.quality === 'yellow' ? 'text-yellow-400' : 'text-red-400'} />
                                            <span className="text-[10px] text-slate-400 font-mono">{callState.latency}ms</span>
                                        </div>
                                        <div className="w-px h-3 bg-white/10" />
                                        <span className="text-[10px] text-slate-400 font-mono">Loss: {callState.packetLoss}%</span>
                                    </div>
                                </div>

                                <div className="h-16 w-full bg-black/40 rounded-xl overflow-hidden border border-white/5 relative">
                                    <canvas ref={canvasRef} className="w-full h-full" width={400} height={100} />
                                    {!callState.isMuted && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 flex-1 px-2">
                                        <Volume2 size={14} className="text-slate-400" />
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={callState.volume}
                                            onChange={(e) => setCallState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <span className="text-[10px] text-slate-500 font-mono w-8">{Math.round(callState.volume * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-white/10 pl-2 ml-2">
                                        <button 
                                            onClick={toggleMute}
                                            className={`p-2 rounded-lg transition-all ${callState.isMuted ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-white/5'}`}
                                        >
                                            {callState.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                                        </button>
                                        <button 
                                            onClick={endCall}
                                            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <PhoneOff size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                msg.sender === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div 
                                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.sender === 'user' 
                                    ? 'bg-purple-600/20 border border-purple-500/30 text-white rounded-tr-none' 
                                    : 'bg-cyan-900/20 border border-cyan-500/30 text-slate-200 rounded-tl-none'
                                } ${currentLang.code === 'ur' || currentLang.code === 'ar' ? 'font-arabic text-lg' : ''}`}
                                dir="auto"
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                <Bot size={14} />
                            </div>
                            <div className="bg-cyan-900/20 border border-cyan-500/30 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-md">
                    {speechError && (
                        <div className="mb-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Activity size={12} className="text-red-400" />
                            <span className="text-[10px] text-red-200 font-medium">{speechError}</span>
                        </div>
                    )}
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={currentLang.code === 'ur' ? "یہاں لکھیں..." : "Ask about features, pricing..."}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                            dir="auto"
                        />
                        
                        <div className="absolute right-2 flex items-center gap-1">
                            {/* Voice Input */}
                            {'webkitSpeechRecognition' in window && (
                                <button 
                                    onClick={toggleListening}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isListening ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                                    }`}
                                >
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            )}
                            
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="text-[10px] text-center text-slate-600 mt-2 font-mono">
                        NOVA AI v3.0 | Secure Channel
                    </div>
                </div>
            </div>
        </>
    );
};

export default LandingChatBot;

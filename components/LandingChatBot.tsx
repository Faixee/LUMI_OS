import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles, Globe, Settings, Phone, PhoneOff, Signal, Sliders, Activity } from 'lucide-react';
import { api } from '../services/api';  // → Keep as is
import { useNavigate } from 'react-router-dom';

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

// Phonetic dictionary for South Asian languages → Insert or keep
const PHONETIC_MAP: Record<string, Record<string, string>> = {
    'ur': { 'LumiX': 'لومکس', 'SMS': 'ایس ایم ایس', 'Genesis': 'جینیسس', 'AI': 'اے آئی' },
    'hi': { 'LumiX': 'ल्यूमिक्स', 'SMS': 'एसएमएस', 'Genesis': 'जेनेसिस', 'AI': 'एआई' }
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
    useEffect(() => { inputRef.current = input; }, [input]);

    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const [isSpeaking, setIsSpeaking] = useState(true);
    const [speechError, setSpeechError] = useState<string | null>(null);

    // → SPEECH HANDLER
    const speechIdRef = useRef<number>(0);  // → Insert this
    const speak = useCallback((text: string) => {  // → Replace old simple speechSynthesis
        if (!isSpeaking || !('speechSynthesis' in window)) return;
        const currentSpeechId = ++speechIdRef.current;
        window.speechSynthesis.cancel();

        // Apply phonetic map if needed
        let processedText = text;
        const langMap = PHONETIC_MAP[currentLang.code];
        if (langMap) {
            Object.entries(langMap).forEach(([eng, native]) => {
                processedText = processedText.replace(new RegExp(eng, 'gi'), native);
            });
        }

        const chunks = processedText.match(/[^.!?]+[.!?]*|[^.!?]+/g) || [processedText];
        let index = 0;

        const speakNext = () => {
            if (index >= chunks.length || currentSpeechId !== speechIdRef.current) return;
            const utterance = new SpeechSynthesisUtterance(chunks[index]);
            utterance.lang = currentLang.code === 'ur' ? 'ur-PK' :
                             currentLang.code === 'hi' ? 'hi-IN' : currentLang.code;
            utterance.onend = () => { index++; speakNext(); };
            window.speechSynthesis.speak(utterance);
        };
        speakNext();
    }, [currentLang.code, isSpeaking]);

    // → HANDLE SEND (REPLACE OLD fetch)
    const handleSend = useCallback(async (textOverride?: string) => {
        const textToSend = textOverride || inputRef.current;
        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // → NEW API CALL
            api.sendLandingChat(textToSend, messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })), currentLang.code).then(data => {
                let responseText = data.response;

                // → JSON Tool Handling
                try {
                    let cleanText = responseText.trim();
                    if (cleanText.includes('```')) {
                        const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                        if (match && match[1]) cleanText = match[1].trim();
                    }
                    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
                        const parsed = JSON.parse(cleanText);
                        responseText = parsed.text || responseText;
                        if (parsed.action === 'scroll' || parsed.action === 'navigate') {
                            const target = String(parsed.target || '').trim();
                            if (target.startsWith('/')) navigate(target);
                            else if (target) onScrollTo(target);
                        }
                    }
                } catch (e) { console.warn("Failed to parse AI tool action:", e); }

                const aiMsg: Message = { id: (Date.now()+1).toString(), text: responseText, sender: 'ai', timestamp: new Date() };
                setMessages(prev => [...prev, aiMsg]);
                speak(responseText);
                setIsTyping(false);
            }).catch(e => {
                console.error("Landing chat error:", e);
                let text = currentLang.code === 'ur' ? "میرا اعصابی لنک فی الحال غیر مستحکم ہے۔ براہ کرم بعد میں دوبارہ کوشش کریں۔" : "My neural link is currently unstable. Please try again later.";
                setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'ai', timestamp: new Date() }]);
                setIsTyping(false);
            });
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
        }
    }, [currentLang.code, navigate, onScrollTo, speak, messages]);

    // → LANGUAGE GREETING
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
            setMessages([{ id: '1', text: greetings[currentLang.code], sender: 'ai', timestamp: new Date() }]);
        }
    }, [currentLang]);

    // → VOICE STATE
    const [callState, setCallState] = useState<VoiceCallState>({
        isActive: false, isConnecting: false, isMuted: false, volume: 0.8, quality: 'green', latency: 0, packetLoss: 0
    });

    // → Audio / recognition refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const recognitionRetryRef = useRef(0);
    const hasPermissionRef = useRef<boolean | null>(null);
    const MAX_RECOGNITION_RETRIES = 3;

    // → VOICE & RECOGNITION FUNCTIONS
    const drawWaveform = () => {
        if (!canvasRef.current || !analyzerRef.current || !callState.isActive) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyzer = analyzerRef.current;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!callState.isActive) return;
            animationFrameRef.current = requestAnimationFrame(draw);

            analyzer.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 255)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    const toggleMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !callState.isMuted;
            });
            setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
        }
    };

    const initRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false; // We want distinct phrases in chat mode
        recognition.interimResults = false;
        recognition.lang = currentLang.code === 'ur' ? 'ur-PK' :
                           currentLang.code === 'hi' ? 'hi-IN' :
                           currentLang.code === 'ar' ? 'ar-SA' :
                           currentLang.code === 'es' ? 'es-ES' :
                           currentLang.code === 'fr' ? 'fr-FR' : 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setSpeechError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
            // If we are in a call, restart listening (continuous conversation)
            // Stop retrying if permission was explicitly denied
            if (callState.isActive && 
                hasPermissionRef.current !== false &&
                recognitionRetryRef.current < MAX_RECOGNITION_RETRIES) {
                try {
                    recognition.start();
                } catch {
                    recognitionRetryRef.current++;
                }
            }
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                setInput(transcript);
                handleSend(transcript);
                recognitionRetryRef.current = 0; // Reset retries on success
                hasPermissionRef.current = true;
            }
        };

        recognition.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setSpeechError("Microphone access denied. Please enable it in your browser settings.");
                hasPermissionRef.current = false;
            }
        };

        recognitionRef.current = recognition;
    }, [currentLang.code, callState.isActive, handleSend]);

    const startCall = async () => {
        setSpeechError(null);
        recognitionRetryRef.current = 0;
        try {
            setCallState(prev => ({ ...prev, isConnecting: true }));
            
            // 0. Check for Secure Context
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                throw new Error("Microphone access requires a secure connection (HTTPS).");
            }

            // 1. Request Microphone Access
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser does not support microphone access.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            streamRef.current = stream;
            hasPermissionRef.current = true;

            // 2. Initialize Audio Context for Visualizer
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            // 3. Setup WebRTC (Simulated)
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // 4. Start Recognition
            initRecognition();
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }

            setCallState(prev => ({ ...prev, isConnecting: false, isActive: true }));
            
            // Start Visualizer
            setTimeout(drawWaveform, 100);

            // Initial Greeting
            const greeting = currentLang.code === 'ur' ? "میں سن رہی ہوں۔" : "I'm listening.";
            speak(greeting);

        } catch (err: any) {
            console.error("Failed to start call:", err);
            let errorMessage = "Could not access microphone.";
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Microphone access denied. Please enable it in your browser settings and try again.";
                hasPermissionRef.current = false;
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No microphone found on your device.";
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSpeechError(errorMessage);
            setCallState(prev => ({ ...prev, isConnecting: false, isActive: false }));
        }
    };

    const endCall = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        
        setCallState(prev => ({ ...prev, isActive: false, isConnecting: false }));
        setIsListening(false);
    };

    // → UI Return
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[360px] md:w-[420px] bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col mb-4 transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in zoom-in-95">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 relative">
                                <Bot size={20} className="text-cyan-400" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white font-sci-fi">NOVA <span className="text-xs text-cyan-400 font-mono ml-1">v2.4</span></h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                    title="Change Language"
                                >
                                    <Globe size={18} />
                                </button>
                                
                                {showLangMenu && (
                                    <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 w-48 z-50">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setCurrentLang(lang);
                                                    setShowLangMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${currentLang.code === lang.code ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-300'}`}
                                            >
                                                <span>{lang.name}</span>
                                                <span className="text-xs opacity-50 font-mono">{lang.native}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setIsSpeaking(!isSpeaking)}
                                className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-cyan-400 hover:bg-cyan-950/30' : 'text-slate-500 hover:bg-white/10'}`}
                                title={isSpeaking ? "Mute Voice" : "Enable Voice"}
                            >
                                {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Voice Call Mode */}
                    {callState.isActive ? (
                        <div className="flex-1 bg-black/50 p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                            {/* Visualizer Canvas */}
                            <canvas 
                                ref={canvasRef} 
                                width={400} 
                                height={200} 
                                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                            />
                            
                            <div className="relative z-10 text-center space-y-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto animate-pulse">
                                        <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                            <Bot size={32} className="text-cyan-400" />
                                        </div>
                                    </div>
                                    {isListening && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                                            LISTENING
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white font-sci-fi tracking-wider">NEURAL LINK ACTIVE</h3>
                                    <p className="text-cyan-400 font-mono text-xs mt-1 animate-pulse">
                                        {isListening ? "Listening..." : "Processing..."}
                                    </p>
                                </div>

                                {speechError && (
                                    <div className="text-red-400 text-xs bg-red-950/30 px-3 py-1 rounded-full border border-red-500/20">
                                        {speechError}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 justify-center">
                                    <button 
                                        onClick={toggleMute}
                                        className={`p-4 rounded-full transition-all ${callState.isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        {callState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>
                                    <button 
                                        onClick={endCall}
                                        className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                                    >
                                        <PhoneOff size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Text Chat Mode */
                        <>
                            {/* Messages */}
                            <div className="h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                                            {msg.sender === 'ai' ? <Bot size={14} className="text-cyan-400" /> : <User size={14} className="text-purple-400" />}
                                        </div>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            msg.sender === 'ai' 
                                                ? 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none' 
                                                : 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/10'
                                        }`}>
                                            {msg.text}
                                            <div className="text-[10px] opacity-40 mt-1 text-right font-mono">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                            <Bot size={14} className="text-cyan-400" />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-white/5 space-y-3">
                                {/* Voice Call Prompt */}
                                <button 
                                    onClick={startCall}
                                    className="w-full py-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 hover:border-cyan-500/30 transition-all group"
                                >
                                    <Phone size={12} className="group-hover:animate-bounce" />
                                    <span>START VOICE SESSION</span>
                                    <span className="px-1.5 py-0.5 bg-cyan-500/20 rounded text-[9px] border border-cyan-500/30">BETA</span>
                                </button>

                                <div className="relative flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={`Message NOVA (${currentLang.name})...`}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono"
                                    />
                                    <button 
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className="p-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/20 ${isOpen ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-cyan-500 text-black hover:scale-110 hover:shadow-cyan-500/40'}`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} className="fill-current" />}
                
                {!isOpen && (
                    <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-ping"></span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
                    </>
                )}
            </button>
        </div>
    );
};

export default LandingChatBot;

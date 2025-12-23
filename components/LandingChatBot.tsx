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
            setMessages(currentMessages => {
                const history = currentMessages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));

                // → NEW API CALL
                api.sendLandingChat(textToSend, history, currentLang.code).then(data => {
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
                return currentMessages;
            });
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
        }
    }, [currentLang.code, navigate, onScrollTo, speak]);

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
    const recognitionRetryRef = useRef<number>(0);
    const MAX_RECOGNITION_RETRIES = 3;

    // → VOICE & RECOGNITION FUNCTIONS
    const startCall = async () => { /* → full startCall function from your new code */ };
    const endCall = () => { /* → full endCall function from your new code */ };
    const drawWaveform = () => { /* → full drawWaveform function */ };
    const toggleMute = () => { /* → toggleMute function */ };
    const initRecognition = useCallback(() => { /* → full recognition setup */ }, [currentLang.code, callState.isActive, handleSend]);

    // → UI Return (Keep mostly same, only wire startCall, endCall, handleSend, speak)
    return (
        <div>{/* Your existing JSX, wire buttons to startCall/endCall, voice input, and handleSend → already updated in above code */}</div>
    );
};

export default LandingChatBot;


import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface LandingChatBotProps {
    onScrollTo: (id: string) => void;
}

const LandingChatBot: React.FC<LandingChatBotProps> = ({ onScrollTo }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Greetings. I am NOVA, the autonomous intelligence of LumiX. How may I assist your system evaluation today?", sender: 'ai', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const speak = (text: string) => {
        if (!isSpeaking || !('speechSynthesis' in window)) return;
        
        // Cancel existing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Try to find a futuristic/robotic voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.pitch = 1.0;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
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
            const history = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            // Call API
            const data = await api.sendLandingChat(textToSend, history);
            let responseText = data.response;
            
            // Check for JSON Tools
            try {
                if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                    const toolAction = JSON.parse(responseText);
                    responseText = toolAction.text || "Executing command...";
                    
                    if (toolAction.action === 'scroll') {
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
                    } else if (toolAction.action === 'navigate') {
                        navigate(toolAction.target);
                    }
                }
            } catch (e) {
                // Not JSON, just plain text
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, aiMsg]);
            speak(responseText);

        } catch (e: any) {
            console.error("Landing chat error:", e);
            const errorMessage = e.response?.data?.detail || e.message || "";
            let text = "My neural link is currently unstable. Please try again later.";
            
            if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("429")) {
                text = "AI quota exceeded. Please try again later. (This is a free tier limit of the Gemini API)";
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: text,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
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
                <div className="p-4 border-b border-white/10 bg-cyan-950/30 flex items-center justify-between backdrop-blur-md">
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
                    <button 
                        onClick={() => setIsSpeaking(!isSpeaking)}
                        className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-slate-600 hover:bg-white/5'}`}
                    >
                        {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/40">
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
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-purple-600/20 border border-purple-500/30 text-white rounded-tr-none' 
                                : 'bg-cyan-900/20 border border-cyan-500/30 text-slate-200 rounded-tl-none'
                            }`}>
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
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about features, pricing..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
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

import React, { useState, useRef, useEffect } from 'react';
import { getAriaResponse } from '../../services/geminiService';
import { UserProfile, ChatMessage, Incident, SafetyZone, Attraction, Hotel } from '../../types';
import { Send, Bot, User, Shield, Sparkles, AlertTriangle, MapPin, Loader2, Mic, Calendar, Heart, Navigation, Globe, Languages, Volume2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

interface AriaAssistantProps {
  profile: UserProfile | null;
}

export default function AriaAssistant({ profile }: AriaAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${profile?.displayName?.split(' ')[0]}! I'm ARIA 2026, your agentic safety companion. I've analyzed your current location and safety score. How can I assist you with your travel today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translatorMode, setTranslatorMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubIncidents = onSnapshot(query(collection(db, 'incidents'), limit(5)), (s) => 
      setIncidents(s.docs.map(d => d.data() as Incident)));
    const unsubZones = onSnapshot(query(collection(db, 'safety_zones'), limit(5)), (s) => 
      setZones(s.docs.map(d => d.data() as SafetyZone)));
    const unsubAttractions = onSnapshot(query(collection(db, 'attractions'), limit(5)), (s) => 
      setAttractions(s.docs.map(d => d.data() as Attraction)));
    const unsubHotels = onSnapshot(query(collection(db, 'hotels'), limit(5)), (s) => 
      setHotels(s.docs.map(d => d.data() as Hotel)));

    return () => {
      unsubIncidents();
      unsubZones();
      unsubAttractions();
      unsubHotels();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, textOverride?: string, audioData?: { data: string, mimeType: string }) => {
    if (e) e.preventDefault();
    const finalInput = textOverride || input;
    if (!finalInput.trim() && !audioData && isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: audioData ? "🎤 [Voice Message]" : finalInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const context = {
      ...profile,
      incidents,
      zones,
      attractions,
      hotels,
      location: "Downtown Core, Singapore"
    };

    const geminiInput = audioData ? { inlineData: audioData } : finalInput;
    const response = await getAriaResponse(geminiInput as any, context);
    
    const ariaMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response || "I'm sorry, I couldn't process that request.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, ariaMessage]);
    setIsLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          handleSend(undefined, undefined, { data: base64Content, mimeType: 'audio/webm' });
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Map selected language to language codes
      const langMap: Record<string, string> = {
        'Hindi': 'hi-IN',
        'Telugu': 'te-IN',
        'Tamil': 'ta-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'English': 'en-IN'
      };

      const targetLang = langMap[selectedLanguage] || 'en-IN';
      const voice = voices.find(v => v.lang.includes(targetLang));
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis not supported.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const suggestions = [
    { label: "Translate to Hindi", icon: Languages },
    { label: "Speak in Telugu", icon: Volume2 },
    { label: "Kannada safety tips", icon: Shield },
    { label: "Tamil travel guide", icon: MapPin },
    { label: "Malayalam emergency", icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Chat Header */}
      <div className="p-5 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight text-slate-100">ARIA 2026</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Agentic Safety Intelligence</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setTranslatorMode(!translatorMode)}
            className={`p-2.5 rounded-xl transition-all duration-300 border ${translatorMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
            title="Translator Mode"
          >
            <Languages className="w-4.5 h-4.5" />
          </button>
          <button className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all" title="Meeting Points">
            <Heart className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all duration-300 border ${isListening ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/10 animate-pulse' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
            title="Voice Mode"
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Translator Mode Banner */}
      <AnimatePresence>
        {translatorMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600/5 border-b border-indigo-500/20 px-6 py-5 flex flex-col gap-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <Sparkles className="w-5 h-5 fill-current" />
                <span className="text-sm font-bold uppercase tracking-widest">Master Translator Active</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select Target Language</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {['Hindi', 'Telugu', 'Kannada', 'Tamil', 'Malayalam', 'English'].map(lang => (
                <button 
                  key={lang}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setInput(`Translate the following to ${lang}: `);
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                    selectedLanguage === lang 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/40 scale-105' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar max-w-5xl mx-auto w-full">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border ${
                msg.role === 'user' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className={`p-6 md:p-8 rounded-[2rem] text-lg md:text-xl leading-relaxed shadow-2xl border ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-100 rounded-tl-none backdrop-blur-sm'
              }`}>
                <div className="markdown-body prose prose-invert prose-indigo max-w-none mb-6">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6 pt-6 border-t border-slate-800/60">
                    <button 
                      onClick={() => speak(msg.content)}
                      className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 ${
                        isSpeaking ? 'text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'
                      }`}
                    >
                      <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      {isSpeaking ? 'Speaking...' : `Speak in ${selectedLanguage}`}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(msg.content)}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button 
                      onClick={() => setInput(`Translate this to ${selectedLanguage === 'Hindi' ? 'Telugu' : 'Hindi'}: ${msg.content}`)}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors ml-auto"
                    >
                      Quick Translate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-xl">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-500 font-medium italic">ARIA is processing contextual data...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => handleSend(undefined, s.label)}
            className="whitespace-nowrap px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 pb-32 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/60 shadow-2xl relative z-10">
        <form onSubmit={handleSend} className="relative flex gap-4 max-w-4xl mx-auto">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ARIA to translate or speak in Hindi, Telugu, etc..."
              className="w-full p-5 pr-16 bg-slate-900/50 border border-slate-800/60 rounded-[2rem] text-base text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all shadow-inner placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all duration-300 ${
                isListening ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-[2rem] transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center group active:scale-95"
          >
            <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}

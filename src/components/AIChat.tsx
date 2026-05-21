import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage, RouteOption } from '../types';
import { chatAboutRoute } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AIChatProps {
  routeData: RouteOption | null;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ routeData, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: `initial-${Math.random().toString(36).substr(2, 9)}`, role: 'assistant', content: "DRR AI Systems Initialized. I am analyzing your current spatial corridors. How can I assist with your route rationalization today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQueries = [
    { label: "Why this route?", value: "Why is this route being suggested over others?" },
    { label: "Avoid traffic", value: "Identify any upcoming congestion points and suggest avoidances." },
    { label: "Eco Analysis", value: "What is the environmental footprint of this journey?" },
    { label: "Safety Score", value: "Break down the safety parameters for this specific Corridor." }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    const query = text.trim();
    if (!query || !routeData) return;
    
    const userMsg: ChatMessage = { id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatAboutRoute(query, messages, routeData);
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: "Protocol error: Spatial intelligence stream interrupted. Please retry." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative group">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">Intelligence Layer</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">DRR v5.2 Active</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
        {messages.map((msg, idx) => (
          <motion.div 
            key={`${msg.id}-${idx}`}
            initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "flex gap-4 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-shadow",
              msg.role === 'user' 
                ? "bg-zinc-900 border-white/10 text-zinc-400" 
                : "bg-blue-600/20 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed relative group-chat",
              msg.role === 'user' 
                ? "bg-zinc-900 text-zinc-200 rounded-tr-none border border-white/5" 
                : "bg-blue-600/[0.03] text-blue-100 border border-blue-500/10 rounded-tl-none font-medium"
            )}>
              {msg.content}
              {msg.role === 'assistant' && (
                <div className="absolute -left-1 top-2 w-2 h-2 bg-blue-500/20 border-l border-t border-blue-500/30 rotate-45" />
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-4 relative z-10">
        {/* Quick Queries */}
        {messages.length < 5 && (
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.value)}
                className="px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-blue-400 rounded-lg transition-all active:scale-95 font-bold"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate spatial rationalization..."
            className="w-full bg-white/5 border border-white/10 rounded-[20px] py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700 text-white"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-center text-zinc-600 uppercase tracking-[0.2em] font-black">
          Powered by Gemini 1.5 Flash Adaptive Intelligence
        </p>
      </div>
    </div>
  );
};

export default AIChat;

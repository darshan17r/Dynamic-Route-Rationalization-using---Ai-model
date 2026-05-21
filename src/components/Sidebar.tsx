import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Navigation2, Volume2, VolumeX, Leaf, Clock, MapPin, ChevronDown, ChevronUp, Bot, Share2, Zap, Shield, Share, FileText, History as HistoryIcon, Waypoints, Send } from 'lucide-react';
import { Location, RouteOption, SearchResult, ChatMessage } from '../types';
import { searchLocations } from '../services/nominatimService';
import { chatAboutRoute } from '../services/geminiService';
import { cn, formatDuration, formatDistance } from '../lib/utils';

interface SidebarProps {
  onLocationSelect: (loc: Location, type: 'start' | 'dest') => void;
  startLocation: Location | null;
  destination: Location | null;
  routes: RouteOption[];
  activeRouteIndex: number;
  onRouteSelect: (idx: number) => void;
  isNavigating: boolean;
  onStartNav: () => void;
  onStopNav: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  aiExplanation: string | null;
  activeModule: string | null;
  setActiveModule: (module: string | null) => void;
  onDownloadReport: () => void;
  onUseCurrentLocation: () => void;
  idPrefix?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onLocationSelect,
  startLocation,
  destination,
  routes,
  activeRouteIndex,
  onRouteSelect,
  isNavigating,
  onStartNav,
  onStopNav,
  voiceEnabled,
  onVoiceToggle,
  aiExplanation,
  activeModule,
  setActiveModule,
  onDownloadReport,
  onUseCurrentLocation,
  idPrefix = 'sidebar'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'start' | 'dest'>('dest');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name.split(',')[0]
    }, searchType);
    setSearchQuery('');
    setSearchResults([]);
  };

  const [intelligenceMessages, setIntelligenceMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'DRR AI Systems Initialized. Monitoring spatial parameters.' }
  ]);
  const [intelInput, setIntelInput] = useState('');
  const [isIntelTyping, setIsIntelTyping] = useState(false);
  const intelScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intelScrollRef.current) {
      intelScrollRef.current.scrollTop = intelScrollRef.current.scrollHeight;
    }
  }, [intelligenceMessages, isIntelTyping]);

  const handleIntelSend = async (text: string = intelInput) => {
    const query = text.trim();
    if (!query || (!routes[activeRouteIndex] && !destination)) return;
    
    const userMsg: ChatMessage = { id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, role: 'user', content: query };
    setIntelligenceMessages(prev => [...prev, userMsg]);
    setIntelInput('');
    setIsIntelTyping(true);

    try {
      const response = await chatAboutRoute(query, intelligenceMessages, routes[activeRouteIndex] || { startName: startLocation?.name, destName: destination?.name });
      setIntelligenceMessages(prev => [...prev, { id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, role: 'assistant', content: response }]);
    } catch (error) {
      setIntelligenceMessages(prev => [...prev, { id: `assistant-error-${Date.now()}`, role: 'assistant', content: "Stream interrupted. Re-rationalizing..." }]);
    } finally {
      setIsIntelTyping(false);
    }
  };

  const featureCards = [
    { id: 'logic', title: 'Rational', icon: <Bot className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'safety', title: 'Secure', icon: <Shield className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'eco', title: 'Eco', icon: <Leaf className="w-3.5 h-3.5 text-green-500" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] border-r border-white/5 overflow-hidden">
      {/* Header / Search */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
               <div className="absolute inset-0 bg-blue-600/30 blur-md rounded-lg" />
               <div className="relative w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center border border-white/10">
                 <Waypoints className="w-5 h-5 text-white" />
               </div>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-white mb-0 flex items-center gap-2">
                DRR AI
              </h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Rationalization Core</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveModule('history')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-500 hover:text-white"
            >
              <HistoryIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={onDownloadReport}
              disabled={!destination || routes.length === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-500 hover:text-white disabled:opacity-30"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 relative">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-blue-400"></div>
            <input 
              type="text"
              placeholder={startLocation?.name || "Initializing Source..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600 font-medium"
              onFocus={() => setSearchType('start')}
              value={searchType === 'start' ? searchQuery : ''}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={onUseCurrentLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-blue-400 transition-colors"
              title="Use Current Location"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-orange-400"></div>
            <input 
              type="text"
              placeholder={destination?.name || "Establishing Destination..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600 font-medium"
              onFocus={() => setSearchType('dest')}
              value={searchType === 'dest' ? searchQuery : ''}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {searchResults.length > 0 && (
              <motion.div 
                key={`${idPrefix}-search-results-container`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl"
              >
                {searchResults.map((result, idx) => (
                  <button
                    key={`${idPrefix}-search-item-${result.place_id || result.osm_id || idx}-${idx}-${searchType}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <p className="font-medium truncate text-white">{result.display_name.split(',')[0]}</p>
                    <p className="text-zinc-500 text-[10px] uppercase truncate">{result.display_name}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Intelligence Layer */}
      <div className="px-6 flex-grow flex flex-col min-h-0">
        <button 
          onClick={() => setIsIntelligenceOpen(!isIntelligenceOpen)}
          className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3 hover:text-white transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-3 h-3 text-blue-500" />
            <span>Intelligence Layer</span>
          </div>
          {isIntelligenceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        <AnimatePresence mode="wait">
          {isIntelligenceOpen && (
            <motion.div 
              key={`${idPrefix}-intelligence-core`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-grow flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mb-4"
            >
              {/* Feature Quick Bar */}
              <div className="grid grid-cols-3 border-b border-white/5">
                {featureCards.map((card) => (
                  <button
                    key={`${idPrefix}-feature-${card.id}`}
                    onClick={() => handleIntelSend(card.id === 'logic' ? 'Explain current route logic' : card.id === 'safety' ? 'Analyze route safety score' : 'Explain eco efficiency')}
                    className="flex items-center justify-center gap-2 py-2 hover:bg-white/5 border-r border-white/5 last:border-0 transition-colors"
                  >
                    {card.icon}
                    <span className="text-[8px] uppercase tracking-tighter text-zinc-500 font-black">{card.title}</span>
                  </button>
                ))}
              </div>

              {/* Chat View */}
              <div ref={intelScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-mini">
                {intelligenceMessages.map((msg, idx) => (
                  <div key={`${idPrefix}-msg-${msg.id}-${idx}`} className={cn(
                    "flex flex-col gap-1 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-3 py-2 rounded-xl text-[11px] leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white/5 text-zinc-300 rounded-tl-none border border-white/5 italic serif"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isIntelTyping && (
                  <div className="flex gap-1.5 p-2 bg-white/5 rounded-xl border border-white/5 w-fit">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white/[0.02] border-t border-white/5 shrink-0">
                <div className="relative">
                  <input 
                    type="text"
                    value={intelInput}
                    onChange={(e) => setIntelInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntelSend()}
                    placeholder="Ask DRR AI..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-[11px] focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white"
                  />
                  <button 
                    onClick={() => handleIntelSend()}
                    disabled={!intelInput.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Routes List */}
      <div className="flex-shrink-0 p-6 space-y-4 max-h-[300px] overflow-y-auto shadow-[inset_0_20px_20px_-20px_rgba(0,0,0,0.5)]">
        {routes.length > 0 ? (
          <>
            <h2 className="text-[11px] uppercase tracking-widest text-gray-400 mb-4 font-bold">Computed Routes</h2>
            
            {routes.map((route, idx) => (
              <RouteCard 
                key={`${idPrefix}-route-${route.id}-${idx}`}
                route={route}
                isActive={idx === activeRouteIndex}
                onClick={() => onRouteSelect(idx)}
              />
            ))}

            {/* Rationale Box */}
            {aiExplanation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2 cursor-pointer hover:bg-blue-500/10 transition-colors"
                onClick={() => setActiveModule('logic')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase text-blue-400 font-bold mb-1">Route Insight</h3>
                  <Bot className="w-3 h-3 text-blue-400" />
                </div>
                <p className="text-xs leading-relaxed text-gray-400 serif">
                  "{aiExplanation}"
                </p>
              </motion.div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-4">
             <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
               <Navigation2 className="w-8 h-8 opacity-20" />
             </div>
             <p className="text-[11px] uppercase tracking-widest font-bold">Search destination to compute <br /> path rationalization.</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-zinc-900/20 border-t border-white/5">
        {!isNavigating ? (
          <button 
            disabled={!destination}
            onClick={onStartNav}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-blue-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Engage Protocol
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Temporal Arrival</p>
                <p className="text-xl font-light text-white">
                  {formatDuration(routes[activeRouteIndex]?.duration || 0).replace(' min', '')} <span className="text-xs text-gray-500">min</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Spatial Distance</p>
                <p className="text-xl font-light text-white">
                  {formatDistance(routes[activeRouteIndex]?.distance || 0)}
                </p>
              </div>
            </div>
            <button 
              onClick={onStopNav}
              className="w-full py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-rose-500 hover:text-white transition-all"
            >
              Terminate Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface RouteCardProps {
  route: RouteOption;
  isActive: boolean;
  onClick: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isActive, onClick }) => {
  const trafficColors = {
    fast: 'text-emerald-500',
    moderate: 'text-amber-500',
    slow: 'text-rose-500'
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border transition-all text-left glass",
        isActive 
          ? "border-l-4 border-l-blue-500 opacity-100" 
          : "opacity-60 hover:opacity-100"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-widest", trafficColors[route.trafficSimulated || 'fast'])}>
          {route.trafficSimulated} telemetry
        </span>
        <span className="text-xl font-light text-white">
          {Math.round(route.duration / 60)} <span className="text-xs">min</span>
        </span>
      </div>
      
      <div className="text-sm text-gray-300 mb-3 italic serif">
        via {route.summary?.split(',')[0] || "Main Road"}
      </div>

      <div className="flex gap-2">
        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-400 border border-white/10 font-bold">
          {formatDistance(route.distance)}
        </span>
        {route.ecoScore && route.ecoScore > 85 && (
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Leaf className="w-2 h-2" /> ECO
          </span>
        )}
        <span className={cn(
          "px-2 py-0.5 rounded border text-[10px] font-bold uppercase",
          route.difficulty === 'easy' ? "border-emerald-500/10 text-emerald-400 bg-emerald-500/5" :
          route.difficulty === 'medium' ? "border-amber-500/10 text-amber-400 bg-amber-500/5" :
          "border-rose-500/10 text-rose-400 bg-rose-500/5"
        )}>
          {route.difficulty}
        </span>
      </div>
    </button>
  );
};

export default Sidebar;

const Compass = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

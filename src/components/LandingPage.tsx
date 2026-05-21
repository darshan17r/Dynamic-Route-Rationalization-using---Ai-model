import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, Zap, Shield, Leaf, Volume2, Share2, Navigation2, 
  ArrowRight, Search, History, Bot, CloudRain, Thermometer, 
  Activity, Map as MapIcon, Fuel, AlertCircle, PhoneCall, 
  Clock, CheckCircle2, ChevronRight, Copy, MessageSquare, X,
  MapPin, Play, Waypoints, Cpu
} from 'lucide-react';
import { Location, RouteOption, HistoryEntry } from '../types';
import { cn } from '../lib/utils';
import { searchLocations } from '../services/nominatimService';

interface LandingPageProps {
  onStart: () => void;
  navigationData: {
    startLocation: Location | null;
    destination: Location | null;
    routes: RouteOption[];
    activeRouteIndex: number;
    isNavigating: boolean;
    voiceEnabled: boolean;
    aiExplanation: string | null;
    rerouteSuggestion: RouteOption | null;
    history: HistoryEntry[];
    sharingLink: string | null;
    nextManeuver?: any;
  };
  handlers: {
    handleLocationSelect: (loc: Location, type: 'start' | 'dest') => void;
    handleStartNav: () => void;
    handleStopNav: () => void;
    setActiveRouteIndex: (idx: number) => void;
    setVoiceEnabled: (enabled: boolean) => void;
    handleApplyReroute: () => void;
    handleHistorySelect: (entry: HistoryEntry) => void;
    clearHistory: () => void;
    speak: (text: string) => void;
    setActiveModule: (module: string | null) => void;
  };
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, navigationData, handlers }) => {
  const [showDemo, setShowDemo] = useState(false);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const { 
    startLocation, destination, routes, activeRouteIndex, 
    isNavigating, history
  } = navigationData;

  const bgMapRef = useRef<L.Map | null>(null);
  const bgMapContainerRef = useRef<HTMLDivElement>(null);

  // Background Map Initialization
  useEffect(() => {
    if (!bgMapContainerRef.current || bgMapRef.current) return;

    bgMapRef.current = L.map(bgMapContainerRef.current, {
      center: [startLocation?.lat || 12.9716, startLocation?.lng || 77.5946],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      dragging: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(bgMapRef.current);

    return () => {
      bgMapRef.current?.remove();
      bgMapRef.current = null;
    };
  }, []);

  // Sync Map with Location
  useEffect(() => {
    if (bgMapRef.current && startLocation) {
      bgMapRef.current.setView([startLocation.lat, startLocation.lng], 13);
    }
  }, [startLocation]);

  // Dynamic Telemetry Heuristics
  const telemetry = useMemo(() => {
    if (!startLocation) return { 
      eco: '--', 
      safe: '--', 
      name: 'Scanning...', 
      coords: 'Awaiting Signal' 
    };
    
    const lat = startLocation.lat;
    const lng = startLocation.lng;
    const name = startLocation.name || 'Unknown Corridor';
    
    // Pseudo-random but consistent scores based on lat/lng
    const seed = Math.floor((lat + lng) * 100);
    const ecoBase = 85 + (seed % 10);
    const safeBase = 80 + ((seed * 7) % 20);
    
    const isUrban = name.toLowerCase().includes('city') || 
                    name.toLowerCase().includes('bengaluru') || 
                    name.toLowerCase().includes('center');

    return {
      eco: `${isUrban ? ecoBase - 5 : ecoBase}%`,
      safe: `${isUrban ? safeBase + 5 : safeBase}%`,
      name: name,
      coords: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
    };
  }, [startLocation]);

  const handleFeatureClick = (module: string) => {
    onStart();
    handlers.setActiveModule(module);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-indigo-600/10 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#ffffff05_1px,_transparent_1px)] bg-[length:40px_40px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 px-8 py-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 group/logo cursor-pointer" onClick={onStart}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/50 blur-lg rounded-xl animate-pulse group-hover/logo:blur-xl transition-all" />
            <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <Waypoints className="w-6 h-6 text-white group-hover/logo:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">DRR AI</h1>
            <p className="text-[9px] uppercase tracking-[0.4em] text-blue-500/80 font-black">Rationalization System</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Technology</a>
          <a href="#" className="hover:text-white transition-colors">Safety</a>
          <a href="#" className="hover:text-white transition-colors">Enterprise</a>
          <button 
            onClick={onStart}
            className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Launch Interface
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[10px] font-black tracking-widest mb-8 uppercase">
            <Zap className="w-3 h-3 fill-current" />
            <span>v5.2 Dynamic Rationalization Engine</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-[1.05]">
            Dynamic Route <br />
            <span className="serif italic font-light text-blue-500">Rationalization AI.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Intelligent AI Navigation System with real-time routing, predictive traffic analysis, 
            eco optimization, and smart route reasoning.
          </p>

            <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <button 
                onClick={onStart}
                className="group px-12 py-6 bg-blue-600 text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-blue-500 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.25)] flex items-center gap-4 active:scale-95"
              >
                Launch Navigation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setShowDemo(true)}
                className="group px-12 py-6 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-4 active:scale-95 shadow-xl"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                  <Play className="w-3.5 h-3.5 text-blue-500 group-hover:text-white fill-current ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="flex flex-col sm:flex-row items-center gap-6 px-10 py-4 bg-white/[0.01] border border-white/[0.05] rounded-[24px] backdrop-blur-sm relative group/loc-panel"
            >
              <div className="absolute inset-0 bg-blue-500/[0.02] rounded-[24px] opacity-0 group-hover/loc-panel:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-4 relative">
                <div className="relative">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                   <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping opacity-40" />
                </div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.25em]">
                  Active Corridor: <span className="text-white ml-2 font-black italic">{startLocation?.name || 'Recalibrating...'}</span>
                </p>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/10 relative" />
              <button 
                onClick={() => setIsChangingLocation(true)}
                className="flex items-center gap-2.5 text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-[0.3em] transition-all group/loc relative"
              >
                <MapPin className="w-3.5 h-3.5 group-hover/loc:animate-bounce" />
                <span>Change Location</span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Preview Graphic */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          className="mt-20 relative w-full aspect-[21/9] rounded-[40px] border border-white/5 bg-zinc-900/50 overflow-hidden shadow-2xl p-4 md:p-8 group"
        >
          <div className="absolute inset-0 bg-blue-500/5 blur-[120px]" />
          <div className="relative h-full w-full rounded-[24px] overflow-hidden border border-white/10">
            {/* Real Map Background */}
            <div ref={bgMapContainerRef} className="w-full h-full grayscale opacity-40 brightness-75 transition-all duration-1000 group-hover:grayscale-0 group-hover:opacity-60" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
            
            {/* Visual HUD Mockup */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
              <div className="glass p-6 rounded-2xl border border-white/10 text-left backdrop-blur-3xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">Live Telemetry: {telemetry.name}</p>
                </div>
                <p className="text-2xl font-light text-white tracking-tighter">{telemetry.coords}</p>
              </div>
              <div className="flex gap-4">
                 <div className="glass p-4 rounded-2xl border border-white/10 w-32 backdrop-blur-3xl">
                   <div className="w-8 h-1 bg-blue-500 rounded-full mb-3" />
                   <p className="text-[10px] font-bold text-white tracking-widest uppercase">Eco: {telemetry.eco}</p>
                 </div>
                 <div className="glass p-4 rounded-2xl border border-white/10 w-32 backdrop-blur-3xl">
                   <div className="w-8 h-1 bg-emerald-500 rounded-full mb-3" />
                   <p className="text-[10px] font-bold text-white tracking-widest uppercase">Safe: {telemetry.safe}</p>
                 </div>
              </div>
            </div>
            
            {!startLocation && !navigationData.isNavigating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Calibrating Local Pulse...</p>
                  <p className="text-[10px] text-zinc-500">Location access required for live telemetry.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 py-32 px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20">
          <h3 className="text-sm uppercase tracking-[0.5em] text-blue-500 font-black mb-4">Core Protocols</h3>
          <h2 className="text-4xl font-bold text-white tracking-tight serif italic">Intelligence and Safety as standard.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-blue-500" />}
            title="Predictive Rerouting"
            desc="Detect bottlenecks before they happen with real-time telemetry analysis."
            onClick={() => handleFeatureClick('reroute')}
          />
          <FeatureCard 
            icon={<Bot className="w-6 h-6 text-indigo-500" />}
            title="AI Rationalization"
            desc="Natural language logic explaining every decision behind your route."
            onClick={() => handleFeatureClick('logic')}
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-500" />}
            title="Secure Corridors"
            desc="Safety-indexed routing prioritizing well-lit and populated paths."
            onClick={() => handleFeatureClick('safety')}
          />
          <FeatureCard 
            icon={<Leaf className="w-6 h-6 text-green-500" />}
            title="Eco Calibration"
            desc="Minimize CO2 output through grade-aware route planning systems."
            onClick={() => handleFeatureClick('eco')}
          />
          <FeatureCard 
            icon={<Volume2 className="w-6 h-6 text-purple-500" />}
            title="Voice Navigation"
            desc="High-fidelity synthetic guidance for low cognitive distraction."
            onClick={() => handleFeatureClick('voice')}
          />
          <FeatureCard 
            icon={<Share2 className="w-6 h-6 text-pink-500" />}
            title="Instant Relay"
            desc="Temporal ETA links to secure contacts with live tracking."
            onClick={() => handleFeatureClick('relay')}
          />
          <FeatureCard 
            icon={<History className="w-6 h-6 text-amber-500" />}
            title="Temporal Logs"
            desc="Deep history tracking and route re-optimization from past data."
            onClick={() => handleFeatureClick('history')}
          />
          <FeatureCard 
            icon={<Activity className="w-6 h-6 text-rose-500" />}
            title="Traffic Intelligence"
            desc="Advanced heatmap layers showing real-time density and flow."
            onClick={() => handleFeatureClick('navigation')}
          />
          <FeatureCard 
            icon={<Fuel className="w-6 h-6 text-cyan-500" />}
            title="Trip Analytics"
            desc="Comprehensive fuel and cost estimations for every journey."
            onClick={() => handleFeatureClick('navigation')}
          />
        </div>
      </section>

      {/* Demo Modal */}
      <AnimatePresence mode="wait">
        {isChangingLocation && (
           <motion.div 
             key="location-change-modal"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
           >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="w-full max-w-lg bg-[#0a0a0a] rounded-[32px] border border-white/10 p-8 shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Recalibrate Origin</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Spatial Redefinition</p>
                  </div>
                  <button onClick={() => setIsChangingLocation(false)} className="p-3 bg-white/5 rounded-full text-white hover:bg-blue-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <LocationInput 
                  label="Primary Coordinate"
                  placeholder="Enter city or district..."
                  onSelect={(loc: Location) => {
                    handlers.handleLocationSelect(loc, 'start');
                    setIsChangingLocation(false);
                  }}
                />

                <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Changing your location will recompute all telemetry benchmarks including eco-compliance and safety indexing for the selected sector.
                  </p>
                </div>
             </motion.div>
           </motion.div>
        )}

        {showDemo && (
          <motion.div 
            key="demo-video-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-6xl aspect-video bg-zinc-900 rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Operational Demo v4.1</span>
                </div>
                <button 
                  onClick={() => setShowDemo(false)}
                  className="p-4 bg-white/5 hover:bg-rose-500 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 pointer-events-auto border border-white/10 backdrop-blur-xl group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/YRZxshxI1xs?autoplay=1&mute=1&rel=0&modestbranding=1" 
                title="DRR AI Product Introduction" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.5em]">Press ESC to Close Terminal</p>
                <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 120 }} // match video length approx
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 py-20 px-8 border-t border-white/5 max-w-7xl mx-auto w-full text-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-left">
            <h4 className="text-lg font-bold text-white mb-2">DRR AI</h4>
            <p className="text-xs text-zinc-500 font-medium">Intelligent Route Rationalization System for the Next-Gen Commerse.</p>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-black text-zinc-400">
             <a href="#" className="hover:text-blue-500">Legal</a>
             <a href="#" className="hover:text-blue-500">Privacy</a>
             <a href="#" className="hover:text-blue-500">Twitter</a>
             <a href="#" className="hover:text-blue-500">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/20 hover:bg-blue-500/[0.02] transition-all group cursor-pointer"
  >
    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit group-hover:scale-110 transition-transform group-hover:bg-blue-500/10 group-hover:border-blue-500/20">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{title}</h3>
    <p className="text-zinc-500 leading-relaxed text-sm mb-6">{desc}</p>
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
      <span>Access Protocol</span>
      <ArrowRight className="w-3 h-3" />
    </div>
  </motion.div>
);

const LocationInput = ({ label, value = '', onSelect, placeholder }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      const resp = await searchLocations(val);
      setResults(resp);
      setIsSearching(false);
      setIsOpen(true);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="relative group">
      <label className="text-[9px] font-black uppercase text-zinc-600 mb-1.5 block tracking-widest">{label}</label>
      <div className="relative">
        <input 
          value={isOpen ? query : value}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if(query) setIsOpen(true); }}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 outline-none transition-all group-hover:border-white/20 focus:border-blue-500/50"
          placeholder={placeholder}
        />
        <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", isSearching ? "text-blue-500 animate-pulse" : "text-zinc-600")} />
      </div>

      <AnimatePresence mode="popLayout">
        {isOpen && results.length > 0 && (
          <motion.div 
            key="landing-location-autocomplete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 w-full mt-3 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
          >
            {results.map((res, i) => (
              <button 
                key={`landing-search-result-${res.place_id || res.osm_id || 'no-id'}-${i}`}
                onClick={() => {
                  onSelect({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name.split(',')[0] });
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-none group/item flex items-start gap-4"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover/item:bg-blue-500/10 transition-colors">
                  <MapIcon className="w-3 h-3 text-zinc-500 group-hover/item:text-blue-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-white font-bold group-hover/item:text-blue-400 transition-colors truncate">{res.display_name.split(',')[0]}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{res.display_name}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const MiniStat = ({ icon, label, value, color = "text-blue-400" }: any) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={cn("p-1.5 rounded-lg bg-white/5", (color || "text-blue-400")?.replace?.('text-', 'bg-')?.replace?.('400', '500/10'))}>
       {React.cloneElement(icon, { className: cn("w-3 h-3", color || "text-blue-400") })}
    </div>
    <div className="text-center">
      <p className="text-[7px] text-zinc-600 font-black uppercase">{label}</p>
      <p className={cn("text-[10px] font-bold", color)}>{value}</p>
    </div>
  </div>
);

const HighlightCard = ({ icon, label, value, detail }: any) => (
  <div className="glass-dark border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
    <div className="flex items-center gap-4 mb-3">
       <div className="p-2.5 bg-white/5 rounded-xl">
         {icon}
       </div>
       <div>
         <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{label}</p>
         <p className="text-lg font-light text-white">{value}</p>
       </div>
    </div>
    <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter ml-14">{detail}</p>
  </div>
);

export default LandingPage;

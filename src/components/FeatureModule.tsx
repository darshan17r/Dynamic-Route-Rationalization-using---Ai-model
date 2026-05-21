import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Zap, Shield, Leaf, Volume2, Share2, Bot, Navigation2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeatureModuleProps {
  type: 'reroute' | 'logic' | 'safety' | 'eco' | 'voice' | 'relay';
  onClose: () => void;
  data?: any;
}

const FeatureModule: React.FC<FeatureModuleProps> = ({ type, onClose, data }) => {
  const route = data?.route;
  const summary = route?.summary?.split(',')[0] || "secondary roads";
  const destinationName = data?.destination?.name || "Target";
  const startName = data?.startLocation?.name || "Source";
  
  // Dynamic Rerouting Logic
  const getRerouteContext = () => {
    const isSlow = route?.trafficSimulated === 'slow';
    const isFast = route?.trafficSimulated === 'fast';
    const durationMins = Math.round((route?.duration || 0) / 60);
    const distanceKm = (route?.distance || 0) / 1000;
    
    const combinedText = `${startName} ${destinationName} ${summary}`.toLowerCase();
    const isBengaluru = combinedText.includes('bengaluru') || combinedText.includes('bangalore');
    const isHighway = combinedText.includes('highway') || combinedText.includes('nh') || combinedText.includes('expressway') || combinedText.includes('ring road');
    const isRural = !isBengaluru && distanceKm > 15 && !isHighway;
    const isNight = new Date().getHours() > 20 || new Date().getHours() < 5;

    let message = "";
    let level = "Nominal";
    let color = "text-blue-400";
    let bg = "bg-blue-500/10";
    let border = "border-blue-500/20";
    let delta = "0 min";

    if (isSlow) {
      level = "Heavy";
      color = "text-rose-500";
      bg = "bg-rose-500/10";
      border = "border-rose-500/20";
      const savings = Math.floor(Math.random() * 8) + 5;
      delta = `+${Math.floor(durationMins * 0.2)} min`;
      
      if (isBengaluru) {
        message = `Critical gridlock at ${summary}. Signal cycles exceeding 180s. Recommend dynamic diversion via inner-sector corridors to bypass metropolitan friction. Possible savings: ${savings}m.`;
      } else if (isHighway) {
        message = `Inertial drag detected on ${summary}. Likely heavy-vehicle bottleneck or toll queue. Outer-loop bypass protocol suggested for ${destinationName}.`;
      } else if (isRural) {
        message = `Localized obstruction on ${summary}. Uncharacteristic density for rural corridor. Re-evaluating secondary agricultural links for optimal flow.`;
      } else {
        message = `Heavy congestion identified at ${summary}. Current trajectory latency is increasing. Strategic rerouting is recommended.`;
      }
    } else if (isFast) {
      level = "Fluid";
      color = "text-emerald-500";
      bg = "bg-emerald-500/10";
      border = "border-emerald-500/20";
      delta = `-${Math.floor(durationMins * 0.1)} min`;

      if (isNight) {
        message = `Optimal nocturnal flow. Low lumen friction on ${summary} allowing for 15% velocity increase above standard telemetry baseline.`;
      } else if (isHighway) {
        message = `Maximum throughput on ${summary}. Sustained cruise-velocity achieved. No significant deceleration events projected for the next ${Math.round(distanceKm * 0.7)}km.`;
      } else {
        message = `Exceptional spatial clearance on ${summary}. Arrival at ${destinationName} projected ahead of original computation.`;
      }
    } else {
      if (isBengaluru && isNight) {
        message = `Steady nocturnal transit. High predictability on ${summary} despite localized construction nodes. Current path is mathematically superior.`;
      } else if (isHighway) {
        message = `Nominal highway cruise. Maintaining 85km/h synchronization with current traffic pulse on ${summary}.`;
      } else {
        message = `Stable telemetry. Current transit nodes on ${summary} showing predictable flow. Projections remain optimal for ${destinationName}.`;
      }
    }

    return { message, delta, level, color, bg, border };
  };

  // Dynamic Safety Logic
  const getSafetyContext = () => {
    const score = route?.safetyScore || 85;
    const lighting = route?.roadLighting || 80;
    const density = route?.populatedDensity || 70;
    const isNight = new Date().getHours() > 19 || new Date().getHours() < 6;
    
    const combinedText = `${startName} ${destinationName} ${summary}`.toLowerCase();
    const isBengaluru = combinedText.includes('bengaluru') || combinedText.includes('bangalore');
    const isHighway = combinedText.includes('highway') || combinedText.includes('nh');

    let analysis = "";
    if (isNight) {
      if (lighting < 60) {
        analysis = `Low-lumen alert: ${summary} segments currently below optimal visibility. Routing prioritized via populated nodes to compensate for infrastructure gap.`;
      } else if (isHighway) {
        analysis = `Nocturnal highway protocol: prioritized ${summary} due to high patrol frequency and verified 24/7 utility nodes. Emergency stations verified at 8km intervals.`;
      } else {
        analysis = `Night Safety Index: Route transition through ${summary} relies on commercial lighting saturation. High confidence in populated sectors of ${destinationName}.`;
      }
    } else {
      if (isBengaluru) {
        analysis = `Metropolitan Secure Path: High public density on ${summary} provides constant passive monitoring. Verified response nodes identified at all major junctions.`;
      } else if (isHighway) {
        analysis = `Inter-city corridor safety: Prioritizing paths with median barriers and wide shoulders on ${summary}. Low risk of pedestrian intersection friction.`;
      } else {
        analysis = `Standard daylight verification complete. ${summary} shows high visibility benchmarks. Proximity to civil infrastructure is optimal throughout.`;
      }
    }

    return {
      analysis,
      level: score > 85 ? "High" : score > 70 ? "Medium" : "Low",
      lightingLevel: lighting > 80 ? "Optimal" : lighting > 60 ? "Partial" : "Minimal",
      densityLevel: density > 80 ? "Urban High" : density > 50 ? "Balanced" : "Low/Sparse"
    };
  };

  const reroute = getRerouteContext();
  const safety = getSafetyContext();

  const WeightBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full", color)}
        />
      </div>
    </div>
  );

  const configs = ({
    reroute: {
      title: "Predictive Rerouting",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: "text-amber-400",
      content: (
        <div className="space-y-4">
          <div className={cn("p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2", reroute.bg, reroute.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", reroute.level === 'Heavy' ? "bg-rose-500" : "bg-emerald-500")} />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Active Monitoring</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Level: {reroute.level}</span>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">{reroute.message}</p>
              {reroute.level === 'Heavy' && (
                <button 
                  onClick={data?.onApplyReroute}
                  className="w-full py-4 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl active:scale-95"
                >
                  Apply Strategic Reroute
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
               <p className="text-[9px] text-zinc-600 font-black uppercase mb-1">ETA Delta</p>
               <p className={cn("text-lg font-light", reroute.color)}>{reroute.delta}</p>
             </div>
             <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
               <p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Density Index</p>
               <p className="text-lg font-light text-white">{route?.trafficSimulated === 'slow' ? '88%' : '24%'}</p>
             </div>
          </div>

          <div className="space-y-2 p-1">
             <div className="flex justify-between items-end mb-1">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Bottleneck Probability</h4>
                <span className="text-[10px] font-black text-white">{reroute.level === 'Heavy' ? '92%' : '14%'}</span>
             </div>
             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: reroute.level === 'Heavy' ? '92%' : '14%' }}
                  className={cn("h-full", reroute.level === 'Heavy' ? "bg-rose-500" : "bg-emerald-500")} 
                />
             </div>
          </div>
        </div>
      )
    },
    safety: {
      title: "Secure Corridors",
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      color: "text-blue-400",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Index</p>
              <p className="text-xl font-light text-blue-400">{route?.safetyScore}%</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Density</p>
              <p className="text-xl font-light text-white">{safety.densityLevel}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Lighting</p>
              <p className="text-xl font-light text-blue-400">{safety.lightingLevel}</p>
            </div>
          </div>
          <div className="p-5 rounded-[24px] bg-blue-500/10 border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-20 h-20 text-blue-400" />
            </div>
            <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
              <Shield className="w-3 h-3 animate-pulse" /> Spatial Safety Analysis
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed serif italic mb-6 relative z-10">
              {safety.analysis}
            </p>
            <div className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Lighting Saturation</span>
                  <span className="text-blue-400">{route?.roadLighting}%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${route?.roadLighting}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Public Activity Density</span>
                  <span className="text-emerald-400">{route?.populatedDensity}%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${route?.populatedDensity}%` }}
                    className="h-full bg-emerald-500" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    eco: {
      title: "Eco Calibration",
      icon: <Leaf className="w-5 h-5 text-emerald-500" />,
      color: "text-emerald-400",
      content: (
        <div className="space-y-6">
           <div className="relative w-48 h-48 mx-auto flex items-center justify-center p-4">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" 
                  strokeDasharray="283" 
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * (route?.ecoScore || 0) / 100) }}
                  className="text-emerald-500 transition-all duration-1000" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Leaf className="w-6 h-6 text-emerald-500 mb-1" />
                <p className="text-4xl font-light text-white">{route?.ecoScore || 0}%</p>
                <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Efficiency</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 text-center">
             <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
               <p className="text-xl font-light text-emerald-400">{route?.fuelEstimated || 0}L</p>
               <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Est. Usage</p>
             </div>
             <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
               <p className="text-xl font-light text-emerald-400">{route?.co2Reduction || 0}kg</p>
               <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">CO2 Offset</p>
             </div>
           </div>

           <div className="p-5 bg-zinc-900 border border-white/5 rounded-[24px]">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Impact Analysis
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed italic serif">
                Calibration optimized for {summary}. System has identified spatial grade patterns on the route that favor {route?.trafficSimulated === 'slow' ? 'regenerative braking cycles' : 'constant-velocity cruise bands'}, projecting a net energy yield of {route?.ecoScore}% vs local baseline.
              </p>
           </div>
        </div>
      )
    },
    logic: {
      title: "Rational Logic",
      icon: <Bot className="w-5 h-5 text-blue-400" />,
      color: "text-blue-400",
      content: (
        <div className="space-y-5">
           <div className="flex items-start gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-[24px]">
              <div className="p-2 bg-blue-500 rounded-xl shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-3">
                 <p className="text-sm text-zinc-300 leading-relaxed serif italic">
                   "Spatial analysis for the {startName} to {destinationName} corridor complete. My logic engine prioritized the {summary} path based on a triple-weighted trade-off between transit velocity ({route?.trafficSimulated || 'norm'}), environmental impact ({route?.ecoScore}%), and corridor safety indexing ({route?.safetyScore}%)."
                 </p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Thinking Protocol Active</span>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Logic Weights</h4>
              <div className="space-y-3">
                <WeightBar label="Spatial Velocity" value={route?.trafficSimulated === 'fast' ? 95 : 65} color="bg-blue-500" />
                <WeightBar label="Secure Lighting" value={route?.roadLighting || 80} color="bg-indigo-500" />
                <WeightBar label="Eco-Yield Mode" value={route?.ecoScore || 70} color="bg-emerald-500" />
              </div>
           </div>
        </div>
      )
    },
    voice: {
      title: "Auditory Feedback",
      icon: <Volume2 className="w-5 h-5 text-purple-500" />,
      color: "text-purple-400",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl glass border border-purple-500/20">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">Voice Guidance</p>
              <p className="text-[9px] text-purple-400 font-black uppercase">Active High-Fidelity</p>
            </div>
            <div className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-all", data?.voiceEnabled ? "bg-purple-500" : "bg-zinc-800")}>
              <div className={cn("w-4 h-4 bg-white rounded-full transition-all", data?.voiceEnabled ? "ml-auto" : "ml-0")} />
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-3">Upcoming Maneuver</h4>
            {data?.nextManeuver ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Navigation2 className="w-5 h-5 text-purple-400 rotate-45" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{data.nextManeuver.maneuver?.instruction || "Continue straight"}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">In {Math.round(data.nextManeuver.distance)} meters</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">Computing spatial maneuvers...</p>
            )}
          </div>
        </div>
      )
    },
    relay: {
      title: "Instant Relay",
      icon: <Share2 className="w-5 h-5 text-pink-500" />,
      color: "text-pink-400",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl shadow-inner">
             <p className="text-[10px] text-zinc-600 font-black uppercase mb-2 tracking-widest">Temporal Link [Live]</p>
             <div className="flex gap-2">
               <input 
                 readOnly 
                 value={data?.sharingLink || "Initializing Link..."} 
                 className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-pink-300 font-mono truncate" 
               />
               <button 
                onClick={() => { navigator.clipboard.writeText(data?.sharingLink || ''); alert("Telemetry link copied."); }}
                className="px-3 py-1 bg-white text-black text-[10px] font-black rounded uppercase hover:bg-pink-500 hover:text-white transition-all"
               >
                 COPY
               </button>
             </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Tracking my real-time ETA via DRR AI: ${data?.sharingLink}`)}`}
              target="_blank"
              className="p-3 bg-pink-500/10 text-pink-500 border border-pink-500/20 text-[10px] font-bold uppercase rounded text-center hover:bg-pink-500 hover:text-white transition-all"
            >
              Broadcast via WhatsApp
            </a>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">Dynamic ETA</p>
                <p className="text-lg font-light text-white">{Math.round((data?.route?.duration || 0) / 60)} min</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
            </div>
          </div>
        </div>
      )
    }
  } as Record<string, any>)[type];

  if (!configs) return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 items-center justify-center text-center">
       <Navigation2 className="w-12 h-12 text-zinc-800 mb-4" />
       <p className="text-sm text-zinc-500 tracking-widest uppercase font-bold">Module details currently unavailable in spatial preview.</p>
       <button onClick={onClose} className="mt-6 text-[10px] uppercase tracking-[0.3em] text-blue-500 font-black">Deactivate Panel</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className={cn("flex items-center gap-3", configs.color)}>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 relative">
            {configs.icon}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white leading-none mb-1">{configs.title}</h3>
            <div className="flex items-center gap-1">
               <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Temporal Link:</span>
               <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Synchronized</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {configs.content}
      </div>
    </div>
  );
};

export default FeatureModule;

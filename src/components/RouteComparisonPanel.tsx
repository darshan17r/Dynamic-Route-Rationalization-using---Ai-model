import React from 'react';
import { motion } from 'motion/react';
import { RouteOption } from '../types';
import { formatDistance, formatDuration, cn } from '../lib/utils';
import { Leaf, Shield, Zap, AlertCircle, Info, ZapOff, Fuel, CloudOff } from 'lucide-react';

interface RouteComparisonPanelProps {
  routes: RouteOption[];
  onSelect: (idx: number) => void;
  activeIdx: number;
}

const RouteComparisonPanel: React.FC<RouteComparisonPanelProps> = ({ routes, onSelect, activeIdx }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {routes.map((route, idx) => (
        <button
          key={`comparison-route-${route.id}-${idx}`}
          onClick={() => onSelect(idx)}
          className={cn(
            "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
            idx === activeIdx 
              ? "bg-blue-500/10 border-blue-500/50" 
              : "bg-white/5 border-white/5 hover:border-white/10"
          )}
        >
          {idx === activeIdx && (
            <div className="absolute top-0 right-0 p-2">
              <Zap className="w-3 h-3 text-blue-400 fill-current" />
            </div>
          )}

          <div className="flex justify-between items-start mb-6">
            <div>
              <p className={cn(
                "text-[10px] uppercase font-bold tracking-widest mb-1",
                route.trafficSimulated === 'fast' ? "text-emerald-500" :
                route.trafficSimulated === 'moderate' ? "text-amber-500" : "text-rose-500"
              )}>
                {route.trafficSimulated} telemetry
              </p>
              <h4 className="text-3xl font-light text-white">{Math.round(route.duration / 60)} <span className="text-sm text-zinc-500">min</span></h4>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-400">{formatDistance(route.distance)}</p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 uppercase font-black italic">
                via {route.summary?.split(',')[0] || "Main Dr"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatBox icon={<Leaf className="w-3 h-3" />} label="ECO SCORE" value={`${route.ecoScore}%`} color="text-emerald-400" />
            <StatBox icon={<Shield className="w-3 h-3" />} label="SAFETY" value={`${route.safetyScore}%`} color="text-blue-400" />
            <StatBox icon={<Fuel className="w-3 h-3" />} label="FUEL EST." value={`${route.fuelEstimated}L`} color="text-amber-400" />
            <StatBox icon={<CloudOff className="w-3 h-3" />} label="CO2 RED." value={`${route.co2Reduction}kg`} color="text-zinc-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-500">
               <span>Lighting Coverage</span>
               <span>{route.roadLighting}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500/50" style={{ width: `${route.roadLighting}%` }} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const StatBox = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">
      {icon} {label}
    </div>
    <div className={cn("text-sm font-bold", color)}>{value}</div>
  </div>
);

export default RouteComparisonPanel;

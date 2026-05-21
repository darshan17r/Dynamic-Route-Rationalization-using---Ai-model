import React from 'react';
import { motion } from 'motion/react';
import { Clock, Navigation2, MapPin, Trash2, X } from 'lucide-react';
import { HistoryEntry } from '../types';
import { formatDistance, formatDuration } from '../lib/utils';

interface HistoryListProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-zinc-500" />
          <h3 className="text-sm font-bold text-white tracking-widest uppercase">Temporal Archive</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={onClear} className="p-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-zinc-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {history.length > 0 ? (
          history.map((entry, idx) => (
            <button
              key={`${entry.id}-${idx}`}
              onClick={() => onSelect(entry)}
              className="w-full p-4 rounded-xl glass hover:bg-white/5 text-left transition-all border border-transparent hover:border-white/10 group"
            >
              <div className="flex justify-between items-start mb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs text-white truncate">{entry.start.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <p className="text-xs text-white truncate">{entry.destination.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase">
                <span className="bg-white/5 px-2 py-0.5 rounded">{formatDistance(entry.distance)}</span>
                <span className="bg-white/5 px-2 py-0.5 rounded">{formatDuration(entry.duration)}</span>
                <Navigation2 className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-4">
             <Clock className="w-12 h-12 opacity-10" />
             <p className="text-[11px] uppercase tracking-widest font-bold">Temporal logs are currently <br /> non-existent.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryList;

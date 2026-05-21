import { useState, useEffect } from 'react';
import { HistoryEntry, Location } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ecoRoute_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const addToHistory = (start: Location, destination: Location, distance: number, duration: number, summary: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      start,
      destination,
      distance,
      duration,
      timestamp: Date.now(),
      routeSummary: summary
    };
    
    const updated = [newEntry, ...history.slice(0, 19)]; // Keep last 20
    setHistory(updated);
    localStorage.setItem('ecoRoute_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ecoRoute_history');
  };

  return { history, addToHistory, clearHistory };
}

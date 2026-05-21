export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteOption {
  id: string;
  distance: number;
  duration: number;
  geometry: string;
  weight: number;
  summary: string;
  legs: any[];
  trafficSimulated?: 'fast' | 'moderate' | 'slow';
  ecoScore?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  safetyScore?: number;
  fuelEstimated?: number; // in liters
  co2Reduction?: number; // in kg
  roadLighting?: number; // 0-100
  populatedDensity?: number; // 0-100
  tollRoads?: boolean;
}

export interface HistoryEntry {
  id: string;
  start: Location;
  destination: Location;
  distance: number;
  duration: number;
  timestamp: number;
  routeSummary: string;
}

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Location, RouteOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2 } from 'lucide-react';
import { decodePolyline } from '../lib/utils';

// Fix for default marker icons in Leaflet with Vite
import 'leaflet/dist/leaflet.css';

interface MapProps {
  userCoords: { latitude: number; longitude: number; heading: number | null } | null;
  startLocation: Location | null;
  destination: Location | null;
  routes: RouteOption[];
  activeRouteIndex: number;
  onRouteSelect: (index: number) => void;
  isNavigating: boolean;
  nextManeuverDistance?: number;
  nextManeuver?: any;
}

const Map: React.FC<MapProps> = ({ 
  userCoords, 
  startLocation, 
  destination, 
  routes, 
  activeRouteIndex,
  onRouteSelect,
  isNavigating,
  nextManeuverDistance,
  nextManeuver
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946], // Default to Bengaluru
      zoom: 12,
      zoomControl: false
    });

    // Dark-premium tiles (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    poiLayerRef.current = L.layerGroup().addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

    const { latitude, longitude, heading } = userCoords;
    const latlng = L.latLng(latitude, longitude);

    if (!userMarkerRef.current) {
      // Create custom arrow icon
      const arrowIcon = L.divIcon({
        className: 'nav-arrow-container',
        html: `
          <div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));">
            <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L19 21L12 17L5 21L12 2Z" />
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker(latlng, { icon: arrowIcon }).addTo(mapRef.current);
      
      // Initial pan
      if (!startLocation && !destination) {
        mapRef.current.setView(latlng, 15);
      }
    } else {
      userMarkerRef.current.setLatLng(latlng);
      // Update rotation
      const html = `
        <div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));">
          <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L19 21L12 17L5 21L12 2Z" />
          </svg>
        </div>
      `;
      userMarkerRef.current.setIcon(L.divIcon({ 
        className: 'nav-arrow-container', 
        html, 
        iconSize: [32, 32], 
        iconAnchor: [16, 16] 
      }));

      if (isNavigating) {
        mapRef.current.panTo(latlng, { animate: true });
      }
    }
  }, [userCoords, isNavigating, startLocation, destination]);

  // Update Start/End Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Start Marker
    if (startLocation) {
      const latlng = L.latLng(startLocation.lat, startLocation.lng);
      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker(latlng, {
          icon: L.divIcon({
            className: 'start-marker',
            html: '<div class="w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(mapRef.current);
      } else {
        startMarkerRef.current.setLatLng(latlng);
      }
    } else if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    // End Marker
    if (destination) {
      const latlng = L.latLng(destination.lat, destination.lng);
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(latlng, {
          icon: L.divIcon({
            className: 'dest-marker',
            html: '<div class="w-5 h-5 bg-rose-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(mapRef.current);
      } else {
        destMarkerRef.current.setLatLng(latlng);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [startLocation, destination]);

  // Update Routes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old layers
    routeLayersRef.current.forEach(layer => layer.remove());
    routeLayersRef.current = [];

    if (routes.length === 0) return;

    routes.forEach((route, index) => {
      const isActive = index === activeRouteIndex;
      const points = decodePolyline(route.geometry);
      
      // Multi-layer polyline for "glow" effect
      if (isActive) {
        // Base glow layer
        const glow = L.polyline(points, {
          color: route.safetyScore! > 85 ? '#10b981' : '#3b82f6',
          weight: 12,
          opacity: 0.2,
          className: 'route-glow'
        }).addTo(mapRef.current!);
        routeLayersRef.current.push(glow);
      }

      const polyline = L.polyline(points, {
        color: isActive 
          ? (route.safetyScore! > 85 ? '#10b981' : '#3b82f6') 
          : '#4b5563',
        weight: isActive ? 6 : 4,
        opacity: isActive ? 1 : 0.4,
        className: isActive ? 'active-route' : 'alt-route'
      }).addTo(mapRef.current!);

      polyline.on('click', () => onRouteSelect(index));
      routeLayersRef.current.push(polyline);
    });

    // Fit bounds only if not actively navigating or manually searching
    if (!isNavigating && routes.length > 0) {
      const group = new L.FeatureGroup(routeLayersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [100, 100] });
    }
  }, [routes, activeRouteIndex, onRouteSelect, isNavigating]);

  // Enhanced Landmarks simulation based on current view
  useEffect(() => {
    if (!mapRef.current || !poiLayerRef.current) return;
    const map = mapRef.current;
    poiLayerRef.current.clearLayers();

    const addPOI = (lat: number, lng: number, type: 'gas' | 'hospital' | 'restaurant' | 'landmark') => {
      const colors = {
        gas: '#10b981',
        hospital: '#rose-500',
        restaurant: '#fbbf24',
        landmark: '#8b5cf6'
      };

      L.circleMarker([lat, lng], {
        radius: 4,
        color: 'white',
        weight: 1,
        fillColor: (colors as any)[type] || '#fff',
        fillOpacity: 1
      }).addTo(poiLayerRef.current!).bindPopup(`<div class="p-2 font-bold uppercase text-[10px] tracking-widest">${type} Point</div>`);
    };

    // Generate simulated POIs around current center or route
    const center = map.getCenter();
    for (let i = 0; i < 8; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      const types = ['gas', 'hospital', 'restaurant', 'landmark'];
      addPOI(center.lat + offsetLat, center.lng + offsetLng, types[Math.floor(Math.random() * types.length)] as any);
    }
  }, [startLocation, destination]); // Re-generate when route changes

  return (
    <div className="relative w-full h-full map-grid overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" id="main-map" />
      
      {/* Top Legend Overlay */}
      <div className="absolute top-6 right-6 flex flex-col gap-4 items-end z-40 pointer-events-none">
        <div className="glass px-4 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#e0e0e0]">Quantum Navigation Protocol</span>
          </div>
        </div>
      </div>

      {/* Navigation HUD */}
      <AnimatePresence>
        {isNavigating && routes[activeRouteIndex] && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[700px] px-6 z-40 pointer-events-none"
          >
            <div className="glass-dark rounded-[32px] p-8 flex items-center shadow-2xl pointer-events-auto w-full border border-white/10 backdrop-blur-3xl">
              <div className="flex-1 flex items-center gap-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 relative">
                  <div className="absolute inset-0 bg-blue-500/5 animate-ping rounded-2xl" />
                  <Navigation2 className="w-8 h-8 text-blue-400 rotate-45 fill-blue-400/20" />
                </div>
                <div>
                  <div className="text-3xl font-light text-white tracking-tighter">
                    {Math.round(nextManeuverDistance || 450)} <span className="text-sm text-zinc-500 italic serif">meters</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-blue-400 font-black italic">
                    {nextManeuver?.maneuver?.instruction || `Maintain status on ${routes[activeRouteIndex].summary?.split(',')[0]}`}
                  </div>
                </div>
              </div>

              <div className="w-px h-16 bg-white/10 mx-8"></div>

              <div className="flex gap-12">
                <div className="text-center">
                  <div className="text-2xl font-light text-white tracking-tight">
                    {new Date(Date.now() + routes[activeRouteIndex].duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">ETA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-white tracking-tight">{Math.round(routes[activeRouteIndex].duration / 60)} <span className="text-xs">min</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">REMAINING</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Traffic Legend Overlay */}
      <div className="absolute bottom-10 left-10 glass p-4 rounded-2xl flex flex-col gap-3 z-30 pointer-events-none hidden md:flex border border-white/5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1">Density Index</p>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Optimal
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> Moderate
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"></span> Congestion
        </div>
      </div>

      <style>{`
        .active-route { stroke-dasharray: 0; filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); transition: all 0.3s ease; }
        .alt-route { stroke-dasharray: 0; cursor: pointer; transition: all 0.2s; }
        .alt-route:hover { color: #6b7280; opacity: 1; filter: drop-shadow(0 0 4px rgba(255,255,255,0.2)); }
        .leaflet-container { background: #050505 !important; }
        .leaflet-popup-content-wrapper { background: #0a0a0a; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; }
        .leaflet-popup-tip { background: #0a0a0a; }
      `}</style>
    </div>
  );
};

export default Map;

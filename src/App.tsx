import React, { useState, useEffect, useCallback, useRef } from 'react';
import LandingPage from './components/LandingPage';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import AIChat from './components/AIChat';
import HistoryList from './components/HistoryList';
import FeatureModule from './components/FeatureModule';
import RouteComparisonPanel from './components/RouteComparisonPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistory } from './hooks/useHistory';
import { Location, RouteOption, HistoryEntry } from './types';
import { getRoutes } from './services/osrmService';
import { explainRoute } from './services/geminiService';
import { reverseGeocode } from './services/nominatimService';
import { decodePolyline } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2, RotateCcw, AlertTriangle, X, Maximize2, Minimize2, ArrowLeft, Download, Layers, Zap } from 'lucide-react';
import { cn } from './lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modules State
  const [activeModule, setActiveModule] = useState<string | null>(null); // 'logic', 'history', 'reroute', etc.
  const [showComparison, setShowComparison] = useState(false);

  const { coords, error: geoError, loading: geoLoading } = useGeolocation();
  const { history, addToHistory, clearHistory } = useHistory();
  
  // Navigation Tracking State
  const [simulatedCoords, setSimulatedCoords] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextManeuverDistance, setNextManeuverDistance] = useState(0);
  const [sharingLink, setSharingLink] = useState<string | null>(null);
  const [rerouteSuggestion, setRerouteSuggestion] = useState<RouteOption | null>(null);

  // Load shared route from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start');
    const destParam = params.get('dest');

    if (startParam && destParam) {
      const [sLat, sLng] = startParam.split(',').map(Number);
      const [dLat, dLng] = destParam.split(',').map(Number);
      
      setStartLocation({ lat: sLat, lng: sLng, name: "Shared Start" });
      setDestination({ lat: dLat, lng: dLng, name: "Shared Destination" });
      setShowApp(true);
    }
  }, []);

  // Update sharing link
  useEffect(() => {
    if (startLocation && destination && isNavigating) {
      const link = `${window.location.origin}${window.location.pathname}?start=${startLocation.lat},${startLocation.lng}&dest=${destination.lat},${destination.lng}`;
      setSharingLink(link);
    } else {
      setSharingLink(null);
    }
  }, [startLocation, destination, isNavigating]);

  // Turn-by-Turn & Voice Guidance Logic
  useEffect(() => {
    const trackingCoords = simulatedCoords || coords;
    if (!isNavigating || !routes[activeRouteIndex] || !trackingCoords) return;

    const route = routes[activeRouteIndex];
    const steps = route.legs?.[0]?.steps || [];
    
    // Find closest step (simplified for demo)
    // In a real app, we'd use a snapping algorithm
    const nextStep = steps[currentStepIndex];
    if (nextStep) {
      const dist = nextStep.distance; // This is a rough estimate
      setNextManeuverDistance(dist);

      // Voice trigger logic
      if (dist < 100 && dist > 50 && voiceEnabled) {
         speak(`In 100 meters, ${nextStep.maneuver?.instruction || "continue"}`);
      } else if (dist < 20 && voiceEnabled) {
         speak(nextStep.maneuver?.instruction || "Turn now");
         if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
         } else {
            handleStopNav();
            speak("You have reached your destination.");
         }
      }
    }
  }, [coords, simulatedCoords, isNavigating, activeRouteIndex, routes, currentStepIndex, voiceEnabled]);

  // Predictive Rerouting Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating && startLocation && destination) {
       interval = setInterval(async () => {
         // In real scenario, startLocation would be current coords
         const currentPos = simulatedCoords || coords;
         const locToQuery = currentPos ? { lat: currentPos.latitude, lng: currentPos.longitude } : startLocation;
         const newOptions = await getRoutes(locToQuery as Location, destination);
         
         if (newOptions.length > 0) {
            const currentRoute = routes[activeRouteIndex];
            const bestNew = newOptions[0];
            
            // If new route is significantly faster (e.g., saves 2+ minutes)
            if (currentRoute && bestNew.duration < currentRoute.duration - 120) {
               setRerouteSuggestion(bestNew);
               speak("Heavier congestion detected on current path. A faster route is available, saving approximately 4 minutes.");
            }
         }
       }, 30000); // Check every 30 seconds
    }
    return () => clearInterval(interval);
  }, [isNavigating, routes, activeRouteIndex, startLocation, destination, coords, simulatedCoords]);

  // Update starting point automatically if user allows geo and no start is set
  useEffect(() => {
    if (coords && !startLocation && !isNavigating) {
      setStartLocation({ 
        lat: coords.latitude, 
        lng: coords.longitude, 
        name: "Current Location" 
      });
      
      reverseGeocode(coords.latitude, coords.longitude).then(name => {
        setStartLocation(prev => prev ? { ...prev, name: name.split(',')[0] } : null);
      });
    }
  }, [coords, startLocation, isNavigating]);

  // Fetch routes when locations change
  useEffect(() => {
    if (startLocation && destination) {
      getRoutes(startLocation, destination).then(options => {
        setRoutes(options);
        setActiveRouteIndex(0);
        setAiExplanation(null);
        if (options.length > 1) setShowComparison(true);
      });
    } else {
      setRoutes([]);
      setShowComparison(false);
    }
  }, [startLocation, destination]);

  // AI Explanation
  useEffect(() => {
    if (routes.length > 0 && startLocation && destination && !aiExplanation) {
      const activeRoute = routes[activeRouteIndex];
      explainRoute(activeRoute, startLocation.name || 'Start', destination.name || 'Destination')
        .then(setAiExplanation);
      
      if (voiceEnabled && !isNavigating) {
        speak(`Computation complete. Optimal path identified via ${activeRoute.summary?.split(',')[0]}. Estimated duration is ${Math.round(activeRoute.duration / 60)} minutes.`);
      }
    }
  }, [routes, activeRouteIndex, voiceEnabled, startLocation, destination, isNavigating, aiExplanation]);

  // Simulated Movement for Demo/Preview
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating && routes[activeRouteIndex]) {
      const geometry = routes[activeRouteIndex].geometry;
      const points = decodePolyline(geometry);
      let step = 0;
      
      interval = setInterval(() => {
        if (step < points.length) {
          const [lat, lng] = points[step];
          setSimulatedCoords({ latitude: lat, longitude: lng, heading: 0 });
          step++;
        } else {
          handleStopNav();
          clearInterval(interval);
        }
      }, 3000);
    } else {
      setSimulatedCoords(null);
    }
    return () => clearInterval(interval);
  }, [isNavigating, routes, activeRouteIndex]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const handleApplyReroute = () => {
    if (rerouteSuggestion) {
      // Find the index of the suggestion in the original routes or just add it
      setRoutes([rerouteSuggestion, ...routes]);
      setActiveRouteIndex(0);
      setRerouteSuggestion(null);
      speak("Reroute sequence applied. Recalculating spatial parameters.");
    }
  };

  const handleStartNav = () => {
    setIsNavigating(true);
    setIsMobileMenuOpen(false);
    setShowComparison(false);
    setActiveModule(null);
    setCurrentStepIndex(0);
    speak("Navigation sequence engaged. Proceed to the highlighted route.");
    
    if (startLocation && destination && routes[activeRouteIndex]) {
      const r = routes[activeRouteIndex];
      addToHistory(startLocation, destination, r.distance, r.duration, r.summary);
    }
  };

  const handleStopNav = () => {
    setIsNavigating(false);
    speak("Navigation sequence terminated.");
  };

  const handleLocationSelect = (loc: Location, type: 'start' | 'dest') => {
    if (type === 'start') setStartLocation(loc);
    else setDestination(loc);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setStartLocation(entry.start);
    setDestination(entry.destination);
    setActiveModule(null);
  };

  const handleUseCurrentLocation = () => {
    if (coords) {
      const loc = { lat: coords.latitude, lng: coords.longitude, name: 'Current Location' };
      setStartLocation(loc);
      speak("Using current location.");
    } else {
      speak("Waiting for location signal.");
    }
  };

  const handleBackToHome = () => {
    setShowApp(false);
    setActiveModule(null);
  };

  const downloadReport = () => {
    if (!routes[activeRouteIndex] || !startLocation || !destination) return;
    const route = routes[activeRouteIndex];
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('DRR AI: Spatial Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Origin: ${startLocation.name}`, 20, 40);
    doc.text(`Destination: ${destination.name}`, 20, 45);
    
    const tableData = [
      ['Metric', 'Value'],
      ['Distance', `${(route.distance / 1000).toFixed(1)} km`],
      ['Duration', `${Math.round(route.duration / 60)} min`],
      ['Traffic', route.trafficSimulated?.toUpperCase() || 'NORMAL'],
      ['Eco Score', `${route.ecoScore}%`],
      ['Safety Score', `${route.safetyScore}%`],
      ['Fuel Estimated', `${route.fuelEstimated} L`],
      ['CO2 Offset', `${route.co2Reduction} kg`]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.text('AI Rationale:', 20, finalY + 10);
    doc.setFont('serif', 'italic');
    doc.text(aiExplanation || 'No rationale generated.', 20, finalY + 20, { maxWidth: 170 });

    doc.save(`AetherNav_Report_${Date.now()}.pdf`);
  };

  if (!showApp) {
    return (
      <LandingPage 
        onStart={() => setShowApp(true)} 
        navigationData={{
          startLocation,
          destination,
          routes,
          activeRouteIndex,
          isNavigating,
          voiceEnabled,
          aiExplanation,
          rerouteSuggestion,
          history,
          sharingLink,
          nextManeuver: routes[activeRouteIndex]?.legs?.[0]?.steps?.[currentStepIndex]
        }}
        handlers={{
          handleLocationSelect,
          handleStartNav,
          handleStopNav,
          setActiveRouteIndex,
          setVoiceEnabled,
          handleApplyReroute,
          handleHistorySelect,
          clearHistory,
          speak,
          setActiveModule
        }}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-[400px] h-full shrink-0 z-[60]">
        <Sidebar 
          idPrefix="desktop"
          onLocationSelect={handleLocationSelect}
          startLocation={startLocation}
          destination={destination}
          routes={routes}
          activeRouteIndex={activeRouteIndex}
          onRouteSelect={(idx) => { setActiveRouteIndex(idx); setAiExplanation(null); }}
          isNavigating={isNavigating}
          onStartNav={handleStartNav}
          onStopNav={handleStopNav}
          voiceEnabled={voiceEnabled}
          onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
          aiExplanation={aiExplanation}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onDownloadReport={downloadReport}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Floating Back Button */}
        <button 
          onClick={handleBackToHome}
          className="absolute top-6 left-6 z-[70] w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95 group"
          title="Back to Landing UI"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>

        <Map 
          userCoords={simulatedCoords || coords}
          startLocation={startLocation}
          destination={destination}
          routes={routes}
          activeRouteIndex={activeRouteIndex}
          onRouteSelect={setActiveRouteIndex}
          isNavigating={isNavigating}
          nextManeuverDistance={nextManeuverDistance}
          nextManeuver={routes[activeRouteIndex]?.legs?.[0]?.steps?.[currentStepIndex]}
        />

        {/* Home Button (Back to Dashboard) */}
        {!isMobileMenuOpen && (
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowApp(false)}
            className="absolute top-8 left-8 md:left-[420px] z-[70] p-4 glass rounded-2xl flex items-center gap-3 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </motion.button>
        )}

        {/* Global Overlays */}
        <AnimatePresence>
          {/* Comparison Panel */}
          {showComparison && !isNavigating && routes.length > 1 && (
            <motion.div 
              key="comparison-panel"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 z-40"
            >
              <div className="glass-dark p-6 rounded-[32px] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] text-white font-bold">Route Comparative Analysis</h3>
                  <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <RouteComparisonPanel 
                  routes={routes}
                  activeIdx={activeRouteIndex}
                  onSelect={(idx) => { setActiveRouteIndex(idx); setAiExplanation(null); }}
                />
              </div>
            </motion.div>
          )}

          {/* Feature Modal / Panel */}
          {activeModule && (
            <motion.div 
              key={`module-panel-${activeModule}-${activeRouteIndex}`}
              initial={{ scale: 0.95, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, x: 20 }}
              className="absolute top-24 right-8 w-[400px] h-[600px] z-50 pointer-events-auto"
            >
              {activeModule === 'logic' ? (
                <AIChat routeData={routes[activeRouteIndex]} onClose={() => setActiveModule(null)} />
              ) : activeModule === 'history' ? (
                <HistoryList history={history} onSelect={handleHistorySelect} onClear={clearHistory} onClose={() => setActiveModule(null)} />
              ) : (
                <FeatureModule 
                  type={activeModule as any} 
                  onClose={() => setActiveModule(null)} 
                  data={{
                    route: routes[activeRouteIndex],
                    startLocation,
                    destination,
                    rerouteSuggestion,
                    onApplyReroute: handleApplyReroute,
                    sharingLink,
                    voiceEnabled,
                    nextManeuver: routes[activeRouteIndex]?.legs?.[0]?.steps?.[currentStepIndex]
                  }}
                />
              )}
            </motion.div>
          )}

          {/* Reroute Alert Popup */}
          <AnimatePresence mode="popLayout">
            {rerouteSuggestion && (
              <motion.div 
                key={`reroute-suggestion-popup-${rerouteSuggestion.id}`}
                initial={{ y: -50, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                exit={{ y: -50, x: '-50%', opacity: 0 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
              >
                <div className="glass-dark border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between shadow-box">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Reroute Suggestion</p>
                      <p className="text-xs text-white font-medium">Faster route identified. Save 4 min.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setRerouteSuggestion(null)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400">Ignore</button>
                    <button onClick={handleApplyReroute} className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs">Apply</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Header */}
          <div className="absolute top-0 left-0 w-full p-4 md:hidden pointer-events-none z-10">
            <div className="glass p-3 rounded-2xl flex items-center justify-between pointer-events-auto">
              <button className="flex items-center gap-2 font-bold text-sm text-white" onClick={() => setShowApp(false)}>
                <RotateCcw className="w-4 h-4" />
                DRR AI
              </button>
              <div className="flex gap-2">
                {routes.length > 1 && !isNavigating && (
                   <button onClick={() => setShowComparison(!showComparison)} className="p-2 bg-white/5 rounded-xl text-zinc-400">
                     <Layers className="w-4 h-4" />
                   </button>
                )}
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                >
                  {isNavigating ? "Telemetry" : "Control"}
                </button>
              </div>
            </div>
          </div>

          {/* Geolocation Warning */}
          {geoError && (
            <motion.div 
              key="geo-access-error-alert"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] md:w-auto glass p-4 rounded-2xl flex items-center gap-3 border-rose-500/30 text-rose-400 z-50 backdrop-blur-xl"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-widest">Geolocation Restricted</p>
                <p className="opacity-80">Manual telemetry input required for precise rationalization.</p>
              </div>
            </motion.div>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-10 right-10 flex flex-col gap-2 z-10 pointer-events-auto hidden md:flex">
             <button onClick={() => setShowComparison(!showComparison)} className={cn("p-4 rounded-2xl glass transition-all", showComparison ? "bg-blue-500/20 text-blue-400" : "text-white")}>
               <Layers className="w-5 h-5" />
             </button>
             <button onClick={downloadReport} className="p-4 rounded-2xl glass text-white">
               <Download className="w-5 h-5" />
             </button>
          </div>
        </AnimatePresence>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <motion.div 
            key="mobile-telemetry-menu"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed inset-0 z-[100] md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute bottom-0 left-0 w-full h-[85vh] bg-[#0a0a0a] rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl border-t border-white/10">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
              <div className="flex-1 overflow-y-auto">
                <Sidebar 
                  idPrefix="mobile"
                  onLocationSelect={handleLocationSelect}
                  startLocation={startLocation}
                  destination={destination}
                  routes={routes}
                  activeRouteIndex={activeRouteIndex}
                  onRouteSelect={(idx) => { setActiveRouteIndex(idx); setAiExplanation(null); }}
                  isNavigating={isNavigating}
                  onStartNav={handleStartNav}
                  onStopNav={handleStopNav}
                  voiceEnabled={voiceEnabled}
                  onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                  aiExplanation={aiExplanation}
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                  onDownloadReport={downloadReport}
                  onUseCurrentLocation={handleUseCurrentLocation}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

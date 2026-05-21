import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
    heading: number | null;
  } | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true
  });
  
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation not supported", loading: false }));
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading
          },
          error: null,
          loading: false
        });
      },
      (error) => {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return state;
}

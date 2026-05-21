import { SearchResult } from "../types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const REVERSE_BASE_URL = "https://nominatim.openstreetmap.org/reverse";

const SESSION_UA = `AetherNav-App-v4-${Math.random().toString(36).substring(7)}`;

export async function searchLocations(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];
  
  const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': SESSION_UA
      }
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Nominatim Search Warning (handled):", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `${REVERSE_BASE_URL}?lat=${lat}&lon=${lon}&format=json`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': SESSION_UA
      }
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.display_name || "Unknown Location";
  } catch (error) {
    console.warn("Nominatim Reverse Warning (handled):", error);
    return "Unknown Location";
  }
}

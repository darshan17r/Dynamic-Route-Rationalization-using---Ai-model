import { Location, RouteOption } from "../types";

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getRoutes(start: Location, end: Location): Promise<RouteOption[]> {
  const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=polyline&alternatives=true&steps=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error("Routing failed");
    }

    return data.routes.map((route: any, index: number) => {
      // Simulate traffic and smart features based on route characteristics
      const trafficSeed = Math.random();
      const traffic = trafficSeed > 0.7 ? 'slow' : trafficSeed > 0.4 ? 'moderate' : 'fast';
      
      const distanceKm = route.distance / 1000;
      const durationMin = route.duration / 60;
      
      // Heuristic for eco score
      const ecoScore = Math.max(0, 100 - (distanceKm * 2) - (traffic === 'slow' ? 20 : 0));
      const fuelEstimated = (distanceKm * 0.08) * (traffic === 'slow' ? 1.3 : 1.0); // 8L/100km avg
      const co2Reduction = (100 - ecoScore) * 0.05;

      // Heuristic for safety
      const safetySeed = Math.random();
      const safetyScore = Math.round(70 + (safetySeed * 30));
      const roadLighting = Math.round(60 + (safetySeed * 40));
      const populatedDensity = Math.round(50 + (safetySeed * 50));
      
      // Heuristic for difficulty
      const turnCount = route.legs[0].steps.length;
      const difficulty = turnCount > 20 ? 'hard' : turnCount > 10 ? 'medium' : 'easy';

      return {
        id: `route-${index}-${Math.random().toString(36).substr(2, 9)}`,
        ...route,
        trafficSimulated: traffic,
        ecoScore: Math.round(ecoScore),
        fuelEstimated: Number(fuelEstimated.toFixed(2)),
        co2Reduction: Number(co2Reduction.toFixed(2)),
        safetyScore,
        roadLighting,
        populatedDensity,
        difficulty,
        tollRoads: Math.random() > 0.8
      };
    });
  } catch (error) {
    console.error("OSRM Error:", error);
    return [];
  }
}

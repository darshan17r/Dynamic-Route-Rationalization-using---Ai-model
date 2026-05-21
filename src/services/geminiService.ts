import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainRoute(routeData: any, startName: string, destName: string) {
  try {
    const response = await (genAI.models as any).generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: 'user',
        parts: [{
          text: `
            As a smart navigation assistant, explain why this specific route from "${startName}" to "${destName}" is being suggested.
            
            Route Data:
            - Distance: ${(routeData.distance / 1000).toFixed(1)} km
            - Estimated Duration: ${Math.round(routeData.duration / 60)} minutes
            - Number of turns: ${routeData.legs[0].steps.length}
            - Route Summary: ${routeData.legs[0].summary}
            - Safety Score: ${routeData.safetyScore}%
            - Eco Score: ${routeData.ecoScore}%
            
            Context:
            This is for a premium "Dynamic Route Rationalization System". 
            Mention specific characteristics like traffic efficiency, eco-friendliness, or road types.
            Keep the explanation concise (2-3 sentences), professional, and futuristic.
            Do not use markdown formatting, just plain text.
          `
        }]
      }]
    });
    return response.text || "This route offers the optimal balance between speed and distance, avoiding major high-traffic intersections based on current flow models.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "This route offers the optimal balance between speed and distance, avoiding major high-traffic intersections based on current flow models.";
  }
}

export async function chatAboutRoute(message: string, history: any[], routeData: any) {
  const systemPrompt = `
    You are an AI Smart Navigation Assistant for "DRR AI" (Dynamic Route Rationalization AI).
    You provide expert-level spatial intelligence, route reasoning, and general assistance.
    
    Current Route Data (If available):
    - Origin: ${routeData?.startName || 'N/A'}
    - Destination: ${routeData?.destName || 'N/A'}
    - Distance: ${routeData ? (routeData.distance / 1000).toFixed(1) + ' km' : 'N/A'}
    - Duration: ${routeData ? Math.round(routeData.duration / 60) + ' min' : 'N/A'}
    - Traffic Condition: ${routeData?.trafficSimulated || 'N/A'}
    - Safety Score: ${routeData?.safetyScore || 'N/A'}/100
    - Eco Efficiency: ${routeData?.ecoScore || 'N/A'}/100
    - Fuel Consumption Est: ${routeData?.fuelEstimated || 'N/A'} L
    - Road Lighting Density: ${routeData?.roadLighting || 'N/A'}%
    - Population Density on Path: ${routeData?.populatedDensity || 'N/A'}%
    
    Guidelines:
    1. GREETINGS: Respond naturally to "hello", "hi", etc. Introduce yourself as the DRR AI Rationalization Engine.
    2. NAVIGATION QUERIES: If the user asks about distance, time, or "why this route", use the provided Route Data.
    3. ROUTE REASONING: Explain "Safety" by mentioning lighting and population density. Explain "Eco" by mentioning fuel and carbon offset.
    4. GENERAL KNOWLEDGE: If the user asks general questions (e.g., distance between cities outside current context), use your internal knowledge to provide estimates.
    5. TONE: Professional, futuristic, highly intelligent, yet helpful.
    6. CONCISENESS: Keep responses medium-length (2-4 sentences). Avoid long paragraphs unless specifically asked for deep analysis.
    7. APP FEATURES: You can explain features like "Predictive Rerouting", "Spatial PDF Reports", and "Real-time Telemetry".
  `;

  try {
    const chat = (genAI as any).chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt
      },
      history: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat Gemini Error:", error);
    return "I am currently re-calibrating my spatial analysis filters. Please re-engage the query stream.";
  }
}

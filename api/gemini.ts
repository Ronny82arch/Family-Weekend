import { GoogleGenAI } from "@google/genai";

export const config = { maxDuration: 60 };
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload, userKey, metadata } = req.body || {};

    const fallbackKey = process.env.FALLBACK_GEMINI_API_KEY || '';
    const serverKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || fallbackKey;
    const apiKey = (userKey && typeof userKey === 'string' && userKey.trim().length > 0) ? userKey.trim() : serverKey;

    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(400).json({ error: 'API_KEY_REQUIRED', message: 'Chiave API Gemini richiesta. Inserisci la tua API Key nelle Impostazioni.' });
    }

    let finalPayload = payload || {};
    if (action === 'generateContent' && metadata) {
        let contextString = "\n\n--- REAL-TIME CONTEXT DATA ---\n";
        if (metadata.lat && metadata.lon) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 2500);
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${metadata.lat}&longitude=${metadata.lon}&daily=weathercode,temperature_2m_max&timezone=auto`, { signal: controller.signal });
                clearTimeout(timer);
                if (weatherRes.ok) {
                    const weatherData = await weatherRes.json();
                    const forecast = weatherData.daily.time.map((t: any, i: number) => `${t}: ${weatherData.daily.temperature_2m_max[i]}�C, Code ${weatherData.daily.weathercode[i]}`).slice(0, 3).join('; ');
                    contextString += `WEATHER FORECAST: ${forecast}\n(Rule: If raining/bad weather, prioritize INDOOR activities.)\n`;
                }
            } catch(e) {}
        }
        
        contextString += `\nSTRICT ROUTING RULE: Geographically group activities! Do not suggest a morning activity far away from an afternoon activity. Keep travel time under 15 minutes between activities in the same half-day block.\n`;
        contextString += "------------------------------\n";
        finalPayload = JSON.parse(JSON.stringify(payload));
        if (finalPayload.contents?.[0]?.parts?.[0]) {
            finalPayload.contents[0].parts[0].text = contextString + finalPayload.contents[0].parts[0].text;
        }
    }

    const ai = new GoogleGenAI({ apiKey });

    switch (action) {
      case 'generateContent': {
        let payloadToUse = finalPayload;
        if (!payloadToUse.model || payloadToUse.model.includes('gemini-2.5') || payloadToUse.model.includes('gemini-3.6')) {
            payloadToUse = { ...payloadToUse, model: 'gemini-2.0-flash' };
        }
        try {
            const response = await ai.models.generateContent(payloadToUse);
            const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            return res.status(200).json({ text, candidates: response.candidates, groundingChunks });
        } catch (mErr: any) {
            console.warn("Primary model gemini-2.0-flash failed in api/gemini, trying fallback gemini-1.5-flash...", mErr);
            payloadToUse = { ...payloadToUse, model: 'gemini-1.5-flash' };
            const response = await ai.models.generateContent(payloadToUse);
            const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            return res.status(200).json({ text, candidates: response.candidates, groundingChunks });
        }
      }
      
      case 'generateVideos': {
        const operation = await ai.models.generateVideos(payload);
        return res.status(200).json(operation);
      }

      case 'getVideosOperation': {
        const operation = await ai.operations.getVideosOperation(payload);
        return res.status(200).json(operation);
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota');
    const status = isQuota ? 429 : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FamilyPreferences, PlanResult, ChatMessage, AvatarConfig, TimeSlot } from "../types";

const getLanguageName = (code: string) => {
    switch(code) {
        case 'en': return 'English';
        case 'es': return 'Spanish';
        case 'fr': return 'French';
        case 'de': return 'German';
        default: return 'Italian';
    }
};

const getLocalizedTerms = (code: string) => {
    const terms: Record<string, any> = {
        en: { sat: 'Saturday', sun: 'Sunday', mission: 'Missions', story: 'Story', budget: 'Budget', transport: 'Transport', pack: 'Backpack' },
        es: { sat: 'Sábado', sun: 'Domingo', mission: 'Misiones', story: 'Cuento', budget: 'Presupuesto', transport: 'Transporte', pack: 'Mochila' },
        fr: { sat: 'Samedi', sun: 'Dimanche', mission: 'Missions', story: 'Conte', budget: 'Budget', transport: 'Transport', pack: 'Sac à dos' },
        de: { sat: 'Samstag', sun: 'Sonntag', mission: 'Missionen', story: 'Geschichte', budget: 'Budget', transport: 'Transport', pack: 'Rucksack' },
        it: { sat: 'Sabato', sun: 'Domenica', mission: 'Missioni', story: 'Favola', budget: 'Budget', transport: 'Trasporti', pack: 'Zaino' }
    };
    return terms[code] || terms.it;
};

export function decodePCM(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || (error.status !== 500 && error.status !== 503 && !error.message?.includes('Internal error'))) throw error;
    console.warn(`Retrying Gemini request... attempts left: ${retries}. Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

export const getApiKey = (): string => {
  try {
    const userKey = localStorage.getItem('user_gemini_api_key');
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  } catch (e) {}
  return (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
};

export const getGenAIClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_REQUIRED");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWelcomeAudio = async (): Promise<string> => {
    const ai = getGenAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: "Say with high energy and child-friendly enthusiasm: Ehi, ehi, ehi! Siete pronti? Costruiamo i vostri ricordi insieme." }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Puck' } 
                    },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("No audio data");
        return audioData;
    } catch (error) {
        console.error("Welcome audio generation failed:", error);
        throw error;
    }
};

export const generateWeekendPlan = async (prefs: FamilyPreferences, previousPlanText?: string): Promise<PlanResult> => {
  const ai = getGenAIClient();
  const hasManual = !!prefs.manualLocation && prefs.manualLocation.trim().length > 0;
  const hasGPS = prefs.latitude !== null && prefs.longitude !== null;

  if (!hasManual && !hasGPS) {
    throw new Error("Location required / Posizione richiesta.");
  }

  // Use gemini-2.5-flash for maps grounding support
  const model = 'gemini-2.5-flash'; 
  const langName = getLanguageName(prefs.language);
  const terms = getLocalizedTerms(prefs.language);

  const locationDescription = hasManual 
    ? `Start Location (HOME): "${prefs.manualLocation}"`
    : `Start Location (HOME): GPS (Lat: ${prefs.latitude}, Lon: ${prefs.longitude})`;

  const childrenDescription = prefs.children.length > 0
    ? prefs.children.map(c => `${c.name} (${c.age} anni)`).join(", ")
    : "Bambini";

  const getDayPrompt = (dayName: string, mode: TimeSlot) => {
      // MODE: REST (NONE)
      if (mode === 'none') {
          return `## ${dayName}
    ### Relax: Giornata di Riposo
    VISUAL_SCENE: Relaxing home atmosphere or local park
    Giornata libera per ricaricare le energie. Nessuna attività di viaggio pianificata.`;
      }
      
      let schedule = "";
      let constraints = "";
      
      // MODE: FULL DAY
      if (mode === 'full_day') {
          constraints = `
            LOGISTICA: La famiglia parte la mattina e rientra dopo cena.
            STRUTTURA OBBLIGATORIA (usa esattamente questi titoli):
            1. ### Mattina: [Titolo Attività]
            2. ### 🍽️ Pranzo: [Ristorante]
            3. ### Pomeriggio: [Titolo Attività]
          `;
          schedule = `
    ### Mattina: [Titolo Attività]
    VISUAL_SCENE: [Dettagli per immagine]
    [Descrizione dettagliata attività mattutina]
    
    ### 🍽️ Pranzo: [Ristorante consigliato]
    VISUAL_SCENE: [Cibo/Ambiente]
    [Descrizione menu bambini e atmosfera]

    ### Pomeriggio: [Titolo Attività]
    VISUAL_SCENE: [Dettagli]
    [Descrizione dettagliata attività pomeridiana]`;
      } 
      
      // MODE: MORNING ONLY
      else if (mode === 'morning') {
          constraints = `
            ⛔ DIVIETI ASSOLUTI: NON generare sezioni "Pomeriggio" o "Cena".
            LOGISTICA: La famiglia parte la mattina e RIENTRA A CASA subito dopo pranzo.
            STRUTTURA OBBLIGATORIA (usa esattamente questi titoli):
            1. ### Mattina: [Titolo Attività]
            2. ### 🍽️ Pranzo: [Ristorante]
            3. STOP. (Non scrivere altro dopo il pranzo).
          `;
          schedule = `
    ### Mattina: [Titolo Attività]
    VISUAL_SCENE: [Dettagli per immagine]
    [Descrizione dettagliata attività mattutina]
    
    ### 🍽️ Pranzo: [Ristorante consigliato]
    VISUAL_SCENE: [Cibo/Ambiente]
    [Descrizione menu bambini e atmosfera]`;
      } 
      
      // MODE: AFTERNOON ONLY
      else if (mode === 'afternoon') {
          constraints = `
            ⛔ DIVIETI ASSOLUTI: NON generare sezioni "Mattina".
            LOGISTICA: La famiglia parte da casa direttamente per pranzo. La mattina è a casa.
            STRUTTURA OBBLIGATORIA (usa esattamente questi titoli):
            1. ### 🍽️ Pranzo: [Ristorante]
            2. ### Pomeriggio: [Titolo Attività]
            3. ### 🍽️ Cena: [Ristorante/Pizzeria]
          `;
          schedule = `
    ### 🍽️ Pranzo: [Ristorante consigliato]
    VISUAL_SCENE: [Cibo/Ambiente]
    [Descrizione luogo di ritrovo per pranzo]

    ### Pomeriggio: [Titolo Attività]
    VISUAL_SCENE: [Dettagli]
    [Descrizione dettagliata attività pomeridiana]
    
    ### 🍽️ Cena: [Ristorante/Pizzeria consigliato]
    VISUAL_SCENE: [Cibo/Ambiente]
    [Descrizione cena conclusiva]`;
      }

      return `## ${dayName}
    ${constraints}
    ${schedule}

    ### 🚗 Navigazione ${dayName}
    VISUAL_SCENE: Road Map
    [Elenco numerato dei passaggi stradali dettagliati per le tappe sopra indicate]

    ## ${terms.mission} ${dayName}
    MANDATORIO: Inserisci sempre ALMENO 3 missioni di gioco specifiche per i luoghi visitati.
    Formato: "* **[Titolo Missione]**: [Descrizione obiettivo divertente]. (🛡️ Sicurezza: [Consiglio pratico])"
    Ogni missione deve stare su una riga separata che inizia con un asterisco.

    ## ${terms.story} ${dayName}
    [Breve favola della buonanotte legata ai luoghi visitati oggi]

    ## ${terms.budget} ${dayName}
    Fornisci un elenco puntato DETTAGLIATO (usa riga per categoria):
    - 🍽️ **Ristorazione**: [Stima] €XX
    - 🎟️ **Ingressi/Attività**: [Costo] €XX
    - 🚗 **Trasporto**: [Stima] €XX
    - 🛍️ **Extra**: [Varie] €XX
    **TOTALE STIMATO PER ${dayName.toUpperCase()}: €XXX**

    ## ${terms.transport} ${dayName}
    [Consigli su parcheggi e spostamenti per le tappe di oggi]

    ## ${terms.pack} ${dayName}
    MANDATORIO: Usa un elenco puntato dove OGNI riga corrisponde a un singolo oggetto specifico utile per le attività di oggi (es. crema solare, scarpe ricambio, ecc).`;
  };

  const activeDays = [];
  if (prefs.saturdayMode !== 'none') activeDays.push(terms.sat);
  if (prefs.sundayMode !== 'none') activeDays.push(terms.sun);

  let strategyInstruction = "";
  if (activeDays.length === 0) {
      strategyInstruction = "Genera solo consigli per il relax a casa. Nessun viaggio.";
  } else if (prefs.overnightStay && activeDays.length === 2) {
      strategyInstruction = `WEEKEND MODE (Pernottamento): Scegli una zona e esplorala a fondo sia ${terms.sat} che ${terms.sun}. Dormono fuori.`;
  } else {
      strategyInstruction = `DAY TRIPS MODE: Pianifica per ${activeDays.join(' e ')}. Sono gite separate con rientro a casa. Se ci sono due giorni attivi, varia le destinazioni. Rispetta rigorosamente le fasce orarie richieste per ogni giorno.`;
  }

  const prompt = `
    Sei un Esperto Local Event Scout e Family Travel Agent. Scrivi in ${langName}.
    
    1. IL CLIENTE:
    - ${locationDescription}
    - DATA VIAGGIO: ${prefs.selectedDate} (Cerca eventi specifici per questo weekend).
    - ${prefs.adults} Adulti, Bambini: ${childrenDescription}
    - Interessi: ${prefs.interests || "Divertimento per famiglie"}
    - Mood: ${prefs.vibe || "Equilibrato"}
    
    2. STRATEGIA DI RICERCA (CRITICO - NO ALLUCINAZIONI):
    - PRIMA DI TUTTO: Verifica il calendario dell'anno richiesto (${prefs.selectedDate.split('-')[0]}). Calcola quando cadono festività mobili (Carnevale, Pasqua) per quell'anno specifico.
      * Esempio: Se la data è dopo il Martedì Grasso, NON suggerire sfilate di Carnevale.
      * Esempio: Se è Domenica, verifica che i negozi/musei siano aperti.
    - Cerca eventi REALI confermati ESATTAMENTE per il ${prefs.selectedDate}.
    - RAGGIO MAX: ${prefs.radiusKm} KM dalla partenza.
    - SE NON TROVI EVENTI SPECIFICI CONFERMATI: Non inventarli. Suggerisci invece attività "Evergreen" (Parchi, Musei, Ville, Laghi, Sentieri Facili) che sono sempre aperti.
      * In questo caso, scrivi esplicitamente: "Non ci sono grandi eventi confermati per questa data, ma ecco un'ottima alternativa...".
    - STRATEGIA: ${strategyInstruction}

    3. REGOLE DI FORMATTAZIONE (STRICT):
    - Usa Markdown.
    - Titoli attività con "### "
    - Nomi dei luoghi in "**Grassetto**"
    - Visual scene sotto i titoli: "VISUAL_SCENE: [Descrizione breve per immagine]"
    - SE UN GIORNO E' IMPOSTATO SU "MATTINA", NON GENERARE ATTIVITA' POMERIDIANE.
    - SE UN GIORNO E' IMPOSTATO SU "POMERIGGIO", NON GENERARE ATTIVITA' MATTUTINE.

    ## Intro
    [Inspirational intro]
    GENERATE METEO_VISUAL for ${terms.sat} and ${terms.sun}. Format: DAY|MORNING_ICON|TEMP|AFTERNOON_ICON|TEMP|NIGHT_ICON|TEMP
    Example: ${terms.sat.toUpperCase()}|☀️|20°|⛅|22°|🌙|15°

    ${getDayPrompt(terms.sat, prefs.saturdayMode)}

    ${getDayPrompt(terms.sun, prefs.sundayMode)}

    ### DATA_MARKERS
    [Fondamentale per la mappa: MARKER: Lat, Lon, Titolo]
  `;

  const config: any = {
    tools: [{ googleMaps: {} }, { googleSearch: {} }],
  };

  if (hasGPS && !hasManual) {
    config.toolConfig = {
      retrievalConfig: { latLng: { latitude: prefs.latitude, longitude: prefs.longitude } },
    };
  }

  return retryWithBackoff(async () => {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }] },
          config: config,
        });

        const text = response.text || "";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text, groundingChunks };
      } catch (error: any) {
        console.error("Gemini Error:", error);
        if (error.message?.includes("Requested entity was not found")) {
            throw new Error("API_KEY_REQUIRED");
        }
        throw error;
      }
  });
};

export const generateStoryAudio = async (text: string): Promise<string> => {
    const ai = getGenAIClient();
    return retryWithBackoff(async () => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: { parts: [{ text: `Say cheerfully: Narra questa storia per bambini con tono magico: ${text}` }] },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!audioData) throw new Error("No audio");
            return audioData;
        } catch (error) { throw new Error("Audio failed."); }
    });
};

export const generateCertificateImage = async (base64Avatar: string, levelTitle: string): Promise<string> => {
    const ai = getGenAIClient();
    let environment = "a bright sunlit park with gentle trails";
    if (levelTitle.includes("Lince") || levelTitle.includes("Guardiano")) environment = "a lush, ancient deep forest with magical fireflies";
    if (levelTitle.includes("Veterano") || levelTitle.includes("Leggenda")) environment = "the peak of a magnificent mountain above the clouds with a golden sunset";
    if (levelTitle.includes("Bussola") || levelTitle.includes("Sentieri")) environment = "a beautiful valley with a winding river and wooden bridges";

    const prompt = `
        Pixar style 3D cinematic render of an explorer child. 
        MANDATORY: Use the provided character face as the absolute reference.
        SCENE: The child is standing heroically in ${environment}.
        CLOTHING: Professional scout/explorer gear with a badge that says "${levelTitle}". 
        They might be holding a golden compass or a map.
        Atmosphere: Achievement, epic, magical, high-quality lighting, 8k render.
    `;

    return retryWithBackoff(async () => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { 
                    parts: [
                        { inlineData: { data: base64Avatar, mimeType: 'image/png' } },
                        { text: prompt }
                    ] 
                },
                config: { imageConfig: { aspectRatio: '1:1' } }
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!part) throw new Error("No image generated");
            return `data:image/png;base64,${part.inlineData!.data}`;
        } catch (error) {
            console.error("Certificate generation error:", error);
            throw error;
        }
    });
};

export const generateVeoVideo = async (base64Image: string, title: string): Promise<string> => {
    const ai = getGenAIClient();
    try {
        const prompt = `
            MAGIC FAMILY ADVENTURE VIDEO: "${title}".
            ACTION: Animate the static family photo with cinematic slow-zoom and gentle particle effects.
            MANDATORY OVERLAY: Display ONLY the text "Family Weekend" in the bottom-right corner using a clean white serif font with a drop shadow. Do NOT generate any graphical logos or icons.
            MANDATORY AUDIO: Include a cheerful, upbeat, and heartwarming acoustic guitar or piano melody as background music.
            ATMOSPHERE: Happy, magical, Pixar-style warmth.
        `;

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: base64Image,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed");
        return `${downloadLink}&key=${getApiKey()}`;
    } catch (error) {
        console.error("Veo generation error:", error);
        throw error;
    }
};

export const analyzeImageForChild = async (base64Image: string, mimeType: string, language: string = 'it'): Promise<string> => {
    const ai = getGenAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: `Analisi investigativa della foto per bambini. Una sola frase breve in ${language}.` }
            ]},
        });
        return response.text || "Wow!";
    } catch (error) { throw new Error("Analysis failed."); }
};

export const sendTripChatMessage = async (planText: string, history: ChatMessage[], userMessage: string): Promise<string> => {
    const ai = getGenAIClient();
    return retryWithBackoff(async () => {
        try {
            const historyText = history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');
            const contextPrompt = `Contesto viaggio:\n${planText}\n\nCronologia chat:\n${historyText}\n\nNuovo messaggio da rispondere: ${userMessage}`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: contextPrompt }] },
                config: { tools: [{ googleMaps: {} }, { googleSearch: {} }] }
            });
            return response.text || "Non ho capito la domanda.";
        } catch (error) { throw new Error("Chat failed."); }
    });
};

export const generateRainAlternatives = async (planText: string): Promise<string> => {
    const ai = getGenAIClient();
    return retryWithBackoff(async () => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: `Il piano originale era: ${planText}. PIOVE! Trova 3 alternative al chiuso nelle vicinanze usando Google Maps.` }] },
                config: { tools: [{ googleMaps: {} }] }
            });
            return response.text || "Nessuna alternativa trovata.";
        } catch (error) { return "Errore nel trovare alternative."; }
    });
};

export const generateFamilyMemberAvatar = async (description: string, role: string): Promise<string> => {
    const ai = getGenAIClient();
    return retryWithBackoff(async () => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: description }] },
                config: { imageConfig: { aspectRatio: '1:1' } }
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!part) throw new Error("No image");
            return `data:image/png;base64,${part.inlineData!.data}`;
        } catch (error) { throw new Error("Avatar failed."); }
    });
};

export const analyzeAvatarPhoto = async (base64: string, mimeType: string): Promise<Partial<AvatarConfig>> => {
    const ai = getGenAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [
                { inlineData: { data: base64, mimeType: mimeType } },
                { text: "Analizza il volto per configurare un avatar 3D. Ritorna JSON con: gender, hairColor, hairStyle, skinColor, glasses." }
            ]},
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        gender: { type: Type.STRING },
                        hairColor: { type: Type.STRING },
                        hairStyle: { type: Type.STRING },
                        skinColor: { type: Type.STRING },
                        glasses: { type: Type.STRING },
                    }
                 }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (error) { return {}; }
};

export const generateLocationCuriosities = async (locationName: string, context: string): Promise<string> => {
    const ai = getGenAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: `Leggenda o curiosità divertente su ${locationName} per bambini. Max 100 parole.` }] },
            config: { tools: [{ googleSearch: {} }] } 
        });
        return response.text || `Benvenuti a ${locationName}!`;
    } catch (error) { return `Preparatevi per ${locationName}!`; }
};

export const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    const ai = getGenAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: `Identifica città/paese per: ${lat}, ${lon}. Ritorna SOLO il nome.` }] },
        });
        return response.text?.trim() || `${lat}, ${lon}`;
    } catch (error) { return ""; }
};

export const generateSeasonalStory = async (season: string, locations: string[], children: string[]): Promise<string> => {
    const ai = getGenAIClient();
    const prompt = `
        Agisci come un biografo di esploratori per bambini. 
        Scrivi un racconto avventuroso di 300 parole intitolato 'La Leggenda dell'${season} della Famiglia'.
        
        PROTAGONISTI: ${children.join(", ")}.
        LUOGHI VISITATI (Tappe del viaggio): ${locations.join(", ")}.
        
        STILE: Magico, epico e nostalgico. I luoghi devono sembrare regni fantastici.
        FORMATO: Testo semplice diviso in paragrafi. Niente markdown.
    `;
    return retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: { parts: [{ text: prompt }] },
        });
        return response.text || "Una stagione indimenticabile ricca di avventure...";
    });
};
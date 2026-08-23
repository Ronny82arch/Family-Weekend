import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FamilyPreferences, PlanResult, ChatMessage, AvatarConfig, TimeSlot } from "../types";
import { searchVerifiedEvents } from "./eventDiscoveryService";

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
  let userKey = '';
  try {
    userKey = localStorage.getItem('user_gemini_api_key') || '';
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  } catch (e) {}
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
  return (viteKey || process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
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
            model: "gemini-3.5-flash-lite",
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

  // Use gemini-3.6-flash for maps grounding support
  const model = 'gemini-3.5-flash-lite'; 
  const langName = getLanguageName(prefs.language);
  const terms = getLocalizedTerms(prefs.language);

  const locationDescription = hasManual 
    ? `Start Location (HOME): "${prefs.manualLocation}"`
    : `Start Location (HOME): GPS (Lat: ${prefs.latitude}, Lon: ${prefs.longitude})`;

  const childrenDescription = prefs.children.length > 0
    ? prefs.children.map(c => `${c.name} (${c.age} anni)`).join(", ")
    : "Bambini";

  const getDayPrompt = (dayName: string, mode: TimeSlot) => {
      if (mode === 'none') {
          return `## ${dayName}
    ### Relax: Giornata di Riposo
    VISUAL_SCENE: Atmosfera rilassante a casa o nel parco vicino
    GEO_LOCATION: Parco Vicino, Italia
    Giornata libera per ricaricare le energie. Nessuna attivit� di viaggio pianificata.`;
      }
      
      let schedule = "";
      let constraints = "";
      
      const strictNamingRule = `
      DIVIETO ASSOLUTO SUI BRACKETS E PLACEHOLDER:
      NON scrivere mai "[Titolo Attivit�]", "[Ristorante]" o testo tra parentesi quadre.
      Devi SEMPRE inventare o trovare NOMI REALI E SPECIFICI per ogni luogo ed attivit� (es. "Visita a Villa Borghese", "Pranzo alla Trattoria Da Enzo al 29", "Passeggiata nel Parco Giardino Sigurt�").
      
      MANDATORIO PER LE MAPPE (GEOCODIFICA ESATTA):
      Inserisci SEMPRE la riga "GEO_LOCATION: [Nome Reale Luogo/Indirizzo, Citt�]" subito sotto VISUAL_SCENE per ogni attivit�.
      Esempio:
      ### Mattina: Visita a Villa Borghese
      VISUAL_SCENE: Giardini monumentali e fontane
      GEO_LOCATION: Villa Borghese, Roma
      Esplorazione dei viali fioriti del parco con la famiglia...
`;

      if (mode === 'full_day') {
          constraints = `
            ${strictNamingRule}
            LOGISTICA: La famiglia parte la mattina e rientra dopo cena.
            STRUTTURA OBBLIGATORIA (usa esattamente questi titoli con nomi reali):
            1. ### Mattina: [Nome Reale Attivit� Mattutina]
            2. ### ??? Pranzo: [Nome Reale Ristorante o Trattoria]
            3. ### Pomeriggio: [Nome Reale Attivit� Pomeridiana]
          `;
          schedule = `
    ### Mattina: Visita Guidata a Villa Borghese ed ai Giardini
    VISUAL_SCENE: Giardini monumentali fioriti con fontane e percorsi panoramici
    GEO_LOCATION: Villa Borghese, Roma
    Passeggiata tra i viali alberati con percorsi per bambini, noleggio risci� e visita ai giardini segreti.
    
    ### ??? Pranzo: Trattoria Da Enzo al 29
    VISUAL_SCENE: Pasta fresca tradizionale servita in un'accogliente trattoria tipica
    GEO_LOCATION: Via dei Vascellari, Roma
    Pranzo rilassante con piatti tipici della tradizione, menu speciale dedicato ai bimbi e dolci artigianali.

    ### Pomeriggio: Explora il Museo dei Bambini
    VISUAL_SCENE: Padiglione interattivo con esperimenti e giochi scientifici
    GEO_LOCATION: Via Flaminia, Roma
    Pomeriggio di puro divertimento tra installazioni interattive, giochi d'acqua e laboratori pratici.`;
      } else if (mode === 'morning') {
          constraints = `
            ${strictNamingRule}
            ? DIVIETI ASSOLUTI: NON generare sezioni "Pomeriggio" o "Cena".
            LOGISTICA: La famiglia parte la mattina e RIENTRA A CASA subito dopo pranzo.
          `;
          schedule = `
    ### Mattina: Passeggiata al Parco del Fiume Sile
    VISUAL_SCENE: Sentieri immersi nella natura lungo il fiume fiorito
    GEO_LOCATION: Parco del Sile, Treviso
    Passeggiata rilassante lungo i sentieri del parco naturale con aree gioco e sosta.
    
    ### ??? Pranzo: Ristorante Il Vigneto
    VISUAL_SCENE: Piatto di pasta fresca in un giardino panoramico
    GEO_LOCATION: Via Sant'Angelo, Treviso
    Pranzo di qualit� con prodotti a km zero ed uno spazio giochi sicuro per le famiglie.`;
      } else if (mode === 'afternoon') {
          constraints = `
            ${strictNamingRule}
            ? DIVIETI ASSOLUTI: NON generare sezioni "Mattina".
          `;
          schedule = `
    ### ??? Pranzo: Osteria Del Borgo
    VISUAL_SCENE: Tavolo in piazza con specialit� locali
    GEO_LOCATION: Piazza dei Signori, Treviso
    Pranzo di benvenuto con prodotti tipici e menu bimbi appositamente studiato.

    ### Pomeriggio: Visita al Castello Scaligero
    VISUAL_SCENE: Maestosa fortezza sulle rive del lago
    GEO_LOCATION: Castello Scaligero, Sirmione
    Pomeriggio stimolante tra torri panoramiche e racconti storici affascinanti per tutta la famiglia.
    
    ### ??? Cena: Pizzeria Gourmet La Torre
    VISUAL_SCENE: Fragrante pizza cotta nel forno a legna
    GEO_LOCATION: Piazza Castello, Sirmione
    Cena conviviale in pizzeria per concludere la giornata in bellezza.`;
      }

      return `## ${dayName}
    ${constraints}
    ${schedule}

    ### ?? Navigazione ${dayName}
    VISUAL_SCENE: Mappa stradale
    GEO_LOCATION: Centro Citt�, Italia
    - **Tappa 1**: Indicazioni stradali per la prima destinazione
    - **Tappa 2**: Spostamento verso il pranzo
    - **Tappa 3**: Pomeriggio e rientro

    ## ${terms.mission} ${dayName}
    * **Cacciatori di Dettagli**: Trova 3 elementi segreti nascosti nel parco. (??? Sicurezza: Tenere sempre i bambini per mano)

    ## ${terms.story} ${dayName}
    Favola della buonanotte sulle avventure vissute oggi per addormentarsi felicemente.

    ## ${terms.budget} ${dayName}
    - ??? **Ristorazione**: Stima �35-50
    - ??? **Ingressi**: Costo �15-25
    - ?? **Trasporto**: Stima carburante �10
    **TOTALE STIMATO PER ${dayName.toUpperCase()}: �80-95**

    ## ${terms.transport} ${dayName}
    Consigli pratici su parcheggi gratuiti o custoditi vicini ai luoghi visitati.

    ## ${terms.pack} ${dayName}
    - Scarpe da ginnastica comode
    - Borraccia termica d'acqua
    - Cappellino per il sole`;
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

  const locName = prefs.manualLocation || "Italia";
  let verifiedEventHints = "";
  try {
      const eventsFound = await searchVerifiedEvents(locName, prefs.selectedDate);
      if (eventsFound.length > 0) {
          verifiedEventHints = "EVENTI VERIFICATI IN ZONA: " + eventsFound.map(e => `${e.title} (${e.location})`).join("; ");
      }
  } catch(e) {}

  const previousPlanClause = previousPlanText 
    ? `\n    - VARIET� ED ANTI-RIPETIZIONE OBBLIGATORIA (RIGENERAZIONE): Il cliente sta rigenerando il piano. � SEVERAMENTE VIETATO ripetere gli stessi luoghi, musei o ristoranti gi� proposti nel piano precedente. Proponi nuove alternative REALI ed ORIGINALI nella zona.\n    PIANO PRECEDENTE DA EVITARE:\n${previousPlanText.substring(0, 800)}\n` 
    : "";

  
  // Calculate smart age pacing
  const ages = prefs.children.map(c => parseInt(c.age) || 5);
  const minAge = ages.length > 0 ? Math.min(...ages) : 6;
  let agePacingInstruction = "";
  if (minAge <= 3) {
    agePacingInstruction = "PACING 0-3 ANNI (NEONATI/TODDLER): Percorsi 100% accessibili in passeggino, ritmi calmi, pause nanna silenziose dopo pranzo, tappe brevi e molte sosta relax.";
  } else if (minAge <= 8) {
    agePacingInstruction = "PACING 4-8 ANNI (BAMBINI): Tappe interattive ed entusiasmanti ogni 45-60 minuti, area gioco o parco verde obbligatorio dopo il pranzo, pausa merenda con gelato.";
  } else {
    agePacingInstruction = "PACING 9-17 ANNI (RAGAZZI/TEEN): Attivit� dinamiche e fotografiche ad alto impatto, parchi avventura o tecnologia, spazio all'autonomia e curiosit� stimolanti.";
  }


  const prompt = `
    Sei il miglior Family Travel Agent & Scout di Esperienze al mondo con Verificatore di Fatti integrato. Scrivi in ${langName}.
    
    1. IL CLIENTE & PREFERENZE:
    - ${locationDescription}
    - DATA VIAGGIO ESATTA: ${prefs.selectedDate} (Verifica tassativamente il calendario per questo specifico weekend).
    - ${prefs.adults} Adulti, Bambini: ${childrenDescription}
    - Interessi specifici: ${prefs.interests || "Divertimento per famiglie"}
    - MOOD / VIBE SELEZIONATO: "${prefs.vibe || "Equilibrato"}"
    - ${verifiedEventHints}

    2. PACING ADATTIVO SULL'ET� DEI FIGLI (CRITICO):
    - ${agePacingInstruction}

    3. DIRETTIVE RIGOROSE SUI 12 MOOD:
    - Se MOOD = "surprise" / "Sorprendimi": Mischia attrazioni insolite, luoghi segreti poco noti, curiosit� storiche locali ed eventi inattesi.
    - Se MOOD = "nature" / "Natura": Privilegia parchi naturali, oasi WWF, fattorie didattiche, passeggiate nei boschi, percorsi fluviali e riserve.
    - Se MOOD = "culture" / "Cultura": Privilegia castelli monumentali, musei interattivi per bambini, borghi storici, parchi archeologici.
    - Se MOOD = "adventure" / "Avventura": Privilegia parchi avventura con percorsi sospesi, zip-line, labirinti di siepi, orienteering ed escursioni dinamiche.
    - Se MOOD = "magic" / "Fiabe & Magia": Privilegia boschi incantati, villaggi delle fiabe, castelli fiabeschi, spettacoli di magia e parchi tematici fantastici.
    - Se MOOD = "food" / "Cibo & Relax": Privilegia agriturismi tradizionali, trattorie a km zero con area giochi, picnic in vigneto o parchi e degustazioni family.
    - Se MOOD = "sport" / "Sport": Privilegia percorsi ciclabili family-friendly, noleggio risci�/bici, trekking leggeri panoramici e centri outdoor.
    - Se MOOD = "relax" / "Relax": Privilegia ritmi distesi, ampi parchi urbani fioriti, passeggiate panoramiche su lungolago/fiumi ed aree verde riposanti.
    - Se MOOD = "music" / "Musica": Privilegia musei della musica/suono, teatri all'aperto per ragazzi, eventi musicali e spettacoli interattivi.
    - Se MOOD = "beach" / "Mare": Privilegia spiagge a misura di bambino, lidi con parchi giochi sulla sabbia, passeggiate sul lungomare e gite in barca.
    - Se MOOD = "mountain" / "Montagna": Privilegia rifugi alpini accoglienti, malghe con animali, cabinovie panoramiche e sentieri montani facili per bimbi.
    - Se MOOD = "art" / "Arte": Privilegia musei d'arte con percorsi per ragazzi, parchi di sculture all'aperto, laboratori creativi e quartieri con street art.

    4. TIMELINE ORARIA, LOGISTICA E PARCHEGGI (ESPONENZIALE 10X):
    - Associa un'orario stimato a ciascuna tappa (es. "### 09:30 - 11:45 | Mattina: Visita a...").
    - Il ristorante del PRANZO deve trovarsi a MASSIMO 10-15 MINUTI D'AUTO o a piedi dalla tappa della MATTINA.
    - Specifica la stima dello spostamento (es. "?? Spostamento: 10 min in auto (3.5 km)").
    - Indica un **Parcheggio Reale Consigliato** vicino a ciascuna destinazione (es. "??? Parcheggio consigliato: Parcheggio Saba Piazza VIII Agosto").

    5. MICRO-MISSIONE PER BAMBINI (EXPLO_QUEST):
    - Per ogni attivit�, inserisci una breve caccia al tesoro o indovinello legato al luogo reale (es. "EXPLO_QUEST: Trova la fontana col leone e conta quante finestre ha il palazzo!").

    6. PROTOCOLLO ANTI-ALLUCINAZIONE & VERIFICA DATI:
    - NO ALLUCINAZIONI: � SEVERAMENTE VIETATO inventare nomi di luoghi, ristoranti o eventi non esistenti. Ogni luogo DEVE essere presente su Google Maps nel raggio di ${prefs.radiusKm} KM.
    - STRATEGIA LOGISTICA: ${strategyInstruction}
    ${previousPlanClause}

    7. REGOLE DI FORMATTAZIONE:
    - Usa Markdown.
    - Titoli attivit� con "### " e fascia oraria.
    - Nomi dei luoghi in "**Grassetto**" (Es: **Parco Sigurt�**)
    - Visual scene sotto i titoli: "VISUAL_SCENE: [Descrizione breve per immagine]"
    - GEO_LOCATION sotto la visual scene: "GEO_LOCATION: [Nome Reale Luogo, Citt�]"
    - EXPLO_QUEST sotto la GEO_LOCATION: "EXPLO_QUEST: [Indovinello/Caccia al tesoro]"

    ## Intro
    [Inspirational intro]
    GENERATE METEO_VISUAL for ${terms.sat} and ${terms.sun}. Format: DAY|MORNING_ICON|TEMP|AFTERNOON_ICON|TEMP|NIGHT_ICON|TEMP
    Example: ${terms.sat.toUpperCase()}|??|20�|?|22�|??|15�

    ${getDayPrompt(terms.sat, prefs.saturdayMode)}

    ${getDayPrompt(terms.sun, prefs.sundayMode)}

    ### DATA_MARKERS
    [MARKER: Lat, Lon, Titolo]
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
          model: 'gemini-3.5-flash-lite',
          contents: { parts: [{ text: prompt }] },
        });

        const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        if (!text || text.trim().length === 0) {
            throw new Error("L'IA non ha restituito testo. Riprova tra un istante.");
        }
        return { text, groundingChunks };
      } catch (error: any) {
        console.error("Gemini Plan Error:", error);
        if (error.message === 'API_KEY_REQUIRED' || error.message?.includes('API_KEY_REQUIRED') || error.message?.includes('API key') || error.message?.includes('API_KEY') || error.status === 400 || error.status === 403) {
            throw new Error("API_KEY_REQUIRED");
        }
        if (error.message?.includes("not found") || error.message?.includes("404") || error.status === 404) {
            console.warn("Retrying with gemini-3.5-flash-lite...");
            const fallbackRes = await ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: { parts: [{ text: prompt }] },
            });
            const text = fallbackRes.text || fallbackRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return { text, groundingChunks: [] };
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
                model: "gemini-3.5-flash-lite",
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
                model: 'gemini-3.5-flash-lite',
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
                model: "gemini-3.5-flash-lite",
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
                model: "gemini-3.5-flash-lite",
                contents: { parts: [{ text: `Il piano originale era: ${planText}. PIOVE! Trova 3 alternative al chiuso nelle vicinanze usando Google Maps.` }] },
                config: { tools: [{ googleMaps: {} }] }
            });
            return response.text || "Nessuna alternativa trovata.";
        } catch (error) { return "Errore nel trovare alternative."; }
    });
};

export const analyzeAvatarPhoto = async (base64: string, mimeType = 'image/jpeg'): Promise<any> => {
  const ai = getGenAIClient();
  try {
      const response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
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

export const generateFamilyMemberAvatar = async (description: string, role: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const seed = Math.floor(Math.random() * 1000000);
        const encoded = encodeURIComponent(description);

        const fetchWithTimeout = async (url: string, timeoutMs = 18000): Promise<string> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();

            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        // Tier 1: Pollinations Standard (18s timeout)
        try {
            return await fetchWithTimeout(`https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}`, 18000);
        } catch (e1) {
            console.warn("Pollinations Tier 1 failed, retrying with Turbo model...");
        }

        // Tier 2: Pollinations Turbo (18s timeout)
        try {
            return await fetchWithTimeout(`https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&model=turbo&seed=${seed + 1}`, 18000);
        } catch (e2) {
            console.warn("Pollinations Tier 2 failed, retrying with Flux model...");
        }

        // Tier 3: Pollinations Flux (18s timeout)
        try {
            return await fetchWithTimeout(`https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&model=flux&seed=${seed + 2}`, 18000);
        } catch (e3) {
            console.warn("Pollinations Tier 3 failed, retrying with alternative 3D engine...");
        }

        // Tier 4: Alternative 3D Pixar Avatar Fallback (Instant 200 OK)
        return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed + 99}`;
    });
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
    // 1. Try BigDataCloud reverse geocoding (instant, 200 OK)
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=it`, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision;
            if (city && city.trim().length > 0) {
                return city.trim();
            }
        }
    } catch(e) {}

    // 2. Try Nominatim OpenStreetMap reverse geocoding fallback
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
            if (city && city.trim().length > 0) {
                return city.trim();
            }
        }
    } catch(e) {}

    // 3. Try Gemini API fallback (gemini-3.6-flash)
    try {
        const ai = getGenAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: { parts: [{ text: `Identifica la citt� o comune per le coordinate: ${lat}, ${lon}. Ritorna SOLO il nome della citt� in italiano.` }] },
        });
        const name = response.text?.trim().replace(/^["']|["']$/g, '');
        if (name && name.length > 0 && !name.includes(",")) return name;
    } catch(e) {}

    return "La mia posizione";
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

export const swapSingleActivity = async (
  currentTitle: string,
  dayTitle: string,
  timeSlot: string,
  prefs: FamilyPreferences
): Promise<{ title: string; content: string; visualLine: string; geoLocation?: string }> => {
  const ai = getGenAIClient();
  const langName = getLanguageName(prefs.language);
  const locName = prefs.manualLocation || "Italia";

  const prompt = `
    Sei un Esperto Local Travel Scout per Famiglie. Scrivi in ${langName}.
    
    TASK: Sostituisci l'attivit� corrente con una NUOVA ATTIVIT� ALTERNATIVA REALE ed ENTUSIASMANTE.
    - ATTIVIT� DA SOSTITUIRE: "${currentTitle}"
    - GIORNO: ${dayTitle} (${timeSlot})
    - DESTINAZIONE / ZONA: ${locName} (Raggio: ${prefs.radiusKm} KM)
    - MOOD: ${prefs.vibe || "Equilibrato"}
    - ETA BAMBINI: ${prefs.children.map(c => c.age + ' anni').join(', ')}

    REGOLE RIGIDE:
    1. La nuova attivit� DEVE essere un luogo REALE ed esistente su Google Maps diverso da quello da sostituire.
    2. Mantieni lo stesso formato:
       ### [Fascia Oraria]: [Nome Reale Nuova Attivit�]
       VISUAL_SCENE: [Descrizione visiva breve]
       GEO_LOCATION: [Nome Reale Luogo, Citt�]
       [2-3 frasi coinvolgenti con dettagli pratici, parcheggio ed una sfida per i bambini]
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleMaps: {} }, { googleSearch: {} }] }
    });

    const text = response.text || "";
    const lines = text.trim().split('\n');
    const titleLine = lines.find(l => l.includes('###')) || `### ${timeSlot}: Nuova Attivit� a ${locName}`;
    const visualLine = lines.find(l => l.includes('VISUAL_SCENE:')) || "VISUAL_SCENE: Luogo panoramico";
    const geoLine = lines.find(l => l.includes('GEO_LOCATION:'));
    const content = lines.filter(l => !l.includes('###') && !l.includes('VISUAL_SCENE:') && !l.includes('GEO_LOCATION:')).join('\n').trim();

    const title = titleLine.replace(/###\s*/, '').trim();
    const geoLocation = geoLine ? geoLine.replace(/GEO_LOCATION:/i, '').trim() : `${title}, ${locName}`;

    return { title, content, visualLine, geoLocation };
  });
};

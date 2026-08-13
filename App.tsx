import React, { useState, useEffect, useRef, ReactNode, Component } from 'react';
import { PlannerForm } from './components/PlannerForm';
import { PlanResultDisplay } from './components/PlanResult';
import { SavedPlansList } from './components/SavedPlansList';
import { WorldMap } from './components/WorldMap';
import { CuriosityChat } from './components/CuriosityChat';
import { FamilyPreferences, PlanResult, SavedPlan, VisitedLocation, AvatarConfig } from './types';
import { generateWeekendPlan, getCityFromCoordinates, generateWelcomeAudio, decodeAudioData, decodePCM, getApiKey } from './services/geminiService';
import { safeLocalStorageSetItem } from './services/storageService';
import { Compass, AlertCircle, Layout, Star, Clock, PlayCircle, Map as MapIcon, Sparkles, Trophy, Menu, Languages, X, Download, Upload, Database, RefreshCw, Key, PlusCircle, Home as HomeIcon, Heart, Volume2, VolumeX, Lightbulb, ChevronUp, ShieldCheck, Scale, FileText, Info, ExternalLink } from 'lucide-react';

// --- LEGAL TEXTS ---
const LEGAL_CONTENT: Record<string, Record<string, { title: string, content: string }>> = {
    it: {
        privacy: {
            title: "Privacy Policy",
            content: `1. Titolare del Trattamento
L'applicazione FamilyWeekend AI è sviluppata e gestita come software "Client-Side". Non possediamo server centrali che raccolgono i tuoi dati. Per qualsiasi informazione legale, contattare lo sviluppatore.

2. Tipologia di Dati Raccolti
L'applicazione raccoglie ed elabora, esclusivamente su comando dell'utente, le seguenti tipologie di dati:
• Dati Familiari: Nomi di battesimo, età approssimativa dei figli, preferenze di viaggio.
• Dati di Posizione: Coordinate GPS (Latitudine/Longitudine) o città inserita manualmente.
• Dati Multimediali: Foto caricate per la generazione di Avatar o Video, registrazioni vocali per la funzione "Curiosity Chat".
• Dati Tecnici: Preferenze di lingua e impostazioni salvate localmente.

3. Modalità e Luogo del Trattamento (Local Storage)
• Archiviazione Locale: Tutti i dati personali inseriti (inclusi i piani salvati e le foto) vengono memorizzati esclusivamente nella memoria locale (localStorage) del dispositivo dell'utente. Lo sviluppatore non ha accesso, non vede e non conserva questi dati.
• Cancellazione: L'utente può cancellare tutti i dati in qualsiasi momento utilizzando il tasto "Ripristina App" nelle impostazioni o cancellando la cache del browser.

4. Servizi Terzi e Trasferimento Dati
Per fornire le funzionalità di intelligenza artificiale, l'app deve inviare i dati strettamente necessari a servizi terzi:
• Google Gemini API (Google LLC): Utilizzato per generare testi, itinerari, immagini, video e processare l'audio.
• Wikipedia API: Utilizzata per recuperare immagini pubbliche dei luoghi.
• Amazon Affiliates: L'app contiene link a prodotti su Amazon. Cliccando su questi link, Amazon potrebbe utilizzare cookie per tracciare l'acquisto.

5. Affiliazione Commerciale (Amazon)
FamilyWeekend AI partecipa al Programma Affiliazione Amazon EU, un programma di affiliazione che consente ai siti di percepire una commissione pubblicitaria pubblicizzando e fornendo link al sito Amazon.it. L'utente non sostiene costi aggiuntivi acquistando tramite questi link.

6. Permessi del Dispositivo
L'app potrebbe richiedere l'accesso a: Posizione (GPS), Microfono, Fotocamera/Galleria.

7. Tutela dei Minori
L'applicazione è uno strumento di supporto per i genitori. L'inserimento di nomi o foto di minori avviene sotto l'esclusiva responsabilità del genitore o tutore legale.`
        },
        terms: {
            title: "Termini d'Uso & Disclaimer",
            content: `IMPORTANTE: LEGGERE PRIMA DELL'USO

1. Natura dell'Intelligenza Artificiale
I contenuti, gli itinerari, i consigli di sicurezza e le informazioni meteo presenti in questa app sono generati da un sistema di Intelligenza Artificiale (Google Gemini). L'AI è soggetta ad "allucinazioni" e potrebbe fornire informazioni errate, obsolete o inventate.

2. Verifica Obbligatoria
L'utente è tenuto a verificare autonomamente orari di apertura, prezzi, condizioni meteorologiche e sicurezza dei luoghi suggeriti prima di intraprendere qualsiasi viaggio.

3. Esclusione di Responsabilità
Lo sviluppatore di FamilyWeekend AI non si assume alcuna responsabilità per danni a cose o persone, disagi, chiusure impreviste o spese sostenute derivanti dall'utilizzo delle informazioni fornite dall'applicazione. L'uso dell'app è a totale rischio dell'utente.

4. Sicurezza Stradale e Fisica
Le missioni e i giochi suggeriti devono essere svolti nel rispetto del codice della strada e del buon senso. Non lasciare mai i minori non sorvegliati.

5. Costi API
L'utente è responsabile per la gestione della propria Chiave API di Google Studio e degli eventuali costi associati al suo utilizzo.

6. Durata della Licenza (2 Anni)
L'acquisto dell'applicazione garantisce una licenza d'uso valida per la durata di 2 (due) anni dalla data di attivazione. Al termine di tale periodo, potrebbe essere richiesto un rinnovo o un nuovo acquisto per continuare ad utilizzare il servizio e accedere agli aggiornamenti.`
        }
    },
    en: {
        privacy: {
            title: "Privacy Policy",
            content: `1. Data Controller
FamilyWeekend AI is a "Client-Side" application. We do not have central servers that collect your data.

2. Data Collection
We collect strictly necessary data locally: Family names/ages, GPS location, Photos for avatars/videos, Audio for chat.

3. Local Storage
All personal data is stored exclusively in your device's Local Storage. The developer has no access to this data. You can clear it anytime via "Reset App".

4. Third Party Services
Data is sent to:
• Google Gemini API: For AI generation.
• Amazon Affiliates: We participate in the Amazon Associates Program.
• Wikipedia API: For public images.

5. Disclaimer
This app is for informational purposes. Always verify AI suggestions. The developer assumes no liability for errors or damages.`
        },
        terms: {
            title: "Terms of Use",
            content: `IMPORTANT: READ BEFORE USE

1. AI Nature
Content is generated by AI (Google Gemini) and may contain errors or hallucinations.

2. Mandatory Verification
User must verify opening hours, safety, and weather conditions independently.

3. Liability
The developer is not responsible for any damage, loss, or inconvenience resulting from the use of this app.

4. API Costs
User is responsible for managing their own Google AI Studio API Key and associated billing.

5. License Duration (2 Years)
The purchase of this application grants a user license valid for a period of 2 (two) years from the date of activation. Upon expiration of this period, a renewal or new purchase may be required to continue using the service and accessing updates.`
        }
    }
};

// --- LEGAL MODAL COMPONENT ---
const LegalModal: React.FC<{ type: 'privacy' | 'terms', lang: string, onClose: () => void }> = ({ type, lang, onClose }) => {
    const data = LEGAL_CONTENT[lang]?.[type] || LEGAL_CONTENT['it'][type];
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-serif font-black text-xl text-slate-800 flex items-center gap-2">
                        {type === 'privacy' ? <ShieldCheck className="w-5 h-5 text-indigo-500" /> : <Scale className="w-5 h-5 text-indigo-500" />}
                        {data.title}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto font-medium text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                    {data.content}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={onClose} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Ho capito</button>
                </div>
            </div>
        </div>
    );
};

// --- LOGO MONGOLFIERA ---
const BalloonLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10C33.4315 10 20 23.4315 20 40C20 54.3312 30.147 66.2995 43.6231 69.1912L41 85H59L56.3769 69.1912C69.853 66.2995 80 54.3312 80 40C80 23.4315 66.5685 10 50 10Z" className="fill-white stroke-indigo-200" strokeWidth="2" />
    <path d="M43.623 69.1912C43.623 69.1912 45.123 72.1912 50 72.1912C54.877 72.1912 56.377 69.1912 56.377 69.1912" className="stroke-indigo-300" strokeWidth="2" />
    <rect x="44" y="85" width="12" height="10" rx="2" className="fill-amber-600 stroke-amber-700" strokeWidth="1" />
    <path d="M30 20C35 15 45 15 50 15C55 15 65 15 70 20" className="stroke-white/40" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// --- LOGO MONGOLFIERA CUORE ---
const HeartBalloonLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 70C50 70 20 50 20 32C20 20 32 15 42 22C45 24 50 30 50 30C50 30 55 24 58 22C68 15 80 20 80 32C80 50 50 70 50 70Z" className="fill-indigo-50 stroke-indigo-600" strokeWidth="2" />
    <path d="M43 70L45 85H55L57 70" className="stroke-indigo-400" strokeWidth="1.5" />
    <rect x="44" y="85" width="12" height="6" rx="1" className="fill-amber-700" />
    <path d="M35 30C38 25 45 25 50 25C55 25 62 25 65 30" className="stroke-white/20" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// --- MASCOT TRICERATOPO (ADAPTIVE PIXAR EDITION) ---
const TriceratopsMascot: React.FC<{ className?: string; config?: AvatarConfig }> = ({ className, config }) => {
    const skinColors: Record<string, string[]> = {
        light: ['#f0f9ff', '#7dd3fc', '#0284c7'],
        medium: ['#fff7ed', '#fdba74', '#ea580c'],
        dark: ['#451a03', '#92400e', '#78350f'],
        pale: ['#f8fafc', '#94a3b8', '#475569']
    };

    const clothingColors: Record<string, string[]> = {
        red: ['#fee2e2', '#ef4444', '#991b1b'],
        blue: ['#dbeafe', '#3b82f6', '#1e3a8a'],
        green: ['#dcfce7', '#22c55e', '#14532d'],
        yellow: ['#fef9c3', '#eab308', '#854d0e'],
        purple: ['#f3e8ff', '#a855f7', '#581c87'],
        black: ['#f1f5f9', '#334155', '#0f172a'],
        white: ['#ffffff', '#f1f5f9', '#94a3b8'],
        orange: ['#ffedd5', '#f97316', '#7c2d12'],
        pink: ['#fce7f3', '#ec4899', '#831843'],
    };

    const eyeColors: Record<string, string[]> = {
        blue: ['#60a5fa', '#1e40af'],
        green: ['#34d399', '#065f46'],
        brown: ['#a16207', '#451a03'],
        black: ['#1e293b', '#000000']
    };

    const skin = skinColors[config?.skinColor || 'light'] || skinColors.light;
    const frill = clothingColors[config?.clothingColor || 'blue'] || clothingColors.blue;
    const eyes = eyeColors[config?.eyeStyle || 'brown'] || eyeColors.brown;

    return (
        <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="dynamicSkin" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={skin[0]} />
                    <stop offset="50%" stopColor={skin[1]} />
                    <stop offset="100%" stopColor={skin[2]} />
                </radialGradient>
                <radialGradient id="dynamicFrill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={frill[0]} />
                    <stop offset="60%" stopColor={frill[1]} />
                    <stop offset="100%" stopColor={frill[2]} />
                </radialGradient>
                <radialGradient id="dynamicIris" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={eyes[0]} />
                    <stop offset="100%" stopColor={eyes[1]} />
                </radialGradient>
                <linearGradient id="pixarHorn" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="80%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <filter id="pixarShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                    <feOffset dx="0" dy="8" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <ellipse cx="100" cy="188" rx="65" ry="10" fill="#000" opacity="0.08" />
            <g filter="url(#pixarShadow)">
                <path d="M25,110 C25,30 175,30 175,110 L100,118 Z" fill="url(#dynamicFrill)" />
                <circle cx="45" cy="70" r="10" fill="white" opacity="0.15" />
                <circle cx="100" cy="45" r="12" fill="white" opacity="0.15" />
                <circle cx="155" cy="70" r="10" fill="white" opacity="0.15" />
            </g>
            <g filter="url(#pixarShadow)">
                <path d="M45,115 C45,60 155,60 155,115 C155,175 115,190 100,190 C85,190 45,175 45,115" fill="url(#dynamicSkin)" />
                <circle cx="68" cy="155" r="2.5" fill="black" opacity="0.04" />
                <circle cx="132" cy="155" r="3" fill="black" opacity="0.04" />
                <circle cx="100" cy="175" r="2" fill="black" opacity="0.04" />
                <ellipse cx="100" cy="88" rx="35" ry="18" fill="white" opacity="0.12" />
            </g>
            <g filter="url(#pixarShadow)">
                <path d="M72,82 Q62,15 48,35 Q65,75 82,82" fill="url(#pixarHorn)" />
                <path d="M128,82 Q138,15 152,35 Q135,75 118,82" fill="url(#pixarHorn)" />
                <path d="M100,138 Q106,98 118,118 Q112,145 100,145" fill="url(#pixarHorn)" />
            </g>
            <g transform="translate(72, 115)">
                <circle r="19" fill="white" />
                <circle r="13" fill="url(#dynamicIris)" />
                <circle r="7" fill="black" />
                <circle cx="-5" cy="-6" r="6" fill="white" opacity="0.9" />
                <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.3" />
            </g>
            <g transform="translate(128, 115)">
                <circle r="19" fill="white" />
                <circle r="13" fill="url(#dynamicIris)" />
                <circle r="7" fill="black" />
                <circle cx="-5" cy="-6" r="6" fill="white" opacity="0.9" />
                <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.3" />
            </g>
            {config?.accessory && config.accessory !== 'none' && (
                <g stroke={config.accessory === 'sunglasses' ? '#0f172a' : '#334155'} strokeWidth="4.5" fill={config.accessory === 'sunglasses' ? '#0f172a' : 'none'} opacity="0.95">
                    {config.accessory === 'round' || config.accessory === 'sunglasses' ? (
                        <>
                            <circle cx="72" cy="115" r="23" />
                            <circle cx="128" cy="115" r="23" />
                            <path d="M95,115 L105,115" />
                        </>
                    ) : (
                        <>
                            <rect x="48" y="94" width="46" height="42" rx="10" />
                            <rect x="106" y="94" width="46" height="42" rx="10" />
                            <path d="M94,115 L106,115" />
                        </>
                    )}
                </g>
            )}
            <circle cx="60" cy="145" r="14" fill="#fecaca" opacity="0.35" />
            <circle cx="140" cy="145" r="14" fill="#fecaca" opacity="0.35" />
            <path d="M82,160 Q100,178 118,160" fill="none" stroke="#000" opacity="0.25" strokeWidth="5" strokeLinecap="round" />
        </svg>
    );
};

// --- ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

// Fix: Inherit from Component directly to ensure props and state types are correctly recognized by the compiler.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(_: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRITICAL APP ERROR:", error, errorInfo);
  }

  handleReset = () => {
      if(window.confirm("Sei sicuro? Questo cancellerà tutti i dati salvati per ripristinare l'app.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-md w-full">
                <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Ops! Qualcosa non va.</h1>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">Si è verificato un errore critico nei dati salvati. Clicca qui sotto per resettare l'app.</p>
                <button onClick={this.handleReset} className="w-full bg-rose-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Ripara Tutto (Reset)
                </button>
            </div>
        </div>
      );
    }
    return this.props.children || null;
  }
}

// --- UTILS ---
const extractMarkers = (text: string): VisitedLocation[] => {
    const markers: VisitedLocation[] = [];
    const regex = /MARKER:\s*\*?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(.*?)\*?$/gim;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const titleClean = match[3].replace(/\*\*/g, '').replace(/\]$/, '').trim();
        if (titleClean) {
            markers.push({
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                title: titleClean
            });
        }
    }
    return markers;
};

const TRANSLATIONS: any = {
    it: {
        start_badge: 'Pronti a partire?', hero_title_1: 'Pianifica la tua', hero_title_2: 'Prossima Avventura', hero_desc: "Configura la tua famiglia e crea il weekend perfetto in pochi secondi.",
        home_claim: 'Costruiamo ricordi insieme', create_video: 'Crea Video', 
        planner: 'Home', active: 'In Corso', favorites: 'Preferiti', history: 'Ricordi', map: 'Mappa',
        who_participates: 'Chi Partecipa?', adults: 'Adulti', name_placeholder: 'Nome', age_placeholder: 'Presunto', add_child: 'Aggiungi Bambino',
        where_to_go: 'Dove si va?', city_placeholder: 'Città di partenza', radius: 'Raggio',
        when: 'Quando?', saturday: 'Sabato', sunday: 'Domenica', full_day: 'Tutto', morning: 'Mattina', afternoon: 'Pom.', rest: 'Riposo',
        hotel_search: 'Cerchiamo un hotel per la notte?',
        mood_title: 'Mood & Passioni', vibe_surprise: 'Sorprendimi', vibe_nature: 'Natura', vibe_culture: 'Cultura', vibe_adventure: 'Avventura', vibe_magic: 'Fiabe', vibe_food: 'Cibo',
        interests_placeholder: 'Interessi specifici (es. dinosauri, treni...)',
        generate_button: 'Genera Piano', generating: 'Creo l\'itinerario...',
        ready_itinerary: 'Itinerario Pronto', regenerate: 'Rigenera', favorite_all: 'Preferito Tutto', save_all: 'Salva Tutto',
        weather: 'Previsioni Meteo', favorite_day: 'Preferito', save_active: 'Salva Attivo', missions: 'Missioni', story: 'Favola',
        budget: 'Budget', transport: 'Trasporti', backpack: 'Zaino',
        lunch: 'Pranzo', dinner: 'Cena', overnight: 'Notte', info: 'Info',
        image_real: 'Foto Luogo', image_stock: 'Ispirazione',
        in_progress: 'In Corso', favorite: 'Preferito', completed: 'Completato', rain_alert: 'Allerta Meteo: Pioggia!', rain_alternatives: 'Trova Alternative',
        click_expand: 'Clicca per vedere tutto...', hide: 'Nascondi', view_all: 'Vedi Tutto',
        guide_live: 'Guida Live', guide_virtual: 'Guida Virtuale', assistant: 'Assistant', ask_advice: 'Chiedi consiglio...',
        audio_title: 'Si parte per', audio_desc: 'Vuoi ascoltare una storie su questo posto?',
        creating_audio: 'Creo Podcast', listen_now: 'Ascolta Ora', listen_later: 'Dopo',
        map_empty: 'Mappa Vuota', map_instruction: 'Pianifica una gita per vedere le destinazioni!',
        settings: 'Opzioni', app_language: 'Lingua', export_data: 'Esporta Dati', import_data: 'Importa Dati',
        level_novice: 'Novellino', level_explorer: 'Esploratore', level_hunter: 'Cacciatore', level_commander: 'Comandante', level_legend: 'Leggenda',
        mission_subtitle: 'Guadagna stelle', story_subtitle: 'Storia del viaggio', no_plans: 'Nessuna avventura qui.',
        im_curious: 'Sono curioso', show_menu: 'Mostra Menu', 
        privacy_policy: "Privacy Policy", terms_of_use: "Termini d'Uso", change_key: "Cambia Chiave API", reset_app: "Ripristina App",
        reactivate: "Riattiva", share: "Condividi",
        verify_disclaimer: "⚠️ Verifica sempre orari, disponibilità e condizioni dei luoghi prima di metterti in viaggio."
    },
    en: {
        start_badge: 'Ready?', hero_title_1: 'Plan your', hero_title_2: 'Next Adventure', hero_desc: "Configure your family and create the perfect weekend.",
        home_claim: 'Let\'s build memories together', create_video: 'Create Video',
        planner: 'Home', active: 'Active', favorites: 'Favorites', history: 'Memories', map: 'Map',
        who_participates: 'Who participates?', adults: 'Adults', name_placeholder: 'Name', age_placeholder: 'Age', add_child: 'Add Child',
        where_to_go: 'Where to?', city_placeholder: 'Start city', radius: 'Radius',
        when: 'When?', saturday: 'Saturday', sunday: 'Sunday', full_day: 'Full Day', morning: 'Morning', afternoon: 'Afternoon', rest: 'Rest',
        hotel_search: 'Hotel?',
        mood_title: 'Mood', vibe_surprise: 'Surprise Me', vibe_nature: 'Nature', vibe_culture: 'Culture', vibe_adventure: 'Adventure', vibe_magic: 'Magic', vibe_food: 'Food',
        interests_placeholder: 'Specific interests...',
        generate_button: 'Generate Plan', generating: 'Creating...',
        ready_itinerary: 'Ready', regenerate: 'Regenerate', favorite_all: 'Favorite All', save_all: 'Save All',
        weather: 'Weather', favorite_day: 'Favorite', save_active: 'Save Active', missions: 'Missions', story: 'Story',
        budget: 'Budget', transport: 'Transport', backpack: 'Backpack',
        lunch: 'Lunch', dinner: 'Dinner', overnight: 'Overnight', info: 'Info',
        image_real: 'Real Photo', image_stock: 'Ispirazione',
        in_progress: 'In Progress', favorite: 'Favorite', completed: 'Completed', rain_alert: 'Rain Alert!', rain_alternatives: 'Indoor alternatives',
        click_expand: 'Click to expand...', hide: 'Hide', view_all: 'View All',
        guide_live: 'Live Guide', guide_virtual: 'Virtual Guide', assistant: 'Assistant', ask_advice: 'Ask advice...',
        audio_title: 'Going to', audio_desc: 'Listen to a story?',
        creating_audio: 'Creating...', listen_now: 'Listen Now', listen_later: 'Later',
        map_empty: 'Empty Map', map_instruction: 'Plan a trip to see markers!',
        settings: 'Settings', app_language: 'Language', export_data: 'Export Data', import_data: 'Importa Dati',
        level_novice: 'Novice', level_explorer: 'Explorer', level_hunter: 'Hunter', level_commander: 'Commander', level_legend: 'Legend',
        mission_subtitle: 'Earn stars', story_subtitle: 'Trip story', no_plans: 'No adventures yet.',
        im_curious: "I'm curious", show_menu: 'Show Menu',
        privacy_policy: "Privacy Policy", terms_of_use: "Terms of Use", change_key: "Change API Key", reset_app: "Reset App",
        reactivate: "Reactivate", share: "Share",
        verify_disclaimer: "⚠️ Always verify opening hours, availability and safety before leaving."
    },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planner' | 'active' | 'favorites' | 'history' | 'map'>('planner');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCuriousOpen, setIsCuriousOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [appLanguage, setAppLanguage] = useState<string>('it');
  const [isWelcomePlaying, setIsWelcomePlaying] = useState(false);
  const [showMenuForce, setShowMenuForce] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const getNextSaturday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
    return d.toISOString().split('T')[0];
  };

  const [preferences, setPreferences] = useState<FamilyPreferences>({
    adults: 2,
    adultsData: [{ id: '1', role: '' }, { id: '2', role: '' }],
    children: [{name: '', age: ''}], 
    radiusKm: 30,
    interests: '',
    latitude: null,
    longitude: null,
    manualLocation: '',
    specificDestination: '',
    saturdayMode: 'full_day',
    sundayMode: 'full_day',
    overnightStay: false,
    selectedDate: getNextSaturday(),
    vibe: '',
    language: 'it'
  });

  useEffect(() => {
     setPreferences(prev => ({ ...prev, language: appLanguage }));
  }, [appLanguage]);

  const playWelcomeAudio = async () => {
    try {
        const audioBase64 = await generateWelcomeAudio();
        if(!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        const ctx = audioContextRef.current;
        // Fix Bug 4: Autoplay Policy - Only resume if suspended and handle errors gracefully
        if(ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch(e) {
                console.warn("Autoplay blocked. User interaction needed.");
                return; // Exit if we can't resume
            }
        }
        
        const buffer = await decodeAudioData(decodePCM(audioBase64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsWelcomePlaying(false);
        
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
        }
        audioSourceRef.current = source;
        setIsWelcomePlaying(true);
        source.start();
    } catch (e) {
        console.warn("Welcome audio skipped (autoplay/network):", e);
    }
  };

  // FIX Mobile Safari: Audio viene avviato SOLO al tocco dell'utente sulla mascotte
  useEffect(() => {
    return () => {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
        }
    };
  }, []);

  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('familyWeekendPlans');
    if (stored) {
      try {
        const rawPlans = JSON.parse(stored);
        if (Array.isArray(rawPlans)) setSavedPlans(rawPlans);
      } catch (e) { console.error("Failed plans load", e); }
    }
    const storedLang = localStorage.getItem('appLanguage');
    if (storedLang) setAppLanguage(storedLang);
    const storedPrefs = localStorage.getItem('familyPreferences');
    if (storedPrefs) {
        try { setPreferences(JSON.parse(storedPrefs)); } catch (e) { console.error("Failed preferences load", e); }
    }
    if (!preferences.manualLocation && !preferences.latitude) getLocation();
  }, []);

  useEffect(() => {
    if (savedPlans.length > 0) {
        safeLocalStorageSetItem('familyWeekendPlans', JSON.stringify(savedPlans)); 
    }
  }, [savedPlans]);

  useEffect(() => {
    safeLocalStorageSetItem('familyPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const getLocation = () => {
    setLocationError(null);
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError("GPS non supportato.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setPreferences(prev => ({ ...prev, latitude: lat, longitude: lon }));
        const cityName = await getCityFromCoordinates(lat, lon);
        setPreferences(prev => ({ ...prev, manualLocation: cityName || `${lat.toFixed(4)}, ${lon.toFixed(4)}` }));
        setIsLocating(false);
      },
      (err) => { setIsLocating(false); setLocationError("GPS Error."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlanGeneration = async (avoidText?: string) => {
    // Fallback automatico per i nomi degli adulti non compilati
    const updatedAdultsData = (preferences.adultsData || []).map((a, idx) => ({
      ...a,
      role: (a && a.role && a.role.trim().length > 0) ? a.role.trim() : `Adulto ${idx + 1}`
    }));
    
    setPreferences(prev => ({ ...prev, adultsData: updatedAdultsData }));
    setError(null);
    setLocationError(null);
    setLoading(true);
    setPlan(null);
    try {
      const result = await generateWeekendPlan({ ...preferences, adultsData: updatedAdultsData }, avoidText);
      setPlan(result);
      setShowMenuForce(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } catch (err: any) {
        if (err.message === 'API_KEY_REQUIRED' || err.message?.includes('API_KEY_REQUIRED') || err.message?.includes('API key not valid')) {
            setError("⚠️ Chiave API Gemini richiesta. Inserisci la tua API Key personalizzata nel menu Impostazioni (icona menu in alto a destra).");
        } else {
            setError(err.message || "API Error.");
        }
    } finally { setLoading(false); }
  };

  const handleSavePlan = (isFavorite: boolean) => {
    if (!plan || isSaving) return;
    
    setIsSaving(true);
    const existingIndex = savedPlans.findIndex(p => p.text === plan.text);
    
    if (existingIndex !== -1) {
      // Aggiorna lo stato del piano esistente senza creare duplicati
      setSavedPlans(prev => prev.map((p, idx) => idx === existingIndex ? { ...p, isFavorite } : p));
    } else {
      // Crea un nuovo piano salvato
      const markers = extractMarkers(plan.text);
      const newSavedPlan: SavedPlan = {
        ...plan,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateCreated: Date.now(),
        title: `Weekend ${new Date(preferences.selectedDate).toLocaleDateString()}`,
        isFavorite,
        isCompleted: false, 
        completedSections: [],
        hiddenSections: [],
        savedChildren: preferences.children,
        adultsData: preferences.adultsData,
        language: preferences.language,
        visitedLocations: markers,
        latitude: preferences.latitude,
        longitude: preferences.longitude,
        missionScores: [],
        packedItems: []
      };
      setSavedPlans(prev => [newSavedPlan, ...prev]);
    }

    setTimeout(() => { 
        setIsSaving(false); 
        setPlan(null); 
        setActiveTab(isFavorite ? 'favorites' : 'active'); 
    }, 500);
  };

  const handleMoveToActive = (id: string) => {
      setSavedPlans(prev => prev.map(p => {
          if (p.id === id) {
              return { ...p, isFavorite: false, isCompleted: false };
          }
          return p;
      }));
      setActiveTab('active');
  };

  const resetPlanner = () => {
    setPlan(null);
    setActiveTab('planner');
    setShowMenuForce(false);
  };

  const handleExportData = () => {
    const data = {
        plans: savedPlans,
        preferences: preferences,
        unlockedLocations: localStorage.getItem('unlockedLocations') ? JSON.parse(localStorage.getItem('unlockedLocations')!) : [],
        version: "3.9"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const iurl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = iurl;
    a.download = `family_weekend_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(iurl);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.plans) setSavedPlans(data.plans);
            if (data.preferences) setPreferences(data.preferences);
            if (data.unlockedLocations) localStorage.setItem('unlockedLocations', JSON.stringify(data.unlockedLocations));
            alert("Dati importati con successo!");
            window.location.reload();
        } catch (err) {
            alert("Errore nell'importazione: file non valido.");
        }
    };
    reader.readAsText(file);
  };

  const handleToggleMission = (planId: string, missionText: string, childName: string, score: number) => {
      setSavedPlans(prev => prev.map(p => {
          if (p.id !== planId) return p;
          const currentScores = p.missionScores || [];
          const existingIdx = currentScores.findIndex(s => s.mission === missionText && s.childName === childName);
          let newScores = [...currentScores];
          if (existingIdx !== -1) {
              if (currentScores[existingIdx].score === score) {
                  newScores = newScores.filter((_, i) => i !== existingIdx);
              } else {
                  newScores[existingIdx] = { ...newScores[existingIdx], score };
              }
          } else {
              newScores.push({ mission: missionText, childName, score });
          }
          return { ...p, missionScores: newScores };
      }));
  };

  const handleTogglePacking = (planId: string, itemText: string) => {
      setSavedPlans(prev => prev.map(p => {
          if (p.id !== planId) return p;
          const current = p.packedItems || [];
          const newItems = current.includes(itemText) ? current.filter(i => i !== itemText) : [...current, itemText];
          return { ...p, packedItems: newItems };
      }));
  };

  const t = TRANSLATIONS[appLanguage] || TRANSLATIONS['it'];

  const tabList = [
    { id: 'planner', icon: HomeIcon, label: t.planner },
    { id: 'active', icon: PlayCircle, label: t.active },
    { id: 'favorites', icon: Star, label: t.favorites },
    { id: 'history', icon: Trophy, label: t.history },
    { id: 'map', icon: MapIcon, label: t.map },
  ];

  const updatePlanInStorage = (updatedPlan: SavedPlan) => {
      setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const isFormActive = activeTab === 'planner' && !plan && !showMenuForce;

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans pb-40">
      {isCuriousOpen && <CuriosityChat onClose={() => setIsCuriousOpen(false)} t={t} />}
      {legalModal && <LegalModal type={legalModal} lang={appLanguage} onClose={() => setLegalModal(null)} />}
      
      <header className="sticky top-0 z-50 bg-[#4c1d95] backdrop-blur-md border-b border-indigo-900/50 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <HeartBalloonLogo className="w-8 h-8" />
            </div>
            <div>
                <h1 className="font-serif font-black text-2xl tracking-tight text-white leading-none">FAMILY WEEKEND</h1>
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-200 uppercase">AI Smart Planner</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/10">
                {tabList.map((tab) => (
                    <button 
                        key={tab.id} 
                        onClick={() => tab.id === 'planner' ? resetPlanner() : setActiveTab(tab.id as any)} 
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-indigo-100 hover:text-white hover:bg-white/5'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-700' : 'text-current'}`} />
                        <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><Menu className="w-6 h-6" /></button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {activeTab === 'planner' && (
            <div className="animate-fade-in-up">
                {!plan ? (
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10 mt-6 relative">
                            <HeartBalloonLogo className="w-20 h-20 mx-auto mb-4 drop-shadow-xl" />
                            <h2 className="font-serif font-black text-4xl md:text-5xl text-slate-900 mb-4 leading-tight">{t.hero_title_1} <br/><span className="text-indigo-600">{t.hero_title_2}</span></h2>
                            
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-slate-600 text-xl max-w-lg mx-auto leading-relaxed font-bold">{t.home_claim}</p>
                                
                                <div className="relative group w-64 h-64 sm:w-80 sm:h-80 mb-6">
                                    <div className={`absolute inset-0 bg-indigo-400 rounded-full blur-[80px] transition-all duration-1000 ${isWelcomePlaying ? 'opacity-80 scale-125 animate-pulse' : 'opacity-20 scale-100'}`}></div>
                                    <div className={`absolute inset-0 bg-white rounded-full blur-[40px] transition-all duration-700 ${isWelcomePlaying ? 'opacity-50 scale-110' : 'opacity-0'}`}></div>
                                    
                                    <button onClick={playWelcomeAudio} className="relative w-full h-full rounded-full border-[12px] border-white shadow-[0_30px_70px_-15px_rgba(3,105,161,0.4)] overflow-hidden bg-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 group/mascot">
                                        <TriceratopsMascot 
                                          className={`w-full h-full p-4 transition-transform duration-700 group-hover/mascot:scale-110 ${isWelcomePlaying ? 'animate-bounce-slow' : ''}`} 
                                          config={preferences.adultsData?.[0]?.avatarConfig}
                                        />
                                        
                                        {isWelcomePlaying && (
                                            <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center pointer-events-none">
                                                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl border-4 border-indigo-100">
                                                    <Volume2 className="w-10 h-10 text-indigo-600 animate-bounce" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-6 right-1/2 translate-x-1/2 bg-indigo-600 px-6 py-2 rounded-full shadow-2xl opacity-0 group-hover/mascot:opacity-100 transition-opacity flex items-center gap-2 border border-white/30 backdrop-blur-md">
                                            <Volume2 className="w-4 h-4 text-white" />
                                            <span className="text-[11px] text-white font-black uppercase tracking-[0.2em]">Ascoltami</span>
                                        </div>
                                    </button>
                                    
                                    {!isWelcomePlaying && (
                                        <div className="absolute -top-6 -right-12 bg-white px-6 py-4 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border-4 border-indigo-100 text-[13px] font-black uppercase tracking-wider text-indigo-700 animate-bounce-slow z-20 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                                            "Ehi, cliccami!"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PlannerForm preferences={preferences} setPreferences={setPreferences} onSubmit={() => handlePlanGeneration()} isLoading={loading} onLocate={getLocation} isLocating={isLocating} locationError={locationError} t={t} />
                    </div>
                ) : (
                    <PlanResultDisplay plan={plan} preferences={preferences} onRegenerate={() => handlePlanGeneration(plan.text)} onSaveFavorite={() => handleSavePlan(true)} onMarkComplete={() => handleSavePlan(false)} isSaving={isSaving} t={t} />
                )}
                {error && <div className="mt-8 bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-6 py-4 rounded-r-xl flex items-center max-w-2xl mx-auto shadow-sm animate-pulse"><AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" /><span className="font-medium">{error}</span></div>}
            </div>
        )}
        {activeTab === 'active' && <SavedPlansList plans={savedPlans.filter(p => !p.isFavorite && !p.isCompleted)} type="active" onDelete={id => setSavedPlans(prev => prev.filter(p => p.id !== id))} onRate={(id, r, day) => {
            setSavedPlans(prev => prev.map(p => {
                if (p.id !== id) return p;
                const currentCompleted = p.completedSections || [];
                const newCompleted = day ? [...currentCompleted, day] : currentCompleted;
                const isFinal = day ? (newCompleted.length >= 2) : true;
                return {...p, rating: r, completedSections: newCompleted, isCompleted: isFinal};
            }));
        }} onToggleMission={handleToggleMission} onTogglePacking={handleTogglePacking} onUpdatePlan={updatePlanInStorage} t={t} />}
        {activeTab === 'favorites' && <SavedPlansList plans={savedPlans.filter(p => p.isFavorite)} type="favorites" onDelete={id => setSavedPlans(prev => prev.filter(p => p.id !== id))} onMoveToActive={handleMoveToActive} onToggleMission={handleToggleMission} onTogglePacking={handleTogglePacking} onUpdatePlan={updatePlanInStorage} t={t} />}
        {activeTab === 'map' && <div className="h-[calc(100vh-160px)] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-50"><WorldMap plans={savedPlans} t={t} /></div>}
        {activeTab === 'history' && <SavedPlansList plans={savedPlans.filter(p => p.isCompleted)} type="history" onDelete={id => setSavedPlans(prev => prev.filter(p => p.id !== id))} onMoveToActive={handleMoveToActive} onToggleMission={handleToggleMission} onTogglePacking={handleTogglePacking} onUpdatePlan={updatePlanInStorage} t={t} />}
      </main>

      {!isFormActive ? (
      <div className="fixed bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-3 pointer-events-none z-50 animate-fade-in">
         <div className="pointer-events-auto w-full max-w-[calc(100vw-3rem)] bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-2 flex justify-around items-center border border-slate-200">
            {tabList.map((tab) => (
                <button 
                    key={tab.id} 
                    onClick={() => tab.id === 'planner' ? resetPlanner() : setActiveTab(tab.id as any)} 
                    className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}  />
                    <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
                </button>
            ))}
         </div>

         <button 
            onClick={() => setIsCuriousOpen(true)}
            className="pointer-events-auto w-full max-w-[calc(100vw-3rem)] py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-shift text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_40px_-5px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 active:scale-95 transition-all border-t border-white/20"
         >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            {t.im_curious}
         </button>
      </div>
      ) : (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
              <button 
                onClick={() => setShowMenuForce(true)}
                className="bg-slate-900/40 backdrop-blur-md text-white/70 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2 hover:bg-slate-900/60 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg"
              >
                  <ChevronUp className="w-3 h-3" /> {t.show_menu}
              </button>
          </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
            animation: gradient-shift 3s ease infinite;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />

      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsSettingsOpen(false)}></div>
              <div className="relative bg-white rounded-[2.5rem] p-8 w-80 shadow-2xl animate-fade-in-up border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                      <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">{t.settings}</span>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t.app_language}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[{code:'it', flag:'🇮🇹'}, {code:'en', flag:'🇬🇧'}, {code:'es', flag:'🇪🇸'}, {code:'de', flag:'🇩🇪'}].map(lang => (
                                <button key={lang.code} onClick={() => { setAppLanguage(lang.code); }} className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${appLanguage === lang.code ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}><span>{lang.flag}</span> {lang.code.toUpperCase()}</button>
                            ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">API & Billing</label>
                        <div className="space-y-3">
                            <div>
                                <input 
                                    type="password" 
                                    placeholder="Inserisci Gemini API Key" 
                                    defaultValue={getApiKey()}
                                    onChange={(e) => {
                                        const key = e.target.value.trim();
                                        if (key) {
                                            localStorage.setItem('user_gemini_api_key', key);
                                        } else {
                                            localStorage.removeItem('user_gemini_api_key');
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                                />
                                <span className="text-[9px] text-slate-400 mt-1 block">Salvata nel LocalStorage del dispositivo.</span>
                            </div>
                            <button onClick={() => (window as any).aistudio?.openSelectKey()} className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold text-xs border border-slate-100 hover:bg-slate-100 transition-colors">
                                <Key className="w-4 h-4 text-indigo-500"/> {t.change_key} (AI Studio)
                            </button>
                             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs border border-amber-100 hover:bg-amber-100 transition-colors">
                                <Info className="w-4 h-4" /> Info Fatturazione Google
                            </a>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Backup & Dati</label>
                        <div className="space-y-2">
                            <button onClick={handleExportData} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 hover:bg-slate-100 transition-colors">
                                <Download className="w-4 h-4 text-indigo-500"/> {t.export_data}
                            </button>
                            <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
                            <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 hover:bg-slate-100 transition-colors">
                                <Upload className="w-4 h-4 text-indigo-500"/> {t.import_data}
                            </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Sistema</label>
                        <div className="space-y-2">
                            <button onClick={() => { if(window.confirm(t.reset_app + "?")) { localStorage.clear(); window.location.reload(); } }} className="w-full flex items-center gap-3 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm border border-rose-100 hover:bg-rose-100 transition-colors">
                                <RefreshCw className="w-5 h-5" /> {t.reset_app}
                            </button>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <div className="flex flex-col gap-2">
                              <button onClick={() => setLegalModal('privacy')} className="text-left text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3" /> {t.privacy_policy}
                              </button>
                              <button onClick={() => setLegalModal('terms')} className="text-left text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
                                  <FileText className="w-3 h-3" /> {t.terms_of_use}
                              </button>
                          </div>
                          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 text-center">FamilyWeekend v3.9 • AI Engine</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
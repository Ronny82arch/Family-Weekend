
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Navigation, Heart, Crosshair, Plus, Trash2, User, Loader2, CalendarDays, Sun, Sunrise, Sunset, Ban, Minus, Settings2, Target, BedDouble, Calendar, Sparkles, AlertCircle, Check, Smile, X, Edit2, Wand2, Shirt, Palette, Glasses, Laugh, Camera, RefreshCw, Upload, ScanFace, Scissors, ZoomIn, ZoomOut, Move, RotateCcw, HardHat, Crown, Zap } from 'lucide-react';
import { FamilyPreferences, Child, TimeSlot, AdultData, AvatarConfig } from '../types';
import { generateFamilyMemberAvatar, analyzeAvatarPhoto } from '../services/geminiService';

// --- LOCALIZATION DICTIONARY FOR AVATAR ---
const AVATAR_LABELS: any = {
    it: {
        male: 'Lui', female: 'Lei', short: 'Corti', long: 'Lunghi', bald: 'Rasati', spiky: 'Sparati', bun: 'Chignon', braids: 'Treccine',
        straight: 'Lisci', wavy: 'Mossi', curly: 'Ricci', afro: 'Afro', blonde: 'Biondi', brown: 'Castani', black: 'Neri', red: 'Rossi', gray: 'Grigi', pink: 'Rosa', white: 'Bianchi',
        light: 'Chiara', medium: 'Media', dark: 'Scura', pale: 'Pallida', blue: 'Blu', green: 'Verdi', none: 'No', round: 'Tondi', sunglasses: 'Sole', square: 'Smart',
        cap: 'Berretto', beanie: 'Lana', hat: 'Cappello', crown: 'Corona', tshirt: 'T-Shirt', hoodie: 'Felpa', dress: 'Elegante', shirt: 'Camicia', jacket: 'Giacca',
        orange: 'Arancio', yellow: 'Giallo', purple: 'Viola', outfit: 'Outfit', face: 'Viso & Accessori', hair: 'Capelli'
    },
    en: {
        male: 'He', female: 'She', short: 'Short', long: 'Long', bald: 'Bald', spiky: 'Spiky', bun: 'Bun', braids: 'Braids',
        straight: 'Straight', wavy: 'Wavy', curly: 'Curly', afro: 'Afro', blonde: 'Blonde', brown: 'Brown', black: 'Black', red: 'Red', gray: 'Gray', pink: 'Pink', white: 'White',
        light: 'Light', medium: 'Medium', dark: 'Dark', pale: 'Pale', blue: 'Blue', green: 'Green', none: 'None', round: 'Round', sunglasses: 'Sun', square: 'Smart',
        cap: 'Cap', beanie: 'Beanie', hat: 'Hat', crown: 'Crown', tshirt: 'T-Shirt', hoodie: 'Hoodie', dress: 'Dress', shirt: 'Shirt', jacket: 'Jacket',
        orange: 'Orange', yellow: 'Yellow', purple: 'Purple', outfit: 'Outfit', face: 'Face & Accessories', hair: 'Hair'
    },
    es: {
        male: 'Él', female: 'Ella', short: 'Corto', long: 'Largo', bald: 'Calvo', spiky: 'Punta', bun: 'Moño', braids: 'Trenzas',
        straight: 'Liso', wavy: 'Ondulado', curly: 'Rizado', afro: 'Afro', blonde: 'Rubio', brown: 'Castaño', black: 'Negro', red: 'Rojo', gray: 'Gris', pink: 'Rosa', white: 'Blanco',
        light: 'Clara', medium: 'Media', dark: 'Oscura', pale: 'Pálida', blue: 'Azul', green: 'Verde', none: 'Nada', round: 'Redondas', sunglasses: 'Sol', square: 'Smart',
        cap: 'Gorra', beanie: 'Lana', hat: 'Sombrero', crown: 'Corona', tshirt: 'Camiseta', hoodie: 'Sudadera', dress: 'Vestido', shirt: 'Camisa', jacket: 'Chaqueta',
        orange: 'Naranja', yellow: 'Amarillo', purple: 'Morado', outfit: 'Atuendo', face: 'Cara y Accesorios', hair: 'Cabello'
    },
    de: {
        male: 'Er', female: 'Sie', short: 'Kurz', long: 'Lang', bald: 'Glatze', spiky: 'Igel', bun: 'Dutt', braids: 'Zöpfe',
        straight: 'Glatt', wavy: 'Wellig', curly: 'Lockig', afro: 'Afro', blonde: 'Blond', brown: 'Braun', black: 'Schwarz', red: 'Rot', gray: 'Grau', pink: 'Rosa', white: 'Weiß',
        light: 'Hell', medium: 'Mittel', dark: 'Dunkel', pale: 'Blass', blue: 'Blau', green: 'Grün', none: 'Keine', round: 'Rund', sunglasses: 'Sonne', square: 'Smart',
        cap: 'Kappe', beanie: 'Mütze', hat: 'Hut', crown: 'Krone', tshirt: 'T-Shirt', hoodie: 'Hoodie', dress: 'Kleid', shirt: 'Hemd', jacket: 'Jacke',
        orange: 'Orange', yellow: 'Gelb', purple: 'Lila', outfit: 'Outfit', face: 'Gesicht & Zubehör', hair: 'Haare'
    }
};

// --- PIXAR STYLE CONFIGURATION ---
const AVATAR_OPTIONS = {
    gender: [
        { id: 'male', emoji: '👦', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-300' },
        { id: 'female', emoji: '👧', gradient: 'from-pink-400 to-pink-600', shadow: 'shadow-pink-300' }
    ],
    hairStyle: [
        { id: 'short', emoji: '🧑' },
        { id: 'long', emoji: '👩' },
        { id: 'bald', emoji: '👨‍🦲' },
        { id: 'spiky', emoji: '👱' },
        { id: 'bun', emoji: '👱‍♀️' },
        { id: 'braids', emoji: '👧' },
    ],
    hairTexture: [
        { id: 'straight', emoji: '📏' },
        { id: 'wavy', emoji: '〰️' },
        { id: 'curly', emoji: '🌀' },
        { id: 'afro', emoji: '🥦' },
    ],
    hairColor: [
        { id: 'blonde', color: '#FCD34D' },
        { id: 'brown', color: '#78350F' },
        { id: 'black', color: '#171717' },
        { id: 'red', color: '#EF4444' },
        { id: 'gray', color: '#9CA3AF' },
        { id: 'pink', color: '#F472B6' },
        { id: 'white', color: '#F3F4F6' },
    ],
    skinColor: [
        { id: 'light', color: '#FDE68A' },
        { id: 'medium', color: '#FDBA74' },
        { id: 'dark', color: '#A97142' },
        { id: 'pale', color: '#FEF3C7' },
    ],
    eyes: [
        { id: 'blue', color: '#60A5FA' },
        { id: 'green', color: '#34D399' },
        { id: 'brown', color: '#78350F' },
        { id: 'black', color: '#000000' },
    ],
    glasses: [
        { id: 'none', emoji: '👀' },
        { id: 'round', emoji: '👓' },
        { id: 'sunglasses', emoji: '🕶️' },
        { id: 'square', emoji: '🤓' },
    ],
    headwear: [
        { id: 'none', emoji: '❌' },
        { id: 'cap', emoji: '🧢' },
        { id: 'beanie', emoji: '🧶' },
        { id: 'hat', emoji: '👒' },
        { id: 'crown', emoji: '👑' },
    ],
    clothing: [
        { id: 'tshirt', emoji: '👕' },
        { id: 'hoodie', emoji: '🧥' },
        { id: 'dress', emoji: '👗' },
        { id: 'shirt', emoji: '👔' },
        { id: 'jacket', emoji: '🧥' },
    ],
    clothingColor: [
        { id: 'red', color: '#EF4444' },
        { id: 'blue', color: '#3B82F6' },
        { id: 'green', color: '#10B981' },
        { id: 'yellow', color: '#F59E0B' },
        { id: 'purple', color: '#8B5CF6' },
        { id: 'black', color: '#1F2937' },
        { id: 'white', color: '#F3F4F6' },
        { id: 'orange', color: '#F97316' },
        { id: 'pink', color: '#EC4899' },
    ]
};

const DEFAULT_CONFIG: AvatarConfig = {
    gender: 'male',
    skinColor: 'light',
    hairColor: 'brown',
    hairStyle: 'short',
    hairTexture: 'straight',
    eyeStyle: 'brown', 
    mouthStyle: 'smile', 
    clothingColor: 'blue',
    clothingStyle: 'tshirt',
    accessory: 'none', 
    headwear: 'none',
    backgroundColor: 'blue'
};

// --- IMAGE COMPRESSION UTILITY ---
const compressBase64 = (base64: string, maxWidth = 400): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
                resolve(base64);
            }
        };
        img.onerror = () => resolve(base64); 
    });
};

interface PlannerFormProps {
  preferences: FamilyPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<FamilyPreferences>>;
  onSubmit: () => void;
  isLoading: boolean;
  onLocate: () => void;
  isLocating?: boolean; 
  locationError: string | null;
  t: any;
}

// --- IMAGE CROPPER MODAL ---
const ImageCropperModal: React.FC<{
    imageSrc: string;
    onConfirm: (croppedBase64: string) => void;
    onCancel: () => void;
}> = ({ imageSrc, onConfirm, onCancel }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        setZoom(z => Math.min(3, Math.max(0.1, z + delta)));
    };

    const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

    const handleCrop = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;

        if (ctx && img) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            ctx.translate(size / 2, size / 2);
            ctx.translate(offset.x, offset.y);
            ctx.scale(zoom, zoom);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            onConfirm(base64);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in-up" 
             onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp} onMouseLeave={handleMouseUp}>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Scissors className="w-5 h-5"/> Inquadra il Viso</h3>
            <div 
                ref={containerRef}
                className="relative w-72 h-72 md:w-96 md:h-96 bg-black border-4 border-white/20 rounded-full overflow-hidden shadow-2xl cursor-move touch-none"
                onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}
                onMouseMove={handleMouseMove} onTouchMove={handleMouseMove}
                onWheel={handleWheel}
            >
                <img 
                    ref={imgRef} src={imageSrc} alt="Crop target" className="absolute max-w-none origin-center select-none"
                    style={{ top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, pointerEvents: 'none' }}
                    draggable={false}
                />
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40"><Plus className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1} /></div>
            </div>
            <div className="mt-8 w-full max-w-xs space-y-6">
                <div className="flex items-center gap-4">
                    <ZoomOut className="w-4 h-4 text-white/70" />
                    <input type="range" min="0.1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    <ZoomIn className="w-4 h-4 text-white/70" />
                </div>
                <button onClick={resetView} className="mx-auto flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"><RotateCcw className="w-3 h-3" /> Centra Immagine</button>
            </div>
            <div className="flex gap-4 mt-8">
                <button onClick={onCancel} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">Annulla</button>
                <button onClick={handleCrop} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transform active:scale-95 transition-all"><ScanFace className="w-5 h-5"/> Analizza Viso</button>
            </div>
        </div>
    );
};

// --- AVATAR CREATOR MODAL ---
const AvatarCreatorModal: React.FC<{
    preferences: FamilyPreferences;
    initialTab?: 'adults' | 'children';
    initialIndex?: number;
    onUpdateAdult: (index: number, data: Partial<AdultData>) => void;
    onUpdateChild: (index: number, data: Partial<Child>) => void;
    onClose: () => void;
}> = ({ preferences, initialTab = 'adults', initialIndex = 0, onUpdateAdult, onUpdateChild, onClose }) => {
    const [activeTab, setActiveTab] = useState<'adults' | 'children'>(initialTab);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);
    const [generating, setGenerating] = useState(false);
    const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(undefined);
    const [currentName, setCurrentName] = useState(""); 
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    const adultsList = preferences.adultsData || [];
    const childrenList = preferences.children || [];
    const targetItem = activeTab === 'adults' ? adultsList[activeIndex] : childrenList[activeIndex];
    const lang = preferences.language || 'it';
    const labels = AVATAR_LABELS[lang] || AVATAR_LABELS['it'];

    useEffect(() => {
        if (targetItem) {
            setConfig(targetItem.avatarConfig || DEFAULT_CONFIG);
            setCurrentAvatarUrl(targetItem.avatarUrl);
            const newName = activeTab === 'adults' 
                ? ((targetItem as AdultData).role || `Adulto ${activeIndex + 1}`)
                : ((targetItem as Child).name || `Bimbo ${activeIndex + 1}`);
            setCurrentName(newName);
        }
    }, [activeTab, activeIndex]);

    const handleGenerate = async (e?: React.MouseEvent) => {
        if(e) e.preventDefault();
        if (generating) return;

        setGenerating(true);
        try {
            const isAdult = activeTab === 'adults';
            let subject = 'person';
            if (config.gender === 'male') subject = isAdult ? 'man' : 'young boy';
            else subject = isAdult ? 'woman' : 'young girl';

            const hatDescription = config.headwear && config.headwear !== 'none' ? `wearing a ${config.headwear}` : 'no hat';

            const prompt = `
                Pixar style 3D character portrait of a ${subject}.
                Features: ${config.hairStyle} style with ${config.hairTexture} texture, color ${config.hairColor}.
                Skin: ${config.skinColor} skin tone. Eyes: ${config.eyeStyle} color.
                Wearing: ${config.clothingColor} ${config.clothingStyle}.
                Accessories: ${config.accessory !== 'none' ? config.accessory + ' glasses' : 'no glasses'}, ${hatDescription}.
                Expression: Happy, warm smile.
                Lighting: Soft studio lighting, cinematic 4k render.
                Background: Soft gradient, clean.
            `;

            const role = activeTab === 'adults' ? `Adult ${activeIndex + 1}` : `Child ${activeIndex + 1}`;
            const url = await generateFamilyMemberAvatar(prompt, role);
            const compressedUrl = await compressBase64(url);

            setCurrentAvatarUrl(compressedUrl);
            saveUpdates(compressedUrl, config, currentName);

        } catch (e: any) {
            console.error(e);
            if (e.message === 'API_KEY_REQUIRED' || e.message?.includes('API_KEY_REQUIRED') || e.message?.includes('API key')) {
                alert("⚠️ Chiave API Gemini richiesta. Inserisci la tua API Key nelle Impostazioni (icona menu in alto a destra) per generare l'Avatar 3D con l'IA.");
            } else {
                alert("⚠️ Impossibile generare l'avatar in questo momento. Verifica la tua connessione e riprova.");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteAvatar = () => {
        if(confirm("Vuoi davvero eliminare questo avatar?")) {
            setCurrentAvatarUrl(undefined);
            setConfig(DEFAULT_CONFIG);
            saveUpdates(undefined, DEFAULT_CONFIG, currentName);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setCurrentName(newName);
        saveUpdates(currentAvatarUrl, config, newName);
    };

    const handleNameFocus = () => {
        const isDefault = /^(Adulto|Bimbo|Adult|Child)\s*\d*$/i.test(currentName);
        if (isDefault) {
            setCurrentName('');
        }
    };

    const saveUpdates = (url: string | undefined, cfg: AvatarConfig, name: string) => {
        if (activeTab === 'adults') {
            onUpdateAdult(activeIndex, { avatarConfig: cfg, avatarUrl: url, role: name });
        } else {
            onUpdateChild(activeIndex, { avatarConfig: cfg, avatarUrl: url, name: name });
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setCropImageSrc(ev.target?.result as string); };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCroppedImage = async (base64: string) => {
        setCropImageSrc(null);
        setAnalyzingPhoto(true);
        try {
            const newConfig = await analyzeAvatarPhoto(base64, 'image/jpeg');
            const mergedConfig: AvatarConfig = { ...config, ...newConfig, gender: newConfig.gender as any || config.gender };
            setConfig(mergedConfig);
        } catch (error) {
            console.error(error);
            alert("Errore analisi foto");
        } finally {
            setAnalyzingPhoto(false);
        }
    };

    if (!targetItem) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2"/>
                    <p className="text-sm font-bold text-slate-500">Loading profile...</p>
                    <button onClick={onClose} className="mt-4 text-xs underline">Chiudi</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-fade-in-up">
            {cropImageSrc && <ImageCropperModal imageSrc={cropImageSrc} onConfirm={handleCroppedImage} onCancel={() => setCropImageSrc(null)} />}
            <div className="bg-white md:rounded-[2rem] w-full max-w-[95vw] md:max-w-7xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-full md:h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-slate-100/80 hover:bg-slate-200 rounded-full transition-colors shadow-sm"><X className="w-5 h-5 text-slate-800"/></button>
                
                <div className="w-full md:w-56 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2 md:p-4 flex-shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:gap-0 items-center md:items-stretch h-20 md:h-auto scrollbar-hide">
                    {adultsList.map((ad, idx) => {
                        if (!ad) return null; 
                        return (
                            <button key={`a-${idx}`} onClick={() => { setActiveTab('adults'); setActiveIndex(idx); }} className={`flex items-center gap-3 p-2 rounded-xl transition-all min-w-[140px] md:min-w-0 ${activeTab === 'adults' && activeIndex === idx ? 'bg-white shadow-md ring-2 ring-indigo-500' : 'hover:bg-slate-100 opacity-70 hover:opacity-100'}`}>
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                                    {ad.avatarUrl ? <img src={ad.avatarUrl} className="w-full h-full object-cover"/> : <User className="w-5 h-5 m-2.5 text-slate-400"/>}
                                </div>
                                <div className="text-left truncate">
                                    <span className="font-bold text-xs text-slate-700 block truncate">{ad.role || `Adulto ${idx+1}`}</span>
                                </div>
                            </button>
                        );
                    })}
                    {childrenList.map((ch, idx) => {
                        if (!ch) return null; 
                        return (
                            <button key={`c-${idx}`} onClick={() => { setActiveTab('children'); setActiveIndex(idx); }} className={`flex items-center gap-3 p-2 rounded-xl transition-all min-w-[140px] md:min-w-0 ${activeTab === 'children' && activeIndex === idx ? 'bg-white shadow-md ring-2 ring-indigo-500' : 'hover:bg-slate-100 opacity-70 hover:opacity-100'}`}>
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                                    {ch.avatarUrl ? <img src={ch.avatarUrl} className="w-full h-full object-cover"/> : <Smile className="w-5 h-5 m-2.5 text-slate-400"/>}
                                </div>
                                <div className="text-left truncate">
                                    <span className="font-bold text-xs text-slate-700 block truncate">{ch.name || `Bimbo ${idx+1}`}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="w-full md:w-80 bg-slate-100 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative shrink-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                    
                    <div className="relative w-full max-w-xs mb-6 z-10">
                        <input 
                            type="text" 
                            value={currentName || ''} 
                            onChange={handleNameChange}
                            onFocus={handleNameFocus} 
                            className="w-full bg-white border-2 border-slate-200 rounded-full px-4 py-3 text-center font-black text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 shadow-sm placeholder:text-slate-300 transition-all text-lg"
                            placeholder="Inserisci nome..."
                        />
                    </div>

                    <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 group shrink-0 z-10">
                        {currentAvatarUrl && (
                            <button onClick={handleDeleteAvatar} className="absolute -top-2 -right-2 z-20 p-2.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-transform hover:scale-110 border-4 border-white" title="Elimina Avatar">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <div className="absolute inset-4 bg-indigo-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        
                        <div className="relative w-full h-full rounded-full border-[8px] border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden bg-white flex items-center justify-center">
                            {generating ? (
                                <div className="flex flex-col items-center text-indigo-500"><Loader2 className="w-12 h-12 animate-spin mb-3" /><span className="text-xs font-bold uppercase tracking-widest animate-pulse">Creating...</span></div>
                            ) : currentAvatarUrl ? (
                                <img src={currentAvatarUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="text-center opacity-30"><Sparkles className="w-20 h-20 mx-auto mb-2 text-slate-400" /><p className="text-sm font-bold uppercase text-slate-400">Anteprima</p></div>
                            )}
                        </div>
                        
                        <div className="absolute -bottom-2 right-1/2 translate-x-1/2 z-20">
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                             <button onClick={() => fileInputRef.current?.click()} disabled={analyzingPhoto} className="w-14 h-14 bg-white text-indigo-600 rounded-full shadow-xl border-4 border-indigo-50 flex items-center justify-center hover:scale-110 transition-all active:scale-95" title="Carica Foto">
                                 {analyzingPhoto ? <Loader2 className="w-6 h-6 animate-spin"/> : <Camera className="w-6 h-6" />}
                             </button>
                        </div>
                    </div>

                    <button type="button" onClick={handleGenerate} disabled={generating || analyzingPhoto} className="w-full max-w-xs py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative z-10 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1">
                        {generating ? 'Creo Magia...' : <><Wand2 className="w-6 h-6" /> {currentAvatarUrl ? 'Rigenera' : 'Genera 3D'}</>}
                    </button>
                    {analyzingPhoto && <p className="text-[10px] text-indigo-500 font-bold mt-2 animate-pulse">Analizzo i tratti del viso...</p>}
                </div>

                <div className="flex-1 bg-white p-6 md:p-8 overflow-y-auto pb-32 md:pb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><Palette className="w-6 h-6 text-indigo-500" /> Crea Stile</h3>
                        <div className="flex gap-3">
                            {AVATAR_OPTIONS.gender.map(g => (
                                <button key={g.id} onClick={() => setConfig({...config, gender: g.id as any})} className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${config.gender === g.id ? `bg-gradient-to-br ${g.gradient} text-white scale-110 ${g.shadow} shadow-lg ring-2 ring-offset-2 ring-white` : 'bg-slate-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-white border-2 border-slate-100'}`}>
                                    {g.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full bg-orange-400"></span> {labels.hair}</label>
                            <div className="flex gap-3 flex-wrap justify-start mb-6">
                                {AVATAR_OPTIONS.hairColor.map(c => (
                                    <button key={c.id} onClick={() => setConfig({...config, hairColor: c.id})} className={`w-10 h-10 rounded-full shadow-inner transition-transform relative group ${config.hairColor === c.id ? 'scale-125 ring-2 ring-offset-2 ring-indigo-400 z-10' : 'hover:scale-110'}`} style={{background: `radial-gradient(circle at 30% 30%, ${c.color}, #000)`}} title={labels[c.id] || c.id}><div className="absolute top-2 left-2 w-3 h-2 bg-white/30 rounded-full blur-[1px]"></div></button>
                                ))}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-start mb-4">
                                 {AVATAR_OPTIONS.hairTexture.map(t => (
                                     <button key={t.id} onClick={() => setConfig({...config, hairTexture: t.id})} className={`px-4 py-2 rounded-full text-xs font-bold border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap ${config.hairTexture === t.id ? 'bg-indigo-500 border-indigo-700 text-white shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><span className="text-lg">{t.emoji}</span> {labels[t.id] || t.id}</button>
                                 ))}
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {AVATAR_OPTIONS.hairStyle.map(s => (
                                    <button key={s.id} onClick={() => setConfig({...config, hairStyle: s.id})} className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${config.hairStyle === s.id ? 'bg-white border-indigo-400 shadow-md transform -translate-y-1' : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-200'}`}><span className="text-3xl drop-shadow-sm">{s.emoji}</span> <span className={`text-[10px] font-bold uppercase ${config.hairStyle === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{labels[s.id] || s.id}</span></button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full bg-rose-400"></span> {labels.face}</label>
                            <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-6">
                                <div className="flex items-center bg-white p-4 rounded-2xl shadow-sm gap-4">
                                    <div className="flex gap-[-8px]">
                                        {AVATAR_OPTIONS.skinColor.map((c, i) => (
                                            <button key={c.id} onClick={() => setConfig({...config, skinColor: c.id})} className={`w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform -ml-2 first:ml-0 relative hover:z-10 hover:scale-125 ${config.skinColor === c.id ? 'scale-125 z-10 ring-2 ring-indigo-400' : ''}`} style={{backgroundColor: c.color}} />
                                        ))}
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="flex gap-2">
                                        {AVATAR_OPTIONS.eyes.map(c => (
                                            <button key={c.id} onClick={() => setConfig({...config, eyeStyle: c.id})} className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform ${config.eyeStyle === c.id ? 'scale-150 ring-1 ring-indigo-400 z-10' : 'hover:scale-125'}`} style={{background: `radial-gradient(circle at 30% 30%, ${c.color}, #000)`}} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-start flex-wrap">
                                {AVATAR_OPTIONS.glasses.map(g => (
                                    <button key={g.id} onClick={() => setConfig({...config, accessory: g.id})} className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${config.accessory === g.id ? 'bg-amber-100 border-amber-300 shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>{g.emoji}</button>
                                ))}
                                <div className="w-px h-14 bg-slate-200 mx-2"></div>
                                {AVATAR_OPTIONS.headwear.map(h => (
                                    <button key={h.id} onClick={() => setConfig({...config, headwear: h.id})} className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${config.headwear === h.id ? 'bg-purple-100 border-purple-300 shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>{h.emoji}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {labels.outfit}</label>
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                {AVATAR_OPTIONS.clothing.map(c => (
                                    <button key={c.id} onClick={() => setConfig({...config, clothingStyle: c.id})} className={`min-w-[90px] p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${config.clothingStyle === c.id ? 'bg-white border-blue-400 shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-blue-200 opacity-70 hover:opacity-100'}`}><span className="text-4xl drop-shadow-md">{c.emoji}</span> <span className={`text-[10px] font-black uppercase ${config.clothingStyle === c.id ? 'text-blue-600' : 'text-slate-400'}`}>{labels[c.id] || c.id}</span></button>
                                ))}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-start p-3 bg-white rounded-2xl shadow-sm mt-4 w-fit">
                                {AVATAR_OPTIONS.clothingColor.map(c => (
                                    <button key={c.id} onClick={() => setConfig({...config, clothingColor: c.id})} className={`w-8 h-8 rounded-full shadow-inner transition-transform border-2 border-white ${config.clothingColor === c.id ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'}`} style={{backgroundColor: c.color}} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlannerForm: React.FC<PlannerFormProps> = ({ preferences, setPreferences, onSubmit, isLoading, onLocate, isLocating, locationError, t }) => {
  const [avatarModalState, setAvatarModalState] = useState<{isOpen: boolean, tab: 'adults' | 'children', index: number} | null>(null);

  // Ensure adult data is synchronized with adult count
  useEffect(() => {
      setPreferences(prev => {
          const currentCount = prev.adultsData?.length || 0;
          const targetCount = prev.adults;
          if (currentCount === targetCount && prev.adultsData) return prev;
          
          let newData = prev.adultsData ? [...prev.adultsData] : [];
          if (targetCount > currentCount) {
              for(let i = currentCount; i < targetCount; i++) {
                  newData.push({ id: Date.now().toString() + i, role: '' });
              }
          } else {
              newData = newData.slice(0, targetCount);
          }
          return { ...prev, adultsData: newData };
      });
  }, [preferences.adults]);

  const handleAddChild = () => setPreferences(prev => ({ ...prev, children: [...prev.children, { name: '', age: '' }] }));
  const handleRemoveChild = (index: number) => setPreferences(prev => ({ ...prev, children: prev.children.filter((_, i) => i !== index) }));
  const handleChildChange = (index: number, field: keyof Child, value: string) => {
    setPreferences(prev => {
      const newChildren = [...prev.children];
      if(newChildren[index]) {
          newChildren[index] = { ...newChildren[index], [field]: value };
      }
      return { ...prev, children: newChildren };
    });
  };
  const updateAdults = (delta: number) => setPreferences(prev => ({ ...prev, adults: Math.max(1, prev.adults + delta) }));
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => setPreferences(prev => ({ ...prev, radiusKm: parseInt(e.target.value) }));
  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => setPreferences(prev => ({ ...prev, interests: e.target.value }));
  const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => setPreferences(prev => ({ ...prev, manualLocation: e.target.value }));
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setPreferences(prev => ({ ...prev, selectedDate: e.target.value }));
  const handleTimeSlotChange = (day: 'saturdayMode' | 'sundayMode', value: TimeSlot) => setPreferences(prev => ({ ...prev, [day]: value }));
  const handleVibeChange = (vibe: string) => setPreferences(prev => ({ ...prev, vibe }));

  const handleUpdateAdult = (index: number, data: Partial<AdultData>) => {
      setPreferences(prev => {
          const newData = prev.adultsData ? [...prev.adultsData] : [];
          for(let i=0; i<=index; i++) {
              if(!newData[i]) newData[i] = { id: Date.now().toString() + i, role: '' };
          }
          newData[index] = { ...newData[index], ...data };
          return { ...prev, adultsData: newData };
      });
  };

  const handleUpdateChildAvatar = (index: number, data: Partial<Child>) => {
      setPreferences(prev => {
          const newChildren = [...prev.children];
          if (newChildren[index]) {
              newChildren[index] = { ...newChildren[index], ...data };
          }
          return { ...prev, children: newChildren };
      });
  };

  // AUTO-FALLBACK & VALIDATION PER SUBMIT BUTTON (rimuove frizione utente)
  const isFormValid = true;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

      {avatarModalState && avatarModalState.isOpen && (
          <AvatarCreatorModal 
            preferences={preferences} 
            initialTab={avatarModalState.tab}
            initialIndex={avatarModalState.index}
            onClose={() => setAvatarModalState(null)}
            onUpdateAdult={handleUpdateAdult}
            onUpdateChild={handleUpdateChildAvatar}
          />
      )}

      <div className="space-y-12">
        <section className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> {t.who_participates}
          </h3>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 relative">
             
             {/* ADULTS SECTION */}
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                     <div className="p-3 bg-white rounded-xl shadow-sm"><User className="w-6 h-6 text-slate-700" /></div>
                     <span className="font-bold text-slate-700">{t.adults}</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                     <button onClick={() => updateAdults(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"><Minus className="w-4 h-4" /></button>
                     <span className="font-black text-xl w-6 text-center">{preferences.adults}</span>
                     <button onClick={() => updateAdults(1)} className="w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                 </div>
             </div>
             
             {/* ADULTS INPUT FIELDS (NEW) */}
             <div className="space-y-3 mb-6">
                {(preferences.adultsData || []).map((adult, index) => (
                    adult ? (
                    <div key={index} className="flex gap-3 animate-fade-in-up">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                             {adult.avatarUrl ? <img src={adult.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                        </div>
                        <input 
                            type="text" 
                            placeholder={`${t.name_placeholder} ${index + 1}`}
                            value={adult.role || ''} 
                            onChange={(e) => handleUpdateAdult(index, { role: e.target.value })} 
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:font-normal" 
                        />
                    </div>
                    ) : null
                ))}
             </div>

             {/* CHILDREN SECTION */}
             <div className="space-y-3">
                {preferences.children.map((child, index) => {
                    if(!child) return null; 
                    return (
                        <div key={index} className="flex gap-3 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                {child.avatarUrl ? <img src={child.avatarUrl} className="w-full h-full object-cover" /> : <Smile className="w-5 h-5 text-slate-400" />}
                            </div>
                            <input type="text" placeholder={t.name_placeholder} value={child.name} onChange={(e) => handleChildChange(index, 'name', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:font-normal" />
                            <input type="number" min="0" max="17" placeholder={t.age_placeholder} value={child.age} onChange={(e) => handleChildChange(index, 'age', e.target.value)} className="w-20 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                            <button onClick={() => handleRemoveChild(index)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    );
                })}
                <button onClick={handleAddChild} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4"><Plus className="w-4 h-4" /> {t.add_child}</button>
             </div>

             <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avatar</span>
                    <button onClick={() => setAvatarModalState({ isOpen: true, tab: 'adults', index: 0 })} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"><Palette className="w-3 h-3"/> Editor</button>
                </div>
                <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:flex md:flex-wrap md:justify-center md:gap-8 pb-4 py-4 justify-items-center">
                    {(preferences.adultsData || []).map((ad, i) => {
                        if (!ad) return null; 
                        return (
                            <button key={`ad-${i}`} onClick={() => setAvatarModalState({ isOpen: true, tab: 'adults', index: i })} className="flex flex-col items-center gap-3 group transition-transform hover:-translate-y-1 w-full max-w-[160px]">
                                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] overflow-hidden transition-all shadow-xl flex items-center justify-center bg-white ${ad.avatarUrl ? 'border-indigo-500 group-hover:scale-105 shadow-indigo-200/50 ring-4 ring-indigo-50' : 'border-dashed border-slate-300 group-hover:border-indigo-300'}`}>
                                    {ad.avatarUrl ? <img src={ad.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-slate-300 group-hover:text-indigo-300 transition-colors" />}
                                </div>
                                <span className="text-lg font-black text-slate-700 truncate w-full text-center tracking-tight">{ad.role || `Adult ${i+1}`}</span>
                            </button>
                        );
                    })}
                    {preferences.children.map((ch, i) => {
                        if (!ch) return null; 
                        return (
                            <button key={`ch-${i}`} onClick={() => setAvatarModalState({ isOpen: true, tab: 'children', index: i })} className="flex flex-col items-center gap-3 group transition-transform hover:-translate-y-1 w-full max-w-[160px]">
                                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] overflow-hidden transition-all shadow-xl flex items-center justify-center bg-white ${ch.avatarUrl ? 'border-indigo-500 group-hover:scale-105 shadow-indigo-200/50 ring-4 ring-indigo-50' : 'border-dashed border-slate-300 group-hover:border-indigo-300'}`}>
                                    {ch.avatarUrl ? <img src={ch.avatarUrl} className="w-full h-full object-cover" /> : <Smile className="w-12 h-12 text-slate-300 group-hover:text-indigo-300 transition-colors" />}
                                </div>
                                <span className="text-lg font-black text-slate-700 truncate w-full text-center tracking-tight">{ch.name || `Child ${i+1}`}</span>
                            </button>
                        );
                    })}
                </div>
             </div>
          </div>
        </section>

        <section className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Navigation className="w-4 h-4 text-emerald-500" /> {t.where_to_go}</h3>
            <div className="space-y-4">
                <div className="flex gap-2 relative">
                    <div className="relative flex-1 group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input type="text" placeholder={t.city_placeholder} value={preferences.manualLocation} onChange={handleManualLocationChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm" />
                    </div>
                    <button onClick={onLocate} disabled={isLocating} className={`px-5 rounded-2xl transition-all flex items-center gap-2 shadow-sm font-bold text-sm whitespace-nowrap ${isLocating ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
                        {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />} <span className="hidden sm:inline">{isLocating ? 'Cercando...' : 'GPS'}</span>
                    </button>
                </div>
                {locationError && <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 animate-pulse"><AlertCircle className="w-3 h-3" /> {locationError}</div>}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.radius}: {preferences.radiusKm} km</span></div>
                    <input type="range" min="10" max="200" value={preferences.radiusKm} onChange={handleRadiusChange} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
            </div>
        </section>

        <section className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> {t.when}</h3>
            <div className="bg-slate-50 p-1 rounded-2xl flex mb-6 border border-slate-200">
                <input type="date" min={new Date().toISOString().split('T')[0]} value={preferences.selectedDate} onChange={handleDateChange} className="w-full bg-transparent border-none text-center font-bold text-slate-700 focus:ring-0 cursor-pointer py-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 {[ 
                    { id: 'saturdayMode', label: t.saturday, val: preferences.saturdayMode },
                    { id: 'sundayMode', label: t.sunday, val: preferences.sundayMode }
                 ].map((day: any) => (
                     <div key={day.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                         <h4 className="font-black text-slate-700 mb-3 text-center">{day.label}</h4>
                         <div className="grid grid-cols-2 gap-2">
                             {[
                                 { id: 'full_day', icon: Sun, label: t.full_day },
                                 { id: 'morning', icon: Sunrise, label: t.morning },
                                 { id: 'afternoon', icon: Sunset, label: t.afternoon },
                                 { id: 'none', icon: Ban, label: t.rest },
                             ].map((opt) => (
                                 <button key={opt.id} onClick={() => handleTimeSlotChange(day.id, opt.id as TimeSlot)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${day.val === opt.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}>
                                     <opt.icon className="w-4 h-4 mb-1" /> <span className="text-[9px] font-bold uppercase">{opt.label}</span>
                                 </button>
                             ))}
                         </div>
                     </div>
                 ))}
            </div>
            <div className="mt-4 flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 cursor-pointer transition-colors hover:bg-indigo-100" onClick={() => setPreferences(p => ({...p, overnightStay: !p.overnightStay}))}>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${preferences.overnightStay ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{preferences.overnightStay && <Check className="w-4 h-4 text-white" />}</div>
                <div className="flex-1"><h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><BedDouble className="w-4 h-4"/> {t.hotel_search}</h4></div>
            </div>
        </section>

        <section className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> {t.mood_title}</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
                {[{ id: 'surprise', label: t.vibe_surprise, color: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' },{ id: 'nature', label: t.vibe_nature, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },{ id: 'culture', label: t.vibe_culture, color: 'bg-amber-100 text-amber-700 border-amber-200' },{ id: 'adventure', label: t.vibe_adventure, color: 'bg-orange-100 text-orange-700 border-orange-200' },{ id: 'magic', label: t.vibe_magic, color: 'bg-pink-100 text-pink-700 border-pink-200' },{ id: 'food', label: t.vibe_food, color: 'bg-red-100 text-red-700 border-red-200' },].map((v) => (
                    <button key={v.id} onClick={() => handleVibeChange(v.id)} className={`p-3 rounded-xl text-xs font-bold border transition-all shadow-sm ${preferences.vibe === v.id ? v.color + ' ring-2 ring-offset-2 ring-indigo-500' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{v.label}</button>
                ))}
            </div>
            <div className="relative group">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                <input type="text" placeholder={t.interests_placeholder} value={preferences.interests} onChange={handleInterestsChange} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
            </div>
        </section>

        <button 
            onClick={onSubmit} 
            disabled={isLoading || isLocating} 
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${isLoading || isLocating ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01] active:scale-95'}`}
        >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />} {isLoading ? t.generating : t.generate_button}
        </button>
      </div>
    </div>
  );
};

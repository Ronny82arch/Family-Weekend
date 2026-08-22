import { ItineraryRouteMap } from './ItineraryRouteMap';
import { LocationPhotoCarousel } from './LocationPhotoCarousel';
import { HourlyWeatherTimeline } from './HourlyWeatherTimeline';
import React, { useMemo, useState, useEffect, useId } from 'react';
import { PlanResult, FamilyPreferences } from '../types';
import { MapPin, CloudSun, RotateCcw, Loader2, TrainFront, Utensils, Flag, BookOpen, Star, CheckCircle, Search, ExternalLink, Image as ImageIcon, Clock, Navigation, Map as MapIcon, CornerDownRight, Sparkles, Moon, User, Smile, Backpack, Car, Coins, Share2, MessageCircle, Facebook, Mail, Link as LinkIcon, X, Check, Info, Route } from 'lucide-react';

interface PlanResultProps {
  plan: PlanResult;
  preferences: FamilyPreferences;
  onRegenerate: () => void;
  onSaveFavorite: (section?: string) => void;
  onMarkComplete: (section?: string) => void;
  isSaving: boolean;
  t: any; 
}

// --- SHARE MENU COMPONENT ---
const SocialShareMenu: React.FC<{ title: string, text: string, url?: string, isCompact?: boolean }> = ({ title, text, url = window.location.href, isCompact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const shareData = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + "\n" + text + "\n" + url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        mail: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + url)}`
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSystemShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (e) { console.error("Share failed", e); }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`${isCompact ? 'p-2 bg-white border border-slate-200 text-slate-600' : 'px-4 py-2.5 bg-white border border-stone-200 text-slate-600'} rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm hover:bg-slate-50`}
            >
                <Share2 className="w-4 h-4 text-indigo-500" />
                {!isCompact && "Condividi"}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className={`absolute ${isCompact ? 'right-0' : 'left-1/2 -translate-x-1/2'} top-full mt-2 w-56 bg-white rounded-3xl p-3 shadow-2xl border border-slate-100 z-50 animate-fade-in-up`}>
                        <div className="flex justify-between items-center px-3 py-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condividi</span>
                            <button onClick={() => setIsOpen(false)}><X className="w-3 h-3 text-slate-300" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            <a href={shareData.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 hover:bg-emerald-50 rounded-2xl transition-colors">
                                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><MessageCircle className="w-4 h-4" /></div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">WhatsApp</span>
                            </a>
                            <a href={shareData.facebook} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded-2xl transition-colors">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Facebook className="w-4 h-4" /></div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Facebook</span>
                            </a>
                            <a href={shareData.mail} className="flex flex-col items-center gap-1 p-2 hover:bg-rose-50 rounded-2xl transition-colors">
                                <div className="bg-rose-100 text-rose-600 p-2 rounded-xl"><Mail className="w-4 h-4" /></div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Email</span>
                            </a>
                            <button onClick={handleCopy} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                                <div className={`p-2 rounded-xl ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {copySuccess ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">{copySuccess ? 'Copiato!' : 'Copia'}</span>
                            </button>
                        </div>
                        <button 
                            onClick={handleSystemShare}
                            className="w-full mt-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                        >
                            Altre opzioni
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// --- MASSIVE STOCK LIBRARY (Fail-Safe Images) ---
// Now expanded with multiple images per category for variety
const STOCK_LIBRARY: Record<string, string[]> = {
    "pizza": [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
        "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"
    ],
    "restaurant": [
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
    ],
    "breakfast": [
        "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
        "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80",
        "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80"
    ],
    "icecream": [
        "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80",
        "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=800&q=80",
        "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80",
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80"
    ],
    "museum": [
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80",
        "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80",
        "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
        "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80"
    ],
    "art": [
        "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80",
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
        "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80"
    ],
    "park": [
        "https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=800&q=80",
        "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80",
        "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80"
    ],
    "nature": [
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80"
    ],
    "water": [
        "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?w=800&q=80"
    ],
    "mountain": [
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
        "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"
    ],
    "castle": [
        "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80",
        "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80"
    ],
    "church": [
        "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800&q=80",
        "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
        "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80"
    ],
    "urban": [
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80"
    ],
    "market": [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
        "https://images.unsplash.com/photo-1519690889869-e705e59f72e1?w=800&q=80",
        "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800&q=80",
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80"
    ],
    "kids": [
        "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&q=80",
        "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800&q=80",
        "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80"
    ],
    "animals": [
        "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80",
        "https://images.unsplash.com/photo-1518796745738-41048802f99a?w=800&q=80",
        "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80"
    ],
    "travel": [
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
        "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80",
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        "https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80"
    ]
};

// --- CUSTOM PIXAR-STYLE SVGS ---
const PixarCastle = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 400 300" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id={`skyGradient-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id={`castleGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id={`roofGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="400" height="300" fill={`url(#skyGradient-${uid})`} />
        <g filter={`url(#glow-${uid})`}>
            <circle cx="80" cy="60" r="2" fill="#fcd34d" className="animate-ping" style={{animationDuration: '3s'}} />
            <path d="M80,60 L60,40 M80,60 L100,40 M80,60 L80,30 M80,60 L60,80 M80,60 L100,80" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="320" cy="80" r="2" fill="#60a5fa" className="animate-ping" style={{animationDuration: '2.5s', animationDelay: '1s'}} />
            <path d="M320,80 L300,60 M320,80 L340,60 M320,80 L320,50 M320,80 L300,100 M320,80 L340,100" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="200" cy="40" r="3" fill="#f472b6" className="animate-ping" style={{animationDuration: '4s', animationDelay: '0.5s'}} />
             <path d="M200,40 L180,10 M200,40 L220,10 M200,40 L170,40 M200,40 L230,40 M200,40 L180,70 M200,40 L220,70" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
        <circle cx="50" cy="150" r="1" fill="white" className="animate-pulse" />
        <circle cx="350" cy="120" r="1.5" fill="white" className="animate-pulse" style={{animationDelay: '1s'}} />
        <path d="M80,300 L320,300 L320,220 L280,220 L280,180 L200,150 L120,180 L120,220 L80,220 Z" fill={`url(#castleGradient-${uid})`} stroke="#831843" strokeWidth="2" />
        <rect x="180" y="150" width="40" height="150" fill={`url(#castleGradient-${uid})`} />
        <path d="M170,150 L230,150 L200,60 Z" fill={`url(#roofGradient-${uid})`} />
        <rect x="100" y="180" width="30" height="120" fill={`url(#castleGradient-${uid})`} />
        <path d="M90,180 L140,180 L115,120 Z" fill={`url(#roofGradient-${uid})`} />
        <rect x="270" y="180" width="30" height="120" fill={`url(#castleGradient-${uid})`} />
        <path d="M260,180 L310,180 L285,120 Z" fill={`url(#roofGradient-${uid})`} />
        <rect x="195" y="180" width="10" height="15" rx="5" fill="#fef08a" />
        <rect x="110" y="200" width="10" height="15" rx="5" fill="#fef08a" />
        <rect x="280" y="200" width="10" height="15" rx="5" fill="#fef08a" />
        <path d="M170,300 L230,300 L230,260 A30,30 0 0,0 170,260 Z" fill="#4a044e" />
        <circle cx="200" cy="290" r="15" fill="#fef08a" opacity="0.6" filter={`url(#glow-${uid})`} />
    </svg>
    );
};

const PixarBackpack = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`bagGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" /> 
                <stop offset="100%" stopColor="#d97706" /> 
            </linearGradient>
            <filter id={`shadow-${uid}`}>
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
            </filter>
        </defs>
        <path d="M80,40 Q100,20 120,40" fill="none" stroke="#92400e" strokeWidth="8" strokeLinecap="round" />
        <rect x="50" y="40" width="100" height="120" rx="20" fill={`url(#bagGradient-${uid})`} filter={`url(#shadow-${uid})`} />
        <rect x="60" y="100" width="80" height="50" rx="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
        <path d="M55,55 L145,55" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
        <circle cx="100" cy="125" r="10" fill="#fff" />
        <circle cx="100" cy="125" r="4" fill="#ef4444" />
        <path d="M60,50 Q100,50 140,50 Q130,70 100,70 Q70,70 60,50" fill="white" opacity="0.2" />
    </svg>
    );
};

const PixarBinoculars = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`binocGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" /> 
                <stop offset="100%" stopColor="#4338ca" /> 
            </linearGradient>
            <linearGradient id={`lensGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" /> 
                <stop offset="100%" stopColor="#1d4ed8" /> 
            </linearGradient>
            <filter id={`shadowBinocPlan-${uid}`}>
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
            </filter>
        </defs>
        <rect x="70" y="90" width="60" height="20" rx="5" fill="#312e81" />
        <rect x="40" y="60" width="50" height="90" rx="15" fill={`url(#binocGradientPlan-${uid})`} filter={`url(#shadowBinocPlan-${uid})`} />
        <circle cx="65" cy="75" r="18" fill={`url(#lensGradientPlan-${uid})`} stroke="#1e1b4b" strokeWidth="3" />
        <circle cx="65" cy="75" r="8" fill="white" opacity="0.3" />
        <rect x="110" y="60" width="50" height="90" rx="15" fill={`url(#binocGradientPlan-${uid})`} filter={`url(#shadowBinocPlan-${uid})`} />
        <circle cx="135" cy="75" r="18" fill={`url(#lensGradientPlan-${uid})`} stroke="#1e1b4b" strokeWidth="3" />
        <circle cx="135" cy="75" r="8" fill="white" opacity="0.3" />
        <circle cx="45" cy="100" r="3" fill="#1e1b4b" />
        <circle cx="155" cy="100" r="3" fill="#1e1b4b" />
    </svg>
    );
};

const PixarTransport = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`trainGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={`carGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <filter id={`shadowTransportPlan-${uid}`}>
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
            </filter>
        </defs>
        <g transform="translate(10, 40)">
            <rect x="10" y="20" width="80" height="60" rx="5" fill={`url(#trainGradientPlan-${uid})`} filter={`url(#shadowTransportPlan-${uid})`} />
            <rect x="60" y="0" width="20" height="20" rx="2" fill="#1e40af" />
            <rect x="20" y="30" width="20" height="20" rx="2" fill="#bfdbfe" />
            <rect x="50" y="30" width="20" height="20" rx="2" fill="#bfdbfe" />
            <circle cx="30" cy="80" r="12" fill="#172554" stroke="#60a5fa" strokeWidth="2" />
            <circle cx="70" cy="80" r="12" fill="#172554" stroke="#60a5fa" strokeWidth="2" />
            <path d="M10,60 L0,80 L20,80 Z" fill="#1e3a8a" />
        </g>
        <g transform="translate(80, 80)">
            <path d="M10,30 Q20,0 50,0 T90,30 Z" fill={`url(#carGradientPlan-${uid})`} />
            <rect x="0" y="30" width="100" height="40" rx="10" fill={`url(#carGradientPlan-${uid})`} filter={`url(#shadowTransportPlan-${uid})`} />
            <path d="M20,30 L25,10 L75,10 L80,30 Z" fill="#fee2e2" />
            <circle cx="25" cy="70" r="12" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
            <circle cx="75" cy="70" r="12" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
            <circle cx="95" cy="40" r="4" fill="#fef08a" />
        </g>
    </svg>
    );
};

const PixarDoubloons = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 240 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`coinGrad1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id={`coinGrad2-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id={`doubloonShadow-${uid}`}>
                <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.4" />
            </filter>
        </defs>
        <g transform="translate(40, 30) rotate(-10)">
            <circle cx="80" cy="80" r="75" fill={`url(#coinGrad1-${uid})`} filter={`url(#doubloonShadow-${uid})`} stroke="#78350f" strokeWidth="2" />
            <circle cx="80" cy="80" r="60" fill={`url(#coinGrad2-${uid})`} stroke="#b45309" strokeWidth="3" opacity="0.9" />
            <path d="M80 50 L88 68 L108 68 L92 82 L98 102 L80 90 L62 102 L68 82 L52 68 L72 68 Z" fill="#92400e" opacity="0.6" />
            <circle cx="55" cy="55" r="4" fill="white" opacity="0.4" />
        </g>
        <g transform="translate(100, 50) rotate(5)">
            <circle cx="80" cy="80" r="75" fill={`url(#coinGrad1-${uid})`} filter={`url(#doubloonShadow-${uid})`} stroke="#78350f" strokeWidth="2" />
            <circle cx="80" cy="80" r="60" fill={`url(#coinGrad2-${uid})`} stroke="#b45309" strokeWidth="3" />
            <path d="M80 50 L88 68 L108 68 L92 82 L98 102 L80 90 L62 102 L68 82 L52 68 L72 68 Z" fill="#92400e" opacity="0.8" />
            <path d="M50 50 Q 80 40 110 50" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
            <circle cx="55" cy="55" r="5" fill="white" opacity="0.5" />
        </g>
    </svg>
    );
};

// --- HELPERS ---
const hashCode = (str: string) => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getStockImage = (text: string): string => {
    const t = text.toLowerCase();
    let category = 'travel';
    if (t.match(/pizza|pizzeri/)) category = 'pizza';
    else if (t.match(/gelato|ice|cream|yogurt/)) category = 'icecream';
    else if (t.match(/colazion|break|caff|bar|pastry/)) category = 'breakfast';
    else if (t.match(/ristorante|trattoria|osteria|cena|pranzo|lunch|dinner|food|burger|sushi/)) category = 'restaurant';
    else if (t.match(/museo|mostra|museum|gallery|pinacoteca/)) category = 'museum';
    else if (t.match(/arte|art|statua/)) category = 'art';
    else if (t.match(/parco|park|giardino|garden|botanic/)) category = 'park';
    else if (t.match(/bosco|forest|sentiero|trail|trek/)) category = 'nature';
    else if (t.match(/lago|lake|fiume|river|cascata|water|spiaggia|beach|mare|sea/)) category = 'water';
    else if (t.match(/montagna|mountain|alpi|neve|snow/)) category = 'mountain';
    else if (t.match(/castello|castle|rocca|fort|palazzo|palace/)) category = 'castle';
    else if (t.match(/chiesa|church|duomo|cattedrale|basilica/)) category = 'church';
    else if (t.match(/piazza|square|via|street|centro|center|town|city/)) category = 'urban';
    else if (t.match(/mercato|market|fiera|fair|shop/)) category = 'market';
    else if (t.match(/gioco|play|bimbi|kid|luna|park|divertimento|fun/)) category = 'kids';
    else if (t.match(/zoo|animal|fattoria|farm|aquarium|acquario/)) category = 'animals';

    const images = STOCK_LIBRARY[category];
    const index = hashCode(text) % images.length;
    return images[index];
};

const cleanTitleForSearch = (title: string): string => {
    const STOPWORDS = [
        'visita', 'giro', 'tour', 'camminata', 'escursione', 'andiamo', 'salita', 'discesa', 'vedere', 'scoprire', 'passeggiata', 'relax',
        'visit', 'walk', 'hike', 'hiking', 'trip', 'excursion', 'go', 'to', 'see', 'discover', 'explore',
        'mattina', 'pomeriggio', 'sera', 'morning', 'afternoon', 'evening', 'pranzo', 'cena', 'lunch', 'dinner', 'break', 'pausa',
        'a', 'al', 'alla', 'alle', 'ai', 'agli', 'in', 'presso', 'di', 'del', 'della', 'dei', 'degli', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno', 'verso', 'per', 'con',
        'fermata', 'sosta', 'stop', 'at', 'the', 'of', 'and'
    ];
    let cleaned = title.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').replace(/[\u2700-\u27BF]/gu, '');
    cleaned = cleaned.replace(/[|:-]/g, ' ').replace(/\*\*/g, '').replace(/\./g, '');
    const words = cleaned.toLowerCase().split(/\s+/).filter(w => !STOPWORDS.includes(w) && w.length > 2);
    let result = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
    return result;
};

// --- COMPONENTS ---

const SmartImage: React.FC<{ title: string; className?: string; t?: any }> = ({ title, className, t }) => {
    const safeFallback = useMemo(() => getStockImage(title), [title]);
    const [src, setSrc] = useState<string>(safeFallback);
    const [isWiki, setIsWiki] = useState(false);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const cleanTitle = cleanTitleForSearch(title);
        const GENERIC_BLACKLIST = ['pranzo', 'cena', 'lunch', 'dinner', 'colazione', 'breakfast', 'pizzeria', 'ristorante', 'restaurant', 'parco', 'park', 'museo', 'museum', 'centro', 'center', 'città', 'city', 'tour', 'gita', 'viaggio'];
        
        if (cleanTitle.length < 3 || GENERIC_BLACKLIST.includes(cleanTitle.toLowerCase())) {
            if(isMounted) { setSrc(safeFallback); setIsWiki(false); setStatus('success'); }
            return;
        }

        const fetchWikiImage = async (query: string) => {
            try {
                const encoded = encodeURIComponent(query);
                const searchUrl = `https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&origin=*`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(searchUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                const pages = data.query?.pages;
                if (!pages) throw new Error("No pages");
                const page = Object.values(pages)[0] as any;
                const imageUrl = page?.thumbnail?.source;
                if (imageUrl) {
                     const lower = imageUrl.toLowerCase();
                     if (lower.endsWith('.svg') || lower.includes('logo') || lower.includes('icon')) throw new Error("Bad image");
                     return imageUrl;
                }
                throw new Error("No image");
            } catch (e) { return null; }
        };

        const attemptLoad = async () => {
             let img = await fetchWikiImage(cleanTitle);
             if (!img && cleanTitle.split(' ').length > 2) {
                 const shorter = cleanTitle.split(' ').slice(0, 2).join(' ');
                 img = await fetchWikiImage(shorter);
             }
             if (isMounted) {
                 if (img) { setSrc(img); setIsWiki(true); } else { setSrc(safeFallback); setIsWiki(false); }
                 setStatus('success');
             }
        };
        attemptLoad();
        return () => { isMounted = false; };
    }, [title, safeFallback]);

    const handleError = () => {
        if (retryCount < 1) { 
            setSrc(safeFallback);
            setIsWiki(false);
            setRetryCount(prev => prev + 1);
        }
    };

    const badgeLabel = isWiki ? (t?.image_real || "📍 Foto Luogo") : (t?.image_stock || "✨ Ispirazione");

    return (
        <div className={`relative ${className} bg-slate-100 overflow-hidden`}>
            <div className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-60 transition-all duration-1000" style={{ backgroundImage: `url(${src})` }}></div>
            <img src={src} alt={title} referrerPolicy="no-referrer" className={`w-full h-full object-cover relative z-10 transition-all duration-700 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setStatus('success')} onError={handleError} />
            <div className={`absolute bottom-2 right-2 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full pointer-events-none z-20 flex items-center gap-1 shadow-sm transition-colors duration-500 ${isWiki ? 'bg-emerald-900/80' : 'bg-black/60'}`}>
                {isWiki ? <MapPin className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />} {badgeLabel}
            </div>
        </div>
    );
};

export const ActivityCard: React.FC<{ title: string; content: string; visualLine?: string; onNavigate?: (locationName: string) => void; familyBadge?: React.ReactNode; t: any; googleMapsUrl?: string | null }> = ({ title, content, visualLine, onNavigate, familyBadge, t, googleMapsUrl }) => {
    const handleNavClick = (e: React.MouseEvent, locationName: string, url: string) => {
        if (onNavigate) { e.preventDefault(); onNavigate(locationName); window.open(url, '_blank'); }
    };

    if (/navigazione|navigation|navegación/i.test(title)) {
        const navTitle = title.replace(/###\s*/, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
        const steps = content.split('\n').map(line => line.trim()).filter(line => /^\d+\./.test(line)); 
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-700/50 mb-10 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><Navigation className="w-64 h-64" /></div>
                 <div className="p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg"><MapIcon className="w-8 h-8 text-indigo-200" /></div>
                        <div><h3 className="font-serif text-3xl font-bold leading-none mb-1">{navTitle}</h3></div>
                    </div>

                    {googleMapsUrl && (
                        <a 
                            href={googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full mb-8 px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 hover:scale-[1.01]"
                        >
                            <Route className="w-5 h-5 text-indigo-300" /> Naviga Tutto (Google Maps)
                        </a>
                    )}

                    {steps.length > 0 ? (
                        <div className="space-y-3 mb-8">
                            {steps.map((step, idx) => {
                                const match = step.match(/\*\*(.*?)\*\*/);
                                const locationName = match ? match[1] : step.replace(/^\d+\.\s*/, '');
                                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName)}`;
                                return (
                                    <a key={idx} href={mapsUrl} onClick={(e) => handleNavClick(e, locationName, mapsUrl)} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 transition-all hover:scale-[1.01] group cursor-pointer">
                                        <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="text-xs font-bold text-indigo-400">STEP</span><span className="font-black text-xl text-white">{idx + 1}</span></div>
                                        <div className="w-px h-10 bg-white/10"></div>
                                        <div className="flex-1"><div className="font-bold text-lg text-white group-hover:text-indigo-200 transition-colors" dangerouslySetInnerHTML={{__html: step.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}}></div></div>
                                        <div className="bg-indigo-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0"><CornerDownRight className="w-4 h-4 text-white" /></div>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/10 mb-6"><div className="prose prose-invert prose-lg font-medium leading-relaxed" dangerouslySetInnerHTML={{__html: content.replace(/\n/g, '<br/>')}}></div></div>
                    )}
                 </div>
            </div>
        );
    }

    const t_lower = title.toLowerCase();
    let timeLabel = (t?.info || "INFO").toUpperCase();
    if ((t_lower.includes('mattina') || t_lower.includes('morning')) && t?.morning) timeLabel = t.morning.toUpperCase();
    else if ((t_lower.includes('pranzo') || t_lower.includes('lunch')) && t?.lunch) timeLabel = t.lunch.toUpperCase();
    else if ((t_lower.includes('pomeriggio') || t_lower.includes('afternoon')) && t?.afternoon) timeLabel = t.afternoon.toUpperCase();
    else if ((t_lower.includes('cena') || t_lower.includes('dinner')) && t?.dinner) timeLabel = t.dinner.toUpperCase();
    else if ((t_lower.includes('notte') || t_lower.includes('overnight')) && t?.overnight) timeLabel = t.overnight.toUpperCase();

    let baseTitle = title.replace(/^(Mattina|Pomeriggio|Pranzo|Cena|Pernottamento|Sera|Morning|Afternoon|Lunch|Dinner|Overnight)[:\s-]*/i, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
    const boldMatch = baseTitle.match(/\*\*(.*?)\*\*/);
    let searchLocation = boldMatch ? boldMatch[1] : baseTitle.replace(/\*\*/g, '');
    const displayTitle = baseTitle.replace(/\*\*/g, '');
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayTitle)}`;

    const processedContent = content
        .replace(/\n/g, '<br/><br/>')
        .replace(/\*\*(.*?)\*\*/g, (match, p1) => {
            const query = encodeURIComponent(p1);
            return `<a href="https://www.google.com/search?q=${query}" target="_blank" rel="noopener noreferrer" class="font-black text-indigo-700 underline decoration-indigo-300 decoration-2 underline-offset-2 hover:text-indigo-900 hover:decoration-indigo-900 transition-all cursor-pointer" title="Search '${p1}'">${p1}</a>`;
        });

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 mb-10 transition-all hover:shadow-md group">
            <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-slate-100 border-b md:border-b-0 md:border-r border-slate-100 group">
                     <LocationPhotoCarousel title={displayTitle} className="w-full h-full min-h-[240px]" />
                </div>
                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><Clock className="w-3 h-3" /> {timeLabel}</span>
                        {familyBadge}
                    </div>
                    <a href={mapsLink} onClick={(e) => handleNavClick(e, displayTitle, mapsLink)} className="group/link block mb-4 cursor-pointer" title="Google Maps">
                        <h3 className="font-serif text-3xl font-bold text-slate-900 leading-tight group-hover/link:text-indigo-600 transition-colors flex items-center gap-2">
                            {displayTitle}
                            <div className="bg-indigo-50 p-1.5 rounded-full opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all"><ExternalLink className="w-4 h-4 text-indigo-600" /></div>
                        </h3>
                    </a>
                    <div className="prose prose-lg text-slate-600 leading-relaxed font-light" dangerouslySetInnerHTML={{__html: processedContent}}></div>
                </div>
            </div>
        </div>
    );
};

export const SummaryCard: React.FC<{ text: string, preferences: FamilyPreferences | any }> = ({ text, preferences }) => {
    const introMatch = text.match(/##\s*Intro([\s\S]*?)(?=METEO_VISUAL|##|$)/i);
    let intro = introMatch ? introMatch[1].trim() : "";
    if(!intro) {
        const fallbackMatch = text.match(/^([\s\S]*?)(?=METEO_VISUAL|##\s*Sabato|##\s*Domenica)/i);
        if (fallbackMatch && fallbackMatch[1].trim().length > 10) intro = fallbackMatch[1].trim();
    }
    const lines = intro.split('\n').filter(l => !l.includes('METEO_VISUAL:') && l.trim().length > 0);
    if (lines.length === 0) return null;

    const rawAdults = preferences.adultsData || [];
    const adultCount = rawAdults.length > 0 ? rawAdults.length : (preferences.adults || 2);
    
    const adults = (rawAdults.length > 0 ? rawAdults : Array.from({length: adultCount})).map((d: any, i: number) => {
        if (!d) return { role: `Adulto ${i+1}` }; 
        return { ...d, role: d.role || `Adulto ${i+1}` };
    });

    const children = preferences.children || preferences.savedChildren || [];
    const teamMembers = [...adults, ...children];

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white mb-12 shadow-2xl relative overflow-hidden isolate">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 -z-10"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 text-indigo-300 font-bold text-xs uppercase tracking-[0.2em] mb-6"><BookOpen className="w-4 h-4" /><span>Intro</span></div>
                <h2 className="font-serif text-4xl md:text-5xl mb-8 leading-tight font-black text-white">Adventure Start</h2>
                <div className="space-y-4 mb-16">
                    {lines.map((line, i) => (
                        <p key={i} className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light border-l-4 border-indigo-500/50 pl-6" dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')}}></p>
                    ))}
                </div>
                <div className="mt-8 pt-8 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-24 bg-indigo-500/40 blur-[50px] rounded-full -z-10"></div>
                    <p className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-[0.3em] mb-8 text-center">Team Esploratori</p>
                    <div className="flex justify-center items-center -space-x-10 md:-space-x-14 pb-6">
                        {teamMembers.map((member: any, i) => (
                            <div key={i} className="relative group transition-all duration-500 hover:-translate-y-6 hover:scale-110 hover:z-50" style={{ zIndex: i }}>
                                <div className="w-28 h-28 md:w-56 md:h-56 rounded-full border-4 md:border-8 border-white bg-slate-800 overflow-hidden relative shadow-2xl group-hover:shadow-[0_20px_60px_-10px_rgba(99,102,241,0.5)] transition-shadow">
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-100">
                                            {member.age ? <Smile className="w-10 h-10 md:w-20 md:h-20 opacity-30" /> : <User className="w-10 h-10 md:w-20 md:h-20 opacity-30" />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] md:text-xs font-black px-3 py-1 rounded-full shadow-lg border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    {member.name || member.role || `Membro ${i+1}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const WeatherTimeline: React.FC<{ rawText: string }> = ({ rawText }) => {
    const weatherData = useMemo(() => {
        const lines = rawText.split('\n');
        const days = [];
        for (const line of lines) {
            if (line.includes('METEO_VISUAL:')) {
                const parts = line.replace('METEO_VISUAL:', '').trim().split('|');
                if (parts.length >= 7) {
                    days.push({ day: parts[0].trim(), morningIcon: parts[1].trim(), morningTemp: parts[2].trim(), afternoonIcon: parts[3].trim(), afternoonTemp: parts[4].trim(), nightIcon: parts[5].trim(), nightTemp: parts[6].trim() });
                }
            }
        }
        return days;
    }, [rawText]);

    if (weatherData.length === 0) return null;

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {weatherData.map((d, i) => (
                <div key={i} className="flex-1 min-w-[220px] bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4"><span className="font-black text-slate-900 uppercase tracking-widest text-xs">{d.day}</span><CloudSun className="w-4 h-4 text-indigo-400" /></div>
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col items-center gap-2"><span className="text-3xl filter drop-shadow-sm">{d.morningIcon}</span><span className="text-sm font-bold text-slate-600">{d.morningTemp}</span></div>
                        <div className="w-px h-12 bg-slate-100"></div>
                        <div className="flex flex-col items-center gap-2"><span className="text-3xl filter drop-shadow-sm">{d.afternoonIcon}</span><span className="text-sm font-bold text-slate-600">{d.afternoonTemp}</span></div>
                        <div className="w-px h-12 bg-slate-100"></div>
                        <div className="flex flex-col items-center gap-2"><span className="text-3xl filter drop-shadow-sm">{d.nightIcon}</span><span className="text-sm font-bold text-slate-600">{d.nightTemp}</span></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PlanResultDisplay: React.FC<PlanResultProps> = ({ plan, preferences, onRegenerate, onSaveFavorite, onMarkComplete, isSaving, t }) => {
    
    function parseActivities(chunk: string) {
        if (!chunk) return [];
        let cleanText = chunk;
        if (!cleanText.includes('###')) {
            cleanText = cleanText.replace(/\n\s*\*\*([^\*]+)\*\*:?/g, '\n### $1');
        }
        const parts = cleanText.split(/###\s*/g).slice(1);
        return parts.map(p => {
            const lines = p.trim().split('\n');
            const rawTitle = lines[0].trim();
            const visualLine = lines.find(l => l.includes('VISUAL_SCENE:'));
            const geoLine = lines.find(l => l.includes('GEO_LOCATION:'));
            const content = lines.filter(l => !l.includes('VISUAL_SCENE:') && !l.includes('GEO_LOCATION:') && l !== rawTitle && l.trim().length > 0).join('\n');
            const displayTitle = rawTitle.replace(/:$/, '');
            const geoLocation = geoLine ? geoLine.replace(/GEO_LOCATION:/i, '').trim() : undefined;
            return { title: displayTitle, content, visualLine, geoLocation };
        })
        .filter(a => a.title.length < 100 && !a.title.toUpperCase().includes("DATA_MARKER")); 
    }

    const extractSectionFromChunk = (chunk: string, headerPattern: string) => {
        const lines = chunk.split('\n');
        let capturedLines: string[] = [];
        let isCapturing = false;
        const startRegex = new RegExp(`^(##|\\*\\*)\\s*.*${headerPattern}`, 'i');
        const stopRegex = /^(##\s+.*|###\s+(Budget|Trasporti|Zaino|Pack|Missioni|Missions|Favola|Story|Sabato|Saturday|Sábado|Samedi|Samstag|Domenica|Sunday|Domingo|DATA_MARKER))/i;

        for (const line of lines) {
            const trimLine = line.trim();
            if (!isCapturing) { 
                if (startRegex.test(trimLine)) isCapturing = true; 
            } else { 
                if (stopRegex.test(trimLine)) break; 
                capturedLines.push(line); 
            }
        }
        return capturedLines.length > 0 ? capturedLines.join('\n').trim() : null;
    };

    const structuredDays = useMemo(() => {
        const days: { title: string, activities: any[], raw: string, fullChunk: string }[] = [];
        const fullText = plan.text;
        
        const satRegex = /(^|\n)##\s*(Sabato|Saturday|Sábado|Samedi|Samstag)/i;
        const sunRegex = /(^|\n)##\s*(Domenica|Sunday|Domingo|Dimanche|Sonntag)/i;
        const satMatch = fullText.match(satRegex);
        const sunMatch = fullText.match(sunRegex);
        const satIndex = satMatch ? satMatch.index! : -1;
        const sunIndex = sunMatch ? sunMatch.index! : -1;
        
        if (satIndex !== -1) {
            const fullSatChunk = (sunIndex !== -1 && sunIndex > satIndex) ? fullText.substring(satIndex, sunIndex) : fullText.substring(satIndex);
            let cleanSatChunk = fullSatChunk.replace(/(^|\n)##\s*(Sabato|Saturday|Sábado|Samedi|Samstag).*/i, ''); 
            const nextSection = cleanSatChunk.search(/(^|\n)##\s*(Missioni|Missions|Favola|Story|Budget|Trasporti|Zaino|Sabato|Saturday|Sábado|Samedi|Samstag|Domenica|Sunday|Domingo|DATA_MARKER)/i);
             if (nextSection !== -1) cleanSatChunk = cleanSatChunk.substring(0, nextSection);
            const acts = parseActivities(cleanSatChunk);
            const title = satMatch ? satMatch[2] : t.saturday;
            if (acts.length > 0) days.push({ title: title, activities: acts, raw: title, fullChunk: fullSatChunk }); 
        }
        
        if (sunIndex !== -1) {
            const fullSunChunk = fullText.substring(sunIndex);
            let cleanSunChunk = fullSunChunk.replace(/(^|\n)##\s*(Domenica|Sunday|Domingo|Dimanche|Sonntag).*/i, '');
            const nextSection = cleanSunChunk.search(/(^|\n)##\s*(Budget|Trasporti|Zaino|Missioni|Missions|Favola|Story|Sabato|Saturday|Sábado|Samedi|Samstag|Domenica|Sunday|Domingo|DATA_MARKER)/i);
            if (nextSection !== -1) cleanSunChunk = cleanSunChunk.substring(0, nextSection);
            const acts = parseActivities(cleanSunChunk);
            const title = sunMatch ? sunMatch[2] : t.sunday;
            if (acts.length > 0) days.push({ title: title, activities: acts, raw: title, fullChunk: fullSunChunk });
        }
        return days;
    }, [plan.text, t]);

    // Custom SVGs with ID isolation
    const PixarCastle = ({ className }: { className?: string }) => {
        const uid = useId();
        return (
        <svg viewBox="0 0 400 300" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id={`skyGradient-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <linearGradient id={`castleGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbcfe8" />
                    <stop offset="50%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
                <linearGradient id={`roofGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <filter id={`glow-${uid}`}>
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect width="400" height="300" fill={`url(#skyGradient-${uid})`} />
            <g filter={`url(#glow-${uid})`}>
                <circle cx="80" cy="60" r="2" fill="#fcd34d" className="animate-ping" style={{animationDuration: '3s'}} />
                <path d="M80,60 L60,40 M80,60 L100,40 M80,60 L80,30 M80,60 L60,80 M80,60 L100,80" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <circle cx="320" cy="80" r="2" fill="#60a5fa" className="animate-ping" style={{animationDuration: '2.5s', animationDelay: '1s'}} />
                <path d="M320,80 L300,60 M320,80 L340,60 M320,80 L320,50 M320,80 L300,100 M320,80 L340,100" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <circle cx="200" cy="40" r="3" fill="#f472b6" className="animate-ping" style={{animationDuration: '4s', animationDelay: '0.5s'}} />
                 <path d="M200,40 L180,10 M200,40 L220,10 M200,40 L170,40 M200,40 L230,40 M200,40 L180,70 M200,40 L220,70" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
            <circle cx="50" cy="150" r="1" fill="white" className="animate-pulse" />
            <circle cx="350" cy="120" r="1.5" fill="white" className="animate-pulse" style={{animationDelay: '1s'}} />
            <path d="M80,300 L320,300 L320,220 L280,220 L280,180 L200,150 L120,180 L120,220 L80,220 Z" fill={`url(#castleGradient-${uid})`} stroke="#831843" strokeWidth="2" />
            <rect x="180" y="150" width="40" height="150" fill={`url(#castleGradient-${uid})`} />
            <path d="M170,150 L230,150 L200,60 Z" fill={`url(#roofGradient-${uid})`} />
            <rect x="100" y="180" width="30" height="120" fill={`url(#castleGradient-${uid})`} />
            <path d="M90,180 L140,180 L115,120 Z" fill={`url(#roofGradient-${uid})`} />
            <rect x="270" y="180" width="30" height="120" fill={`url(#castleGradient-${uid})`} />
            <path d="M260,180 L310,180 L285,120 Z" fill={`url(#roofGradient-${uid})`} />
            <rect x="195" y="180" width="10" height="15" rx="5" fill="#fef08a" />
            <rect x="110" y="200" width="10" height="15" rx="5" fill="#fef08a" />
            <rect x="280" y="200" width="10" height="15" rx="5" fill="#fef08a" />
            <path d="M170,300 L230,300 L230,260 A30,30 0 0,0 170,260 Z" fill="#4a044e" />
            <circle cx="200" cy="290" r="15" fill="#fef08a" opacity="0.6" filter={`url(#glow-${uid})`} />
        </svg>
        );
    };

    const PixarBackpack = ({ className }: { className?: string }) => {
        const uid = useId();
        return (
        <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={`bagGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" /> 
                    <stop offset="100%" stopColor="#d97706" /> 
                </linearGradient>
                <filter id={`shadow-${uid}`}>
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
                </filter>
            </defs>
            <path d="M80,40 Q100,20 120,40" fill="none" stroke="#92400e" strokeWidth="8" strokeLinecap="round" />
            <rect x="50" y="40" width="100" height="120" rx="20" fill={`url(#bagGradient-${uid})`} filter={`url(#shadow-${uid})`} />
            <rect x="60" y="100" width="80" height="50" rx="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
            <path d="M55,55 L145,55" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
            <circle cx="100" cy="125" r="10" fill="#fff" />
            <circle cx="100" cy="125" r="4" fill="#ef4444" />
            <path d="M60,50 Q100,50 140,50 Q130,70 100,70 Q70,70 60,50" fill="white" opacity="0.2" />
        </svg>
        );
    };

    const PixarBinoculars = ({ className }: { className?: string }) => {
        const uid = useId();
        return (
        <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={`binocGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" /> 
                    <stop offset="100%" stopColor="#4338ca" /> 
                </linearGradient>
                <linearGradient id={`lensGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#93c5fd" /> 
                    <stop offset="100%" stopColor="#1d4ed8" /> 
                </linearGradient>
                <filter id={`shadowBinocPlan-${uid}`}>
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
                </filter>
            </defs>
            <rect x="70" y="90" width="60" height="20" rx="5" fill="#312e81" />
            <rect x="40" y="60" width="50" height="90" rx="15" fill={`url(#binocGradientPlan-${uid})`} filter={`url(#shadowBinocPlan-${uid})`} />
            <circle cx="65" cy="75" r="18" fill={`url(#lensGradientPlan-${uid})`} stroke="#1e1b4b" strokeWidth="3" />
            <circle cx="65" cy="75" r="8" fill="white" opacity="0.3" />
            <rect x="110" y="60" width="50" height="90" rx="15" fill={`url(#binocGradientPlan-${uid})`} filter={`url(#shadowBinocPlan-${uid})`} />
            <circle cx="135" cy="75" r="18" fill={`url(#lensGradientPlan-${uid})`} stroke="#1e1b4b" strokeWidth="3" />
            <circle cx="135" cy="75" r="8" fill="white" opacity="0.3" />
            <circle cx="45" cy="100" r="3" fill="#1e1b4b" />
            <circle cx="155" cy="100" r="3" fill="#1e1b4b" />
        </svg>
        );
    };

    const PixarTransport = ({ className }: { className?: string }) => {
        const uid = useId();
        return (
        <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={`trainGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id={`carGradientPlan-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <filter id={`shadowTransportPlan-${uid}`}>
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
                </filter>
            </defs>
            <g transform="translate(10, 40)">
                <rect x="10" y="20" width="80" height="60" rx="5" fill={`url(#trainGradientPlan-${uid})`} filter={`url(#shadowTransportPlan-${uid})`} />
                <rect x="60" y="0" width="20" height="20" rx="2" fill="#1e40af" />
                <rect x="20" y="30" width="20" height="20" rx="2" fill="#bfdbfe" />
                <rect x="50" y="30" width="20" height="20" rx="2" fill="#bfdbfe" />
                <circle cx="30" cy="80" r="12" fill="#172554" stroke="#60a5fa" strokeWidth="2" />
                <circle cx="70" cy="80" r="12" fill="#172554" stroke="#60a5fa" strokeWidth="2" />
                <path d="M10,60 L0,80 L20,80 Z" fill="#1e3a8a" />
            </g>
            <g transform="translate(80, 80)">
                <path d="M10,30 Q20,0 50,0 T90,30 Z" fill={`url(#carGradientPlan-${uid})`} />
                <rect x="0" y="30" width="100" height="40" rx="10" fill={`url(#carGradientPlan-${uid})`} filter={`url(#shadowTransportPlan-${uid})`} />
                <path d="M20,30 L25,10 L75,10 L80,30 Z" fill="#fee2e2" />
                <circle cx="25" cy="70" r="12" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
                <circle cx="75" cy="70" r="12" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
                <circle cx="95" cy="40" r="4" fill="#fef08a" />
            </g>
        </svg>
        );
    };

    const PixarDoubloons = ({ className }: { className?: string }) => {
        const uid = useId();
        return (
        <svg viewBox="0 0 240 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={`coinGrad1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <linearGradient id={`coinGrad2-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id={`doubloonShadow-${uid}`}>
                    <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.4" />
                </filter>
            </defs>
            <g transform="translate(40, 30) rotate(-10)">
                <circle cx="80" cy="80" r="75" fill={`url(#coinGrad1-${uid})`} filter={`url(#doubloonShadow-${uid})`} stroke="#78350f" strokeWidth="2" />
                <circle cx="80" cy="80" r="60" fill={`url(#coinGrad2-${uid})`} stroke="#b45309" strokeWidth="3" opacity="0.9" />
                <path d="M80 50 L88 68 L108 68 L92 82 L98 102 L80 90 L62 102 L68 82 L52 68 L72 68 Z" fill="#92400e" opacity="0.6" />
                <circle cx="55" cy="55" r="4" fill="white" opacity="0.4" />
            </g>
            <g transform="translate(100, 50) rotate(5)">
                <circle cx="80" cy="80" r="75" fill={`url(#coinGrad1-${uid})`} filter={`url(#doubloonShadow-${uid})`} stroke="#78350f" strokeWidth="2" />
                <circle cx="80" cy="80" r="60" fill={`url(#coinGrad2-${uid})`} stroke="#b45309" strokeWidth="3" />
                <path d="M80 50 L88 68 L108 68 L92 82 L98 102 L80 90 L62 102 L68 82 L52 68 L72 68 Z" fill="#92400e" opacity="0.8" />
                <path d="M50 50 Q 80 40 110 50" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
                <circle cx="55" cy="55" r="5" fill="white" opacity="0.5" />
            </g>
        </svg>
        );
    };

    return (
        <div className="pb-32">
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in-up">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-xs font-bold leading-relaxed">{t.verify_disclaimer}</p>
            </div>

            <SummaryCard text={plan.text} preferences={preferences} />

      
      
      
      {/* ?? TIMELINE METEO ORARIA DINAMICA */}
      <HourlyWeatherTimeline
        dayName={preferences.selectedDate ? new Date(preferences.selectedDate).toLocaleDateString() : 'Weekend'}
        meteoLine={plan.text.split('\n').find(l => l.includes('METEO_VISUAL:'))?.replace('METEO_VISUAL:', '').trim()}
      />


            <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-stone-200 mb-12 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-wider"><CheckCircle className="w-4 h-4 text-emerald-500" /> {t.ready_itinerary}</div>
                <div className="flex gap-2">
                    <button onClick={onRegenerate} disabled={isSaving} className="px-3 md:px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-slate-600 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"><RotateCcw className="w-4 h-4" /> <span className="hidden md:inline">{t.regenerate}</span></button>
                    <SocialShareMenu title="Il mio weekend Family Weekend!" text={`Guarda il programma che ho creato per il weekend del ${new Date(preferences.selectedDate).toLocaleDateString()}!`} />
                    <button onClick={() => onSaveFavorite()} disabled={isSaving} className="px-3 md:px-5 py-2.5 bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-2"><Star className="w-4 h-4" /> <span className="hidden md:inline">{t.favorite_all}</span></button>
                    <button onClick={() => onMarkComplete()} disabled={isSaving} className="px-5 md:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"><CheckCircle className="w-4 h-4" /> {t.save_all}</button>
                </div>
            </div>

            <div className="mb-16"><h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6 flex items-center gap-2 pl-2"><CloudSun className="w-4 h-4"/> {t.weather}</h4><WeatherTimeline rawText={plan.text} /></div>

            <div className="space-y-24">
                {structuredDays.map((day, idx) => {
                    const missions = extractSectionFromChunk(day.fullChunk, `(Missioni|Missions|Misiones|Missionen)`);
                    const story = extractSectionFromChunk(day.fullChunk, `(Favola|Story|Cuento|Conte|Geschichte)`);
                    const budget = extractSectionFromChunk(day.fullChunk, `(Budget|Presupuesto)`);
                    const transport = extractSectionFromChunk(day.fullChunk, `(Trasporti|Transport|Transporte)`);
                    const packing = extractSectionFromChunk(day.fullChunk, `(Zaino|Backpack|Mochila|Sac à dos|Rucksack)`);
                    
                    // Extract clean locations for navigation
                    const dayLocations = day.activities
                        .filter(a => !/navigazione|navigation|navegación/i.test(a.title))
                        .map(a => {
                            let name = a.title.replace(/\*\*/g, '');
                            name = name.replace(/^(Mattina|Pomeriggio|Pranzo|Cena|Pernottamento|Sera|Morning|Afternoon|Lunch|Dinner|Overnight)[:\s-]*/i, '');
                            return name.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
                        }).filter(n => n.length > 2);

                    const googleMapsUrl = dayLocations.length > 0 ?
                        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(preferences.manualLocation || 'Current Location')}&destination=${encodeURIComponent(dayLocations[dayLocations.length - 1])}&waypoints=${dayLocations.slice(0, -1).map(l => encodeURIComponent(l)).join('|')}&travelmode=driving`
                        : null;

                    return (
                    <section key={idx} className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-6 gap-4">
                            <h2 className="font-serif text-5xl font-black text-slate-900">{day.title}</h2>

                        
                            <div className="flex gap-2">
                                <SocialShareMenu isCompact title={`Cosa faremo ${day.title}`} text={`Ecco il programma per ${day.title}!`} />
                                <button onClick={() => onSaveFavorite(day.raw)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors border border-amber-200 flex items-center gap-1"><Star className="w-3 h-3"/> {t.favorite_day}</button>
                                <button onClick={() => onMarkComplete(day.raw)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors border border-indigo-100">{t.save_active}</button>
                            </div>
                        </div>

                        {/* ??? MAPPA DEDICATA PER IL GIORNO (SABATO / DOMENICA) */}
                        <div className="my-8 animate-fade-in">
                          <ItineraryRouteMap
                            waypoints={day.activities.map(a => ({
                              title: a.title,
                              visualLine: a.visualLine,
                              geoLocation: a.geoLocation
                            }))}
                            familyAvatarUrl={preferences?.children?.[0]?.avatarUrl || preferences?.adultsData?.[0]?.avatarUrl}
                            dayTitle={`Mappa Percorso - ${day.title}`}
                            baseCity={preferences.manualLocation || 'Italia'}
                            onSelectWaypoint={(wIdx) => {
                              const el = document.getElementById(`activity-card-${idx}-${wIdx}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {day.activities.map((act, actIdx) => (
                                <ActivityCard 
                                    key={actIdx} 
                                    title={act.title} 
                                    content={act.content} 
                                    visualLine={act.visualLine} 
                                    t={t} 
                                    googleMapsUrl={/navigazione|navigation|navegación/i.test(act.title) ? googleMapsUrl : null}
                                />
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                             {missions && (
                                <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 relative overflow-hidden group">
                                    <div className="flex flex-col items-center mb-6">
                                         <PixarBinoculars className="w-32 h-32 drop-shadow-2xl hover:scale-110 transition-transform duration-500 mb-4" />
                                         <h3 className="font-bold text-amber-900 flex items-center gap-2 text-xl font-serif relative z-10">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500"/> {t.missions}
                                         </h3>
                                    </div>
                                    <div className="prose prose-amber prose-sm font-medium relative z-10 leading-relaxed" dangerouslySetInnerHTML={{__html: missions.replace(/\n/g, '<br/>')}}></div>
                                </div>
                             )}
                            
                            {story && (
                                <div className="bg-[#0f172a] rounded-[2.5rem] relative overflow-hidden shadow-2xl group border-4 border-[#1e293b] isolate">
                                    <div className="relative h-64 md:h-80 w-full overflow-hidden">
                                        <PixarCastle className="w-full h-full object-cover transition-transform duration-[40s] ease-linear group-hover:scale-110 saturate-150 contrast-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
                                        
                                        <div className="absolute bottom-6 left-8 right-8 flex items-center gap-4 z-10">
                                            <div className="relative shrink-0">
                                                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                                                <div className="bg-gradient-to-br from-yellow-300 to-amber-500 p-3 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.4)] border border-yellow-200/50 relative">
                                                    <Moon className="w-8 h-8 text-white fill-white drop-shadow-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-100 tracking-wide drop-shadow-sm filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{t.story}</h3>
                                                <p className="text-indigo-200 font-bold text-xs tracking-[0.3em] uppercase mt-1 opacity-90 text-shadow-sm">Bedtime Magic Story</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 md:p-10 relative z-10">
                                        <div className="bg-black/20 backdrop-blur-sm rounded-[1.5rem] p-6 md:p-8 border border-white/5 shadow-inner">
                                            <div className="prose prose-invert prose-lg font-serif italic leading-loose text-indigo-100/90" dangerouslySetInnerHTML={{__html: story.replace(/\n/g, '<br/>')}}></div>
                                        </div>
                                        
                                        <div className="absolute -top-10 right-8 animate-bounce-slow opacity-60 pointer-events-none"><Sparkles className="w-8 h-8 text-yellow-200" /></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(budget || transport || packing) && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {budget && <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 pointer-events-none group-hover:opacity-20 transition-opacity">
                                        <Coins className="w-48 h-48 opacity-10 text-yellow-500" />
                                    </div>
                                    <div className="flex justify-center mb-6 mt-4">
                                            <PixarDoubloons className="w-32 h-32 drop-shadow-2xl hover:scale-110 transition-transform duration-500 object-contain rounded-xl" />
                                    </div>
                                    <h4 className="font-bold text-emerald-600 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10"><Coins className="w-4 h-4"/> {t.budget}</h4>
                                    <div className="text-slate-600 text-sm leading-relaxed relative z-10" dangerouslySetInnerHTML={{__html: budget.replace(/\n/g, '<br/>')}}></div>
                                </div>}
                                {transport && <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 pointer-events-none group-hover:opacity-20 transition-opacity">
                                        <div className="flex">
                                            <TrainFront className="w-24 h-24 text-indigo-500" />
                                            <Car className="w-24 h-24 text-rose-500 -ml-8" />
                                        </div>
                                    </div>
                                    <div className="flex justify-center mb-6">
                                            <PixarTransport className="w-32 h-32 drop-shadow-2xl hover:scale-110 transition-transform duration-500 object-contain rounded-xl" />
                                    </div>
                                    <h4 className="font-bold text-indigo-600 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10">
                                        <div className="flex bg-indigo-100 p-1 rounded-lg">
                                            <TrainFront className="w-3 h-3 text-indigo-600"/>
                                            <Car className="w-3 h-3 text-indigo-600"/>
                                        </div>
                                        {t.transport}
                                    </h4>
                                    <div className="text-slate-600 text-sm leading-relaxed relative z-10" dangerouslySetInnerHTML={{__html: transport.replace(/\n/g, '<br/>')}}></div>
                                </div>}
                                
                                {packing && <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 pointer-events-none group-hover:opacity-20 transition-opacity">
                                        <Backpack className="w-48 h-48 opacity-10 text-rose-500" />
                                    </div>
                                    <div className="flex justify-center mb-6">
                                         <PixarBackpack className="w-32 h-32 drop-shadow-2xl hover:scale-110 transition-transform duration-500 object-contain rounded-xl" />
                                    </div>
                                    <h4 className="font-bold text-rose-600 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10"><Flag className="w-4 h-4"/> {t.backpack}</h4>
                                    <div className="text-slate-600 text-sm leading-relaxed relative z-10" dangerouslySetInnerHTML={{__html: packing.replace(/\n/g, '<br/>').replace(/- /g, '• ')}}></div>
                                </div>}
                            </div>
                        )}
                    </section>
                )})}
                
                {structuredDays.length === 0 && (
                     <div className="p-10 bg-rose-50 text-rose-800 rounded-3xl border border-rose-100"><h3 className="font-bold text-xl mb-2">Ops!</h3><p className="mb-4">Format not recognized, but here is the text:</p><pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-white/50 p-4 rounded-xl">{plan.text}</pre></div>
                )}
            </div>

            {plan.groundingChunks && plan.groundingChunks.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Google Sources</p>
                    <div className="flex flex-wrap gap-3">
                        {plan.groundingChunks.map((c, i) => (
                            <a key={i} href={c.web?.uri || c.maps?.uri} target="_blank" rel="noopener" className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 truncate max-w-[300px] flex items-center gap-2 transition-all hover:scale-105 shadow-sm">
                                <Search className="w-3 h-3 text-slate-400" />
                                {c.web?.title || c.maps?.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SavedPlan, VisitedLocation } from '../types';
import { MapPin, Trophy, Navigation, Compass, Lock, Unlock, Star, Trees, Castle, Utensils, PawPrint, Tent, Play, Loader2, Crown, Camera, Printer, X, Sparkles, User, Medal, Gem, Droplets, BookOpen, ChevronRight, Target, Smile, Quote, FileDown, Share2, Link as LinkIcon, Check, Mail, MessageCircle, Facebook, Instagram, Music2 } from 'lucide-react';
import { generateCertificateImage } from '../services/geminiService';

interface WorldMapProps {
  plans: SavedPlan[];
  t: any;
}

// --- LOCALIZATION FOR WORLD MAP ---
const WORLD_MAP_LABELS: any = {
    it: {
        levels: [
            { title: "Pulcino Curioso", motto: "Ogni grande viaggio inizia con un piccolo battito d'ali." },
            { title: "Muovi Passi", motto: "Il mondo è un libro, e tu hai appena iniziato a leggerlo." },
            { title: "Zaino in Spalla", motto: "L'avventura ti aspetta, e tu sei pronto a incontrarla!" },
            { title: "Cercatore di Sentieri", motto: "Non smettere mai di esplorare quello che c'è oltre l'orizzonte." },
            { title: "Bussola d’Oro", motto: "Il tuo cuore sa sempre qual è la strada giusta per la felicità." },
            { title: "Guardiano dei Boschi", motto: "Proteggi la natura e lei ti svelerà i suoi segreti più antichi." },
            { title: "Occhio di Lince", motto: "Vedi la magia dove gli altri vedono solo un prato." },
            { title: "Veterano delle Avventure", motto: "Sei la guida che ogni famiglia sogna di avere." },
            { title: "Leggenda del Weekend", motto: "Le tue storie vivranno per sempre nel cuore di chi ti ama." }
        ],
        cats: { nature: "Natura", culture: "Storia & Musei", food: "Gastronomia", animal: "Amici Animali", water: "Relax & Acqua" }
    },
    en: {
        levels: [
            { title: "Curious Chick", motto: "Every great journey begins with a small flutter of wings." },
            { title: "First Steps", motto: "The world is a book, and you've just started reading it." },
            { title: "Backpacker", motto: "Adventure awaits, and you are ready to meet it!" },
            { title: "Pathfinder", motto: "Never stop exploring what lies beyond the horizon." },
            { title: "Golden Compass", motto: "Your heart always knows the right path to happiness." },
            { title: "Forest Guardian", motto: "Protect nature and she will reveal her ancient secrets." },
            { title: "Lynx Eye", motto: "You see magic where others just see a meadow." },
            { title: "Adventure Veteran", motto: "You are the guide every family dreams of." },
            { title: "Weekend Legend", motto: "Your stories will live forever in the hearts of those who love you." }
        ],
        cats: { nature: "Nature", culture: "History & Museums", food: "Food & Drink", animal: "Animal Friends", water: "Relax & Water" }
    },
    es: {
        levels: [
            { title: "Pollito Curioso", motto: "Todo gran viaje comienza con un pequeño aleteo." },
            { title: "Primeros Pasos", motto: "El mundo es un libro y acabas de empezar a leerlo." },
            { title: "Mochilero", motto: "¡La aventura te espera y estás listo para encontrarla!" },
            { title: "Rastreador", motto: "Nunca dejes de explorar lo que hay más allá del horizonte." },
            { title: "Brújula Dorada", motto: "Tu corazón siempre conoce el camino correcto hacia la felicidad." },
            { title: "Guardián del Bosque", motto: "Protege la naturaleza y ella te revelará sus secretos antiguos." },
            { title: "Ojo de Lince", motto: "Ves magia donde otros solo ven un prado." },
            { title: "Veterano de Aventuras", motto: "Eres la guía con la que sueña toda familia." },
            { title: "Leyenda del Fin de Semana", motto: "Tus historias vivirán para siempre en los corazones de quienes te aman." }
        ],
        cats: { nature: "Naturaleza", culture: "Historia y Museos", food: "Gastronomía", animal: "Amigos Animales", water: "Relax y Agua" }
    },
    de: {
        levels: [
            { title: "Neugieriges Küken", motto: "Jede große Reise beginnt mit einem kleinen Flügelschlag." },
            { title: "Erste Schritte", motto: "Die Welt ist ein Buch, und du hast gerade erst angefangen zu lesen." },
            { title: "Rucksacktourist", motto: "Das Abenteuer wartet, und du bist bereit!" },
            { title: "Pfadfinder", motto: "Höre nie auf zu entdecken, was hinter dem Horizont liegt." },
            { title: "Goldener Kompass", motto: "Dein Herz kennt immer den richtigen Weg zum Glück." },
            { title: "Waldwächter", motto: "Schütze die Natur und sie wird dir ihre alten Geheimnisse offenbaren." },
            { title: "Luchsauge", motto: "Du siehst Magie, wo andere nur eine Wiese sehen." },
            { title: "Abenteuer-Veteran", motto: "Du bist der Führer, von dem jede Familie träumt." },
            { title: "Wochenend-Legende", motto: "Deine Geschichten werden für immer in den Herzen deiner Lieben leben." }
        ],
        cats: { nature: "Natur", culture: "Geschichte & Museen", food: "Gastronomie", animal: "Tierfreunde", water: "Entspannung & Wasser" }
    }
};

// --- LOGO MONGOLFIERA UFFICIALE (HEART VERSION) ---
const BalloonLogoCert: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 70C50 70 20 50 20 32C20 20 32 15 42 22C45 24 50 30 50 30C50 30 55 24 58 22C68 15 80 20 80 32C80 50 50 70 50 70Z" fill="#eef2ff" stroke="#4f46e5" strokeWidth="2" />
    <path d="M43 70L45 85H55L57 70" stroke="#818cf8" strokeWidth="1.5" />
    <rect x="44" y="85" width="12" height="6" rx="1" fill="#b45309" />
    <path d="M35 30C38 25 45 25 50 25C55 25 62 25 65 30" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// --- PIXAR STYLE LEVEL ICONS ---
const PixarIconWrapper = ({ children, color = "indigo" }: { children?: React.ReactNode, color?: string }) => (
    <div className="relative group transition-transform duration-500 hover:scale-110">
        <div className={`absolute inset-0 bg-${color}-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 animate-pulse`}></div>
        <div className="relative bg-white p-3 rounded-[1.25rem] shadow-[0_10px_20px_rgba(0,0,0,0.1),inset_0_-4px_0_rgba(0,0,0,0.05)] border-2 border-slate-100 flex items-center justify-center overflow-hidden">
            {children}
        </div>
    </div>
);

const Level1Pulcino = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <ellipse cx="50" cy="55" rx="35" ry="40" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <path d="M15 55 L30 45 L45 55 L60 45 L75 55 L85 45" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="42" cy="35" r="4" fill="#1e293b" />
        <circle cx="58" cy="35" r="4" fill="#1e293b" />
        <path d="M45 42 L50 48 L55 42" fill="#ea580c" />
    </svg>
);

const Level2Passi = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <rect x="20" y="40" width="60" height="30" rx="15" fill="#60a5fa" />
        <path d="M20 55 Q20 30 50 30 L80 40 L80 55" fill="#2563eb" opacity="0.8" />
        <rect x="25" y="65" width="50" height="8" rx="4" fill="#fff" />
    </svg>
);

const Level3Zaino = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <rect x="25" y="25" width="50" height="60" rx="10" fill="#fb923c" />
        <rect x="30" y="55" width="40" height="25" rx="5" fill="#f59e0b" />
        <path d="M35 25 Q50 10 65 25" fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
    </svg>
);

const Level4Mappa = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <rect x="15" y="20" width="70" height="60" rx="5" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <path d="M15 20 L40 30 L60 20 L85 30 L85 80 L60 70 L40 80 L15 70 Z" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
        <circle cx="50" cy="50" r="4" fill="#ef4444" />
    </svg>
);

const Level5Bussola = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <circle cx="50" cy="50" r="40" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" fill="#fff" />
        <path d="M50 25 L55 50 L50 75 L45 50 Z" fill="#ef4444" />
        <circle cx="50" cy="50" r="3" fill="#1e293b" />
    </svg>
);

const Level6Bosco = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M50 15 L80 70 L20 70 Z" fill="#22c55e" />
        <rect x="45" y="70" width="10" height="15" fill="#78350f" />
    </svg>
);

const Level7Lince = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <circle cx="50" cy="50" r="22" fill="#3b82f6" />
        <circle cx="50" cy="50" r="10" fill="#000" />
        <circle cx="42" cy="42" r="4" fill="#fff" opacity="0.8" />
    </svg>
);

const Level8Veterano = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M20 20 L80 80 M80 20 L20 80" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="50" r="15" fill="#ef4444" stroke="#fff" strokeWidth="3" />
    </svg>
);

const Level9Leggenda = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M20 70 L20 30 L40 50 L50 20 L60 50 L80 30 L80 70 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
    </svg>
);

const getLevels = (lang: string = 'it') => {
    const txt = WORLD_MAP_LABELS[lang] || WORLD_MAP_LABELS['it'];
    const levels = txt.levels;
    return [
    { min: 0, max: 399, title: levels[0].title, motto: levels[0].motto, icon: <Level1Pulcino />, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", brand: "yellow" },
    { min: 400, max: 999, title: levels[1].title, motto: levels[1].motto, icon: <Level2Passi />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", brand: "blue" },
    { min: 1000, max: 1999, title: levels[2].title, motto: levels[2].motto, icon: <Level3Zaino />, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", brand: "orange" },
    { min: 2000, max: 3499, title: levels[3].title, motto: levels[3].motto, icon: <Level4Mappa />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", brand: "emerald" },
    { min: 3500, max: 5499, title: levels[4].title, motto: levels[4].motto, icon: <Level5Bussola />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", brand: "amber" },
    { min: 5500, max: 7999, title: levels[5].title, motto: levels[5].motto, icon: <Level6Bosco />, color: "text-green-800", bg: "bg-green-50", border: "border-green-200", brand: "green" },
    { min: 8000, max: 11999, title: levels[6].title, motto: levels[6].motto, icon: <Level7Lince />, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", brand: "cyan" },
    { min: 12000, max: 19999, title: levels[7].title, motto: levels[7].motto, icon: <Level8Veterano />, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", brand: "red" },
    { min: 20000, max: 999999, title: levels[8].title, motto: levels[8].motto, icon: <Level9Leggenda />, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", brand: "purple" },
    ];
};

const getLevelInfo = (score: number, lang: string) => {
    const levels = getLevels(lang);
    return levels.find(l => score >= l.min && score <= l.max) || levels[levels.length - 1];
};

const getNextLevel = (score: number, lang: string) => {
    const levels = getLevels(lang);
    return levels.find(l => score < l.min);
};

const ExplorerLevelsReference: React.FC<{lang: string}> = ({lang}) => {
    const levels = getLevels(lang);
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mx-4 mb-8 no-print">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Medal className="w-5 h-5" /></div>
                <h4 className="font-serif font-bold text-xl text-slate-800">Guida ai Livelli Esploratore</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map((lvl, idx) => (
                    <div key={idx} className={`p-6 rounded-[2rem] border-2 ${lvl.bg} ${lvl.border} flex flex-col items-center text-center transition-all hover:shadow-xl hover:scale-[1.02] relative overflow-hidden group`}>
                        <PixarIconWrapper color={lvl.brand}>{lvl.icon}</PixarIconWrapper>
                        <h5 className={`font-black text-sm uppercase tracking-wider mt-4 mb-1 ${lvl.color} relative z-10`}>{lvl.title}</h5>
                        <p className="text-[10px] text-slate-500 font-medium italic mb-2 relative z-10 px-4 leading-tight">"{lvl.motto}"</p>
                        <div className="bg-white/80 px-3 py-0.5 rounded-full border border-black/5 relative z-10 backdrop-blur-sm shadow-sm">
                            <span className="text-[10px] font-black text-slate-500">{lvl.max > 100000 ? `${lvl.min}+ pt` : `${lvl.min} pt`}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LeaderboardSection: React.FC<{ plans: SavedPlan[], t: any, lang: string }> = ({ plans, t, lang }) => {
    const [selectedChild, setSelectedChild] = useState<{name: string, score: number, avatarUrl?: string, level: any} | null>(null);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const [certificateImg, setCertificateImg] = useState<string | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    const scores = useMemo(() => {
        const tally: Record<string, { score: number, avatarUrl?: string }> = {};
        plans.forEach(plan => {
            (plan.savedChildren || []).forEach(c => {
                if (!c || !c.name) return;
                const cleanName = c.name.trim();
                if (cleanName) {
                    if (!tally[cleanName]) tally[cleanName] = { score: 0 };
                    if (c.avatarUrl) tally[cleanName].avatarUrl = c.avatarUrl;
                }
            });
            (plan.missionScores || []).forEach(s => {
                if (!s || !s.childName) return;
                const name = s.childName.trim();
                if (name) {
                    if (!tally[name]) tally[name] = { score: 0 };
                    tally[name].score += (s.score || 0);
                }
            });
        });
        return Object.entries(tally)
            .map(([name, data]) => ({ name, score: data.score, avatarUrl: data.avatarUrl }))
            .sort((a, b) => b.score - a.score);
    }, [plans]);

    const handleChildClick = async (child: {name: string, score: number, avatarUrl?: string}) => {
        const lvl = getLevelInfo(child.score, lang);
        setSelectedChild({ ...child, level: lvl });
        setCertificateImg(null);

        if (child.avatarUrl) {
            setIsGeneratingCert(true);
            try {
                const cleanBase64 = child.avatarUrl.split(',')[1] || child.avatarUrl;
                const resultImg = await generateCertificateImage(cleanBase64, lvl.title);
                setCertificateImg(resultImg);
            } catch (error) {
                console.error("Auto-cert error:", error);
            } finally {
                setIsGeneratingCert(false);
            }
        }
    };

    const handleSocialShare = async (platform: 'whatsapp' | 'facebook' | 'mail' | 'instagram' | 'tiktok' | 'system') => {
        if (!selectedChild) return;

        const shareTitle = `Certificato Esploratore di ${selectedChild.name}`;
        const shareText = `Ehi! Guarda il mio diploma di ${selectedChild.level.title} guadagnato su Family Weekend AI! 🏆✨`;
        const shareUrl = window.location.href;

        let file: File | null = null;
        if (certificateImg) {
            try {
                const response = await fetch(certificateImg);
                const blob = await response.blob();
                file = new File([blob], `attestato-${selectedChild.name.toLowerCase()}.png`, { type: 'image/png' });
            } catch (e) { console.error("Image prep failed", e); }
        }

        switch (platform) {
            case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, '_blank'); break;
            case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank'); break;
            case 'mail': window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`; break;
            case 'instagram':
            case 'tiktok':
            case 'system':
                if (navigator.share) {
                    try {
                        const data: ShareData = { title: shareTitle, text: shareText, url: shareUrl };
                        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { data.files = [file]; }
                        await navigator.share(data);
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 3000);
                    } catch (e) { if ((e as Error).name !== 'AbortError') alert("Condivisione non supportata."); }
                } else { alert("Browser non supportato per la condivisione diretta."); }
                break;
        }
        setIsShareOpen(false);
    };

    const handlePrintPDF = () => {
        setTimeout(() => window.print(), 150);
    };

    if (plans.length === 0) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden !important; background: white !important; }
                    #print-zone, #print-zone * { visibility: visible !important; }
                    #print-zone { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: white !important;
                        z-index: 9999999 !important;
                    }
                    #cert-inner-content {
                        width: 210mm !important;
                        height: 297mm !important;
                        border: none !important;
                        box-shadow: none !important;
                        padding: 10mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                    }
                    .cert-container-aspect { width: 210mm !important; height: 297mm !important; max-width: none !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                }
                .cert-container-aspect {
                    aspect-ratio: 210 / 297;
                    width: 100%;
                    max-width: 520px;
                    background-color: white;
                }
            ` }} />

            {selectedChild && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4 no-print overflow-y-auto">
                    
                    <div className="flex justify-between items-center w-full max-w-[520px] mb-4 shrink-0 relative z-[10001]">
                        <button onClick={() => setSelectedChild(null)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em]">
                            <X className="w-4 h-4" /> Chiudi
                        </button>
                        
                        <div className="flex gap-2">
                             <div className="relative">
                                <button onClick={() => setIsShareOpen(!isShareOpen)} className={`p-2.5 rounded-2xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em] shadow-lg ${shareSuccess ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                    {shareSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4"/>}
                                    {shareSuccess ? 'OK!' : 'Condividi'}
                                </button>
                                {isShareOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-3xl p-3 shadow-2xl animate-fade-in-up border border-slate-100 z-[10002]">
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button onClick={() => handleSocialShare('whatsapp')} className="flex flex-col items-center gap-1 p-2 hover:bg-emerald-50 rounded-2xl transition-colors"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><MessageCircle className="w-4 h-4" /></div><span className="text-[8px] font-black text-slate-500 uppercase">WhatsApp</span></button>
                                            <button onClick={() => handleSocialShare('instagram')} className="flex flex-col items-center gap-1 p-2 hover:bg-pink-50 rounded-2xl transition-colors"><div className="bg-pink-100 text-pink-600 p-2 rounded-xl"><Instagram className="w-4 h-4" /></div><span className="text-[8px] font-black text-slate-500 uppercase">Instagram</span></button>
                                            <button onClick={() => handleSocialShare('facebook')} className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded-2xl transition-colors"><div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Facebook className="w-4 h-4" /></div><span className="text-[8px] font-black text-slate-500 uppercase">Facebook</span></button>
                                            <button onClick={() => handleSocialShare('tiktok')} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-2xl transition-colors"><div className="bg-slate-100 text-slate-900 p-2 rounded-xl"><Music2 className="w-4 h-4" /></div><span className="text-[8px] font-black text-slate-500 uppercase">TikTok</span></button>
                                        </div>
                                    </div>
                                )}
                             </div>
                             <button onClick={handlePrintPDF} disabled={isGeneratingCert} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-2xl flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 text-xs">
                                <FileDown className="w-4 h-4" /> Salva PDF / Stampa
                            </button>
                        </div>
                    </div>

                    <div id="print-zone" className="cert-container-aspect bg-white shadow-2xl relative overflow-hidden shrink-0">
                        <div id="cert-inner-content" className="absolute inset-0 bg-[#fffdfa] p-6 sm:p-10 flex flex-col items-center justify-between text-center border-[10px] border-double border-amber-200/50">
                            
                            <div className="relative z-10 w-full flex items-center justify-between mt-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <BalloonLogoCert className="w-12 h-12" />
                                    <div className="text-left">
                                        <span className="font-serif font-black text-[12px] tracking-tight text-indigo-900 block leading-none uppercase">FAMILY WEEKEND</span>
                                        <span className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Official Academy</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-serif font-bold text-amber-600 uppercase tracking-[0.3em] text-[7px] block">Certificato di Merito</span>
                                    <span className="text-[5px] font-black text-slate-300 uppercase tracking-widest block">ID Esploratore #{Math.floor(1000 + Math.random() * 9000)}</span>
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-200/40 to-transparent mb-4"></div>

                            <div className="relative z-10 w-full mb-1">
                                <h2 className="font-serif font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] leading-none mb-1">Attestato Ufficiale di Raggiungimento Grado</h2>
                                <h3 className="font-serif font-black text-indigo-950 text-xl tracking-wider italic uppercase leading-none">Esploratore di Grado Superiore</h3>
                            </div>

                            <div className="relative z-10 w-full px-4 flex flex-col items-center mb-2 mt-2">
                                <span className="font-serif italic text-slate-400 text-[10px] mb-2 uppercase tracking-[0.2em] leading-none">Concesso con onore a</span>
                                <h1 className="font-serif font-black text-5xl sm:text-6xl text-slate-900 leading-none drop-shadow-sm break-words w-full uppercase">
                                    {selectedChild.name}
                                </h1>
                                <div className="h-0.5 w-20 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mt-2"></div>
                            </div>

                            <div className="relative w-full aspect-square max-w-[260px] mx-auto z-10 my-2">
                                <div className="relative w-full h-full rounded-[1.5rem] border-[5px] border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                                    {isGeneratingCert ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                            <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest animate-pulse">Analisi Eroica...</span>
                                        </div>
                                    ) : certificateImg ? (
                                        <img src={certificateImg} className="w-full h-full object-cover" alt="Hero Portrait" />
                                    ) : selectedChild.avatarUrl ? (
                                        <img src={selectedChild.avatarUrl} className="w-full h-full object-cover opacity-60 grayscale" alt="Base Profile" />
                                    ) : (
                                        <Smile className="w-12 h-12 text-slate-100" />
                                    )}
                                </div>
                                
                                <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-yellow-300 to-amber-600 text-white p-3 rounded-[1.25rem] shadow-lg border-[3px] border-white z-20 flex flex-col items-center min-w-[60px] transform rotate-3 scale-110">
                                    <div className="w-6 h-6 flex items-center justify-center mb-0.5">{selectedChild.level.icon}</div>
                                    <span className="text-[6px] font-black tracking-tighter uppercase whitespace-nowrap">{selectedChild.score} Punti XP</span>
                                </div>
                            </div>

                            <div className="relative z-10 w-full flex flex-col items-center gap-1 mt-2">
                                <div className={`inline-block px-10 py-2 rounded-full font-black text-xl ${selectedChild.level.bg} ${selectedChild.level.color} border-2 border-current shadow-md transform -rotate-1`}>
                                    {selectedChild.level.title}
                                </div>
                                <div className="max-w-[85%] mx-auto relative mt-3">
                                    <Quote className="w-4 h-4 text-amber-200 absolute -top-3 -left-5 -rotate-12 opacity-30" />
                                    <p className="font-serif italic text-slate-600 text-base leading-relaxed line-clamp-2">
                                        "{selectedChild.level.motto}"
                                    </p>
                                </div>
                            </div>
                            
                            <div className="relative z-10 w-full border-t border-amber-200/20 pt-6 flex items-center justify-between px-2 mb-2">
                                <div className="text-left">
                                    <span className="font-serif font-black text-[9px] tracking-widest text-slate-800 block leading-none uppercase">FAMILY WEEKEND AI</span>
                                    <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Accademia Nazionale Esploratori • {new Date().getFullYear()}</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <div className="w-12 h-[1px] bg-slate-200"></div>
                                        <span className="text-[7px] font-serif font-bold text-slate-400 italic">Il Gran Maestro</span>
                                    </div>
                                    <span className="font-serif text-indigo-600 font-bold text-[10px] uppercase">Triceratops Scout</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 text-white/40 text-[8px] font-black uppercase tracking-[0.3em] no-print text-center">
                        Formato A4 Certificato • Generato per {selectedChild.name}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 mb-8 shadow-sm mx-4 mt-4 no-print">
                 <div className="flex flex-col items-center text-center gap-4 mb-10">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 transform scale-110"><Trophy className="w-10 h-10" /></div>
                    <div><h3 className="font-serif font-black text-3xl text-slate-900 leading-none">Podio dei Campioni</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Clicca su un esploratore per visualizzare l'attestato ufficiale</p></div>
                 </div>

                 {scores.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500 font-medium">Ancora nessun campione! Completa le missioni per apparire qui.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scores.map((child, idx) => {
                            const lvl = getLevelInfo(child.score, lang);
                            const nextLvl = getNextLevel(child.score, lang);
                            const progress = nextLvl ? ((child.score - lvl.min) / (nextLvl.min - lvl.min)) * 100 : 100;
                            return (
                                <button key={child.name} onClick={() => handleChildClick(child)} className="flex flex-col p-6 rounded-[2.5rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl transition-all group text-left relative overflow-hidden active:scale-95">
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-xs shadow-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100' : idx === 1 ? 'bg-slate-300 text-slate-800 ring-4 ring-slate-100' : idx === 2 ? 'bg-orange-400 text-orange-900 ring-4 ring-orange-100' : 'bg-white text-slate-400 border border-slate-200'}`}>{idx + 1}</div>
                                        <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                            {child.avatarUrl ? <img src={child.avatarUrl} className="w-full h-full object-cover" alt={child.name} /> : <User className="w-8 h-8 m-4 text-slate-300" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-black text-slate-800 text-xl block leading-none mb-2">{child.name}</span>
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full ${lvl.bg} ${lvl.color} border border-current/10 shadow-sm uppercase tracking-wider`}>
                                                <div className="w-4 h-4 flex items-center justify-center scale-[0.7]">{lvl.icon}</div>
                                                {lvl.title}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end"><span className="font-black text-2xl text-slate-900 tracking-tighter">{child.score}</span><span className="text-[10px] font-bold text-slate-400 uppercase">XP</span></div>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative z-10 shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-2"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lvl.min} XP</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{nextLvl ? nextLvl.min : 'MAX'} XP</span></div>
                                </button>
                            );
                        })}
                    </div>
                 )}
            </div>
        </>
    );
};

interface ExplorerCategory {
    count: number;
    diamonds: number;
    icon: React.ElementType;
    label: string;
    color: string;
    bg: string;
}

const ExplorerStats: React.FC<{ unlockedIds: string[], allLocations: any[], lang: string }> = ({ unlockedIds, allLocations, lang }) => {
    const txt = WORLD_MAP_LABELS[lang] || WORLD_MAP_LABELS['it'];
    const catLabels = txt.cats;

    const stats = useMemo<Record<string, ExplorerCategory>>(() => {
        const s: Record<string, ExplorerCategory> = {
            nature: { count: 0, diamonds: 0, icon: Trees, label: catLabels.nature, color: "text-emerald-500", bg: "bg-emerald-100" },
            culture: { count: 0, diamonds: 0, icon: Castle, label: catLabels.culture, color: "text-purple-500", bg: "bg-purple-100" },
            food: { count: 0, diamonds: 0, icon: Utensils, label: catLabels.food, color: "text-yellow-500", bg: "bg-yellow-100" },
            animal: { count: 0, diamonds: 0, icon: PawPrint, label: catLabels.animal, color: "text-orange-500", bg: "bg-orange-100" },
            water: { count: 0, diamonds: 0, icon: Droplets, label: catLabels.water, color: "text-blue-500", bg: "bg-blue-100" },
        };
        unlockedIds.forEach(id => {
            const loc = allLocations.find(l => l.uniqueId === id);
            if (!loc) return;
            const type = getLocationType(loc.title);
            let key = 'nature'; 
            if (type === 'park') key = 'nature';
            else if (type === 'castle') key = 'culture';
            else if (type === 'food') key = 'food';
            else if (type === 'animal') key = 'animal';
            else if (type === 'water') key = 'water';
            if (s[key]) { s[key].count += 1; s[key].diamonds += 100; }
        });
        return s;
    }, [unlockedIds, allLocations, catLabels]);

    const categories = Object.values(stats) as ExplorerCategory[];
    const totalDiamonds = categories.reduce((acc, curr) => acc + curr.diamonds, 0);

    return (
        <div className="mt-8 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-200 mx-4 no-print">
             <div className="flex flex-col items-center text-center gap-4 mb-10">
                <div className="relative">
                     <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 p-4 rounded-full shadow-lg shadow-sky-200">
                         <Compass className="w-10 h-10 text-white animate-spin-slow" />
                     </div>
                     <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-black text-xs px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                         <Gem className="w-3 h-3" /> {totalDiamonds}
                     </div>
                </div>
                <div>
                    <h3 className="font-serif font-black text-3xl text-slate-900 leading-none">Mete Raggiunte</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Colleziona gemme visitando nuovi luoghi!</p>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                 {categories.map((cat) => (
                     <div key={cat.label} className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${cat.count > 0 ? 'bg-white border-slate-100 shadow-lg scale-105' : 'bg-slate-50 border-transparent opacity-60'}`}>
                         <div className={`p-3 rounded-2xl mb-3 ${cat.bg} ${cat.color}`}><cat.icon className="w-6 h-6" /></div>
                         <span className="font-black text-2xl text-slate-900 mb-1">{cat.diamonds}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{cat.label}</span>
                     </div>
                 ))}
             </div>
        </div>
    );
};

const PARCHMENT_OVERLAY = `radial-gradient(circle, transparent 40%, rgba(30, 41, 59, 0.1) 90%), url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`;

const getLocationType = (title: string): 'castle' | 'park' | 'food' | 'animal' | 'water' | 'default' => {
    const t = title.toLowerCase();
    if (t.includes('castell') || t.includes('museo') || t.includes('castle') || t.includes('museum')) return 'castle';
    if (t.includes('parco') || t.includes('giardino') || t.includes('park') || t.includes('garden')) return 'park';
    if (t.includes('ristorante') || t.includes('food') || t.includes('trattoria')) return 'food';
    if (t.includes('zoo') || t.includes('animal') || t.includes('acquario')) return 'animal';
    if (t.includes('lago') || t.includes('fiume') || t.includes('mare') || t.includes('beach')) return 'water';
    return 'default';
};

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  var R = 6371; var dLat = (lat2-lat1) * (Math.PI/180); var dLon = (lon2-lon1) * (Math.PI/180); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c * 1000;
};

export const WorldMap: React.FC<WorldMapProps> = ({ plans, t }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userLayerRef = useRef<any>(null);
  const prevPlanIdsRef = useRef<string>("");
  const [unlockedLocations, setUnlockedLocations] = useState<string[]>([]); 
  const [showChestModal, setShowChestModal] = useState<{title: string, type: string} | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const allLocations = useMemo(() => plans.flatMap(p => (p.visitedLocations || []).map(loc => ({ ...loc, planId: p.id, uniqueId: `${p.id}-${loc.lat}-${loc.lng}` }))), [plans]);
  
  // Try to determine current language from props t, fallback to 'it'
  // Since t is passed from App which selects language, we can infer it. 
  // However, t object doesn't expose lang code directly. 
  // We can pass lang as a new prop, OR infer it from a known key.
  // For robustness, let's assume 'it' if detection fails, but WorldMapProps doesn't have lang yet.
  // I'll update the component signature to extract lang if possible, or assume 'it'.
  // Actually, I can check t.start_badge to guess.
  const lang = t.start_badge === 'Bereit?' ? 'de' : t.start_badge === '¿Listos para salir?' ? 'es' : t.start_badge === 'Ready?' ? 'en' : 'it';

  useEffect(() => {
      const stored = localStorage.getItem('unlockedLocations');
      if (stored) { try { setUnlockedLocations(JSON.parse(stored)); } catch(e) {} }
  }, []);

  useEffect(() => { localStorage.setItem('unlockedLocations', JSON.stringify(unlockedLocations)); }, [unlockedLocations]);

  useEffect(() => {
      if (!navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              allLocations.forEach(loc => {
                  if (unlockedLocations.includes(loc.uniqueId)) return; 
                  if (getDistanceFromLatLonInKm(latitude, longitude, loc.lat, loc.lng) < 500) unlockTreasure(loc);
              });
          }, (err) => console.error(err), { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });
      return () => navigator.geolocation.clearWatch(watchId);
  }, [unlockedLocations, allLocations]);

  const unlockTreasure = (loc: any) => {
      if (unlockedLocations.includes(loc.uniqueId)) return;
      setUnlockedLocations(prev => [...prev, loc.uniqueId]);
      setShowChestModal({ title: loc.title, type: getLocationType(loc.title) });
      setTimeout(() => setShowChestModal(null), 4000);
  };

  const simulateRandomArrival = () => {
      if (isSimulating) return;
      const locked = allLocations.filter(loc => !unlockedLocations.includes(loc.uniqueId));
      if (locked.length > 0) {
          setIsSimulating(true);
          const randomLoc = locked[Math.floor(Math.random() * locked.length)];
          if (map && map._container) {
              try {
                  map.flyTo([randomLoc.lat, randomLoc.lng], 15, { duration: 2 });
              } catch (e) {
                  console.error("flyTo error:", e);
              }
          }
          setTimeout(() => { unlockTreasure(randomLoc); setIsSimulating(false); }, 2100);
      }
  };

  useEffect(() => {
    let resizeTimer: any = null;
    if (!mapRef.current || typeof (window as any).L === 'undefined') return;
    
    // Reset any previous leaflet container id to prevent re-initialization error
    if ((mapRef.current as any)._leaflet_id) {
        delete (mapRef.current as any)._leaflet_id;
    }

    const L = (window as any).L;
    let m: any = null;
    try {
        m = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([41.9028, 12.4964], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(m);
        markersLayerRef.current = L.layerGroup().addTo(m);
        userLayerRef.current = L.layerGroup().addTo(m);
        setMap(m);
        [100, 300, 600].forEach(delay => {
            setTimeout(() => {
                if (m && m._container) {
                    try {
                        m.invalidateSize();
                    } catch (err) {}
                }
            }, delay);
        });
    } catch (err) {
        console.error("Leaflet map initialization error:", err);
    }

    return () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        if (m) {
            try {
                m.remove();
            } catch (err) {
                console.error("Leaflet map removal error:", err);
            }
        }
        setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map || !map._container || !markersLayerRef.current || typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;
    const layerGroup = markersLayerRef.current;
    try {
        layerGroup.clearLayers();
        const bounds = L.latLngBounds([]);
        let hasMarkers = false;
        allLocations.forEach((loc) => {
            if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
            const isUnlocked = unlockedLocations.includes(loc.uniqueId);
            const type = getLocationType(loc.title);
            let emoji = '📍';
            let bgClass = isUnlocked ? 'bg-indigo-600' : 'bg-slate-400 grayscale';
            if (type === 'castle') emoji = '🏰'; else if (type === 'park') emoji = '🌳'; else if (type === 'food') emoji = '🍝'; else if (type === 'animal') emoji = '🐾'; else if (type === 'water') emoji = '💧';
            const customIcon = L.divIcon({ className: 'custom-adv-icon', html: `<div class="marker-icon ${bgClass} text-white transition-all duration-500 ${isUnlocked ? 'scale-110 shadow-lg' : 'opacity-70'}">${emoji}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(layerGroup);
            marker.bindPopup(`<div class="text-center p-2"><h3 class="font-bold text-indigo-900">${loc.title}</h3><p class="text-xs italic">${isUnlocked ? "✨ Visitato!" : "🔒 Da scoprire"}</p></div>`);
            bounds.extend([loc.lat, loc.lng]);
            hasMarkers = true;
        });
        const currentSignature = allLocations.map(l => l.uniqueId).sort().join('|');
        if (hasMarkers && bounds.isValid() && currentSignature !== prevPlanIdsRef.current && map._container) {
            map.fitBounds(bounds, { padding: [50, 50] });
            prevPlanIdsRef.current = currentSignature;
        }
    } catch (e) {
        console.error("Error rendering map markers:", e);
    }
  }, [map, plans, allLocations, unlockedLocations]);

  return (
    <div className="animate-fade-in-up relative pb-20 overflow-y-auto max-h-full scrollbar-hide no-print">
        <LeaderboardSection plans={plans} t={t} lang={lang} />
        <ExplorerLevelsReference lang={lang} />
        <div className="mx-4 mb-4 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-white h-[600px] relative">
            <div ref={mapRef} className="w-full h-full z-0" />
            <div className="absolute inset-0 pointer-events-none z-[5]" style={{ background: PARCHMENT_OVERLAY, boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)' }}></div>
            <div className="absolute bottom-6 left-6 right-6 z-[1000] flex justify-center pointer-events-none">
                <button onClick={simulateRandomArrival} disabled={isSimulating || (allLocations.length - unlockedLocations.length) === 0 || allLocations.length === 0} className="bg-white/95 backdrop-blur px-6 py-3 rounded-full shadow-2xl border border-indigo-200 pointer-events-auto flex items-center gap-3 text-sm font-black text-indigo-900 hover:scale-105 transition-all disabled:opacity-50 shadow-indigo-100">
                    {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {isSimulating ? 'In Viaggio...' : 'Raggiungi Meta'}
                </button>
            </div>
            {showChestModal && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white rounded-3xl p-8 text-center max-w-xs shadow-2xl border-4 border-yellow-400">
                        <div className="text-6xl mb-4 animate-bounce">💎</div>
                        <h3 className="text-2xl font-black text-amber-600 mb-2">Meta Raggiunta!</h3>
                        <p className="text-gray-600 font-bold mb-4">{showChestModal.title}</p>
                        <div className="bg-sky-500 text-white font-bold py-2 px-6 rounded-full shadow-lg">+100 Diamanti</div>
                    </div>
                </div>
            )}
        </div>
        <ExplorerStats unlockedIds={unlockedLocations} allLocations={allLocations} lang={lang} />
    </div>
  );
};

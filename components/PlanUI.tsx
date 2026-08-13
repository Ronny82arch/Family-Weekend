import React, { useState, useRef, useId } from 'react';
import { SavedPlan, Child, VisitedLocation } from '../types';
import { X, Video, Loader2, Plus, Camera, Trophy, User, Crown, Swords, CheckCircle, Zap, Sparkles, Star, Play, FileWarning, Image as ImageIcon } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- PIXAR ASSETS ---
export const PixarCastle = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 400 300" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id={`skyGradientSaved-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id={`castleGradientSaved-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id={`roofGradientSaved-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <filter id={`glowSaved-${uid}`}>
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="400" height="300" fill={`url(#skyGradientSaved-${uid})`} />
        <g filter={`url(#glowSaved-${uid})`}>
            <circle cx="80" cy="60" r="2" fill="#fcd34d" className="animate-ping" style={{animationDuration: '3s'}} />
            <path d="M80,60 L60,40 M80,60 L100,40 M80,60 L80,30 M80,60 L60,80 M80,60 L100,80" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="320" cy="80" r="2" fill="#60a5fa" className="animate-ping" style={{animationDuration: '2.5s', animationDelay: '1s'}} />
            <path d="M320,80 L300,60 M320,80 L340,60 M320,80 L320,50 M320,80 L300,100 M320,80 L340,100" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="200" cy="40" r="3" fill="#f472b6" className="animate-ping" style={{animationDuration: '4s', animationDelay: '0.5s'}} />
             <path d="M200,40 L180,10 M200,40 L220,10 M200,40 L170,40 M200,40 L230,40 M200,40 L180,70 M200,40 L220,70" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
        <circle cx="50" cy="150" r="1" fill="white" className="animate-pulse" />
        <circle cx="350" cy="120" r="1.5" fill="white" className="animate-pulse" style={{animationDelay: '1s'}} />
        <path d="M80,300 L320,300 L320,220 L280,220 L280,180 L200,150 L120,180 L120,220 L80,220 Z" fill={`url(#castleGradientSaved-${uid})`} stroke="#831843" strokeWidth="2" />
        <rect x="180" y="150" width="40" height="150" fill={`url(#castleGradientSaved-${uid})`} />
        <path d="M170,150 L230,150 L200,60 Z" fill={`url(#roofGradientSaved-${uid})`} />
        <rect x="100" y="180" width="30" height="120" fill={`url(#castleGradientSaved-${uid})`} />
        <path d="M90,180 L140,180 L115,120 Z" fill={`url(#roofGradientSaved-${uid})`} />
        <rect x="270" y="180" width="30" height="120" fill={`url(#castleGradientSaved-${uid})`} />
        <path d="M260,180 L310,180 L285,120 Z" fill={`url(#roofGradientSaved-${uid})`} />
        <rect x="195" y="180" width="10" height="15" rx="5" fill="#fef08a" />
        <rect x="110" y="200" width="10" height="15" rx="5" fill="#fef08a" />
        <rect x="280" y="200" width="10" height="15" rx="5" fill="#fef08a" />
        <path d="M170,300 L230,300 L230,260 A30,30 0 0,0 170,260 Z" fill="#4a044e" />
        <circle cx="200" cy="290" r="15" fill="#fef08a" opacity="0.6" filter={`url(#glowSaved-${uid})`} />
    </svg>
    );
};

export const PixarDoubloons = ({ className }: { className?: string }) => {
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

export const PixarTransport = ({ className }: { className?: string }) => {
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

export const PixarBackpack = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`bagGradientSaved-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" /> 
                <stop offset="100%" stopColor="#d97706" /> 
            </linearGradient>
            <filter id={`shadowBagSaved-${uid}`}>
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
            </filter>
        </defs>
        <path d="M80,40 Q100,20 120,40" fill="none" stroke="#92400e" strokeWidth="8" strokeLinecap="round" />
        <rect x="50" y="40" width="100" height="120" rx="20" fill={`url(#bagGradientSaved-${uid})`} filter={`url(#shadowBagSaved-${uid})`} />
        <rect x="60" y="100" width="80" height="50" rx="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
        <path d="M55,55 L145,55" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
        <circle cx="100" cy="125" r="10" fill="#fff" />
        <circle cx="100" cy="125" r="4" fill="#ef4444" />
        <path d="M60,50 Q100,50 140,50 Q130,70 100,70 Q70,70 60,50" fill="white" opacity="0.2" />
    </svg>
    );
};

export const PixarDiary = ({ className }: { className?: string }) => {
    const uid = useId();
    return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`bookCover-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <filter id={`bookShadow-${uid}`}>
                <feDropShadow dx="4" dy="6" stdDeviation="4" floodOpacity="0.3" />
            </filter>
        </defs>
        <rect x="40" y="30" width="120" height="140" rx="10" fill={`url(#bookCover-${uid})`} filter={`url(#bookShadow-${uid})`} />
        <path d="M150 30 L160 40 L160 160 L150 170" fill="#881337" opacity="0.6" />
        <rect x="50" y="25" width="20" height="150" rx="2" fill="#be123c" />
        <rect x="80" y="50" width="60" height="80" rx="5" fill="#fff" opacity="0.2" />
        <path d="M90 70 L130 70 M90 90 L130 90 M90 110 L110 110" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <circle cx="100" cy="100" r="25" fill="none" stroke="#fff" strokeWidth="2" opacity="0.1" />
        <path d="M45 40 L55 40 M45 160 L55 160" stroke="#fb7185" strokeWidth="2" />
    </svg>
    );
};

// --- MODALS ---

export const VideoCreatorModal: React.FC<{ plan: SavedPlan, onClose: () => void, onSaveVideo: (uri: string) => void, t: any }> = ({ plan, onClose, onSaveVideo, t }) => {
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSelectedPhotos(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleCreate = async () => {
        if (selectedPhotos.length === 0) return;
        if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
            await (window as any).aistudio.openSelectKey();
        }
        setCreating(true);
        setProgress(10);
        try {
            const photoBase64 = selectedPhotos[0].split(',')[1];
            const timer = setInterval(() => { setProgress(prev => Math.min(95, prev + 2)); }, 1000);
            const videoUrl = await generateVeoVideo(photoBase64, plan.title);
            clearInterval(timer);
            setProgress(100);
            
            // FIX BUG 5: Force Download & Warn
            try {
                const response = await fetch(videoUrl);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                const safeTitle = plan.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                a.download = `FamilyWeekend_${safeTitle}.mp4`;
                document.body.appendChild(a);
                a.click();
                
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
                
                alert("✅ Video Scaricato!\n\nIMPORTANTE: Il file è stato salvato sul tuo dispositivo. Il link nell'app è temporaneo e scadrà a breve.");
            } catch (downloadError) {
                console.warn("Auto-download failed, fallback to new tab", downloadError);
                window.open(videoUrl, '_blank');
                alert("✅ Video Pronto!\n\nIMPORTANTE: Il video si è aperto in una nuova scheda. Salvalo subito sul dispositivo perché il link scadrà a breve!");
            }

            onSaveVideo(videoUrl);
            onClose();
        } catch (e: any) { console.error(e); alert("Errore durante la creazione del video."); } finally { setCreating(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-fade-in-up">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-20"><X className="w-5 h-5 text-slate-500"/></button>
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-purple-100 p-4 rounded-3xl"><Video className="w-8 h-8 text-purple-600" /></div>
                    <div><h3 className="text-2xl font-black text-slate-900">{t.create_video}</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{plan.title}</p></div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 mb-6 min-h-[200px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-6">
                    {selectedPhotos.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><ImageIcon className="w-10 h-10 text-slate-200" /></div>
                            <p className="text-slate-400 font-bold mb-4">Carica la foto più bella della gita</p>
                            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"><Camera className="w-4 h-4" /> Seleziona Foto</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {selectedPhotos.map((p, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md relative group"><img src={p} className="w-full h-full object-cover" /><button onClick={() => setSelectedPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button></div>
                            ))}
                            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 flex items-center justify-center text-purple-300 hover:bg-purple-50 transition-colors"><Plus className="w-8 h-8"/></button>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 mb-6">{selectedPhotos.length > 0 && !creating && (<button onClick={handleCreate} className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">GENERA VIDEO</button>)}</div>
                <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                {creating ? <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100"><div className="flex flex-col items-center gap-6"><Loader2 className="w-16 h-16 text-indigo-600 animate-spin" /><div className="w-full space-y-2"><div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div></div><div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Creazione in corso...</span><span>{progress}%</span></div></div></div></div> : <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest">Chiudi</button>}
            </div>
        </div>
    );
};

export const VideoPlayerModal: React.FC<{ videoUri: string, title: string, onClose: () => void, t: any }> = ({ videoUri, title, onClose, t }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-white/5">
                    <h3 className="text-white font-black text-lg leading-none">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 bg-black flex items-center justify-center relative group aspect-video">
                    <video src={videoUri} controls autoPlay className="max-w-full max-h-[70vh]" />
                </div>
            </div>
        </div>
    );
};

export const MissionCompletionModal: React.FC<{ mission: string, childrenList: Child[], onClose: () => void, onConfirm: (scores: Record<string, number>) => void }> = ({ mission, childrenList, onClose, onConfirm }) => {
    const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
    const [bigBossPower, setBigBossPower] = useState(false);
    const handleConfirm = () => {
        const scores: Record<string, number> = {};
        childrenList.forEach(child => { scores[child.name] = bigBossPower ? 50 : (child.name === selectedLeader) ? 50 : 25; });
        onConfirm(scores);
    };
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
            <div className="bg-white rounded-[2.5rem] p-8 max-md w-full shadow-2xl relative overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-20"><X className="w-5 h-5 text-slate-500"/></button>
                <div className="text-center mb-8"><div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-amber-50 shadow-inner"><Trophy className="w-8 h-8 text-amber-600" /></div><h3 className="font-black text-2xl text-slate-900 mb-2">Chi è stato il Leader?</h3><p className="text-sm text-slate-500 px-4 font-medium leading-relaxed">Il leader guadagna 50 XP, gli altri esploratori 25 XP.</p></div>
                <div className="grid grid-cols-2 gap-4 mb-8 max-h-[300px] overflow-y-auto p-2">
                    {childrenList.map((child) => (
                        <button key={child.name} onClick={() => setSelectedLeader(child.name)} className={`relative flex flex-col items-center p-4 rounded-3xl border-4 transition-all duration-300 ${selectedLeader === child.name ? 'bg-amber-50 border-amber-400 shadow-xl scale-105' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 opacity-80 hover:opacity-100'}`}>
                            <div className="relative"><div className="w-16 h-16 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden mb-2 shadow-sm">{child.avatarUrl ? <img src={child.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-300" />}</div>{selectedLeader === child.name && (<div className="absolute -top-4 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce-slow"><Crown className="w-4 h-4 fill-current" /></div>)}</div><span className="font-bold text-slate-800 text-sm">{child.name}</span><div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedLeader === child.name || bigBossPower ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-500'}`}>{bigBossPower ? '+50 XP' : selectedLeader === child.name ? '+50 XP' : '+25 XP'}</div>
                        </button>
                    ))}
                </div>
                <div className="mb-8"><button onClick={() => setBigBossPower(!bigBossPower)} className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between border-2 transition-all ${bigBossPower ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}`}><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${bigBossPower ? 'bg-white/20' : 'bg-indigo-200'}`}><Swords className="w-5 h-5" /></div><div className="text-left"><span className="block font-black text-sm uppercase tracking-wide">Potere del Grande Capo</span><span className={`text-[10px] font-bold ${bigBossPower ? 'text-indigo-200' : 'text-indigo-400'}`}>Tutti vincitori! (50 XP a tutti)</span></div></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${bigBossPower ? 'bg-white border-white' : 'border-indigo-300'}`}>{bigBossPower && <CheckCircle className="w-4 h-4 text-indigo-600" />}</div></button></div>
                <button onClick={handleConfirm} disabled={!selectedLeader && !bigBossPower} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"><Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Conferma e Sblocca XP</button>
            </div>
        </div>
    );
};

export const RateModal: React.FC<{ onClose: () => void, onRate: (rating: number) => void, t: any }> = ({ onClose, onRate, t }) => {
    const [rating, setRating] = useState(0);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in-up">
            <div className="bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#5b21b6] rounded-[2.5rem] p-8 max-sm w-full shadow-2xl text-center relative overflow-hidden border border-white/20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-colors z-20"><X className="w-5 h-5"/></button>
                <div className="relative z-10">
                    <div className="mb-6 relative inline-block"><div className="w-24 h-24 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-full flex items-center justify-center mx-auto text-5xl shadow-lg shadow-amber-500/50 animate-bounce">🏆</div><Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-200 animate-pulse" /></div>
                    <h3 className="font-serif font-black text-3xl text-white mb-2 tracking-tight drop-shadow-md">{t.completed}!</h3>
                    <p className="text-indigo-200 mb-8 font-medium text-lg leading-tight">Quante stelle dai a questa avventura?</p>
                    <div className="flex justify-center gap-3 mb-10">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-125 focus:outline-none group"><Star className={`w-10 h-10 transition-all duration-300 ${rating >= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-indigo-900/50 fill-indigo-900/30'}`} /></button>))}</div>
                    <button onClick={() => { if(rating > 0) onRate(rating); }} disabled={rating === 0} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"><CheckCircle className="w-6 h-6 text-indigo-600" /> {t.save_all}</button>
                </div>
            </div>
        </div>
    );
};

export const MemoryItem: React.FC<{ 
    type: 'video' | 'photo', 
    uri: string, 
    title: string, 
    date: number, 
    onPlay: () => void 
}> = ({ type, uri, title, date, onPlay }) => {
    const [hasError, setHasError] = useState(false);

    if (type === 'video' && hasError) {
        return (
            <div className="snap-center shrink-0 w-48 h-64 rounded-3xl bg-slate-100 flex flex-col items-center justify-center p-4 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="bg-rose-100 p-3 rounded-full mb-3"><FileWarning className="w-6 h-6 text-rose-500" /></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Video Archiviato</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Il link temporaneo è scaduto. Consulta il file scaricato.</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-slate-200/50 backdrop-blur-sm">
                    <p className="text-slate-600 text-[9px] font-bold line-clamp-1 text-center">{title}</p>
                </div>
            </div>
        );
    }

    return (
        <button 
            onClick={onPlay}
            className="snap-center shrink-0 w-48 h-64 rounded-3xl bg-slate-900 relative overflow-hidden group shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
        >
            {type === 'video' ? (
                <>
                    <video 
                        src={uri} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" 
                        muted 
                        onError={() => setHasError(true)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-bold line-clamp-2 leading-tight text-left">{title}</p>
                        <p className="text-white/60 text-[9px] font-bold uppercase mt-1 text-left">{new Date(date).toLocaleDateString()}</p>
                    </div>
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Video</div>
                </>
            ) : (
                <>
                    <img src={`data:image/png;base64,${uri}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-bold text-left">{title}</p>
                    </div>
                </>
            )}
        </button>
    );
};

export const SeasonalDiaryHidden: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;
    return (
        <div id="pdf-generator-container" style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, width: '210mm', color: '#1e293b' }}>
            <div id="pdf-cover" style={{ width: '210mm', height: '297mm', padding: '20mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfbf7', border: '10px solid #78350f' }}>
                <h1 style={{ fontFamily: 'serif', fontSize: '60px', fontWeight: '900', color: '#78350f', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>DIARIO DI BORDO</h1>
                <h2 style={{ fontFamily: 'sans-serif', fontSize: '30px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '50px' }}>STAGIONE {data.seasonName}</h2>
                <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '50px', border: '5px solid #d97706' }}>
                    <span style={{ fontSize: '100px' }}>{data.icon}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {data.children && data.children.map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #78350f', marginBottom: '10px' }}>
                                {c.avatarUrl ? <img src={c.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1' }} />}
                            </div>
                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>{c.name}</span>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 'auto', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Family Weekend Official Explorer Log</div>
            </div>

            <div id="pdf-map" style={{ width: '210mm', height: '297mm', padding: '20mm', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontFamily: 'serif', fontSize: '40px', fontWeight: '900', color: '#1e293b', marginBottom: '30px', borderBottom: '4px solid #e2e8f0', paddingBottom: '10px' }}>LA MAPPA DELLE CONQUISTE</h2>
                <div style={{ flex: 1, border: '4px solid #1e293b', borderRadius: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                    {data.mapImage ? <img src={data.mapImage} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>Mappa non disponibile</span>}
                </div>
                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Luoghi Esplorati:</h3>
                    <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{data.locations.join(' • ')}</p>
                </div>
            </div>

            <div id="pdf-story" style={{ width: '210mm', height: '297mm', padding: '20mm', backgroundColor: '#fff7ed', backgroundImage: 'radial-gradient(#fde68a 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <h2 style={{ fontFamily: 'serif', fontSize: '40px', fontWeight: '900', color: '#7c2d12', marginBottom: '40px', textAlign: 'center' }}>LE GESTA EROICHE</h2>
                <div style={{ fontSize: '18px', lineHeight: '2', fontFamily: 'serif', textAlign: 'justify', columnCount: 1, color: '#431407' }}>
                    {data.storyText}
                </div>
            </div>

            <div id="pdf-gallery" style={{ width: '210mm', height: '297mm', padding: '20mm', backgroundColor: '#1e293b', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', alignContent: 'flex-start' }}>
                <h2 style={{ width: '100%', fontFamily: 'serif', fontSize: '40px', fontWeight: '900', color: '#fff', marginBottom: '30px', textAlign: 'center' }}>RICORDI FOTOGRAFICI</h2>
                {data.photos && data.photos.slice(0, 6).map((p: any, i: number) => (
                    <div key={i} style={{ width: '200px', backgroundColor: '#fff', padding: '10px 10px 40px 10px', transform: `rotate(${Math.random() * 6 - 3}deg)`, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                        <div style={{ width: '100%', height: '180px', overflow: 'hidden', backgroundColor: '#eee' }}>
                             <img src={`data:image/png;base64,${p.uri}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ marginTop: '10px', textAlign: 'center', fontFamily: 'cursive', fontSize: '12px', color: '#333' }}>
                             {new Date(p.date).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
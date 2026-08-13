import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SavedPlan, Child, VisitedLocation } from '../types';
import { Play, BookHeart, Printer, Quote, Star, Loader2, PlayCircle, Video, Book } from 'lucide-react';
import { generateStoryAudio, generateSeasonalStory, decodePCM, decodeAudioData, getApiKey } from '../services/geminiService';
import { PlanCard } from './PlanCard';
import { VideoCreatorModal, VideoPlayerModal, MissionCompletionModal, RateModal, SeasonalDiaryHidden, MemoryItem, PixarDiary } from './PlanUI';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SavedPlansListProps {
  plans: SavedPlan[];
  type: 'favorites' | 'history' | 'active';
  onDelete: (id: string) => void;
  onDeleteDay?: (id: string, day: string) => void;
  onRate?: (id: string, rating: number, day?: string) => void;
  onMoveToActive?: (id: string) => void;
  onToggleMission?: (id: string, missionText: string, childName: string, score: number) => void; 
  onTogglePacking?: (id: string, itemText: string) => void;
  onUpdatePlan?: (plan: SavedPlan) => void;
  t: any;
}

// --- MAIN LIST COMPONENT ---
export const SavedPlansList: React.FC<SavedPlansListProps> = ({ plans, type, onDelete, onDeleteDay, onRate, onMoveToActive, onToggleMission, onTogglePacking, onUpdatePlan, t }) => {
  const [rateModalTarget, setRateModalTarget] = useState<{id: string, day: string} | null>(null);
  const [playingPlanId, setPlayingPlanId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [videoPlan, setVideoPlan] = useState<SavedPlan | null>(null);
  const [activeVideoUri, setActiveVideoUri] = useState<{uri: string, title: string} | null>(null);
  const [missionModal, setMissionModal] = useState<{planId: string, missionText: string, children: Child[]} | null>(null);
  
  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);

  useEffect(() => { return () => { if(sourceNodeRef.current) sourceNodeRef.current.stop(); if(audioContextRef.current) audioContextRef.current.close(); }; }, []);

  const handleSharePlan = async (plan: SavedPlan) => {
      const shareTitle = `La mia avventura FamilyWeekend! 🏰`;
      const shareText = `Guarda questo itinerario programmato con FamilyWeekend AI: ${plan.title}. \n\n${plan.text.substring(0, 150)}...`;
      
      if (navigator.share) {
          try { await navigator.share({ title: shareTitle, text: shareText, url: window.location.href }); } 
          catch (e) { if ((e as Error).name !== 'AbortError') console.error("Condivisione fallita", e); }
      } else {
          const waUrl = `https://wa.me/?text=${encodeURIComponent(shareTitle + "\n\n" + shareText)}`;
          window.open(waUrl, '_blank');
      }
  };

  const playStory = async (planId: string, text: string) => {
       if (playingPlanId === planId) { sourceNodeRef.current?.stop(); setPlayingPlanId(null); return; }
      if (sourceNodeRef.current) { sourceNodeRef.current.stop(); setPlayingPlanId(null); }
      setLoadingAudioId(planId);
      try {
          const base64 = await generateStoryAudio(text);
          if(!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          const ctx = audioContextRef.current;
          if(ctx.state === 'suspended') await ctx.resume();
          const buffer = await decodeAudioData(decodePCM(base64), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onended = () => setPlayingPlanId(null);
          sourceNodeRef.current = source;
          source.start();
          setPlayingPlanId(planId);
      } catch (e) { alert("Audio Error"); } finally { setLoadingAudioId(null); }
  };

  const handleMissionXPConfirm = (scores: Record<string, number>) => {
      if(!missionModal || !onToggleMission) return;
      Object.entries(scores).forEach(([childName, score]) => {
          onToggleMission(missionModal.planId, missionModal.missionText, childName, score);
      });
      setMissionModal(null);
  };

  const handleSavePlanVideo = (planId: string, uri: string) => {
      const plan = plans.find(p => p.id === planId);
      if (plan && onUpdatePlan) {
          onUpdatePlan({ ...plan, videoUri: uri });
      }
  };

  // Logic to determine season and stats
  const seasonStats = useMemo(() => {
    if (type !== 'history') return null;
    const now = new Date();
    const month = now.getMonth(); 
    let seasonName = 'Inverno';
    let icon = '❄️';
    let gradient = 'from-cyan-500 to-blue-600';
    let subColor = 'text-cyan-100';
    if (month >= 2 && month <= 4) { seasonName = 'Primavera'; icon = '🌸'; gradient = 'from-pink-500 to-rose-600'; subColor = 'text-pink-100'; }
    else if (month >= 5 && month <= 7) { seasonName = 'Estate'; icon = '☀️'; gradient = 'from-amber-400 to-orange-600'; subColor = 'text-amber-100'; }
    else if (month >= 8 && month <= 10) { seasonName = 'Autunno'; icon = '🍂'; gradient = 'from-orange-600 to-red-700'; subColor = 'text-orange-100'; }

    const completedCount = plans.filter(p => p.isCompleted).length;
    const target = 5;
    const percentage = Math.min(100, (completedCount / target) * 100);
    
    let hypePhrase = "Ogni viaggio inizia con il primo passo. Andiamo!";
    if (completedCount >= 1) hypePhrase = "Ottima partenza! L'avventura scorre nelle vostre vene! 🚀";
    if (completedCount >= 3) hypePhrase = "Siete inarrestabili! Una vera forza della natura! 🔥";
    if (completedCount >= 4) hypePhrase = "Manca pochissimo alla leggenda! Forza! 🏆";
    if (completedCount >= target) hypePhrase = "CAMPIONI DELLA STAGIONE! Siete nell'Olimpo degli Esploratori! 👑";

    return { seasonName, icon, gradient, subColor, completedCount, target, percentage, hypePhrase };
  }, [plans, type]);

  // Logic for Diaries Collection
  const memories = useMemo(() => {
    if (type !== 'history') return [];
    return plans.flatMap(p => {
        const items: { type: 'video' | 'photo', planId: string, title: string, uri: string, date: number }[] = [];
        if (p.videoUri) {
            items.push({ type: 'video', planId: p.id, title: p.title, uri: p.videoUri, date: p.dateCreated });
        }
        if (p.weekendDiary && p.weekendDiary.length > 0) {
            p.weekendDiary.forEach(entry => {
                items.push({ type: 'photo', planId: p.id, title: p.title, uri: entry.image, date: entry.timestamp });
            });
        }
        return items;
    }).sort((a, b) => b.date - a.date);
  }, [plans, type]);

  // --- PDF GENERATION LOGIC ---
  const handleGeneratePDF = async () => {
    if (!seasonStats) return;
    setIsGeneratingPdf(true);
    try {
        const relevantPlans = plans.filter(p => p.isCompleted); 
        const locations: string[] = relevantPlans.flatMap(p => p.visitedLocations?.map((l: VisitedLocation) => l.title) || []);
        const uniqueLocations: string[] = Array.from(new Set(locations)).slice(0, 15);
        const children: Child[] = relevantPlans[0]?.savedChildren || [{name: 'Bimbi', age: ''}];
        const photos = memories.filter(m => m.type === 'photo');

        let mapImage = null;
        if (uniqueLocations.length > 0) {
            const markers = relevantPlans.flatMap(p => p.visitedLocations || []).map(l => `markers=color:0x78350f|size:mid|${l.lat},${l.lng}`).join('&');
            mapImage = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=terrain&${markers}&key=${getApiKey()}`;
        }

        const storyText = await generateSeasonalStory(seasonStats.seasonName, uniqueLocations, children.map(c => c.name));

        setPdfData({
            seasonName: seasonStats.seasonName,
            icon: seasonStats.icon,
            children: children,
            mapImage: mapImage,
            locations: uniqueLocations,
            storyText: storyText,
            photos: photos
        });

        setTimeout(async () => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const ids = ['pdf-cover', 'pdf-map', 'pdf-story', 'pdf-gallery'];
            for (let i = 0; i < ids.length; i++) {
                const el = document.getElementById(ids[i]);
                if (el) {
                    if (i > 0) pdf.addPage();
                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
                    const imgData = canvas.toDataURL('image/jpeg', 0.9);
                    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                }
            }
            pdf.save(`Diario_Famiglia_${seasonStats.seasonName}.pdf`);
            setIsGeneratingPdf(false);
            setPdfData(null);
        }, 2000);
    } catch (e) {
        console.error(e);
        alert("Errore generazione PDF");
        setIsGeneratingPdf(false);
        setPdfData(null);
    }
  };

  if (plans.length === 0 && !seasonStats) return (
    <div className="text-center py-20 px-6 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 shadow-sm max-w-lg mx-auto my-8">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
        <Book className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-2">{t.no_plans}</h3>
      <p className="text-slate-500 text-sm font-medium mb-6">Nessuna gita salvata in questa sezione. Crea il tuo prossimo itinerario magico!</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
      >
        🚀 Pianifica Ora
      </button>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in-up relative">
      {/* Hidden Components */}
      {pdfData && <SeasonalDiaryHidden data={pdfData} />}
      
      {/* Modals */}
      {videoPlan && <VideoCreatorModal plan={videoPlan} onClose={() => setVideoPlan(null)} onSaveVideo={(uri) => handleSavePlanVideo(videoPlan.id, uri)} t={t} />}
      {activeVideoUri && <VideoPlayerModal videoUri={activeVideoUri.uri} title={activeVideoUri.title} onClose={() => setActiveVideoUri(null)} t={t} />}
      {rateModalTarget && <RateModal onClose={() => setRateModalTarget(null)} onRate={(r) => { onRate?.(rateModalTarget.id, r, rateModalTarget.day); setRateModalTarget(null); }} t={t} />}
      {missionModal && <MissionCompletionModal mission={missionModal.missionText} childrenList={missionModal.children} onClose={() => setMissionModal(null)} onConfirm={handleMissionXPConfirm} />}
      
      {/* HEADER: Seasonal Stats (Only History) */}
      {type === 'history' && seasonStats && (
        <div className={`mb-12 rounded-[2.5rem] p-8 bg-gradient-to-br ${seasonStats.gradient} text-white shadow-2xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/20">
                            {seasonStats.icon}
                        </div>
                        <div>
                            <div className={`text-xs font-black uppercase tracking-[0.25em] ${seasonStats.subColor} mb-1`}>Stagione {seasonStats.seasonName}</div>
                            <h2 className="font-serif font-black text-3xl leading-none">Diario di Bordo</h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                            <span className="font-black text-xl">{seasonStats.completedCount}</span>
                            <span className="text-xs font-bold opacity-70"> / {seasonStats.target} Viaggi</span>
                        </div>
                        {isGeneratingPdf ? (
                             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-bold">Generazione PDF...</span>
                             </div>
                        ) : (
                             <button onClick={handleGeneratePDF} className="bg-white text-indigo-900 px-4 py-2 rounded-xl border border-white/20 shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                <Printer className="w-4 h-4" /> Stampa Diario
                             </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider opacity-80">
                        <span>Progresso Livello</span>
                        <span>{Math.round(seasonStats.percentage)}%</span>
                    </div>
                    <div className="h-5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm p-1">
                        <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] relative overflow-hidden transition-all duration-1000 ease-out" style={{width: `${seasonStats.percentage}%`}}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative">
                    <Quote className="w-8 h-8 text-white/20 absolute -top-3 -left-2" />
                    <p className="font-serif font-bold text-xl md:text-2xl italic leading-relaxed text-center text-white drop-shadow-sm">
                        "{seasonStats.hypePhrase}"
                    </p>
                    <div className="flex justify-center mt-3 gap-1">
                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse delay-75" />
                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse delay-150" />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MEMORIES ROLL (Only History) */}
      {type === 'history' && (
        <div className="mb-12 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shadow-sm">
                    <BookHeart className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-serif font-black text-2xl text-slate-900 leading-none">I Nostri Diari</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Collezione Momenti Speciali</p>
                </div>
            </div>

            {memories.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide snap-x" style={{ touchAction: 'pan-x' }}>
                    {memories.map((mem, i) => (
                        <MemoryItem 
                            key={i} 
                            type={mem.type} 
                            uri={mem.uri} 
                            title={mem.title} 
                            date={mem.date} 
                            onPlay={() => { if (mem.type === 'video') setActiveVideoUri({uri: mem.uri, title: mem.title}); }} 
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <PixarDiary className="w-32 h-32 mb-4 drop-shadow-sm opacity-90" />
                    <p className="text-slate-500 font-bold text-sm">Il diario è ancora vuoto!</p>
                    <p className="text-slate-400 text-xs max-w-xs text-center mt-1 leading-relaxed">
                        Completa un viaggio e crea un video ricordo per vederlo apparire qui.
                    </p>
                </div>
            )}
        </div>
      )}

      {/* PLAN CARDS */}
      {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            type={type}
            onDelete={onDelete}
            onMoveToActive={onMoveToActive}
            onUpdatePlan={onUpdatePlan}
            onSetVideoPlan={setVideoPlan}
            onPlayVideo={(uri, title) => setActiveVideoUri({uri, title})}
            onShare={handleSharePlan}
            onRateClick={(id, day) => setRateModalTarget({id, day})}
            onTogglePacking={onTogglePacking}
            onOpenMissionModal={(pid, txt, kids) => setMissionModal({planId: pid, missionText: txt, children: kids})}
            playStory={playStory}
            playingPlanId={playingPlanId}
            loadingAudioId={loadingAudioId}
            t={t}
          />
      ))}
    </div>
  );
};
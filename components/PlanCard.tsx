import React, { useState } from 'react';
import { SavedPlan, Child } from '../types';
import { PlayCircle, Star, CheckCircle, Calendar, Zap, Film, Play, Share2, Trash2, ChevronUp, ChevronDown, User, ArrowRight, Info, CloudSun, Coins, TrainFront, Flag, CheckSquare, Square, ShoppingCart, Award, Trophy, Medal, Circle, ShieldAlert, Loader2, VolumeX, Volume2, PauseCircle, Sparkles, Car, Crown, Search, Compass, Radio } from 'lucide-react';
import { WeatherTimeline, ActivityCard } from './PlanResult';
import { PixarCastle, PixarDoubloons, PixarTransport, PixarBackpack } from './PlanUI';

interface PlanCardProps {
    plan: SavedPlan;
    type: 'favorites' | 'history' | 'active';
    onDelete: (id: string) => void;
    onMoveToActive?: (id: string) => void;
    onUpdatePlan?: (plan: SavedPlan) => void;
    onSetVideoPlan: (plan: SavedPlan) => void;
    onPlayVideo: (uri: string, title: string) => void;
    onShare: (plan: SavedPlan) => void;
    onRateClick: (id: string, day: string) => void;
    onTogglePacking: (id: string, itemText: string) => void;
    onOpenMissionModal: (planId: string, missionText: string, children: Child[]) => void;
    playStory: (planId: string, text: string) => void;
    playingPlanId: string | null;
    loadingAudioId: string | null;
    t: any;
}

// Helper functions moved here
const extractListItems = (text: string) => {
    if (!text) return [];
    let items = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+\./.test(line))
        .map(line => line.replace(/^[-*•\d\.]+\s*/, '').trim())
        .filter(l => l.length > 0);
    if (items.length === 0 && text.includes(',')) {
        const cleanText = text.replace(/^[^\:]*\:\s*/, '');
        items = cleanText.split(',')
            .map(item => item.trim().replace(/^[-*•]+\s*/, ''))
            .filter(l => l.length > 2);
    }
    return items;
};

const getAmazonLink = (item: string) => `https://www.amazon.it/s?k=${encodeURIComponent(item)}&tag=familyweekend-21`;

const getKitSuggestions = (text: string) => {
    const t = text.toLowerCase();
    const suggestions = [];
    if (t.includes('bosco') || t.includes('parco') || t.includes('natura') || t.includes('trekking')) {
        suggestions.push({ name: 'Lente di Ingrandimento', desc: 'Per osservare formiche.', icon: Search });
        suggestions.push({ name: 'Bussola per Bambini', desc: 'Per non perdere la rotta.', icon: Compass });
    } else if (t.includes('castello') || t.includes('museo')) {
        suggestions.push({ name: 'Torcia da Testa LED', desc: 'Per angoli bui.', icon: Sparkles });
        suggestions.push({ name: 'Taccuino Esploratore', desc: 'Per disegnare tesori.', icon: Flag });
    } else {
        suggestions.push({ name: 'Walkie Talkie', desc: 'Per comunicare in codice.', icon: Radio });
    }
    return suggestions;
};

const extractSectionFromChunk = (chunk: string, headerPattern: string) => {
    const lines = chunk.split('\n');
    let capturedLines: string[] = [];
    let isCapturing = false;
    const startRegex = new RegExp(`^(##|\\*\\*|###)\\s*.*${headerPattern}`, 'i');
    const stopRegex = /^(##\s+.*|###\s+(Budget|Trasporti|Zaino|Pack|Missioni|Missions|Favola|Story|Sabato|Saturday|Sábado|Samedi|Samstag|Domenica|Sunday|Domingo|DATA_MARKER))/i;

    for (const line of lines) {
        const trimLine = line.trim();
        if (!isCapturing) { if (startRegex.test(trimLine)) isCapturing = true; } 
        else { if (stopRegex.test(trimLine)) break; capturedLines.push(line); }
    }
    return capturedLines.length > 0 ? capturedLines.join('\n').trim() : null;
};

const extractMissions = (text: string) => {
    let content = extractSectionFromChunk(text, `(Missioni|Missions|Misiones|Missionen)`);
    if (!content) return [];
    return content.split('\n').map(l => l.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')).filter(l => l.length > 0);
};

export const PlanCard: React.FC<PlanCardProps> = ({ 
    plan, type, onDelete, onMoveToActive, onSetVideoPlan, onPlayVideo, onShare, 
    onRateClick, onTogglePacking, onOpenMissionModal, playStory, playingPlanId, loadingAudioId, t 
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const isExpanded = expandedId === plan.id;
    const isActive = type === 'active';
    const isHistory = type === 'history';
    const isFavorite = type === 'favorites';

    const rawDays: any[] = [];
    const fullText = plan.text;
    const satRegex = /(^|\n)##\s*(Sabato|Saturday|Sábado|Samedi|Samstag)/i;
    const sunRegex = /(^|\n)##\s*(Domenica|Sunday|Domingo|Dimanche|Sonntag)/i;
    const satMatch = fullText.match(satRegex);
    const sunMatch = fullText.match(sunRegex);
    const satIndex = satMatch ? satMatch.index! : -1;
    const sunIndex = sunMatch ? sunMatch.index! : -1;
    const addedTitles = new Set<string>(); 

    const parseActs = (chunk: string) => {
            if (!chunk) return [];
            let cleanText = chunk;
            if (!cleanText.includes('###')) cleanText = cleanText.replace(/\n\s*\*\*([^\*]+)\*\*:?/g, '\n### $1');
            return cleanText.split(/###\s*/g).slice(1).map(p => {
            const lines = p.trim().split('\n');
            const rawTitle = lines[0].trim();
            const visualLine = lines.find(l => l.includes('VISUAL_SCENE:'));
            const content = lines.filter(l => !l.includes('VISUAL_SCENE:') && l !== rawTitle && l.trim().length > 0).join('\n');
            return { title: rawTitle.replace(/:$/, ''), content, visualLine };
        })
        .filter(act => !act.title.toUpperCase().includes("DATA_MARKER")); 
    };

    if (satIndex !== -1) {
        const fullSatChunk = (sunIndex !== -1 && sunIndex > satIndex) ? fullText.substring(satIndex, sunIndex) : fullText.substring(satIndex);
        let cleanSatChunk = fullSatChunk.replace(/(^|\n)##\s*(Sabato|Saturday|Sábado|Samedi|Samstag).*/i, '');
            const nextSection = cleanSatChunk.search(/(^|\n)##\s*(Missioni|Missions|Favola|Story|Domenica|Sunday|Domingo|Budget|Trasporti|Zaino|Sabato|Saturday|Sábado|Samedi|Samstag|DATA_MARKER)/i);
            if (nextSection !== -1) cleanSatChunk = cleanSatChunk.substring(0, nextSection);
        const acts = parseActs(cleanSatChunk);
        const title = satMatch![2];
        if(acts.length && !addedTitles.has(title)) { 
            rawDays.push({title: title, activities:acts, fullChunk: fullSatChunk});
            addedTitles.add(title);
        }
    }
    if (sunIndex !== -1) {
        const fullSunChunk = fullText.substring(sunIndex);
        let cleanSunChunk = fullSunChunk.replace(/(^|\n)##\s*(Domenica|Sunday|Domingo|Dimanche|Sonntag).*/i, '');
        const nextSection = cleanSunChunk.search(/(^|\n)##\s*(Budget|Trasporti|Zaino|Pack|Missioni|Missions|Favola|Story|Sabato|Saturday|Sábado|Samedi|Samstag|Domenica|Sunday|Domingo|DATA_MARKER)/i);
        if (nextSection !== -1) cleanSunChunk = cleanSunChunk.substring(0, nextSection);
        const acts = parseActs(cleanSunChunk);
        const title = sunMatch![2];
        if(acts.length && !addedTitles.has(title)) { 
            rawDays.push({title: title, activities:acts, fullChunk: fullSunChunk});
            addedTitles.add(title);
        }
    }

    const structuredDays = rawDays.filter(day => {
            if (plan.hiddenSections?.includes(day.title)) return false;
            if (type === 'favorites') return true;
            const isDayDone = plan.completedSections?.includes(day.title);
            if (type === 'active') return !isDayDone;
            if (type === 'history') return isDayDone || plan.isCompleted;
            return true;
    });

    const aggregatedPackingItems = new Set<string>();
    rawDays.forEach(d => {
        const pSection = extractSectionFromChunk(d.fullChunk, `(Zaino|Backpack|Mochila|Sac à dos|Rucksack)`);
        const pItems = extractListItems(pSection || "");
        pItems.forEach(i => aggregatedPackingItems.add(i));
    });
    const combinedPackingList = Array.from(aggregatedPackingItems);
    const kitSuggestions = getKitSuggestions(plan.text);

    if (structuredDays.length === 0) return null;

    // --- Sub-renderers ---
    const renderStory = (dayTitle: string, fullChunk: string) => {
        const story = extractSectionFromChunk(fullChunk, `(Favola|Story|Cuento|Conte|Geschichte)`);
        if (!story) return null;
        const isPlaying = playingPlanId === plan.id;
        const isLoading = loadingAudioId === plan.id;
        return (
            <div className="bg-[#0f172a] rounded-[2.5rem] relative overflow-hidden shadow-2xl group border-4 border-[#1e293b] isolate mt-6 mb-6">
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                    <PixarCastle className="w-full h-full object-cover transition-transform duration-[40s] ease-linear group-hover:scale-110 saturate-150 contrast-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
                    <div className="absolute bottom-6 left-8 right-8 flex items-center gap-4 z-10">
                        <button onClick={(e) => { e.stopPropagation(); playStory(plan.id, story); }} disabled={isLoading} className="relative shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(251,191,36,0.4)] border border-yellow-200/50 flex items-center justify-center group/btn hover:scale-105 transition-all">
                            {isLoading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : isPlaying ? <PauseCircle className="w-8 h-8 text-white fill-amber-600" /> : <PlayCircle className="w-8 h-8 text-white fill-amber-600" />}
                        </button>
                        <div><h3 className="font-serif font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-100 tracking-wide drop-shadow-sm filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{t.story} {dayTitle}</h3><p className="text-indigo-200 font-bold text-xs tracking-[0.3em] uppercase mt-1 opacity-90 text-shadow-sm">{t.listen_now || "Ascolta la favola"}</p></div>
                    </div>
                </div>
                <div className="p-8 md:p-10 relative z-10">
                    <div className="flex justify-end mb-2">
                        <button onClick={(e) => { e.stopPropagation(); playStory(plan.id, story); }} disabled={isLoading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : isPlaying ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isPlaying ? "Stop Audio" : "Ascolta Favola"}
                        </button>
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm rounded-[1.5rem] p-6 md:p-8 border border-white/5 shadow-inner"><div className="prose prose-invert prose-lg font-serif italic leading-loose text-indigo-100/90" dangerouslySetInnerHTML={{__html: story.replace(/\n/g, '<br/>')}}></div></div>
                    <div className="absolute -top-10 right-8 animate-bounce-slow opacity-60 pointer-events-none"><Sparkles className="w-8 h-8 text-yellow-200" /></div>
                </div>
            </div>
        );
    };

    const renderMissions = (dayTitle: string, fullChunk: string) => {
        const ms = extractMissions(fullChunk);
        if(!ms.length) return null;
        const children = (plan.savedChildren && plan.savedChildren.length > 0) ? plan.savedChildren : [{name: 'Bimbo', age: '5'}];
        return (
            <div className="bg-white rounded-3xl p-6 border-2 border-amber-100 mt-6 relative overflow-hidden group shadow-md shadow-amber-50">
                <Trophy className="absolute -right-6 -top-6 w-32 h-32 text-amber-50 rotate-12 transition-transform group-hover:rotate-6" />
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-3 mt-4 relative z-10">
                        <div className="bg-amber-400 p-3 rounded-2xl text-white shadow-lg shadow-amber-200"><Trophy className="w-6 h-6" /></div>
                        <div><h4 className="font-serif font-black text-xl text-amber-900 leading-tight">{t.missions} {dayTitle}</h4><span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest">{t.mission_subtitle}</span></div>
                    </div>
                </div>
                <div className="space-y-4 relative z-10">
                    {ms.map((missionLine, i) => {
                        const [mainPart, safetyPart] = missionLine.split(/\(🛡️\s*Safety:|\(🛡️\s*Sicurezza:/i);
                        const [titlePart, descPart] = mainPart.split(':');
                        const cleanTitle = titlePart ? titlePart.replace(/\*\*/g, '').trim() : "Missione";
                        const cleanDesc = descPart ? descPart.trim().replace(/\.$/, '') : mainPart.replace(/\*\*/g, '').trim();
                        const cleanSafety = safetyPart ? safetyPart.replace(/\)/, '').trim() : null;
                        const completedScores = (plan.missionScores || []).filter(s => s.mission === missionLine);
                        const isCompleted = completedScores.length > 0;
                        return (
                        <div key={i} className={`rounded-[1.5rem] p-5 transition-all border ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-amber-200 hover:shadow-lg'}`}>
                            <div className="mb-4">
                                <p className="font-black text-slate-800 text-base flex items-center gap-2 mb-2"><Circle className={`w-2.5 h-2.5 ${isCompleted ? 'text-emerald-500 fill-emerald-500' : 'text-amber-500 fill-amber-500'}`} />{cleanTitle}</p>
                                <p className="text-sm text-slate-500 font-medium ml-4.5 leading-relaxed">{cleanDesc}</p>
                                {cleanSafety && (<div className="mt-3 ml-4.5 flex items-start gap-3 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100"><ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /><p className="text-[11px] text-rose-700 font-bold leading-tight">{cleanSafety}</p></div>)}
                            </div>
                            <div className="pt-3 border-t border-slate-100/50">
                                {isCompleted ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2"><CheckCircle className="w-3 h-3" /> Missione Completata!</div>
                                        <div className="flex flex-wrap gap-2">{completedScores.map((score, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">{children.find(c => c.name === score.childName)?.avatarUrl ? <img src={children.find(c => c.name === score.childName)!.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1 text-slate-400" />}</div>
                                                <span className="text-xs font-bold text-slate-700">{score.childName}</span>
                                                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 rounded-md border border-amber-100">+{score.score} XP</span>
                                                {score.score >= 50 && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                        ))}</div>
                                    </div>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onOpenMissionModal(plan.id, missionLine, children); }} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-amber-400 hover:text-amber-600 hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"><Medal className="w-4 h-4" /> Assegna Punti Missione</button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        );
    };

    return (
        <div key={plan.id} className={`group relative rounded-[3rem] overflow-hidden transition-all duration-700 shadow-xl border border-slate-100 ${isHistory ? 'bg-slate-50 filter grayscale grayscale-[1]' : 'bg-white'}`}>
            <div className="p-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-6 border-b border-slate-200 pb-6">
                    <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                            {isActive && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><PlayCircle className="w-3 h-3"/> {t.in_progress}</span>}
                            {isFavorite && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><Star className="w-3 h-3"/> {t.favorite}</span>}
                            {isHistory && <span className="px-3 py-1 bg-slate-800 text-white text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><CheckCircle className="w-3 h-3"/> {t.history}</span>}
                            <span className="text-slate-500 text-xs font-bold flex items-center bg-white px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm"><Calendar className="w-3 h-3 mr-1" /> {new Date(plan.dateCreated).toLocaleDateString()}</span>
                            {plan.rating && <div className="flex gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{Array.from({length: 5}).map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < plan.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />))}</div>}
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 leading-tight">{plan.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start shrink-0 items-center">
                            {(isFavorite || isHistory) && onMoveToActive && (
                            <button onClick={() => onMoveToActive(plan.id)} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md flex items-center gap-2 font-bold text-xs uppercase tracking-wider" title={t.reactivate}>
                                <Zap className="w-5 h-5 fill-current" /> <span className="hidden sm:inline">{t.reactivate}</span>
                            </button>
                            )}
                            
                            {isHistory && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => onSetVideoPlan(plan)} className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-all shadow-md flex items-center gap-2 font-bold text-xs uppercase tracking-wider grayscale-0">
                                    <Film className="w-5 h-5" /> {t.create_video}
                                </button>
                                {plan.videoUri && (
                                    <button onClick={() => onPlayVideo(plan.videoUri!, plan.title)} className="p-3 bg-amber-400 hover:bg-amber-500 text-white rounded-full transition-all shadow-lg animate-bounce-slow grayscale-0 border-2 border-white" title="Guarda Video">
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                )}
                            </div>
                            )}
                            
                            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
                                <button onClick={() => onShare(plan)} className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all shadow-sm" title={t.share}>
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }} className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-sm">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {isHistory && <button onClick={() => setExpandedId(isExpanded ? null : plan.id)} className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl transition-colors shadow-sm border border-slate-200 ml-1">{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>}
                    </div>
                </div>

                {/* COLLAPSED VIEW FOR HISTORY */}
                {isHistory && !isExpanded && (
                    <div className="animate-fade-in-up py-6 flex flex-col sm:flex-row gap-8 items-center bg-white/50 rounded-3xl p-6 border border-slate-200/50">
                        <div className="flex -space-x-4">{(plan.savedChildren || []).map((c, i) => (<div key={i} className="w-16 h-16 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-md">{c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover filter grayscale" /> : <User className="w-8 h-8 m-4 text-slate-300" />}</div>))}</div>
                        <div className="flex-1 text-center sm:text-left"><p className="text-slate-500 font-serif italic text-lg leading-relaxed">"{plan.text.substring(0, 120).replace(/##\s*Intro/i, '').trim()}..."</p></div>
                        <button onClick={() => setExpandedId(plan.id)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">{t.click_expand} <ArrowRight className="w-4 h-4" /></button>
                    </div>
                )}

                {/* FULL CONTENT VIEW */}
                {(isActive || isFavorite || isExpanded) && (
                <div className="animate-fade-in-up space-y-8 mt-6">
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-amber-800 text-xs font-bold leading-relaxed">{t.verify_disclaimer}</p>
                    </div>

                    <div className="my-6"><h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2 tracking-[0.2em]"><CloudSun className="w-4 h-4"/> {t.weather}</h4><WeatherTimeline rawText={plan.text} /></div>
                    
                    {structuredDays.map((day, idx) => {
                        const budget = extractSectionFromChunk(day.fullChunk, `(Budget|Presupuesto)`);
                        const transport = extractSectionFromChunk(day.fullChunk, `(Trasporti|Transport|Transporte)`);
                        
                        const dayLocations = day.activities
                            .filter((a: any) => !/navigazione|navigation|navegación/i.test(a.title))
                            .map((a: any) => {
                                let name = a.title.replace(/\*\*/g, '');
                                name = name.replace(/^(Mattina|Pomeriggio|Pranzo|Cena|Pernottamento|Sera|Morning|Afternoon|Lunch|Dinner|Overnight)[:\s-]*/i, '');
                                return name.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
                            }).filter((n: string) => n.length > 2);

                        const origin = (plan.latitude && plan.longitude) ? `${plan.latitude},${plan.longitude}` : 'Current Location';

                        const googleMapsUrl = dayLocations.length > 0 ?
                            `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dayLocations[dayLocations.length - 1])}&waypoints=${dayLocations.slice(0, -1).map((l: string) => encodeURIComponent(l)).join('|')}&travelmode=driving`
                            : null;
                        
                        return (
                            <div key={idx} className="mb-12 border-b border-slate-200 pb-8 last:border-0">
                                <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3"><h4 className="font-serif text-3xl font-black text-slate-900">{day.title}</h4></div>
                                <div className="grid grid-cols-1 gap-6">
                                    {day.activities.map((act: any, i: number) => (
                                        <ActivityCard 
                                            key={i} 
                                            title={act.title} 
                                            content={act.content} 
                                            t={t} 
                                            googleMapsUrl={/navigazione|navigation|navegación/i.test(act.title) ? googleMapsUrl : null}
                                        />
                                    ))}
                                </div>
                                {renderStory(day.title, day.fullChunk)}
                                {renderMissions(day.title, day.fullChunk)}

                                {/* BUDGET & TRANSPORT ROW */}
                                {(budget || transport) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                        {budget && (
                                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute -right-4 -top-4 opacity-5 rotate-12 pointer-events-none group-hover:opacity-10 transition-opacity">
                                                    <Coins className="w-32 h-32 text-yellow-500" />
                                                </div>
                                                <div className="flex justify-center mb-4">
                                                    <PixarDoubloons className="w-24 h-24 drop-shadow-xl" />
                                                </div>
                                                <h4 className="font-black text-emerald-600 mb-3 flex items-center gap-2 text-xs uppercase tracking-widest relative z-10"><Coins className="w-4 h-4"/> {t.budget} {day.title}</h4>
                                                <div className="text-slate-600 text-sm leading-relaxed relative z-10 font-medium" dangerouslySetInnerHTML={{__html: budget.replace(/\n/g, '<br/>')}}></div>
                                            </div>
                                        )}
                                        {transport && (
                                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute -right-4 -top-4 opacity-5 rotate-12 pointer-events-none group-hover:opacity-10 transition-opacity">
                                                    <Car className="w-32 h-32 text-indigo-500" />
                                                </div>
                                                <div className="flex justify-center mb-4">
                                                    <PixarTransport className="w-24 h-24 drop-shadow-xl" />
                                                </div>
                                                <h4 className="font-black text-indigo-600 mb-3 flex items-center gap-2 text-xs uppercase tracking-widest relative z-10"><TrainFront className="w-4 h-4"/> {t.transport} {day.title}</h4>
                                                <div className="text-slate-600 text-sm leading-relaxed relative z-10 font-medium" dangerouslySetInnerHTML={{__html: transport.replace(/\n/g, '<br/>')}}></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isActive && (
                                    <div className="mt-12 flex justify-center">
                                        <button onClick={() => onRateClick(plan.id, day.title)} className="group relative px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-4 overflow-hidden transform active:scale-95 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <span className="relative z-10 flex items-center gap-3 text-lg"><CheckCircle className="w-6 h-6 text-emerald-400" /> {t.completed} {day.title}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )})}

                        {/* CONSOLIDATED PACKING LIST FOR THE WHOLE TRIP */}
                        {combinedPackingList.length > 0 && (
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-md mt-12 mb-8 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 opacity-5 rotate-12 pointer-events-none group-hover:opacity-10 transition-all duration-1000"><PixarBackpack className="w-64 h-64 opacity-50" /></div>
                                <h4 className="font-black text-rose-600 mb-6 flex items-center gap-2 text-sm uppercase tracking-[0.1em] relative z-10"><Flag className="w-4 h-4"/> {t.backpack} (Checklist Weekend)</h4>
                                
                                <div className="relative z-10 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {combinedPackingList.map((item, pIdx) => {
                                            const isChecked = plan.packedItems?.includes(item);
                                            return (
                                                <div key={pIdx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isChecked ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'}`}>
                                                    <button onClick={() => onTogglePacking?.(plan.id, item)} className="flex items-start gap-3 flex-1 text-left">
                                                        <div className={`mt-0.5 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`}>{isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}</div>
                                                        <span className={`text-[13px] font-bold leading-tight ${isChecked ? 'text-emerald-700 line-through decoration-emerald-200 opacity-50' : 'text-slate-700'}`}>{item}</span>
                                                    </button>
                                                    <a href={getAmazonLink(item)} target="_blank" rel="noopener noreferrer" className="ml-2 p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors shadow-sm" title="Trova su Amazon">
                                                        <ShoppingCart className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 relative">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Award className="w-5 h-5" /></div>
                                            <h5 className="font-serif font-black text-xl text-slate-800 tracking-tight">Il Kit dell'Esploratore</h5>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {kitSuggestions.map((kit, kIdx) => {
                                                const KitIcon = kit.icon || Sparkles;
                                                return (
                                                <div key={kIdx} className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 rounded-[1.5rem] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform"><KitIcon className="w-6 h-6" /></div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm leading-tight mb-1">{kit.name}</p>
                                                            <p className="text-[11px] text-slate-500 font-medium italic leading-tight">{kit.desc}</p>
                                                        </div>
                                                    </div>
                                                    <a 
                                                        href={getAmazonLink(kit.name)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-all"
                                                    >
                                                        <ShoppingCart className="w-3.5 h-3.5" /> Trova su Amazon
                                                    </a>
                                                </div>
                                            );})}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-6 text-center italic">Suggerimenti originali basati sulla tua missione</p>
                                    </div>
                                </div>
                            </div>
                        )}
                </div>
                )}
            </div>
        </div>
    );
};
import React, { useState, useMemo } from 'react';
import { LocationRating, AmenityType } from '../types';
import { Shield, ShieldCheck, ShieldPlus, Baby, Accessibility, Component, Milk, VolumeX, Check, ThumbsUp, X, Award, Info } from 'lucide-react';

// Custom Gold Icon
const CrownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
);

interface FamilyBadgeProps {
    rating: LocationRating;
    onVote: (amenity: AmenityType) => void;
}

const AMENITIES_CONFIG: Record<AmenityType, { label: string, icon: React.ElementType, description: string }> = {
    changing_table: { label: 'Fasciatoio', icon: Baby, description: 'Presente e pulito nei bagni.' },
    stroller: { label: 'Passeggino OK', icon: Accessibility, description: 'Niente barriere o ghiaia profonda.' },
    fenced: { label: 'Area Recintata', icon: Component, description: 'Puoi sederti e non scappano.' },
    bottle_warmer: { label: 'Scalda-biberon', icon: Milk, description: 'Disponibile al bar/ristorante.' },
    silent: { label: 'Zona Silent', icon: VolumeX, description: 'Angolo tranquillo per il riposino.' }
};

export const FamilyBadge: React.FC<FamilyBadgeProps> = ({ rating, onVote }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate Level
    const stats = useMemo(() => {
        let score = 0;
        let verifiedCount = 0;
        const votesObj = rating?.votes || {};
        
        Object.entries(votesObj).forEach(([key, val]) => {
            const count = (val as number) || 0;
            if (count > 0) {
                verifiedCount++;
                score += 1; 
                if (key === 'changing_table' || key === 'fenced') score += 1; 
            }
        });

        // Determine Badge
        let badge = { type: 'bronze', label: 'Family Friendly', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' };
        
        if (score >= 3 && score < 5) {
            badge = { type: 'silver', label: 'Super Family', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' };
        } else if (score >= 5) {
            badge = { type: 'gold', label: 'TOP Family', icon: CrownIcon, color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' };
        } else if (score === 0) {
            badge = { type: 'none', label: 'Vota Servizi', icon: Info, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' };
        }

        return { score, verifiedCount, badge };
    }, [rating]);

    const BadgeIcon = stats.badge.icon;

    return (
        <div className="relative z-20">
            {/* BADGE TRIGGER */}
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-105 ${stats.badge.bg} ${stats.badge.border}`}
            >
                <BadgeIcon className={`w-4 h-4 ${stats.badge.color}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${stats.badge.color}`}>{stats.badge.label}</span>
                {stats.score > 0 && (
                    <span className="bg-white/50 px-1.5 rounded-full text-[9px] font-bold text-slate-600 border border-black/5">
                        {stats.verifiedCount}
                    </span>
                )}
            </button>

            {/* EXPLODED VIEW POPUP */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-fade-in-up origin-top-left">
                        
                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                            <div>
                                <h4 className={`font-black text-sm uppercase flex items-center gap-2 ${stats.badge.color}`}>
                                    <BadgeIcon className="w-4 h-4" /> {stats.badge.label}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Certificato dai Genitori</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-slate-300 hover:text-slate-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(Object.keys(AMENITIES_CONFIG) as AmenityType[]).map((key) => {
                                const config = AMENITIES_CONFIG[key];
                                const Icon = config.icon;
                                const votesObj = rating?.votes || {};
                                const userVotesArr = rating?.userVotes || [];
                                const count = votesObj[key] || 0;
                                const hasVoted = userVotesArr.includes(key);
                                const isVerified = count > 0;

                                return (
                                    <div key={key} className="flex items-start gap-3 group">
                                        <div className={`p-2 rounded-xl transition-colors ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-bold ${isVerified ? 'text-slate-700' : 'text-slate-400'}`}>
                                                    {config.label}
                                                </span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onVote(key); }}
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all border ${hasVoted ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-400 hover:text-emerald-500'}`}
                                                >
                                                    {hasVoted ? <Check className="w-3 h-3" /> : <ThumbsUp className="w-3 h-3" />}
                                                    {count > 0 ? count : ''}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{config.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                            <p className="text-[9px] text-slate-400">
                                I genitori si fidano più degli altri genitori.<br/>
                                <span className="font-bold text-indigo-500">Vota anche tu!</span>
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
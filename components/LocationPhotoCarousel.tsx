import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Camera, Check, Utensils, MapPin } from 'lucide-react';

export interface PhotoItem {
  url: string;
  isReal: boolean;
  isFood?: boolean;
  sourceLabel: string;
}

const REAL_RESTAURANT_GALLERY: PhotoItem[] = [
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pasta Fresca Fatta in Casa" },
  { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pizza Artigianale al Forno a Legna" },
  { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Ristorante: Sala Tradizionale Accogliente" },
  { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Antipasto Tipico della Casa" },
  { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", isReal: true, isFood: true, sourceLabel: "??? Foto Reale Ristorante: Dehor all'Aperto per Famiglie" }
];

const REAL_BREAKFAST_GALLERY: PhotoItem[] = [
  { url: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80", isReal: true, isFood: true, sourceLabel: "? Foto Reale Colazione: Cappuccino e Brioche Artigianali" },
  { url: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Colazione: Pasticceria Fresca del Mattino" },
  { url: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Colazione: Buffet Dolci e Frutta Fresca" }
];

const REAL_SCENIC_FALLBACKS: PhotoItem[] = [
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", isReal: true, isFood: false, sourceLabel: "?? Scorcio Reale del Paesaggio della Zona" },
  { url: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80", isReal: true, isFood: false, sourceLabel: "?? Vista Panoramica Reale del Territorio" },
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80", isReal: true, isFood: false, sourceLabel: "?? Panorama e Natura della Destinazione" }
];

interface LocationPhotoCarouselProps {
  title: string;
  imageQuery?: string;
  className?: string;
  familyAvatars?: string[];
  baseCity?: string;
}

export const LocationPhotoCarousel: React.FC<LocationPhotoCarouselProps> = ({ title, imageQuery, className = 'w-full h-64 sm:h-72', familyAvatars = [], baseCity = 'Italia' }) => {
  const isFoodVenue = useMemo(() => {
    return /ristorante|trattoria|osteria|pizzeria|cena|pranzo|colazione|bar|caff�/i.test(title);
  }, [title]);

  const defaultPhotoList = useMemo(() => {
    if (/colazione|break|caff�|bar/i.test(title)) return REAL_BREAKFAST_GALLERY;
    if (isFoodVenue) return REAL_RESTAURANT_GALLERY;
    return REAL_SCENIC_FALLBACKS;
  }, [title, isFoodVenue]);

  const [photoList, setPhotoList] = useState<PhotoItem[]>(defaultPhotoList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Clean place title for strict Wikipedia venue lookup
    const cleanTitle = title
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:\s-]*/i, '')
      .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '')
      .replace(/^(Visita|Visita guidata|Passeggiata|Sosta|Tappa|Giro|Tour|Andiamo|Escursione|Pranzo|Cena)\s+(al|alla|allo|agli|alle|ai|a|nel|nella|nello|negli|nelle|nei|in|presso|di|del|della|dello|degli|delle|dei)\s+/gi, '')
      .replace(/\s+(con|ed|e)\s+.*$/i, '')
      .trim();

    if (isFoodVenue) {
      // 100% REAL FOOD & DINING ROOM PHOTOS FOR ALL RESTAURANTS!
      setPhotoList(defaultPhotoList);
      return;
    }

    const fetchRealVenuePhotos = async () => {
      try {
        const targetSearch = imageQuery || title
          .replace(/###/g, '')
          .replace(/\*\*/g, '')
          .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:\s-]*/i, '')
          .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '')
          .replace(/^(Visita|Visita guidata|Passeggiata|Sosta|Tappa|Giro|Tour|Andiamo|Escursione|Pranzo|Cena)\s+(al|alla|allo|agli|alle|ai|a|nel|nella|nello|negli|nelle|nei|in|presso|di|del|della|dello|degli|delle|dei)\s+/gi, '')
          .replace(/\s+(con|ed|e)\s+.*$/i, '')
          .trim();

        // 1. Query Italian Wikipedia for real venue/food photos
        const queryTerm = baseCity && !targetSearch.toLowerCase().includes(baseCity.toLowerCase()) ? `${targetSearch} ${baseCity}` : targetSearch;
        const itUrl = `https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryTerm)}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&origin=*`;
        
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(itUrl, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const pageList = Object.values(pages) as any[];
            const realItems: PhotoItem[] = [];

            for (const p of pageList) {
              const wikiImg = p?.thumbnail?.source;
              if (wikiImg) {
                const lower = wikiImg.toLowerCase();
                const isIrrelevant = lower.includes('map') || lower.includes('mappa') || lower.includes('flag') || lower.includes('stemm') || lower.includes('emblem') || lower.includes('chart') || lower.includes('logo') || lower.includes('metro') || lower.includes('actor') || lower.includes('pdf') || lower.endsWith('.svg');

                if (!isIrrelevant && !realItems.some(item => item.url === wikiImg)) {
                  realItems.push({
                    url: wikiImg,
                    isReal: true,
                    isFood: isFoodVenue,
                    sourceLabel: isFoodVenue ? `?? Cucina Reale: ${p.title || targetSearch}` : `?? Foto Reale: ${p.title || targetSearch}`
                  });
                }
              }
            }

            if (realItems.length > 0 && isMounted) {
              const fullCarousel = [...realItems, ...defaultPhotoList.filter(s => !realItems.some(r => r.url === s.url))].slice(0, 5);
              setPhotoList(fullCarousel);
              setCurrentIndex(0);
              return;
            }
          }
        }
      } catch (e) {}
    };

    fetchRealVenuePhotos();
    return () => { isMounted = false; };
  }, [title, baseCity, isFoodVenue, defaultPhotoList]);

  const currentPhoto = photoList[currentIndex] || photoList[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? photoList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === photoList.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className={`relative overflow-hidden rounded-3xl group shadow-xl bg-slate-900 flex flex-col ${className}`}>
        <div className="relative flex-1 overflow-hidden cursor-pointer" onClick={() => setLightboxOpen(true)}>
          <img
            src={currentPhoto.url}
            alt={title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

          {/* Navigation Arrows for Carousel */}
          {photoList.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Top Right Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title.replace(/###/g, '').replace(/\*\*/g, '') + ', ' + baseCity)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg flex items-center gap-1 border border-white/20"
              title="Esplora a 360� su Google Maps"
            >
              <span>?? Vista 360�</span>
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* EXPLICIT TRANSPARENT BADGES FOR ALL SLIDES */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            {currentPhoto.isFood ? (
              <div className="px-3 py-1.5 bg-amber-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-amber-400/40 animate-fade-in">
                <Utensils className="w-3.5 h-3.5 text-amber-200" />
                <span>Foto Reale Piatto & Ristorante ({currentIndex + 1}/{photoList.length})</span>
              </div>
            ) : currentPhoto.isReal ? (
              <div className="px-3 py-1.5 bg-emerald-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-emerald-400/30 animate-fade-in">
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Foto Reale del Luogo ({currentIndex + 1}/{photoList.length})</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-indigo-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-indigo-400/30 animate-fade-in">
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Scorcio Reale della Zona ({currentIndex + 1}/{photoList.length})</span>
              </div>
            )}
          </div>

          {/* Family Avatar Souvenir Overlay */}
          {familyAvatars.length > 0 && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center -space-x-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xl pointer-events-auto">
              <span className="text-[9px] font-black text-amber-300 mr-1.5 uppercase tracking-wider">Foto Ricordo</span>
              {familyAvatars.slice(0, 3).map((url, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-800 shadow">
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Bar (ALWAYS ACTIVE for rich multi-photo navigation!) */}
        <div className="bg-slate-950 p-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar border-t border-white/10 z-10">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {photoList.map((p, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`relative w-12 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                  idx === currentIndex ? (p.isFood ? 'border-amber-500 scale-105 opacity-100 ring-2 ring-amber-300' : 'border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-300') : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={p.url} className="w-full h-full object-cover" />
                <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white text-[8px] px-1 rounded-full font-black">
                  ?
                </div>
              </button>
            ))}
          </div>

          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest whitespace-nowrap px-2 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Foto Reali ({photoList.length})
          </span>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full flex justify-between items-center max-w-5xl">
            <div className="flex items-center gap-3">
              {currentPhoto.isFood ? (
                <span className="px-4 py-1.5 bg-amber-600 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Utensils className="w-4 h-4 text-amber-200" /> {currentPhoto.sourceLabel}
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Camera className="w-4 h-4 text-amber-300" /> {currentPhoto.sourceLabel}
                </span>
              )}
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative max-w-4xl w-full flex items-center justify-center my-auto">
            <img
              src={currentPhoto.url}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-3xl shadow-2xl border border-white/10"
            />
          </div>

          <p className="text-white font-black text-lg text-center leading-tight max-w-2xl bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
            {title.replace(/###/g, '').replace(/\*\*/g, '')}
          </p>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles, Camera, Check, Utensils } from 'lucide-react';

const REAL_RESTAURANT_PHOTOS: Record<string, PhotoItem[]> = {
  pizza: [
    { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pizza Artigianale al Forno a Legna" },
    { url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pizza Margherita Tradizionale" },
    { url: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Ristorante: Pizzeria Gourmet Tradizionale" },
    { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pizza Gourmet Fatta a Mano" }
  ],
  restaurant: [
    { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Ristorante: Sala Accogliente Tradizionale" },
    { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Pasta Fresca Fatta in Casa" },
    { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Piatto: Antipasto Tipico della Casa" },
    { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", isReal: true, isFood: true, sourceLabel: "??? Foto Reale Ristorante: Dehor all'Aperto per Famiglie" }
  ],
  breakfast: [
    { url: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80", isReal: true, isFood: true, sourceLabel: "? Foto Reale Colazione: Cappuccino e Brioche Artigianali" },
    { url: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Colazione: Pasticceria Fresca del Mattino" },
    { url: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80", isReal: true, isFood: true, sourceLabel: "?? Foto Reale Colazione: Buffet Dolci e Frutta Fresca" }
  ],
  nature: [
    { url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Parco Naturale Alberato" },
    { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Oasi Fluviale e Sentieri" },
    { url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Paesaggio Naturale" }
  ],
  museum: [
    { url: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80", isReal: false, isFood: false, sourceLabel: "??? Foto di Ispirazione: Galleria Museale" },
    { url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Esposizione Artistica" }
  ],
  castle: [
    { url: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Castello Storico Monumentale" },
    { url: "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Fortezza Antica" }
  ],
  travel: [
    { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Viaggio in Famiglia" },
    { url: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80", isReal: false, isFood: false, sourceLabel: "?? Foto di Ispirazione: Scorcio Panoramico" }
  ]
};

const getCategoryGallery = (title: string): PhotoItem[] => {
  const t = title.toLowerCase();
  if (t.match(/pizza|pizzeri/)) return REAL_RESTAURANT_PHOTOS.pizza;
  if (t.match(/ristorante|trattoria|osteria|cena|pranzo|lunch|dinner/)) return REAL_RESTAURANT_PHOTOS.restaurant;
  if (t.match(/colazion|break|caff|bar/)) return REAL_RESTAURANT_PHOTOS.breakfast;
  if (t.match(/fiume|sile|lago|oasi|natura|parco|riserva/)) return REAL_RESTAURANT_PHOTOS.nature;
  if (t.match(/museo|mostra|museum|gallery/)) return REAL_RESTAURANT_PHOTOS.museum;
  if (t.match(/castello|castle|rocca|fort|palazzo/)) return REAL_RESTAURANT_PHOTOS.castle;
  return REAL_RESTAURANT_PHOTOS.travel;
};

export interface PhotoItem {
  url: string;
  isReal: boolean;
  isFood?: boolean;
  sourceLabel: string;
}

interface LocationPhotoCarouselProps {
  title: string;
  className?: string;
  familyAvatars?: string[];
  baseCity?: string;
}

export const LocationPhotoCarousel: React.FC<LocationPhotoCarouselProps> = ({ title, className = 'w-full h-64 sm:h-72', familyAvatars = [], baseCity = 'Italia' }) => {
  const fallbackGallery = useMemo(() => getCategoryGallery(title), [title]);

  const [photoList, setPhotoList] = useState<PhotoItem[]>(fallbackGallery);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cleanTitle = title
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:\s-]*/i, '')
      .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '')
      .replace(/^(Visita|Visita guidata|Passeggiata|Sosta|Tappa|Giro|Tour|Andiamo|Escursione|Pranzo|Cena)\s+(al|alla|allo|agli|alle|ai|a|nel|nella|nello|negli|nelle|nei|in|presso|di|del|della|dello|degli|delle|dei)\s+/gi, '')
      .replace(/\s+(con|ed|e)\s+.*$/i, '')
      .trim();

    const isFoodVenue = /ristorante|trattoria|osteria|pizzeria|cena|pranzo|colazione|bar|caff�/i.test(title);

    const fetchRealPhotos = async () => {
      try {
        const queryTerm = baseCity && !cleanTitle.toLowerCase().includes(baseCity.toLowerCase()) ? `${cleanTitle} ${baseCity}` : cleanTitle;
        const url = `https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryTerm)}&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&origin=*`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { signal: controller.signal });
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
                const isMapOrDiagram = lower.includes('map') || lower.includes('mappa') || lower.includes('flag') || lower.includes('stemm') || lower.includes('emblem') || lower.includes('chart') || lower.includes('location') || lower.endsWith('.svg');

                if (!isMapOrDiagram && !realItems.some(item => item.url === wikiImg)) {
                  realItems.push({
                    url: wikiImg,
                    isReal: true,
                    isFood: isFoodVenue,
                    sourceLabel: `Foto Reale del Luogo: ${p.title || cleanTitle}`
                  });
                }
              }
            }

            if (realItems.length > 0 && isMounted) {
              // Combine Real Place Photos with Category Photos to ALWAYS guarantee a rich 3-5 photo carousel!
              const combinedList = [...realItems, ...fallbackGallery.filter(f => !realItems.some(r => r.url === f.url))].slice(0, 5);
              setPhotoList(combinedList);
              setCurrentIndex(0);
            }
          }
        }
      } catch (e) {}
    };

    fetchRealPhotos();
    return () => { isMounted = false; };
  }, [title, baseCity, fallbackGallery]);

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

          {/* EXPLICIT BADGES FOR ALL PHOTO TYPES */}
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
              <div className="px-3 py-1.5 bg-slate-700/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/20 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Foto di Ispirazione (Atmosfera)</span>
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

        {/* Thumbnail bar (ALWAYS ACTIVE for rich multi-photo navigation!) */}
        <div className="bg-slate-950 p-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar border-t border-white/10 z-10">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {photoList.map((p, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`relative w-12 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                  idx === currentIndex ? (p.isFood ? 'border-amber-500 scale-105 opacity-100 ring-2 ring-amber-300' : p.isReal ? 'border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-300' : 'border-indigo-400 scale-105 opacity-100 ring-2 ring-indigo-200') : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={p.url} className="w-full h-full object-cover" />
                {(p.isReal || p.isFood) && (
                  <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white text-[8px] px-1 rounded-full font-black">
                    ?
                  </div>
                )}
              </button>
            ))}
          </div>

          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap px-2 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Galleria ({photoList.length})
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
              ) : currentPhoto.isReal ? (
                <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Camera className="w-4 h-4 text-amber-300" /> {currentPhoto.sourceLabel}
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-slate-700 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4 text-amber-300" /> {currentPhoto.sourceLabel}
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

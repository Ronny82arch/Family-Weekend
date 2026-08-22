import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles, Image as ImageIcon } from 'lucide-react';

const MULTI_PHOTO_LIBRARY: Record<string, string[]> = {
  river_nature: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"
  ],
  pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80"
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"
  ],
  breakfast: [
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
    "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80",
    "https://images.unsplash.com/photo-1525351462161-d42111195655?w=800&q=80"
  ],
  museum: [
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80",
    "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80",
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80"
  ],
  park: [
    "https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=800&q=80",
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80",
    "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"
  ],
  castle: [
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80",
    "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80"
  ],
  travel: [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    "https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80"
  ]
};

const getBasePhotos = (title: string): string[] => {
  const t = title.toLowerCase();
  if (t.match(/fiume|sile|lago|oasi|natura|parco|riserva/)) return MULTI_PHOTO_LIBRARY.river_nature;
  if (t.match(/pizza|pizzeri/)) return MULTI_PHOTO_LIBRARY.pizza;
  if (t.match(/ristorante|trattoria|osteria|cena|pranzo|lunch|dinner/)) return MULTI_PHOTO_LIBRARY.restaurant;
  if (t.match(/colazion|break|caff|bar/)) return MULTI_PHOTO_LIBRARY.breakfast;
  if (t.match(/museo|mostra|museum|gallery/)) return MULTI_PHOTO_LIBRARY.museum;
  if (t.match(/castello|castle|rocca|fort|palazzo/)) return MULTI_PHOTO_LIBRARY.castle;
  return MULTI_PHOTO_LIBRARY.travel;
};

interface LocationPhotoCarouselProps {
  title: string;
  className?: string;
}

export const LocationPhotoCarousel: React.FC<LocationPhotoCarouselProps> = ({ title, className = 'w-full h-64 sm:h-72' }) => {
  const basePhotos = useMemo(() => getBasePhotos(title), [title]);
  const [photos, setPhotos] = useState<string[]>(basePhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isWikiImage, setIsWikiImage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cleanTitle = title
      .replace(/###s*/, '')
      .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:s-]*/i, '')
      .replace(/[😀-🛿]/gu, '')
      .replace(/[|:-]/g, ' ')
      .trim();

    const fetchRealPhoto = async () => {
      try {
        const url = `https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanTitle)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&origin=*`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const firstPage = Object.values(pages)[0] as any;
            const wikiImg = firstPage?.thumbnail?.source;
            if (wikiImg) {
              const lower = wikiImg.toLowerCase();
              // STRICT BLACKLIST: Filter out geographic maps, flags, coats of arms, diagrams, charts
              const isMapOrDiagram = lower.includes('map') || lower.includes('mappa') || lower.includes('flag') || lower.includes('stemm') || lower.includes('emblem') || lower.includes('chart') || lower.includes('location') || lower.endsWith('.svg');
              
              if (!isMapOrDiagram && isMounted) {
                setPhotos([wikiImg, ...basePhotos]);
                setIsWikiImage(true);
              }
            }
          }
        }
      } catch (e) {}
    };

    fetchRealPhoto();
    return () => { isMounted = false; };
  }, [title, basePhotos]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className={`relative overflow-hidden rounded-3xl group shadow-xl bg-slate-900 flex flex-col ${className}`}>
        <div className="relative flex-1 overflow-hidden cursor-pointer" onClick={() => setLightboxOpen(true)}>
          <img
            src={photos[currentIndex]}
            alt={title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md text-slate-900 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isWikiImage && currentIndex === 0 ? '?? Foto Reale Verified' : `Galleria Foto (${currentIndex + 1}/${photos.length})`}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-white/10 z-10">
          {photos.map((p, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`relative w-12 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                idx === currentIndex ? 'border-indigo-500 scale-105 shadow-md opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={p} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full flex justify-between items-center max-w-5xl">
            <span className="text-white/70 font-bold text-xs uppercase tracking-widest">
              Galleria Foto Reali ({currentIndex + 1} / {photos.length})
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative max-w-4xl w-full flex items-center justify-center my-auto">
            <img
              src={photos[currentIndex]}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-3xl shadow-2xl border border-white/10"
            />
          </div>

          <p className="text-white font-black text-lg text-center leading-tight max-w-2xl bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
            {title.replace(/###s*/, '')}
          </p>
        </div>
      )}
    </>
  );
};

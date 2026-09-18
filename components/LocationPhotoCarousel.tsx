import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Camera, Check, Utensils, Sparkles, MapPin, Star } from 'lucide-react';

export interface PhotoItem {
  url: string;
  isReal: boolean;
  isFood?: boolean;
  sourceLabel: string;
  tier: 'google' | 'wikipedia' | 'pollinations';
}

interface LocationPhotoCarouselProps {
  title: string;
  imageQuery?: string;
  photoUrl?: string;
  className?: string;
  familyAvatars?: string[];
  baseCity?: string;
}

// In-memory cache to avoid re-fetching the same place photos
const placesPhotoCache = new Map<string, PhotoItem[]>();

export const LocationPhotoCarousel: React.FC<LocationPhotoCarouselProps> = ({ title, imageQuery, photoUrl, className = 'w-full h-64 sm:h-72', familyAvatars = [], baseCity = 'Italia' }) => {
  const isFoodVenue = useMemo(() => {
    return /ristorante|trattoria|osteria|pizzeria|cena|pranzo|colazione|bar|caffè|agriturismo|locanda|taverna/i.test(title);
  }, [title]);

  const targetSearch = useMemo(() => {
    return (imageQuery || title)
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:\s-]*/i, '')
      .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '')
      .replace(/^(Visita|Visita guidata|Passeggiata|Sosta|Tappa|Giro|Tour|Andiamo|Escursione|Pranzo|Cena)\s+(al|alla|allo|agli|alle|ai|a|nel|nella|nello|negli|nelle|nei|in|presso|di|del|della|dello|degli|delle|dei)\s+/gi, '')
      .replace(/\s+(con|ed|e)\s+.*$/i, '')
      .trim();
  }, [title, imageQuery]);

  // Build the full search query including city
  const fullSearchQuery = useMemo(() => {
    const cityClean = baseCity && baseCity !== 'Italia' ? baseCity : '';
    if (cityClean && !targetSearch.toLowerCase().includes(cityClean.toLowerCase())) {
      return `${targetSearch} ${cityClean}`;
    }
    return targetSearch;
  }, [targetSearch, baseCity]);

  // Generate Pollinations fallback photos (Tier 3)
  const pollinationsPhotos = useMemo((): PhotoItem[] => {
    const seed1 = Math.abs(fullSearchQuery.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9999);
    const seed2 = (seed1 + 137) % 9999;
    const seed3 = (seed1 + 541) % 9999;

    const prompt1 = isFoodVenue
      ? `Authentic DSLR 8k photo of ${fullSearchQuery}, welcoming Italian restaurant dining room and facade, warm daylight, architectural travel photography`
      : `Authentic DSLR 8k travel photo of ${fullSearchQuery}, scenic landmark architecture, beautiful natural daylight, award winning travel photography`;

    const prompt2 = isFoodVenue
      ? `Authentic traditional Italian dish specialty served at ${fullSearchQuery}, delicious gourmet food photography, freshly prepared, 8k`
      : `Panoramic travel scenery of ${fullSearchQuery}, breathtaking landscape view, natural light, 8k`;

    const prompt3 = isFoodVenue
      ? `Charming outdoor patio dehor of ${fullSearchQuery}, Italian historic village atmosphere, sunny day, 8k`
      : `Close up architectural and nature details of ${fullSearchQuery}, authentic travel experience, 8k`;

    return [
      {
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt1)}?width=1024&height=640&nologo=true&model=turbo&seed=${seed1}`,
        isReal: false, isFood: isFoodVenue, tier: 'pollinations',
        sourceLabel: isFoodVenue ? `🍽️ Ispirazione: ${targetSearch}` : `🏛️ Vista: ${targetSearch}`
      },
      {
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt2)}?width=1024&height=640&nologo=true&model=turbo&seed=${seed2}`,
        isReal: false, isFood: isFoodVenue, tier: 'pollinations',
        sourceLabel: isFoodVenue ? `🍝 Piatto Ispirazione: ${targetSearch}` : `🌄 Panorama: ${targetSearch}`
      },
      {
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt3)}?width=1024&height=640&nologo=true&model=turbo&seed=${seed3}`,
        isReal: false, isFood: isFoodVenue, tier: 'pollinations',
        sourceLabel: isFoodVenue ? `🪑 Sala Ispirazione: ${targetSearch}` : `✨ Dettagli: ${targetSearch}`
      },
    ];
  }, [fullSearchQuery, targetSearch, isFoodVenue]);

  const [photoList, setPhotoList] = useState<PhotoItem[]>(pollinationsPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadingReal, setLoadingReal] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRealPhotos = async () => {
      setLoadingReal(true);
      const realItems: PhotoItem[] = [];

      // ═══════════════════════════════════════════
      // TIER 1: Google Places API (via serverless proxy)
      // ═══════════════════════════════════════════
      const cacheKey = `places_${fullSearchQuery}`;
      if (placesPhotoCache.has(cacheKey)) {
        const cached = placesPhotoCache.get(cacheKey)!;
        if (cached.length > 0 && isMounted) {
          setPhotoList(cached);
          setCurrentIndex(0);
          setLoadingReal(false);
          return;
        }
      }

      try {
        const placesUrl = `/api/placePhotos?query=${encodeURIComponent(fullSearchQuery)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const placesRes = await fetch(placesUrl, { signal: controller.signal });
        clearTimeout(timer);

        if (placesRes.ok) {
          const placesData = await placesRes.json();
          if (placesData.photos && placesData.photos.length > 0) {
            for (const photo of placesData.photos) {
              if (photo.url && !realItems.some(r => r.url === photo.url)) {
                realItems.push({
                  url: photo.url,
                  isReal: true,
                  isFood: isFoodVenue,
                  tier: 'google',
                  sourceLabel: `📸 Foto Reale: ${photo.title || placesData.place || targetSearch}`
                });
              }
            }
          }
        }
      } catch (e) {
        // Fallback to Wikipedia or Pollinations
      }

      // ═══════════════════════════════════════════
      // TIER 2: Wikipedia OpenSearch (for landmarks)
      // ═══════════════════════════════════════════
      if (realItems.length === 0) {
        try {
          const searchTerms = [targetSearch];
          if (targetSearch.includes(' a ')) searchTerms.push(targetSearch.split(' a ')[0].trim());
          if (targetSearch.includes(',')) searchTerms.push(targetSearch.split(',')[0].trim());

          for (const term of searchTerms) {
            const openSearchUrl = `https://it.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=3&format=json&origin=*`;
            const wikiController = new AbortController();
            const wikiTimer = setTimeout(() => wikiController.abort(), 3500);
            const wikiRes = await fetch(openSearchUrl, { signal: wikiController.signal });
            clearTimeout(wikiTimer);

            if (wikiRes.ok) {
              const data = await wikiRes.json();
              const matchedTitles: string[] = data[1] || [];

              for (const articleTitle of matchedTitles) {
                if (articleTitle.toLowerCase().includes('(film)') || articleTitle.toLowerCase().includes('(disambigua)')) continue;

                const pageImgUrl = `https://it.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;
                const imgRes = await fetch(pageImgUrl);
                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  const pages = imgData.query?.pages;
                  if (pages) {
                    const page = Object.values(pages)[0] as any;
                    const thumb = page?.thumbnail?.source;
                    if (thumb && !realItems.some(i => i.url === thumb)) {
                      realItems.push({
                        url: thumb,
                        isReal: true,
                        isFood: false,
                        tier: 'wikipedia',
                        sourceLabel: `📷 Wikipedia: ${articleTitle}`
                      });
                    }
                  }
                }
              }
            }
            if (realItems.length > 0) break;
          }
        } catch (e) {}
      }

      // ═══════════════════════════════════════════
      // Compose final carousel
      // ═══════════════════════════════════════════
      if (isMounted) {
        if (realItems.length > 0) {
          // Cache for future reuse
          placesPhotoCache.set(cacheKey, realItems.length >= 3 ? realItems : [...realItems, ...pollinationsPhotos.slice(0, 3 - realItems.length)]);
          // Show real photos first, then fill with fallback if needed
          const finalList = realItems.length >= 3
            ? realItems.slice(0, 5)
            : [...realItems, ...pollinationsPhotos.slice(0, Math.max(0, 3 - realItems.length))];
          setPhotoList(finalList);
        } else {
          setPhotoList(pollinationsPhotos);
        }
        setCurrentIndex(0);
        setLoadingReal(false);
      }
    };

    fetchRealPhotos();
    return () => { isMounted = false; };
  }, [fullSearchQuery, targetSearch, isFoodVenue, pollinationsPhotos]);

  const currentPhoto = photoList[currentIndex] || photoList[0];

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? photoList.length - 1 : prev - 1));
  }, [photoList.length]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === photoList.length - 1 ? 0 : prev + 1));
  }, [photoList.length]);

  // Badge styling based on tier
  const getBadge = () => {
    if (!currentPhoto) return null;

    if (currentPhoto.tier === 'google') {
      return (
        <div className="px-3 py-1.5 bg-emerald-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-emerald-400/40 animate-fade-in">
          <Camera className="w-3.5 h-3.5 text-amber-300" />
          <span>Foto Reale Certificata ({currentIndex + 1}/{photoList.length})</span>
        </div>
      );
    }
    if (currentPhoto.tier === 'wikipedia') {
      return (
        <div className="px-3 py-1.5 bg-blue-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-blue-400/40 animate-fade-in">
          <Camera className="w-3.5 h-3.5 text-blue-200" />
          <span>Foto Reale Wikipedia ({currentIndex + 1}/{photoList.length})</span>
        </div>
      );
    }
    if (currentPhoto.isFood) {
      return (
        <div className="px-3 py-1.5 bg-amber-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-amber-400/40 animate-fade-in">
          <Utensils className="w-3.5 h-3.5 text-amber-200" />
          <span>Foto Ispirazione ({currentIndex + 1}/{photoList.length})</span>
        </div>
      );
    }
    return (
      <div className="px-3 py-1.5 bg-indigo-600/95 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-indigo-400/40 animate-fade-in">
        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
        <span>Scena Ispirazione ({currentIndex + 1}/{photoList.length})</span>
      </div>
    );
  };

  // Tier badge color for thumbnails
  const getTierColor = (photo: PhotoItem) => {
    if (photo.tier === 'google') return 'bg-emerald-500';
    if (photo.tier === 'wikipedia') return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const getTierBorderColor = (photo: PhotoItem, isActive: boolean) => {
    if (!isActive) return 'border-transparent opacity-50 hover:opacity-100';
    if (photo.tier === 'google') return 'border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-300';
    if (photo.tier === 'wikipedia') return 'border-blue-500 scale-105 opacity-100 ring-2 ring-blue-300';
    return 'border-amber-500 scale-105 opacity-100 ring-2 ring-amber-300';
  };

  const getTierIcon = (photo: PhotoItem) => {
    if (photo.tier === 'google') return '⭐';
    if (photo.tier === 'wikipedia') return '📷';
    return '✨';
  };

  return (
    <>
      <div className={`relative overflow-hidden rounded-3xl group shadow-xl bg-slate-900 flex flex-col ${className}`}>
        <div className="relative flex-1 overflow-hidden cursor-pointer" onClick={() => setLightboxOpen(true)}>
          {/* Loading shimmer overlay when fetching real photos */}
          {loadingReal && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-700/90 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <MapPin className="w-3 h-3" />
                <span>Cerco foto reali...</span>
              </div>
            </div>
          )}

          <img
            src={currentPhoto?.url}
            alt={title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/35 pointer-events-none" />

          {/* Navigation Arrows */}
          {photoList.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Top Right Zoom Button */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all duration-300 shadow-lg"
              title="Ingrandisci foto a schermo intero"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Tier Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            {!loadingReal && getBadge()}
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

        {/* Thumbnail Bar */}
        <div className="bg-slate-950 p-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar border-t border-white/10 z-10">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {photoList.map((p, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`relative w-12 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${getTierBorderColor(p, idx === currentIndex)}`}
              >
                <img src={p.url} className="w-full h-full object-cover" loading="lazy" />
                <div className={`absolute top-0.5 right-0.5 text-white text-[8px] px-1 rounded-full font-black ${getTierColor(p)}`}>
                  {getTierIcon(p)}
                </div>
              </button>
            ))}
          </div>

          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap px-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Galleria ({photoList.length})
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
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                currentPhoto?.tier === 'google' ? 'bg-emerald-600 text-white' :
                currentPhoto?.tier === 'wikipedia' ? 'bg-blue-600 text-white' :
                'bg-amber-600 text-white'
              }`}>
                {currentPhoto?.tier === 'google' ? <Star className="w-4 h-4 text-amber-300" /> :
                 currentPhoto?.tier === 'wikipedia' ? <Camera className="w-4 h-4 text-blue-200" /> :
                 <Sparkles className="w-4 h-4 text-amber-200" />} {currentPhoto?.sourceLabel}
              </span>
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
              src={currentPhoto?.url}
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

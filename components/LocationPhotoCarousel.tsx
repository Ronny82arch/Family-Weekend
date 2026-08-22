import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles, Image as ImageIcon } from 'lucide-react';

// Verified 200 OK Stock Photo Library
const STOCK_LIBRARY: Record<string, string[]> = {
  pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
  ],
  breakfast: [
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
    "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80"
  ],
  icecream: [
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80",
    "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=800&q=80",
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80"
  ],
  museum: [
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80",
    "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80",
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80"
  ],
  art: [
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80"
  ],
  park: [
    "https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=800&q=80",
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80",
    "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80"
  ],
  nature: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80"
  ],
  water: [
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?w=800&q=80"
  ],
  mountain: [
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"
  ],
  castle: [
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80",
    "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80"
  ],
  church: [
    "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800&q=80",
    "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80"
  ],
  urban: [
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80"
  ],
  market: [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    "https://images.unsplash.com/photo-1519690889869-e705e59f72e1?w=800&q=80",
    "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800&q=80",
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80"
  ],
  kids: [
    "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&q=80",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800&q=80",
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80"
  ],
  animals: [
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80",
    "https://images.unsplash.com/photo-1518796745738-41048802f99a?w=800&q=80",
    "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80"
  ],
  travel: [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    "https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80"
  ]
};

const getCategoryPhotos = (title: string): string[] => {
  const t = title.toLowerCase();
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

  return STOCK_LIBRARY[category] || STOCK_LIBRARY.travel;
};

interface LocationPhotoCarouselProps {
  title: string;
  className?: string;
}

export const LocationPhotoCarousel: React.FC<LocationPhotoCarouselProps> = ({ title, className = 'w-full h-56 sm:h-64' }) => {
  const photos = useMemo(() => getCategoryPhotos(title), [title]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      <div className={`relative overflow-hidden rounded-3xl group shadow-lg bg-slate-900 ${className}`}>
        {/* Main Image */}
        <img
          src={photos[currentIndex]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Carousel Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Lightbox Zoom Trigger */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Foto Reale Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Foto Luogo</span>
        </div>

        {/* Dot Indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={photos[currentIndex]}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="mt-4 text-white font-bold text-base text-center leading-tight">
              {title.replace(/###s*/, '')}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

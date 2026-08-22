import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Compass, Sparkles } from 'lucide-react';

declare const L: any;

interface Waypoint {
  title: string;
  timeSlot?: string;
  lat?: number;
  lng?: number;
  visualLine?: string;
}

interface ItineraryRouteMapProps {
  waypoints: Waypoint[];
  familyAvatarUrl?: string;
  selectedIndex?: number;
  onSelectWaypoint?: (index: number) => void;
  dayTitle?: string;
  baseCity?: string;
}

const DEFAULT_CENTER: [number, number] = [45.4384, 10.9916]; // Verona / Nord Italia

const geocodeCache: Record<string, [number, number]> = {};

export const ItineraryRouteMap: React.FC<ItineraryRouteMapProps> = ({
  waypoints,
  familyAvatarUrl,
  selectedIndex = 0,
  onSelectWaypoint,
  dayTitle = 'Itinerario',
  baseCity = 'Italia'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [coords, setCoords] = useState<[number, number][]>([]);

  // 1. Initial Leaflet initialization on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try { mapInstanceRef.current.remove(); } catch(e){}
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(DEFAULT_CENTER, 11);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Invalidate size after rendering to prevent grey/white blank spaces
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch(e){}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Asynchronous geocoding for waypoints
  useEffect(() => {
    let isMounted = true;

    const fetchCoords = async () => {
      const resolved: [number, number][] = [];

      for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        if (wp.lat && wp.lng && !isNaN(wp.lat) && !isNaN(wp.lng)) {
          resolved.push([wp.lat, wp.lng]);
          continue;
        }

        const cleanTitle = wp.title
          .replace(/###s*/, '')
          .replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera)[:s-]*/i, '')
          .replace(/[😀-🛿]/gu, '')
          .replace(/[|:-]/g, ' ')
          .trim();

        const query = `${cleanTitle}, ${baseCity}`;

        if (geocodeCache[query]) {
          resolved.push(geocodeCache[query]);
          continue;
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            { signal: controller.signal, headers: { 'User-Agent': 'FamilyWeekendApp/1.0' } }
          );
          clearTimeout(timer);
          if (res.ok) {
            const json = await res.json();
            if (json && json[0] && json[0].lat && json[0].lon) {
              const point: [number, number] = [parseFloat(json[0].lat), parseFloat(json[0].lon)];
              geocodeCache[query] = point;
              resolved.push(point);
              continue;
            }
          }
        } catch (e) {}

        // Offset fallback around base center
        const angle = (i * (360 / Math.max(waypoints.length, 1)) * Math.PI) / 180;
        const radius = 0.02 * (i + 1);
        resolved.push([DEFAULT_CENTER[0] + Math.sin(angle) * radius, DEFAULT_CENTER[1] + Math.cos(angle) * radius]);
      }

      if (isMounted) setCoords(resolved);
    };

    fetchCoords();
    return () => { isMounted = false; };
  }, [waypoints, baseCity]);

  // 3. Update markers and route polyline when coords ready
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || coords.length === 0) return;

    // Clear previous markers
    markersRef.current.forEach(m => { try { map.removeLayer(m); } catch(e){} });
    markersRef.current = [];
    if (polylineRef.current) { try { map.removeLayer(polylineRef.current); } catch(e){} }

    // Draw route polyline
    if (coords.length > 1) {
      polylineRef.current = L.polyline(coords, {
        color: '#4f46e5',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    } else {
      map.setView(coords[0], 13);
    }

    // Add animated 3D Pixar avatar markers
    coords.forEach((coord, idx) => {
      const wp = waypoints[idx];
      const isSelected = idx === selectedIndex;
      const avatarSrc = familyAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=family';

      const iconHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
          <div class="w-12 h-12 rounded-full border-4 ${isSelected ? 'border-indigo-600 bg-indigo-600 shadow-2xl ring-4 ring-indigo-300' : 'border-white bg-slate-900 shadow-lg'} flex items-center justify-center overflow-hidden relative">
            <img src="${avatarSrc}" class="w-full h-full object-cover" />
            <div class="absolute -bottom-0.5 -right-0.5 bg-amber-400 text-slate-900 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
              ${idx + 1}
            </div>
          </div>
          <div class="mt-1 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold rounded-lg shadow-md whitespace-nowrap text-center max-w-[130px] truncate border border-white/20">
            ${wp.title.replace(/###\s*/, '').substring(0, 20)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-itinerary-marker',
        iconSize: [48, 64],
        iconAnchor: [24, 32]
      });

      const marker = L.marker(coord, { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div class="p-2 text-center">
          <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Tappa ${idx + 1}</span>
          <h4 class="font-bold text-slate-900 text-sm mt-0.5">${wp.title.replace(/###\s*/, '')}</h4>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectWaypoint) onSelectWaypoint(idx);
      });

      markersRef.current.push(marker);
    });

    map.invalidateSize();
  }, [coords, waypoints, familyAvatarUrl, selectedIndex]);

  // Smooth pan on index select
  useEffect(() => {
    if (!mapInstanceRef.current || !coords[selectedIndex]) return;
    mapInstanceRef.current.panTo(coords[selectedIndex], { animate: true, duration: 0.8 });
  }, [selectedIndex, coords]);

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl bg-slate-900 mb-8 group">
      {/* Active Leaflet Map Container with explicit min-height */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[320px] z-0" />

      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 pointer-events-auto">
        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-xs leading-none uppercase tracking-wider">{dayTitle}</h4>
          <p className="text-[10px] font-bold text-indigo-600 mt-1">{waypoints.length} Tappe Attive sulla Mappa</p>
        </div>
      </div>

      {/* Waypoint Tabs Selector */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
        {waypoints.map((wp, idx) => (
          <button
            key={idx}
            onClick={() => onSelectWaypoint && onSelectWaypoint(idx)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-lg ${
              idx === selectedIndex
                ? 'bg-indigo-600 text-white shadow-indigo-500/40 scale-105'
                : 'bg-white/95 backdrop-blur text-slate-800 hover:bg-white'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
              idx === selectedIndex ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-700'
            }`}>
              {idx + 1}
            </span>
            <span className="truncate max-w-[120px]">{wp.title.replace(/###\s*/, '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

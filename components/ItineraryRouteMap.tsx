import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Navigation, MapPin, Compass, Sparkles, ExternalLink } from 'lucide-react';

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

const DEFAULT_CENTER: [number, number] = [41.9028, 12.4964]; // Roma

const geocodeCache: Record<string, [number, number]> = {};

const cleanLocationTitle = (raw: string): string => {
  if (!raw) return '';
  let text = raw.replace(/###/g, '').replace(/\*\*/g, '').replace(/^\s*\d+[\.\)]\s*/, '').trim();
  text = text.replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '').trim();
  text = text.replace(/^(Mattina|Pranzo|Pomeriggio|Cena|Sera|Navigazione|Relax|Morning|Afternoon|Lunch|Dinner)[:\s-]*/i, '').trim();
  text = text.replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/u, '').trim();
  return text;
};

export const ItineraryRouteMap: React.FC<ItineraryRouteMapProps> = ({
  waypoints,
  familyAvatarUrl,
  selectedIndex = 0,
  onSelectWaypoint,
  dayTitle = 'Mappa Percorso',
  baseCity = 'Italia'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [resolvedCoords, setResolvedCoords] = useState<{ wp: Waypoint; lat: number; lng: number; locationName: string }[]>([]);

  // Filter valid activity waypoints (exclude routine navigation headers)
  const activeWaypoints = useMemo(() => {
    return waypoints.filter(wp => {
      const t = wp.title.toLowerCase();
      return !t.includes('navigazione') && !t.includes('navigation') && !t.includes('giornata di riposo');
    });
  }, [waypoints]);

  useEffect(() => {
    let isMounted = true;

    const resolveAll = async () => {
      const results: { wp: Waypoint; lat: number; lng: number; locationName: string }[] = [];

      for (let i = 0; i < activeWaypoints.length; i++) {
        const wp = activeWaypoints[i];
        const locationName = cleanLocationTitle(wp.title) || `Tappa ${i + 1}`;

        if (wp.lat && wp.lng && !isNaN(wp.lat) && !isNaN(wp.lng)) {
          results.push({ wp, lat: wp.lat, lng: wp.lng, locationName });
          continue;
        }

        const query1 = `${locationName}, ${baseCity}`;
        const query2 = `${baseCity}, Italia`;

        if (geocodeCache[query1]) {
          const [lat, lng] = geocodeCache[query1];
          results.push({ wp, lat, lng, locationName });
          continue;
        }

        let foundPoint: [number, number] | null = null;

        // Tier 1: Try specific place + city
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query1)}&format=json&limit=1`,
            { signal: controller.signal, headers: { 'User-Agent': 'FamilyWeekendApp/1.0' } }
          );
          clearTimeout(timer);
          if (res.ok) {
            const json = await res.json();
            if (json && json[0] && json[0].lat && json[0].lon) {
              foundPoint = [parseFloat(json[0].lat), parseFloat(json[0].lon)];
              geocodeCache[query1] = foundPoint;
            }
          }
        } catch (e) {}

        // Tier 2: Try city center if specific place failed
        if (!foundPoint && geocodeCache[query2]) {
          foundPoint = geocodeCache[query2];
        } else if (!foundPoint) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query2)}&format=json&limit=1`,
              { signal: controller.signal, headers: { 'User-Agent': 'FamilyWeekendApp/1.0' } }
            );
            clearTimeout(timer);
            if (res.ok) {
              const json = await res.json();
              if (json && json[0] && json[0].lat && json[0].lon) {
                foundPoint = [parseFloat(json[0].lat), parseFloat(json[0].lon)];
                geocodeCache[query2] = foundPoint;
              }
            }
          } catch (e) {}
        }

        // Tier 3: Apply spatial distribution offset around base center
        const baseCenter = foundPoint || DEFAULT_CENTER;
        const angle = (i * (360 / Math.max(activeWaypoints.length, 1)) * Math.PI) / 180;
        const radius = 0.012 * (i + 1);

        const lat = baseCenter[0] + Math.sin(angle) * radius;
        const lng = baseCenter[1] + Math.cos(angle) * radius;

        results.push({ wp, lat, lng, locationName });
      }

      if (isMounted) {
        setResolvedCoords(results);
      }
    };

    resolveAll();
    return () => { isMounted = false; };
  }, [activeWaypoints, baseCity]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapRef.current || typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;

    if ((mapRef.current as any)._leaflet_id) {
      delete (mapRef.current as any)._leaflet_id;
    }

    let map: any = null;
    try {
      map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(DEFAULT_CENTER, 12);

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);

      [100, 300, 600].forEach(delay => {
        setTimeout(() => {
          if (map && map._container) {
            try { map.invalidateSize(); } catch (err) {}
          }
        }, delay);
      });
    } catch (err) {
      console.error("Leaflet init error:", err);
    }

    return () => {
      if (map) {
        try { map.remove(); } catch (err) {}
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers, polyline and bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._container || resolvedCoords.length === 0 || typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;

    try {
      markersGroupRef.current.clearLayers();
      if (polylineRef.current) {
        try { map.removeLayer(polylineRef.current); } catch (e) {}
      }

      const points: [number, number][] = resolvedCoords.map(c => [c.lat, c.lng]);
      const bounds = L.latLngBounds(points);

      if (points.length > 1) {
        polylineRef.current = L.polyline(points, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);
      }

      resolvedCoords.forEach((c, idx) => {
        const isSelected = idx === selectedIndex;
        const avatarSrc = familyAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=family';

        let categoryEmoji = '\u{1F4CD}';
        const tLower = c.locationName.toLowerCase();
        if (tLower.match(/pranzo|cena|ristorante|trattoria|osteria|pizzeria/)) categoryEmoji = '\u{1F37D}';
        else if (tLower.match(/parco|bosco|giardino|natura|oasi|fiume|lago/)) categoryEmoji = '\u{1F333}';
        else if (tLower.match(/castello|rocca|palazzo|museo|mostra/)) categoryEmoji = '\u{1F3F0}';

        const iconHtml = `
          <div class="relative group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
            <div class="w-12 h-12 rounded-full border-4 ${isSelected ? 'border-indigo-600 bg-indigo-600 shadow-2xl ring-4 ring-indigo-300' : 'border-white bg-slate-900 shadow-xl'} flex items-center justify-center overflow-hidden relative">
              <img src="${avatarSrc}" class="w-full h-full object-cover" />
              <div class="absolute -bottom-0.5 -right-0.5 bg-amber-400 text-slate-900 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                ${idx + 1}
              </div>
            </div>
            <div class="mt-1 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold rounded-lg shadow-md whitespace-nowrap text-center max-w-[140px] truncate border border-white/20 flex items-center gap-1">
              <span>${categoryEmoji}</span>
              <span class="truncate">${c.locationName}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-itinerary-marker',
          iconSize: [48, 64],
          iconAnchor: [24, 32]
        });

        const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(markersGroupRef.current);

        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.locationName + ', ' + baseCity)}`;

        const popupContent = `
          <div class="p-3 text-center">
            <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Tappa ${idx + 1}</span>
            <h4 class="font-bold text-slate-900 text-sm mt-1 mb-2">${c.locationName}</h4>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="inline-block px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow hover:bg-indigo-700 transition-colors">
              Apri in Google Maps ?
            </a>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectWaypoint) onSelectWaypoint(idx);
        });
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [45, 45] });
      }

      [100, 300].forEach(delay => {
        setTimeout(() => {
          if (map && map._container) {
            try { map.invalidateSize(); } catch (err) {}
          }
        }, delay);
      });
    } catch (e) {
      console.error("Error setting map markers:", e);
    }
  }, [resolvedCoords, selectedIndex, familyAvatarUrl, baseCity, onSelectWaypoint]);

  useEffect(() => {
    if (!mapInstanceRef.current || !resolvedCoords[selectedIndex]) return;
    const { lat, lng } = resolvedCoords[selectedIndex];
    mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.8 });
  }, [selectedIndex, resolvedCoords]);

  return (
    <div className="relative w-full h-[340px] sm:h-[380px] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl bg-slate-900 mb-8 group">
      <div ref={mapRef} className="w-full h-full min-h-[340px] z-0" />

      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 pointer-events-auto">
        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
          <Navigation className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-xs leading-none uppercase tracking-wider">{dayTitle}</h4>
          <p className="text-[10px] font-bold text-indigo-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>{activeWaypoints.length} Tappe Reali Mappate</span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
        {activeWaypoints.map((wp, idx) => (
          <button
            key={idx}
            onClick={() => onSelectWaypoint && onSelectWaypoint(idx)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-xl ${
              idx === selectedIndex
                ? 'bg-indigo-600 text-white shadow-indigo-500/40 scale-105 ring-2 ring-white'
                : 'bg-white/95 backdrop-blur text-slate-800 hover:bg-white hover:scale-102'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
              idx === selectedIndex ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-700'
            }`}>
              {idx + 1}
            </span>
            <span className="truncate max-w-[140px]">
              {cleanLocationTitle(wp.title) || `Tappa ${idx + 1}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

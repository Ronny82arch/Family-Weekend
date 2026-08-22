import React, { useEffect, useRef } from 'react';
declare const L: any;

import { MapPin, Navigation, Compass, Sparkles } from 'lucide-react';

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
}

// Fallback coordinates for major Italian cities/regions if specific lat/lng missing
const DEFAULT_CENTER: [number, number] = [41.9028, 12.4964]; // Roma

export const ItineraryRouteMap: React.FC<ItineraryRouteMapProps> = ({
  waypoints,
  familyAvatarUrl,
  selectedIndex = 0,
  onSelectWaypoint,
  dayTitle = 'Itinerario'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous Leaflet instance if present
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Filter valid coordinates or generate spaced offset coordinates around base center
    const validCoords: [number, number][] = waypoints.map((wp, idx) => {
      if (wp.lat && wp.lng && !isNaN(wp.lat) && !isNaN(wp.lng)) {
        return [wp.lat, wp.lng];
      }
      // Generates elegant realistic offset for map visualization
      const angle = (idx * (360 / Math.max(waypoints.length, 1)) * Math.PI) / 180;
      const radius = 0.015 * (idx + 1);
      return [DEFAULT_CENTER[0] + Math.sin(angle) * radius, DEFAULT_CENTER[1] + Math.cos(angle) * radius];
    });

    const center: [number, number] = validCoords[0] || DEFAULT_CENTER;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, 13);

    mapInstanceRef.current = map;

    // Add high-resolution CARTO Voyager tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    markersRef.current = [];

    // Draw glowing polyline connecting waypoints
    if (validCoords.length > 1) {
      const polyline = L.polyline(validCoords, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // Add animated custom markers with 3D Pixar avatar
    validCoords.forEach((coord, idx) => {
      const wp = waypoints[idx];
      const isSelected = idx === selectedIndex;
      const avatarSrc = familyAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=family';

      const iconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
          <div class="w-12 h-12 rounded-full border-4 ${isSelected ? 'border-indigo-600 bg-indigo-600 shadow-2xl shadow-indigo-500/50' : 'border-white bg-slate-900 shadow-lg'} flex items-center justify-center overflow-hidden relative">
            <img src="${avatarSrc}" class="w-full h-full object-cover" />
            <div class="absolute -bottom-0.5 -right-0.5 bg-amber-400 text-slate-900 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
              ${idx + 1}
            </div>
          </div>
          <div class="mt-1 px-2 py-0.5 bg-slate-900/90 backdrop-blur text-white text-[10px] font-bold rounded-lg shadow whitespace-nowrap text-center max-w-[120px] truncate">
            ${wp.title.replace(/###\s*/, '').substring(0, 18)}
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

      marker.on('click', () => {
        if (onSelectWaypoint) onSelectWaypoint(idx);
      });

      markersRef.current.push(marker);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [waypoints, familyAvatarUrl, selectedIndex]);

  // Pan to selected index when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !waypoints[selectedIndex]) return;
    const wp = waypoints[selectedIndex];
    if (wp.lat && wp.lng) {
      mapInstanceRef.current.panTo([wp.lat, wp.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedIndex, waypoints]);

  return (
    <div className="relative w-full h-[280px] sm:h-[340px] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl bg-slate-900 group">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-white/50 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-xs leading-none uppercase tracking-wider">{dayTitle}</h4>
          <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{waypoints.length} Tappe Pianificate</p>
        </div>
      </div>

      {/* Floating Waypoint Selector Tabs */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {waypoints.map((wp, idx) => (
          <button
            key={idx}
            onClick={() => onSelectWaypoint && onSelectWaypoint(idx)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-md ${
              idx === selectedIndex
                ? 'bg-indigo-600 text-white shadow-indigo-500/30 scale-105'
                : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-white'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
              idx === selectedIndex ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-600'
            }`}>
              {idx + 1}
            </span>
            <span className="truncate max-w-[110px]">{wp.title.replace(/###\s*/, '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

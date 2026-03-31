import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Navigation, Recycle, Leaf, AlertTriangle, Loader2, X, MapPin } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface Facility {
  name: string;
  type: 'Recyclable' | 'Organic' | 'Hazardous';
  status: string;
  distance: string;
  color: string;
  bg: string;
  icon: any;
  lat: number;
  lng: number;
}

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapUrl, setMapUrl] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user location on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(loc);
        updateMapUrl(loc.lat, loc.lng);
      },
      () => {
        const defaultLoc = { lat: 28.6139, lng: 77.2090 }; // New Delhi
        setMapCenter(defaultLoc);
        updateMapUrl(defaultLoc.lat, defaultLoc.lng);
      }
    );
  }, []);

  const updateMapUrl = (lat: number, lng: number, zoom = 15) => {
    setMapUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03},${lat - 0.02},${lng + 0.03},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`
    );
  };

  // Debounced search using Nominatim
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter({ lat, lng });
    updateMapUrl(lat, lng);
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','));
    setSearchResults([]);
  };

  const getFacilities = (lat: number, lng: number): Facility[] => [
    { name: 'GreenCycle Recycling Hub', type: 'Recyclable', status: 'Open until 8:00 PM', distance: '0.8 km', color: 'text-green-700', bg: 'bg-green-50', icon: Recycle, lat: lat + 0.006, lng: lng + 0.005 },
    { name: 'Organic Compost Station', type: 'Organic', status: 'Self-service 24/7', distance: '1.2 km', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Leaf, lat: lat - 0.008, lng: lng + 0.003 },
    { name: 'HazMat Disposal Point', type: 'Hazardous', status: 'By appointment only', distance: '2.4 km', color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle, lat: lat + 0.002, lng: lng - 0.012 },
    { name: 'City Recycling Center', type: 'Recyclable', status: 'Open until 6:00 PM', distance: '3.1 km', color: 'text-green-700', bg: 'bg-green-50', icon: Recycle, lat: lat + 0.014, lng: lng - 0.007 },
  ];

  const facilities = mapCenter ? getFacilities(mapCenter.lat, mapCenter.lng) : [];
  const visibleFacilities = facilities.filter(f => activeFilter === 'All' || f.type === activeFilter);

  const navigateTo = (facility: Facility) => {
    window.open(`https://www.openstreetmap.org/directions?from=${mapCenter?.lat},${mapCenter?.lng}&to=${facility.lat},${facility.lng}`, '_blank');
  };

  const filters = [
    { name: 'All' },
    { name: 'Recyclable', icon: Recycle, color: 'text-green-700' },
    { name: 'Organic', icon: Leaf, color: 'text-emerald-700' },
    { name: 'Hazardous', icon: AlertTriangle, color: 'text-red-700' },
  ];

  return (
    <div className="relative flex flex-col h-[calc(100vh-7rem)] overflow-hidden rounded-[2rem]">

      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] w-full max-w-xl px-4">
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-visible">
            <div className="pl-4 pr-2 flex-shrink-0">
              <Search className="w-5 h-5 text-green-700" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location (e.g. Delhi, Mumbai...)"
              className="flex-1 py-4 pr-4 bg-transparent text-on-surface font-medium placeholder:text-on-surface-variant/60 outline-none text-sm"
            />
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-primary mr-3" />}
            {searchQuery && !isSearching && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="mr-3">
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/10 z-50"
              >
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/5 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-on-surface font-medium line-clamp-2">
                      {result.display_name}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* OSM Map Embed */}
      <div className="absolute inset-0 z-0">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            title="Map"
            className="w-full h-full border-0"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="absolute bottom-[17rem] left-0 right-0 z-[400] px-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.name}
            onClick={() => setActiveFilter(f.name)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs shadow transition-all active:scale-95 flex items-center gap-1.5 ${
              activeFilter === f.name
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white/95 backdrop-blur-md text-green-900 border border-outline-variant/10'
            }`}
          >
            {f.icon && <f.icon className="w-3.5 h-3.5" />}
            {f.name}
          </button>
        ))}
      </div>

      {/* Bottom Sheet – Facility List */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-white/20 max-h-72 overflow-hidden">
        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mt-3 mb-2" />
        <div className="px-6 pb-2 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-on-surface">Nearby Disposal Points</h2>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{visibleFacilities.length} Found</span>
        </div>
        <div className="overflow-y-auto max-h-48 px-4 pb-4 space-y-3">
          {visibleFacilities.map((facility) => (
            <div
              key={facility.name}
              className={`flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/10 ${selectedFacility?.name === facility.name ? 'border-primary/30 bg-primary/5' : 'bg-surface-container-low'} cursor-pointer transition-all hover:shadow-md`}
              onClick={() => {
                setSelectedFacility(facility);
                updateMapUrl(facility.lat, facility.lng, 16);
              }}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${facility.bg}`}>
                <facility.icon className={`w-6 h-6 ${facility.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-on-surface truncate">{facility.name}</h3>
                <p className="text-xs text-on-surface-variant">{facility.status} · {facility.distance}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigateTo(facility); }}
                className="p-2.5 rounded-full bg-primary text-white shadow-md active:scale-95 transition-all flex-shrink-0"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

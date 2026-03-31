import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Navigation, Recycle, Leaf, AlertTriangle, Loader2, X, MapPin } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const suggestedCategory = ['Recyclable', 'Organic', 'Hazardous'].includes(
    location.state?.category
  )
    ? location.state.category
    : 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState(suggestedCategory);
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
        const defaultLoc = { lat: 28.6139, lng: 77.209 }; // New Delhi
        setMapCenter(defaultLoc);
        updateMapUrl(defaultLoc.lat, defaultLoc.lng);
      }
    );
  }, []);

  const updateMapUrl = (lat: number, lng: number) => {
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
    {
      name: 'GreenCycle Recycling Hub',
      type: 'Recyclable',
      status: 'Open until 8:00 PM',
      distance: '0.8 km',
      color: 'text-green-700',
      bg: 'bg-green-50',
      icon: Recycle,
      lat: lat + 0.006,
      lng: lng + 0.005,
    },
    {
      name: 'Organic Compost Station',
      type: 'Organic',
      status: 'Self-service 24/7',
      distance: '1.2 km',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      icon: Leaf,
      lat: lat - 0.008,
      lng: lng + 0.003,
    },
    {
      name: 'HazMat Disposal Point',
      type: 'Hazardous',
      status: 'By appointment only',
      distance: '2.4 km',
      color: 'text-red-700',
      bg: 'bg-red-50',
      icon: AlertTriangle,
      lat: lat + 0.002,
      lng: lng - 0.012,
    },
    {
      name: 'City Recycling Center',
      type: 'Recyclable',
      status: 'Open until 6:00 PM',
      distance: '3.1 km',
      color: 'text-green-700',
      bg: 'bg-green-50',
      icon: Recycle,
      lat: lat + 0.014,
      lng: lng - 0.007,
    },
  ];

  const facilities = mapCenter ? getFacilities(mapCenter.lat, mapCenter.lng) : [];
  const visibleFacilities = facilities.filter(
    (f) => activeFilter === 'All' || f.type === activeFilter
  );

  const navigateTo = (facility: Facility) => {
    window.open(
      `https://www.openstreetmap.org/directions?from=${mapCenter?.lat},${mapCenter?.lng}&to=${facility.lat},${facility.lng}`,
      '_blank'
    );
  };

  const filters = [
    { name: 'All' },
    { name: 'Recyclable', icon: Recycle, color: 'text-green-700' },
    { name: 'Organic', icon: Leaf, color: 'text-emerald-700' },
    { name: 'Hazardous', icon: AlertTriangle, color: 'text-red-700' },
  ];

  return (
    <div className="relative flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[2rem]">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 z-[500] w-full max-w-xl -translate-x-1/2 px-4">
        <div className="relative">
          <div className="flex items-center overflow-visible rounded-2xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex-shrink-0 pr-2 pl-4">
              <Search className="h-5 w-5 text-green-700" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location (e.g. Delhi, Mumbai...)"
              className="text-on-surface placeholder:text-on-surface-variant/60 flex-1 bg-transparent py-4 pr-4 text-sm font-medium outline-none"
            />
            {isSearching && <Loader2 className="text-primary mr-3 h-4 w-4 animate-spin" />}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="mr-3"
              >
                <X className="text-on-surface-variant h-4 w-4" />
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
                className="border-outline-variant/10 absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border bg-white shadow-2xl"
              >
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectResult(result)}
                    className="hover:bg-surface-container-low border-outline-variant/5 flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0"
                  >
                    <MapPin className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-on-surface line-clamp-2 text-sm font-medium">
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
          <iframe src={mapUrl} title="Map" className="h-full w-full border-0" allowFullScreen />
        ) : (
          <div className="bg-surface-container flex h-full w-full items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="absolute right-0 bottom-[17rem] left-0 z-[400] flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f.name}
            onClick={() => setActiveFilter(f.name)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow transition-all active:scale-95 ${
              activeFilter === f.name
                ? 'bg-primary shadow-primary/20 text-white shadow-lg'
                : 'border-outline-variant/10 border bg-white/95 text-green-900 backdrop-blur-md'
            }`}
          >
            {f.icon && <f.icon className="h-3.5 w-3.5" />}
            {f.name}
          </button>
        ))}
      </div>

      {/* Bottom Sheet – Facility List */}
      <div className="absolute right-0 bottom-0 left-0 z-[400] max-h-72 overflow-hidden rounded-t-3xl border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-2xl">
        <div className="bg-surface-container-highest mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full" />
        <div className="flex items-center justify-between gap-3 px-6 pb-2">
          <div>
            <h2 className="text-on-surface text-base font-extrabold">Nearby Disposal Points</h2>
            {location.state?.item && (
              <p className="text-on-surface-variant mt-1 text-xs">
                Recommended for{' '}
                <span className="text-primary font-bold">{location.state.item}</span>
              </p>
            )}
          </div>
          <span className="text-primary bg-primary/10 rounded-full px-2 py-1 text-xs font-bold">
            {visibleFacilities.length} Found
          </span>
        </div>
        <div className="max-h-48 space-y-3 overflow-y-auto px-4 pb-4">
          {visibleFacilities.map((facility) => (
            <div
              key={facility.name}
              className={`border-outline-variant/10 flex items-center gap-4 rounded-2xl border p-4 ${selectedFacility?.name === facility.name ? 'border-primary/30 bg-primary/5' : 'bg-surface-container-low'} cursor-pointer transition-all hover:shadow-md`}
              onClick={() => {
                setSelectedFacility(facility);
                updateMapUrl(facility.lat, facility.lng, 16);
              }}
            >
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${facility.bg}`}
              >
                <facility.icon className={`h-6 w-6 ${facility.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-on-surface truncate text-sm font-bold">{facility.name}</h3>
                <p className="text-on-surface-variant text-xs">
                  {facility.status} · {facility.distance}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(facility);
                }}
                className="bg-primary flex-shrink-0 rounded-full p-2.5 text-white shadow-md transition-all active:scale-95"
              >
                <Navigation className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

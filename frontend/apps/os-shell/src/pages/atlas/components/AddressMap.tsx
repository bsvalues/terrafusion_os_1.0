/**
 * BIV-096: Address Map Component
 * Leaflet-based address map with marker placement.
 * Geocode search bar, click-to-place marker, marker popup with address info.
 * Note: When Leaflet is integrated, replace the placeholder map with actual tiles.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddressMarker {
  id: string;
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface AddressMapProps {
  markers?: AddressMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerPlace?: (lat: number, lng: number) => void;
  onMarkerSelect?: (marker: AddressMarker) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddressMap({
  markers = [],
  center = [46.23, -119.2],
  zoom = 13,
  onMarkerPlace,
  onMarkerSelect,
  className = '',
}: AddressMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [placedMarker, setPlacedMarker] = useState<{ lat: number; lng: number } | null>(null);

  const allMarkers = [...markers];
  if (placedMarker) {
    allMarkers.push({
      id: '__placed__',
      lat: placedMarker.lat,
      lng: placedMarker.lng,
      address: 'Placed marker',
    });
  }

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // In production, this would call a geocoding API.
      // For now, place a marker near the center with a slight offset.
      if (searchQuery.trim()) {
        const lat = center[0] + (Math.random() - 0.5) * 0.02;
        const lng = center[1] + (Math.random() - 0.5) * 0.02;
        setPlacedMarker({ lat, lng });
        onMarkerPlace?.(lat, lng);
      }
    },
    [searchQuery, center, onMarkerPlace],
  );

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const lat = center[0] + (0.5 - yPct) * 0.04;
      const lng = center[1] + (xPct - 0.5) * 0.06;
      setPlacedMarker({ lat, lng });
      onMarkerPlace?.(lat, lng);
    },
    [center, onMarkerPlace],
  );

  const handleMarkerClick = useCallback(
    (marker: AddressMarker) => {
      setActiveMarkerId(activeMarkerId === marker.id ? null : marker.id);
      onMarkerSelect?.(marker);
    },
    [activeMarkerId, onMarkerSelect],
  );

  return (
    <div className={`flex flex-col bg-terra-midnight text-white rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-shrink-0 p-2 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address..."
            className="flex-1 bg-terra-slate/40 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-terra-cyan/40"
            aria-label="Geocode search"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-terra-cyan/20 border border-terra-cyan/40 rounded text-xs text-terra-cyan hover:bg-terra-cyan/30 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Map area */}
      <div
        className="flex-1 relative min-h-[300px] cursor-crosshair"
        onClick={handleMapClick}
        role="application"
        aria-label="Address map - click to place marker"
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="addr-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#addr-grid)" />
          </svg>
        </div>

        {/* Markers */}
        {allMarkers.map((marker) => {
          const xPct = ((marker.lng - center[1]) / 0.06 + 0.5) * 100;
          const yPct = ((center[0] - marker.lat) / 0.04 + 0.5) * 100;
          const isActive = activeMarkerId === marker.id;
          const isPlaced = marker.id === '__placed__';

          return (
            <div
              key={marker.id}
              className="absolute transition-all duration-200"
              style={{
                left: `${Math.max(4, Math.min(96, xPct))}%`,
                top: `${Math.max(4, Math.min(96, yPct))}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: isActive ? 20 : 10,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkerClick(marker);
                }}
                className="flex flex-col items-center"
                aria-label={`Marker: ${marker.address}`}
              >
                {/* Pin */}
                <svg width="24" height="32" viewBox="0 0 24 32">
                  <path
                    d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"
                    fill={isPlaced ? '#F59E0B' : '#00FFFF'}
                    fillOpacity={isActive ? 1 : 0.8}
                  />
                  <circle cx="12" cy="12" r="4" fill="white" />
                </svg>
              </button>

              {/* Popup */}
              {isActive && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-terra-slate border border-white/20 rounded p-2 text-xs whitespace-nowrap z-30 shadow-xl">
                  <p className="font-medium text-white">{marker.address}</p>
                  {marker.city && (
                    <p className="text-white/50">
                      {marker.city}
                      {marker.state ? `, ${marker.state}` : ''}
                      {marker.zip ? ` ${marker.zip}` : ''}
                    </p>
                  )}
                  <p className="text-white/30 mt-1">
                    {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Coordinates */}
        <div className="absolute bottom-2 left-2 text-[9px] text-white/30 font-mono bg-terra-midnight/60 px-1.5 py-0.5 rounded">
          {center[0].toFixed(4)} N, {Math.abs(center[1]).toFixed(4)} W | Zoom {zoom}
        </div>
      </div>
    </div>
  );
}

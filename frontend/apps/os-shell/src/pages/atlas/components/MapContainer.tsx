/**
 * BIV-098: Base Map Container
 * Leaflet initialization, layer management (add/remove/toggle),
 * zoom controls, scale bar, coordinate display, event handling.
 * When Leaflet is integrated, replace placeholder map with real tiles.
 */
import { useCallback, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapLayer {
  id: string;
  label: string;
  visible: boolean;
  type: 'tile' | 'vector' | 'overlay';
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  layers?: MapLayer[];
  children?: React.ReactNode;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onClick?: (lat: number, lng: number) => void;
  onHover?: (lat: number, lng: number) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  showControls?: boolean;
  showScale?: boolean;
  showCoordinates?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapContainer({
  center = [46.23, -119.2],
  zoom: initialZoom = 13,
  minZoom = 8,
  maxZoom = 18,
  layers: initialLayers,
  children,
  onLayerToggle,
  onClick,
  onHover,
  showControls = true,
  showScale = true,
  showCoordinates = true,
  className = '',
}: MapContainerProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(
    initialLayers ?? [
      { id: 'base', label: 'Base Map', visible: true, type: 'tile' },
      { id: 'parcels', label: 'Parcels', visible: true, type: 'vector' },
      { id: 'roads', label: 'Roads', visible: true, type: 'overlay' },
    ],
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 1, maxZoom));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 1, minZoom));
  }, [minZoom]);

  const handleToggleLayer = useCallback(
    (id: string) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id === id) {
            const next = { ...l, visible: !l.visible };
            onLayerToggle?.(id, next.visible);
            return next;
          }
          return l;
        }),
      );
    },
    [onLayerToggle],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const lat = center[0] + (0.5 - yPct) * 0.04;
      const lng = center[1] + (xPct - 0.5) * 0.06;
      setCursorPos({ lat, lng });
      onHover?.(lat, lng);
    },
    [center, onHover],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const lat = center[0] + (0.5 - yPct) * 0.04;
      const lng = center[1] + (xPct - 0.5) * 0.06;
      onClick?.(lat, lng);
    },
    [center, onClick],
  );

  const scaleText = useMemo(() => {
    const metersPerPixel = (156543.03 * Math.cos((center[0] * Math.PI) / 180)) / Math.pow(2, zoom);
    const scaleM = metersPerPixel * 100;
    if (scaleM >= 1000) return `${(scaleM / 1000).toFixed(1)} km`;
    return `${Math.round(scaleM)} m`;
  }, [center, zoom]);

  return (
    <div className={`flex flex-col bg-terra-midnight text-white rounded-lg border border-white/10 overflow-hidden ${className}`}>
      <div
        className="flex-1 relative min-h-[300px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorPos(null)}
        onClick={handleClick}
        role="application"
        aria-label="Interactive map"
      >
        {/* Grid background placeholder */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="mc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mc-grid)" />
          </svg>
        </div>

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="10" y1="0" x2="10" y2="20" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
          </svg>
        </div>

        {/* Child elements (markers, overlays, etc.) */}
        {children}

        {/* Layer panel */}
        {layers.length > 0 && (
          <div className="absolute top-2 left-2 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
            <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1.5">Layers</p>
            {layers.map((layer) => (
              <label key={layer.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => handleToggleLayer(layer.id)}
                  className="accent-terra-cyan"
                />
                <span className="text-white/60">{layer.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Zoom controls */}
        {showControls && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
              className="w-7 h-7 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:text-white disabled:opacity-30 text-sm"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
              className="w-7 h-7 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:text-white disabled:opacity-30 text-sm"
              aria-label="Zoom out"
            >
              -
            </button>
          </div>
        )}

        {/* Scale bar */}
        {showScale && (
          <div className="absolute bottom-2 right-2 flex items-end gap-1">
            <div className="border-b border-l border-r border-white/30 w-[100px] h-2" />
            <span className="text-[9px] text-white/40">{scaleText}</span>
          </div>
        )}

        {/* Coordinate display */}
        {showCoordinates && (
          <div className="absolute bottom-2 left-2 text-[9px] text-white/30 font-mono bg-terra-midnight/60 px-1.5 py-0.5 rounded">
            {cursorPos
              ? `${cursorPos.lat.toFixed(5)} N, ${Math.abs(cursorPos.lng).toFixed(5)} W`
              : `${center[0].toFixed(4)} N, ${Math.abs(center[1]).toFixed(4)} W`}
            {' | Z'}
            {zoom}
          </div>
        )}
      </div>
    </div>
  );
}

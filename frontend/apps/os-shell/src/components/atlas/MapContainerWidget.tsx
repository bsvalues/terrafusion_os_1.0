/**
 * TFT-125: Compact Map Container Widget
 * Simplified controls for embedded use. Fixed zoom range.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapContainerWidgetProps {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  onClick?: (lat: number, lng: number) => void;
  showZoomControls?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapContainerWidget({
  center = [46.23, -119.2],
  zoom: initialZoom = 13,
  children,
  onClick,
  showZoomControls = true,
  className = '',
}: MapContainerWidgetProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const minZoom = 10;
  const maxZoom = 16;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const lat = center[0] + (0.5 - yPct) * 0.02;
      const lng = center[1] + (xPct - 0.5) * 0.03;
      onClick(lat, lng);
    },
    [center, onClick],
  );

  return (
    <div
      className={`relative bg-terra-midnight rounded border border-white/10 overflow-hidden ${className}`}
      style={{ minHeight: 160 }}
      onClick={handleClick}
      role="application"
      aria-label="Map widget"
    >
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="mcw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mcw-grid)" />
        </svg>
      </div>

      {/* Children (markers, overlays) */}
      {children}

      {/* Simplified zoom controls */}
      {showZoomControls && (
        <div className="absolute top-1 right-1 flex flex-col gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 1, maxZoom)); }}
            disabled={zoom >= maxZoom}
            className="w-5 h-5 rounded bg-terra-slate/60 border border-white/10 text-white/60 hover:text-white disabled:opacity-30 text-[10px] leading-none"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 1, minZoom)); }}
            disabled={zoom <= minZoom}
            className="w-5 h-5 rounded bg-terra-slate/60 border border-white/10 text-white/60 hover:text-white disabled:opacity-30 text-[10px] leading-none"
            aria-label="Zoom out"
          >
            -
          </button>
        </div>
      )}

      {/* Coordinates */}
      <div className="absolute bottom-1 left-1 text-[8px] text-white/25 font-mono">
        {center[0].toFixed(3)}, {center[1].toFixed(3)}
      </div>
    </div>
  );
}

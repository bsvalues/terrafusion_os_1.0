/**
 * TFT-124: Compact Address Map Widget
 * Smaller version of AddressMap for workbench context.
 * Single marker placement.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddressMapWidgetProps {
  address?: string;
  lat?: number;
  lng?: number;
  onMarkerPlace?: (lat: number, lng: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddressMapWidget({
  address = '',
  lat,
  lng,
  onMarkerPlace,
  className = '',
}: AddressMapWidgetProps) {
  const markerColor = 'hsl(var(--primary))';

  const center: [number, number] = [lat ?? 46.23, lng ?? -119.2];
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const newLat = center[0] + (0.5 - yPct) * 0.02;
      const newLng = center[1] + (xPct - 0.5) * 0.03;
      setMarker({ lat: newLat, lng: newLng });
      onMarkerPlace?.(newLat, newLng);
    },
    [center, onMarkerPlace],
  );

  return (
    <div
      className={`relative bg-terra-midnight rounded border border-white/10 overflow-hidden cursor-crosshair ${className}`}
      style={{ minHeight: 160 }}
      onClick={handleClick}
      role="application"
      aria-label="Address map widget"
    >
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="amw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#amw-grid)" />
        </svg>
      </div>

      {/* Marker */}
      {marker && (
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <svg width="18" height="24" viewBox="0 0 24 32">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill={markerColor} />
            <circle cx="12" cy="12" r="3" fill="white" />
          </svg>
        </div>
      )}

      {/* Address label */}
      {address && (
        <div className="absolute bottom-1 left-1 right-1 text-[9px] text-white/50 bg-terra-midnight/70 px-1.5 py-0.5 rounded truncate">
          {address}
        </div>
      )}
    </div>
  );
}

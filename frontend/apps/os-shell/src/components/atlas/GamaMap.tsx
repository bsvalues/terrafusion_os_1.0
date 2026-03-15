/**
 * TFT-121: GAMA Spatial Map
 * Zoning-colored parcels with select-to-detail panel.
 * Regulation overlay support.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GamaParcel {
  id: string;
  parcelNumber: string;
  address: string;
  zoning: string;
  neighborhood: string;
  propertyClass: string;
  center: [number, number];
}

export interface GamaMapProps {
  parcels: GamaParcel[];
  mapCenter?: [number, number];
  showRegulations?: boolean;
  onParcelSelect?: (parcel: GamaParcel | null) => void;
  selectedParcelId?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Zoning palette
// ---------------------------------------------------------------------------

const ZONING_COLORS: Record<string, string> = {
  'R-1': '#22C55E', 'R-2': '#16A34A', 'R-3': '#15803D',
  'C-1': '#3B82F6', 'C-2': '#2563EB', 'C-3': '#1D4ED8',
  'I-1': '#F59E0B', 'I-2': '#D97706',
  AG: '#A3E635', PUD: '#A855F7',
};

const REGULATIONS: Record<string, Record<string, string>> = {
  'R-1': { 'Max Height': '35 ft', Setback: '20 ft', Coverage: '40%' },
  'R-2': { 'Max Height': '45 ft', Setback: '15 ft', Coverage: '50%' },
  'C-1': { 'Max Height': '50 ft', Setback: '0 ft', Coverage: '80%' },
  'C-2': { 'Max Height': '75 ft', Setback: '0 ft', Coverage: '90%' },
  'I-1': { 'Max Height': '60 ft', Setback: '30 ft', Coverage: '60%' },
  AG: { 'Max Height': '35 ft', Setback: '50 ft', Coverage: '10%' },
  PUD: { 'Max Height': 'Per plan', Setback: 'Per plan', Coverage: 'Per plan' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GamaMap({
  parcels,
  mapCenter = [46.235, -119.21],
  showRegulations = false,
  onParcelSelect,
  selectedParcelId = null,
  className = '',
}: GamaMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (parcel: GamaParcel) => {
      const next = selectedParcelId === parcel.id ? null : parcel;
      onParcelSelect?.(next);
    },
    [selectedParcelId, onParcelSelect],
  );

  const selectedParcel = parcels.find((p) => p.id === selectedParcelId) ?? null;

  return (
    <div className={`flex bg-terra-midnight text-white rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Map */}
      <div className="flex-1 relative min-h-[250px]">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="gama-m-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gama-m-grid)" />
          </svg>
        </div>

        {parcels.map((parcel) => {
          const xPct = ((parcel.center[1] - mapCenter[1]) / 0.06 + 0.5) * 100;
          const yPct = ((mapCenter[0] - parcel.center[0]) / 0.04 + 0.5) * 100;
          const color = ZONING_COLORS[parcel.zoning] ?? '#6B7280';
          const isSelected = selectedParcelId === parcel.id;
          const isHovered = hoveredId === parcel.id;

          return (
            <button
              key={parcel.id}
              className="absolute transition-all duration-200"
              style={{
                left: `${Math.max(4, Math.min(92, xPct))}%`,
                top: `${Math.max(4, Math.min(92, yPct))}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 15 : isHovered ? 10 : 1,
              }}
              onClick={() => handleSelect(parcel)}
              onMouseEnter={() => setHoveredId(parcel.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={`Parcel ${parcel.parcelNumber} - ${parcel.zoning}`}
            >
              <div
                className="rounded border-2 flex items-center justify-center text-[9px] font-medium transition-all"
                style={{
                  width: 56,
                  height: 38,
                  backgroundColor: `${color}${isSelected ? '44' : '22'}`,
                  borderColor: isSelected ? '#FFF' : `${color}${isHovered ? 'BB' : '66'}`,
                  boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                  color: isSelected || isHovered ? '#FFF' : `${color}CC`,
                }}
              >
                {parcel.zoning}
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {Object.entries(ZONING_COLORS).map(([code, color]) => (
              <span key={code} className="flex items-center gap-1 text-[9px]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-white/50">{code}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedParcel && (
        <div className="w-56 flex-shrink-0 border-l border-white/10 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-terra-cyan">Detail</h3>
            <button onClick={() => onParcelSelect?.(null)} className="text-white/40 hover:text-white text-sm" aria-label="Close">x</button>
          </div>
          <dl className="space-y-1.5 text-[11px]">
            <div className="flex justify-between"><dt className="text-white/40">Parcel</dt><dd className="text-white">{selectedParcel.parcelNumber}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Address</dt><dd className="text-white">{selectedParcel.address}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Zoning</dt><dd style={{ color: ZONING_COLORS[selectedParcel.zoning] }}>{selectedParcel.zoning}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Neighborhood</dt><dd className="text-white">{selectedParcel.neighborhood}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Class</dt><dd className="text-white">{selectedParcel.propertyClass}</dd></div>
          </dl>

          {showRegulations && REGULATIONS[selectedParcel.zoning] && (
            <div className="border-t border-white/10 pt-2">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Regulations</p>
              <dl className="space-y-1 text-[11px]">
                {Object.entries(REGULATIONS[selectedParcel.zoning]).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-white/40">{k}</dt>
                    <dd className="text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

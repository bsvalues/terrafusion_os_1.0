/**
 * TFT-111: Reusable GIS Visualization Component
 * Accepts layers, features, overlays as props.
 * Parcel polygon rendering with hover/select. Mini legend.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GisFeature {
  id: string;
  label: string;
  color: string;
  center: [number, number];
  size?: number;
  metadata?: Record<string, string | number>;
}

export interface GisOverlay {
  id: string;
  label: string;
  visible: boolean;
  opacity?: number;
}

export interface GisLegendItem {
  label: string;
  color: string;
}

export interface GisVisualizationProps {
  features: GisFeature[];
  overlays?: GisOverlay[];
  legend?: GisLegendItem[];
  mapCenter?: [number, number];
  onFeatureSelect?: (feature: GisFeature) => void;
  onFeatureHover?: (feature: GisFeature | null) => void;
  selectedFeatureId?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GisVisualization({
  features,
  overlays = [],
  legend = [],
  mapCenter = [46.235, -119.21],
  onFeatureSelect,
  onFeatureHover,
  selectedFeatureId = null,
  className = '',
}: GisVisualizationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [overlayState, setOverlayState] = useState<Record<string, boolean>>(
    Object.fromEntries(overlays.map((o) => [o.id, o.visible])),
  );

  const handleFeatureClick = useCallback(
    (feature: GisFeature) => {
      onFeatureSelect?.(feature);
    },
    [onFeatureSelect],
  );

  const handleFeatureHover = useCallback(
    (feature: GisFeature | null) => {
      setHoveredId(feature?.id ?? null);
      onFeatureHover?.(feature);
    },
    [onFeatureHover],
  );

  const toggleOverlay = useCallback((id: string) => {
    setOverlayState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div
      className={`relative bg-terra-midnight rounded-lg border border-white/10 overflow-hidden min-h-[250px] ${className}`}
      role="application"
      aria-label="GIS visualization"
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="gis-v-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gis-v-grid)" />
        </svg>
      </div>

      {/* Features */}
      {features.map((feature) => {
        const xPct = ((feature.center[1] - mapCenter[1]) / 0.08 + 0.5) * 100;
        const yPct = ((mapCenter[0] - feature.center[0]) / 0.06 + 0.5) * 100;
        const isSelected = selectedFeatureId === feature.id;
        const isHovered = hoveredId === feature.id;
        const size = feature.size ?? 50;
        const activeTextColor = 'hsl(var(--tf-text-primary-hs) var(--tf-l-100))';

        return (
          <button
            key={feature.id}
            className="absolute transition-all duration-200"
            style={{
              left: `${Math.max(4, Math.min(92, xPct))}%`,
              top: `${Math.max(4, Math.min(92, yPct))}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: isSelected ? 15 : isHovered ? 10 : 1,
            }}
            onClick={() => handleFeatureClick(feature)}
            onMouseEnter={() => handleFeatureHover(feature)}
            onMouseLeave={() => handleFeatureHover(null)}
            aria-label={feature.label}
          >
            <div
              className="rounded border-2 flex items-center justify-center text-[9px] font-medium transition-all"
              style={{
                width: size,
                height: size * 0.7,
                backgroundColor: `${feature.color}${isSelected ? '44' : isHovered ? '33' : '22'}`,
                borderColor: isSelected ? activeTextColor : `${feature.color}${isHovered ? 'BB' : '66'}`,
                boxShadow: isSelected ? `0 0 10px ${feature.color}44` : 'none',
                color: isHovered || isSelected ? activeTextColor : `${feature.color}CC`,
              }}
            >
              {feature.label}
            </div>

            {/* Hover tooltip with metadata */}
            {isHovered && feature.metadata && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-terra-slate border border-white/20 rounded px-2 py-1 text-[10px] whitespace-nowrap z-20 shadow-xl">
                {Object.entries(feature.metadata).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-white/40">{key}:</span>
                    <span className="text-white/80">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}

      {/* Overlay toggles */}
      {overlays.length > 0 && (
        <div className="absolute top-2 left-2 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">Overlays</p>
          {overlays.map((overlay) => (
            <label key={overlay.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer mb-0.5">
              <input
                type="checkbox"
                checked={overlayState[overlay.id] ?? overlay.visible}
                onChange={() => toggleOverlay(overlay.id)}
                className="accent-terra-cyan"
              />
              <span className="text-white/60">{overlay.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Mini legend */}
      {legend.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
          <div className="flex flex-wrap gap-2">
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-1 text-[9px]">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-white/60">{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

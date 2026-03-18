/**
 * LEV-086 - Interactive GIS-based Tax District Map
 *
 * Placeholder component for rendering tax district polygons on an
 * interactive map surface. Designed to accept district boundary data
 * and emit selection events.
 */

import React, { useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DistrictPolygon {
  id: string;
  name: string;
  taxCode: string;
  /** GeoJSON-style coordinate ring: [[lng, lat], ...] */
  coordinates: [number, number][];
  fillColor?: string;
}

export interface DistrictMapProps {
  districts: DistrictPolygon[];
  selectedDistrict?: string | null;
  onSelect?: (districtId: string) => void;
  width?: number | string;
  height?: number | string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DistrictMap: React.FC<DistrictMapProps> = ({
  districts,
  selectedDistrict = null,
  onSelect,
  width = '100%',
  height = 600,
}) => {
  const handleClick = useCallback(
    (id: string) => {
      onSelect?.(id);
    },
    [onSelect],
  );

  return (
    <div
      className="relative rounded-lg border border-slate-700 bg-slate-900 overflow-hidden"
      style={{ width, height }}
    >
      {/* Map toolbar */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button className="rounded bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
          Zoom In
        </button>
        <button className="rounded bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
          Zoom Out
        </button>
        <button className="rounded bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
          Reset
        </button>
      </div>

      {/* Polygon rendering area -- placeholder SVG viewport */}
      <svg
        viewBox="0 0 1000 800"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="1000" height="800" fill="#0f172a" />

        {districts.map((d) => {
          const points = d.coordinates.map(([x, y]) => `${x},${y}`).join(' ');
          const isSelected = d.id === selectedDistrict;

          return (
            <polygon
              key={d.id}
              points={points}
              fill={d.fillColor ?? (isSelected ? '#3b82f6' : '#1e293b')}
              stroke={isSelected ? '#60a5fa' : '#334155'}
              strokeWidth={isSelected ? 2.5 : 1}
              opacity={isSelected ? 1 : 0.8}
              className="cursor-pointer transition-colors hover:fill-blue-800"
              onClick={() => handleClick(d.id)}
            />
          );
        })}
      </svg>

      {/* Selected district info panel */}
      {selectedDistrict && (
        <div className="absolute bottom-2 right-2 z-10 rounded bg-slate-800/90 px-4 py-2 text-sm text-slate-200">
          <span className="font-medium">Selected:</span>{' '}
          {districts.find((d) => d.id === selectedDistrict)?.name ?? selectedDistrict}
        </div>
      )}
    </div>
  );
};

export default DistrictMap;

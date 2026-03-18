/**
 * TFT-140: Compact School District Widget
 * Shows nearest schools to current parcel.
 */
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NearbySchool {
  id: string;
  name: string;
  type: 'Elementary' | 'Middle' | 'High';
  rating: number; // 1-10
  distanceMi: number;
  district: string;
}

export interface SchoolDistrictWidgetProps {
  schools: NearbySchool[];
  parcelAddress?: string;
  maxDisplay?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratingColor(rating: number): string {
  if (rating >= 8) return 'hsl(var(--tf-success))';
  if (rating >= 6) return 'hsl(var(--tf-warning))';
  return 'hsl(var(--tf-error))';
}

function typeAbbr(type: string): string {
  switch (type) {
    case 'Elementary': return 'ES';
    case 'Middle': return 'MS';
    case 'High': return 'HS';
    default: return type.substring(0, 2);
  }
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_SCHOOLS: NearbySchool[] = [
  { id: 'ns1', name: 'Vista Elementary', type: 'Elementary', rating: 9, distanceMi: 0.4, district: 'Kennewick SD' },
  { id: 'ns2', name: 'Desert Hills Middle', type: 'Middle', rating: 8, distanceMi: 1.2, district: 'Kennewick SD' },
  { id: 'ns3', name: 'Kennewick High', type: 'High', rating: 7, distanceMi: 2.1, district: 'Kennewick SD' },
  { id: 'ns4', name: 'Lewis & Clark Elem', type: 'Elementary', rating: 8, distanceMi: 3.5, district: 'Richland SD' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SchoolDistrictWidget({
  schools = DEFAULT_SCHOOLS,
  parcelAddress,
  maxDisplay = 4,
  className = '',
}: SchoolDistrictWidgetProps) {
  const sortedSchools = useMemo(
    () => [...schools].sort((a, b) => a.distanceMi - b.distanceMi).slice(0, maxDisplay),
    [schools, maxDisplay],
  );

  const districts = useMemo(
    () => [...new Set(sortedSchools.map((s) => s.district))],
    [sortedSchools],
  );

  return (
    <div
      className={`bg-terra-midnight rounded border border-white/10 p-3 text-white ${className}`}
      role="region"
      aria-label="Nearby schools"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-terra-cyan">Nearby Schools</h3>
        <span className="text-[9px] text-white/30">
          {districts.join(', ')}
        </span>
      </div>

      {parcelAddress && (
        <p className="text-[9px] text-white/40 mb-2 truncate">From: {parcelAddress}</p>
      )}

      <div className="space-y-1.5">
        {sortedSchools.map((school) => (
          <div key={school.id} className="flex items-center gap-2">
            {/* Rating badge */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: ratingColor(school.rating), color: 'white' }}
            >
              {school.rating}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/80 truncate">{school.name}</p>
              <p className="text-[9px] text-white/40">{school.district}</p>
            </div>

            {/* Type + distance */}
            <div className="flex-shrink-0 text-right">
              <span className="text-[9px] text-white/40 mr-1">{typeAbbr(school.type)}</span>
              <span className="text-[10px] text-white/60">{school.distanceMi} mi</span>
            </div>
          </div>
        ))}
      </div>

      {schools.length > maxDisplay && (
        <p className="text-[9px] text-white/30 mt-2 text-center">
          +{schools.length - maxDisplay} more schools nearby
        </p>
      )}
    </div>
  );
}

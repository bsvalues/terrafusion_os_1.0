/**
 * BIV-123: School District Map
 * District boundary polygons with labels, school markers with rating badges.
 * District comparison chart sidebar.
 */
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface School {
  id: string;
  name: string;
  type: 'Elementary' | 'Middle' | 'High';
  rating: number; // 1-10
  center: [number, number];
}

export interface SchoolDistrict {
  id: string;
  name: string;
  color: string;
  schools: School[];
  studentCount: number;
  center: [number, number];
}

export interface SchoolDistrictMapProps {
  districts?: SchoolDistrict[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_DISTRICTS: SchoolDistrict[] = [
  {
    id: 'd1',
    name: 'Kennewick SD',
    color: '#3B82F6',
    studentCount: 18500,
    center: [46.21, -119.17],
    schools: [
      { id: 's1', name: 'Kennewick High', type: 'High', rating: 7, center: [46.215, -119.17] },
      { id: 's2', name: 'Desert Hills Middle', type: 'Middle', rating: 8, center: [46.205, -119.18] },
      { id: 's3', name: 'Vista Elementary', type: 'Elementary', rating: 9, center: [46.22, -119.16] },
    ],
  },
  {
    id: 'd2',
    name: 'Richland SD',
    color: '#22C55E',
    studentCount: 14200,
    center: [46.27, -119.28],
    schools: [
      { id: 's4', name: 'Richland High', type: 'High', rating: 8, center: [46.275, -119.28] },
      { id: 's5', name: 'Chief Joseph Middle', type: 'Middle', rating: 7, center: [46.265, -119.29] },
      { id: 's6', name: 'Lewis & Clark Elem', type: 'Elementary', rating: 8, center: [46.28, -119.27] },
    ],
  },
  {
    id: 'd3',
    name: 'Pasco SD',
    color: '#F59E0B',
    studentCount: 19800,
    center: [46.24, -119.1],
    schools: [
      { id: 's7', name: 'Pasco High', type: 'High', rating: 6, center: [46.245, -119.1] },
      { id: 's8', name: 'Stevens Middle', type: 'Middle', rating: 7, center: [46.235, -119.11] },
      { id: 's9', name: 'Whittier Elem', type: 'Elementary', rating: 7, center: [46.25, -119.09] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratingColor(rating: number): string {
  if (rating >= 8) return '#22C55E';
  if (rating >= 6) return '#F59E0B';
  return '#EF4444';
}

function ratingBadge(rating: number): string {
  if (rating >= 8) return 'A';
  if (rating >= 6) return 'B';
  if (rating >= 4) return 'C';
  return 'D';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SchoolDistrictMap({
  districts = DEFAULT_DISTRICTS,
  className = '',
}: SchoolDistrictMapProps) {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === selectedDistrictId) ?? null,
    [districts, selectedDistrictId],
  );

  const mapCenter: [number, number] = [46.24, -119.19];

  const toggleDistrict = useCallback((id: string) => {
    setSelectedDistrictId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className={`flex bg-terra-midnight text-white rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Map */}
      <div className="flex-1 relative min-h-[400px]">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="sd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sd-grid)" />
          </svg>
        </div>

        {/* District areas */}
        {districts.map((district) => {
          const xPct = ((district.center[1] - mapCenter[1]) / 0.25 + 0.5) * 100;
          const yPct = ((mapCenter[0] - district.center[0]) / 0.1 + 0.5) * 100;
          const isSelected = selectedDistrictId === district.id;

          return (
            <div key={district.id}>
              {/* District boundary */}
              <button
                onClick={() => toggleDistrict(district.id)}
                className="absolute transition-all duration-200"
                style={{
                  left: `${Math.max(5, Math.min(85, xPct))}%`,
                  top: `${Math.max(5, Math.min(85, yPct))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`${district.name} district`}
              >
                <div
                  className="rounded-xl flex items-center justify-center transition-all"
                  style={{
                    width: 120,
                    height: 90,
                    backgroundColor: `${district.color}${isSelected ? '28' : '12'}`,
                    border: `2px ${isSelected ? 'solid' : 'dashed'} ${district.color}${isSelected ? 'AA' : '44'}`,
                    boxShadow: isSelected ? `0 0 16px ${district.color}33` : 'none',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: `${district.color}CC` }}>
                    {district.name}
                  </span>
                </div>
              </button>

              {/* School markers */}
              {district.schools.map((school) => {
                const sx = ((school.center[1] - mapCenter[1]) / 0.25 + 0.5) * 100;
                const sy = ((mapCenter[0] - school.center[0]) / 0.1 + 0.5) * 100;
                const badgeColor = ratingColor(school.rating);

                return (
                  <div
                    key={school.id}
                    className="absolute transition-all duration-200 pointer-events-none"
                    style={{
                      left: `${Math.max(5, Math.min(92, sx))}%`,
                      top: `${Math.max(5, Math.min(92, sy))}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity: isSelected || !selectedDistrictId ? 1 : 0.3,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: badgeColor, color: '#FFF' }}
                      >
                        {ratingBadge(school.rating)}
                      </div>
                      <span className="text-[8px] text-white/50 whitespace-nowrap">{school.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-l border-white/10 p-3 overflow-y-auto space-y-3">
        <h2 className="text-sm font-semibold text-terra-cyan">Districts</h2>

        {/* Comparison chart */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-white/60">Student Count</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {districts.map((d) => {
              const maxStudents = Math.max(...districts.map((dd) => dd.studentCount));
              const barWidth = (d.studentCount / maxStudents) * 100;
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDistrict(d.id)}
                  className={`w-full text-left ${selectedDistrictId === d.id ? 'bg-white/10' : ''} rounded p-1.5 transition-colors`}
                >
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span style={{ color: d.color }}>{d.name}</span>
                    <span className="text-white/50">{d.studentCount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: d.color }} />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected district schools */}
        {selectedDistrict && (
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs" style={{ color: selectedDistrict.color }}>
                {selectedDistrict.name} Schools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedDistrict.schools.map((school) => (
                <div key={school.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: ratingColor(school.rating), color: '#FFF' }}
                  >
                    {school.rating}
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80">{school.name}</p>
                    <p className="text-white/40 text-[10px]">{school.type}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}

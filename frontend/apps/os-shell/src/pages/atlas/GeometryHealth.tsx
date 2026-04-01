/**
 * TFR-105: Geometry Health Dashboard
 * Monitors parcel polygon linkage quality.
 * Stats: parcels with polygons, orphaned polygons, parcels missing geometry.
 * Map showing gaps in polygon coverage.
 */
import { useMemo, useState } from 'react';
import { useParcelCount } from '../../hooks/useParcelCount';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeometryHealthData {
  totalParcels: number;
  parcelsWithPolygons: number;
  parcelsMissingGeometry: number;
  orphanedPolygons: number;
  lastSyncTimestamp: string;
  areaStats: AreaGeometryStats[];
}

export interface AreaGeometryStats {
  id: string;
  name: string;
  totalParcels: number;
  linkedParcels: number;
  missingGeometry: number;
  orphanedPolygons: number;
  center: [number, number];
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const HEALTH_DATA: GeometryHealthData = {
  totalParcels: 89_247,
  parcelsWithPolygons: 85612,
  parcelsMissingGeometry: 3208,
  orphanedPolygons: 427,
  lastSyncTimestamp: '2026-03-15T08:30:00Z',
  areaStats: [
    { id: 'a1', name: 'Downtown', totalParcels: 12450, linkedParcels: 12380, missingGeometry: 42, orphanedPolygons: 28, center: [46.23, -119.2] },
    { id: 'a2', name: 'Riverside', totalParcels: 18200, linkedParcels: 17950, missingGeometry: 180, orphanedPolygons: 70, center: [46.24, -119.21] },
    { id: 'a3', name: 'West Hills', totalParcels: 14300, linkedParcels: 13800, missingGeometry: 420, orphanedPolygons: 80, center: [46.25, -119.23] },
    { id: 'a4', name: 'Eastgate', totalParcels: 8900, linkedParcels: 7200, missingGeometry: 1500, orphanedPolygons: 200, center: [46.22, -119.18] },
    { id: 'a5', name: 'Southridge', totalParcels: 21500, linkedParcels: 21400, missingGeometry: 66, orphanedPolygons: 34, center: [46.21, -119.22] },
    { id: 'a6', name: 'Northview', totalParcels: 13897, linkedParcels: 12882, missingGeometry: 1000, orphanedPolygons: 15, center: [46.26, -119.19] },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthScore(linked: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((linked / total) * 100);
}

function healthColor(score: number): string {
  if (score >= 95) return '#22C55E';
  if (score >= 85) return '#F59E0B';
  return '#EF4444';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GeometryHealth() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const { data: statsData } = useParcelCount();
  const parcelCount = statsData?.totalParcels ?? 89_247;

  const overallScore = useMemo(
    () => healthScore(HEALTH_DATA.parcelsWithPolygons, parcelCount),
    [parcelCount],
  );

  const selectedArea = useMemo(
    () => HEALTH_DATA.areaStats.find((a) => a.id === selectedAreaId) ?? null,
    [selectedAreaId],
  );

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (HEALTH_DATA.parcelsMissingGeometry > 0) {
      recs.push(`${HEALTH_DATA.parcelsMissingGeometry.toLocaleString()} parcels need polygon linkage`);
    }
    if (HEALTH_DATA.orphanedPolygons > 0) {
      recs.push(`${HEALTH_DATA.orphanedPolygons.toLocaleString()} orphaned polygons need review`);
    }
    const worstArea = [...HEALTH_DATA.areaStats].sort(
      (a, b) => healthScore(a.linkedParcels, a.totalParcels) - healthScore(b.linkedParcels, b.totalParcels),
    )[0];
    if (worstArea) {
      const score = healthScore(worstArea.linkedParcels, worstArea.totalParcels);
      if (score < 90) {
        recs.push(`Priority: ${worstArea.name} has lowest coverage at ${score}%`);
      }
    }
    return recs;
  }, []);

  return (
    <div data-testid="geometry-health" className="flex h-full bg-terra-midnight text-white">
      {/* Map */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="geo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo-grid)" />
          </svg>
        </div>

        {/* Area coverage indicators */}
        {HEALTH_DATA.areaStats.map((area) => {
          const xPct = ((area.center[1] + 119.26) / 0.1) * 100;
          const yPct = ((46.27 - area.center[0]) / 0.08) * 100;
          const score = healthScore(area.linkedParcels, area.totalParcels);
          const color = healthColor(score);
          const isSelected = selectedAreaId === area.id;
          const size = 50 + area.totalParcels / 200;

          return (
            <button
              key={area.id}
              onClick={() => setSelectedAreaId(isSelected ? null : area.id)}
              className="absolute transition-all duration-300"
              style={{
                left: `${Math.max(8, Math.min(88, xPct))}%`,
                top: `${Math.max(8, Math.min(88, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${area.name}: ${score}% coverage`}
            >
              {/* Coverage ring */}
              <svg width={size} height={size} className="transition-all">
                <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill={`${color}18`} stroke={`${color}44`} strokeWidth="1" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2 - 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={`${(score / 100) * Math.PI * (size - 8)} ${Math.PI * (size - 8)}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                />
                <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">
                  {score}%
                </text>
                <text x={size / 2} y={size / 2 + 8} textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="8">
                  {area.name}
                </text>
              </svg>
            </button>
          );
        })}
      </main>

      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-l border-white/10 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-semibold text-terra-cyan">Geometry Health</h1>

        {/* Overall health */}
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-white/70">Overall Health</CardTitle>
              <span className="text-2xl font-bold" style={{ color: healthColor(overallScore) }}>
                {overallScore}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${overallScore}%`, backgroundColor: healthColor(overallScore) }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40">Total Parcels</p>
                <p className="text-white font-medium">{parcelCount.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40">Linked</p>
                <p className="text-[#22C55E] font-medium">{HEALTH_DATA.parcelsWithPolygons.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40">Missing</p>
                <p className="text-[#EF4444] font-medium">{HEALTH_DATA.parcelsMissingGeometry.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40">Orphaned</p>
                <p className="text-[#F59E0B] font-medium">{HEALTH_DATA.orphanedPolygons.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[10px] text-white/30">
              Last sync: {new Date(HEALTH_DATA.lastSyncTimestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-terra-cyan mt-0.5">*</span>
                    <span className="text-white/70">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Selected area */}
        {selectedArea && (
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-terra-cyan">{selectedArea.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/50">Coverage</dt>
                  <dd className="font-bold" style={{ color: healthColor(healthScore(selectedArea.linkedParcels, selectedArea.totalParcels)) }}>
                    {healthScore(selectedArea.linkedParcels, selectedArea.totalParcels)}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Total Parcels</dt>
                  <dd className="text-white">{selectedArea.totalParcels.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Linked</dt>
                  <dd className="text-[#22C55E]">{selectedArea.linkedParcels.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Missing</dt>
                  <dd className="text-[#EF4444]">{selectedArea.missingGeometry.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Orphaned</dt>
                  <dd className="text-[#F59E0B]">{selectedArea.orphanedPolygons.toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}

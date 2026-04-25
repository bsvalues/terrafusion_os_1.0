import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { atlasService, type GeometryHealthArea } from '@/services/atlasService';

interface GeometryHealthData {
  totalParcels: number;
  parcelsWithGeometry: number;
  parcelsMissingGeometry: number;
  flaggedGeometryRecords: number;
  lastSyncTimestamp: string;
  source: string;
  areaStats: GeometryHealthArea[];
}

function coveragePercent(linked: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((linked / total) * 10000) / 100;
}

function reviewIntensity(area: GeometryHealthArea): number {
  return area.parcelsMissingGeometry + area.flaggedGeometryRecords;
}

function healthColor(area: Pick<GeometryHealthArea, 'totalParcels' | 'parcelsWithGeometry' | 'parcelsMissingGeometry' | 'flaggedGeometryRecords'>): string {
  const coverage = coveragePercent(area.parcelsWithGeometry, area.totalParcels);
  const reviewLoad = area.parcelsMissingGeometry + area.flaggedGeometryRecords;
  if (coverage >= 99.95 && reviewLoad === 0) return '#22C55E';
  if (coverage >= 99.5 && reviewLoad <= 10) return '#F59E0B';
  return '#EF4444';
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export default function GeometryHealth() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [data, setData] = useState<GeometryHealthData>({
    totalParcels: 0,
    parcelsWithGeometry: 0,
    parcelsMissingGeometry: 0,
    flaggedGeometryRecords: 0,
    lastSyncTimestamp: '',
    source: 'Loading live Benton geometry health...',
    areaStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await atlasService.getGeometryHealth(50);
        if (cancelled) return;
        setData(response);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'GeometryHealth could not load live Benton data.');
        setData((current) => ({
          ...current,
          areaStats: [],
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overallCoverage = useMemo(
    () => coveragePercent(data.parcelsWithGeometry, data.totalParcels),
    [data.parcelsWithGeometry, data.totalParcels],
  );

  const selectedArea = useMemo(
    () => data.areaStats.find((area) => area.id === selectedAreaId) ?? null,
    [data.areaStats, selectedAreaId],
  );

  const prioritizedAreas = useMemo(
    () =>
      [...data.areaStats]
        .sort((left, right) => {
          const issueDelta = reviewIntensity(right) - reviewIntensity(left);
          if (issueDelta !== 0) return issueDelta;
          return right.totalParcels - left.totalParcels;
        })
        .slice(0, 8),
    [data.areaStats],
  );

  const recommendations = useMemo(() => {
    const output: string[] = [];

    if (data.parcelsMissingGeometry > 0) {
      output.push(`${data.parcelsMissingGeometry.toLocaleString()} live records are missing geometry coverage.`);
    } else {
      output.push('No county parcels are currently missing geometry coverage in the live Benton feed.');
    }

    if (data.flaggedGeometryRecords > 0) {
      output.push(
        `${data.flaggedGeometryRecords.toLocaleString()} live records carry recalculation flags and should be reviewed before any parcel edit is closed.`,
      );
    }

    const worstArea = prioritizedAreas[0];
    if (worstArea) {
      output.push(
        `${worstArea.name} has the highest live review load with ${reviewIntensity(worstArea).toLocaleString()} records needing attention.`,
      );
    }

    return output;
  }, [data.flaggedGeometryRecords, data.parcelsMissingGeometry, prioritizedAreas]);

  return (
    <div data-testid="geometry-health" className="flex h-full bg-terra-midnight text-white">
      <main className="relative flex-1 overflow-hidden">
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

        <div className="absolute left-4 top-4 max-w-xl rounded border border-white/10 bg-terra-midnight/80 p-4 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-terra-cyan">Geometry Health</h1>
          <p className="mt-1 text-sm text-white/70">
            Live Benton County geometry coverage derived from Assessor Prop Val parcel geometry and recalculation flags.
          </p>
          <p className="mt-2 text-xs text-white/40">
            {loading
              ? 'Loading live neighborhood geometry coverage...'
              : error
                ? error
                : `${data.areaStats.length} live neighborhoods | ${data.source} | as of ${formatTimestamp(data.lastSyncTimestamp)}`}
          </p>
        </div>

        {data.areaStats.map((area) => {
          const xPct = ((area.center[1] + 119.9) / 0.9) * 100;
          const yPct = ((46.45 - area.center[0]) / 0.4) * 100;
          const color = healthColor(area);
          const isSelected = selectedAreaId === area.id;
          const size = 42 + Math.min(34, area.totalParcels / 85);
          const coverage = coveragePercent(area.parcelsWithGeometry, area.totalParcels);

          return (
            <button
              key={area.id}
              onClick={() => setSelectedAreaId(isSelected ? null : area.id)}
              className="absolute transition-all duration-300"
              style={{
                left: `${Math.max(8, Math.min(92, xPct))}%`,
                top: `${Math.max(8, Math.min(90, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${area.name}: ${coverage.toFixed(2)} percent geometry coverage`}
            >
              <div
                className="flex flex-col items-center justify-center rounded-lg transition-all"
                style={{
                  width: size,
                  height: size * 0.82,
                  backgroundColor: `${color}${isSelected ? '44' : '1F'}`,
                  border: `2px solid ${color}${isSelected ? 'DD' : '66'}`,
                  boxShadow: isSelected ? `0 0 20px ${color}44` : 'none',
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>
                  {coverage.toFixed(1)}%
                </span>
                <span className="max-w-full truncate px-1 text-[9px] text-white/70">
                  {area.neighborhoodCode}
                </span>
              </div>
            </button>
          );
        })}

        <div className="absolute bottom-4 left-4 rounded border border-white/10 bg-terra-midnight/80 p-3 backdrop-blur-sm">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Geometry Review Load</p>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Clean coverage
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Minor review load
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Active issues
            </span>
          </div>
        </div>
      </main>

      <aside className="w-80 flex-shrink-0 space-y-4 overflow-y-auto border-l border-white/10 p-4">
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-white/70">County Geometry Coverage</CardTitle>
              <span className="text-2xl font-bold" style={{ color: healthColor({
                totalParcels: data.totalParcels,
                parcelsWithGeometry: data.parcelsWithGeometry,
                parcelsMissingGeometry: data.parcelsMissingGeometry,
                flaggedGeometryRecords: data.flaggedGeometryRecords,
              }) }}>
                {overallCoverage.toFixed(2)}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, overallCoverage))}%`,
                  backgroundColor: healthColor({
                    totalParcels: data.totalParcels,
                    parcelsWithGeometry: data.parcelsWithGeometry,
                    parcelsMissingGeometry: data.parcelsMissingGeometry,
                    flaggedGeometryRecords: data.flaggedGeometryRecords,
                  }),
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-white/5 p-2">
                <p className="text-white/40">Total parcels</p>
                <p className="font-medium text-white">{data.totalParcels.toLocaleString()}</p>
              </div>
              <div className="rounded bg-white/5 p-2">
                <p className="text-white/40">With geometry</p>
                <p className="font-medium text-[#22C55E]">{data.parcelsWithGeometry.toLocaleString()}</p>
              </div>
              <div className="rounded bg-white/5 p-2">
                <p className="text-white/40">Missing geometry</p>
                <p className="font-medium text-[#EF4444]">{data.parcelsMissingGeometry.toLocaleString()}</p>
              </div>
              <div className="rounded bg-white/5 p-2">
                <p className="text-white/40">Flagged records</p>
                <p className="font-medium text-[#F59E0B]">{data.flaggedGeometryRecords.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Review Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {recommendations.map((recommendation) => (
                <li key={recommendation} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 text-terra-cyan">*</span>
                  <span className="text-white/70">{recommendation}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 border-t border-white/10 pt-3">
              {prioritizedAreas.map((area) => (
                <button
                  key={area.id}
                  role="link"
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    selectedAreaId === area.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-white/75">{area.name}</span>
                    <span className="text-xs font-bold" style={{ color: healthColor(area) }}>
                      {reviewIntensity(area).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/45">
                    <span>{coveragePercent(area.parcelsWithGeometry, area.totalParcels).toFixed(2)}% coverage</span>
                    <span>{area.totalParcels.toLocaleString()} parcels</span>
                  </div>
                </button>
              ))}
              {!loading && prioritizedAreas.length === 0 && (
                <div className="rounded border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/50">
                  No live geometry review areas matched the current county feed.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedArea && (
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-terra-cyan">{selectedArea.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Neighborhood code</dt>
                  <dd>{selectedArea.neighborhoodCode}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Coverage</dt>
                  <dd style={{ color: healthColor(selectedArea) }}>
                    {coveragePercent(selectedArea.parcelsWithGeometry, selectedArea.totalParcels).toFixed(2)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Total parcels</dt>
                  <dd>{selectedArea.totalParcels.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">With geometry</dt>
                  <dd className="text-[#22C55E]">{selectedArea.parcelsWithGeometry.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Missing geometry</dt>
                  <dd className="text-[#EF4444]">{selectedArea.parcelsMissingGeometry.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Flagged recalcs</dt>
                  <dd className="text-[#F59E0B]">{selectedArea.flaggedGeometryRecords.toLocaleString()}</dd>
                </div>
                <div className="rounded border border-white/10 bg-white/5 p-3 text-xs text-white/55">
                  Live Benton County geometry posture only. Atlas identifies the geometry issue, Workbench handles parcel repair, and Forge should not be used unless the issue becomes a valuation problem after GIS correction.
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}

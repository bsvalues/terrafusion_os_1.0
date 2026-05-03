import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { detectRatioCliffs } from '../utils/ratioCliffs';
import type { RatioCliff } from '../utils/ratioCliffs';

const SEVERITY_META: Record<RatioCliff['severity'], { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-950/20', label: 'CRITICAL' },
  major:    { color: 'text-amber-400', bg: 'bg-amber-950/15', label: 'MAJOR' },
  moderate: { color: 'text-yellow-500', bg: '', label: 'MODERATE' },
};

function DeltaBar({ delta }: { delta: number }) {
  const pct = Math.min(100, (delta / 0.30) * 100);
  const color = delta >= 0.20 ? '#f87171' : delta >= 0.12 ? '#fbbf24' : '#eab308';
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function CliffRow({ cliff }: { cliff: RatioCliff }) {
  const meta = SEVERITY_META[cliff.severity];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-b border-slate-800/50 ${meta.bg} cursor-pointer`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <span className={`text-[9px] font-bold shrink-0 mt-0.5 w-16 ${meta.color}`}>
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-300 truncate">
              {cliff.codeA} vs {cliff.codeB}
            </span>
            <span className={`text-[10px] font-mono font-semibold shrink-0 ${meta.color}`}>
              Δ{cliff.delta.toFixed(3)}
            </span>
          </div>
          <DeltaBar delta={cliff.delta} />
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[8px] text-slate-500">{cliff.distanceMi.toFixed(1)} mi apart</span>
            <span className="text-[8px] text-slate-500">
              {cliff.ratioA.toFixed(3)} ↔ {cliff.ratioB.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-2 grid grid-cols-2 gap-2 border-t border-slate-800/40">
          {([
            [cliff.codeA, cliff.nameA, cliff.ratioA, cliff.codA],
            [cliff.codeB, cliff.nameB, cliff.ratioB, cliff.codB],
          ] as [string, string, number, number][]).map(([code, name, ratio, cod]) => (
            <div key={code} className="mt-1.5 bg-slate-900/40 rounded p-1.5">
              <div className="text-[9px] font-semibold text-slate-300">{code}</div>
              <div className="text-[8px] text-slate-500 truncate">{name}</div>
              <div className="flex gap-2 mt-0.5">
                <span className={`text-[9px] font-mono ${Math.abs(ratio - 1) > 0.10 ? 'text-red-400' : 'text-slate-300'}`}>
                  MED {ratio.toFixed(3)}
                </span>
                <span className={`text-[9px] font-mono ${cod > 20 ? 'text-amber-400' : 'text-slate-500'}`}>
                  COD {cod.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
          <div className="col-span-2 text-[9px] text-amber-400/70 mt-0.5">
            → Review boundary-straddling sales; consider neighborhood reassignment or split.
          </div>
        </div>
      )}
    </div>
  );
}

const PROXIMITY_OPTIONS = [2, 5, 10] as const;
const FILTER_OPTIONS = ['all', 'critical', 'major'] as const;
type FilterMode = (typeof FILTER_OPTIONS)[number];

export function RatioCliffPanel() {
  const { neighborhoodStats, filter } = useGeoForgeStore();
  const [proximityMi, setProximityMi] = useState<2 | 5 | 10>(5);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const cliffs = useMemo(
    () => detectRatioCliffs(neighborhoodStats, proximityMi),
    [neighborhoodStats, proximityMi],
  );

  const visible = useMemo(() => {
    if (filterMode === 'critical') return cliffs.filter((c) => c.severity === 'critical');
    if (filterMode === 'major') return cliffs.filter((c) => c.severity === 'critical' || c.severity === 'major');
    return cliffs;
  }, [cliffs, filterMode]);

  const critCount = cliffs.filter((c) => c.severity === 'critical').length;
  const majCount = cliffs.filter((c) => c.severity === 'major').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header summary */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-1.5">
          {critCount > 0 && (
            <span className="text-[10px] text-red-400 font-semibold">{critCount} critical cliff{critCount !== 1 ? 's' : ''}</span>
          )}
          {majCount > 0 && (
            <span className="text-[10px] text-amber-400">{majCount} major</span>
          )}
          {critCount === 0 && majCount === 0 && (
            <span className="text-[10px] text-emerald-400">No severe boundary discontinuities detected</span>
          )}
          <span className="ml-auto text-[8px] text-slate-600">{filter.taxYear}</span>
        </div>

        {critCount > 0 && (
          <div className="text-[9px] text-red-400/80 bg-red-950/20 rounded px-2 py-1 mb-1.5">
            Boundary discontinuities ≥ 0.20 ratio units indicate systematic neighborhood misalignment. Review at DOR certification.
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[8px] text-slate-600 uppercase tracking-wider">Proximity:</span>
          {PROXIMITY_OPTIONS.map((mi) => (
            <button
              key={mi}
              onClick={() => setProximityMi(mi)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                proximityMi === mi
                  ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {mi} mi
            </button>
          ))}
          <span className="text-[8px] text-slate-600 uppercase tracking-wider ml-2">Show:</span>
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilterMode(f)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors capitalize ${
                filterMode === f
                  ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cliff list */}
      <div className="flex-1 overflow-y-auto">
        {neighborhoodStats.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">
            Load neighborhood stats to detect ratio cliffs.
          </div>
        ) : visible.length === 0 ? (
          <div className="p-4 text-slate-500 text-xs text-center">
            No cliffs matching the current filter within {proximityMi} mi.
          </div>
        ) : (
          visible.map((cliff, i) => (
            <CliffRow key={`${cliff.codeA}-${cliff.codeB}-${i}`} cliff={cliff} />
          ))
        )}
        {visible.length > 0 && (
          <p className="px-3 py-2 text-[8px] text-slate-700">
            Click any row to expand neighborhood detail. Cliffs are pairs within {proximityMi} mi with Δratio ≥ 0.05.
          </p>
        )}
      </div>
    </div>
  );
}

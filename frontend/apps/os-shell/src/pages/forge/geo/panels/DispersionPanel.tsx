import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { SalePoint } from '../types/geoforge.types';

interface DispersionStats {
  neighborhoodCode: string;
  neighborhoodName: string;
  n: number;
  median: number;
  mean: number;
  cod: number;    // Coefficient of Dispersion = AAD/median × 100
  cv: number;     // Coefficient of Variation = SD/mean × 100
  sd: number;     // Standard deviation
  mad: number;    // Median absolute deviation
  aad: number;    // Average absolute deviation from median
  uniformityScore: number; // 0-100, higher = more uniform
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeDispersion(
  sales: SalePoint[],
  nbhdStats: { neighborhoodCode: string; neighborhoodName: string }[],
): DispersionStats[] {
  const byCode = new Map<string, number[]>();
  for (const s of sales) {
    if (s.isOutlier || s.ratio == null) continue;
    const list = byCode.get(s.neighborhoodCode) ?? [];
    list.push(s.ratio);
    byCode.set(s.neighborhoodCode, list);
  }

  return nbhdStats
    .map((ns) => {
      const ratios = byCode.get(ns.neighborhoodCode) ?? [];
      if (ratios.length < 5) return null;

      const med = median(ratios);
      const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
      const aad = ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length;
      const mad = median(ratios.map((r) => Math.abs(r - med)));
      const variance = ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length;
      const sd = Math.sqrt(variance);
      const cod = med > 0 ? (aad / med) * 100 : 0;
      const cv = mean > 0 ? (sd / mean) * 100 : 0;

      // Uniformity score: 100 = perfect, penalize for each metric exceeding standard
      const codPenalty = Math.max(0, cod - 10) * 2;     // IAAO ideal COD < 10 for residential
      const cvPenalty  = Math.max(0, cv - 15) * 1.5;
      const sdPenalty  = Math.max(0, sd - 0.10) * 200;
      const uniformityScore = Math.max(0, Math.round(100 - codPenalty - cvPenalty - sdPenalty));

      return {
        neighborhoodCode: ns.neighborhoodCode,
        neighborhoodName: ns.neighborhoodName,
        n: ratios.length,
        median: med,
        mean,
        cod, cv, sd, mad, aad,
        uniformityScore,
      };
    })
    .filter((x): x is DispersionStats => x !== null)
    .sort((a, b) => a.uniformityScore - b.uniformityScore); // worst first
}

type SortKey = 'score' | 'cod' | 'cv' | 'sd';

const METRIC_INFO: { key: SortKey; label: string; unit: string; threshold: number; desc: string }[] = [
  { key: 'cod', label: 'COD', unit: '%',   threshold: 20, desc: 'Avg absolute deviation / median × 100. IAAO standard ≤ 20 residential.' },
  { key: 'cv',  label: 'CV',  unit: '%',   threshold: 25, desc: 'SD / mean × 100. Measures relative spread. High CV with OK COD signals outliers.' },
  { key: 'sd',  label: 'SD',  unit: '',    threshold: 0.15, desc: 'Standard deviation of ratios. Reflects absolute spread regardless of level.' },
  { key: 'score', label: 'Score', unit: '/100', threshold: 60, desc: 'Composite uniformity score: 100 = perfectly uniform.' },
];

function MiniGauge({ value, max, threshold, unit }: { value: number; max: number; threshold: number; unit: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const over = value > threshold;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : '#4ade80' }}
        />
      </div>
      <span className={`text-[9px] font-mono w-12 text-right ${over ? 'text-red-400' : 'text-slate-400'}`}>
        {value.toFixed(unit === '%' ? 1 : unit === '/100' ? 0 : 3)}{unit}
      </span>
    </div>
  );
}

export function DispersionPanel() {
  const { salePoints, neighborhoodStats, filter } = useGeoForgeStore();
  const [sort, setSort] = useState<SortKey>('score');
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(
    () => computeDispersion(salePoints, neighborhoodStats),
    [salePoints, neighborhoodStats],
  );

  const sorted = useMemo(() => {
    if (sort === 'score') return [...stats]; // already sorted ascending
    return [...stats].sort((a, b) => b[sort] - a[sort]);
  }, [stats, sort]);

  const maxCod = Math.max(...stats.map((s) => s.cod), 0.01);
  const maxCv  = Math.max(...stats.map((s) => s.cv), 0.01);
  const maxSd  = Math.max(...stats.map((s) => s.sd), 0.01);

  // County composite
  const cwStats = useMemo(() => {
    const qualified = salePoints.filter((s) => !s.isOutlier && s.ratio != null);
    if (qualified.length < 5) return null;
    const ratios = qualified.map((s) => s.ratio);
    const med = median(ratios);
    const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    const aad = ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length;
    const mad = median(ratios.map((r) => Math.abs(r - med)));
    const sd = Math.sqrt(ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length);
    const cod = med > 0 ? (aad / med) * 100 : 0;
    const cv = mean > 0 ? (sd / mean) * 100 : 0;
    return { n: ratios.length, median: med, mean, aad, mad, sd, cod, cv };
  }, [salePoints]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* County-wide summary */}
      {cwStats && (
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
          <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1.5">County-Wide Dispersion · {filter.taxYear}</div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'COD', value: cwStats.cod.toFixed(1), unit: '%', ok: cwStats.cod <= 20 },
              { label: 'CV',  value: cwStats.cv.toFixed(1),  unit: '%', ok: cwStats.cv <= 25 },
              { label: 'SD',  value: cwStats.sd.toFixed(3),  unit: '',  ok: cwStats.sd <= 0.15 },
              { label: 'AAD', value: cwStats.aad.toFixed(3), unit: '',  ok: true },
              { label: 'MAD', value: cwStats.mad.toFixed(3), unit: '',  ok: true },
            ].map(({ label, value, unit, ok }) => (
              <div key={label} className="bg-slate-900/60 rounded p-1.5 border border-slate-700/40">
                <div className="text-[8px] text-slate-600">{label}</div>
                <div className={`text-[11px] font-bold font-mono ${ok ? 'text-slate-200' : 'text-red-400'}`}>
                  {value}{unit}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-slate-600 mt-1">
            n={cwStats.n} qualified sales. MAD = median absolute deviation (robust to outliers).
          </p>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-slate-800/50 flex items-center gap-1.5">
        <span className="text-[8px] text-slate-600">Sort by worst:</span>
        {METRIC_INFO.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
              sort === key
                ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Neighborhood list */}
      <div className="flex-1 overflow-y-auto">
        {salePoints.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">Load sales data to compute dispersion statistics.</div>
        ) : sorted.length === 0 ? (
          <div className="p-4 text-slate-500 text-xs text-center">No neighborhoods with ≥ 5 qualified sales.</div>
        ) : (
          sorted.map((s) => {
            const exp = expanded === s.neighborhoodCode;
            const scoreColor = s.uniformityScore >= 80 ? 'text-emerald-400' : s.uniformityScore >= 60 ? 'text-amber-400' : 'text-red-400';
            return (
              <div
                key={s.neighborhoodCode}
                className="border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/15"
                onClick={() => setExpanded(exp ? null : s.neighborhoodCode)}
              >
                <div className="px-3 py-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[9px] text-slate-300">{s.neighborhoodCode}</span>
                      <span className="text-[8px] text-slate-600 ml-1.5 truncate">{s.neighborhoodName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[8px] text-slate-600">{s.n} sales</span>
                      <span className={`text-[10px] font-bold ${scoreColor}`}>{s.uniformityScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                    <div>
                      <div className="text-[7px] text-slate-700 mb-0.5">COD (≤20)</div>
                      <MiniGauge value={s.cod} max={maxCod} threshold={20} unit="%" />
                    </div>
                    <div>
                      <div className="text-[7px] text-slate-700 mb-0.5">CV (≤25)</div>
                      <MiniGauge value={s.cv} max={maxCv} threshold={25} unit="%" />
                    </div>
                    <div>
                      <div className="text-[7px] text-slate-700 mb-0.5">SD (≤0.15)</div>
                      <MiniGauge value={s.sd} max={maxSd} threshold={0.15} unit="" />
                    </div>
                  </div>
                </div>

                {exp && (
                  <div className="px-3 pb-2 pt-1 bg-slate-900/30 border-t border-slate-800/40">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        ['Median ratio', s.median.toFixed(4)],
                        ['Mean ratio', s.mean.toFixed(4)],
                        ['COD', `${s.cod.toFixed(2)}%`],
                        ['CV', `${s.cv.toFixed(2)}%`],
                        ['Std Dev (SD)', s.sd.toFixed(4)],
                        ['Avg Abs Dev (AAD)', s.aad.toFixed(4)],
                        ['Median Abs Dev (MAD)', s.mad.toFixed(4)],
                        ['Uniformity score', `${s.uniformityScore}/100`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-600">{label}</span>
                          <span className="text-[9px] font-mono text-slate-300">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 text-[8px] text-slate-500">
                      {s.cv > s.cod * 1.5
                        ? 'CV >> COD: ratio outliers inflating spread beyond what COD reveals. Review extreme ratios.'
                        : s.cod > 20
                        ? 'COD > 20: non-uniform assessment. Apply targeted adjustments or split neighborhood.'
                        : 'Uniformity within IAAO standards.'}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <p className="px-3 py-2 text-[8px] text-slate-700">
          COD = AAD/median × 100 (IAAO primary). CV = SD/mean × 100. MAD is robust to outliers.
          IAAO residential standard: COD ≤ 20. Click row to expand all metrics.
        </p>
      </div>
    </div>
  );
}

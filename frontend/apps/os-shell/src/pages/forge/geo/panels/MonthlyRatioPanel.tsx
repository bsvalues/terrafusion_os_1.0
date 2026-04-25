import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { SalePoint } from '../types/geoforge.types';

interface MonthBucket {
  ym: string;       // "2024-03"
  label: string;    // "Mar '24"
  ratios: number[];
  median: number;
  n: number;
  q1: number;
  q3: number;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function quantile(arr: number[], q: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

function buildBuckets(sales: SalePoint[], nbhd: string | null): MonthBucket[] {
  const qualified = sales.filter(
    (s) => !s.isOutlier && s.ratio != null && s.saleDate &&
      (nbhd === null || s.neighborhoodCode === nbhd),
  );

  const byYm = new Map<string, number[]>();
  for (const s of qualified) {
    const ym = s.saleDate.slice(0, 7);
    const list = byYm.get(ym) ?? [];
    list.push(s.ratio);
    byYm.set(ym, list);
  }

  return Array.from(byYm.entries())
    .filter(([, ratios]) => ratios.length >= 3)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, ratios]) => {
      const [yr, mo] = ym.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return {
        ym,
        label: `${monthNames[parseInt(mo) - 1]} '${yr.slice(2)}`,
        ratios,
        median: median(ratios),
        n: ratios.length,
        q1: quantile(ratios, 0.25),
        q3: quantile(ratios, 0.75),
      };
    });
}

// ─── SVG chart ────────────────────────────────────────────────────────────────

function RatioTimelineChart({ buckets }: { buckets: MonthBucket[] }) {
  if (buckets.length < 2) return null;

  const W = 440, H = 160;
  const PAD = { l: 36, r: 12, t: 12, b: 28 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const medians = buckets.map((b) => b.median);
  const allVals = buckets.flatMap((b) => [b.q1, b.q3, 0.85, 1.15]);
  const yMin = Math.max(0.80, Math.min(...allVals));
  const yMax = Math.min(1.20, Math.max(...allVals));
  const yRange = yMax - yMin || 0.01;
  const n = buckets.length;

  const px = (i: number) => PAD.l + (i / (n - 1)) * iW;
  const py = (v: number) => PAD.t + ((yMax - v) / yRange) * iH;

  // OLS trend line on medians (x = index)
  const meanX = (n - 1) / 2;
  const meanY = medians.reduce((s, v) => s + v, 0) / n;
  let ssXX = 0, ssXY = 0;
  medians.forEach((y, i) => { ssXX += (i - meanX) ** 2; ssXY += (i - meanX) * (y - meanY); });
  const slope = ssXX > 0 ? ssXY / ssXX : 0; // ratio units per step

  const trendY1 = py(meanY + slope * (0 - meanX));
  const trendY2 = py(meanY + slope * (n - 1 - meanX));

  // Grid lines
  const gridRatios = [0.90, 1.00, 1.10].filter((v) => v >= yMin - 0.01 && v <= yMax + 0.01);

  const medianPolyline = buckets
    .map((b, i) => `${px(i)},${py(b.median)}`).join(' ');

  // IQR area as SVG polygon
  const iqrTop = buckets.map((b, i) => `${px(i)},${py(b.q3)}`).join(' ');
  const iqrBot = [...buckets].reverse().map((b, i) => `${px(n - 1 - i)},${py(b.q1)}`).join(' ');
  const iqrPoly = `${iqrTop} ${iqrBot}`;

  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* IAAO band */}
        <rect
          x={PAD.l} y={py(1.10)}
          width={iW} height={py(0.90) - py(1.10)}
          fill="#22c55e" opacity={0.06}
        />
        {/* Grid lines */}
        {gridRatios.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l} y1={py(v)} x2={PAD.l + iW} y2={py(v)}
              stroke={v === 1.0 ? '#4b5563' : '#1f2937'} strokeWidth={v === 1.0 ? 0.75 : 0.5}
              strokeDasharray={v !== 1.0 ? '4 3' : undefined}
            />
            <text x={PAD.l - 3} y={py(v) + 2.5} textAnchor="end" fontSize={7} fill="#6b7280">
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {/* IQR band */}
        <polygon points={iqrPoly} fill="#60a5fa" opacity={0.12} />
        {/* Trend line */}
        <line
          x1={px(0)} y1={trendY1} x2={px(n - 1)} y2={trendY2}
          stroke="#fbbf24" strokeWidth={1} strokeDasharray="5 3" opacity={0.7}
        />
        {/* Median line */}
        <polyline
          points={medianPolyline}
          fill="none" stroke="#60a5fa" strokeWidth={1.5}
        />
        {/* Points + hover targets */}
        {buckets.map((b, i) => (
          <g key={b.ym}>
            <circle
              cx={px(i)} cy={py(b.median)} r={3}
              fill={b.median >= 0.90 && b.median <= 1.10 ? '#4ade80' : '#f87171'}
              stroke="#0f172a" strokeWidth={0.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <g>
                <rect
                  x={Math.min(px(i) + 4, W - 90)} y={py(b.median) - 36}
                  width={84} height={32} rx={3}
                  fill="#0f172a" stroke="#334155"
                />
                <text x={Math.min(px(i) + 7, W - 87)} y={py(b.median) - 24} fontSize={8} fill="#e2e8f0">
                  {b.label} · n={b.n}
                </text>
                <text x={Math.min(px(i) + 7, W - 87)} y={py(b.median) - 14} fontSize={8} fill="#94a3b8">
                  med {b.median.toFixed(3)} IQR [{b.q1.toFixed(3)}–{b.q3.toFixed(3)}]
                </text>
              </g>
            )}
          </g>
        ))}
        {/* X axis */}
        <line x1={PAD.l} y1={PAD.t + iH} x2={PAD.l + iW} y2={PAD.t + iH} stroke="#374151" strokeWidth={0.5} />
        {/* X ticks — show every other month if many */}
        {buckets.map((b, i) => {
          const step = buckets.length > 12 ? 2 : 1;
          if (i % step !== 0) return null;
          return (
            <text key={b.ym} x={px(i)} y={H - 4} textAnchor="middle" fontSize={7} fill="#6b7280">
              {b.label}
            </text>
          );
        })}
        {/* Y label */}
        <text x={10} y={PAD.t + iH / 2} textAnchor="middle" fontSize={7} fill="#6b7280"
          transform={`rotate(-90, 10, ${PAD.t + iH / 2})`}>MED ratio</text>
      </svg>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function MonthlyRatioPanel() {
  const { salePoints, neighborhoodStats, selectedNeighborhoodCode, filter } = useGeoForgeStore();
  const [scope, setScope] = useState<'county' | 'neighborhood'>('county');

  const effectiveNbhd = scope === 'neighborhood' ? selectedNeighborhoodCode : null;

  const buckets = useMemo(
    () => buildBuckets(salePoints, effectiveNbhd),
    [salePoints, effectiveNbhd],
  );

  // OLS slope in %/month
  const trendInfo = useMemo(() => {
    if (buckets.length < 3) return null;
    const medians = buckets.map((b) => b.median);
    const n = medians.length;
    const meanX = (n - 1) / 2;
    const meanY = medians.reduce((s, v) => s + v, 0) / n;
    let ssXX = 0, ssXY = 0, ssYY = 0;
    medians.forEach((y, i) => {
      ssXX += (i - meanX) ** 2;
      ssXY += (i - meanX) * (y - meanY);
      ssYY += (y - meanY) ** 2;
    });
    const slope = ssXX > 0 ? ssXY / ssXX : 0;
    const r2 = (ssXX > 0 && ssYY > 0) ? ssXY ** 2 / (ssXX * ssYY) : 0;
    const pctPerMonth = slope * 100;
    return { slope, pctPerMonth, r2 };
  }, [buckets]);

  const nbhdName = useMemo(() => {
    if (!selectedNeighborhoodCode) return null;
    return neighborhoodStats.find((ns) => ns.neighborhoodCode === selectedNeighborhoodCode)?.neighborhoodName ?? selectedNeighborhoodCode;
  }, [selectedNeighborhoodCode, neighborhoodStats]);

  const trendDir = trendInfo
    ? trendInfo.pctPerMonth < -0.1 ? 'falling' : trendInfo.pctPerMonth > 0.1 ? 'rising' : 'flat'
    : 'flat';

  const trendColor =
    trendDir === 'falling' ? 'text-amber-400' :
    trendDir === 'rising'  ? 'text-sky-400' : 'text-slate-400';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 border border-slate-700 rounded overflow-hidden text-[9px]">
            <button
              onClick={() => setScope('county')}
              className={`px-2 py-0.5 transition-colors ${scope === 'county' ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-slate-300'}`}
            >
              County
            </button>
            <button
              onClick={() => setScope('neighborhood')}
              disabled={!selectedNeighborhoodCode}
              className={`px-2 py-0.5 transition-colors ${scope === 'neighborhood' ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-slate-300 disabled:opacity-40'}`}
            >
              {nbhdName ?? 'Neighborhood'}
            </button>
          </div>
          <span className="ml-auto text-[8px] text-slate-600">{filter.taxYear}</span>
        </div>

        {trendInfo && (
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">Monthly trend</div>
              <div className={`text-[12px] font-bold font-mono ${trendColor}`}>
                {trendInfo.pctPerMonth > 0 ? '+' : ''}{trendInfo.pctPerMonth.toFixed(3)}%/mo
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">R²</div>
              <div className="text-[12px] font-bold font-mono text-slate-400">{trendInfo.r2.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">Months</div>
              <div className="text-[12px] font-bold font-mono text-slate-400">{buckets.length}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[8px] text-slate-600">Time adj. needed?</div>
              <div className={`text-[10px] font-semibold ${Math.abs(trendInfo.pctPerMonth) > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.abs(trendInfo.pctPerMonth) > 0.5 ? 'Yes — strong trend'
                  : Math.abs(trendInfo.pctPerMonth) > 0.3 ? 'Likely — moderate trend'
                  : 'Minimal trend'}
              </div>
            </div>
          </div>
        )}

        {trendDir === 'falling' && (
          <div className="mt-1.5 text-[9px] text-amber-400/80 bg-amber-950/15 rounded px-2 py-1">
            Ratio declining over study period — market appreciation outpacing assessments. Apply upward time adjustment to older sales.
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-shrink-0 px-3 py-3">
        {salePoints.length === 0 ? (
          <div className="text-slate-600 text-xs text-center py-8">Load sales to plot monthly ratio trend.</div>
        ) : buckets.length < 2 ? (
          <div className="text-slate-600 text-xs text-center py-8">
            {scope === 'neighborhood' && !selectedNeighborhoodCode
              ? 'Select a neighborhood first.'
              : 'Need ≥ 2 months with ≥ 3 sales each.'}
          </div>
        ) : (
          <RatioTimelineChart buckets={buckets} />
        )}
      </div>

      {/* Monthly table */}
      {buckets.length > 0 && (
        <div className="flex-1 overflow-y-auto border-t border-slate-800/50">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] px-3 py-1 text-[8px] text-slate-600 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
            <span className="w-16">Month</span>
            <span>MED</span>
            <span className="w-12 text-right">IQR</span>
            <span className="w-10 text-right">Sales</span>
            <span className="w-14 text-right">IAAO</span>
          </div>
          {[...buckets].reverse().map((b) => {
            const pass = b.median >= 0.90 && b.median <= 1.10;
            return (
              <div key={b.ym} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-3 py-1 border-b border-slate-800/30 hover:bg-slate-800/20">
                <span className="text-[9px] text-slate-500 w-16">{b.label}</span>
                <div className="relative h-1 bg-slate-800 rounded mx-2">
                  <div
                    className="absolute h-full rounded"
                    style={{
                      left: '50%',
                      width: `${Math.min(100, Math.abs(b.median - 1.0) * 800)}%`,
                      transform: b.median < 1 ? 'translateX(-100%)' : 'translateX(0)',
                      backgroundColor: pass ? '#4ade80' : '#f87171',
                    }}
                  />
                </div>
                <span className={`text-[9px] font-mono w-12 text-right ${pass ? 'text-slate-300' : 'text-amber-400'}`}>
                  {b.median.toFixed(3)}
                </span>
                <span className="text-[8px] text-slate-600 w-10 text-right">{b.n}</span>
                <span className={`text-[8px] w-14 text-right ${pass ? 'text-emerald-500' : 'text-red-400'}`}>
                  {pass ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
            );
          })}
          <p className="px-3 py-2 text-[8px] text-slate-700">
            Blue band = IQR. Yellow dashed = OLS trend. Green/red dot = IAAO pass/fail. Min 3 sales per month.
          </p>
        </div>
      )}
    </div>
  );
}

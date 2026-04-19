import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoranScatter, QUAD_META } from '../utils/moranScatter';
import { computeMoransI } from '../utils/spatialStats';
import type { MoranPoint, LisaQuadrant } from '../utils/moranScatter';

// ─── Moran Scatterplot (pure SVG) ─────────────────────────────────────────────

function MoranScatterplot({ points }: { points: MoranPoint[] }) {
  const W = 296, H = 200;
  const PAD = { l: 36, r: 12, t: 12, b: 28 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const zs = points.map((p) => p.z);
  const lags = points.map((p) => p.lag);
  const zMax = Math.max(...zs.map(Math.abs), 0.01);
  const lagMax = Math.max(...lags.map(Math.abs), 0.01);

  const px = (z: number) => PAD.l + ((z + zMax) / (2 * zMax)) * iW;
  const py = (lag: number) => PAD.t + ((lagMax - lag) / (2 * lagMax)) * iH;

  const midX = px(0), midY = py(0);

  // OLS regression line through origin (Moran's I = slope)
  const sumZZ = points.reduce((s, p) => s + p.z * p.z, 0);
  const sumZLag = points.reduce((s, p) => s + p.z * p.lag, 0);
  const slope = sumZZ > 0 ? sumZLag / sumZZ : 0;
  const lineY1 = py(slope * -zMax);
  const lineY2 = py(slope * zMax);

  const xTick = (label: string, z: number) => (
    <text key={label} x={px(z)} y={H - 4} textAnchor="middle" fontSize={7} fill="#6b7280">{label}</text>
  );
  const yTick = (label: string, lag: number) => (
    <text key={label} x={PAD.l - 3} y={py(lag) + 2.5} textAnchor="end" fontSize={7} fill="#6b7280">{label}</text>
  );

  const [tooltip, setTooltip] = useState<{ x: number; y: number; p: MoranPoint } | null>(null);

  return (
    <div className="relative">
      <svg width={W} height={H} className="overflow-visible">
        {/* Quadrant fills */}
        <rect x={midX} y={PAD.t}   width={iW - (midX - PAD.l)} height={midY - PAD.t}   fill="#dc2626" opacity={0.04} />
        <rect x={PAD.l} y={midY}   width={midX - PAD.l}         height={PAD.t + iH - midY} fill="#1d4ed8" opacity={0.04} />
        <rect x={midX} y={midY}    width={iW - (midX - PAD.l)} height={PAD.t + iH - midY} fill="#f97316" opacity={0.04} />
        <rect x={PAD.l} y={PAD.t}  width={midX - PAD.l}         height={midY - PAD.t}   fill="#60a5fa" opacity={0.04} />
        {/* Axes */}
        <line x1={PAD.l} y1={midY} x2={PAD.l + iW} y2={midY} stroke="#374151" strokeWidth={0.75} />
        <line x1={midX} y1={PAD.t} x2={midX} y2={PAD.t + iH} stroke="#374151" strokeWidth={0.75} />
        {/* Regression line (slope = global Moran's I) */}
        <line x1={px(-zMax)} y1={lineY1} x2={px(zMax)} y2={lineY2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" />
        {/* Axis labels */}
        <text x={PAD.l + iW / 2} y={H - 1} textAnchor="middle" fontSize={7} fill="#6b7280">Standardized ratio (z)</text>
        <text x={8} y={PAD.t + iH / 2} textAnchor="middle" fontSize={7} fill="#6b7280"
          transform={`rotate(-90, 8, ${PAD.t + iH / 2})`}>Spatial lag (Wz)</text>
        {/* Ticks */}
        {xTick('-', -zMax * 0.7)}
        {xTick('0', 0)}
        {xTick('+', zMax * 0.7)}
        {yTick('+', lagMax * 0.7)}
        {yTick('0', 0)}
        {yTick('-', -lagMax * 0.7)}
        {/* Quadrant labels */}
        <text x={PAD.l + iW - 2} y={PAD.t + 10} textAnchor="end" fontSize={7} fill="#dc2626" opacity={0.6}>HH</text>
        <text x={PAD.l + 2}      y={PAD.t + 10} textAnchor="start" fontSize={7} fill="#60a5fa" opacity={0.6}>LH</text>
        <text x={PAD.l + iW - 2} y={PAD.t + iH - 4} textAnchor="end" fontSize={7} fill="#f97316" opacity={0.6}>HL</text>
        <text x={PAD.l + 2}      y={PAD.t + iH - 4} textAnchor="start" fontSize={7} fill="#1d4ed8" opacity={0.6}>LL</text>
        {/* Points */}
        {points.map((p) => (
          <circle
            key={p.neighborhoodCode}
            cx={px(p.z)}
            cy={py(p.lag)}
            r={p.significant ? 3.5 : 2.5}
            fill={p.color}
            opacity={p.significant ? 0.9 : 0.4}
            stroke={p.significant ? '#0f172a' : 'none'}
            strokeWidth={0.5}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => setTooltip({ x: px(p.z), y: py(p.lag), p })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="absolute z-10 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-[9px] pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 8, top: tooltip.y - 40, maxWidth: 160 }}
        >
          <div className="font-semibold text-slate-200">{tooltip.p.neighborhoodCode}</div>
          <div className="text-slate-400 truncate">{tooltip.p.neighborhoodName}</div>
          <div className="text-slate-500 mt-0.5">
            ratio {tooltip.p.ratio.toFixed(3)} · z {tooltip.p.z.toFixed(3)} · lag {tooltip.p.lag.toFixed(3)}
          </div>
          <div className="mt-0.5" style={{ color: tooltip.p.color }}>
            {QUAD_META.find((m) => m.q === tooltip.p.quadrant)?.label}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Spatial outlier row ───────────────────────────────────────────────────────

function OutlierRow({ p }: { p: MoranPoint }) {
  const meta = QUAD_META.find((m) => m.q === p.quadrant)!;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/50 hover:bg-slate-800/20">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-slate-300 truncate">{p.neighborhoodCode} · {p.neighborhoodName}</div>
        <div className="text-[8px] text-slate-500">{meta.sub}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[9px] font-mono" style={{ color: meta.color }}>{p.ratio.toFixed(3)}</div>
        <div className="text-[8px] text-slate-600">Ii {p.Ii.toFixed(3)}</div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const FOCUS_QUADRANTS: LisaQuadrant[] = ['HL', 'LH', 'HH', 'LL'];

export function MoranPanel() {
  const { neighborhoodStats, filter, loadingStats } = useGeoForgeStore();
  const [maxDist, setMaxDist] = useState<5 | 8 | 12>(5);
  const [focusQ, setFocusQ] = useState<LisaQuadrant | 'all'>('all');

  const points = useMemo(
    () => computeMoranScatter(neighborhoodStats, maxDist),
    [neighborhoodStats, maxDist],
  );

  const globalI = useMemo(() => computeMoransI(neighborhoodStats, maxDist), [neighborhoodStats, maxDist]);

  const quadCounts = useMemo(() => {
    const counts: Record<LisaQuadrant, number> = { HH: 0, LL: 0, HL: 0, LH: 0, ns: 0 };
    for (const p of points) counts[p.quadrant]++;
    return counts;
  }, [points]);

  const outliers = useMemo(() => {
    const base = focusQ === 'all'
      ? points.filter((p) => p.significant)
      : points.filter((p) => p.quadrant === focusQ);
    return [...base].sort((a, b) => Math.abs(b.Ii) - Math.abs(a.Ii));
  }, [points, focusQ]);

  if (neighborhoodStats.length === 0) {
    return (
      <div className="p-4 text-slate-600 text-xs text-center flex items-center justify-center gap-2">
        {loadingStats ? <><span className="animate-spin inline-block text-terra-cyan">⟳</span> Loading…</> : 'Load neighborhood stats to compute spatial decomposition.'}
      </div>
    );
  }

  if (points.length < 5) {
    return <div className="p-4 text-slate-600 text-xs text-center">Need ≥ 5 neighborhoods with ≥ 3 sales and valid centroids.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Global Moran's I header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[8px] text-slate-600 uppercase tracking-wider">Global Moran's I</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono" style={{ color: globalI?.color ?? '#94a3b8' }}>
                {globalI ? globalI.I.toFixed(4) : '—'}
              </span>
              <span className="text-[10px] text-slate-500">{globalI?.label}</span>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <div className="text-[8px] text-slate-600 uppercase tracking-wider">Neighbor radius</div>
            <div className="flex gap-1 mt-0.5">
              {([5, 8, 12] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setMaxDist(d)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                    maxDist === d
                      ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {d} mi
                </button>
              ))}
            </div>
          </div>
        </div>

        {globalI?.warning && (
          <div className="mt-1.5 text-[9px] text-red-400 bg-red-950/20 rounded px-2 py-1">
            I &gt; 0.45 — significant geographic assessment bias detected. DOR review required.
          </div>
        )}

        {/* Quadrant counts */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {QUAD_META.map(({ q, color, label }) => (
            <button
              key={q}
              onClick={() => setFocusQ(focusQ === q ? 'all' : q)}
              className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                focusQ === q
                  ? 'border-slate-400 text-slate-200'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {label} <span className="font-mono">{quadCounts[q]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scatterplot */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <MoranScatterplot points={points} />
        <p className="text-[8px] text-slate-700 mt-1">
          Dashed line = OLS (slope = Moran's I). Larger filled dots = significant (|z| &gt; 1). Hover for detail.
        </p>
      </div>

      {/* Spatial outlier list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[9px] text-slate-600 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
          {focusQ === 'all' ? 'All significant' : QUAD_META.find((m) => m.q === focusQ)?.label} · {outliers.length} neighborhood{outliers.length !== 1 ? 's' : ''}
        </div>
        {outliers.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">No significant spatial patterns in this quadrant.</div>
        ) : (
          outliers.map((p) => <OutlierRow key={p.neighborhoodCode} p={p} />)
        )}
        <p className="px-3 py-2 text-[8px] text-slate-700">
          {filter.taxYear} · Significance threshold |z| &gt; 1.0. HL/LH = spatial outliers warranting boundary review.
        </p>
      </div>
    </div>
  );
}

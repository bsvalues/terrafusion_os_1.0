import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Line,
  ComposedChart,
} from 'recharts';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { EquitySignatureRadar } from './EquitySignatureRadar';
import { codBand, prdBand, prbBand } from '../utils/bentonMethodCalcs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function olsLine(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 4) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  const slope = den > 0 ? num / den : 0;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

function RegressivityScatter({ neighborhoodCode }: { neighborhoodCode: string }) {
  const { salePoints } = useGeoForgeStore();

  const { qualified, outliers, ols } = useMemo(() => {
    const hood = salePoints.filter(s => s.neighborhoodCode === neighborhoodCode && s.ratio > 0 && s.salePrice > 0);
    const q = hood.filter(s => s.qualificationDecision === 'qualified' && !s.isOutlier)
      .map(s => ({ x: s.salePrice / 1000, y: s.ratio, parcelId: s.parcelId }));
    const o = hood.filter(s => s.isOutlier)
      .map(s => ({ x: s.salePrice / 1000, y: s.ratio, parcelId: s.parcelId }));
    const ols = olsLine(q);
    return { qualified: q, outliers: o, ols };
  }, [salePoints, neighborhoodCode]);

  if (qualified.length < 3) return null;

  const allX = qualified.map(p => p.x);
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);

  const regLine = ols
    ? [
        { x: xMin, y: ols.slope * xMin + ols.intercept },
        { x: xMax, y: ols.slope * xMax + ols.intercept },
      ]
    : [];

  const interpretation = ols
    ? ols.slope < -0.0005
      ? { label: 'Regressive', sub: 'High-value under-assessed', color: 'text-amber-300' }
      : ols.slope > 0.0005
        ? { label: 'Progressive', sub: 'High-value over-assessed', color: 'text-blue-300' }
        : { label: 'Uniform', sub: 'No systematic bias', color: 'text-emerald-400' }
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs text-slate-500 uppercase tracking-wide">Price vs Ratio</h4>
        {interpretation && (
          <div className="text-right">
            <span className={`text-[10px] font-bold ${interpretation.color}`}>{interpretation.label}</span>
            <div className="text-[8px] text-slate-600">{interpretation.sub}</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <ComposedChart margin={{ top: 4, right: 8, bottom: 4, left: -14 }}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin * 0.95, xMax * 1.05]}
            tick={{ fontSize: 8, fill: '#64748b' }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}k`}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0.75, 1.25]}
            tick={{ fontSize: 8, fill: '#64748b' }}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 10, borderRadius: 6 }}
            formatter={(v: number, name: string) =>
              name === 'y' ? [v.toFixed(3), 'Ratio'] : [`$${v.toFixed(0)}k`, 'Sale Price']
            }
          />
          {/* IAAO target band */}
          <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
          <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
          {/* Regression line */}
          {ols && (
            <Line
              data={regLine}
              dataKey="y"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              strokeDasharray="6 3"
            />
          )}
          {/* Outlier sales */}
          {outliers.length > 0 && (
            <Scatter data={outliers} fill="#ef4444" opacity={0.7} r={3} />
          )}
          {/* Qualified sales */}
          <Scatter data={qualified} fill="#00FFFF" opacity={0.6} r={2.5} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-[8px] text-slate-600 mt-0.5">
        <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-terra-cyan/60 mr-0.5 -mb-px" />Qualified</span>
        {outliers.length > 0 && <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500/60 mr-0.5 -mb-px" />Outlier</span>}
        <span><span className="inline-block w-3 h-px bg-amber-400 mr-0.5 mb-0.5" />OLS trend</span>
      </div>
    </div>
  );
}

function EquityNarrative({ ns }: { ns: import('../types/geoforge.types').NeighborhoodStat }) {
  const { stats, neighborhoodCode, saleCount } = ns;
  const { medianRatio, cod, prd, prb } = stats;

  const ratioStatus = medianRatio >= 0.95 && medianRatio <= 1.05 ? 'within IAAO parity (0.95–1.05)'
    : medianRatio > 1.05 ? `above parity at ${medianRatio.toFixed(3)} — properties appear over-assessed`
    : `below parity at ${medianRatio.toFixed(3)} — properties appear under-assessed`;

  const uniformityStatus = cod <= 15 ? `uniform (COD ${cod.toFixed(1)})`
    : cod <= 20 ? `borderline (COD ${cod.toFixed(1)}, IAAO max is 20)`
    : `non-uniform (COD ${cod.toFixed(1)}, exceeds IAAO 20 threshold)`;

  const verticalStatus = prd >= 0.98 && prd <= 1.03
    ? 'no vertical inequity detected'
    : prd > 1.03
      ? `regressive vertical inequity (PRD ${prd.toFixed(3)}) — lower-value properties over-assessed relative to higher-value`
      : `progressive vertical inequity (PRD ${prd.toFixed(3)}) — higher-value properties over-assessed relative to lower-value`;

  const sampleNote = saleCount < 5 ? ' Sample size is critically low — interpret results with caution.'
    : saleCount < 10 ? ' Sample size is small; conclusions may not be statistically reliable.'
    : '';

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-md px-3 py-2.5">
      <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Equity Assessment</h4>
      <p className="text-[10px] text-slate-300 leading-relaxed">
        Median ratio is <span className={
          medianRatio >= 0.95 && medianRatio <= 1.05 ? 'text-emerald-400 font-semibold' :
          medianRatio >= 0.90 && medianRatio <= 1.10 ? 'text-amber-400 font-semibold' : 'text-red-400 font-semibold'
        }>{ratioStatus}</span> based on {saleCount} qualified sales.
        Assessment uniformity is <span className={
          cod <= 15 ? 'text-emerald-400' : cod <= 20 ? 'text-amber-400' : 'text-red-400'
        }>{uniformityStatus}</span>.
        Vertical equity shows <span className={
          prd >= 0.98 && prd <= 1.03 ? 'text-emerald-400' : 'text-amber-400'
        }>{verticalStatus}</span>.
        {sampleNote && <span className="text-slate-500">{sampleNote}</span>}
      </p>
    </div>
  );
}

const BAND_COLORS: Record<'ok' | 'watch' | 'critical', string> = {
  ok: 'bg-green-900 text-green-300 border-green-700',
  watch: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  critical: 'bg-red-900 text-red-300 border-red-700',
};

function QuintileChart({ stats }: { stats: import('../types/geoforge.types').BentonMethodStats }) {
  const quintiles = [
    { label: 'Q1 Low', ratio: stats.q1Ratio },
    { label: 'Q2', ratio: stats.q2Ratio },
    { label: 'Q3 Mid', ratio: stats.q3Ratio },
    { label: 'Q4', ratio: stats.q4Ratio },
    { label: 'Q5 High', ratio: stats.q5Ratio },
  ];

  const hasData = quintiles.some(q => q.ratio > 0);
  if (!hasData) return null;

  const pct = (r: number) => Math.min(50, Math.abs(r - 1.0) * 200);
  const barColor = (r: number) =>
    r >= 0.95 && r <= 1.05 ? '#22c55e' : r >= 0.90 && r <= 1.10 ? '#eab308' : '#ef4444';

  // Regressivity: high-value under-assessed = Q5 ratio < Q1 ratio
  const spread = stats.q5Ratio > 0 && stats.q1Ratio > 0
    ? stats.q5Ratio / stats.q1Ratio : null;
  const regressivity =
    spread === null ? null :
    spread < 0.95 ? { label: 'Regressive', color: 'text-red-400' } :
    spread > 1.05 ? { label: 'Progressive', color: 'text-blue-400' } :
    { label: 'Uniform', color: 'text-green-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide">
          Value Stratification
        </h4>
        {regressivity && (
          <span className={`text-[10px] font-bold uppercase ${regressivity.color}`}>
            {regressivity.label}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {quintiles.map(({ label, ratio }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-[52px] text-right text-[9px] text-slate-500 shrink-0">{label}</span>
            <div className="flex-1 relative h-3.5 bg-slate-800 rounded overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10" />
              {ratio > 0 && (
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-[2px]"
                  style={{
                    backgroundColor: barColor(ratio),
                    opacity: 0.80,
                    left: ratio < 1.0 ? `${50 - pct(ratio)}%` : '50%',
                    width: `${pct(ratio)}%`,
                  }}
                />
              )}
            </div>
            <span
              className="w-11 text-right font-mono text-[10px] shrink-0"
              style={{ color: barColor(ratio) }}
            >
              {ratio > 0 ? ratio.toFixed(3) : '—'}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 mt-1.5 text-right">
        center = 1.00 parity · Q5/Q1 = {spread ? spread.toFixed(3) : '—'}
      </p>
    </div>
  );
}

function PeerComparison({ ns }: { ns: import('../types/geoforge.types').NeighborhoodStat }) {
  const { neighborhoodStats, selectNeighborhood } = useGeoForgeStore();

  const peers = useMemo(() => {
    const { medianRatio, cod, prd } = ns.stats;
    return neighborhoodStats
      .filter(n => n.neighborhoodCode !== ns.neighborhoodCode && n.saleCount >= 3)
      .map(n => ({
        ns: n,
        score:
          Math.abs(n.stats.medianRatio - medianRatio) * 6
          + Math.abs(n.stats.cod - cod) * 0.25
          + Math.abs(n.stats.prd - prd) * 8,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [ns, neighborhoodStats]);

  if (peers.length === 0) return null;

  return (
    <div>
      <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Peer Comparison</h4>
      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left text-slate-600 py-0.5 font-normal">Nbhd</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">MED</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">COD</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">Δ</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">n</th>
          </tr>
        </thead>
        <tbody>
          {peers.map(({ ns: p }) => {
            const delta = p.stats.medianRatio - ns.stats.medianRatio;
            const medColor = p.stats.medianRatio >= 0.95 && p.stats.medianRatio <= 1.05 ? 'text-emerald-400'
              : p.stats.medianRatio >= 0.90 && p.stats.medianRatio <= 1.10 ? 'text-amber-400' : 'text-red-400';
            return (
              <tr
                key={p.neighborhoodCode}
                className="border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/40 transition-colors"
                onClick={() => selectNeighborhood(p.neighborhoodCode)}
              >
                <td className="py-1 text-terra-cyan font-mono">{p.neighborhoodCode}</td>
                <td className={`py-1 text-right font-mono ${medColor}`}>{p.stats.medianRatio.toFixed(3)}</td>
                <td className={`py-1 text-right font-mono ${p.stats.cod > 20 ? 'text-red-400' : p.stats.cod > 15 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {p.stats.cod.toFixed(1)}
                </td>
                <td className={`py-1 text-right font-mono ${delta >= 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
                </td>
                <td className="py-1 text-right text-slate-500">{p.saleCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function NeighborhoodDetailPanel() {
  const { selectedNeighborhoodCode, neighborhoodStats, openDrawer } = useGeoForgeStore();
  const ns = neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode);

  if (!ns) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a neighborhood on the map.
      </div>
    );
  }

  const { stats } = ns;

  const srtIndex = stats.q1Ratio > 0 && stats.q5Ratio > 0 ? stats.q1Ratio / stats.q5Ratio : null;
  const srtBandVal: 'ok' | 'watch' | 'critical' | undefined = srtIndex === null ? undefined
    : srtIndex >= 0.95 && srtIndex <= 1.05 ? 'ok'
    : srtIndex >= 0.90 && srtIndex <= 1.10 ? 'watch'
    : 'critical';

  type StatRow = { label: string; value: string; band?: 'ok' | 'watch' | 'critical' };
  const rows: StatRow[] = [
    { label: 'Qualified Sales', value: String(stats.count) },
    { label: 'Median Ratio', value: stats.medianRatio.toFixed(3) },
    { label: 'COD', value: stats.cod.toFixed(1), band: codBand(stats.cod) },
    { label: 'PRD', value: stats.prd.toFixed(3), band: prdBand(stats.prd) },
    { label: 'PRB', value: stats.prb.toFixed(3), band: prbBand(stats.prb) },
    { label: 'VEI', value: stats.vei.toFixed(3) },
    { label: 'Mean Ratio', value: stats.mean.toFixed(3) },
    { label: 'Weighted Mean', value: stats.weightedMean.toFixed(3) },
    { label: 'Min', value: stats.min.toFixed(3) },
    { label: 'Max', value: stats.max.toFixed(3) },
    { label: 'Std Dev', value: stats.stdDev.toFixed(3) },
    { label: 'CV', value: (stats.cv * 100).toFixed(1) + '%' },
    ...(srtIndex !== null ? [{ label: 'SRT (Q1/Q5)', value: srtIndex.toFixed(3), band: srtBandVal }] : []),
  ];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div>
        <h3 className="text-terra-cyan font-semibold text-sm leading-tight">
          {ns.neighborhoodCode}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ns.saleCount} qualified sales
        </p>
      </div>

      <EquityNarrative ns={ns} />

      <EquitySignatureRadar stats={stats} label="Equity Signature" />

      <QuintileChart stats={stats} />

      <RegressivityScatter neighborhoodCode={ns.neighborhoodCode} />

      <table className="w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-800">
              <td className="py-1.5 text-muted-foreground pr-3">{r.label}</td>
              <td className="py-1.5 text-right">
                {r.band ? (
                  <Badge className={`${BAND_COLORS[r.band]} text-xs font-mono`}>
                    {r.value}
                  </Badge>
                ) : (
                  <span className="text-white font-mono">{r.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PeerComparison ns={ns} />

      <div className="flex gap-2 flex-wrap pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('sales-drilldown')}
        >
          View Sales
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('diagnosis')}
        >
          AI Diagnose
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('year-trend')}
        >
          5-Yr Trend
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 border border-amber-700/50 ml-auto"
          variant="outline"
          onClick={() => openDrawer('workbench')}
        >
          Adjust →
        </Button>
      </div>
    </div>
  );
}

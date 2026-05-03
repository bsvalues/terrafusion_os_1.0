import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Cell, ErrorBar,
} from 'recharts';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeValueStrata } from '../utils/valueStrata';

type DecileCount = 5 | 10 | 20;
type Scope = 'county' | 'neighborhood';

const BIAS_META = {
  regressive: {
    color: '#f87171',
    label: 'Regressive',
    desc: 'Lower-value properties carry a disproportionate tax burden. Common finding — requires documented corrective action for DOR certification.',
  },
  progressive: {
    color: '#60a5fa',
    label: 'Progressive',
    desc: 'Higher-value properties are relatively over-assessed. Less common — monitor PRD trend.',
  },
  uniform: {
    color: '#4ade80',
    label: 'Uniform',
    desc: 'No significant value-related bias detected. Vertical equity standards met.',
  },
  insufficient: {
    color: '#64748b',
    label: 'Insufficient data',
    desc: 'Need more qualified sales to compute a reliable vertical equity analysis.',
  },
};

function ratioColor(r: number): string {
  if (r >= 0.95 && r <= 1.05) return '#4ade80';
  if (r >= 0.90 && r <= 1.10) return '#fbbf24';
  return '#f87171';
}

export function ValueStrataPanel() {
  const { salePoints, selectedNeighborhoodCode, filter } = useGeoForgeStore();
  const [decileCount, setDecileCount] = useState<DecileCount>(10);
  const [scope, setScope] = useState<Scope>('county');

  const filteredSales = useMemo(() => {
    if (scope === 'neighborhood' && selectedNeighborhoodCode) {
      return salePoints.filter((s) => s.neighborhoodCode === selectedNeighborhoodCode);
    }
    return salePoints;
  }, [salePoints, scope, selectedNeighborhoodCode]);

  const result = useMemo(
    () => computeValueStrata(filteredSales, decileCount),
    [filteredSales, decileCount],
  );

  const chartData = useMemo(
    () =>
      result.deciles.map((d) => ({
        label: d.label,
        medianRatio: parseFloat(d.medianRatio.toFixed(4)),
        q1: d.q1 ?? d.medianRatio,
        q3: d.q3 ?? d.medianRatio,
        n: d.n,
        color: ratioColor(d.medianRatio),
      })),
    [result],
  );

  const bias = BIAS_META[result.verticalBias];
  const hasNbhd = selectedNeighborhoodCode !== null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Controls */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 space-y-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Scope</div>
            <div className="flex rounded overflow-hidden border border-slate-700 text-[10px]">
              <button
                onClick={() => setScope('county')}
                className={`px-2.5 py-1 transition-colors ${scope === 'county' ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-white'}`}
              >
                County
              </button>
              <button
                onClick={() => setScope('neighborhood')}
                disabled={!hasNbhd}
                className={`px-2.5 py-1 transition-colors disabled:opacity-40 ${scope === 'neighborhood' ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-white'}`}
              >
                {selectedNeighborhoodCode ?? 'Nbhd'}
              </button>
            </div>
          </div>

          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Strata</div>
            <div className="flex rounded overflow-hidden border border-slate-700 text-[10px]">
              {([5, 10, 20] as DecileCount[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDecileCount(d)}
                  className={`px-2 py-1 transition-colors ${decileCount === d ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-right">
            <div className="text-[9px] text-slate-500">{result.totalN.toLocaleString()} sales</div>
            <div className="text-[9px] text-slate-500">{filter.taxYear}</div>
          </div>
        </div>

        {/* Bias summary */}
        <div className="rounded border px-3 py-2" style={{ borderColor: bias.color + '40', backgroundColor: bias.color + '0d' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold" style={{ color: bias.color }}>{bias.label}</span>
            {result.prbSlope !== null && (
              <span className="text-[10px] font-mono text-slate-400">
                PRB slope: {result.prbSlope >= 0 ? '+' : ''}{result.prbSlope.toFixed(2)}% per 10% ↑SP
              </span>
            )}
            {result.prbR2 !== null && (
              <span className="text-[9px] text-slate-600 ml-auto">R²={result.prbR2.toFixed(3)}</span>
            )}
          </div>
          <p className="text-[9px] text-slate-400">{bias.desc}</p>
        </div>
      </div>

      {/* Chart */}
      {result.deciles.length > 0 ? (
        <div className="flex-shrink-0 px-2 pt-3">
          <div className="text-[9px] text-slate-500 px-2 mb-1">Median ratio by sale price decile · green band = IAAO 0.90–1.10</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
              <ReferenceArea y1={0.90} y2={1.10} fill="#22c55e" fillOpacity={0.06} />
              <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
              <ReferenceLine y={1.0} stroke="#475569" strokeDasharray="4 3" />
              <ReferenceLine y={0.90} stroke="#ef4444" strokeDasharray="2 3" strokeWidth={0.5} />
              <ReferenceLine y={1.10} stroke="#ef4444" strokeDasharray="2 3" strokeWidth={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 8 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={44}
              />
              <YAxis
                domain={[0.70, 1.30]}
                tick={{ fill: '#64748b', fontSize: 8 }}
                tickCount={7}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 10, borderRadius: 6 }}
                formatter={(v: number, name: string) => {
                  if (name === 'medianRatio') return [v.toFixed(3), 'Median Ratio'];
                  return [v, name];
                }}
                labelFormatter={(label, payload) => {
                  const n = payload?.[0]?.payload?.n ?? '?';
                  return `${label} (n=${n})`;
                }}
              />
              <Bar dataKey="medianRatio" radius={[2, 2, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-slate-600 text-xs">
          {result.totalN < decileCount
            ? `Need ≥ ${decileCount} qualified sales (have ${result.totalN})`
            : 'No data'}
        </div>
      )}

      {/* Decile table */}
      {result.deciles.length > 0 && (
        <div className="px-4 pb-4 pt-2">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="text-left py-1 font-normal">Price band</th>
                <th className="text-right py-1 font-normal">n</th>
                <th className="text-right py-1 font-normal">Med Ratio</th>
                <th className="text-right py-1 font-normal">COD</th>
                <th className="text-right py-1 font-normal">IQR</th>
              </tr>
            </thead>
            <tbody>
              {result.deciles.map((d, i) => {
                const color = ratioColor(d.medianRatio);
                return (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-1 text-slate-400">{d.label}</td>
                    <td className="py-1 text-right text-slate-500">{d.n}</td>
                    <td className="py-1 text-right font-mono font-semibold" style={{ color }}>
                      {d.medianRatio.toFixed(3)}
                    </td>
                    <td className="py-1 text-right font-mono text-slate-400">
                      {d.cod !== null ? d.cod.toFixed(1) : '—'}
                    </td>
                    <td className="py-1 text-right font-mono text-slate-500">
                      {d.q1 !== null && d.q3 !== null
                        ? `${d.q1.toFixed(2)}–${d.q3.toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-[8px] text-slate-700 mt-2">
            Equal-count strata by sale price · PRB: regress ratio on ln(SP) · WAC 458-53A vertical equity
          </div>
        </div>
      )}
    </div>
  );
}

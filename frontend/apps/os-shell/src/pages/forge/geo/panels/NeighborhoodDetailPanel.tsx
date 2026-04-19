import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { EquitySignatureRadar } from './EquitySignatureRadar';
import { codBand, prdBand, prbBand } from '../utils/bentonMethodCalcs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

      <EquitySignatureRadar stats={stats} label="Equity Signature" />

      <QuintileChart stats={stats} />

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

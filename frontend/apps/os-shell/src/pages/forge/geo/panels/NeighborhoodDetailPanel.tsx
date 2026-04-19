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
      </div>
    </div>
  );
}

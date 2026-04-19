import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { ratioPointColor } from '../utils/choropleths';
import type { SalePoint } from '../types/geoforge.types';

export function SalesDrillDownPanel() {
  const { selectedNeighborhoodCode, salePoints } = useGeoForgeStore();

  const filtered: SalePoint[] = selectedNeighborhoodCode
    ? salePoints.filter((s) => s.neighborhoodCode === selectedNeighborhoodCode)
    : salePoints;

  const outlierCount = filtered.filter((s) => s.isOutlier).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filtered.length} sales
          {outlierCount > 0 && (
            <span className="ml-2 text-red-400">· {outlierCount} outlier{outlierCount !== 1 ? 's' : ''}</span>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-950 z-10">
            <tr className="text-muted-foreground border-b border-slate-700">
              <th className="text-left py-2 px-3">Parcel</th>
              <th className="text-right py-2 px-2">Sale $</th>
              <th className="text-right py-2 px-2">AV $</th>
              <th className="text-right py-2 px-2">Ratio</th>
              <th className="text-right py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 300).map((s) => (
              <tr
                key={s.saleId}
                className={`border-b border-slate-800 hover:bg-slate-900 transition-colors ${
                  s.isOutlier ? 'bg-red-950/20' : ''
                }`}
              >
                <td className="py-1.5 px-3 font-mono text-[10px] text-slate-300">
                  {s.parcelId}
                  {s.isOutlier && <span className="ml-1 text-red-400">⚠</span>}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400">
                  {(s.salePrice / 1000).toFixed(0)}k
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400">
                  {(s.assessedValue / 1000).toFixed(0)}k
                </td>
                <td className="py-1.5 px-2 text-right">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: ratioPointColor(s.ratio) }}
                  >
                    {s.ratio.toFixed(3)}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right text-muted-foreground">
                  {s.saleDate.slice(0, 7)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 300 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Showing 300 of {filtered.length} sales
          </p>
        )}

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No qualified sales found.
          </p>
        )}
      </div>
    </div>
  );
}

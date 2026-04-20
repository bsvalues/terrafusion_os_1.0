import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { CompSale } from '../types/geoforge.types';

const RATIO_COLOR = (r: number | null) => {
  if (r == null) return 'text-slate-500';
  if (r > 1.15 || r < 0.85) return 'text-red-400 font-bold';
  if (r > 1.05 || r < 0.95) return 'text-amber-300';
  return 'text-emerald-400';
};

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-slate-400 w-7 text-right">{pct.toFixed(0)}</span>
    </div>
  );
}

export function CompsPanel() {
  const { bloomParcelId, filter, setComparableSalePoints, setBloomParcelId } = useGeoForgeStore();

  const { data, isLoading } = useQuery<CompSale[]>({
    queryKey: ['geoforge-comps', bloomParcelId, filter.taxYear],
    queryFn: () =>
      apiFetchJson<CompSale[]>(
        `/geoforge/parcel/${bloomParcelId}/comps?taxYear=${filter.taxYear}&count=8`,
      ),
    enabled: !!bloomParcelId,
    staleTime: 1000 * 60 * 10,
  });

  // Push comp lat/lng into store for map highlighting
  useEffect(() => {
    if (data && data.length > 0) {
      setComparableSalePoints(data.map((c) => ({ lat: c.lat, lng: c.lng, score: c.score })));
    } else {
      setComparableSalePoints(null);
    }
    return () => setComparableSalePoints(null);
  }, [data, setComparableSalePoints]);

  if (!bloomParcelId) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        Select a parcel to view comparables.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">
        Scoring comparables…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        No comparables found within 2.5 miles.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
          Top {data.length} Comparables · {bloomParcelId}
        </p>
        <p className="text-[9px] text-slate-600">Score = dist · type · size · recency</p>
      </div>

      {data.map((c, i) => (
        <div
          key={c.parcelId}
          className="bg-slate-900/60 rounded border border-slate-800 p-2.5 hover:border-slate-600 transition-colors cursor-pointer"
          onClick={() => setBloomParcelId(c.parcelId)}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <span className="text-[9px] text-slate-600 font-mono mr-1.5">#{i + 1}</span>
              <span className="text-terra-cyan font-mono text-[10px]">{c.parcelId}</span>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.address}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-mono text-[11px] font-bold ${RATIO_COLOR(c.ratio)}`}>
                {c.ratio != null ? c.ratio.toFixed(3) : '—'}
              </div>
              <div className="text-[9px] text-slate-600">ratio</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-1.5">
            <div>
              <div className="text-[9px] text-slate-600">Sale Price</div>
              <div className="text-[10px] text-slate-300 font-mono">
                ${(c.salePrice / 1000).toFixed(0)}k
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-600">AV</div>
              <div className="text-[10px] text-slate-300 font-mono">
                ${(c.assessedValue / 1000).toFixed(0)}k
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-600">Dist</div>
              <div className="text-[10px] text-slate-300 font-mono">{c.distanceMi.toFixed(2)}mi</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-[9px] text-slate-600 font-mono shrink-0">{c.saleDate}</div>
            <div className="flex-1">
              <ScoreMeter score={c.score} />
            </div>
          </div>
        </div>
      ))}

      <p className="text-[9px] text-slate-700 pt-1 text-center">
        Cyan rings on map · Click any comp to view bloom card
      </p>
    </div>
  );
}

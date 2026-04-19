import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { haversineDistanceMi, computeMedian, computeCod } from './utils/geoMath';
import type { BloomParcel } from './types/geoforge.types';

const RATIO_COLOR = (r: number) =>
  r > 1.15 ? '#f87171' : r > 1.05 ? '#fb923c'
  : r < 0.85 ? '#60a5fa' : r < 0.95 ? '#93c5fd' : '#4ade80';

const DQ_BADGE: Record<string, string> = {
  qualified: 'text-green-400',
  disqualified: 'text-red-400',
  outlier: 'text-yellow-400',
};

function AvBar({ year, av, maxAv, land, impr }: { year: number; av: number; maxAv: number; land: number; impr: number }) {
  const pct = maxAv > 0 ? (av / maxAv) * 100 : 0;
  const landPct = av > 0 ? (land / av) * 100 : 0;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-slate-500 w-8 shrink-0">{year}</span>
      <div className="flex-1 h-3 bg-slate-800 rounded-sm overflow-hidden">
        <div className="h-full flex" style={{ width: `${pct}%` }}>
          <div className="bg-slate-600" style={{ width: `${landPct}%` }} title={`Land $${land.toLocaleString()}`} />
          <div className="bg-terra-cyan/60" style={{ width: `${100 - landPct}%` }} title={`Impr $${impr.toLocaleString()}`} />
        </div>
      </div>
      <span className="text-[9px] font-mono text-slate-300 w-16 text-right shrink-0">
        ${(av / 1000).toFixed(0)}k
      </span>
    </div>
  );
}

const RADIUS_OPTIONS: { label: string; value: 0.25 | 0.5 | 1.0 }[] = [
  { label: '¼mi', value: 0.25 },
  { label: '½mi', value: 0.5 },
  { label: '1mi', value: 1.0 },
];

export function ParcelBloomCard() {
  const {
    bloomParcelId, setBloomParcelId, filter, openDrawer,
    setBloomLatlng, setSelectedRadiusMi, selectedRadiusMi, salePoints,
    neighborhoodStats,
  } = useGeoForgeStore();

  const { data, isLoading } = useQuery<BloomParcel>({
    queryKey: ['geoforge-bloom', bloomParcelId, filter.taxYear],
    queryFn: () => apiFetchJson<BloomParcel>(
      `/api/geoforge/parcel/${bloomParcelId}/bloom?taxYear=${filter.taxYear}`
    ),
    enabled: !!bloomParcelId,
    staleTime: 1000 * 60 * 30,
  });

  // Sync bloom lat/lng into store for the map ring
  useEffect(() => {
    if (data?.centroidLat) {
      setBloomLatlng({ lat: data.centroidLat, lng: data.centroidLng });
    }
  }, [data, setBloomLatlng]);

  // Clear ring when card closes
  useEffect(() => {
    if (!bloomParcelId) {
      setBloomLatlng(null);
      setSelectedRadiusMi(null);
    }
  }, [bloomParcelId, setBloomLatlng, setSelectedRadiusMi]);

  // Compute in-radius sale stats client-side
  const radiusStats = useMemo(() => {
    if (!selectedRadiusMi || !data?.centroidLat) return null;
    const inR = salePoints.filter(
      (sp) =>
        sp.lat !== 0 &&
        sp.lng !== 0 &&
        haversineDistanceMi(data.centroidLat, data.centroidLng, sp.lat, sp.lng) <= selectedRadiusMi,
    );
    const ratios = inR.map((s) => s.ratio).filter((r) => r > 0).sort((a, b) => a - b);
    if (ratios.length === 0) return { n: inR.length, median: 0, cod: 0 };
    return { n: inR.length, median: computeMedian(ratios), cod: computeCod(ratios) };
  }, [selectedRadiusMi, data, salePoints]);

  if (!bloomParcelId) return null;

  const maxAv = data ? Math.max(...data.avHistory.map(h => h.assessedValue), 1) : 1;

  return (
    <div
      className="absolute bottom-0 left-0 right-[72px] z-30
        bg-slate-950/97 backdrop-blur border-t border-slate-700
        transition-transform duration-300"
      style={{ height: 244 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-terra-cyan font-mono font-bold text-sm shrink-0">{bloomParcelId}</span>
          {data && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 text-xs truncate">{data.address}</span>
              {data.situsCity && <span className="text-slate-500 text-xs shrink-0">{data.situsCity}</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Comp radius selector */}
          {data?.centroidLat ? (
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] text-slate-600 mr-0.5">Comps</span>
              {RADIUS_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSelectedRadiusMi(selectedRadiusMi === value ? null : value)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                    selectedRadiusMi === value
                      ? 'bg-amber-900/60 text-amber-200 border-amber-600/60'
                      : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          {data && (
            <>
              <button
                onClick={() => openDrawer('comps')}
                className="text-[9px] px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 hover:bg-sky-800/60 border border-sky-800/40"
              >
                Comps ↗
              </button>
              <button
                onClick={() => openDrawer('workbench')}
                className="text-[9px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 hover:bg-amber-800/60 border border-amber-800/40"
              >
                Workbench ↗
              </button>
            </>
          )}
          <button
            onClick={() => setBloomParcelId(null)}
            className="text-slate-500 hover:text-white text-lg leading-none w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      {/* Comp radius stat bar */}
      {radiusStats && (
        <div className="flex items-center gap-3 px-4 py-1 bg-amber-950/40 border-b border-amber-900/30 text-[10px]">
          <span className="text-amber-400 font-semibold">{selectedRadiusMi}mi radius</span>
          <span className="text-slate-400">
            <span className="text-white font-mono">{radiusStats.n}</span> sales
          </span>
          <span className="text-slate-400">
            MED <span className={`font-mono font-bold ${radiusStats.median > 1.1 || radiusStats.median < 0.9 ? 'text-red-400' : radiusStats.median > 1.05 || radiusStats.median < 0.95 ? 'text-amber-300' : 'text-emerald-400'}`}>
              {radiusStats.median.toFixed(3)}
            </span>
          </span>
          <span className="text-slate-400">
            COD <span className={`font-mono ${radiusStats.cod > 20 ? 'text-red-400' : radiusStats.cod > 15 ? 'text-amber-300' : 'text-slate-200'}`}>
              {radiusStats.cod.toFixed(1)}
            </span>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-[188px] text-slate-500 text-sm animate-pulse">
          Loading parcel story…
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-[188px] text-slate-600 text-sm">
          Parcel data unavailable.
        </div>
      ) : (
        <div className="flex h-[188px] text-xs">
          {/* AV History — left column */}
          <div className="w-[200px] shrink-0 border-r border-slate-800 p-3 overflow-hidden">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-2">Assessment History</p>
            {data.avHistory.length === 0 ? (
              <p className="text-[9px] text-slate-600">No history available.</p>
            ) : (
              data.avHistory.map(h => (
                <AvBar
                  key={h.taxYear}
                  year={h.taxYear}
                  av={h.assessedValue}
                  maxAv={maxAv}
                  land={h.landValue}
                  impr={h.improvementValue}
                />
              ))
            )}
            <div className="mt-2 pt-2 border-t border-slate-800 flex gap-2 text-[8px] text-slate-600">
              <span><span className="inline-block w-2 h-2 bg-slate-600 rounded-sm mr-0.5" />Land</span>
              <span><span className="inline-block w-2 h-2 bg-terra-cyan/60 rounded-sm mr-0.5" />Impr</span>
            </div>
          </div>

          {/* Sale History — center */}
          <div className="flex-1 p-3 overflow-y-auto min-w-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-2">Sale History</p>
            {data.salesHistory.length === 0 ? (
              <p className="text-[9px] text-slate-600">No sales on record.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[8px] text-slate-600 uppercase">
                    <th className="text-left pb-1">Date</th>
                    <th className="text-right pb-1">Price</th>
                    <th className="text-right pb-1">Ratio</th>
                    <th className="text-right pb-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesHistory.map((s) => (
                    <tr key={s.saleId} className="border-t border-slate-900">
                      <td className="py-1 text-slate-400 font-mono text-[10px]">{s.saleDate}</td>
                      <td className="py-1 text-right text-slate-300">
                        ${(s.salePrice / 1000).toFixed(0)}k
                      </td>
                      <td className="py-1 text-right font-mono font-bold" style={{ color: s.ratio ? RATIO_COLOR(s.ratio) : '#64748b' }}>
                        {s.ratio != null ? s.ratio.toFixed(3) : '—'}
                      </td>
                      <td className={`py-1 text-right text-[9px] ${DQ_BADGE[s.qualificationDecision] ?? 'text-slate-500'}`}>
                        {s.qualificationDecision === 'qualified' ? 'QLD'
                          : s.qualificationDecision === 'disqualified' ? 'DQ'
                          : s.qualificationDecision === 'outlier' ? 'OUT'
                          : s.qualificationDecision.slice(0, 3).toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Key characteristics — right column */}
          <div className="w-[130px] shrink-0 border-l border-slate-800 p-3">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-2">Details</p>
            {[
              { label: 'Type', value: data.propertyType || '—' },
              { label: 'Nbhd', value: data.neighborhood || '—' },
              { label: 'Built', value: data.yearBuilt ? String(data.yearBuilt) : '—' },
              { label: 'AV', value: `$${(data.currentAv / 1000).toFixed(0)}k` },
              { label: 'Land', value: `$${(data.landValue / 1000).toFixed(0)}k` },
              { label: 'Impr', value: `$${(data.improvValue / 1000).toFixed(0)}k` },
              { label: 'Owner', value: data.ownerName || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="mb-1">
                <span className="text-[8px] text-slate-600 uppercase">{label} </span>
                <span className="text-[10px] text-slate-300 font-mono">{value}</span>
              </div>
            ))}
            {/* Appeal risk — computed from latest sale vs neighborhood median */}
            {(() => {
              const latestQualified = data.salesHistory
                .filter(s => s.qualificationDecision === 'qualified' && s.ratio != null)
                .sort((a, b) => b.saleDate.localeCompare(a.saleDate))[0];
              if (!latestQualified?.ratio) return null;
              const nbhd = neighborhoodStats.find(n => n.neighborhoodCode === data.neighborhood);
              if (!nbhd) return null;
              const delta = latestQualified.ratio - nbhd.stats.medianRatio;
              const riskLabel = delta > 0.10 ? 'HIGH' : delta > 0.05 ? 'MOD' : 'LOW';
              const riskColor = delta > 0.10 ? 'text-red-400' : delta > 0.05 ? 'text-amber-300' : 'text-emerald-400';
              return (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <span className="text-[8px] text-slate-600 uppercase">Appeal Risk </span>
                  <span className={`text-[10px] font-bold font-mono ${riskColor}`}>{riskLabel}</span>
                  <div className="text-[8px] text-slate-700 font-mono">
                    {delta >= 0 ? '+' : ''}{delta.toFixed(3)} vs nbhd
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

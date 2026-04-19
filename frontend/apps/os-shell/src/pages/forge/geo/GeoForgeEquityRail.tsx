import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { codBand, prdBand } from './utils/bentonMethodCalcs';

type Band = 'ok' | 'watch' | 'critical';

const BAND_STYLES: Record<Band, string> = {
  ok: 'text-green-400 bg-green-950/60 border-green-900',
  watch: 'text-yellow-400 bg-yellow-950/60 border-yellow-900',
  critical: 'text-red-400 bg-red-950/60 border-red-900',
};

function medianBand(ratio: number): Band {
  if (ratio >= 0.95 && ratio <= 1.05) return 'ok';
  if (ratio >= 0.90 && ratio <= 1.10) return 'watch';
  return 'critical';
}

export function GeoForgeEquityRail() {
  const { selectedNeighborhoodCode, neighborhoodStats } = useGeoForgeStore();
  const ns = neighborhoodStats.find(
    (n) => n.neighborhoodCode === selectedNeighborhoodCode
  );

  if (!ns) {
    return (
      <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col items-center justify-center gap-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 px-1">
        <span className="text-[9px] text-muted-foreground text-center leading-tight">
          Click a neighborhood
        </span>
      </div>
    );
  }

  const kpis: { label: string; value: string; band: Band }[] = [
    {
      label: 'MED',
      value: ns.stats.medianRatio.toFixed(3),
      band: medianBand(ns.stats.medianRatio),
    },
    {
      label: 'COD',
      value: ns.stats.cod.toFixed(1),
      band: codBand(ns.stats.cod),
    },
    {
      label: 'PRD',
      value: ns.stats.prd.toFixed(3),
      band: prdBand(ns.stats.prd),
    },
    {
      label: 'n',
      value: String(ns.saleCount),
      band: ns.saleCount >= 5 ? 'ok' : 'critical',
    },
  ];

  return (
    <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 overflow-hidden">
      {kpis.map((k) => (
        <div
          key={k.label}
          className={`rounded border flex flex-col items-center py-2 px-1 ${BAND_STYLES[k.band]}`}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
            {k.label}
          </span>
          <span className="text-sm font-mono font-semibold leading-tight mt-0.5">
            {k.value}
          </span>
        </div>
      ))}
    </div>
  );
}

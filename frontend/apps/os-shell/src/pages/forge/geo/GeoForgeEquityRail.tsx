import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { codBand, prdBand, prbBand, veiBand } from './utils/bentonMethodCalcs';

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

function Kpi({ label, value, band }: { label: string; value: string; band: Band }) {
  return (
    <div className={`rounded border flex flex-col items-center py-1.5 px-1 ${BAND_STYLES[band]}`}>
      <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-xs font-mono font-semibold leading-tight mt-0.5">{value}</span>
    </div>
  );
}

export function GeoForgeEquityRail() {
  const { selectedNeighborhoodCode, neighborhoodStats } = useGeoForgeStore();
  const ns = neighborhoodStats.find(n => n.neighborhoodCode === selectedNeighborhoodCode);

  if (!ns) {
    // County-wide weighted stats when nothing is selected
    const total = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
    if (total === 0) {
      return (
        <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur border-l border-slate-800 px-1">
          <span className="text-[8px] text-muted-foreground text-center leading-tight">
            Click<br />a nbhd
          </span>
        </div>
      );
    }

    const wAvg = (fn: (n: typeof neighborhoodStats[0]) => number) =>
      neighborhoodStats.reduce((s, n) => s + fn(n) * n.saleCount, 0) / total;

    const cwMed = wAvg(n => n.stats.medianRatio);
    const cwCod = wAvg(n => n.stats.cod);
    const cwPrd = wAvg(n => n.stats.prd);
    const cwPrb = wAvg(n => n.stats.prb);
    const cwVei = wAvg(n => n.stats.vei);

    return (
      <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 overflow-hidden">
        <div className="text-[7px] text-slate-600 text-center uppercase tracking-wider pb-0.5">County</div>
        <Kpi label="MED" value={cwMed.toFixed(3)} band={medianBand(cwMed)} />
        <Kpi label="COD" value={cwCod.toFixed(1)} band={codBand(cwCod)} />
        <Kpi label="PRD" value={cwPrd.toFixed(3)} band={prdBand(cwPrd)} />
        <Kpi label="PRB" value={(cwPrb >= 0 ? '+' : '') + cwPrb.toFixed(3)} band={prbBand(cwPrb)} />
        <Kpi label="VEI" value={cwVei.toFixed(3)} band={veiBand(cwVei)} />
        <Kpi label="n" value={String(total)} band={total >= 30 ? 'ok' : total >= 10 ? 'watch' : 'critical'} />
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 overflow-hidden">
      <div className="text-[7px] text-slate-600 text-center uppercase tracking-wider truncate pb-0.5">
        {selectedNeighborhoodCode}
      </div>
      <Kpi label="MED" value={ns.stats.medianRatio.toFixed(3)} band={medianBand(ns.stats.medianRatio)} />
      <Kpi label="COD" value={ns.stats.cod.toFixed(1)} band={codBand(ns.stats.cod)} />
      <Kpi label="PRD" value={ns.stats.prd.toFixed(3)} band={prdBand(ns.stats.prd)} />
      <Kpi label="PRB" value={(ns.stats.prb >= 0 ? '+' : '') + ns.stats.prb.toFixed(3)} band={prbBand(ns.stats.prb)} />
      <Kpi label="VEI" value={ns.stats.vei.toFixed(3)} band={veiBand(ns.stats.vei)} />
      <Kpi label="n" value={String(ns.saleCount)} band={ns.saleCount >= 5 ? 'ok' : 'critical'} />
    </div>
  );
}

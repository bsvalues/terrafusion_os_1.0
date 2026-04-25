import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { codBand, prdBand, prbBand, veiBand, radarNormalize } from './utils/bentonMethodCalcs';

type Band = 'ok' | 'watch' | 'critical';

const BAND_STYLES: Record<Band, string> = {
  ok: 'text-green-400 bg-green-950/60 border-green-900',
  watch: 'text-yellow-400 bg-yellow-950/60 border-yellow-900',
  critical: 'text-red-400 bg-red-950/60 border-red-900',
};

const BAND_BAR: Record<Band, string> = {
  ok: '#22c55e',
  watch: '#eab308',
  critical: '#ef4444',
};

function medianBand(ratio: number): Band {
  if (ratio >= 0.95 && ratio <= 1.05) return 'ok';
  if (ratio >= 0.90 && ratio <= 1.10) return 'watch';
  return 'critical';
}

function iaaoGrade(cod: number, med: number): { letter: 'A' | 'B' | 'C' | 'D' | 'F'; color: string } {
  if (cod <= 12 && med >= 0.97 && med <= 1.03) return { letter: 'A', color: '#22c55e' };
  if (cod <= 15 && med >= 0.95 && med <= 1.05) return { letter: 'B', color: '#84cc16' };
  if (cod <= 20 && med >= 0.90 && med <= 1.10) return { letter: 'C', color: '#eab308' };
  if (cod <= 25 && med >= 0.85 && med <= 1.15) return { letter: 'D', color: '#f97316' };
  return { letter: 'F', color: '#ef4444' };
}

function Kpi({ label, value, band, score }: { label: string; value: string; band: Band; score: number }) {
  return (
    <div className={`rounded border px-1 py-1 ${BAND_STYLES[band]}`}>
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-[7px] font-bold uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-[9px] font-mono font-semibold leading-tight">{value}</span>
      </div>
      <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(2, score * 100)}%`, backgroundColor: BAND_BAR[band] }}
        />
      </div>
    </div>
  );
}

export function GeoForgeEquityRail() {
  const { selectedNeighborhoodCode, neighborhoodStats, openDrawer, selectNeighborhood } = useGeoForgeStore();
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

    const withSales = neighborhoodStats.filter(n => n.saleCount >= 1);
    const wAvg = (fn: (n: typeof neighborhoodStats[0]) => number) =>
      withSales.reduce((s, n) => s + fn(n) * n.saleCount, 0) / total;

    const cwMed = wAvg(n => n.stats.medianRatio);
    const cwCod = wAvg(n => n.stats.cod);
    const cwPrd = wAvg(n => n.stats.prd);
    const cwPrb = wAvg(n => n.stats.prb);
    const cwVei = wAvg(n => n.stats.vei);
    const cwCv  = wAvg(n => n.stats.cv);

    const cwScores = radarNormalize({ medianRatio: cwMed, cod: cwCod, prd: cwPrd, prb: cwPrb, vei: cwVei, cv: cwCv } as Parameters<typeof radarNormalize>[0]);
    const { letter, color } = iaaoGrade(cwCod, cwMed);

    return (
      <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[7px] text-slate-600 uppercase tracking-wider">County</span>
          <span className="text-sm font-black font-mono" style={{ color }} title="County IAAO grade">{letter}</span>
        </div>
        <Kpi label="MED" value={cwMed.toFixed(3)} band={medianBand(cwMed)} score={cwScores.medianRatio} />
        <Kpi label="COD" value={cwCod.toFixed(1)} band={codBand(cwCod)} score={cwScores.cod} />
        <Kpi label="PRD" value={cwPrd.toFixed(3)} band={prdBand(cwPrd)} score={cwScores.prd} />
        <Kpi label="PRB" value={(cwPrb >= 0 ? '+' : '') + cwPrb.toFixed(3)} band={prbBand(cwPrb)} score={cwScores.prb} />
        <Kpi label="VEI" value={cwVei.toFixed(3)} band={veiBand(cwVei)} score={cwScores.vei} />
        <Kpi label="n" value={String(total)} band={total >= 30 ? 'ok' : total >= 10 ? 'watch' : 'critical'} score={Math.min(1, total / 100)} />
      </div>
    );
  }

  const scores = radarNormalize(ns.stats);
  const { letter, color } = iaaoGrade(ns.stats.cod, ns.stats.medianRatio);
  const reqPct = ((1.0 - ns.stats.medianRatio) / ns.stats.medianRatio) * 100;
  const needsAdj = Math.abs(reqPct) >= 0.5;

  return (
    <div className="absolute right-0 top-[37px] bottom-0 w-[72px] z-10 flex flex-col gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[7px] text-slate-600 uppercase tracking-wider truncate max-w-[44px]">
          {selectedNeighborhoodCode}
        </span>
        <button
          onClick={() => selectNeighborhood(ns.neighborhoodCode, 'remedy-queue')}
          title={`IAAO grade ${letter} — click to open remedy queue`}
          className="text-sm font-black font-mono transition-opacity hover:opacity-70"
          style={{ color }}
        >
          {letter}
        </button>
      </div>
      <Kpi label="MED" value={ns.stats.medianRatio.toFixed(3)} band={medianBand(ns.stats.medianRatio)} score={scores.medianRatio} />
      <Kpi label="COD" value={ns.stats.cod.toFixed(1)} band={codBand(ns.stats.cod)} score={scores.cod} />
      <Kpi label="PRD" value={ns.stats.prd.toFixed(3)} band={prdBand(ns.stats.prd)} score={scores.prd} />
      <Kpi label="PRB" value={(ns.stats.prb >= 0 ? '+' : '') + ns.stats.prb.toFixed(3)} band={prbBand(ns.stats.prb)} score={scores.prb} />
      <Kpi label="VEI" value={ns.stats.vei.toFixed(3)} band={veiBand(ns.stats.vei)} score={scores.vei} />
      <Kpi label="n" value={String(ns.saleCount)} band={ns.saleCount >= 5 ? 'ok' : 'critical'} score={Math.min(1, ns.saleCount / 30)} />

      {needsAdj && (
        <button
          onClick={() => openDrawer('workbench')}
          title="Recommended adjustment — click to open workbench"
          className="mt-auto w-full text-center rounded border border-amber-800/60 bg-amber-900/30 text-amber-300 text-[8px] font-mono py-1 hover:bg-amber-800/50 transition-colors"
        >
          Adj {reqPct >= 0 ? '+' : ''}{reqPct.toFixed(1)}%
        </button>
      )}
    </div>
  );
}

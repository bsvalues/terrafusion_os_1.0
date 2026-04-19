import { useMemo } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';

function iaaoPass(medianRatio: number, cod: number, prd: number): boolean {
  return medianRatio >= 0.90 && medianRatio <= 1.10 && cod <= 20 && prd >= 0.98 && prd <= 1.03;
}

export function GeoForgeStatusTicker() {
  const { neighborhoodStats, selectedNeighborhoodCode, filter } = useGeoForgeStore();

  const stats = useMemo(() => {
    if (neighborhoodStats.length === 0) return null;
    const total = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
    if (total === 0) return null;

    const wAvg = (fn: (n: typeof neighborhoodStats[0]) => number) =>
      neighborhoodStats.reduce((s, n) => s + fn(n) * n.saleCount, 0) / total;

    const cwMed = wAvg((n) => n.stats.medianRatio);
    const cwCod = wAvg((n) => n.stats.cod);
    const cwPrd = wAvg((n) => n.stats.prd);
    const passing = neighborhoodStats.filter((n) => iaaoPass(n.stats.medianRatio, n.stats.cod, n.stats.prd));
    const critical = neighborhoodStats.filter(
      (n) => Math.abs(n.stats.medianRatio - 1) > 0.10 || n.stats.cod > 20,
    );

    return {
      passRate: (passing.length / neighborhoodStats.length) * 100,
      passing: passing.length,
      total: neighborhoodStats.length,
      cwMed,
      cwCod,
      cwPrd,
      criticalCount: critical.length,
      worstNbhd: critical.sort(
        (a, b) => Math.abs(b.stats.medianRatio - 1) - Math.abs(a.stats.medianRatio - 1),
      )[0] ?? null,
    };
  }, [neighborhoodStats]);

  const selectedNs = selectedNeighborhoodCode
    ? neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode)
    : null;

  if (!stats) return null;

  const medColor =
    stats.cwMed >= 0.95 && stats.cwMed <= 1.05
      ? 'text-emerald-400'
      : stats.cwMed >= 0.90 && stats.cwMed <= 1.10
        ? 'text-amber-400'
        : 'text-red-400';

  const codColor = stats.cwCod <= 15 ? 'text-slate-300' : stats.cwCod <= 20 ? 'text-amber-400' : 'text-red-400';

  const passColor =
    stats.passRate >= 80 ? 'text-emerald-400' : stats.passRate >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="absolute top-[37px] left-0 right-[72px] z-[9] flex items-center gap-0 bg-slate-950/70 backdrop-blur border-b border-slate-800/60 px-3 h-[22px] text-[9px] select-none">
      <span className="text-slate-600 uppercase tracking-widest mr-2">{filter.taxYear}</span>

      <span className="text-slate-600 mr-1">IAAO</span>
      <span className={`font-mono font-bold mr-2 ${passColor}`}>
        {stats.passing}/{stats.total} pass ({stats.passRate.toFixed(0)}%)
      </span>

      <span className="text-slate-800 mr-2">|</span>

      <span className="text-slate-600 mr-1">MED</span>
      <span className={`font-mono font-bold mr-2 ${medColor}`}>{stats.cwMed.toFixed(3)}</span>

      <span className="text-slate-800 mr-2">|</span>

      <span className="text-slate-600 mr-1">COD</span>
      <span className={`font-mono font-bold mr-2 ${codColor}`}>{stats.cwCod.toFixed(1)}</span>

      <span className="text-slate-800 mr-2">|</span>

      {stats.criticalCount > 0 && (
        <>
          <span className="text-red-500 font-semibold mr-1">{stats.criticalCount} critical</span>
          {stats.worstNbhd && (
            <span className="text-slate-600 font-mono mr-2">
              (worst: <span className="text-red-400">{stats.worstNbhd.neighborhoodCode}</span>{' '}
              {stats.worstNbhd.stats.medianRatio.toFixed(3)})
            </span>
          )}
          <span className="text-slate-800 mr-2">|</span>
        </>
      )}

      {selectedNs && (
        <>
          <span className="text-terra-cyan font-mono font-bold mr-1">{selectedNs.neighborhoodCode}</span>
          <span
            className={`font-mono mr-1 ${
              selectedNs.stats.medianRatio >= 0.95 && selectedNs.stats.medianRatio <= 1.05
                ? 'text-emerald-400'
                : selectedNs.stats.medianRatio >= 0.90 && selectedNs.stats.medianRatio <= 1.10
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {selectedNs.stats.medianRatio.toFixed(3)}
          </span>
          <span className="text-slate-600 mr-1">n={selectedNs.saleCount}</span>
          <span className="text-slate-800 mr-2">|</span>
        </>
      )}

      <span className="text-slate-700 ml-auto text-[8px]">press ? for shortcuts</span>
    </div>
  );
}

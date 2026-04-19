import type { NeighborhoodStat, YoyChangePoint } from '../types/geoforge.types';

export interface NbhdBurdenRow {
  neighborhoodCode: string;
  neighborhoodName: string;
  medianRatio: number;
  parcelCount: number;
  totalAV: number;
  totalTVEst: number;
  avShare: number;
  tvShare: number;
  burdenShiftPct: number;
  burdenShiftDollars: number | null;
}

export interface LevyParitySummary {
  rows: NbhdBurdenRow[];
  totalAV: number;
  totalTVEst: number;
  countyRatio: number;
  overPaidNbhds: number;
  underPaidNbhds: number;
  maxOverPaidPct: number;
  maxUnderPaidPct: number;
  totalBurdenShiftedDollars: number | null;
}

export function computeLevyParity(
  stats: NeighborhoodStat[],
  avData: YoyChangePoint[],
  levyAmount: number | null,
): LevyParitySummary | null {
  if (stats.length === 0 || avData.length === 0) return null;

  const avMap = new Map(avData.map((r) => [r.neighborhoodCode, r]));

  const joined = stats
    .map((ns) => {
      const av = avMap.get(ns.neighborhoodCode);
      if (!av || av.parcelCount === 0 || av.currAvgAv <= 0) return null;
      const totalAV = av.parcelCount * av.currAvgAv;
      const ratio = ns.stats.medianRatio > 0 ? ns.stats.medianRatio : 1;
      const totalTVEst = totalAV / ratio;
      return { ns, totalAV, totalTVEst, parcelCount: av.parcelCount };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (joined.length === 0) return null;

  const sumAV = joined.reduce((s, r) => s + r.totalAV, 0);
  const sumTV = joined.reduce((s, r) => s + r.totalTVEst, 0);

  const rows: NbhdBurdenRow[] = joined
    .map(({ ns, totalAV, totalTVEst, parcelCount }) => {
      const avShare = totalAV / sumAV;
      const tvShare = totalTVEst / sumTV;
      const burdenShiftPct = (avShare - tvShare) * 100;
      const burdenShiftDollars = levyAmount !== null ? (avShare - tvShare) * levyAmount : null;
      return {
        neighborhoodCode: ns.neighborhoodCode,
        neighborhoodName: ns.neighborhoodName,
        medianRatio: ns.stats.medianRatio,
        parcelCount,
        totalAV,
        totalTVEst,
        avShare,
        tvShare,
        burdenShiftPct,
        burdenShiftDollars,
      };
    })
    .sort((a, b) => b.burdenShiftPct - a.burdenShiftPct);

  const over = rows.filter((r) => r.burdenShiftPct > 0.05);
  const under = rows.filter((r) => r.burdenShiftPct < -0.05);
  const maxOverPaidPct = over.length > 0 ? Math.max(...over.map((r) => r.burdenShiftPct)) : 0;
  const maxUnderPaidPct = under.length > 0 ? Math.abs(Math.min(...under.map((r) => r.burdenShiftPct))) : 0;
  const totalBurdenShiftedDollars =
    levyAmount !== null
      ? over.reduce((s, r) => s + (r.burdenShiftDollars ?? 0), 0)
      : null;

  return {
    rows,
    totalAV: sumAV,
    totalTVEst: sumTV,
    countyRatio: sumAV / sumTV,
    overPaidNbhds: over.length,
    underPaidNbhds: under.length,
    maxOverPaidPct,
    maxUnderPaidPct,
    totalBurdenShiftedDollars,
  };
}

export function fmtM(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

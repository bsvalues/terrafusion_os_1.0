import type { BentonMethodStats } from '../types/geoforge.types';

export const COD_BANDS = { ok: 15, watch: 20 } as const;
export const PRD_BANDS = { loOk: 0.98, hiOk: 1.03 } as const;
export const PRB_BAND = 0.05 as const;

export function codBand(cod: number): 'ok' | 'watch' | 'critical' {
  if (cod <= COD_BANDS.ok) return 'ok';
  if (cod <= COD_BANDS.watch) return 'watch';
  return 'critical';
}

export function prdBand(prd: number): 'ok' | 'watch' | 'critical' {
  if (prd >= PRD_BANDS.loOk && prd <= PRD_BANDS.hiOk) return 'ok';
  if (prd >= 0.95 && prd <= 1.06) return 'watch';
  return 'critical';
}

export function prbBand(prb: number): 'ok' | 'watch' | 'critical' {
  const abs = Math.abs(prb);
  if (abs < PRB_BAND) return 'ok';
  if (abs < 0.10) return 'watch';
  return 'critical';
}

export function radarNormalize(stats: BentonMethodStats) {
  const codScore = Math.max(0, 1 - stats.cod / 30);
  const prdScore = 1 - Math.abs(stats.prd - 1.0) / 0.10;
  const prbScore = 1 - Math.abs(stats.prb) / 0.10;
  const medianScore = 1 - Math.abs(stats.medianRatio - 1.0) / 0.20;
  const veiScore = Math.max(0, 1 - Math.abs(stats.vei) / 0.10);
  const aadScore = Math.max(0, 1 - stats.cv / 0.30);
  return {
    medianRatio: Math.max(0, Math.min(1, medianScore)),
    cod: Math.max(0, Math.min(1, codScore)),
    prd: Math.max(0, Math.min(1, prdScore)),
    prb: Math.max(0, Math.min(1, prbScore)),
    vei: Math.max(0, Math.min(1, veiScore)),
    aad: Math.max(0, Math.min(1, aadScore)),
  };
}

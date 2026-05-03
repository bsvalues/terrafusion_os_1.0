import type { NeighborhoodStat } from '../types/geoforge.types';

export interface RatioCliff {
  codeA: string;
  nameA: string;
  codeB: string;
  nameB: string;
  ratioA: number;
  ratioB: number;
  delta: number; // absolute ratio difference (always positive)
  codA: number;
  codB: number;
  distanceMi: number; // centroid-to-centroid distance
  severity: 'critical' | 'major' | 'moderate';
}

function haversineDistMi(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function detectRatioCliffs(
  stats: NeighborhoodStat[],
  proximityMi = 5.0,
  minSales = 5,
): RatioCliff[] {
  const qualified = stats.filter((ns) => ns.saleCount >= minSales);
  const cliffs: RatioCliff[] = [];

  for (let i = 0; i < qualified.length; i++) {
    for (let j = i + 1; j < qualified.length; j++) {
      const a = qualified[i];
      const b = qualified[j];
      const dist = haversineDistMi(a.centroidLat, a.centroidLng, b.centroidLat, b.centroidLng);
      if (dist > proximityMi) continue;

      const delta = Math.abs(a.stats.medianRatio - b.stats.medianRatio);
      if (delta < 0.05) continue; // not a cliff — noise

      const severity: RatioCliff['severity'] =
        delta >= 0.20 ? 'critical' : delta >= 0.12 ? 'major' : 'moderate';

      cliffs.push({
        codeA: a.neighborhoodCode,
        nameA: a.neighborhoodName,
        codeB: b.neighborhoodCode,
        nameB: b.neighborhoodName,
        ratioA: a.stats.medianRatio,
        ratioB: b.stats.medianRatio,
        delta,
        codA: a.stats.cod,
        codB: b.stats.cod,
        distanceMi: dist,
        severity,
      });
    }
  }

  // Sort by delta descending — worst cliffs first
  return cliffs.sort((a, b) => b.delta - a.delta);
}

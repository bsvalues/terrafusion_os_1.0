export function makeCircleGeoJson(
  lat: number,
  lng: number,
  radiusMi: number,
): GeoJSON.FeatureCollection {
  const steps = 64;
  const radiusM = radiusMi * 1609.34;
  const latDeg = radiusM / 111_000;
  const lngDeg = radiusM / (111_000 * Math.cos((lat * Math.PI) / 180));
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([lng + lngDeg * Math.cos(a), lat + latDeg * Math.sin(a)]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}

export function haversineDistanceMi(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
}

export function computeCod(ratios: number[]): number {
  if (ratios.length === 0) return 0;
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = computeMedian(sorted);
  if (median === 0) return 0;
  const mad = sorted.reduce((sum, r) => sum + Math.abs(r - median), 0) / sorted.length;
  return (mad / median) * 100;
}

export function codColor(cod: number): string {
  if (cod <= 10) return '#22c55e';
  if (cod <= 15) return '#84cc16';
  if (cod <= 20) return '#eab308';
  if (cod <= 25) return '#f97316';
  return '#ef4444';
}

export function medianRatioColor(ratio: number): string {
  if (ratio < 0.80) return '#1d4ed8';
  if (ratio < 0.90) return '#60a5fa';
  if (ratio < 0.95) return '#93c5fd';
  if (ratio <= 1.05) return '#f0fdf4';
  if (ratio <= 1.10) return '#fca5a5';
  if (ratio <= 1.20) return '#f87171';
  return '#b91c1c';
}

export function ratioPointColor(ratio: number): string {
  if (ratio < 0.85) return '#3b82f6';
  if (ratio < 0.95) return '#93c5fd';
  if (ratio <= 1.05) return '#22c55e';
  if (ratio <= 1.15) return '#fbbf24';
  return '#ef4444';
}

export function salePointRadius(price: number): number {
  const mn = 50_000, mx = 1_000_000;
  const clamped = Math.max(mn, Math.min(mx, price));
  return 4 + ((clamped - mn) / (mx - mn)) * 10;
}

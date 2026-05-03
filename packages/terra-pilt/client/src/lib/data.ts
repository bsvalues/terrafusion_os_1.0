// Shared types + helpers for terra-pilt client.
// Minimal surface to satisfy imports; backend contracts still need reconciling
// (see docs/evidence/2026-04-17-terra-pilt-v1-phase1.md).

export interface DistributionData {
  district: string;
  amount: number;
  percentage?: number;
  color?: string;
}

export interface PiltReceiptData {
  id?: string | number;
  district: string;
  amount: number;
  year: number;
  date?: string;
  status?: string;
}

export const CHART_COLORS: readonly string[] = [
  '#0891b2',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
];

/** Attach a `percentage` field to each row based on total `amount`. */
export function calculatePercentages(rows: DistributionData[]): DistributionData[] {
  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  if (total <= 0) return rows.map((r) => ({ ...r, percentage: 0 }));
  return rows.map((r) => ({
    ...r,
    percentage: Math.round(((r.amount || 0) / total) * 1000) / 10,
  }));
}

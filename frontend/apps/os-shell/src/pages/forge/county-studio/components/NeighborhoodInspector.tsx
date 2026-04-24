// frontend/apps/os-shell/src/pages/forge/county-studio/components/NeighborhoodInspector.tsx
//
// Right-rail companion for drillLevel === 'neighborhood'. Shows the selected
// neighborhood's rollup aggregates with IAAO compliance lamps.

import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { RollupComplianceStatus } from '../types/countyStudio.types';

const MetricRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '5px 0', borderBottom: '1px solid hsl(var(--tf-border))',
  }}>
    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'hsl(var(--tf-fg))' }}>{value}</span>
  </div>
);

function complianceLamp(status: RollupComplianceStatus): { color: string; label: string } {
  switch (status) {
    case 'IaaoCompliant':      return { color: '#22c55e', label: 'IAAO Compliant' };
    case 'MarginalCompliance': return { color: '#f59e0b', label: 'Marginal Compliance' };
    case 'NonCompliant':       return { color: '#ef4444', label: 'Non-compliant' };
  }
}

export function NeighborhoodInspector() {
  const { neighborhoodRollup, selectedNeighborhood } = useCountyStudioStore();
  const row = selectedNeighborhood
    ? neighborhoodRollup.find((r) => r.neighborhoodCode === selectedNeighborhood)
    : null;

  if (!row) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a neighborhood to inspect.
      </div>
    );
  }

  const lamp = complianceLamp(row.complianceStatus);
  const medianDelta = row.medianRatio !== null ? Math.abs(row.medianRatio - 1.0) : null;
  const medianColor = medianDelta === null
    ? 'hsl(var(--tf-muted))'
    : medianDelta > 0.1
      ? '#ef4444'
      : medianDelta > 0.05
        ? '#f59e0b'
        : '#22c55e';
  const codColor = row.cod === null ? 'hsl(var(--tf-muted))' : row.cod > 20 ? '#ef4444' : row.cod > 15 ? '#f59e0b' : '#22c55e';
  const prdColor = row.prd === null ? 'hsl(var(--tf-muted))' : row.prd >= 0.98 && row.prd <= 1.03 ? '#22c55e' : '#f59e0b';
  const stabColor = row.stabilityScore < 60 ? '#ef4444' : row.stabilityScore < 80 ? '#f59e0b' : '#22c55e';

  return (
    <div data-testid="neighborhood-inspector" style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{row.neighborhoodName}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {row.city} · {row.segmentCount} segments · {row.parcelCount.toLocaleString()} parcels
      </div>

      <div
        data-testid="nbhd-compliance-lamp"
        data-status={row.complianceStatus}
        style={{
          padding: '6px 8px', borderRadius: 4, fontSize: 11, marginBottom: 12,
          background: lamp.color + '22', color: lamp.color, fontWeight: 600,
        }}
      >
        {lamp.label}
      </div>

      <MetricRow label="Median Ratio"    value={row.medianRatio === null ? '—' : row.medianRatio.toFixed(3)} color={medianColor} />
      <MetricRow label="COD"             value={row.cod === null ? '—' : row.cod.toFixed(1)} color={codColor} />
      <MetricRow label="PRD"             value={row.prd === null ? '—' : row.prd.toFixed(3)} color={prdColor} />
      <MetricRow label="Stability Score" value={row.stabilityScore.toFixed(0)} color={stabColor} />
      <MetricRow label="Risk Score"      value={row.riskScore.toFixed(0)} />
      <MetricRow label="Exceptions"      value={String(row.exceptionCount)} />
      <MetricRow label="Exception Rate"  value={`${(row.exceptionRate * 100).toFixed(1)}%`} />
    </div>
  );
}

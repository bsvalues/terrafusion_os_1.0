import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const MetricRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 0',
      borderBottom: '1px solid hsl(var(--tf-border))',
    }}
  >
    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'hsl(var(--tf-fg))' }}>{value}</span>
  </div>
);

export function ObjectInspector() {
  const { segments, selectedSegmentId } = useCountyStudioStore();
  const seg = segments.find((s) => s.segmentId === selectedSegmentId);

  if (!seg) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a segment to inspect.
      </div>
    );
  }

  const codOk = seg.cod <= 15;
  const prdOk = seg.prd >= 0.98 && seg.prd <= 1.03;

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{seg.name}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {seg.segmentType} · {seg.parcelCount.toLocaleString()} parcels
      </div>

      <MetricRow label="Median Ratio" value={seg.medianRatio.toFixed(3)} />
      <MetricRow
        label="COD"
        value={seg.cod.toFixed(1)}
        color={codOk ? '#22c55e' : '#ef4444'}
      />
      <MetricRow
        label="PRD"
        value={seg.prd.toFixed(3)}
        color={prdOk ? '#22c55e' : '#f59e0b'}
      />
      <MetricRow
        label="Stability Score"
        value={String(seg.stabilityScore)}
        color={seg.stabilityScore < 60 ? '#ef4444' : seg.stabilityScore < 80 ? '#f59e0b' : '#22c55e'}
      />
      <MetricRow label="Risk Score" value={String(seg.riskScore)} />
      <MetricRow label="Exceptions" value={String(seg.exceptionCount)} />

      <div style={{ marginTop: 12 }}>
        {seg.stabilityScore < 60 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#ef444422',
              borderRadius: 4,
              fontSize: 11,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            ⚠ Segment instability — stability score below 60
          </div>
        )}
        {seg.parcelCount < 30 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#f59e0b22',
              borderRadius: 4,
              fontSize: 11,
              color: '#f59e0b',
              marginBottom: 4,
            }}
          >
            ⚠ Low sample warning — n &lt; 30
          </div>
        )}
        {seg.cod > 20 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#ef444422',
              borderRadius: 4,
              fontSize: 11,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            ⚠ COD exceeds 20 — review before publishing
          </div>
        )}
      </div>
    </div>
  );
}

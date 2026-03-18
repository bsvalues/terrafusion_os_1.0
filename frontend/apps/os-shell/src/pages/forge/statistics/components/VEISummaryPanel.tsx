import React from 'react';

// TFR-016: Summary panel for all VEI metrics

interface VEIMetrics {
  cod: number;
  prd: number;
  prb: number;
  tierSlope: number;
  medianRatio: number;
  sampleSize: number;
}

interface VEISummaryPanelProps {
  metrics: VEIMetrics;
  style?: React.CSSProperties;
}

function statusIcon(pass: boolean): string {
  return pass ? '\u2705' : '\u274C';
}

export default function VEISummaryPanel({ metrics, style }: VEISummaryPanelProps) {
  const codPass = metrics.cod <= 15;
  const prdPass = metrics.prd >= 0.98 && metrics.prd <= 1.03;
  const prbPass = Math.abs(metrics.prb) <= 0.05;
  const slopePass = Math.abs(metrics.tierSlope) <= 0.05;
  const ratioPass = metrics.medianRatio >= 0.90 && metrics.medianRatio <= 1.10;

  const passCount = [codPass, prdPass, prbPass, slopePass, ratioPass].filter(Boolean).length;
  const overallPass = passCount >= 4;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${overallPass ? '#22c55e' : '#ef4444'}33`,
        backgroundColor: overallPass ? '#22c55e08' : '#ef444408',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>VEI Summary</h3>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: overallPass ? '#22c55e' : '#ef4444',
          }}
        >
          {passCount}/5 IAAO Standards Met
        </span>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
        <div>
          {statusIcon(ratioPass)} Median Ratio: {metrics.medianRatio.toFixed(3)} (0.90-1.10)
        </div>
        <div>
          {statusIcon(codPass)} COD: {metrics.cod.toFixed(2)} (&le;15)
        </div>
        <div>
          {statusIcon(prdPass)} PRD: {metrics.prd.toFixed(4)} (0.98-1.03)
        </div>
        <div>
          {statusIcon(prbPass)} PRB: {metrics.prb.toFixed(4)} (&plusmn;0.05)
        </div>
        <div>
          {statusIcon(slopePass)} Tier Slope: {metrics.tierSlope.toFixed(4)} (&plusmn;0.05)
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        Sample size: {metrics.sampleSize.toLocaleString()} qualified sales
      </div>
    </div>
  );
}

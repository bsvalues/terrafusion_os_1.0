import React from 'react';

// TFR-015: Tier slope detailed drilldown dialog

interface TierSlopeBreakdown {
  tier: string; // e.g. 'Q1', 'Q2', 'Q3', 'Q4'
  valueRange: string;
  medianRatio: number;
  sampleSize: number;
  ratioSpread: number;
}

interface TierSlopeDrilldownProps {
  open: boolean;
  onClose: () => void;
  data: TierSlopeBreakdown[];
  overallSlope: number;
}

export default function TierSlopeDrilldown({
  open,
  onClose,
  data,
  overallSlope,
}: TierSlopeDrilldownProps) {
  if (!open) return null;

  const slopeDirection =
    overallSlope > 0.02 ? 'Progressive' : overallSlope < -0.02 ? 'Regressive' : 'Neutral';
  const slopeColor =
    Math.abs(overallSlope) <= 0.05 ? '#22c55e' : Math.abs(overallSlope) <= 0.10 ? '#eab308' : '#ef4444';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 680,
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Tier Slope Drilldown
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
          >
            X
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Overall Slope</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: slopeColor }}>
              {overallSlope > 0 ? '+' : ''}
              {overallSlope.toFixed(4)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Assessment Pattern</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: slopeColor }}>{slopeDirection}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Tier</th>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Value Range</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Median Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Spread</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Sample</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.tier} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{row.tier}</td>
                <td style={{ padding: 8, color: '#94a3b8' }}>{row.valueRange}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.medianRatio.toFixed(3)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.ratioSpread.toFixed(3)}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#94a3b8' }}>{row.sampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

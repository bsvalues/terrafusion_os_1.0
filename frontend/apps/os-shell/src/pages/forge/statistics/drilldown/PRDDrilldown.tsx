import React from 'react';

// TFR-015: PRD detailed drilldown dialog

interface PRDBreakdown {
  neighborhood: string;
  prd: number;
  sampleSize: number;
  weightedMeanRatio: number;
  meanRatio: number;
}

interface PRDDrilldownProps {
  open: boolean;
  onClose: () => void;
  data: PRDBreakdown[];
  overallPRD: number;
}

export default function PRDDrilldown({ open, onClose, data, overallPRD }: PRDDrilldownProps) {
  if (!open) return null;

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
            PRD Drilldown (Overall: {overallPRD.toFixed(4)})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>
          IAAO acceptable range: 0.98 - 1.03. PRD &gt; 1.03 indicates regressive assessments.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Neighborhood</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>PRD</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Wt. Mean Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Mean Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Sample</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const inRange = row.prd >= 0.98 && row.prd <= 1.03;
              return (
                <tr key={row.neighborhood} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: 8 }}>{row.neighborhood}</td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: 'right',
                      fontWeight: 600,
                      color: inRange ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {row.prd.toFixed(4)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{row.weightedMeanRatio.toFixed(3)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{row.meanRatio.toFixed(3)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#94a3b8' }}>{row.sampleSize}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

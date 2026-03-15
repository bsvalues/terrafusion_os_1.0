import React from 'react';

// TFR-015: COD detailed drilldown dialog

interface CODBreakdown {
  neighborhood: string;
  cod: number;
  sampleSize: number;
  medianRatio: number;
  meanRatio: number;
  aad: number; // average absolute deviation
}

interface CODDrilldownProps {
  open: boolean;
  onClose: () => void;
  data: CODBreakdown[];
  overallCOD: number;
}

export default function CODDrilldown({ open, onClose, data, overallCOD }: CODDrilldownProps) {
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
          width: 720,
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
            COD Drilldown (Overall: {overallCOD.toFixed(2)})
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

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Neighborhood</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>COD</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>AAD</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Median Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Mean Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Sample</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.neighborhood} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: 8 }}>{row.neighborhood}</td>
                <td
                  style={{
                    padding: 8,
                    textAlign: 'right',
                    fontWeight: 600,
                    color: row.cod <= 15 ? '#22c55e' : row.cod <= 20 ? '#eab308' : '#ef4444',
                  }}
                >
                  {row.cod.toFixed(2)}
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.aad.toFixed(4)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.medianRatio.toFixed(3)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.meanRatio.toFixed(3)}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#94a3b8' }}>{row.sampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

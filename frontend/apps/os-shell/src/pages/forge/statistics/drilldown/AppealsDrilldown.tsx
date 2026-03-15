import React from 'react';

// TFR-015: Appeals risk detailed drilldown dialog

interface AppealRecord {
  parcelId: string;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  riskScore: number;
  neighborhood: string;
  propertyType: string;
}

interface AppealsDrilldownProps {
  open: boolean;
  onClose: () => void;
  data: AppealRecord[];
  totalAtRisk: number;
}

function riskColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 50) return '#eab308';
  return '#22c55e';
}

export default function AppealsDrilldown({ open, onClose, data, totalAtRisk }: AppealsDrilldownProps) {
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
          width: 800,
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
            Appeals Risk Drilldown ({totalAtRisk.toLocaleString()} at risk)
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
          >
            X
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Parcel ID</th>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Neighborhood</th>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Type</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Assessed</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Sale Price</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Ratio</th>
              <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.parcelId} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{row.parcelId}</td>
                <td style={{ padding: 8 }}>{row.neighborhood}</td>
                <td style={{ padding: 8, color: '#94a3b8' }}>{row.propertyType}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>
                  ${row.assessedValue.toLocaleString()}
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>
                  ${row.salePrice.toLocaleString()}
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>{row.ratio.toFixed(3)}</td>
                <td
                  style={{
                    padding: 8,
                    textAlign: 'right',
                    fontWeight: 600,
                    color: riskColor(row.riskScore),
                  }}
                >
                  {row.riskScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

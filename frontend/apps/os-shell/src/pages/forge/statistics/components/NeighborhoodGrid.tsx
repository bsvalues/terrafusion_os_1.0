import React from 'react';

// TFR-016: Neighborhood comparison grid showing ratios by neighborhood

interface NeighborhoodRatio {
  neighborhood: string;
  medianRatio: number;
  cod: number;
  sampleSize: number;
}

interface NeighborhoodGridProps {
  neighborhoods: NeighborhoodRatio[];
}

function ratioColor(ratio: number): string {
  const dev = Math.abs(ratio - 1.0);
  if (dev <= 0.05) return '#22c55e';
  if (dev <= 0.10) return '#eab308';
  return '#ef4444';
}

function codColor(cod: number): string {
  if (cod <= 15) return '#22c55e';
  if (cod <= 20) return '#eab308';
  return '#ef4444';
}

export default function NeighborhoodGrid({ neighborhoods }: NeighborhoodGridProps) {
  if (neighborhoods.length === 0) {
    return (
      <div style={{ padding: 16, color: '#94a3b8', fontSize: 13 }}>
        No neighborhood data available.
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>
        Neighborhood Comparison
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
        }}
      >
        {neighborhoods.map((n) => (
          <div
            key={n.neighborhood}
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid #1e293b',
              backgroundColor: '#0f172a',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{n.neighborhood}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>Median Ratio</span>
              <span style={{ fontWeight: 600, color: ratioColor(n.medianRatio) }}>
                {n.medianRatio.toFixed(3)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>COD</span>
              <span style={{ fontWeight: 600, color: codColor(n.cod) }}>{n.cod.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#94a3b8' }}>Sales</span>
              <span>{n.sampleSize}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

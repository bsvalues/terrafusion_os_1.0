import React from 'react';

// BIV-114: Market analytics dashboard - key market metrics with trend indicators

interface MarketMetric {
  label: string;
  value: string;
  previousValue?: string;
  trend: 'up' | 'down' | 'flat';
  changePercent?: number;
}

interface MarketAnalyticsDashboardProps {
  metrics: MarketMetric[];
  asOfDate: string;
  loading: boolean;
}

const trendArrows: Record<string, string> = {
  up: '\u25B2',
  down: '\u25BC',
  flat: '\u25B6',
};

const trendColors: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  flat: '#94a3b8',
};

export default function MarketAnalyticsDashboard({
  metrics,
  asOfDate,
  loading,
}: MarketAnalyticsDashboardProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading market analytics...
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Market Analytics</h2>
        <span style={{ fontSize: 12, color: '#64748b' }}>As of {asOfDate}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              padding: 16,
              borderRadius: 8,
              border: '1px solid #1e293b',
              backgroundColor: '#0f172a',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{metric.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{metric.value}</span>
              <span
                style={{
                  fontSize: 13,
                  color: trendColors[metric.trend],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {trendArrows[metric.trend]}
                {metric.changePercent != null && (
                  <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
                )}
              </span>
            </div>
            {metric.previousValue && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Previous: {metric.previousValue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

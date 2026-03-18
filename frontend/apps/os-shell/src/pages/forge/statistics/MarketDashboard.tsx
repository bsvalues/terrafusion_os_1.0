import React from 'react';

// BIV-115: Market condition indicator with real-time market status

type MarketCondition = 'Hot' | 'Warm' | 'Normal' | 'Cool' | 'Cold';

interface MarketStatus {
  condition: MarketCondition;
  score: number; // 0-100
  description: string;
  lastUpdated: string;
  signals: { label: string; value: string; strength: 'positive' | 'neutral' | 'negative' }[];
}

interface MarketDashboardProps {
  status: MarketStatus | null;
  loading: boolean;
}

const conditionConfig: Record<MarketCondition, { color: string; bg: string }> = {
  Hot: { color: '#ef4444', bg: '#ef444415' },
  Warm: { color: '#f97316', bg: '#f9731615' },
  Normal: { color: '#22c55e', bg: '#22c55e15' },
  Cool: { color: '#3b82f6', bg: '#3b82f615' },
  Cold: { color: '#6366f1', bg: '#6366f115' },
};

const signalColors: Record<string, string> = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
};

export default function MarketDashboard({ status, loading }: MarketDashboardProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Analyzing market conditions...
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        No market status data available.
      </div>
    );
  }

  const config = conditionConfig[status.condition];

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
        Market Condition Monitor
      </h2>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Condition indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 180,
            padding: 24,
            borderRadius: 12,
            border: `2px solid ${config.color}`,
            backgroundColor: config.bg,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 800, color: config.color }}>
            {status.condition}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Score: {status.score}/100
          </div>
          <div
            style={{
              marginTop: 8,
              height: 6,
              width: '100%',
              borderRadius: 3,
              backgroundColor: '#1e293b',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${status.score}%`,
                backgroundColor: config.color,
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#cbd5e1' }}>
            {status.description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
            }}
          >
            {status.signals.map((signal) => (
              <div
                key={signal.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                }}
              >
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{signal.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: signalColors[signal.strength] }}>
                  {signal.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: '#64748b' }}>
            Last updated: {status.lastUpdated}
          </div>
        </div>
      </div>
    </div>
  );
}

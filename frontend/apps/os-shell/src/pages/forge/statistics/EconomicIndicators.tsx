import React from 'react';

// BIV-122: Regional economic data display

interface EconomicMetric {
  category: 'population' | 'income' | 'employment' | 'housing';
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  period: string;
}

interface EconomicIndicatorsProps {
  metrics: EconomicMetric[];
  region: string;
  loading: boolean;
}

const categoryLabels: Record<string, string> = {
  population: 'Population',
  income: 'Income',
  employment: 'Employment',
  housing: 'Housing Starts',
};

const categoryIcons: Record<string, string> = {
  population: '\uD83D\uDC65',
  income: '\uD83D\uDCB0',
  employment: '\uD83D\uDCBC',
  housing: '\uD83C\uDFE0',
};

const trendColors: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  flat: '#94a3b8',
};

const trendArrows: Record<string, string> = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2194',
};

export default function EconomicIndicators({ metrics, region, loading }: EconomicIndicatorsProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading economic indicators...
      </div>
    );
  }

  const grouped = metrics.reduce(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<string, EconomicMetric[]>,
  );

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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Economic Indicators</h2>
        <span style={{ fontSize: 12, color: '#64748b' }}>Region: {region}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {Object.entries(grouped).map(([category, items]) => (
          <div
            key={category}
            style={{
              padding: 16,
              borderRadius: 8,
              border: '1px solid #1e293b',
              backgroundColor: '#0f172a',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
              {categoryIcons[category]} {categoryLabels[category] ?? category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{item.period}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: trendColors[item.trend] }}>
                      {trendArrows[item.trend]} {item.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

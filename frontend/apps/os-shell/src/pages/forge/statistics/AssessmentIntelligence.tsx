import React from 'react';

// BIV-109: Assessment intelligence - outliers, appeal risk, market trends

interface OutlierSummary {
  totalOutliers: number;
  totalParcels: number;
  byType: { type: string; count: number }[];
}

interface AppealRiskBucket {
  risk: 'high' | 'medium' | 'low';
  count: number;
  percentage: number;
}

interface MarketTrend {
  indicator: string;
  direction: 'up' | 'down' | 'flat';
  value: string;
  change: string;
}

interface AssessmentIntelligenceProps {
  outliers: OutlierSummary | null;
  appealRisk: AppealRiskBucket[];
  marketTrends: MarketTrend[];
  loading: boolean;
}

const riskColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
};

const directionArrows: Record<string, string> = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2192',
};

export default function AssessmentIntelligence({
  outliers,
  appealRisk,
  marketTrends,
  loading,
}: AssessmentIntelligenceProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading assessment intelligence...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
        Assessment Intelligence
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Outlier detection */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
            Outlier Detection
          </h3>
          {outliers ? (
            <>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                {outliers.totalOutliers.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                of {outliers.totalParcels.toLocaleString()} parcels (
                {((outliers.totalOutliers / outliers.totalParcels) * 100).toFixed(1)}%)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outliers.byType.map((t) => (
                  <div
                    key={t.type}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                  >
                    <span style={{ color: '#94a3b8' }}>{t.type}</span>
                    <span>{t.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No outlier data available</div>
          )}
        </div>

        {/* Appeal risk distribution */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
            Appeal Risk Distribution
          </h3>
          {appealRisk.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {appealRisk.map((bucket) => (
                <div key={bucket.risk}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: riskColors[bucket.risk],
                        textTransform: 'capitalize',
                      }}
                    >
                      {bucket.risk} Risk
                    </span>
                    <span style={{ fontSize: 13 }}>
                      {bucket.count.toLocaleString()} ({bucket.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#1e293b',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${bucket.percentage}%`,
                        backgroundColor: riskColors[bucket.risk],
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No appeal risk data</div>
          )}
        </div>

        {/* Market trend context */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
            Market Trend Context
          </h3>
          {marketTrends.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {marketTrends.map((trend) => (
                <div
                  key={trend.indicator}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{trend.indicator}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{trend.value}</span>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          trend.direction === 'up'
                            ? '#22c55e'
                            : trend.direction === 'down'
                              ? '#ef4444'
                              : '#94a3b8',
                      }}
                    >
                      {directionArrows[trend.direction]} {trend.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No market trends</div>
          )}
        </div>
      </div>
    </div>
  );
}

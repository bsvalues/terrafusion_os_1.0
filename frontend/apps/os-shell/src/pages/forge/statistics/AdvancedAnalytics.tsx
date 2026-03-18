import React, { useState } from 'react';

// TFR-114: Advanced analytics dashboard with tabbed interface

type AnalyticsTab = 'Clustering' | 'Forecast' | 'Outliers' | 'Ratio Trends';

interface SparklineData {
  values: number[];
  label: string;
}

interface ClusterSummary {
  clusterId: number;
  size: number;
  medianValue: number;
  medianRatio: number;
  label: string;
}

interface ForecastPoint {
  period: string;
  actual?: number;
  predicted: number;
  lower: number;
  upper: number;
}

interface OutlierRecord {
  parcelId: string;
  ratio: number;
  deviation: number;
  reason: string;
}

interface RatioTrend {
  period: string;
  medianRatio: number;
  sparkline: number[];
}

interface AdvancedAnalyticsProps {
  clusters: ClusterSummary[];
  forecasts: ForecastPoint[];
  outliers: OutlierRecord[];
  ratioTrends: RatioTrend[];
  sparklines: SparklineData[];
  loading: boolean;
}

function MiniSparkline({ values, width = 80, height = 24 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
    </svg>
  );
}

const tabs: AnalyticsTab[] = ['Clustering', 'Forecast', 'Outliers', 'Ratio Trends'];

export default function AdvancedAnalytics({
  clusters,
  forecasts,
  outliers,
  ratioTrends,
  sparklines,
  loading,
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Clustering');

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Running advanced analytics...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Advanced Analytics</h2>

      {/* Sparkline summary row */}
      {sparklines.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {sparklines.map((s) => (
            <div
              key={s.label}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #1e293b',
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</span>
              <MiniSparkline values={s.values} />
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          marginBottom: 16,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#e2e8f0' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Clustering' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clusters.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No clustering results available.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Cluster</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Size</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Med. Value</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Med. Ratio</th>
                </tr>
              </thead>
              <tbody>
                {clusters.map((c) => (
                  <tr key={c.clusterId} style={{ borderBottom: '1px solid #0f172a' }}>
                    <td style={{ padding: 8 }}>{c.label}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{c.size.toLocaleString()}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>${c.medianValue.toLocaleString()}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{c.medianRatio.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Forecast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {forecasts.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No forecast data available.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Period</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Actual</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Predicted</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Range</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f) => (
                  <tr key={f.period} style={{ borderBottom: '1px solid #0f172a' }}>
                    <td style={{ padding: 8 }}>{f.period}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      {f.actual != null ? f.actual.toFixed(3) : '-'}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{f.predicted.toFixed(3)}</td>
                    <td style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>
                      {f.lower.toFixed(3)} - {f.upper.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Outliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {outliers.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No outliers detected.</div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                {outliers.length} outlier{outliers.length !== 1 ? 's' : ''} detected
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Parcel ID</th>
                    <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Ratio</th>
                    <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Deviation</th>
                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {outliers.map((o) => (
                    <tr key={o.parcelId} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: 8, fontFamily: 'monospace' }}>{o.parcelId}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{o.ratio.toFixed(3)}</td>
                      <td
                        style={{
                          padding: 8,
                          textAlign: 'right',
                          color: Math.abs(o.deviation) > 0.3 ? '#ef4444' : '#eab308',
                        }}
                      >
                        {o.deviation > 0 ? '+' : ''}
                        {(o.deviation * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: 8, color: '#94a3b8' }}>{o.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {activeTab === 'Ratio Trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ratioTrends.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No ratio trend data available.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Period</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Median Ratio</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#94a3b8', fontWeight: 500 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {ratioTrends.map((t) => (
                  <tr key={t.period} style={{ borderBottom: '1px solid #0f172a' }}>
                    <td style={{ padding: 8 }}>{t.period}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{t.medianRatio.toFixed(3)}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <MiniSparkline values={t.sparkline} width={60} height={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

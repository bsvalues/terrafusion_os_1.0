import React from 'react';

// BIV-088: Assessment-to-sale ratio analysis panel

interface RatioMetrics {
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
  sampleSize: number;
  salesPeriod: string;
}

interface RatioStudyPanelProps {
  ratioData: RatioMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

type ComplianceStatus = 'compliant' | 'marginal' | 'non-compliant';

function getIAAOStatus(metric: string, value: number): ComplianceStatus {
  switch (metric) {
    case 'medianRatio':
      if (value >= 0.90 && value <= 1.10) return 'compliant';
      if (value >= 0.85 && value <= 1.15) return 'marginal';
      return 'non-compliant';
    case 'cod':
      if (value <= 15) return 'compliant';
      if (value <= 20) return 'marginal';
      return 'non-compliant';
    case 'prd':
      if (value >= 0.98 && value <= 1.03) return 'compliant';
      if (value >= 0.95 && value <= 1.05) return 'marginal';
      return 'non-compliant';
    case 'prb':
      if (Math.abs(value) <= 0.05) return 'compliant';
      if (Math.abs(value) <= 0.10) return 'marginal';
      return 'non-compliant';
    default:
      return 'marginal';
  }
}

const statusColors: Record<ComplianceStatus, string> = {
  compliant: '#22c55e',
  marginal: '#eab308',
  'non-compliant': '#ef4444',
};

const statusLabels: Record<ComplianceStatus, string> = {
  compliant: 'IAAO Compliant',
  marginal: 'Marginal',
  'non-compliant': 'Non-Compliant',
};

function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: statusColors[status],
      }}
    >
      {statusLabels[status]}
    </span>
  );
}

function MetricCard({
  label,
  value,
  format,
  metricKey,
}: {
  label: string;
  value: number;
  format: 'ratio' | 'percent' | 'coefficient';
  metricKey: string;
}) {
  const status = getIAAOStatus(metricKey, value);

  const formatted =
    format === 'ratio'
      ? value.toFixed(3)
      : format === 'percent'
        ? `${(value * 100).toFixed(2)}%`
        : value.toFixed(2);

  return (
    <div
      style={{
        border: `1px solid ${statusColors[status]}33`,
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
        background: `${statusColors[status]}08`,
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{formatted}</div>
      <ComplianceBadge status={status} />
    </div>
  );
}

export default function RatioStudyPanel({ ratioData, loading, onRefresh }: RatioStudyPanelProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading ratio study data...
      </div>
    );
  }

  if (!ratioData) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        No ratio study data available.
        <button onClick={onRefresh} style={{ marginLeft: 8, cursor: 'pointer' }}>
          Refresh
        </button>
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Ratio Study Analysis</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            Sample: {ratioData.sampleSize.toLocaleString()} sales | {ratioData.salesPeriod}
          </span>
          <button
            onClick={onRefresh}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MetricCard
          label="Median Ratio"
          value={ratioData.medianRatio}
          format="ratio"
          metricKey="medianRatio"
        />
        <MetricCard
          label="COD"
          value={ratioData.cod}
          format="coefficient"
          metricKey="cod"
        />
        <MetricCard
          label="PRD"
          value={ratioData.prd}
          format="ratio"
          metricKey="prd"
        />
        <MetricCard
          label="PRB"
          value={ratioData.prb}
          format="ratio"
          metricKey="prb"
        />
      </div>
    </div>
  );
}

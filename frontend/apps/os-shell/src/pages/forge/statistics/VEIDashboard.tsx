import React, { useState } from 'react';
import VEIMetricCard from './components/VEIMetricCard';
import VEISummaryPanel from './components/VEISummaryPanel';
import NeighborhoodGrid from './components/NeighborhoodGrid';
import TaxYearSelector from './components/TaxYearSelector';
import SalesWindowSelector from './components/SalesWindowSelector';

// TFR-011: Main Valuation Equity Index (VEI) dashboard

type OutlierMethod = 'IQR' | 'Trim' | 'None';

interface VEIMetrics {
  cod: number;
  prd: number;
  prb: number;
  tierSlope: number;
  medianRatio: number;
  sampleSize: number;
}

interface NeighborhoodRatio {
  neighborhood: string;
  medianRatio: number;
  cod: number;
  sampleSize: number;
}

interface VEIDashboardProps {
  metrics: VEIMetrics | null;
  neighborhoods: NeighborhoodRatio[];
  availableTaxYears: number[];
  loading: boolean;
  onTaxYearChange: (year: number) => void;
  onSalesWindowChange: (months: number) => void;
  onOutlierMethodChange: (method: OutlierMethod) => void;
}

export default function VEIDashboard({
  metrics,
  neighborhoods,
  availableTaxYears,
  loading,
  onTaxYearChange,
  onSalesWindowChange,
  onOutlierMethodChange,
}: VEIDashboardProps) {
  const [outlierMethod, setOutlierMethod] = useState<OutlierMethod>('IQR');

  function handleOutlierToggle(method: OutlierMethod) {
    setOutlierMethod(method);
    onOutlierMethodChange(method);
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading equity analysis...
      </div>
    );
  }

  return (
    <div>
      {/* Header with selectors */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Valuation Equity Index (VEI) Dashboard
        </h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <TaxYearSelector years={availableTaxYears} onChange={onTaxYearChange} />
          <SalesWindowSelector onChange={onSalesWindowChange} />
          {/* Outlier method toggle */}
          <div
            style={{
              display: 'flex',
              borderRadius: 6,
              border: '1px solid #334155',
              overflow: 'hidden',
            }}
          >
            {(['IQR', 'Trim', 'None'] as OutlierMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => handleOutlierToggle(method)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: outlierMethod === method ? '#3b82f6' : 'transparent',
                  color: outlierMethod === method ? '#fff' : '#94a3b8',
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards row */}
      {metrics && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <VEIMetricCard label="COD" value={metrics.cod} iaaoThreshold={15} format="number" />
            <VEIMetricCard
              label="PRD"
              value={metrics.prd}
              iaaoMin={0.98}
              iaaoMax={1.03}
              format="ratio"
            />
            <VEIMetricCard
              label="PRB"
              value={metrics.prb}
              iaaoMin={-0.05}
              iaaoMax={0.05}
              format="ratio"
            />
            <VEIMetricCard
              label="Tier Slope"
              value={metrics.tierSlope}
              iaaoMin={-0.05}
              iaaoMax={0.05}
              format="ratio"
            />
          </div>

          <VEISummaryPanel metrics={metrics} style={{ marginBottom: 24 }} />
        </>
      )}

      {/* Neighborhood comparison grid */}
      <NeighborhoodGrid neighborhoods={neighborhoods} />
    </div>
  );
}

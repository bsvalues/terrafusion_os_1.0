// frontend/apps/os-shell/src/pages/forge/county-studio/components/NeighborhoodInspector.tsx
//
// Right-rail companion for drillLevel === 'neighborhood'. Shows the selected
// neighborhood's rollup aggregates with IAAO compliance lamps.

import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import activateModule from '@/orchestration/moduleActivation';
import type { RollupComplianceStatus } from '../types/countyStudio.types';

const MetricRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '5px 0', borderBottom: '1px solid hsl(var(--tf-border))',
  }}>
    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'hsl(var(--tf-fg))' }}>{value}</span>
  </div>
);

const handoffBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid hsl(var(--tf-border))',
  background: 'transparent',
  color: 'hsl(var(--tf-fg))',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  marginBottom: 6,
};

const disabledHandoffBtnStyle: React.CSSProperties = {
  ...handoffBtnStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
};

function complianceLamp(status: RollupComplianceStatus): { color: string; label: string } {
  switch (status) {
    case 'IaaoCompliant':      return { color: '#22c55e', label: 'IAAO Compliant' };
    case 'MarginalCompliance': return { color: '#f59e0b', label: 'Marginal Compliance' };
    case 'NonCompliant':       return { color: '#ef4444', label: 'Non-compliant' };
  }
}

export function NeighborhoodInspector() {
  const {
    neighborhoodRollup,
    selectedNeighborhood,
    selectedNeighborhoodRevalArea,
    activeStudy,
  } = useCountyStudioStore();
  const row = selectedNeighborhood
    ? neighborhoodRollup.find((r) =>
        r.neighborhoodCode === selectedNeighborhood
        && (selectedNeighborhoodRevalArea === null || r.revalArea === selectedNeighborhoodRevalArea))
    : null;

  if (!row) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a neighborhood to inspect.
      </div>
    );
  }

  const lamp = complianceLamp(row.complianceStatus);
  const medianDelta = row.medianRatio !== null ? Math.abs(row.medianRatio - 1.0) : null;
  const medianColor = medianDelta === null
    ? 'hsl(var(--tf-muted))'
    : medianDelta > 0.1
      ? '#ef4444'
      : medianDelta > 0.05
        ? '#f59e0b'
        : '#22c55e';
  const codColor = row.cod === null ? 'hsl(var(--tf-muted))' : row.cod > 20 ? '#ef4444' : row.cod > 15 ? '#f59e0b' : '#22c55e';
  const prdColor = row.prd === null ? 'hsl(var(--tf-muted))' : row.prd >= 0.98 && row.prd <= 1.03 ? '#22c55e' : '#f59e0b';
  const stabColor = row.stabilityScore < 60 ? '#ef4444' : row.stabilityScore < 80 ? '#f59e0b' : '#22c55e';

  const launchRollupModule = (moduleId: string) => {
    if (!activeStudy) return;
    void activateModule(moduleId, {
      source: 'system',
      metadata: {
        countyId: activeStudy.countyId,
        countyName: activeStudy.countyName,
        taxYear: activeStudy.taxYear,
        neighborhoodCode: row.neighborhoodCode,
        neighborhoodName: row.neighborhoodName,
        revalArea: row.revalArea,
        rollupScope: 'neighborhood',
      },
    });
  };

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    const params = new URLSearchParams({
      studyId: activeStudy.studyId,
      countyId: activeStudy.countyId,
      taxYear: String(activeStudy.taxYear),
      neighborhoodCode: row.neighborhoodCode,
    });
    if (row.revalArea !== null) {
      params.set('revalArea', String(row.revalArea));
    }
    if (activeStudy.countyName) {
      params.set('countyName', activeStudy.countyName);
    }
    window.open(`/forge/atlas-live?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div data-testid="neighborhood-inspector" style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{row.neighborhoodName}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {row.city} · {row.segmentCount} segments · {row.parcelCount.toLocaleString()} parcels
      </div>
      {row.revalArea !== null && (
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginBottom: 8 }}>
          Cycle / reval area: {row.revalArea}
        </div>
      )}
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        Neighborhood is the operative rollup. Drill one level deeper for reval-area segment action.
      </div>

      <div
        data-testid="nbhd-compliance-lamp"
        data-status={row.complianceStatus}
        style={{
          padding: '6px 8px', borderRadius: 4, fontSize: 11, marginBottom: 12,
          background: lamp.color + '22', color: lamp.color, fontWeight: 600,
        }}
      >
        {lamp.label}
      </div>

      <MetricRow label="Median Ratio"    value={row.medianRatio === null ? '—' : row.medianRatio.toFixed(3)} color={medianColor} />
      <MetricRow label="COD"             value={row.cod === null ? '—' : row.cod.toFixed(1)} color={codColor} />
      <MetricRow label="PRD"             value={row.prd === null ? '—' : row.prd.toFixed(3)} color={prdColor} />
      <MetricRow label="Stability Score" value={row.stabilityScore.toFixed(0)} color={stabColor} />
      <MetricRow label="Risk Score"      value={row.riskScore.toFixed(0)} />
      <MetricRow label="Exceptions"      value={String(row.exceptionCount)} />
      <MetricRow label="Exception Rate"  value={`${(row.exceptionRate * 100).toFixed(1)}%`} />

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'hsl(var(--tf-muted))',
            marginBottom: 6,
          }}
        >
          Route Action
        </div>
        <button
          type="button"
          data-testid="neighborhood-inspector-handoff-atlas"
          onClick={handleOpenAtlas}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>See neighborhood on map</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Open Atlas Live scoped to {row.neighborhoodName}.
          </div>
        </button>
        <button
          type="button"
          data-testid="neighborhood-inspector-handoff-salesforge"
          onClick={() => launchRollupModule('sales-forge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Review sales in SalesForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Carry county and neighborhood scope into the live sales lane.
          </div>
        </button>
        <button
          type="button"
          data-testid="neighborhood-inspector-handoff-costforge"
          onClick={() => launchRollupModule('costforge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Open cost review in CostForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Continue correction routing without leaving the operative neighborhood context.
          </div>
        </button>
        <button
          type="button"
          data-testid="neighborhood-inspector-handoff-compsforge"
          onClick={() => launchRollupModule('comps-forge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Open comps in CompsForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Start comp review here, then bind to a parcel subject when you narrow to a reval-area segment.
          </div>
        </button>
        <button
          type="button"
          data-testid="neighborhood-inspector-handoff-workbench-disabled"
          disabled
          title="Parcel-level work opens only from Atlas or segment scope."
          style={disabledHandoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Parcel workbench stays downstream</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Drill to a segment or route through Atlas before opening parcel-level action.
          </div>
        </button>
      </div>
    </div>
  );
}

// frontend/apps/os-shell/src/pages/forge/county-studio/components/CityInspector.tsx
//
// Right-rail companion for drillLevel === 'city'. Shows the selected city's
// rollup aggregates with IAAO compliance lamps. Matches the MetricRow /
// compliance lamp language used by ObjectInspector so the three inspector
// surfaces (city / neighborhood / segment) feel consistent.

import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import activateModule from '@/orchestration/moduleActivation';
import type { RollupComplianceStatus } from '../types/countyStudio.types';
import {
  formatOperationalDescriptor,
  formatOperationalPrimary,
  parseSegmentIdentity,
} from '../utils/segmentIdentity';

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

export function CityInspector() {
  const { cityRollup, selectedCity, activeStudy } = useCountyStudioStore();
  const row = selectedCity ? cityRollup.find((r) => r.city === selectedCity) : null;

  if (!row) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a city to inspect.
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
  const worstSegment = row.worstSegmentName
    ? parseSegmentIdentity(row.worstSegmentName, {
        neighborhoodCode: row.worstSegmentNeighborhoodCode,
        revalArea: row.worstSegmentRevalArea,
        buildingType: row.worstSegmentBuildingType,
        qualityGrade: row.worstSegmentQualityGrade,
      })
    : null;
  const worstSegmentLabel = worstSegment ? formatOperationalPrimary(worstSegment) : row.worstSegmentName;
  const worstSegmentDescriptor = worstSegment ? formatOperationalDescriptor(worstSegment) : null;
  const showWorstDescriptor = !!worstSegmentDescriptor && worstSegmentDescriptor !== worstSegmentLabel;

  const launchRollupModule = (moduleId: string) => {
    if (!activeStudy) return;
    void activateModule(moduleId, {
      source: 'system',
      metadata: {
        countyId: activeStudy.countyId,
        countyName: activeStudy.countyName,
        taxYear: activeStudy.taxYear,
        referenceCity: row.city,
        resetValuationScope: true,
      },
    });
  };

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    const params = new URLSearchParams({
      studyId: activeStudy.studyId,
      countyId: activeStudy.countyId,
      taxYear: String(activeStudy.taxYear),
      referenceCity: row.city,
      resetValuationScope: 'true',
    });
    if (activeStudy.countyName) {
      params.set('countyName', activeStudy.countyName);
    }
    window.open(`/forge/atlas-live?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div data-testid="city-inspector" style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{row.city}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {row.segmentCount} segments · {row.parcelCount.toLocaleString()} parcels
      </div>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        City is overview geography only. Neighborhood and reval area stay the operative county units.
      </div>

      {/* Compliance lamp */}
      <div
        data-testid="city-compliance-lamp"
        data-status={row.complianceStatus}
        style={{
          padding: '6px 8px', borderRadius: 4, fontSize: 11, marginBottom: 12,
          background: lamp.color + '22', color: lamp.color, fontWeight: 600,
        }}
      >
        {lamp.label}
      </div>

      <MetricRow label="Median Ratio" value={row.medianRatio === null ? '—' : row.medianRatio.toFixed(3)} color={medianColor} />
      <MetricRow label="COD"          value={row.cod === null ? '—' : row.cod.toFixed(1)} color={codColor} />
      <MetricRow label="PRD"          value={row.prd === null ? '—' : row.prd.toFixed(3)} color={prdColor} />
      <MetricRow label="Exceptions"   value={String(row.exceptionCount)} />
      <MetricRow label="Exception Rate" value={`${(row.exceptionRate * 100).toFixed(1)}%`} />

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
          data-testid="city-inspector-handoff-atlas"
          onClick={handleOpenAtlas}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>See city on map</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Open Atlas Live with {row.city} as reference metadata.
          </div>
        </button>
        <button
          type="button"
          data-testid="city-inspector-handoff-salesforge"
          onClick={() => launchRollupModule('sales-forge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Review sales in SalesForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Open county context with city as reference, then narrow into neighborhood and reval-area review.
          </div>
        </button>
        <button
          type="button"
          data-testid="city-inspector-handoff-costforge"
          onClick={() => launchRollupModule('costforge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Open cost review in CostForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Keep county scope while routing toward the operative neighborhood and reval-area lane.
          </div>
        </button>
        <button
          type="button"
          data-testid="city-inspector-handoff-compsforge"
          onClick={() => launchRollupModule('comps-forge')}
          style={handoffBtnStyle}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Open comps in CompsForge</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            Keep city as reference until you narrow into operative valuation evidence.
          </div>
        </button>
        <button
          type="button"
          data-testid="city-inspector-handoff-workbench-disabled"
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

      {row.worstSegmentName && (
        <div style={{ marginTop: 12, fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          <div style={{ marginBottom: 4, fontWeight: 600, color: 'hsl(var(--tf-fg))' }}>Worst segment</div>
          <div>
            {worstSegmentLabel}
          </div>
          {showWorstDescriptor && <div>{worstSegmentDescriptor}</div>}
          {row.worstSegmentMedianRatio !== null && (
            <div>Median {row.worstSegmentMedianRatio.toFixed(3)}</div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { ObjectInspector } from './ObjectInspector';
import { CityInspector } from './CityInspector';
import { NeighborhoodInspector } from './NeighborhoodInspector';
import { ScenarioWorksheet } from './ScenarioWorksheet';
import { ScenarioCompareGrid } from './ScenarioCompareGrid';
import { AdjustmentSetPanel } from './AdjustmentSetPanel';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';
import type { CountySegmentDto } from '../types/countyStudio.types';

type RightPanel = 'inspector' | 'scenario' | 'compare' | 'governance';

const PANEL_SUMMARY: Record<RightPanel, string> = {
  inspector: 'Diagnose the active scope and route corrective action.',
  scenario: 'Draft adjustments and preview impact before saving.',
  compare: 'Compare saved scenarios side by side.',
  governance: 'Submit and approve promoted adjustment sets.',
};

function strongestRiskSegment(segments: CountySegmentDto[], selectedSegmentId: string | null): CountySegmentDto | null {
  const selected = selectedSegmentId
    ? segments.find((segment) => segment.segmentId === selectedSegmentId) ?? null
    : null;
  return selected ?? [...segments].sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;
}

function primaryFailure(segment: CountySegmentDto): string {
  if (segment.cod !== null && segment.cod > 20) return `COD ${segment.cod.toFixed(1)}`;
  if (segment.prd !== null && (segment.prd < 0.98 || segment.prd > 1.03)) return `PRD ${segment.prd.toFixed(3)}`;
  if (segment.medianRatio !== null && (segment.medianRatio < 0.90 || segment.medianRatio > 1.10)) {
    return `Median ratio ${segment.medianRatio.toFixed(3)}`;
  }
  if (segment.exceptionCount > 0) return `${segment.exceptionCount} exceptions`;
  return `Risk score ${Math.round(segment.riskScore)}`;
}

function likelyCause(segment: CountySegmentDto): string {
  if (segment.medianRatio !== null && segment.medianRatio < 0.90) return 'stale valuation model and weak sales support';
  if (segment.prd !== null && segment.prd > 1.03) return 'possible regressivity in the active value tier';
  if (segment.cod !== null && segment.cod > 20) return 'unstable neighborhood sample or weak model fit';
  if (segment.exceptionCount > 0) return 'open data quality or workflow exceptions';
  return 'review segment evidence before routing correction';
}

function defensibility(segment: CountySegmentDto): string {
  if (segment.riskScore >= 75 || (segment.cod !== null && segment.cod > 20)) return 'No';
  if (segment.riskScore >= 60 || (segment.prd !== null && (segment.prd < 0.98 || segment.prd > 1.03))) return 'Review required';
  return 'Provisionally defensible';
}

function severity(segment: CountySegmentDto): string {
  if (segment.riskScore >= 75) return 'Critical';
  if (segment.riskScore >= 60) return 'High';
  if (segment.riskScore >= 35) return 'Medium';
  return 'Low';
}

function PrometheusDecisionInspector({
  segment,
  onOpenAtlas,
}: {
  segment: CountySegmentDto | null;
  onOpenAtlas: () => void;
}) {
  if (!segment) return null;
  const neighborhood = segment.geographyRef ?? 'unassigned';
  const derivedModelGroup = [segment.buildingType, segment.qualityGrade].filter(Boolean).join(' / ');
  const modelGroup = segment.modelGroup ?? (derivedModelGroup || 'model group pending');
  const failure = primaryFailure(segment);
  const severityLabel = severity(segment);
  const medianDelta = segment.medianRatio === null ? null : Math.round(Math.abs(1 - segment.medianRatio) * 100);
  const drivingCount = Math.max(segment.exceptionCount, segment.saleCount ?? 0, 1);
  const diagnosisTitle = `${severityLabel} equity failure`;
  const actionTarget = modelGroup === 'model group pending' ? 'active model group' : modelGroup;

  return (
    <div
      data-testid="prometheus-decision-inspector"
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-surface))',
        color: 'hsl(var(--tf-fg))',
        fontSize: 11,
        display: 'grid',
        gap: 7,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 13, color: severityLabel === 'Critical' ? 'hsl(var(--tf-danger, 0 84% 60%))' : 'hsl(var(--tf-fg))' }}>
          {diagnosisTitle}
        </strong>
        <span style={{ fontSize: 10, fontWeight: 900, color: severityLabel === 'Critical' ? 'hsl(var(--tf-danger, 0 84% 60%))' : 'hsl(var(--tf-warning, 38 92% 50%))' }}>
          Risk {Math.round(segment.riskScore)}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800 }}>
        Neighborhood {neighborhood} is under target{medianDelta !== null ? ` by ${medianDelta} points` : ''}.
      </div>
      <div style={{ color: 'hsl(var(--tf-muted))' }}>
        {drivingCount.toLocaleString()} parcels are driving the failure. Primary signal: {failure}.
      </div>
      <div><strong>Likely cause:</strong> {likelyCause(segment)} · {modelGroup}</div>
      <div>
        <strong>{defensibility(segment) === 'No' ? 'Not defensible for certification' : `Defensibility: ${defensibility(segment)}`}</strong>
        {' '}· {segment.exceptionCount > 0 ? `${segment.exceptionCount} exceptions require review` : 'evidence packet can be assembled now'}
      </div>
      <div><strong>Next:</strong> send {actionTarget} to CostForge and open a parcel sample.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 3 }}>
        {['Open Workbench', 'Send to CostForge', 'Review Sales', 'Open in TerraAtlas', 'Create Dais Task', 'Build Dossier Packet'].map((label) => (
          <button
            key={label}
            type="button"
            onClick={label === 'Open in TerraAtlas' ? onOpenAtlas : undefined}
            style={{
              padding: '5px 6px',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              background: 'hsl(var(--tf-bg))',
              color: 'hsl(var(--tf-fg))',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Picks the inspector surface based on the store's drill state.
 *   - selectedSegmentId set      → ObjectInspector (segment detail)
 *   - drillLevel === 'neighborhood' → NeighborhoodInspector (rollup aggregates)
 *   - drillLevel === 'city'         → CityInspector (reference metadata)
 *   - else (county)                 → ObjectInspector under operational focus.
 */
function InspectorForScope() {
  const { drillLevel, selectedSegmentId } = useCountyStudioStore();
  if (selectedSegmentId) return <ObjectInspector />;
  if (drillLevel === 'neighborhood') return <NeighborhoodInspector />;
  if (drillLevel === 'city')         return <CityInspector />;
  return <ObjectInspector />;
}

export function RightRail() {
  const [activePanel, setActivePanel] = useState<RightPanel>('inspector');
  const {
    activeStudy,
    drillLevel,
    selectedSegmentId,
    selectedCity,
    selectedNeighborhood,
    selectedNeighborhoodRevalArea,
    scenarios,
    cohorts,
    segments,
  } = useCountyStudioStore();
  const operationalFocusSegment = strongestRiskSegment(segments, selectedSegmentId);

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    const params = new URLSearchParams({
      studyId: activeStudy.studyId,
      countyId: activeStudy.countyId,
      taxYear: String(activeStudy.taxYear),
      source: 'county-studio',
      activeLayers: [
        'parcels',
        'parcel-boundaries',
        'neighborhoods',
        'county-segments',
        'reval-areas',
        'taxing-districts',
        'valuation-risk',
        'ratio-risk',
        'segment-health',
      ].join(','),
    });
    if (activeStudy.countyName) {
      params.set('countyName', activeStudy.countyName);
    }
    if (operationalFocusSegment) {
      params.set('selectedRiskObject', operationalFocusSegment.segmentId);
      params.set('segmentId', operationalFocusSegment.segmentId);
      if (operationalFocusSegment.geographyRef) {
        params.set('neighborhoodCode', operationalFocusSegment.geographyRef);
      }
      if (operationalFocusSegment.revalArea !== null && operationalFocusSegment.revalArea !== undefined) {
        params.set('revalArea', String(operationalFocusSegment.revalArea));
      }
      if (operationalFocusSegment.modelGroup) {
        params.set('modelGroup', operationalFocusSegment.modelGroup);
      }
      if (operationalFocusSegment.valueTier) {
        params.set('valueTier', operationalFocusSegment.valueTier);
      }
    } else {
      params.set('selectedRiskObject', 'county');
    }
    window.open(`/forge/atlas-live?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const scopeLabel = (() => {
    if (selectedSegmentId) {
      const segment = segments.find((row) => row.segmentId === selectedSegmentId);
      if (!segment) return `Segment ${selectedSegmentId}`;
       return describeOperationalScope(
          parseSegmentIdentity(segment.name, {
            neighborhoodCode: segment.geographyRef,
            revalArea: segment.revalArea,
            buildingType: segment.buildingType,
            qualityGrade: segment.qualityGrade,
          }),
        );
    }
    if (drillLevel === 'neighborhood' && selectedNeighborhood) {
      return describeOperationalScope(
        parseSegmentIdentity(selectedNeighborhood, {
          neighborhoodCode: selectedNeighborhood,
          revalArea: selectedNeighborhoodRevalArea,
        }),
      );
    }
    if (drillLevel === 'city' && selectedCity) {
      return `City ${selectedCity}`;
    }
    return activeStudy?.countyName ?? activeStudy?.countyId ?? 'No study open';
  })();

  const tab = (label: string, panel: RightPanel) => (
    <button
      onClick={() => setActivePanel(panel)}
      style={{
        flex: 1,
        padding: '6px 0',
        border: 'none',
        borderBottom: activePanel === panel ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
        background: 'transparent',
        color: activePanel === panel ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
        fontSize: 11,
        fontWeight: activePanel === panel ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        data-testid="right-rail-context"
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'hsl(var(--tf-muted))',
            }}
          >
            Current Scope
          </span>
          {activeStudy && (
            <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
              {cohorts.length} cohort{cohorts.length === 1 ? '' : 's'} · {scenarios.length} scenario{scenarios.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div data-testid="right-rail-scope-label" style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>
          {scopeLabel}
        </div>
        <div data-testid="right-rail-panel-summary" style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {PANEL_SUMMARY[activePanel]}
        </div>
      </div>

      {activeStudy && activePanel === 'inspector' && (
        <PrometheusDecisionInspector segment={operationalFocusSegment} onOpenAtlas={handleOpenAtlas} />
      )}

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--tf-border))',
          flexShrink: 0,
        }}
      >
        {tab('Inspector', 'inspector')}
        {tab('Scenario', 'scenario')}
        {tab('Compare', 'compare')}
        {tab('Governance', 'governance')}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePanel === 'inspector'   ? selectedSegmentId ? <InspectorForScope /> : null :
         activePanel === 'scenario'    ? <ScenarioWorksheet />   :
         activePanel === 'compare'     ? <ScenarioCompareGrid /> :
                                         <AdjustmentSetPanel />}
      </div>
    </div>
  );
}

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
  if (segment.medianRatio !== null && segment.medianRatio < 0.90) return 'stale calibration or under-market model group';
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

function PrometheusDecisionInspector({ segment }: { segment: CountySegmentDto | null }) {
  if (!segment) return null;
  const neighborhood = segment.geographyRef ?? 'unassigned';
  const derivedModelGroup = [segment.buildingType, segment.qualityGrade].filter(Boolean).join(' / ');
  const modelGroup = segment.modelGroup ?? (derivedModelGroup || 'model group pending');
  const failure = primaryFailure(segment);

  return (
    <div
      data-testid="prometheus-decision-inspector"
      style={{
        padding: '9px 12px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-surface))',
        color: 'hsl(var(--tf-fg))',
        fontSize: 11,
        display: 'grid',
        gap: 5,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase' }}>
          Selected Risk Object
        </span>
        <span style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--tf-warning, 38 92% 50%))' }}>
          Risk {Math.round(segment.riskScore)}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
        Operational Focus · <strong style={{ color: 'hsl(var(--tf-fg))' }}>Lens:</strong> Roll Readiness · <strong style={{ color: 'hsl(var(--tf-fg))' }}>Severity:</strong> {severity(segment)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 900 }}>
        Neighborhood {neighborhood}
      </div>
      <div><strong>Failure:</strong> {failure}</div>
      <div><strong>Affected parcels:</strong> {segment.parcelCount.toLocaleString()}</div>
      <div><strong>Likely cause:</strong> {likelyCause(segment)} · {modelGroup}</div>
      <div><strong>Defensibility:</strong> {defensibility(segment)}</div>
      <div><strong>Evidence posture:</strong> {segment.exceptionCount > 0 ? `${segment.exceptionCount} exceptions require review` : 'packet can be assembled from current segment evidence'}</div>
      <div><strong>Next best action:</strong> route calibration, sales review, parcel sample, workflow, and evidence packet.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 3 }}>
        {['Open Workbench', 'Send to CostForge', 'Review Sales', 'Open in TerraAtlas', 'Create Dais Task', 'Build Dossier Packet'].map((label) => (
          <button
            key={label}
            type="button"
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
        <PrometheusDecisionInspector segment={operationalFocusSegment} />
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

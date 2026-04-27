// frontend/apps/os-shell/src/pages/forge/county-studio/components/DrillBreadcrumb.tsx
//
// County → City → Neighborhood → Segment breadcrumb. Each crumb is a
// button that collapses the drill back to that level when clicked. The
// final segment crumb (if any) is driven by selectedSegmentId — when set,
// shows the segment name but is non-clickable (clicking it would be a no-op
// because we're already at the leaf).

import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';

function crumbStyle(active: boolean, clickable: boolean): React.CSSProperties {
  return {
    padding: '2px 8px', borderRadius: 4,
    border: 'none', background: 'transparent',
    fontSize: 12, fontWeight: active ? 700 : 500,
    color: active ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
    cursor: clickable ? 'pointer' : 'default',
    textDecoration: clickable && !active ? 'underline' : 'none',
  };
}

const Separator = () => (
  <span aria-hidden="true" style={{ color: 'hsl(var(--tf-muted))', fontSize: 12, margin: '0 2px' }}>
    ›
  </span>
);

export function DrillBreadcrumb() {
  const {
    drillLevel, selectedCity, selectedNeighborhood, selectedNeighborhoodRevalArea, selectedSegmentId,
    segments, drillToCounty, drillToCity,
  } = useCountyStudioStore();

  const selectedSegment = selectedSegmentId
    ? segments.find((s) => s.segmentId === selectedSegmentId) ?? null
    : null;

  return (
    <nav
      aria-label="County Studio drill breadcrumb"
      data-testid="drill-breadcrumb"
      style={{
        display: 'flex', alignItems: 'center', gap: 2,
        height: 36, padding: '0 12px', flexShrink: 0,
        borderBottom: '1px solid hsl(var(--tf-border))',
      }}
    >
      <button
        type="button"
        onClick={drillToCounty}
        data-testid="crumb-county"
        aria-current={drillLevel === 'county' && !selectedSegment ? 'page' : undefined}
        style={crumbStyle(drillLevel === 'county' && !selectedSegment, true)}
      >
        County
      </button>

      {selectedCity && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => drillToCity(selectedCity)}
            data-testid="crumb-city"
            aria-current={drillLevel === 'city' && !selectedSegment ? 'page' : undefined}
            style={crumbStyle(drillLevel === 'city' && !selectedSegment, true)}
          >
            {selectedCity}
          </button>
        </>
      )}

      {selectedNeighborhood && (
        <>
          <Separator />
          <span
            data-testid="crumb-neighborhood"
            aria-current={drillLevel === 'neighborhood' && !selectedSegment ? 'page' : undefined}
            style={crumbStyle(drillLevel === 'neighborhood' && !selectedSegment, false)}
          >
            {describeOperationalScope(
              parseSegmentIdentity(selectedNeighborhood, {
                neighborhoodCode: selectedNeighborhood,
                revalArea: selectedNeighborhoodRevalArea,
              }),
            )}
          </span>
        </>
      )}

      {selectedSegment && (
        <>
          <Separator />
          <span
            data-testid="crumb-segment"
            aria-current="page"
            style={crumbStyle(true, false)}
          >
            {describeOperationalScope(
              parseSegmentIdentity(selectedSegment.name, {
                neighborhoodCode: selectedSegment.geographyRef,
                revalArea: selectedSegment.revalArea,
                buildingType: selectedSegment.buildingType,
                qualityGrade: selectedSegment.qualityGrade,
              }),
            )}
          </span>
        </>
      )}
    </nav>
  );
}

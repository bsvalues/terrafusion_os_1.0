import React, { useMemo } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

// Traffic-light colors map to TerraFusion design tokens (red = error,
// amber = warning, green = success) so the strip respects the global theme
// and the UI-token contract ratchet stays clean.
const STATUS_ERROR   = 'hsl(var(--tf-error))';
const STATUS_WARNING = 'hsl(var(--tf-warning))';
const STATUS_SUCCESS = 'hsl(var(--tf-success))';
const STATUS_MUTED   = 'hsl(var(--tf-muted))';

function ratioColor(ratio: number | null): string {
  if (ratio === null) return STATUS_MUTED;
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return STATUS_ERROR;
  if (delta > 0.05) return STATUS_WARNING;
  return STATUS_SUCCESS;
}

function codColor(cod: number | null): string {
  if (cod === null) return STATUS_MUTED;
  if (cod > 20) return STATUS_ERROR;
  if (cod > 15) return STATUS_WARNING;
  return STATUS_SUCCESS;
}

function prdColor(prd: number | null): string {
  if (prd === null) return STATUS_MUTED;
  if (prd < 0.98 || prd > 1.03) return STATUS_ERROR;
  if (prd < 0.99 || prd > 1.02) return STATUS_WARNING;
  return STATUS_SUCCESS;
}

function formatMetric(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}

function isMissingActiveSegmentSet(error: string | null): boolean {
  return typeof error === 'string' && (error.startsWith('HTTP 409') || error.includes('409 Conflict'));
}

function rollPosture(summary: NonNullable<ReturnType<typeof useCountyStudioStore.getState>['healthSummary']>): string {
  if (
    summary.criticalCount > 0 ||
    summary.complianceStatus === 'NonCompliant' ||
    summary.riskScore >= 50 ||
    (summary.cod !== null && summary.cod > 20) ||
    (summary.prd !== null && (summary.prd < 0.98 || summary.prd > 1.03))
  ) {
    return 'At Risk';
  }
  if (summary.warningCount > 0 || summary.exceptionCount > 0 || summary.riskScore >= 35) {
    return 'Watch';
  }
  return 'Ready';
}

function defensibilityPosture(summary: NonNullable<ReturnType<typeof useCountyStudioStore.getState>['healthSummary']>): string {
  if (rollPosture(summary) === 'At Risk') return 'Weak';
  if (rollPosture(summary) === 'Watch') return 'Review';
  return 'Strong';
}

export function CountyCommandStrip() {
  const {
    activeStudy,
    healthSummary,
    segments,
    loadStatus,
    loadErrors,
  } = useCountyStudioStore();

  const needsDataCount = useMemo(
    () =>
      segments.filter((segment) =>
        segment.medianRatio === null || segment.cod === null || segment.prd === null,
      ).length,
    [segments],
  );

  if (!activeStudy) {
    return null;
  }

  const isDeriveMissing =
    loadStatus.healthSummary === 'error'
    && isMissingActiveSegmentSet(loadErrors.healthSummary);

  return (
    <div
      data-testid="county-command-strip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 16px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-bg))',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>
            County Studio
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
            {activeStudy.countyName ?? activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {healthSummary
            ? `${healthSummary.ratioCount.toLocaleString()} sales · ${healthSummary.parcelCount.toLocaleString()} parcels`
            : 'Study open'}
        </span>
      </div>

      {loadStatus.healthSummary === 'loading' && (
        <div
          data-testid="county-command-strip-loading"
          style={{ fontSize: 12, color: 'hsl(var(--tf-muted))' }}
        >
          Loading countywide health metrics…
        </div>
      )}

      {isDeriveMissing && (
        <div
          data-testid="county-command-strip-derive-cta"
          style={{
            padding: '10px 12px',
            border: '1px solid hsl(var(--tf-warning) / 0.33)',
            background: 'hsl(var(--tf-warning) / 0.08)',
            borderRadius: 4,
            color: 'hsl(var(--tf-fg))',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12 }}>
            No active segment set is derived yet. Use <strong>Derive Segment Metrics</strong> in the left rail to populate the county command surface.
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
            County scope stays open, but command metrics are unavailable until derivation completes.
          </span>
        </div>
      )}

      {loadStatus.healthSummary === 'error' && !isDeriveMissing && (
        <div
          data-testid="county-command-strip-error"
          style={{
            padding: '10px 12px',
            border: '1px solid hsl(var(--tf-error) / 0.33)',
            background: 'hsl(var(--tf-error) / 0.08)',
            borderRadius: 4,
            color: 'hsl(var(--tf-fg))',
            fontSize: 12,
          }}
        >
          Countywide health metrics failed to load. {loadErrors.healthSummary ?? 'Unknown error'}
        </div>
      )}

      {healthSummary && (
        <div
          data-testid="county-roll-posture-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            padding: '7px 10px',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4,
            background: 'hsl(var(--tf-surface))',
            fontSize: 12,
            color: 'hsl(var(--tf-muted))',
          }}
        >
          <strong style={{ color: 'hsl(var(--tf-fg))' }}>Roll Posture:</strong>
          <strong style={{ color: rollPosture(healthSummary) === 'At Risk' ? STATUS_ERROR : rollPosture(healthSummary) === 'Watch' ? STATUS_WARNING : STATUS_SUCCESS }}>
            {rollPosture(healthSummary)}
          </strong>
          <span>Median <strong style={{ color: ratioColor(healthSummary.medianRatio) }}>{formatMetric(healthSummary.medianRatio, 3)}</strong></span>
          <span>COD <strong style={{ color: codColor(healthSummary.cod) }}>{formatMetric(healthSummary.cod, 1)}</strong></span>
          <span>PRD <strong style={{ color: prdColor(healthSummary.prd) }}>{formatMetric(healthSummary.prd, 3)}</strong></span>
          <span><strong style={{ color: healthSummary.criticalCount > 0 ? STATUS_ERROR : STATUS_SUCCESS }}>{healthSummary.criticalCount.toLocaleString()}</strong> Critical</span>
          {needsDataCount > 0 && <span>{needsDataCount.toLocaleString()} Needs Data</span>}
          <span>Defensibility: <strong style={{ color: defensibilityPosture(healthSummary) === 'Weak' ? STATUS_ERROR : defensibilityPosture(healthSummary) === 'Review' ? STATUS_WARNING : STATUS_SUCCESS }}>{defensibilityPosture(healthSummary)}</strong></span>
          <span
            data-testid="county-trust-chip"
            style={{
              marginLeft: 'auto',
              padding: '2px 6px',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              color: 'hsl(var(--tf-muted))',
              whiteSpace: 'nowrap',
            }}
          >
            Trust: provisional · sync-derived · legacy-sensitive
          </span>
        </div>
      )}
    </div>
  );
}

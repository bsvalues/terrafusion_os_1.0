import React, { useMemo } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { ContractLineage } from './ContractLineage';

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

function metricCard(label: string, value: string, color?: string, testId?: string) {
  return (
    <div
      data-testid={testId}
      style={{
        minWidth: 0,
        padding: '8px 10px',
        border: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-surface))',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'hsl(var(--tf-muted))',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: color ?? 'hsl(var(--tf-fg))',
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatMetric(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}

function isMissingActiveSegmentSet(error: string | null): boolean {
  return typeof error === 'string' && (error.startsWith('HTTP 409') || error.includes('409 Conflict'));
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
        gap: 8,
        padding: '10px 16px',
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
            County Command Strip
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
        <>
          <ContractLineage
            operationalContractId={healthSummary.contractId}
            correctionContractId={healthSummary.correctionPriorityContractId}
            countyName={activeStudy.countyName}
            countyId={activeStudy.countyId}
            compact
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
              gap: 8,
            }}
          >
            {metricCard('Median Ratio', formatMetric(healthSummary.medianRatio, 3), ratioColor(healthSummary.medianRatio), 'command-metric-ratio')}
            {metricCard('COD', formatMetric(healthSummary.cod, 1), codColor(healthSummary.cod), 'command-metric-cod')}
            {metricCard('PRD', formatMetric(healthSummary.prd, 3), prdColor(healthSummary.prd), 'command-metric-prd')}
            {metricCard('Critical', healthSummary.criticalCount.toLocaleString(), STATUS_ERROR, 'command-metric-critical')}
            {metricCard('Warnings', healthSummary.warningCount.toLocaleString(), STATUS_WARNING, 'command-metric-warning')}
            {metricCard('Needs Data', needsDataCount.toLocaleString(), needsDataCount > 0 ? STATUS_WARNING : STATUS_SUCCESS, 'command-metric-needs-data')}
            {metricCard('Exceptions', healthSummary.exceptionCount.toLocaleString(), healthSummary.exceptionCount > 0 ? STATUS_WARNING : STATUS_SUCCESS, 'command-metric-exceptions')}
          </div>
        </>
      )}
    </div>
  );
}

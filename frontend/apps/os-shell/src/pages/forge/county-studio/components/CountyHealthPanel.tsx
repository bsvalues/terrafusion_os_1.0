// frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyHealthPanel.tsx
//
// Task C — County-level "is my county healthy?" single-screen answer.
// Rendered at drillLevel === 'county' above (or in place of) the city
// rollup. Dense, numbers-first, matches the visual language of SegmentTable
// / CityRollupTable / NeighborhoodRollupTable so the suite reads as one
// family.
//
// Source of truth for the composite-risk formula is the BACKEND
// (CountyStudyHealthService.ComputeCompositeRisk). This component only
// renders whatever the endpoint returns. Do NOT re-implement the formula
// here.

import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { useStudyData } from '../hooks/useStudyData';
import { CountyDiagnosisModal } from './CountyDiagnosisModal';
import { ExportPacketModal } from './ExportPacketModal';
import { ContractLineage } from './ContractLineage';
import {
  formatOperationalPrimary,
  parseSegmentIdentity,
} from '../utils/segmentIdentity';
import type {
  CountyHealthComplianceStatus,
  CountyHealthSummaryDto,
  HealthAlertDto,
} from '../types/countyStudio.types';

// ── Color helpers — reuse the same scale as SegmentTable / CityRollupTable. ──

function ratioColor(ratio: number | null): string {
  if (ratio === null) return 'hsl(var(--tf-muted))';
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return '#ef4444';
  if (delta > 0.05) return '#f59e0b';
  return '#22c55e';
}

function codColor(cod: number | null): string {
  if (cod === null) return 'hsl(var(--tf-muted))';
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function prdColor(prd: number | null): string {
  if (prd === null) return 'hsl(var(--tf-muted))';
  if (prd < 0.98 || prd > 1.03) return '#ef4444';
  if (prd < 0.99 || prd > 1.02) return '#f59e0b';
  return '#22c55e';
}

/** IAAO lamp color for the overall county status. */
function lampStyle(status: CountyHealthComplianceStatus): { bg: string; label: string } {
  switch (status) {
    case 'IaaoCompliant':      return { bg: '#22c55e', label: 'IAAO Compliant' };
    case 'MarginalCompliance': return { bg: '#f59e0b', label: 'Marginal' };
    case 'NonCompliant':       return { bg: '#ef4444', label: 'Non-compliant' };
    case 'InsufficientData':   return { bg: '#6b7280', label: 'Insufficient Data' };
  }
}

/** Composite-risk pill color bucket: 0-33 green / 34-66 amber / 67+ red. */
function riskBucket(risk: number): { bg: string; color: string; label: 'low' | 'medium' | 'high' } {
  if (risk >= 67) return { bg: '#ef444433', color: '#ef4444', label: 'high' };
  if (risk >= 34) return { bg: '#f59e0b33', color: '#f59e0b', label: 'medium' };
  return { bg: '#22c55e33', color: '#22c55e', label: 'low' };
}

/** "2 hours ago" formatter — no dependency, locale-free. */
function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const ms = Date.now() - then;
  if (ms < 0) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} second${s === 1 ? '' : 's'} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function isMissingActiveSegmentSet(error: string | null): boolean {
  return typeof error === 'string' && (error.startsWith('HTTP 409') || error.includes('409 Conflict'));
}

// ── Sub-components ────────────────────────────────────────────────────────

const SummaryCard = ({
  label, children, testId,
}: {
  label: string; children: React.ReactNode; testId?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      flex: 1, padding: '10px 12px',
      border: '1px solid hsl(var(--tf-border))',
      background: 'hsl(var(--tf-surface))',
      borderRadius: 4,
      display: 'flex', flexDirection: 'column', gap: 2,
      minWidth: 0,
    }}
  >
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      color: 'hsl(var(--tf-muted))',
    }}>
      {label}
    </div>
    {children}
  </div>
);

const BandBar = ({
  value, min, max, fairLow, fairHigh,
}: {
  value: number | null; min: number; max: number; fairLow: number; fairHigh: number;
}) => {
  if (value === null) return null;
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const pct = (v: number) => ((clamp(v) - min) / (max - min)) * 100;
  const fairLeft = pct(fairLow);
  const fairWidth = pct(fairHigh) - fairLeft;
  const pointerLeft = pct(value);
  return (
    <div
      role="presentation"
      style={{
        position: 'relative', height: 6, marginTop: 4,
        background: 'hsl(var(--tf-bg))',
        border: '1px solid hsl(var(--tf-border))',
        borderRadius: 3,
      }}
    >
      <div
        style={{
          position: 'absolute', left: `${fairLeft}%`, width: `${fairWidth}%`,
          top: 0, bottom: 0, background: '#22c55e33',
        }}
      />
      <div
        data-testid="band-pointer"
        style={{
          position: 'absolute', left: `${pointerLeft}%`,
          top: -2, bottom: -2, width: 2,
          background: 'hsl(var(--tf-fg))',
          transform: 'translateX(-1px)',
        }}
      />
    </div>
  );
};

const AlertRow = ({
  alert,
  onClick,
}: {
  alert: HealthAlertDto;
  onClick: (a: HealthAlertDto) => void;
}) => {
  const bucket = riskBucket(alert.compositeRisk);
  const extraReasons = alert.reasons.length > 1 ? ` (+${alert.reasons.length - 1} more)` : '';
  const identity = parseSegmentIdentity(alert.segmentName, {
    neighborhoodCode: alert.neighborhoodCode,
    revalArea: alert.revalArea,
    buildingType: alert.buildingType,
    qualityGrade: alert.qualityGrade,
  });
  const scopeLabel = formatOperationalPrimary(identity);
  return (
    <button
      type="button"
      data-testid="health-alert-row"
      data-risk-bucket={bucket.label}
      onClick={() => onClick(alert)}
      title={alert.reasons.join(' · ')}
      style={{
        display: 'flex', width: '100%', alignItems: 'center', gap: 8,
        padding: '6px 8px',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid hsl(var(--tf-border))',
        color: 'hsl(var(--tf-fg))', textAlign: 'left', cursor: 'pointer',
      }}
    >
      <span
        data-testid="composite-risk-pill"
        data-bucket={bucket.label}
        style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 10,
          background: bucket.bg, color: bucket.color, fontWeight: 700, fontSize: 11,
          minWidth: 32, textAlign: 'center',
        }}
      >
        {alert.compositeRisk.toFixed(0)}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scopeLabel}
        </span>
        <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alert.city ?? 'Unincorporated'} · {alert.parcelCount.toLocaleString()} parcels
        </span>
        <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alert.reasons[0] ?? 'no triggers'}{extraReasons}
        </span>
      </span>
    </button>
  );
};

const SeverityBar = ({
  label, count, total, color, testId, onClick,
}: {
  label: string; count: number; total: number; color: string;
  testId: string; onClick?: () => void;
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const labelLower = label.toLowerCase();
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={!onClick}
      title={`${count.toLocaleString()} ${labelLower} segment${count === 1 ? '' : 's'}`}
      style={{
        display: 'grid', gridTemplateColumns: '64px 1fr 36px',
        alignItems: 'center', gap: 8,
        width: '100%', padding: '3px 0', border: 'none',
        background: 'transparent', color: 'hsl(var(--tf-fg))',
        cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
      <span style={{
        position: 'relative', height: 10,
        background: 'hsl(var(--tf-bg))',
        border: '1px solid hsl(var(--tf-border))',
        borderRadius: 2,
      }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: color,
        }} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
        {count.toLocaleString()}
      </span>
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export function CountyHealthPanel() {
  const {
    activeStudy, healthSummary,
    loadStatus, loadErrors,
    drillToSegment, drillToCounty,
  } = useCountyStudioStore();
  const { retryHealthSummary } = useStudyData();
  const status = loadStatus.healthSummary;
  const error  = loadErrors.healthSummary;

  // ── Loading skeleton — matches the final layout shape so there's no layout-jank. ──
  if (status === 'loading') {
    return (
      <div
        data-testid="health-panel-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading county health summary"
        style={{
          display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 62, borderRadius: 4,
              background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
              backgroundSize: '200% 100%',
              animation: 'tf-shimmer 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 8 }}>
          <div style={{
            height: 220, borderRadius: 4,
            background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
            backgroundSize: '200% 100%',
            animation: 'tf-shimmer 1.4s ease-in-out infinite',
          }} />
          <div style={{
            height: 220, borderRadius: 4,
            background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
            backgroundSize: '200% 100%',
            animation: 'tf-shimmer 1.4s ease-in-out infinite',
          }} />
        </div>
        <style>{`@keyframes tf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  // ── Empty state — 409 (no active segment set yet) — CTA pointing at LeftRail.
  //    apiFetchJson can surface 409s with either legacy or fetch-wrapper text; detect
  //    that specifically so
  //    ambiguous errors don't get swallowed as "no data".
  const is409 = isMissingActiveSegmentSet(error);
  if (status === 'error' && is409) {
    return (
      <div
        data-testid="health-panel-empty"
        role="status"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#6b7280', display: 'inline-block',
        }} />
        <span style={{ fontSize: 13, color: 'hsl(var(--tf-fg))' }}>
          Derive segment metrics to see county health. Use <strong>Derive Segment Metrics</strong> in the left rail.
        </span>
      </div>
    );
  }

  // ── Error state — unexpected 4xx/5xx.
  if (status === 'error') {
    return (
      <div
        data-testid="health-panel-error"
        role="alert"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          display: 'flex', alignItems: 'center', gap: 12,
          color: '#ef4444', fontSize: 13,
        }}
      >
        <span>Unable to load health summary.</span>
        <button
          type="button"
          data-testid="health-panel-retry"
          onClick={() => void retryHealthSummary()}
          style={{
            padding: '3px 10px', borderRadius: 3,
            border: '1px solid hsl(var(--tf-border))',
            background: 'transparent', color: 'hsl(var(--tf-fg))',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Retry
        </button>
        {error ? (
          <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  if (!healthSummary) {
    // Idle / never-fetched — render nothing until the hook kicks in.
    return null;
  }

  return (
    <PopulatedPanel
      summary={healthSummary}
      onAlertClick={(a) => {
        // If the clicked alert belongs to a different neighborhood / city than
        // the current drill scope, this jumps to it in one step. drillToSegment
        // takes the city + neighborhood + segment so the state machine never
        // lands in a neighborhood-without-city configuration.
        drillToSegment(
          a.city ?? 'Unincorporated',
          a.neighborhoodCode ?? 'UNKNOWN',
          a.segmentId,
          a.revalArea,
        );
      }}
      onCriticalClick={() => {
        // Stay at county level; let the user pick a city from the rollup
        // afterwards. A future enhancement would apply a "critical" filter
        // to the CityRollupTable, but the minimum viable action is "don't
        // do nothing" — so we just ensure the drill collapses back to the
        // county landing where the full severity context is visible.
        drillToCounty();
      }}
      studyOpen={!!activeStudy}
    />
  );
}

const PopulatedPanel = ({
  summary,
  onAlertClick,
  onCriticalClick,
  studyOpen,
}: {
  summary: CountyHealthSummaryDto;
  onAlertClick: (a: HealthAlertDto) => void;
  onCriticalClick: () => void;
  studyOpen: boolean;
}) => {
  const totalSegments = summary.criticalCount + summary.warningCount + summary.healthyCount;
  const lamp = lampStyle(summary.complianceStatus);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { activeStudy, activeScenario } = useCountyStudioStore();

  return (
    <div
      data-testid="county-health-panel"
      data-compliance-status={summary.complianceStatus}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 12,
        borderBottom: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-bg))',
      }}
    >
      {/* Row 1 — four summary cards */}
      <div style={{ display: 'flex', gap: 8 }}>
        <SummaryCard label="Overall County Health" testId="health-card-lamp">
          <div
            aria-live="polite"
            aria-label={`Overall county health: ${lamp.label}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}
          >
            <span
              data-testid="health-lamp"
              data-status={summary.complianceStatus}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                background: lamp.bg, display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>
              {lamp.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
            {summary.ratioCount.toLocaleString()} sales · {summary.parcelCount.toLocaleString()} parcels
          </div>
        </SummaryCard>

        <SummaryCard label="Median Ratio" testId="health-card-median">
          <div style={{
            fontSize: 22, fontWeight: 700, fontFeatureSettings: '"tnum"',
            color: ratioColor(summary.medianRatio),
            marginTop: 2,
          }}>
            {summary.medianRatio === null ? '—' : summary.medianRatio.toFixed(3)}
          </div>
          <BandBar value={summary.medianRatio} min={0.70} max={1.30} fairLow={0.90} fairHigh={1.10} />
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            fair 0.90 – 1.10
          </div>
        </SummaryCard>

        <SummaryCard label="COD" testId="health-card-cod">
          <div style={{
            fontSize: 22, fontWeight: 700, fontFeatureSettings: '"tnum"',
            color: codColor(summary.cod),
            marginTop: 2,
          }}>
            {summary.cod === null ? '—' : summary.cod.toFixed(1)}
          </div>
          <BandBar value={summary.cod} min={0} max={40} fairLow={0} fairHigh={20} />
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            IAAO ceiling 20
          </div>
        </SummaryCard>

        <SummaryCard label="PRD" testId="health-card-prd">
          <div style={{
            fontSize: 22, fontWeight: 700, fontFeatureSettings: '"tnum"',
            color: prdColor(summary.prd),
            marginTop: 2,
          }}>
            {summary.prd === null ? '—' : summary.prd.toFixed(3)}
          </div>
          <BandBar value={summary.prd} min={0.85} max={1.15} fairLow={0.98} fairHigh={1.03} />
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            fair 0.98 – 1.03
          </div>
        </SummaryCard>
      </div>

      <ContractLineage
        operationalContractId={summary.contractId}
        correctionContractId={summary.correctionPriorityContractId}
        countyName={activeStudy?.countyName}
        countyId={activeStudy?.countyId ?? summary.countyId}
      />

      {/* Row 2 — top-5 alerts (60%) and severity breakdown (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 8, minHeight: 0 }}>
        <div
          data-testid="health-top-alerts"
          style={{
            border: '1px solid hsl(var(--tf-border))',
            background: 'hsl(var(--tf-surface))',
            borderRadius: 4,
            display: 'flex', flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: 'hsl(var(--tf-muted))', padding: '8px 10px 4px',
          }}>
            Top 5 Action Items
          </div>
          {summary.topAlerts.length === 0 ? (
            <div style={{
              padding: '16px 12px', fontSize: 12,
              color: 'hsl(var(--tf-muted))',
            }}>
              No segments in this study yet.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {summary.topAlerts.map((a) => (
                <AlertRow key={a.segmentId} alert={a} onClick={onAlertClick} />
              ))}
            </div>
          )}
        </div>

        <div
          data-testid="health-severity-chart"
          style={{
            border: '1px solid hsl(var(--tf-border))',
            background: 'hsl(var(--tf-surface))',
            borderRadius: 4,
            display: 'flex', flexDirection: 'column', gap: 6,
            padding: '8px 10px',
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: 'hsl(var(--tf-muted))',
          }}>
            Segment Count Breakdown
          </div>
          <SeverityBar
            label="Critical" count={summary.criticalCount} total={Math.max(totalSegments, 1)}
            color="#ef4444" testId="severity-bar-critical" onClick={onCriticalClick}
          />
          <SeverityBar
            label="Warning" count={summary.warningCount} total={Math.max(totalSegments, 1)}
            color="#f59e0b" testId="severity-bar-warning"
          />
          <SeverityBar
            label="Healthy" count={summary.healthyCount} total={Math.max(totalSegments, 1)}
            color="#22c55e" testId="severity-bar-healthy"
          />
          <div style={{
            fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 4,
          }}>
            {totalSegments.toLocaleString()} segments in study
          </div>
        </div>
      </div>

      {/* Footer — derived timestamp + info */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 10,
        fontSize: 10, color: 'hsl(var(--tf-muted))',
        paddingTop: 2,
      }}>
        <span data-testid="health-derived-timestamp">
          Derived {relativeTime(summary.derivedAt)}. Re-derive in LeftRail.
        </span>
        <button
          type="button"
          data-testid="health-run-county-diagnosis"
          onClick={() => setDiagnosisOpen(true)}
          disabled={!studyOpen}
          title="Runs the deterministic per-segment diagnosis across every segment in this study."
          style={{
            padding: '3px 10px', borderRadius: 3,
            border: '1px solid hsl(var(--tf-border))',
            background: 'transparent', color: 'hsl(var(--tf-fg))',
            fontSize: 11, fontWeight: 600,
            cursor: studyOpen ? 'pointer' : 'not-allowed',
            opacity: studyOpen ? 1 : 0.5,
            marginLeft: 'auto',
          }}
        >
          Run County Diagnosis
        </button>
        <button
          type="button"
          data-testid="health-export-evidence-packet"
          onClick={() => setExportOpen(true)}
          disabled={!studyOpen}
          title="Export a DOR-defensible evidence packet: IAAO metrics, scenario decision, AI findings, and exception log."
          style={{
            padding: '3px 10px', borderRadius: 4, border: 'none',
            fontSize: 10, fontWeight: 600,
            background: '#3b82f622', color: '#3b82f6',
            cursor: studyOpen ? 'pointer' : 'not-allowed',
            opacity: studyOpen ? 1 : 0.5,
          }}
        >
          Export Evidence Packet
        </button>
        <span
          data-testid="health-risk-info"
          tabIndex={0}
          aria-label={
            'Composite risk is a 0-100 score combining six signals: IAAO COD ceiling (20), ' +
            'fairness band (median 0.90-1.10), vertical-equity band (PRD 0.98-1.03), ' +
            'exception rate above 10%, low sample size below 30 parcels, and a penalty for ' +
            'segments with no ratio data. Higher = more urgent review.'
          }
          title={
            'Composite risk is a 0-100 score combining six signals: IAAO COD ceiling (20), ' +
            'fairness band (median 0.90-1.10), vertical-equity band (PRD 0.98-1.03), ' +
            'exception rate above 10%, low sample size below 30 parcels, and a penalty for ' +
            'segments with no ratio data. Higher = more urgent review.'
          }
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 14, height: 14, borderRadius: '50%',
            border: '1px solid hsl(var(--tf-border))',
            color: 'hsl(var(--tf-muted))', cursor: 'help',
            fontSize: 10, fontWeight: 700,
          }}
        >
          i
        </span>
      </div>

      {!studyOpen && (
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
          (no study open)
        </div>
      )}

      <CountyDiagnosisModal
        studyId={summary.studyId}
        open={diagnosisOpen}
        onClose={() => setDiagnosisOpen(false)}
      />

      {exportOpen && activeStudy && (
        <ExportPacketModal
          studyId={activeStudy.studyId}
          scenarioId={activeScenario?.scenarioId}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
};

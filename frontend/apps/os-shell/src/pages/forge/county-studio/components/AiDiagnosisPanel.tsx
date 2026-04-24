// frontend/apps/os-shell/src/pages/forge/county-studio/components/AiDiagnosisPanel.tsx
//
// Task E (Fix #6) — deterministic AI diagnosis panel for the ObjectInspector.
//
// Three sections, top-to-bottom:
//   1. Classification banner — colored bar keyed on PrimaryClass + "{Class}
//      problem · {Confidence}%" with fingerprint hash + relative timestamp.
//   2. Findings — each with code pill, summary, evidence bar, expandable
//      evidence dictionary, and clickable parcel-hint chips.
//   3. Recommended actions — priority, target badge, summary, rationale,
//      a button that fires activateModule() with the backend's
//      prebuiltContext as metadata.
//   4. Narrative card — the 2–4 sentence service output, monospaced.
//
// Loading / error / 409 (not derived) states are handled distinctly.
// MARK_HEALTHY, when the only action, renders as a success banner instead
// of a button list.

import React, { useState } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { useDiagnosisData } from '../hooks/useDiagnosisData';
import type {
  ProblemClass,
  SegmentDiagnosisDto,
  SegmentDiagnosisFinding,
  SegmentRecommendedAction,
} from '../types/countyStudio.types';

// ── Visual tokens ─────────────────────────────────────────────────────────
//
// Classification bar colors. Kept as hex literals (consistent with the rest
// of the County Studio palette — SegmentTable, CountyHealthPanel).
const CLASS_BAR: Record<ProblemClass, string> = {
  Data:     '#ef4444',
  Model:    '#f97316',
  Workflow: '#a855f7',
  Market:   '#f59e0b',
  Healthy:  '#22c55e',
};

const CATEGORY_PILL: Record<string, { bg: string; color: string }> = {
  Data:     { bg: '#ef444422', color: '#ef4444' },
  Model:    { bg: '#f9731622', color: '#f97316' },
  Workflow: { bg: '#a855f722', color: '#a855f7' },
  Market:   { bg: '#f59e0b22', color: '#f59e0b' },
  Healthy:  { bg: '#22c55e22', color: '#22c55e' },
};

// Target-badge palette — one per known handoff module.
const TARGET_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  SalesForge:       { bg: '#0ea5e922', color: '#0ea5e9', label: 'SalesForge' },
  CostForge:        { bg: '#f9731622', color: '#f97316', label: 'CostForge' },
  CompsForge:       { bg: '#a855f722', color: '#a855f7', label: 'CompsForge' },
  Dais:             { bg: '#22c55e22', color: '#22c55e', label: 'Dais' },
  Dossier:          { bg: '#eab30822', color: '#eab308', label: 'Dossier' },
  PropertyWorkbench:{ bg: '#06b6d422', color: '#06b6d4', label: 'Workbench' },
  None:             { bg: 'hsl(var(--tf-surface))', color: 'hsl(var(--tf-muted))', label: 'No handoff' },
};

// Map backend Target ids → frontend moduleId. Must match moduleComponents.tsx.
const MODULE_ID_MAP: Record<string, string> = {
  SalesForge:        'sales-forge',
  CostForge:         'costforge',
  CompsForge:        'comps-forge',
  Dais:              'suite-dais',
  Dossier:           'suite-dossier',
  PropertyWorkbench: 'property-workbench',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
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

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') {
    // Ratio-ish looking numbers get 3 decimals; others 1.
    if (v > 0.5 && v < 2) return v.toFixed(3);
    if (v < 1 && v > -1) return v.toFixed(4);
    return v.toFixed(1);
  }
  return String(v);
}

// ── Sub-components ────────────────────────────────────────────────────────

const ClassificationBanner = ({ dto }: { dto: SegmentDiagnosisDto }) => {
  const bar = CLASS_BAR[dto.primaryClass];
  const confPct = Math.round(dto.primaryConfidence * 100);
  const label = dto.primaryClass === 'Healthy'
    ? `Healthy segment · ${confPct}% confidence`
    : `${dto.primaryClass} problem · ${confPct}% confidence`;
  return (
    <div
      data-testid="diagnosis-classification-banner"
      data-class={dto.primaryClass}
      style={{
        borderLeft: `3px solid ${bar}`,
        background: 'hsl(var(--tf-surface))',
        padding: '10px 12px',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: bar,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%', background: bar, display: 'inline-block',
          }}
        />
        {label}
      </div>
      <div
        style={{
          fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 4,
          display: 'flex', gap: 10, fontFamily: 'ui-monospace, monospace',
        }}
      >
        <span data-testid="diagnosis-fingerprint" title={dto.inputFingerprint}>
          {dto.inputFingerprint.slice(0, 8)}
        </span>
        <span data-testid="diagnosis-timestamp">
          Diagnosed {relativeTime(dto.generatedAt)}
        </span>
      </div>
    </div>
  );
};

const FindingRow = ({
  finding, onParcelClick,
}: { finding: SegmentDiagnosisFinding; onParcelClick: (parcelId: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const pill = CATEGORY_PILL[finding.category] ?? CATEGORY_PILL.Model;
  const pct = Math.round(finding.evidenceStrength * 100);
  return (
    <div
      data-testid={`diagnosis-finding-${finding.code}`}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          data-testid={`diagnosis-category-pill-${finding.code}`}
          style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
            background: pill.bg, color: pill.color, letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {finding.category}
        </span>
        <button
          type="button"
          data-testid={`diagnosis-finding-expand-${finding.code}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((x) => !x)}
          style={{
            marginLeft: 'auto', padding: 0, background: 'transparent',
            border: 'none', color: 'hsl(var(--tf-muted))', fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {expanded ? '▾ Hide evidence' : '▸ Show evidence'}
        </button>
      </div>
      <div
        style={{
          fontSize: 11, color: 'hsl(var(--tf-fg))',
        }}
      >
        {finding.summary}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          role="presentation"
          aria-label="evidence strength bar"
          style={{
            position: 'relative', flex: 1, height: 4,
            background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 2,
          }}
        >
          <div
            data-testid={`diagnosis-evidence-bar-${finding.code}`}
            data-value={finding.evidenceStrength}
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${pct}%`, background: pill.color,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10, color: 'hsl(var(--tf-muted))',
            fontFeatureSettings: '"tnum"', minWidth: 36, textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      </div>
      {expanded && (
        <dl
          data-testid={`diagnosis-evidence-dict-${finding.code}`}
          style={{
            margin: 0, padding: 6, background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))', borderRadius: 3,
            fontSize: 10, display: 'grid',
            gridTemplateColumns: 'auto 1fr', columnGap: 8, rowGap: 2,
          }}
        >
          {Object.entries(finding.evidence).map(([k, v]) => (
            <React.Fragment key={k}>
              <dt style={{ color: 'hsl(var(--tf-muted))' }}>{k}</dt>
              <dd style={{
                color: 'hsl(var(--tf-fg))', margin: 0, fontFeatureSettings: '"tnum"',
              }}>
                {formatValue(v)}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {finding.parcelIdHints.length > 0 && (
        <div
          data-testid={`diagnosis-parcel-hints-${finding.code}`}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
        >
          {finding.parcelIdHints.map((pid) => (
            <button
              key={pid}
              type="button"
              data-testid={`diagnosis-parcel-chip-${pid}`}
              onClick={() => onParcelClick(pid)}
              style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 3,
                border: '1px solid hsl(var(--tf-border))',
                background: 'hsl(var(--tf-bg))',
                color: 'hsl(var(--tf-fg))',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {pid}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionRow = ({
  action, dto,
}: { action: SegmentRecommendedAction; dto: SegmentDiagnosisDto }) => {
  const badge = TARGET_BADGE[action.target] ?? TARGET_BADGE.None;
  const moduleId = MODULE_ID_MAP[action.target];
  const fireable = !!moduleId && action.target !== 'None';
  return (
    <div
      data-testid={`diagnosis-action-${action.actionCode}`}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          data-testid={`diagnosis-action-priority-${action.actionCode}`}
          style={{
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16,
            borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'hsl(var(--tf-surface))',
            border: '1px solid hsl(var(--tf-border))',
            color: 'hsl(var(--tf-fg))',
          }}
        >
          {action.priority}
        </span>
        <span
          data-testid={`diagnosis-action-target-${action.actionCode}`}
          style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
            background: badge.bg, color: badge.color,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}
        >
          {badge.label}
        </span>
        <span
          style={{
            fontSize: 11, fontWeight: 600, color: 'hsl(var(--tf-fg))',
            flex: 1,
          }}
        >
          {action.summary}
        </span>
      </div>
      <div
        style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', paddingLeft: 26 }}
      >
        {action.rationale}
      </div>
      {fireable && (
        <button
          type="button"
          data-testid={`diagnosis-action-fire-${action.actionCode}`}
          aria-label={`Fire ${action.actionCode} in ${badge.label}`}
          onClick={() => {
            void activateModule(moduleId, {
              source: 'system',
              metadata: {
                ...(action.prebuiltContext ?? {}),
                segmentId: dto.segmentId,
                diagnosisActionCode: action.actionCode,
              },
            });
          }}
          style={{
            marginTop: 4, marginLeft: 26, alignSelf: 'flex-start',
            padding: '3px 10px', borderRadius: 3,
            border: `1px solid ${badge.color}`, background: 'transparent',
            color: badge.color, fontSize: 10, fontWeight: 700,
            cursor: 'pointer', letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Open in {badge.label}
        </button>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export interface AiDiagnosisPanelProps {
  segmentId: string | null;
  onOpenParcel?: (parcelId: string) => void;
  onScrollToLeftRail?: () => void;
}

export function AiDiagnosisPanel({
  segmentId,
  onOpenParcel,
  onScrollToLeftRail,
}: AiDiagnosisPanelProps) {
  const { diagnosis, loading, error, notDerived, retry } = useDiagnosisData(segmentId);

  // ── Loading skeleton
  if (loading && !diagnosis) {
    return (
      <div
        data-testid="diagnosis-loading"
        style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div style={{
          height: 40, background: 'hsl(var(--tf-surface))',
          border: '1px solid hsl(var(--tf-border))', borderRadius: 4,
        }} />
        <div style={{
          height: 80, background: 'hsl(var(--tf-surface))',
          border: '1px solid hsl(var(--tf-border))', borderRadius: 4,
        }} />
        <div style={{
          height: 60, background: 'hsl(var(--tf-surface))',
          border: '1px solid hsl(var(--tf-border))', borderRadius: 4,
        }} />
      </div>
    );
  }

  // ── 409 — segment has no derived metrics yet.
  if (notDerived) {
    return (
      <div
        data-testid="diagnosis-not-derived"
        role="status"
        style={{
          padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))',
        }}
      >
        Diagnosis unavailable — derive segment metrics first.
        {onScrollToLeftRail && (
          <button
            type="button"
            data-testid="diagnosis-scroll-to-leftrail"
            onClick={onScrollToLeftRail}
            style={{
              marginLeft: 8, padding: '2px 8px', borderRadius: 3,
              border: '1px solid hsl(var(--tf-border))',
              background: 'transparent', color: 'hsl(var(--tf-fg))',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Open LeftRail
          </button>
        )}
      </div>
    );
  }

  // ── Generic error
  if (error && !diagnosis) {
    return (
      <div
        data-testid="diagnosis-error"
        role="alert"
        style={{
          padding: 16, fontSize: 12, color: '#ef4444',
        }}
      >
        Diagnosis unavailable.{' '}
        <button
          type="button"
          data-testid="diagnosis-retry"
          onClick={retry}
          style={{
            marginLeft: 8, padding: '3px 10px', borderRadius: 3,
            border: '1px solid hsl(var(--tf-border))',
            background: 'transparent', color: 'hsl(var(--tf-fg))',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!diagnosis) return null;

  // ── Populated
  const handleParcelClick = (pid: string) => {
    if (onOpenParcel) {
      onOpenParcel(pid);
      return;
    }
    void activateModule('property-workbench', {
      source: 'system',
      metadata: { parcelId: pid, segmentId: diagnosis.segmentId },
    });
  };

  const onlyMarkHealthy =
    diagnosis.recommendedActions.length === 1 &&
    diagnosis.recommendedActions[0].actionCode === 'MARK_HEALTHY';

  return (
    <div
      data-testid="diagnosis-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <ClassificationBanner dto={diagnosis} />

      {diagnosis.findings.length > 0 && (
        <section
          data-testid="diagnosis-findings-section"
          style={{
            border: '1px solid hsl(var(--tf-border))',
            background: 'hsl(var(--tf-surface))',
            borderRadius: 4,
          }}
        >
          <header
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: 'hsl(var(--tf-muted))',
              padding: '6px 10px',
              borderBottom: '1px solid hsl(var(--tf-border))',
            }}
          >
            Findings ({diagnosis.findings.length})
          </header>
          {diagnosis.findings.map((f) => (
            <FindingRow
              key={f.code}
              finding={f}
              onParcelClick={handleParcelClick}
            />
          ))}
        </section>
      )}

      {onlyMarkHealthy ? (
        <div
          data-testid="diagnosis-mark-healthy-banner"
          role="status"
          style={{
            padding: '10px 12px',
            borderLeft: '3px solid #22c55e',
            background: 'hsl(var(--tf-surface))',
            borderRadius: 4,
            fontSize: 12, color: '#22c55e', fontWeight: 600,
          }}
        >
          ✓ No action required. Segment is compliant.
        </div>
      ) : diagnosis.recommendedActions.length > 0 ? (
        <section
          data-testid="diagnosis-actions-section"
          style={{
            border: '1px solid hsl(var(--tf-border))',
            background: 'hsl(var(--tf-surface))',
            borderRadius: 4,
          }}
        >
          <header
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: 'hsl(var(--tf-muted))',
              padding: '6px 10px',
              borderBottom: '1px solid hsl(var(--tf-border))',
            }}
          >
            Recommended Actions
          </header>
          {diagnosis.recommendedActions.map((a) => (
            <ActionRow key={a.actionCode} action={a} dto={diagnosis} />
          ))}
        </section>
      ) : null}

      <section
        data-testid="diagnosis-narrative-card"
        style={{
          padding: '10px 12px',
          border: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          borderRadius: 4,
          fontSize: 11, lineHeight: 1.45,
          color: 'hsl(var(--tf-fg))',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {diagnosis.narrative}
      </section>
    </div>
  );
}

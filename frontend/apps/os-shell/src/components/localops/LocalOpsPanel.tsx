/**
 * TerraFusion OS — LocalOps Panel (WO-LOCALOPS-006)
 *
 * In-shell surface for TerraPilot LocalOps. Like CompanionPanel, this is shell
 * chrome (a fixed side panel), NOT a standalone app and NOT a routable window —
 * it never escapes the shell.
 *
 * This component is PRESENTATIONAL: it renders a typed `LocalOpsViewModel`
 * passed as props and holds only local UI state (which section is active). It
 * performs no API calls, no mutation, no shell execution, and no autonomous
 * actions — consistent with the LocalOps doctrine (read-only, human-approved).
 * Mapping the live LocalOps engine (WO-001..005) onto this view-model, and
 * mounting/registering this panel in the live Desktop, are a separate,
 * approval-gated slice (WO-LOCALOPS-006.1) — this slice ships the surface only.
 *
 * Styling uses TerraFusion design tokens only (hsl(var(--tf-*) ...)); no raw
 * colors. Z-index comes from the shell z-index authority, never hardcoded.
 *
 * @module components/localops/LocalOpsPanel
 */

import React, { useState } from 'react';
import { Z } from '../../shell/desktop/zIndex';
import { ErrorDisplay, type ErrorDisplayProps } from '../errors/ErrorDisplay';

// ============================================================================
// View model (UI-facing; mirrors WO-001..005 public outputs, no node imports)
// ============================================================================

export type LocalOpsProfileName = 'cloud-dev' | 'hybrid-approved' | 'localops' | 'disabled';

export type LocalOpsOutcomeStatus =
  | 'success'
  | 'refused'
  | 'failed'
  | 'disabled'
  | 'unavailable'
  | 'misconfigured';

export type LocalOpsDiagnosticStatus = 'ok' | 'warn' | 'error';

export interface LocalOpsDiagnosticView {
  name: string;
  status: LocalOpsDiagnosticStatus;
  summary: string;
}

export interface LocalOpsRefusalView {
  reasonCode: string;
  status: string;
  message: string;
  safeAlternatives?: string[];
}

export interface LocalOpsSourceView {
  sourceFile: string;
  heading?: string;
  snippet: string;
}

export interface LocalOpsTraceView {
  type: string;
  ts: string;
  summary: string;
}

export interface LocalOpsViewModel {
  profile: LocalOpsProfileName;
  provider: string;
  model?: string;
  flags: {
    externalCalls: boolean;
    allowWeb: boolean;
    allowShell: boolean;
    allowMutation: boolean;
    requireTrace: boolean;
    requireSources: boolean;
  };
  providerStatus: { ok: boolean; status: LocalOpsOutcomeStatus; adapter?: string };
  diagnostics: LocalOpsDiagnosticView[];
  refusal?: LocalOpsRefusalView;
  grounded: boolean;
  sources: LocalOpsSourceView[];
  traceEvents: LocalOpsTraceView[];
  insight?: {
    text: string;
    grounded: boolean;
  };
}

export type LocalOpsSection = 'ask' | 'explain' | 'diagnose' | 'runbook' | 'sources' | 'trace';

const SECTIONS: ReadonlyArray<{ id: LocalOpsSection; label: string }> = [
  { id: 'ask', label: 'Ask' },
  { id: 'explain', label: 'Explain' },
  { id: 'diagnose', label: 'Diagnose' },
  { id: 'runbook', label: 'Runbook' },
  { id: 'sources', label: 'Sources' },
  { id: 'trace', label: 'Trace' },
];

export interface LocalOpsPanelProps {
  /** The view model to render. `null` => engine unavailable. */
  data: LocalOpsViewModel | null;
  /** Controlled visibility. Defaults to open; the mount slice will drive this. */
  open?: boolean;
  /** Close affordance (UI-only). */
  onClose?: () => void;
  /** Operator-triggered, read-only local diagnostic request. */
  onDiagnose?: () => void;
  /** Prevents duplicate requests while the local provider is running. */
  diagnosePending?: boolean;
  /** Correlation-first shell error for transport-level failures. */
  networkFailure?: ErrorDisplayProps['error'];
}

// ============================================================================
// Token-based style helpers (no raw colors; all carry a var(--tf-*))
// ============================================================================

const TEXT = 'hsl(var(--tf-text))';
const TEXT_MUTED = 'hsl(var(--tf-text) / 0.6)';
const BORDER = 'hsl(var(--tf-border) / 0.2)';
const SURFACE = 'hsl(var(--tf-surface-dark-hs, 226 30%) 9%)';
const PILOT = 'hsl(var(--tf-suite-pilot-hs, 226 58%) 60%)';

function statusColor(status: LocalOpsDiagnosticStatus | 'good' | 'bad'): string {
  switch (status) {
    case 'ok':
    case 'good':
      return 'hsl(var(--tf-accent-hs, 160 60%) 45%)';
    case 'warn':
      return 'hsl(var(--tf-warn-hs, 40 90%) 55%)';
    case 'error':
    case 'bad':
    default:
      return 'hsl(var(--tf-danger-hs, 0 72%) 58%)';
  }
}

const Badge: React.FC<{
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  testId?: string;
}> = ({ label, tone, testId }) => {
  const color =
    tone === 'good'
      ? statusColor('good')
      : tone === 'warn'
        ? statusColor('warn')
        : tone === 'bad'
          ? statusColor('bad')
          : TEXT_MUTED;
  return (
    <span
      data-testid={testId}
      style={{
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${color}`,
        color,
        fontFamily: 'ui-monospace, monospace',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

// ============================================================================
// Sub-views
// ============================================================================

const ProviderStatusCard: React.FC<{ vm: LocalOpsViewModel }> = ({ vm }) => (
  <div
    data-testid='localops-provider-status'
    style={{
      border: `1px solid ${BORDER}`,
      borderRadius: 6,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>Provider</span>
      <Badge
        label={vm.providerStatus.status}
        tone={
          vm.providerStatus.ok
            ? 'good'
            : vm.providerStatus.status === 'disabled'
              ? 'neutral'
              : 'warn'
        }
      />
    </div>
    <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'ui-monospace, monospace' }}>
      {vm.provider || '(unset)'}
      {vm.providerStatus.adapter ? ` · ${vm.providerStatus.adapter}` : ''}
    </div>
  </div>
);

const RefusalCard: React.FC<{ refusal: LocalOpsRefusalView }> = ({ refusal }) => (
  <div
    data-testid='localops-refusal-card'
    role='status'
    style={{
      border: `1px solid ${statusColor('bad')}`,
      borderRadius: 6,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Badge label='REFUSED' tone='bad' />
      <span style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'ui-monospace, monospace' }}>
        {refusal.reasonCode}
      </span>
    </div>
    <div style={{ fontSize: 11, color: TEXT }}>{refusal.message}</div>
    {refusal.safeAlternatives && refusal.safeAlternatives.length > 0 && (
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: TEXT_MUTED }}>
        {refusal.safeAlternatives.map((alt, i) => (
          <li key={i}>{alt}</li>
        ))}
      </ul>
    )}
  </div>
);

const DiagnosticsView: React.FC<{ items: LocalOpsDiagnosticView[] }> = ({ items }) => (
  <div
    data-testid='localops-diagnostics'
    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
  >
    {items.length === 0 ? (
      <span style={{ fontSize: 11, color: TEXT_MUTED }}>No diagnostics available.</span>
    ) : (
      items.map((d) => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: statusColor(d.status),
              flexShrink: 0,
              alignSelf: 'center',
            }}
          />
          <span style={{ fontSize: 11, color: TEXT, fontFamily: 'ui-monospace, monospace' }}>
            {d.name}
          </span>
          <span style={{ fontSize: 10, color: TEXT_MUTED }}>{d.summary}</span>
        </div>
      ))
    )}
  </div>
);

const SourcesView: React.FC<{ vm: LocalOpsViewModel }> = ({ vm }) => {
  if (!vm.grounded || vm.sources.length === 0) {
    return (
      <div data-testid='localops-no-source' style={{ fontSize: 11, color: TEXT_MUTED }}>
        No local source found.
        {vm.flags.requireSources
          ? ' Sources are required — LocalOps will not answer without support.'
          : ''}
      </div>
    );
  }
  return (
    <div
      data-testid='localops-sources'
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {vm.sources.map((s, i) => (
        <div key={i} style={{ borderLeft: `2px solid ${PILOT}`, paddingLeft: 8 }}>
          <div style={{ fontSize: 10, color: PILOT, fontFamily: 'ui-monospace, monospace' }}>
            {s.sourceFile}
            {s.heading ? ` › ${s.heading}` : ''}
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{s.snippet}</div>
        </div>
      ))}
    </div>
  );
};

const TraceView: React.FC<{ events: LocalOpsTraceView[] }> = ({ events }) => (
  <div data-testid='localops-trace' style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {events.length === 0 ? (
      <span style={{ fontSize: 11, color: TEXT_MUTED }}>No trace events recorded.</span>
    ) : (
      events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10 }}>
          <span style={{ color: TEXT_MUTED, fontFamily: 'ui-monospace, monospace' }}>{e.ts}</span>
          <span style={{ color: PILOT, fontFamily: 'ui-monospace, monospace' }}>{e.type}</span>
          <span style={{ color: TEXT_MUTED }}>{e.summary}</span>
        </div>
      ))
    )}
  </div>
);

const ReadOnlyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.5 }}>{children}</div>
);

// ============================================================================
// LocalOpsPanel — root export
// ============================================================================

export const LocalOpsPanel: React.FC<LocalOpsPanelProps> = ({
  data,
  open = true,
  onClose,
  onDiagnose,
  diagnosePending = false,
  networkFailure,
}) => {
  const [section, setSection] = useState<LocalOpsSection>('diagnose');

  return (
    <div
      data-testid='localops-panel'
      role='complementary'
      aria-label='TerraPilot LocalOps'
      aria-hidden={!open}
      style={{
        position: 'fixed',
        right: 0,
        top: 48,
        bottom: 84,
        width: 380,
        zIndex: Z.companionPanel,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        background: SURFACE,
        borderLeft: `1px solid ${BORDER}`,
        overflow: 'hidden',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: TEXT,
            textTransform: 'uppercase',
          }}
        >
          TerraPilot
        </span>
        <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.06em' }}>· LOCALOPS</span>
        <div style={{ flex: 1 }} />
        {onClose && (
          <button
            onClick={onClose}
            aria-label='Close LocalOps panel'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: TEXT_MUTED,
              padding: 4,
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {data === null ? (
        <div style={{ padding: 14 }}>
          <ReadOnlyNote>LocalOps is unavailable. No AI profile is active.</ReadOnlyNote>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          {/* Status strip: profile + boundary flags */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: '10px 14px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}
          >
            <Badge
              testId='localops-profile-badge'
              label={`profile: ${data.profile}`}
              tone={data.profile === 'disabled' ? 'neutral' : 'good'}
            />
            <Badge
              testId='localops-external-calls-badge'
              label={data.flags.externalCalls ? 'external calls: ON' : 'external calls: disabled'}
              tone={data.flags.externalCalls ? 'warn' : 'good'}
            />
            <Badge
              label={data.flags.allowShell ? 'shell: ON' : 'shell: off'}
              tone={data.flags.allowShell ? 'bad' : 'good'}
            />
            <Badge
              label={data.flags.allowMutation ? 'mutation: ON' : 'mutation: off'}
              tone={data.flags.allowMutation ? 'bad' : 'good'}
            />
            <Badge
              label={data.flags.requireSources ? 'sources: required' : 'sources: optional'}
              tone='neutral'
            />
          </div>

          <div style={{ padding: '10px 14px', flexShrink: 0 }}>
            <ProviderStatusCard vm={data} />
          </div>

          {data.refusal && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <RefusalCard refusal={data.refusal} />
            </div>
          )}

          {/* Section nav */}
          <div
            role='tablist'
            aria-label='LocalOps sections'
            style={{
              display: 'flex',
              gap: 2,
              padding: '0 10px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
              overflowX: 'auto',
            }}
          >
            {SECTIONS.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  role='tab'
                  aria-selected={active}
                  data-testid={`localops-section-${s.id}`}
                  onClick={() => setSection(s.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? `2px solid ${PILOT}` : '2px solid transparent',
                    color: active ? TEXT : TEXT_MUTED,
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '8px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Section body */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 14 }}>
            {section === 'ask' && (
              <ReadOnlyNote>
                LocalOps answers are local-first and source-grounded. In v1 the assistant is
                read-only: it observes and explains, and never mutates records. Ask requires a
                connected local provider (current status above).
              </ReadOnlyNote>
            )}
            {section === 'explain' && (
              <ReadOnlyNote>
                Explain summarizes local context with citations. Answers must cite a local source
                when sources are required; otherwise LocalOps reports that no local source was
                found.
              </ReadOnlyNote>
            )}
            {section === 'diagnose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {onDiagnose && (
                  <button
                    type='button'
                    data-testid='localops-run-diagnostic'
                    onClick={onDiagnose}
                    disabled={diagnosePending}
                    style={{
                      alignSelf: 'flex-start',
                      border: `1px solid ${PILOT}`,
                      borderRadius: 4,
                      background: 'transparent',
                      color: TEXT,
                      cursor: diagnosePending ? 'wait' : 'pointer',
                      fontSize: 11,
                      padding: '6px 9px',
                    }}
                  >
                    {diagnosePending ? 'Running locally…' : 'Run local diagnostic'}
                  </button>
                )}
                {networkFailure && <ErrorDisplay error={networkFailure} />}
                {data.insight && (
                  <div
                    data-testid='localops-diagnostic-insight'
                    style={{
                      borderLeft: `2px solid ${PILOT}`,
                      paddingLeft: 8,
                      color: TEXT,
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    {data.insight.text}
                  </div>
                )}
                <DiagnosticsView items={data.diagnostics} />
              </div>
            )}
            {section === 'runbook' && (
              <ReadOnlyNote>
                Operator runbooks live in <code>docs/localops/BENTON_SERVER_RUNBOOK.md</code>.
                LocalOps surfaces read-only findings and proposes the documented step — it never
                executes it.
              </ReadOnlyNote>
            )}
            {section === 'sources' && <SourcesView vm={data} />}
            {section === 'trace' && <TraceView events={data.traceEvents} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalOpsPanel;

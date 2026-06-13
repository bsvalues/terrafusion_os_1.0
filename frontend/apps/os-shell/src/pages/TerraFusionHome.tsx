/**
 * TerraFusionHome — pure renderer of a PulseHomeSnapshot
 * ═══════════════════════════════════════════════════════════════
 *
 * The payoff of the truth layer: Home is a RENDERER, not a decision engine and
 * not a truth engine. It takes a {@link PulseHomeSnapshot} and draws it. That's
 * all.
 *
 * Hard constraints (Home Renderer WO):
 * - NO data logic in this component. It fetches nothing, infers nothing, and
 *   computes no status. Everything it shows comes from the snapshot prop.
 * - Renders ONLY PulseHomeSnapshot reads. Each region (brief, activity,
 *   evidence) is an independent {@link PulseRead}; the component honours its
 *   `live` / `unavailable` / `loading` state with explicit fallbacks.
 * - NO fabricated copy, counts, confidence, or operational claims. Counts come
 *   only from live evidence items; conditions/actions come only from a live
 *   brief. An unavailable region shows its reason, never a placeholder value.
 * - GATED: this component is not wired into any route or icon. Mounting it is a
 *   separate, explicit step once a read layer feeds it live snapshots.
 * - Does NOT touch StageZeroState (the sealed production Home).
 *
 * @see contracts/pulseHome.ts
 * @see services/pulse/pulseHomeService.ts (getPulseHomeSnapshot)
 */

import React from 'react';
import { LiquidPanel } from '../ui/materials';
import {
  isPulseLive,
  isPulseLoading,
  formatPulseSource,
  type PulseConditionLevel,
  type PulseHomeSnapshot,
  type PulseRead,
} from '../contracts/pulseHome';

export interface TerraFusionHomeProps {
  /** The only input. Home renders exactly this — no more, no less. */
  snapshot: PulseHomeSnapshot;
  className?: string;
}

// ============================================================================
// Honest state helpers
// ============================================================================

const LEVEL_LABEL: Record<PulseConditionLevel, string> = {
  stable: 'Stable',
  watching: 'Watching',
  attention: 'Attention',
  critical: 'Critical',
};

const LEVEL_COLOR: Record<PulseConditionLevel, string> = {
  stable: 'var(--tf-success)',
  watching: 'var(--tf-warning)',
  attention: 'var(--tf-warning)',
  critical: 'var(--tf-error)',
};

/** Explicit, honest fallback for a non-live region. Never shows data. */
function RegionFallback({
  read,
  testId,
  label,
}: {
  read: PulseRead<unknown>;
  testId: string;
  label: string;
}) {
  if (isPulseLoading(read)) {
    return (
      <div data-testid={`${testId}-loading`} className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
        Loading {label}…
      </div>
    );
  }
  // unavailable
  const reason = 'reason' in read ? read.reason : 'Source unavailable.';
  return (
    <div data-testid={`${testId}-unavailable`} className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
      <span style={{ color: 'hsl(var(--tf-warning))', fontWeight: 600 }}>Unavailable</span> — {reason}
    </div>
  );
}

function StatusPill({ level }: { level: PulseConditionLevel }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ color: `hsl(${LEVEL_COLOR[level]})`, background: `hsl(${LEVEL_COLOR[level]} / 0.12)` }}
    >
      {LEVEL_LABEL[level]}
    </span>
  );
}

function SourceLine({ text }: { text: string }) {
  return (
    <div className="text-[11px] mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
      Source: {text}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function TerraFusionHome({ snapshot, className }: TerraFusionHomeProps): React.ReactElement {
  const { county, brief, activity, evidence } = snapshot;

  return (
    <div
      data-testid="terrafusion-home"
      className={className}
      style={{ color: 'hsl(var(--tf-text))', padding: '28px 28px 56px' }}
    >
      <div className="mx-auto flex flex-col gap-5" style={{ maxWidth: 1180 }}>
        {/* ── Global Truth Bar (scope identity only — not operational claims) ── */}
        <header
          data-testid="tfh-truthbar"
          className="flex items-center gap-4 flex-wrap text-sm"
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          <span style={{ color: 'hsl(var(--tf-text))', fontWeight: 600 }}>{county.label}</span>
          <span>{county.rollYear} Roll</span>
          {isPulseLive(brief) && (
            <span className="inline-flex items-center gap-2">
              Condition: <StatusPill level={brief.data.overallCondition} />
            </span>
          )}
        </header>

        {/* ── Morning Brief ── */}
        <LiquidPanel variant="shell" radius="lg" className="p-6">
          <div
            className="text-[12px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            Morning Brief
          </div>
          {isPulseLive(brief) ? (
            <div data-testid="tfh-brief-live">
              <h1 className="text-2xl font-semibold leading-snug" style={{ color: 'hsl(var(--tf-text))' }}>
                {brief.data.headline}
              </h1>
              <SourceLine text={formatPulseSource(brief.source)} />
            </div>
          ) : (
            <RegionFallback read={brief} testId="tfh-brief" label="morning brief" />
          )}
        </LiquidPanel>

        {/* ── Operational Pulse (conditions from the live brief only) ── */}
        <LiquidPanel variant="shell" radius="lg" className="p-6">
          <SectionTitle>Operational Pulse</SectionTitle>
          {isPulseLive(brief) ? (
            brief.data.conditions.length === 0 ? (
              <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                No conditions reported.
              </div>
            ) : (
              <div data-testid="tfh-pulse-live" className="flex flex-col gap-3 mt-3">
                {brief.data.conditions.map((c) => (
                  <div key={c.function} className="flex items-center gap-3">
                    <span className="text-sm font-semibold capitalize" style={{ minWidth: 130 }}>
                      {c.function.replace(/_/g, ' ')}
                    </span>
                    <StatusPill level={c.level} />
                    <span className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                      {c.reason}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <RegionFallback read={brief} testId="tfh-pulse" label="operational pulse" />
          )}
        </LiquidPanel>

        {/* ── Today's Action Path (priority actions from the live brief only) ── */}
        <LiquidPanel variant="shell" radius="lg" className="p-6">
          <SectionTitle>Today's Action Path</SectionTitle>
          {isPulseLive(brief) ? (
            brief.data.priorityActions.length === 0 ? (
              <div data-testid="tfh-actions-empty" className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                No actions required.
              </div>
            ) : (
              <div data-testid="tfh-actions-live" className="flex flex-col gap-3 mt-3">
                {[...brief.data.priorityActions]
                  .sort((a, b) => a.rank - b.rank)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg p-3"
                      style={{ border: '1px solid hsl(var(--tf-border) / 0.7)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                          {a.title}
                        </span>
                        {a.dueLabel && (
                          <span className="text-xs" style={{ color: 'hsl(var(--tf-warning))' }}>
                            {a.dueLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {a.why}
                      </div>
                    </div>
                  ))}
              </div>
            )
          ) : (
            <RegionFallback read={brief} testId="tfh-actions" label="action path" />
          )}
        </LiquidPanel>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* ── What Changed Overnight ── */}
          <LiquidPanel variant="shell" radius="lg" className="p-6">
            <SectionTitle>What Changed Overnight</SectionTitle>
            {isPulseLive(activity) ? (
              activity.data.length === 0 ? (
                <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  No overnight activity.
                </div>
              ) : (
                <ul data-testid="tfh-activity-live" className="flex flex-col gap-2 mt-3 list-none p-0">
                  {activity.data.map((e) => (
                    <li key={e.id} className="text-sm">
                      <span style={{ color: 'hsl(var(--tf-text))', fontWeight: 600 }}>{e.summary}</span>
                      {e.detail && (
                        <span style={{ color: 'hsl(var(--tf-muted))' }}> — {e.detail}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <RegionFallback read={activity} testId="tfh-activity" label="overnight activity" />
            )}
          </LiquidPanel>

          {/* ── Evidence Behind Today (counts only from live items) ── */}
          <LiquidPanel variant="shell" radius="lg" className="p-6">
            <SectionTitle>Evidence Behind Today</SectionTitle>
            {isPulseLive(evidence) ? (
              evidence.data.items.length === 0 ? (
                <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  No evidence items.
                </div>
              ) : (
                <ul data-testid="tfh-evidence-live" className="flex flex-col gap-3 mt-3 list-none p-0">
                  {evidence.data.items.map((item) => (
                    <li key={item.id} className="flex items-baseline gap-3">
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: item.gating ? 'hsl(var(--tf-warning))' : 'hsl(var(--tf-text))' }}
                      >
                        {item.count}
                      </span>
                      <div>
                        <span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                          {item.label}
                        </span>
                        <SourceLine text={formatPulseSource(item.source)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <RegionFallback read={evidence} testId="tfh-evidence" label="evidence" />
            )}
          </LiquidPanel>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
      {children}
    </h2>
  );
}

export default TerraFusionHome;

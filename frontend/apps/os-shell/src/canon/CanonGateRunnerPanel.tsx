/**
 * Canon Gate Runner Panel (os-canon) — read-only gate registry view.
 *
 * Lists the gates configured in the Canon gate registry and their latest KNOWN
 * status. HONEST by construction:
 *   - It does NOT run gates, trigger CI, or mutate anything.
 *   - Status is "not run here" by default; real statuses (from `tf canon gates`,
 *     CI, or the trace layer) may be passed in via the `statuses` prop.
 *   - The current execution rail is the `tf canon gates` CLI.
 *
 * Configured gates mirror os-platform/core/canon/gate-registry.json (kept in
 * sync by hand, like CanonRuntimeStatusPanel mirrors CANON_OWNED_PATTERNS).
 * No invented values.
 *
 * @module canon/CanonGateRunnerPanel
 */

import React from 'react';

/** A configured gate — mirrors an entry in gate-registry.json. */
interface ConfiguredGate {
  gateId: string;
  label: string;
  command: string;
  kind: 'regression' | 'contract';
}

/** Source of truth: os-platform/core/canon/gate-registry.json (version 0.1.0). */
const CONFIGURED_GATES: readonly ConfiguredGate[] = [
  {
    gateId: 'typecheck',
    label: 'TypeScript Type Check',
    command: 'pnpm run type-check',
    kind: 'regression',
  },
  {
    gateId: 'launch-surface-contract',
    label: 'Launch Surface Contract',
    command: 'node os-platform/core/tests/launch-surface-contract.test.mjs',
    kind: 'contract',
  },
  {
    gateId: 'canon-query',
    label: 'Canon Runtime Query Self-Test',
    command: 'node --test os-platform/core/tests/canon-query.test.mjs',
    kind: 'contract',
  },
];

/** Known gate status — `unknown` means "not run in-shell" (the honest default). */
export type GateRunStatus = 'pass' | 'fail' | 'warning' | 'skipped' | 'unknown';

/** Externally-known status for a configured gate (e.g. from `tf canon gates`). */
export interface GateStatusEntry {
  gateId: string;
  status: GateRunStatus;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-terra-cyan';
const mutedClass = 'text-xs tf-text-tertiary';
const codeClass = 'font-mono text-xs tf-text-secondary';

// Status colors use canonical TerraFusion tokens (see CanonEvidenceViewer):
// terra-accent maps to --tf-success; fail/warning reuse the established palette.
const STATUS_CLASS: Record<GateRunStatus, string> = {
  pass: 'text-terra-accent',
  fail: 'text-red-400',
  warning: 'text-amber-300',
  skipped: 'tf-text-dim',
  unknown: 'tf-text-dim',
};

const STATUS_LABEL: Record<GateRunStatus, string> = {
  pass: 'pass',
  fail: 'fail',
  warning: 'warning',
  skipped: 'skipped',
  unknown: 'not run here',
};

/**
 * Read-only Canon gate runner panel. No side effects, no controls.
 */
export function CanonGateRunnerPanel({
  statuses,
}: {
  statuses?: readonly GateStatusEntry[];
}): React.ReactElement {
  const statusById = new Map((statuses ?? []).map((s) => [s.gateId, s.status]));

  return (
    <section
      className='canon-gate-runner liquid-panel--infrastructure bg-terra-slate flex flex-col gap-3 p-3'
      data-testid='terracanon-gate-runner'
      aria-label='Canon gate runner panel'
    >
      <header className='flex items-baseline justify-between'>
        <h3 className={labelClass}>Canon Gate Runner</h3>
        <span className={mutedClass}>read-only</span>
      </header>

      <p className={mutedClass}>
        Gates configured in the Canon gate registry. This panel does not run gates, trigger CI, or
        mutate anything — statuses come from the <span className={codeClass}>tf canon gates</span>{' '}
        CLI (or CI / the trace layer). Anything not run there shows as{' '}
        <span className='tf-text-dim'>not run here</span>.
      </p>

      <div className='flex flex-col gap-2'>
        {CONFIGURED_GATES.map((g) => {
          const status: GateRunStatus = statusById.get(g.gateId) ?? 'unknown';
          return (
            <div key={g.gateId} className='flex flex-col gap-0.5'>
              <div className='flex items-baseline gap-2'>
                <span className='text-xs tf-text-secondary'>{g.label}</span>
                <span className={mutedClass}>{g.kind}</span>
                <span
                  className={`ml-auto text-xs font-semibold ${STATUS_CLASS[status]}`}
                  data-testid={`terracanon-gate-status-${g.gateId}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <span className={codeClass}>{g.command}</span>
            </div>
          );
        })}
      </div>

      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Current rail</span>
        <span className={codeClass}>tf canon gates</span>
      </div>

      <p className='text-xs italic tf-text-dim'>
        Read-only view. No gates run, no CI is triggered, and nothing is mutated from this panel.
      </p>
    </section>
  );
}

export default CanonGateRunnerPanel;

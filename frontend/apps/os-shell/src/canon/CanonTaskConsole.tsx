/**
 * Canon Task Console (os-canon) — read-only authoring shell.
 *
 * First slice of the in-shell Canon task surface. It names the governed task
 * lifecycle and the fields a Canon task carries, and is HONEST that in-shell
 * authoring/execution is NOT enabled yet — the `tf canon` CLI + gates are the
 * current rail. No fake placeholder values, no execution, no agents, no
 * commands, no inputs.
 *
 * Source of truth (kept honest):
 *   - lifecycle states: os-platform/core/canon/canon-task.mjs (STATES)
 *   - fields: os-platform/core/canon/canon-task.schema.json
 *
 * @module canon/CanonTaskConsole
 */

import React from 'react';

/** Governed task lifecycle (ADR-005) — mirrors canon-task.mjs STATES. */
const LIFECYCLE = [
  'Draft',
  'CanonContextLoaded',
  'ScopeProposed',
  'PlanProposed',
  'RiskScored',
  'AwaitingApproval',
  'WorktreeCreated',
  'Executing',
  'DiffReady',
  'GatesRunning',
  'ReviewRequired',
  'CommitReady',
  'TraceSealed',
  'PRReady',
  'Closed',
] as const;

/** Fields a Canon task carries (canon-task.schema.json). Honest descriptions —
 *  no invented values; each says where it is computed today. */
const FIELDS: ReadonlyArray<{ label: string; note: string }> = [
  { label: 'Intent', note: 'what the task should accomplish — authored via tf canon' },
  { label: 'Surface', note: 'os-canon · canon-desktop · cli · ci' },
  { label: 'Scope', note: 'allowed / forbidden paths — resolved by tf canon query' },
  { label: 'Required gates', note: 'computed by tf canon gates (not surfaced in-shell yet)' },
  { label: 'Risk', note: 'computed by tf canon risk (not surfaced in-shell yet)' },
  { label: 'Evidence', note: 'sealed bundle from the trace layer (not surfaced in-shell yet)' },
];

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-terra-cyan';
const mutedClass = 'text-xs tf-text-tertiary';
const codeClass = 'font-mono text-xs tf-text-secondary';

/**
 * Read-only Canon Task Console. No props, no side effects, no controls.
 */
export function CanonTaskConsole(): React.ReactElement {
  return (
    <section
      className='canon-task-console liquid-panel--infrastructure flex flex-col gap-3 p-3'
      style={{ background: 'hsl(var(--tf-surface))' }}
      data-testid='terracanon-task-console'
      aria-label='Canon task console'
    >
      <header className='flex items-baseline justify-between'>
        <h3 className={labelClass}>Canon Task Console</h3>
        <span className={mutedClass}>read-only</span>
      </header>

      <p className={mutedClass}>
        Governed Canon tasks are authored and run through the{' '}
        <span className={codeClass}>tf canon</span> CLI and gates. In-shell authoring and execution
        are <span className='text-amber-300'>not enabled</span> here yet — this panel is a read-only
        view of the task contract.
      </p>

      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Task lifecycle</span>
        <span className={codeClass}>{LIFECYCLE.join(' → ')}</span>
        <span className={mutedClass}>
          plus terminal <span className={codeClass}>Failed</span>. Guards: approval before
          WorktreeCreated; gates pass before ReviewRequired.
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        <span className={labelClass}>Task fields</span>
        {FIELDS.map((f) => (
          <div key={f.label} className='flex flex-col'>
            <span className='text-xs tf-text-secondary'>{f.label}</span>
            <span className={mutedClass}>{f.note}</span>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Current rail</span>
        <span className={codeClass}>tf canon query · risk · rules · gates</span>
      </div>

      <p className='text-xs italic tf-text-dim'>
        Read-only view. No tasks are created, no agents run, and no commands execute from this panel.
      </p>
    </section>
  );
}

export default CanonTaskConsole;

/**
 * Canon Runtime Status Panel (os-canon)
 *
 * Read-only surface that lets os-canon EXPLAIN the Canon runtime: what exists,
 * how enforcement is scoped, which gates and CLI commands are available. It
 * runs nothing and mutates nothing — pure display.
 *
 * Source of truth (kept in sync by the runtime's own tests on main):
 *   - os-platform/core/canon/engineering-write-lanes.json  (owners)
 *   - os-platform/core/canon/gate-registry.json            (gates)
 *   - os-platform/core/gates/canon-gates.mjs               (CANON_OWNED_PATTERNS)
 *   - os-platform/core/canon/tf-canon.mjs                  (CLI commands)
 *
 * This panel deliberately shows STABLE governance facts only. It does not claim
 * a live test count or any value it cannot verify at render time.
 *
 * @module canon/CanonRuntimeStatusPanel
 */

import React from 'react';

/** Canon runtime modules present on main (os-platform/core/canon). */
const RUNTIME_MODULES = ['query', 'risk', 'loader', 'evidence', 'trace-seal', 'task'] as const;

/** Paths under strict (blocking) enforcement — mirrors CANON_OWNED_PATTERNS. */
const CANON_OWNED_PATHS = ['os-platform/core/canon/**', 'os-platform/core/gates/**'] as const;

/** Advisory gates (os-platform/core/gates). */
const GATES = ['write-lane', 'protected-paths', 'hardcoded-ports'] as const;

/** Headless CLI commands (tf-canon.mjs). */
const CLI_COMMANDS = ['query', 'risk', 'rules', 'gates'] as const;

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-terra-cyan';
const mutedClass = 'text-xs tf-text-tertiary';
const codeClass = 'font-mono text-xs tf-text-secondary';

function Row({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className='flex flex-col gap-1'>
      <span className={labelClass}>{label}</span>
      <div className={mutedClass}>{children}</div>
    </div>
  );
}

/**
 * Read-only Canon runtime status. No props, no side effects, no controls.
 */
export function CanonRuntimeStatusPanel(): React.ReactElement {
  return (
    <section
      className='canon-runtime-status liquid-panel--infrastructure flex flex-col gap-3 p-3'
      style={{ background: 'hsl(var(--tf-surface))' }}
      data-testid='terracanon-runtime-status'
      aria-label='Canon runtime status'
    >
      <header className='flex items-baseline justify-between'>
        <h3 className={labelClass}>Canon Runtime</h3>
        <span className={mutedClass}>read-only</span>
      </header>

      <Row label='Runtime'>
        Active · modules:{' '}
        <span className={codeClass}>{RUNTIME_MODULES.join(' · ')}</span>
      </Row>

      <Row label='Enforcement'>
        <div className='flex flex-col gap-1'>
          <div>
            <span className='text-amber-300'>Strict (blocking)</span> — scoped to{' '}
            <span className='tf-text-secondary'>canon-owned</span> paths:
            <div className='mt-0.5 flex flex-col'>
              {CANON_OWNED_PATHS.map((p) => (
                <span key={p} className={codeClass}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className='text-terra-cyan'>Advisory (non-blocking)</span> — all other paths
            (reported, never blocked).
          </div>
        </div>
      </Row>

      <Row label='Gates'>
        <span className={codeClass}>{GATES.join(' · ')}</span>
      </Row>

      <Row label='CLI'>
        <span className={codeClass}>{CLI_COMMANDS.map((c) => `tf canon ${c}`).join('  ·  ')}</span>
      </Row>

      <p className='text-xs italic tf-text-dim'>
        Read-only view. This panel runs nothing and changes no configuration.
      </p>
    </section>
  );
}

export default CanonRuntimeStatusPanel;

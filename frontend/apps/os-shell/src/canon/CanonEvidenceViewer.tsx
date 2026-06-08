/**
 * Canon Evidence Bundle Viewer (os-canon) — read-only proof viewer.
 *
 * Renders a Canon evidence bundle: the proof artifact for a completed task
 * (rules loaded, files read/changed, gate results, diff hash, risk score, seal).
 * HONEST about provenance:
 *   - With no bundle, shows an empty state and names the bundle contract.
 *     Bundles are produced by the `tf canon` CLI + the trace layer, not in-shell.
 *   - With a bundle, renders the real fields read-only.
 *   - The cryptographic seal is shown AS REPORTED by the bundle; verification is
 *     the trace layer's job (canon-trace-seal.mjs), not re-computed in-browser.
 *
 * Field shape mirrors os-platform/core/canon/canon-evidence.mjs (EvidenceBundle)
 * and the seal fields from canon-trace-seal.mjs. No invented values.
 *
 * @module canon/CanonEvidenceViewer
 */

import React from 'react';

/** Gate status — mirrors GATE_STATUSES in canon-evidence.mjs. */
export type EvidenceGateStatus = 'pass' | 'fail' | 'warning' | 'skipped';

/** One gate result inside a bundle. */
export interface EvidenceGateResult {
  gateId: string;
  status: EvidenceGateStatus;
  summary?: string;
}

/** Read-only view of a Canon evidence bundle (subset rendered here). */
export interface EvidenceBundleView {
  taskId: string;
  intent: string;
  surface: string;
  canonRulesLoaded?: readonly string[];
  filesRead?: readonly string[];
  filesChanged?: readonly string[];
  gateResults?: readonly EvidenceGateResult[];
  diffHash?: string;
  riskScore?: number;
  sealed?: boolean;
  traceHash?: string;
  sealedAt?: string;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-terra-cyan';
const mutedClass = 'text-xs tf-text-tertiary';
const codeClass = 'font-mono text-xs tf-text-secondary';

// Status colors use canonical TerraFusion tokens: `terra-accent` maps to
// --tf-success (tailwind.config.js); fail/warning reuse the palette already
// established in sibling canon panels (CanonAgentsPanel, CanonTaskConsole).
const STATUS_CLASS: Record<EvidenceGateStatus, string> = {
  pass: 'text-terra-accent',
  fail: 'text-red-400',
  warning: 'text-amber-300',
  skipped: 'tf-text-dim',
};

function EmptyState(): React.ReactElement {
  return (
    <div className='flex flex-col gap-2'>
      <p className={mutedClass}>
        No evidence bundle loaded. Bundles are the proof artifact for a completed Canon task and are
        produced by the <span className={codeClass}>tf canon</span> CLI and sealed by the trace
        layer. In-shell authoring/execution is not enabled here yet.
      </p>
      <div className='flex flex-col gap-1'>
        <span className={labelClass}>A bundle carries</span>
        <span className={mutedClass}>
          canon rules loaded · files read / changed · gate results · diff hash · risk score · trace
          seal
        </span>
      </div>
    </div>
  );
}

function FileList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}): React.ReactElement {
  return (
    <div className='flex flex-col gap-1'>
      <span className={labelClass}>
        {title} ({items.length})
      </span>
      {items.length === 0 ? (
        <span className={mutedClass}>none</span>
      ) : (
        items.map((f) => (
          <span key={f} className={codeClass}>
            {f}
          </span>
        ))
      )}
    </div>
  );
}

/**
 * Read-only Canon evidence bundle viewer. No side effects, no controls.
 */
export function CanonEvidenceViewer({
  bundle,
}: {
  bundle?: EvidenceBundleView;
}): React.ReactElement {
  return (
    <section
      className='canon-evidence-viewer liquid-panel--infrastructure bg-terra-slate flex flex-col gap-3 p-3'
      data-testid='terracanon-evidence-viewer'
      aria-label='Canon evidence bundle viewer'
    >
      <header className='flex items-baseline justify-between'>
        <h3 className={labelClass}>Canon Evidence Bundle</h3>
        <span className={mutedClass}>read-only</span>
      </header>

      {!bundle ? (
        <EmptyState />
      ) : (
        <>
          <div className='flex flex-col gap-1'>
            <span className={codeClass}>{bundle.taskId}</span>
            <span className='text-xs tf-text-secondary'>{bundle.intent}</span>
            <span className={mutedClass}>
              surface <span className={codeClass}>{bundle.surface}</span>
            </span>
          </div>

          <div className='flex flex-col gap-1' data-testid='terracanon-evidence-gates'>
            <span className={labelClass}>Gate results</span>
            {(bundle.gateResults ?? []).length === 0 ? (
              <span className={mutedClass}>no gates recorded</span>
            ) : (
              (bundle.gateResults ?? []).map((g) => (
                <div key={g.gateId} className='flex items-baseline gap-2'>
                  <span className={`text-xs font-semibold ${STATUS_CLASS[g.status]}`}>
                    {g.status}
                  </span>
                  <span className={codeClass}>{g.gateId}</span>
                  {g.summary ? <span className={mutedClass}>{g.summary}</span> : null}
                </div>
              ))
            )}
          </div>

          <FileList title='Files read' items={bundle.filesRead ?? []} />
          <FileList title='Files changed' items={bundle.filesChanged ?? []} />

          <div className='flex flex-col gap-1'>
            <span className={labelClass}>Diff &amp; risk</span>
            <span className={mutedClass}>
              diff <span className={codeClass}>{bundle.diffHash ?? 'n/a'}</span> · risk{' '}
              <span className={codeClass}>{bundle.riskScore ?? 'n/a'}</span>
            </span>
          </div>

          <div className='flex flex-col gap-1' data-testid='terracanon-evidence-seal'>
            <span className={labelClass}>Trace seal</span>
            <span
              className={`text-xs font-semibold ${bundle.sealed ? 'text-terra-accent' : 'text-amber-300'}`}
            >
              {bundle.sealed ? 'Sealed' : 'Not sealed'}
            </span>
            {bundle.sealed ? (
              <span className={codeClass}>{bundle.traceHash ?? '(no trace hash)'}</span>
            ) : null}
            {bundle.sealed && bundle.sealedAt ? (
              <span className={mutedClass}>at {bundle.sealedAt}</span>
            ) : null}
            <span className='text-xs italic tf-text-dim'>
              Seal status as reported by the trace layer (canon-trace-seal). Not re-computed here.
            </span>
          </div>
        </>
      )}

      <p className='text-xs italic tf-text-dim'>
        Read-only view. No bundles are created, sealed, or modified from this panel.
      </p>
    </section>
  );
}

export default CanonEvidenceViewer;

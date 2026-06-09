/**
 * Canon Diff + Risk Viewer (os-canon) — read-only proposed-change view.
 *
 * Shows a proposed change (the changed files) and the risk computed for it.
 * HONEST by construction:
 *   - It does NOT compute diffs, score risk, run gates, or mutate anything.
 *   - Empty by default; a proposed change + per-file risk (from `tf canon risk`
 *     or the task lifecycle) may be passed in via the `change` prop.
 *   - Aggregate risk is the max per-file level; manual review surfaces if any
 *     file requires it.
 *
 * Field shape mirrors os-platform/core/canon/canon-risk.mjs (RiskAssessment:
 * level / reasons / requiredGates / manualReviewRequired). No invented values.
 *
 * @module canon/CanonDiffRiskViewer
 */

import React from 'react';

/** Risk level — mirrors RiskLevel in canon-risk.mjs. */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Per-file risk within a proposed change. */
export interface FileRisk {
  path: string;
  level: RiskLevel;
  reasons?: readonly string[];
  requiredGates?: readonly string[];
  manualReviewRequired?: boolean;
}

/** A proposed change: a diff hash plus the changed files and their risk. */
export interface ProposedChange {
  diffHash?: string;
  files: readonly FileRisk[];
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-terra-cyan';
const mutedClass = 'text-xs tf-text-tertiary';
const codeClass = 'font-mono text-xs tf-text-secondary';

// Risk colors use canonical TerraFusion tokens (see CanonEvidenceViewer /
// CanonGateRunnerPanel). No net-new palette: low is muted, medium amber, high
// and critical red (critical is distinguished by weight + the uppercased label).
const RISK_CLASS: Record<RiskLevel, string> = {
  low: 'tf-text-tertiary',
  medium: 'text-amber-300',
  high: 'text-red-400',
  critical: 'text-red-400 font-bold',
};

const RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/** Aggregate risk = the highest per-file level (canon-risk maxLevel semantics). */
function aggregateLevel(files: readonly FileRisk[]): RiskLevel {
  return files.reduce<RiskLevel>((acc, f) => (RANK[f.level] > RANK[acc] ? f.level : acc), 'low');
}

function EmptyState(): React.ReactElement {
  return (
    <div className='flex flex-col gap-2'>
      <p className={mutedClass}>
        No diff loaded. A proposed change and its risk are computed by{' '}
        <span className={codeClass}>tf canon risk</span> over the changed paths — write-lane risk,
        escalated by any constitutional rule. This panel does not compute diffs, score risk, or run
        anything.
      </p>
      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Risk carries</span>
        <span className={mutedClass}>
          level (low · medium · high · critical) · reasons · required gates · manual-review flag
        </span>
      </div>
    </div>
  );
}

function FileRiskRow({ file }: { file: FileRisk }): React.ReactElement {
  return (
    <div className='flex flex-col gap-0.5'>
      <div className='flex items-baseline gap-2'>
        <span className={`text-xs font-semibold ${RISK_CLASS[file.level]}`}>
          {file.level === 'critical' ? 'CRITICAL' : file.level}
        </span>
        <span className={codeClass}>{file.path}</span>
        {file.manualReviewRequired ? (
          <span className='ml-auto text-xs font-semibold text-amber-300'>manual review</span>
        ) : null}
      </div>
      {(file.reasons ?? []).map((r, i) => (
        <span key={`${file.path}-reason-${i}`} className={mutedClass}>
          • {r}
        </span>
      ))}
      {(file.requiredGates ?? []).length > 0 ? (
        <span className={mutedClass}>
          required gates:{' '}
          <span className={codeClass}>{(file.requiredGates ?? []).join(' · ')}</span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Read-only Canon diff + risk viewer. No side effects, no controls.
 */
export function CanonDiffRiskViewer({ change }: { change?: ProposedChange }): React.ReactElement {
  const aggregate = change ? aggregateLevel(change.files) : null;
  const anyManualReview = change ? change.files.some((f) => f.manualReviewRequired) : false;

  return (
    <section
      className='canon-diff-risk-viewer liquid-panel--infrastructure bg-terra-slate flex flex-col gap-3 p-3'
      data-testid='terracanon-diff-risk-viewer'
      aria-label='Canon diff and risk viewer'
    >
      <header className='flex items-baseline justify-between'>
        <h3 className={labelClass}>Canon Diff &amp; Risk</h3>
        <span className={mutedClass}>read-only</span>
      </header>

      {!change ? (
        <EmptyState />
      ) : (
        <>
          <div className='flex items-baseline gap-2'>
            <span className={labelClass}>Aggregate risk</span>
            <span
              className={`text-xs font-semibold ${aggregate ? RISK_CLASS[aggregate] : 'tf-text-dim'}`}
              data-testid='terracanon-diff-risk-aggregate'
            >
              {aggregate === 'critical' ? 'CRITICAL' : (aggregate ?? 'n/a')}
            </span>
            {anyManualReview ? (
              <span className='text-xs font-semibold text-amber-300'>· manual review required</span>
            ) : null}
          </div>

          <div className='flex flex-col gap-1'>
            <span className={labelClass}>Diff</span>
            <span className={codeClass}>{change.diffHash ?? '(no diff hash)'}</span>
          </div>

          <div className='flex flex-col gap-2'>
            <span className={labelClass}>Changed files ({change.files.length})</span>
            {change.files.length === 0 ? (
              <span className={mutedClass}>none</span>
            ) : (
              change.files.map((f) => <FileRiskRow key={f.path} file={f} />)
            )}
          </div>
        </>
      )}

      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Current rail</span>
        <span className={codeClass}>tf canon risk</span>
      </div>

      <p className='text-xs italic tf-text-dim'>
        Read-only view. No diff is computed, no risk is scored, and nothing is mutated from this
        panel.
      </p>
    </section>
  );
}

export default CanonDiffRiskViewer;

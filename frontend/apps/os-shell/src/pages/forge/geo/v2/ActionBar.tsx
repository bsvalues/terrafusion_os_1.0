// ActionBar — persistent strip connecting audit to action.
// Simulate → commit workflow. All buttons gated on context (nbhd selected, sim run, etc.)

import type { SimulateResult } from './v2Api';

interface ActionBarProps {
  selectedNbhd: string | null;
  simResult: SimulateResult | null;
  onSimulate: () => void;
  onCommit: () => void;
  onFlagOutlier: () => void;
  onDraftMemo: () => void;
}

export function ActionBar({
  selectedNbhd,
  simResult,
  onSimulate,
  onCommit,
  onFlagOutlier,
  onDraftMemo,
}: ActionBarProps) {
  const hasSim = simResult !== null;
  const canCommit = hasSim && simResult.iaaoPass;

  return (
    <div className="gf2-actionbar">
      <span className="gf2-actionbar__context">
        {selectedNbhd ? `Nbhd ${selectedNbhd}` : 'No selection'}
      </span>

      <div className="gf2-actionbar__divider" />

      <button
        className="gf2-ab-btn gf2-ab-btn--primary"
        onClick={onSimulate}
        disabled={!selectedNbhd}
        title={!selectedNbhd ? 'Select a neighborhood first' : 'Run adjustment simulation'}
      >
        ⟳ Simulate
      </button>

      <button
        className={`gf2-ab-btn ${canCommit ? 'gf2-ab-btn--commit' : 'gf2-ab-btn--disabled'}`}
        onClick={onCommit}
        disabled={!canCommit}
        title={
          !hasSim ? 'Run simulation first'
          : !simResult.iaaoPass ? 'Projected ratio outside IAAO bounds — review before committing'
          : 'Queue mass adjustment for supervisor approval'
        }
      >
        ✓ Commit Adjustment
      </button>

      <div className="gf2-actionbar__spacer" />

      <button
        className="gf2-ab-btn gf2-ab-btn--secondary"
        onClick={onFlagOutlier}
        disabled={!selectedNbhd}
        title="Flag neighborhood for outlier review"
      >
        ⚑ Flag Outlier
      </button>

      <button
        className="gf2-ab-btn gf2-ab-btn--secondary"
        onClick={onDraftMemo}
        disabled={!selectedNbhd}
        title="Auto-draft DOR memo from audit chain"
      >
        ◎ Draft Memo
      </button>

      {hasSim && (
        <div className={`gf2-actionbar__sim-badge ${simResult.iaaoPass ? 'gf2-actionbar__sim-badge--pass' : 'gf2-actionbar__sim-badge--fail'}`}>
          sim: {simResult.projected.medianRatio.toFixed(4)}
          {' '}
          {simResult.iaaoPass ? '✓ IAAO pass' : '✗ outside bounds'}
        </div>
      )}
    </div>
  );
}

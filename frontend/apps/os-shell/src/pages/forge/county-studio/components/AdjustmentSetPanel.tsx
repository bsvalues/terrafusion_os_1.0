// frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx
//
// Governance workflow panel for CountyAdjustmentSets.
// Lists all adjustment sets for the active study and exposes the approval
// state-machine buttons: Submit -> Approve. County Studio stops at
// Approved; publish/apply belongs to a separate governed lane.
// Read-only when no study is loaded or when a set is terminal.

import React, { useEffect, useState, useCallback } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { adjustmentSetApi } from '../countyStudyApi';
import type { CountyAdjustmentSetDto, AdjustmentSetApprovalState } from '../types/countyStudio.types';
import activateModule from '@/orchestration/moduleActivation';
import { useAdjustmentApplyHandoffStore, type AdjustmentApplyHandoff } from '@/pages/suites/adjustmentApplyHandoffStore';

// ── State badge ───────────────────────────────────────────────────────────────

const STATE_COLOR: Record<AdjustmentSetApprovalState, string> = {
  Proposed:         '#6b7280',
  ReadyForApproval: '#f59e0b',
  Approved:         '#3b82f6',
  // Legacy read-only terminal states; County Studio no longer advances
  // adjustment sets into these states.
  Published:        '#22c55e',
  RolledBack:       '#ef4444',
};

function StateBadge({ state }: { state: AdjustmentSetApprovalState }) {
  return (
    <span
      data-testid={`state-badge-${state}`}
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 10,
        background: STATE_COLOR[state] + '22',
        color: STATE_COLOR[state],
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {state}
    </span>
  );
}

type ApplyPostureState = 'blocked' | 'ready' | 'handedOff' | 'applied' | 'rolledBack';

const APPLY_POSTURE: Record<ApplyPostureState, { label: string; detail: string; color: string; bg: string }> = {
  blocked: {
    label: 'Apply blocked',
    detail: 'Approval is not complete. County Studio cannot hand this set to the apply lane yet.',
    color: 'hsl(var(--tf-muted))',
    bg: 'hsl(var(--tf-surface))',
  },
  ready: {
    label: 'Ready for apply handoff',
    detail: 'Approved in County Studio. Actual value mutation still belongs to the governed apply lane.',
    color: 'hsl(var(--tf-warning, 38 92% 50%))',
    bg: 'hsl(var(--tf-warning, 38 92% 50%) / 0.14)',
  },
  handedOff: {
    label: 'Handed off for apply',
    detail: 'Apply packet handoff has been prepared. County Studio is waiting for external publish/apply evidence.',
    color: 'hsl(var(--tf-accent, 217 91% 60%))',
    bg: 'hsl(var(--tf-accent, 217 91% 60%) / 0.14)',
  },
  applied: {
    label: 'Applied externally',
    detail: 'Published state was reported by the governed apply lane.',
    color: 'hsl(var(--tf-success, 142 71% 45%))',
    bg: 'hsl(var(--tf-success, 142 71% 45%) / 0.14)',
  },
  rolledBack: {
    label: 'Rolled back',
    detail: 'Rollback was reported by the governed apply lane.',
    color: 'hsl(var(--tf-danger, 0 84% 60%))',
    bg: 'hsl(var(--tf-danger, 0 84% 60%) / 0.14)',
  },
};

function applyPostureFor(adj: CountyAdjustmentSetDto, handoff?: AdjustmentApplyHandoff): ApplyPostureState {
  if (adj.approvalState === 'Published') return 'applied';
  if (adj.approvalState === 'RolledBack') return 'rolledBack';
  if (adj.approvalState !== 'Approved') return 'blocked';
  if (handoff?.status === 'AppliedExternally') return 'applied';
  if (handoff?.status === 'RolledBack') return 'rolledBack';
  return handoff ? 'handedOff' : 'ready';
}

// ── Legal next-state map ──────────────────────────────────────────────────────

const NEXT_STATES: Partial<Record<AdjustmentSetApprovalState, { state: AdjustmentSetApprovalState; label: string }[]>> = {
  Proposed:         [{ state: 'ReadyForApproval', label: 'Submit for Approval' }],
  ReadyForApproval: [
    { state: 'Approved', label: 'Approve'   },
    { state: 'Proposed', label: 'Send Back' },
  ],
  Approved: [],
  Published: [],
  RolledBack: [],
};

// ── Single row ────────────────────────────────────────────────────────────────

function AdjSetRow({
  adj,
  onAction,
  onPrepareApply,
  applyHandoff,
  busy,
}: {
  adj: CountyAdjustmentSetDto;
  onAction: (id: string, state: AdjustmentSetApprovalState, reason?: string) => void;
  onPrepareApply: (adj: CountyAdjustmentSetDto) => void;
  applyHandoff?: AdjustmentApplyHandoff;
  busy: string | null;
}) {
  const actions = NEXT_STATES[adj.approvalState] ?? [];
  const isBusy  = busy === adj.adjustmentSetId;
  const applyPosture = APPLY_POSTURE[applyPostureFor(adj, applyHandoff)];
  const applyHandoffPrepared = Boolean(applyHandoff);

  const handleClick = (state: AdjustmentSetApprovalState) => {
    onAction(adj.adjustmentSetId, state);
  };

  return (
    <div
      data-testid={`adj-row-${adj.adjustmentSetId}`}
      style={{
        borderBottom: '1px solid hsl(var(--tf-border))',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {adj.adjustmentSetId.slice(0, 8)}…
        </span>
        <StateBadge state={adj.approvalState} />
        {adj.approvedBy && (
          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            ✓ {adj.approvedBy}
          </span>
        )}
        {adj.publishedAt && (
          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            Published {new Date(adj.publishedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
        Scenario {adj.scenarioId.slice(0, 8)}…
      </span>

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          {actions.map(({ state, label }) => (
            <button
              key={state}
              data-testid={`btn-${state}-${adj.adjustmentSetId}`}
              disabled={isBusy}
              onClick={() => handleClick(state)}
              style={{
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid hsl(var(--tf-border))',
                background: 'hsl(var(--tf-surface))',
                color: 'hsl(var(--tf-fg))',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              {isBusy ? '…' : label}
            </button>
          ))}
        </div>
      )}

      <div
        data-testid={`apply-posture-${adj.adjustmentSetId}`}
        style={{
          marginTop: 4,
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 10,
              background: applyPosture.bg,
              color: applyPosture.color,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            {applyPosture.label}
          </span>
          {adj.publishedAt && (
            <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
              Published {new Date(adj.publishedAt).toLocaleDateString()}
            </span>
          )}
          {adj.rollbackReason && (
            <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
              Reason: {adj.rollbackReason}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
          {applyPosture.detail}
        </div>
        {applyHandoff && (
          <div
            data-testid={`apply-receipt-${adj.adjustmentSetId}`}
            style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}
          >
            Receipt: {applyHandoff.status} · updated {new Date(applyHandoff.updatedAt).toLocaleString()}
            {applyHandoff.evidenceRef ? ` · evidence ${applyHandoff.evidenceRef}` : ''}
          </div>
        )}
        {adj.approvalState === 'Approved' && (
          <button
            type="button"
            data-testid={`btn-PrepareApply-${adj.adjustmentSetId}`}
            onClick={() => onPrepareApply(adj)}
            style={{
              alignSelf: 'flex-start',
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid hsl(var(--tf-border))',
              background: applyHandoffPrepared ? 'hsl(var(--tf-surface))' : 'hsl(var(--tf-accent, 217 91% 60%) / 0.14)',
              color: applyHandoffPrepared ? 'hsl(var(--tf-muted))' : 'hsl(var(--tf-accent, 217 91% 60%))',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {applyHandoffPrepared ? 'Reopen Apply Handoff' : 'Prepare Apply Handoff'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function AdjustmentSetPanel() {
  const { activeStudy } = useCountyStudioStore();
  const lastPromotedAt = useCountyStudioStore((s) => s.lastPromotedAt);
  const studyId = activeStudy?.studyId ?? null;

  const [sets,    setSets]    = useState<CountyAdjustmentSetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [busy,    setBusy]    = useState<string | null>(null);
  const applyHandoffs = useAdjustmentApplyHandoffStore((s) => s.handoffs);
  const prepareApplyHandoff = useAdjustmentApplyHandoffStore((s) => s.prepareHandoff);
  const replaceApplyReceiptsForStudy = useAdjustmentApplyHandoffStore((s) => s.replaceReceiptsForStudy);
  const ingestApplyReceipt = useAdjustmentApplyHandoffStore((s) => s.ingestReceipt);

  const load = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, receipts] = await Promise.all([
        adjustmentSetApi.list(studyId),
        adjustmentSetApi.listApplyHandoffReceipts(studyId),
      ]);
      replaceApplyReceiptsForStudy(studyId, receipts);
      setSets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load adjustment sets');
    } finally {
      setLoading(false);
    }
  }, [replaceApplyReceiptsForStudy, studyId]);

  useEffect(() => { void load(); }, [load, lastPromotedAt]);

  const handleAction = useCallback(async (
    id: string,
    newState: AdjustmentSetApprovalState,
    reason?: string,
  ) => {
    setBusy(id);
    try {
      const updated = await adjustmentSetApi.updateApprovalState(id, newState, reason);
      setSets((prev) => prev.map((a) => a.adjustmentSetId === id ? updated : a));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transition failed');
    } finally {
      setBusy(null);
    }
  }, []);

  const handlePrepareApply = useCallback((adj: CountyAdjustmentSetDto) => {
    setBusy(adj.adjustmentSetId);
    void adjustmentSetApi.recordApplyHandoffReceipt(adj.adjustmentSetId, {
      status: 'Prepared',
      template: 'AdjustmentApplyPacket',
    })
      .then((receipt) => {
        ingestApplyReceipt(receipt);
        prepareApplyHandoff({
          adjustmentSetId: adj.adjustmentSetId,
          scenarioId: adj.scenarioId,
          studyId: adj.studyId,
        });
        void activateModule('suite-dossier', {
          source: 'system',
          metadata: {
            applyTemplate: 'AdjustmentApplyPacket',
            adjustmentSetId: adj.adjustmentSetId,
            scenarioId: adj.scenarioId,
            studyId: adj.studyId,
          },
        });
      })
      .catch((receiptError) => {
        setError(receiptError instanceof Error
          ? receiptError.message
          : 'Failed to persist adjustment apply handoff receipt');
      })
      .finally(() => setBusy(null));
  }, [ingestApplyReceipt, prepareApplyHandoff]);

  if (!studyId) {
    return (
      <div
        data-testid="adj-panel-no-study"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12, padding: 16,
          textAlign: 'center',
        }}
      >
        Open a study to view adjustment sets.
      </div>
    );
  }

  if (loading) {
    return (
      <div
        data-testid="adj-panel-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading adjustment sets"
        style={{ padding: 16, color: 'hsl(var(--tf-muted))', fontSize: 12 }}
      >
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="adj-panel-error"
        role="alert"
        style={{ padding: 12, color: '#ef4444', fontSize: 12 }}
      >
        {error}
        <button
          onClick={load}
          style={{
            marginLeft: 8, fontSize: 10, padding: '2px 8px',
            border: '1px solid hsl(var(--tf-border))', borderRadius: 4,
            background: 'hsl(var(--tf-surface))', cursor: 'pointer',
            color: 'hsl(var(--tf-fg))',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div
        data-testid="adj-panel-empty"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', padding: 16,
          color: 'hsl(var(--tf-muted))', fontSize: 12, textAlign: 'center', gap: 6,
        }}
      >
        <div>No adjustment sets yet.</div>
        <div style={{ fontSize: 10 }}>
          Promote a saved scenario from the Scenario tab to create one.
        </div>
      </div>
    );
  }

  return (
    <div data-testid="adj-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          fontSize: 10,
          color: 'hsl(var(--tf-muted))',
          flexShrink: 0,
        }}
      >
        {sets.length} adjustment set{sets.length !== 1 ? 's' : ''} — most recent first
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sets.map((adj) => (
          <AdjSetRow
            key={adj.adjustmentSetId}
            adj={adj}
            onAction={handleAction}
            onPrepareApply={handlePrepareApply}
            applyHandoff={applyHandoffs[adj.adjustmentSetId]}
            busy={busy}
          />
        ))}
      </div>
    </div>
  );
}

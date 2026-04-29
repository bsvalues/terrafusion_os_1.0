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
  busy,
}: {
  adj: CountyAdjustmentSetDto;
  onAction: (id: string, state: AdjustmentSetApprovalState, reason?: string) => void;
  busy: string | null;
}) {
  const actions = NEXT_STATES[adj.approvalState] ?? [];
  const isBusy  = busy === adj.adjustmentSetId;

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

  const load = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adjustmentSetApi.list(studyId);
      setSets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load adjustment sets');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

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
            busy={busy}
          />
        ))}
      </div>
    </div>
  );
}

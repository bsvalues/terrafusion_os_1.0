/**
 * DraftReviewPanel — HITL approval UI for AI-proposed changes.
 * Shows current vs proposed delta. Human must approve before commit.
 */

import { useState, useCallback } from 'react';
import { useAuthContext, toOsActor } from '@/auth/useAuthContext';
import type { DraftOperation } from '@/types/terraOperation';
import { emitIntent, emitResult } from '@/services/terraTrace';

interface DraftReviewPanelProps {
  draft: DraftOperation;
  onApprove: (draftId: string, approverId: string) => void;
  onReject: (draftId: string, reason: string, rejectorId: string) => void;
}

export function DraftReviewPanel({ draft, onApprove, onReject }: DraftReviewPanelProps) {
  const auth = useAuthContext();
  const actor = toOsActor(auth);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = useCallback(() => {
    if (!actor) return;
    const intentId = `approve-${draft.draftId}-${Date.now()}`;
    const traceId = `trace-${Date.now()}`;
    const startTime = Date.now();

    emitIntent({
      intentId,
      source: 'UI_WORKBENCH',
      intent: 'DRAFT_APPROVE',
      countyId: actor.countyId,
      actorId: actor.userId,
      timestamp: new Date().toISOString(),
    });

    onApprove(draft.draftId, actor.userId);

    emitResult({
      intentId,
      outcome: 'EXECUTED',
      traceId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }, [actor, draft.draftId, onApprove]);

  const handleReject = useCallback(() => {
    if (!actor || !rejectionReason.trim()) return;
    const intentId = `reject-${draft.draftId}-${Date.now()}`;
    const traceId = `trace-${Date.now()}`;
    const startTime = Date.now();

    emitIntent({
      intentId,
      source: 'UI_WORKBENCH',
      intent: 'DRAFT_REJECT',
      countyId: actor.countyId,
      actorId: actor.userId,
      timestamp: new Date().toISOString(),
    });

    onReject(draft.draftId, rejectionReason, actor.userId);

    emitResult({
      intentId,
      outcome: 'EXECUTED',
      traceId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }, [actor, draft.draftId, rejectionReason, onReject]);

  if (!actor) {
    return <div data-testid="draft-unauthenticated">Authentication required to review drafts.</div>;
  }

  return (
    <div data-testid="draft-review-panel">
      <h3>Draft Review — HITL Approval Required</h3>
      <p data-testid="draft-description">{draft.description}</p>
      <p data-testid="draft-status">Status: {draft.status}</p>
      <p data-testid="draft-proposed-by">Proposed by: {draft.proposedBy}</p>

      <div data-testid="draft-delta">
        <div data-testid="draft-current">
          <h4>Current Value</h4>
          <pre>{JSON.stringify(draft.currentValue, null, 2)}</pre>
        </div>
        <div data-testid="draft-proposed">
          <h4>Proposed Value</h4>
          <pre>{JSON.stringify(draft.proposedValue, null, 2)}</pre>
        </div>
      </div>

      {draft.status === 'PENDING' && (
        <div data-testid="draft-actions">
          <button
            data-testid="draft-approve-button"
            onClick={handleApprove}
          >
            Approve
          </button>
          <div>
            <textarea
              data-testid="draft-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={2}
            />
            <button
              data-testid="draft-reject-button"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

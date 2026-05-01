/**
 * DaisWorkflowDraftPanel.tsx
 * -------------------------------------------------------------
 * Task D3 — renders the active segment-workflow draft handed off
 * from County Studio. Shows nothing (returns null) when no durable draft
 * is in the segmentWorkflowDraftStore.
 *
 * Buttons:
 *   • "Open in Dais Workbench" — opens Property Workbench's Dais tab
 *     with handoff metadata and records the downstream receipt as opened.
 *   • "Dismiss draft" — clears the draft via clearDraft().
 *
 * Also renders a "← From County Studio · Segment X" chip that
 * round-trips to the County Studio module with the segmentId.
 */
import { useCallback } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { useSegmentWorkflowDraftStore } from '../../pages/suites/segmentWorkflowDraftStore';
import { useDownstreamClosureReceiptStore } from '../../pages/suites/downstreamClosureReceiptStore';

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month:  'short',
      day:    'numeric',
      hour:   'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function DaisWorkflowDraftPanel() {
  const activeDraft = useSegmentWorkflowDraftStore((s) => s.activeDraft);
  const clearDraft  = useSegmentWorkflowDraftStore((s) => s.clearDraft);
  const receipt = useDownstreamClosureReceiptStore((s) =>
    activeDraft?.handoff?.exceptionSetId ? s.receipts[activeDraft.handoff.exceptionSetId] : undefined,
  );
  const markOpened = useDownstreamClosureReceiptStore((s) => s.markOpened);
  const markReturned = useDownstreamClosureReceiptStore((s) => s.markReturned);

  const handleBackToCountyStudio = useCallback(() => {
    if (!activeDraft) return;
    void activateModule('county-studio', {
      source:   'system',
      metadata: { segmentId: activeDraft.segmentId },
    });
  }, [activeDraft]);

  const handleOpenWorkbench = useCallback(() => {
    if (!activeDraft) return;
    const exceptionSetId = activeDraft.handoff?.exceptionSetId;
    if (exceptionSetId) {
      markOpened(exceptionSetId);
    }
    void activateModule('property-workbench', {
      source: 'system',
      metadata: {
        tabId: 'dais',
        segmentId: activeDraft.segmentId,
        segmentLabel: activeDraft.segmentLabel,
        countyStudioHandoff: activeDraft.template,
        exceptionSetId,
      },
    });
  }, [activeDraft, markOpened]);

  const handleReturnReceipt = useCallback(() => {
    if (!activeDraft?.handoff?.exceptionSetId) return;
    markReturned(activeDraft.handoff.exceptionSetId);
    void activateModule('county-studio', {
      source: 'system',
      metadata: {
        segmentId: activeDraft.segmentId,
        exceptionSetId: activeDraft.handoff.exceptionSetId,
        downstreamStatus: 'Returned',
      },
    });
  }, [activeDraft, markReturned]);

  if (!activeDraft) return null;

  return (
    <section
      data-testid="dais-workflow-draft-panel"
      className="px-6 pt-5"
    >
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: 'hsl(var(--tf-suite-dais) / 0.35)',
          background:  'hsl(var(--tf-suite-dais) / 0.08)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'hsl(var(--tf-suite-dais))' }}
            >
              County Studio Handoff · Segment Review
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
              New Segment Review workflow (draft)
            </h2>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
              Segment <span style={{ color: 'hsl(var(--tf-suite-dais))', fontWeight: 600 }} data-testid="dais-draft-segment-label">{activeDraft.segmentLabel}</span>
              {' · '}
              <span data-testid="dais-draft-timestamp">Drafted {formatTimestamp(activeDraft.createdAt)}</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted) / 0.75)' }}>
              Draft is persisted locally until dismissed. County Studio remains the queue owner.
            </p>
            {receipt && (
              <p className="mt-1 text-xs" data-testid="dais-draft-receipt-status" style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                Downstream receipt: {receipt.status} · updated {formatTimestamp(receipt.updatedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            data-testid="dais-draft-back-chip"
            data-segment-id={activeDraft.segmentId}
            onClick={handleBackToCountyStudio}
            title="Back to County Studio"
            style={{
              background:   'hsl(var(--tf-suite-dais) / 0.14)',
              border:       '1px solid hsl(var(--tf-suite-dais) / 0.4)',
              color:        'hsl(var(--tf-suite-dais))',
              padding:      '4px 12px',
              borderRadius: 999,
              fontSize:     11,
              fontWeight:   600,
              cursor:       'pointer',
              height:       'fit-content',
            }}
          >
            ← From County Studio · Segment {activeDraft.segmentLabel}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="dais-draft-open-workbench"
            onClick={handleOpenWorkbench}
            title="Open the Property Workbench Dais tab with this County Studio handoff metadata."
            className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: 'hsl(var(--tf-suite-dais) / 0.35)',
              background:  'hsl(var(--tf-suite-dais) / 0.12)',
              color:       'hsl(var(--tf-suite-dais))',
            }}
          >
            Open in Dais Workbench
          </button>
          {activeDraft.handoff?.exceptionSetId && (
            <button
              type="button"
              data-testid="dais-draft-return-receipt"
              onClick={handleReturnReceipt}
              className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em]"
              style={{
                borderColor: 'hsl(var(--tf-success, 142 71% 45%) / 0.4)',
                background:  'hsl(var(--tf-success, 142 71% 45%) / 0.12)',
                color:       'hsl(var(--tf-success, 142 71% 45%))',
              }}
            >
              Return receipt
            </button>
          )}
          <button
            type="button"
            data-testid="dais-draft-dismiss"
            onClick={clearDraft}
            className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em]"
            style={{
              borderColor: 'hsl(var(--tf-border))',
              background:  'transparent',
              color:       'hsl(var(--tf-muted))',
            }}
          >
            Dismiss draft
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * DossierEvidenceDraftPanel.tsx
 * -------------------------------------------------------------
 * Task D3 — renders the active segment-evidence draft handed off
 * from County Studio. Returns null when no durable draft is in the
 * segmentEvidenceDraftStore.
 *
 * Buttons:
 *   • "Open evidence packet builder" — opens Property Workbench's Dossier
 *     tab with handoff metadata and records the downstream receipt as opened.
 *   • "Dismiss draft" — clears the draft via clearDraft().
 *
 * Also renders a "← From County Studio · Segment X" chip that
 * round-trips to the County Studio module with the segmentId.
 */
import { useCallback } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { useSegmentEvidenceDraftStore } from '../../pages/suites/segmentEvidenceDraftStore';
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

export default function DossierEvidenceDraftPanel() {
  const activeDraft = useSegmentEvidenceDraftStore((s) => s.activeDraft);
  const clearDraft  = useSegmentEvidenceDraftStore((s) => s.clearDraft);
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

  const handleOpenBuilder = useCallback(() => {
    if (!activeDraft) return;
    const exceptionSetId = activeDraft.handoff?.exceptionSetId;
    if (exceptionSetId) {
      markOpened(exceptionSetId);
    }
    void activateModule('property-workbench', {
      source: 'system',
      metadata: {
        tabId: 'dossier',
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
      data-testid="dossier-evidence-draft-panel"
      className="px-6 pt-5"
    >
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
          background:  'hsl(var(--tf-suite-dossier) / 0.08)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'hsl(var(--tf-suite-dossier))' }}
            >
              County Studio Handoff · Segment Evidence
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
              New Segment Evidence packet (draft)
            </h2>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
              Segment <span style={{ color: 'hsl(var(--tf-suite-dossier))', fontWeight: 600 }} data-testid="dossier-draft-segment-label">{activeDraft.segmentLabel}</span>
              {' · '}
              <span data-testid="dossier-draft-timestamp">Drafted {formatTimestamp(activeDraft.createdAt)}</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted) / 0.75)' }}>
              Draft is persisted locally until dismissed. County Studio remains the queue owner.
            </p>
            {receipt && (
              <p className="mt-1 text-xs" data-testid="dossier-draft-receipt-status" style={{ color: 'hsl(var(--tf-suite-dossier))' }}>
                Downstream receipt: {receipt.status} · updated {formatTimestamp(receipt.updatedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            data-testid="dossier-draft-back-chip"
            data-segment-id={activeDraft.segmentId}
            onClick={handleBackToCountyStudio}
            title="Back to County Studio"
            style={{
              background:   'hsl(var(--tf-suite-dossier) / 0.14)',
              border:       '1px solid hsl(var(--tf-suite-dossier) / 0.4)',
              color:        'hsl(var(--tf-suite-dossier))',
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
            data-testid="dossier-draft-open-builder"
            onClick={handleOpenBuilder}
            title="Open the Property Workbench Dossier tab with this County Studio handoff metadata."
            className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
              background:  'hsl(var(--tf-suite-dossier) / 0.12)',
              color:       'hsl(var(--tf-suite-dossier))',
            }}
          >
            Open evidence packet builder
          </button>
          {activeDraft.handoff?.exceptionSetId && (
            <button
              type="button"
              data-testid="dossier-draft-return-receipt"
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
            data-testid="dossier-draft-dismiss"
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

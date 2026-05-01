// ExceptionQueuePanel.tsx
// Full lifecycle work surface for CountyExceptionSet rows.
// Shows: reason code pill, parcel count, destination badge, status badge, age, assignee
// Actions per row: Assign, Dispatch, Resolve, Add Note (inline expand)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { exceptionApi } from '../countyStudyApi';
import type { CountyDownstreamClosureReceiptDto, CountyExceptionSetDto } from '../countyStudyApi';
import { useSegmentWorkflowDraftStore } from '@/pages/suites/segmentWorkflowDraftStore';
import { useSegmentEvidenceDraftStore } from '@/pages/suites/segmentEvidenceDraftStore';
import {
  useDownstreamClosureReceiptStore,
  type DownstreamClosureReceipt,
  type DownstreamDestination,
} from '@/pages/suites/downstreamClosureReceiptStore';

function toLocalReceipt(dto: CountyDownstreamClosureReceiptDto): DownstreamClosureReceipt {
  return {
    receiptId: dto.receiptId,
    exceptionSetId: dto.exceptionSetId,
    sourceType: dto.sourceType,
    destination: dto.destination,
    template: dto.template,
    segmentId: dto.segmentId,
    segmentLabel: dto.segmentLabel,
    status: dto.status,
    downstreamEntityId: dto.downstreamEntityId,
    evidenceRef: dto.evidenceRef,
    notes: dto.notes,
    draftedAt: dto.draftedAt,
    updatedAt: dto.updatedAt,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type QueueTone = 'ready' | 'watch' | 'blocked' | 'neutral';

const TONE: Record<QueueTone, { color: string; bg: string; label: string }> = {
  ready: {
    color: 'hsl(var(--tf-success, 142 71% 45%))',
    bg: 'hsl(var(--tf-success, 142 71% 45%) / 0.14)',
    label: 'Ready',
  },
  watch: {
    color: 'hsl(var(--tf-warning, 38 92% 50%))',
    bg: 'hsl(var(--tf-warning, 38 92% 50%) / 0.14)',
    label: 'Watch',
  },
  blocked: {
    color: 'hsl(var(--tf-danger, 0 84% 60%))',
    bg: 'hsl(var(--tf-danger, 0 84% 60%) / 0.14)',
    label: 'Blocked',
  },
  neutral: {
    color: 'hsl(var(--tf-muted))',
    bg: 'hsl(var(--tf-surface))',
    label: 'Queued',
  },
};

function reasonLabel(code: string): string {
  const labels: Record<string, string> = {
    LowSample: 'Low Sample', SegmentInstability: 'Instability',
    Outlier: 'Outlier', EdgeEffect: 'Edge Effect',
    Heterogeneity: 'Heterogeneity', ManualFlag: 'Manual Flag',
  };
  return labels[code] ?? code;
}

function reasonColor(code: string): string {
  if (code === 'LowSample' || code === 'SegmentInstability') return '#f59e0b';
  if (code === 'Outlier' || code === 'ManualFlag') return '#ef4444';
  return '#6366f1';
}

function statusColor(status: string): string {
  if (status === 'Resolved') return '#22c55e';
  if (status === 'Dispatched') return '#3b82f6';
  return '#6b7280';
}

function destColor(dest: string): string {
  if (dest === 'Dais') return '#8b5cf6';
  if (dest === 'Dossier') return '#06b6d4';
  return '#6b7280';
}

function ageString(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ageDays(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
}

function queueToneForException(exc: CountyExceptionSetDto): QueueTone {
  if (exc.status === 'Resolved') return 'ready';
  if (!exc.assignedTo) return 'blocked';
  if (ageDays(exc.createdAt) >= 3) return 'watch';
  if (exc.status === 'Dispatched') return 'watch';
  return 'neutral';
}

function nextActionForException(exc: CountyExceptionSetDto): string {
  if (exc.status === 'Resolved') return 'Closed';
  if (!exc.assignedTo) return 'Assign owner';
  if (exc.status !== 'Dispatched') return `Dispatch to ${exc.destination}`;
  return 'Resolve dispatched work';
}

function routePathForDestination(destination: string, segmentId: string, exceptionSetId?: string): string | null {
  const encodedSegmentId = encodeURIComponent(segmentId);
  const receiptParam = exceptionSetId ? `&exceptionSetId=${encodeURIComponent(exceptionSetId)}` : '';
  if (destination === 'Dais') {
    return `/suites/dais?template=SegmentReview&segmentId=${encodedSegmentId}${receiptParam}`;
  }
  if (destination === 'Dossier') {
    return `/suites/dossier?template=SegmentEvidence&segmentId=${encodedSegmentId}${receiptParam}`;
  }
  return null;
}

function isDownstreamDestination(destination: string): destination is DownstreamDestination {
  return destination === 'Dais' || destination === 'Dossier';
}

function receiptRouteStatus(exc: CountyExceptionSetDto, receipt: DownstreamClosureReceipt | undefined): string {
  if (exc.status === 'Resolved') return 'Closure recorded in County Studio';
  if (!receipt) {
    return exc.status === 'Dispatched'
      ? `Routed to ${exc.destination}`
      : `Ready for ${exc.destination} handoff`;
  }
  if (receipt.status === 'Returned') return `Returned from ${receipt.destination}`;
  if (receipt.status === 'Opened') return `Opened in ${receipt.destination}`;
  return `Draft saved for ${receipt.destination}`;
}

function receiptClosureStatus(exc: CountyExceptionSetDto, receipt: DownstreamClosureReceipt | undefined): string {
  if (exc.status === 'Resolved') return 'Closed';
  if (receipt?.status === 'Returned') return 'Ready for County Studio closure';
  if (receipt?.status === 'Opened') return 'Downstream work opened';
  if (exc.status === 'Dispatched') return 'Awaiting return';
  return 'Not dispatched';
}

const pill = (label: string, color: string, bg = `${color}22`) => (
  <span style={{
    padding: '1px 6px', borderRadius: 10,
    background: bg, color, fontSize: 10, fontWeight: 700,
    whiteSpace: 'nowrap',
  }}>{label}</span>
);

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  exc: CountyExceptionSetDto;
  onUpdated: (updated: CountyExceptionSetDto) => void;
  receipt?: DownstreamClosureReceipt;
}

function ExceptionRow({ exc, onUpdated, receipt }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [assignName, setAssignName] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const createWorkflowDraft = useSegmentWorkflowDraftStore((s) => s.createDraft);
  const createEvidenceDraft = useSegmentEvidenceDraftStore((s) => s.createDraft);
  const recordDraft = useDownstreamClosureReceiptStore((s) => s.recordDraft);
  const ingestReceipt = useDownstreamClosureReceiptStore((s) => s.ingestReceipt);

  const act = useCallback(async (fn: () => Promise<CountyExceptionSetDto>) => {
    setBusy(true);
    try { onUpdated(await fn()); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  }, [onUpdated]);

  const routeToDestination = useCallback(() => {
    act(async () => {
      const updated = await exceptionApi.updateStatus(exc.exceptionSetId, 'Dispatched');
      if (isDownstreamDestination(exc.destination)) {
        const draftReceipt = {
          exceptionSetId: exc.exceptionSetId,
          destination: exc.destination,
          template: exc.destination === 'Dais' ? 'SegmentReview' : 'SegmentEvidence',
          segmentId: exc.sourceScenarioId,
          segmentLabel: `Exception: ${reasonLabel(exc.reasonCode)}`,
        };
        recordDraft(draftReceipt);
        try {
          const receipt = await exceptionApi.recordDownstreamReceipt(exc.exceptionSetId, {
            destination: draftReceipt.destination,
            template: draftReceipt.template,
            segmentId: draftReceipt.segmentId,
            segmentLabel: draftReceipt.segmentLabel,
            status: 'Drafted',
          });
          ingestReceipt(toLocalReceipt(receipt));
        } catch (receiptError) {
          console.error('Failed to persist downstream receipt', receiptError);
        }
      }
      if (exc.destination === 'Dais') {
        createWorkflowDraft(
          'SegmentReview',
          exc.sourceScenarioId,
          `Exception: ${reasonLabel(exc.reasonCode)}`,
          {
            exceptionSetId: exc.exceptionSetId,
            destination: 'Dais',
            studyId: exc.studyId,
          },
        );
        navigate(routePathForDestination(exc.destination, exc.sourceScenarioId, exc.exceptionSetId) ?? '/suites/dais');
      } else if (exc.destination === 'Dossier') {
        createEvidenceDraft(
          'SegmentEvidence',
          exc.sourceScenarioId,
          `Exception: ${reasonLabel(exc.reasonCode)}`,
          {
            exceptionSetId: exc.exceptionSetId,
            destination: 'Dossier',
            studyId: exc.studyId,
          },
        );
        navigate(routePathForDestination(exc.destination, exc.sourceScenarioId, exc.exceptionSetId) ?? '/suites/dossier');
      }
      return updated;
    });
  }, [exc, act, navigate, createWorkflowDraft, createEvidenceDraft, recordDraft, ingestReceipt]);

  const reopenDestination = useCallback(() => {
    if (isDownstreamDestination(exc.destination)) {
      const draftReceipt = {
        exceptionSetId: exc.exceptionSetId,
        destination: exc.destination,
        template: exc.destination === 'Dais' ? 'SegmentReview' : 'SegmentEvidence',
        segmentId: exc.sourceScenarioId,
        segmentLabel: `Exception: ${reasonLabel(exc.reasonCode)}`,
      };
      recordDraft(draftReceipt);
      void exceptionApi.recordDownstreamReceipt(exc.exceptionSetId, {
        destination: draftReceipt.destination,
        template: draftReceipt.template,
        segmentId: draftReceipt.segmentId,
        segmentLabel: draftReceipt.segmentLabel,
        status: receipt?.status ?? 'Drafted',
      })
        .then((saved) => ingestReceipt(toLocalReceipt(saved)))
        .catch((receiptError) => console.error('Failed to persist reopened downstream receipt', receiptError));
    }
    if (exc.destination === 'Dais') {
      createWorkflowDraft(
        'SegmentReview',
        exc.sourceScenarioId,
        `Exception: ${reasonLabel(exc.reasonCode)}`,
        {
          exceptionSetId: exc.exceptionSetId,
          destination: 'Dais',
          studyId: exc.studyId,
        },
      );
    } else if (exc.destination === 'Dossier') {
      createEvidenceDraft(
        'SegmentEvidence',
        exc.sourceScenarioId,
        `Exception: ${reasonLabel(exc.reasonCode)}`,
        {
          exceptionSetId: exc.exceptionSetId,
          destination: 'Dossier',
          studyId: exc.studyId,
        },
      );
    }
    const routePath = routePathForDestination(exc.destination, exc.sourceScenarioId, exc.exceptionSetId);
    if (routePath) navigate(routePath);
  }, [exc, navigate, createWorkflowDraft, createEvidenceDraft, recordDraft, ingestReceipt, receipt?.status]);

  const handleResolve = useCallback(() =>
    act(() => exceptionApi.updateStatus(exc.exceptionSetId, 'Resolved')), [exc, act]);

  const handleAssign = useCallback(() => {
    if (!assignName.trim()) return;
    act(async () => {
      const u = await exceptionApi.assign(exc.exceptionSetId, assignName.trim());
      setAssignName('');
      return u;
    });
  }, [exc, assignName, act]);

  const handleNote = useCallback(() => {
    if (!noteText.trim()) return;
    act(async () => {
      const u = await exceptionApi.addNote(exc.exceptionSetId, noteText.trim());
      setNoteText('');
      return u;
    });
  }, [exc, noteText, act]);

  const resolved = exc.status === 'Resolved';
  const tone = TONE[queueToneForException(exc)];
  const nextAction = nextActionForException(exc);
  const rowAgeDays = ageDays(exc.createdAt);
  const destinationRoute = routePathForDestination(exc.destination, exc.sourceScenarioId, exc.exceptionSetId);
  const hasRoute = Boolean(destinationRoute);
  const routeStatus = hasRoute ? receiptRouteStatus(exc, receipt) : 'Internal follow-up';
  const closureStatus = hasRoute ? receiptClosureStatus(exc, receipt) : resolved ? 'Closed' : 'Internal follow-up';

  return (
    <div style={{
      marginBottom: 4,
      borderRadius: 4,
      border: '1px solid hsl(var(--tf-border))',
      background: 'hsl(var(--tf-surface))',
      opacity: resolved ? 0.6 : 1,
    }}>
      {/* Row header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}
        onClick={() => setExpanded(e => !e)}
      >
        {pill(reasonLabel(exc.reasonCode), reasonColor(exc.reasonCode))}
        <span style={{ color: 'hsl(var(--tf-muted))' }}>n={exc.parcelCount}</span>
        {pill(exc.destination, destColor(exc.destination))}
        {pill(exc.status, statusColor(exc.status))}
        {exc.assignedTo && (
          <span style={{ color: 'hsl(var(--tf-muted))' }}>→ {exc.assignedTo}</span>
        )}
        {pill(nextAction, tone.color, tone.bg)}
        <span style={{ flex: 1 }} />
        <span style={{ color: 'hsl(var(--tf-muted))' }}>{ageString(exc.createdAt)}</span>
        <span style={{ color: 'hsl(var(--tf-muted))' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{ padding: '6px 10px 8px', borderTop: '1px solid hsl(var(--tf-border))', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            data-testid={`exception-lifecycle-${exc.exceptionSetId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 4,
              fontSize: 10,
            }}
          >
            {[
              { label: 'Created', done: true },
              { label: 'Assigned', done: Boolean(exc.assignedTo) },
              { label: 'Dispatched', done: exc.status === 'Dispatched' || exc.status === 'Resolved' },
              { label: 'Resolved', done: resolved },
            ].map((step) => (
              <div
                key={step.label}
                style={{
                  padding: '3px 5px',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--tf-border))',
                  background: step.done ? 'hsl(var(--tf-success, 142 71% 45%) / 0.10)' : 'hsl(var(--tf-bg))',
                  color: step.done ? 'hsl(var(--tf-success, 142 71% 45%))' : 'hsl(var(--tf-muted))',
                  fontWeight: step.done ? 700 : 500,
                  textAlign: 'center',
                }}
              >
                {step.label}
              </div>
            ))}
          </div>

          <div
            data-testid={`exception-next-action-${exc.exceptionSetId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'hsl(var(--tf-muted))' }}
          >
            {pill(tone.label, tone.color, tone.bg)}
            <span>Next action: <strong style={{ color: 'hsl(var(--tf-fg))' }}>{nextAction}</strong></span>
            <span>Age: {rowAgeDays}d</span>
          </div>

          <div
            data-testid={`exception-routing-closure-${exc.exceptionSetId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)',
              gap: 4,
              fontSize: 10,
            }}
          >
            {[
              ['Route', routeStatus],
              ['Owner', exc.assignedTo || 'Unassigned'],
              ['Closure', closureStatus],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: '4px 6px',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--tf-border))',
                  background: 'hsl(var(--tf-bg))',
                  minWidth: 0,
                }}
              >
                <div style={{ color: 'hsl(var(--tf-muted))', fontWeight: 700 }}>{label}</div>
                <div style={{ color: 'hsl(var(--tf-fg))', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!resolved && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={exc.status === 'Dispatched' ? reopenDestination : routeToDestination}
                disabled={busy || !hasRoute}
                style={actionBtn('#3b82f6', busy || !hasRoute)}
              >
                {exc.status === 'Dispatched' ? `Open ${exc.destination}` : hasRoute ? `Dispatch → ${exc.destination}` : 'Internal follow-up'}
              </button>
              <button
                onClick={handleResolve} disabled={busy}
                style={actionBtn('#22c55e', busy)}
              >
                Resolve
              </button>
            </div>
          )}

          {/* Assign */}
          {!resolved && (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={assignName}
                onChange={e => setAssignName(e.target.value)}
                placeholder={exc.assignedTo ? `Reassign (current: ${exc.assignedTo})` : 'Assign to...'}
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleAssign()}
              />
              <button onClick={handleAssign} disabled={busy || !assignName.trim()} style={actionBtn('#6366f1', busy || !assignName.trim())}>
                Assign
              </button>
            </div>
          )}

          {/* Note */}
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add note..."
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleNote()}
            />
            <button onClick={handleNote} disabled={busy || !noteText.trim()} style={actionBtn('#6b7280', busy || !noteText.trim())}>
              Note
            </button>
          </div>

          {/* Notes log */}
          {exc.notes && (
            <pre style={{
              fontSize: 10, color: 'hsl(var(--tf-muted))',
              whiteSpace: 'pre-wrap', margin: 0,
              background: 'hsl(var(--tf-bg))', padding: '4px 6px', borderRadius: 3,
              maxHeight: 80, overflowY: 'auto',
            }}>
              {exc.notes}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtn = (color: string, disabled: boolean): React.CSSProperties => ({
  padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600,
  background: disabled ? 'hsl(var(--tf-surface))' : `${color}33`,
  color: disabled ? 'hsl(var(--tf-muted))' : color,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const inputStyle: React.CSSProperties = {
  flex: 1, fontSize: 10, padding: '3px 6px',
  background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))',
  borderRadius: 4, color: 'hsl(var(--tf-fg))',
};

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ExceptionQueuePanel() {
  const studio = useCountyStudioStore() as ReturnType<typeof useCountyStudioStore> & {
    activeStudyId?: string | null;
  };
  const activeStudyId = studio.activeStudy?.studyId ?? studio.activeStudyId ?? null;
  const selectedSegmentId = studio.selectedSegmentId ?? null;
  const [exceptions, setExceptions] = useState<CountyExceptionSetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const receipts = useDownstreamClosureReceiptStore((s) => s.receipts);
  const ingestReceipts = useDownstreamClosureReceiptStore((s) => s.ingestReceipts);

  const load = useCallback(async () => {
    if (!activeStudyId) return;
    setLoading(true);
    try {
      const [data, receiptData] = await Promise.all([
        exceptionApi.list(activeStudyId),
        exceptionApi.listDownstreamReceipts(activeStudyId),
      ]);
      setExceptions(data);
      ingestReceipts(receiptData.map(toLocalReceipt));
    } catch (e) {
      console.error('ExceptionQueuePanel load failed', e);
    } finally {
      setLoading(false);
    }
  }, [activeStudyId, ingestReceipts]);

  useEffect(() => { void load(); }, [load]);

  const handleUpdated = useCallback((updated: CountyExceptionSetDto) => {
    setExceptions(prev => prev.map(e =>
      e.exceptionSetId === updated.exceptionSetId ? updated : e
    ));
  }, []);

  const scopedExceptions = selectedSegmentId
    ? exceptions.filter(e => e.sourceScenarioId === selectedSegmentId)
    : exceptions;

  const filtered = scopedExceptions.filter(e => {
    if (filter === 'open') return e.status !== 'Resolved';
    if (filter === 'resolved') return e.status === 'Resolved';
    return true;
  });

  const counts = {
    open: scopedExceptions.filter(e => e.status !== 'Resolved').length,
    resolved: scopedExceptions.filter(e => e.status === 'Resolved').length,
    unassigned: scopedExceptions.filter(e => e.status !== 'Resolved' && !e.assignedTo).length,
    dispatched: scopedExceptions.filter(e => e.status === 'Dispatched').length,
    overdue: scopedExceptions.filter(e => e.status !== 'Resolved' && ageDays(e.createdAt) >= 3).length,
  };

  const nextQueueAction = counts.open === 0
    ? 'Queue clear'
    : counts.unassigned > 0
      ? 'Assign unowned exceptions'
      : counts.dispatched > 0
        ? 'Resolve dispatched work'
        : 'Dispatch owned exceptions';

  if (!activeStudyId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No active study — load a study first.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <section
        data-testid="exception-queue-command-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 6,
          padding: '8px 10px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
        }}
      >
        {[
          ['Open', counts.open],
          ['Unassigned', counts.unassigned],
          ['Dispatched', counts.dispatched],
          ['Overdue', counts.overdue],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'hsl(var(--tf-fg))', fontWeight: 800 }}>{value}</span>
          </div>
        ))}
        <div data-testid="exception-queue-next-action" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', fontWeight: 700 }}>Next</span>
          <span style={{ fontSize: 11, color: 'hsl(var(--tf-fg))', fontWeight: 800 }}>{nextQueueAction}</span>
        </div>
      </section>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 10px', borderBottom: '1px solid hsl(var(--tf-border))', alignItems: 'center' }}>
        {(['all', 'open', 'resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: filter === f ? 'hsl(var(--tf-accent))' : 'transparent',
            color: filter === f ? 'hsl(var(--tf-bg))' : 'hsl(var(--tf-muted))',
            fontWeight: filter === f ? 700 : 400,
          }}>
            {f === 'all' ? `All (${scopedExceptions.length})` : f === 'open' ? `Open (${counts.open})` : `Resolved (${counts.resolved})`}
          </button>
        ))}
        {selectedSegmentId && (
          <span
            data-testid="exception-queue-segment-scope"
            title={`Queue scoped to selected segment ${selectedSegmentId}`}
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              border: '1px solid hsl(var(--tf-border))',
              color: 'hsl(var(--tf-muted))',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Segment {selectedSegmentId}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={load} disabled={loading} style={{ fontSize: 10, padding: '2px 6px', background: 'transparent', border: '1px solid hsl(var(--tf-border))', borderRadius: 4, color: 'hsl(var(--tf-muted))', cursor: 'pointer' }}>
          {loading ? '…' : '↺'}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {loading && exceptions.length === 0 ? (
          <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))', textAlign: 'center', paddingTop: 20 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))', textAlign: 'center', paddingTop: 20 }}>
            {filter === 'open' ? 'No open exceptions.' : 'No exceptions.'}
          </div>
        ) : (
          filtered.map(exc => (
            <ExceptionRow
              key={exc.exceptionSetId}
              exc={exc}
              receipt={receipts[exc.exceptionSetId]}
              onUpdated={handleUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}

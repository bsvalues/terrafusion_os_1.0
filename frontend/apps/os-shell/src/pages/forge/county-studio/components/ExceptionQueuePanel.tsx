// ExceptionQueuePanel.tsx
// Full lifecycle work surface for CountyExceptionSet rows.
// Shows: reason code pill, parcel count, destination badge, status badge, age, assignee
// Actions per row: Assign, Dispatch, Resolve, Add Note (inline expand)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { exceptionApi } from '../countyStudyApi';
import type { CountyExceptionSetDto } from '../countyStudyApi';
import { useSegmentWorkflowDraftStore } from '@/pages/suites/segmentWorkflowDraftStore';
import { useSegmentEvidenceDraftStore } from '@/pages/suites/segmentEvidenceDraftStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const pill = (label: string, color: string) => (
  <span style={{
    padding: '1px 6px', borderRadius: 10,
    background: `${color}22`, color, fontSize: 10, fontWeight: 700,
    whiteSpace: 'nowrap',
  }}>{label}</span>
);

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  exc: CountyExceptionSetDto;
  onUpdated: (updated: CountyExceptionSetDto) => void;
}

function ExceptionRow({ exc, onUpdated }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [assignName, setAssignName] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const createWorkflowDraft = useSegmentWorkflowDraftStore((s) => s.createDraft);
  const createEvidenceDraft = useSegmentEvidenceDraftStore((s) => s.createDraft);

  const act = useCallback(async (fn: () => Promise<CountyExceptionSetDto>) => {
    setBusy(true);
    try { onUpdated(await fn()); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  }, [onUpdated]);

  const handleDispatch = useCallback(() => {
    act(async () => {
      const updated = await exceptionApi.updateStatus(exc.exceptionSetId, 'Dispatched');
      if (exc.destination === 'Dais') {
        createWorkflowDraft(
          'SegmentReview',
          exc.sourceScenarioId,
          `Exception: ${reasonLabel(exc.reasonCode)}`,
        );
        navigate('/suites/dais');
      } else if (exc.destination === 'Dossier') {
        createEvidenceDraft(
          'SegmentEvidence',
          exc.sourceScenarioId,
          `Exception: ${reasonLabel(exc.reasonCode)}`,
        );
        navigate('/suites/dossier');
      }
      return updated;
    });
  }, [exc, act, navigate, createWorkflowDraft, createEvidenceDraft]);

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
        <span style={{ flex: 1 }} />
        <span style={{ color: 'hsl(var(--tf-muted))' }}>{ageString(exc.createdAt)}</span>
        <span style={{ color: 'hsl(var(--tf-muted))' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{ padding: '6px 10px 8px', borderTop: '1px solid hsl(var(--tf-border))', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Action buttons */}
          {!resolved && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={handleDispatch} disabled={busy || exc.status === 'Dispatched'}
                style={actionBtn('#3b82f6', busy || exc.status === 'Dispatched')}
              >
                {exc.status === 'Dispatched' ? '✓ Dispatched' : `Dispatch → ${exc.destination}`}
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
  background: disabled ? '#2a2a2a' : `${color}33`,
  color: disabled ? '#555' : color,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const inputStyle: React.CSSProperties = {
  flex: 1, fontSize: 10, padding: '3px 6px',
  background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))',
  borderRadius: 4, color: 'hsl(var(--tf-fg))',
};

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ExceptionQueuePanel() {
  const { activeStudyId } = useCountyStudioStore();
  const [exceptions, setExceptions] = useState<CountyExceptionSetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  const load = useCallback(async () => {
    if (!activeStudyId) return;
    setLoading(true);
    try {
      const data = await exceptionApi.list(activeStudyId);
      setExceptions(data);
    } catch (e) {
      console.error('ExceptionQueuePanel load failed', e);
    } finally {
      setLoading(false);
    }
  }, [activeStudyId]);

  useEffect(() => { void load(); }, [load]);

  const handleUpdated = useCallback((updated: CountyExceptionSetDto) => {
    setExceptions(prev => prev.map(e =>
      e.exceptionSetId === updated.exceptionSetId ? updated : e
    ));
  }, []);

  const filtered = exceptions.filter(e => {
    if (filter === 'open') return e.status !== 'Resolved';
    if (filter === 'resolved') return e.status === 'Resolved';
    return true;
  });

  const counts = {
    open: exceptions.filter(e => e.status !== 'Resolved').length,
    resolved: exceptions.filter(e => e.status === 'Resolved').length,
  };

  if (!activeStudyId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No active study — load a study first.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            {f === 'all' ? `All (${exceptions.length})` : f === 'open' ? `Open (${counts.open})` : `Resolved (${counts.resolved})`}
          </button>
        ))}
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
            <ExceptionRow key={exc.exceptionSetId} exc={exc} onUpdated={handleUpdated} />
          ))
        )}
      </div>
    </div>
  );
}

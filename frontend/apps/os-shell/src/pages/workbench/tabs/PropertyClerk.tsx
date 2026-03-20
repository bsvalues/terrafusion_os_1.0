/**
 * PropertyClerk.tsx
 *
 * R3.2: Property Clerk Tab — TerraClerk MWUX Slice
 * Real MWUX with governed tool invocations:
 * - search_recorded_documents: Document search (read_only)
 * - get_title_chain: Title chain history (read_only)
 * - explain_recording_fees: Fee schedule explanation (read_only)
 * - record_document: Record a new document (write_high)
 * - release_lien: Release a lien (write_low)
 * - summarize_parcel_recordings: Parcel recording summary (read_only)
 *
 * Architecture: UI → select params → governed tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

// ============================================================================
// Types
// ============================================================================

interface DaisToolState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: T;
  correlationId?: string;
  error?: ErrorInfo;
}

interface SearchDocResult {
  documents: Array<{ documentId: string; type: string; recordedAt: string; grantor: string; grantee: string }>;
  totalCount: number;
}

interface TitleChainResult {
  parcelId: string;
  chain: Array<{ documentId: string; type: string; date: string; grantor: string; grantee: string }>;
  currentOwner: string;
}

interface RecordingFeesResult {
  feeSchedule: Array<{ feeType: string; amount: number; description: string }>;
  totalEstimate: number;
  effectiveDate: string;
}

interface RecordDocumentResult {
  documentId: string;
  recordingNumber: string;
  recordedAt: string;
  status: string;
}

interface ReleaseLienResult {
  lienId: string;
  status: string;
  releasedAt: string;
  documentId: string;
}

interface RecordingSummaryResult {
  parcelId: string;
  totalRecordings: number;
  recentRecordings: Array<{ type: string; date: string; parties: string }>;
  encumbrances: number;
}

// ============================================================================
// Component
// ============================================================================

export const PropertyClerk: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const recordings = usePropertyStore((s) => s.recordings);
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  // State for each tool
  const [searchState, setSearchState] = useState<DaisToolState<SearchDocResult>>({ status: 'idle' });
  const [searchQuery, setSearchQuery] = useState('');
  const [titleChainState, setTitleChainState] = useState<DaisToolState<TitleChainResult>>({ status: 'idle' });
  const [feesState, setFeesState] = useState<DaisToolState<RecordingFeesResult>>({ status: 'idle' });
  const [feesDocType, setFeesDocType] = useState('deed');
  const [recordState, setRecordState] = useState<DaisToolState<RecordDocumentResult>>({ status: 'idle' });
  const [recordDocType, setRecordDocType] = useState('');
  const [recordGrantor, setRecordGrantor] = useState('');
  const [recordGrantee, setRecordGrantee] = useState('');
  const [recordConfirmed, setRecordConfirmed] = useState(false);
  const [releaseState, setReleaseState] = useState<DaisToolState<ReleaseLienResult>>({ status: 'idle' });
  const [releaseLienId, setReleaseLienId] = useState('');
  const [summaryState, setSummaryState] = useState<DaisToolState<RecordingSummaryResult>>({ status: 'idle' });

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
  };

  const addToHistory = useCallback((toolId: string, status: 'success' | 'error', correlationId?: string) => {
    setInvocationHistory(prev => [
      { toolId, status, correlationId: correlationId ?? '', timestamp: new Date().toISOString(), suite: 'clerk' } as InvocationRecord,
      ...prev.slice(0, 19),
    ]);
  }, []);

  // ── Handlers ──

  const handleSearchDocuments = useCallback(async () => {
    setSearchState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'search_recorded_documents',
        params: { parcelId, query: searchQuery },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setSearchState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('search_recorded_documents', 'success', response.correlationId);
      } else {
        setSearchState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Search failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('search_recorded_documents', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setSearchState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('search_recorded_documents', 'error', cid);
    }
  }, [parcelId, searchQuery, addToHistory]);

  const handleGetTitleChain = useCallback(async () => {
    setTitleChainState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'get_title_chain', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setTitleChainState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('get_title_chain', 'success', response.correlationId);
      } else {
        setTitleChainState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('get_title_chain', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setTitleChainState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('get_title_chain', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleExplainFees = useCallback(async () => {
    setFeesState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'explain_recording_fees', params: { parcelId, documentType: feesDocType }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setFeesState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('explain_recording_fees', 'success', response.correlationId);
      } else {
        setFeesState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('explain_recording_fees', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setFeesState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('explain_recording_fees', 'error', cid);
    }
  }, [parcelId, feesDocType, addToHistory]);

  const handleRecordDocument = useCallback(async () => {
    setRecordState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'record_document',
        params: { parcelId, documentType: recordDocType, grantor: recordGrantor, grantee: recordGrantee, confirmed: true, reason: 'Official recording' },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setRecordState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('record_document', 'success', response.correlationId);
      } else {
        setRecordState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('record_document', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setRecordState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('record_document', 'error', cid);
    }
  }, [parcelId, recordDocType, recordGrantor, recordGrantee, addToHistory]);

  const handleReleaseLien = useCallback(async () => {
    setReleaseState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'release_lien', params: { parcelId, lienId: releaseLienId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setReleaseState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('release_lien', 'success', response.correlationId);
      } else {
        setReleaseState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('release_lien', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setReleaseState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('release_lien', 'error', cid);
    }
  }, [parcelId, releaseLienId, addToHistory]);

  const handleSummarizeRecordings = useCallback(async () => {
    setSummaryState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'summarize_parcel_recordings', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setSummaryState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('summarize_parcel_recordings', 'success', response.correlationId);
      } else {
        setSummaryState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('summarize_parcel_recordings', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setSummaryState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('summarize_parcel_recordings', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  // ── Render ──

  return (
    <div className='tf-suite-clerk space-y-4'>
      <ParcelContextHeader icon='📜' title='TerraClerk' parcelId={parcelId} subtitle={`Recording & title services for ${parcelId}`} />

      {/* Recent Recordings from Store */}
      {recordings.length > 0 && (
        <BentoCard variant="table" title={`Recent Recordings (${recordings.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <th className="text-left py-2 px-3 font-medium">Type</th>
                  <th className="text-left py-2 px-3 font-medium">Grantor</th>
                  <th className="text-left py-2 px-3 font-medium">Grantee</th>
                  <th className="text-right py-2 px-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recordings.slice(0, 5).map((r) => (
                  <tr key={r.recordingId} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.08)' }}>
                    <td className="py-2 px-3 font-medium">{r.documentType}</td>
                    <td className="py-2 px-3">{r.grantor || '—'}</td>
                    <td className="py-2 px-3">{r.grantee || '—'}</td>
                    <td className="py-2 px-3 text-right">{new Date(r.recordingDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}

      <BentoGrid columns="auto" gap={1.5}>

        {/* Search Recorded Documents (read_only) */}
        <BentoCard title='🔍 Search Recorded Documents' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Search recorded instruments by keyword, grantor, or type</p>
          <input type='text' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search query (e.g. deed, lien, easement)' className='w-full p-2 rounded-lg tf-input mb-3' />
          <button onClick={handleSearchDocuments} disabled={searchState.status === 'loading' || !searchQuery.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {searchState.status === 'loading' ? 'Searching...' : 'Search Documents'}
          </button>
          {searchState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Searching...</span></div>}
          {searchState.status === 'success' && searchState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <span className='font-semibold tf-text'>{searchState.result.totalCount} document(s) found</span>
                {searchState.result.documents.slice(0, 5).map(d => (
                  <div key={d.documentId} className='text-sm tf-text-secondary mt-1'>
                    {d.type} — {d.grantor} → {d.grantee} ({formatDate(d.recordedAt)})
                  </div>
                ))}
              </div>
              {searchState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{searchState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {searchState.status === 'error' && searchState.error && <ErrorDisplay error={{ message: searchState.error.message, errorCode: searchState.error.code, correlationId: searchState.correlationId }} />}
        </BentoCard>

        {/* Title Chain (read_only) */}
        <BentoCard title='🔗 Title Chain' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Ownership chain of title for parcel {parcelId}</p>
          <button onClick={handleGetTitleChain} disabled={titleChainState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {titleChainState.status === 'loading' ? 'Loading...' : 'Get Title Chain'}
          </button>
          {titleChainState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading title chain...</span></div>}
          {titleChainState.status === 'success' && titleChainState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <span className='font-semibold tf-text'>Current Owner: {titleChainState.result.currentOwner}</span>
                {titleChainState.result.chain.slice(0, 5).map(c => (
                  <div key={c.documentId} className='text-sm tf-text-secondary mt-1'>
                    {c.type}: {c.grantor} → {c.grantee} ({formatDate(c.date)})
                  </div>
                ))}
              </div>
              {titleChainState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{titleChainState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {titleChainState.status === 'error' && titleChainState.error && <ErrorDisplay error={{ message: titleChainState.error.message, errorCode: titleChainState.error.code, correlationId: titleChainState.correlationId }} />}
        </BentoCard>

        {/* Recording Fees (read_only) */}
        <BentoCard title='💰 Recording Fees' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Explain recording fee schedule by document type</p>
          <select value={feesDocType} onChange={e => setFeesDocType(e.target.value)} className='w-full p-2 rounded-lg tf-input mb-3'>
            <option value='deed'>Deed</option>
            <option value='mortgage'>Mortgage</option>
            <option value='lien'>Lien</option>
            <option value='easement'>Easement</option>
            <option value='plat'>Plat</option>
          </select>
          <button onClick={handleExplainFees} disabled={feesState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {feesState.status === 'loading' ? 'Loading...' : 'Explain Fees'}
          </button>
          {feesState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading fees...</span></div>}
          {feesState.status === 'success' && feesState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <span className='font-semibold tf-text'>Total Estimate: ${feesState.result.totalEstimate.toFixed(2)}</span>
                {feesState.result.feeSchedule.map(f => (
                  <div key={f.feeType} className='text-sm tf-text-secondary mt-1'>{f.feeType}: ${f.amount.toFixed(2)} — {f.description}</div>
                ))}
                <p className='text-xs tf-text-dim mt-2'>Effective: {formatDate(feesState.result.effectiveDate)}</p>
              </div>
              {feesState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{feesState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {feesState.status === 'error' && feesState.error && <ErrorDisplay error={{ message: feesState.error.message, errorCode: feesState.error.code, correlationId: feesState.correlationId }} />}
        </BentoCard>

        {/* Record Document (write_high) */}
        <BentoCard title='📝 Record Document' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Record a new instrument into the official county record</p>
          <div className='space-y-2 mb-3'>
            <select value={recordDocType} onChange={e => setRecordDocType(e.target.value)} className='w-full p-2 rounded-lg tf-input'>
              <option value=''>Select document type</option>
              <option value='deed'>Deed</option>
              <option value='mortgage'>Mortgage</option>
              <option value='lien'>Lien</option>
              <option value='easement'>Easement</option>
            </select>
            <input type='text' value={recordGrantor} onChange={e => setRecordGrantor(e.target.value)} placeholder='Grantor name' className='w-full p-2 rounded-lg tf-input' />
            <input type='text' value={recordGrantee} onChange={e => setRecordGrantee(e.target.value)} placeholder='Grantee name' className='w-full p-2 rounded-lg tf-input' />
            <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
              <label className='flex items-center gap-3 cursor-pointer'>
                <input type='checkbox' checked={recordConfirmed} onChange={e => setRecordConfirmed(e.target.checked)} className='h-4 w-4' />
                <span className='text-sm tf-text'>I confirm this official recording</span>
              </label>
            </div>
          </div>
          <button onClick={handleRecordDocument} disabled={recordState.status === 'loading' || !recordDocType || !recordGrantor.trim() || !recordGrantee.trim() || !recordConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {recordState.status === 'loading' ? 'Recording...' : recordConfirmed ? 'Record Document' : '⚠️ Confirm Above to Enable'}
          </button>
          {recordState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Recording...</span></div>}
          {recordState.status === 'success' && recordState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'><span className='font-semibold tf-text'>Recorded: {recordState.result.recordingNumber}</span><p className='tf-text-secondary text-sm'>Doc {recordState.result.documentId} | {formatDate(recordState.result.recordedAt)}</p></div>
              {recordState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{recordState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {recordState.status === 'error' && recordState.error && <ErrorDisplay error={{ message: recordState.error.message, errorCode: recordState.error.code, correlationId: recordState.correlationId }} />}
        </BentoCard>

        {/* Release Lien (write_low) */}
        <BentoCard title='🔓 Release Lien' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Release an existing lien on this parcel</p>
          <input type='text' value={releaseLienId} onChange={e => setReleaseLienId(e.target.value)} placeholder='Lien ID (e.g. LIEN-2026-001)' className='w-full p-2 rounded-lg tf-input mb-3' />
          <button onClick={handleReleaseLien} disabled={releaseState.status === 'loading' || !releaseLienId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {releaseState.status === 'loading' ? 'Releasing...' : 'Release Lien'}
          </button>
          {releaseState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Releasing lien...</span></div>}
          {releaseState.status === 'success' && releaseState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'><span className='font-semibold tf-text'>Lien {releaseState.result.lienId} Released</span><p className='tf-text-secondary text-sm'>Status: {releaseState.result.status} | Doc: {releaseState.result.documentId}</p></div>
              {releaseState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{releaseState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {releaseState.status === 'error' && releaseState.error && <ErrorDisplay error={{ message: releaseState.error.message, errorCode: releaseState.error.code, correlationId: releaseState.correlationId }} />}
        </BentoCard>

        {/* Recording Summary (read_only) */}
        <BentoCard title='📊 Recording Summary' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Summary of all recordings for parcel {parcelId}</p>
          <button onClick={handleSummarizeRecordings} disabled={summaryState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {summaryState.status === 'loading' ? 'Loading...' : 'Get Recording Summary'}
          </button>
          {summaryState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading summary...</span></div>}
          {summaryState.status === 'success' && summaryState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <div className='grid grid-cols-2 gap-3 mb-2'>
                  <div><span className='text-xs tf-text-dim'>Total Recordings</span><p className='font-semibold tf-text'>{summaryState.result.totalRecordings}</p></div>
                  <div><span className='text-xs tf-text-dim'>Encumbrances</span><p className='font-semibold tf-text'>{summaryState.result.encumbrances}</p></div>
                </div>
                {summaryState.result.recentRecordings.slice(0, 3).map((r, i) => (
                  <div key={i} className='text-sm tf-text-secondary mt-1'>{r.type}: {r.parties} ({formatDate(r.date)})</div>
                ))}
              </div>
              {summaryState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{summaryState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {summaryState.status === 'error' && summaryState.error && <ErrorDisplay error={{ message: summaryState.error.message, errorCode: summaryState.error.code, correlationId: summaryState.correlationId }} />}
        </BentoCard>

      </BentoGrid>

      {/* History */}
      <InvocationHistory records={invocationHistory} />
    </div>
  );
};

export default PropertyClerk;

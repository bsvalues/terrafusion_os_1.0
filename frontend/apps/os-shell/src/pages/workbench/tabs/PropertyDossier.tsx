/**
 * PropertyDossier.tsx
 *
 * Phase 5.2 + CX-25: Property Dossier Tab
 *
 * Two sections:
 * 1. Parcel Details — real backend data from GET /api/dossier/parcels/{parcelId}/details
 *    (property, valuation, levies, note headers — all nullable for selective includes)
 * 2. Document Management — live read-only registry for documents and evidence.
 *
 * Architecture: UI → useDossierDetails hook → real API → correlationId UX
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import {
  ParcelContextHeader,
  InvocationHistory,
  EvidenceSnapshotPanel,
  type InvocationRecord,
} from '../../../components/workbench';
import { useEvidenceSnapshot } from '../../../hooks/useEvidenceSnapshot';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';
import { useDossierDetails } from '../../../hooks/useDossierDetails';
import {
  dossierService,
  type ChainEvent,
  type DossierDocument,
  type DossierStats,
  type EvidenceItem,
} from '../../../services/dossierService';
import type {
  DossierLevyEntry,
  DossierNoteHeaderItem,
  DossierValuationCategory,
} from '../../../contracts/dossierDetails';
import ParcelEvidencePacket from '../../../components/dossier/ParcelEvidencePacket';
import PacketNarrativeEditor from '../../../components/dossier/PacketNarrativeEditor';


// InvocationRecord type imported from shared components

interface SummarizeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: { summary: string; keyFacts?: string[] };
  correlationId?: string;
  error?: ErrorInfo;
}

/** Evidence synthesis result from synthesize_evidence governed tool */
interface EvidenceCategory {
  category: string;
  items: string[];
  count: number;
}

interface SynthesizeResult {
  parcelId: string;
  categories: EvidenceCategory[];
  totalItems: number;
  synthesisNarrative?: string;
}

interface SynthesizeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: SynthesizeResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Casefile summary from summarize_parcel_casefile */
interface CasefileResult {
  summary: string;
  highlights: string[];
  payloadRef?: string;
}

/** Dossier note result from add_dossier_note (write_low) */
interface DossierNoteResult {
  noteId: string;
  appended: true;
  payloadRef: string;
}

type DossierToolState<T> = { status: 'idle' | 'loading' | 'success' | 'error'; result?: T; correlationId?: string; error?: ErrorInfo };

interface DocumentManagementState {
  loading: boolean;
  error: ErrorInfo | null;
  documents: DossierDocument[];
  evidenceItems: EvidenceItem[];
  stats: DossierStats | null;
}

interface EvidenceChainState {
  loading: boolean;
  error: ErrorInfo | null;
  selectedEvidenceId: string | null;
  events: ChainEvent[];
}

// ============================================================================
// Helper: Format currency for display
// ============================================================================
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

// ============================================================================
// Parcel Details Sub-Components
// ============================================================================

/** Renders "Not included" placeholder when a section is null */
const SectionNotIncluded: React.FC<{ label: string }> = ({ label }) => (
  <div className='tf-panel p-4 text-center'>
    <p className='tf-text-dim text-sm italic'>{label} not included in this request</p>
  </div>
);

/** Property details section */
const PropertySection: React.FC<{ data: NonNullable<import('../../../contracts/dossierDetails').DossierDetailsResponse['property']> }> = ({ data }) => (
  <div className='space-y-3'>
    <div className='tf-panel p-4 space-y-2'>
      <div className='flex justify-between'>
        <span className='tf-text-dim text-sm'>Address</span>
        <span className='tf-text text-sm font-medium'>{data.address}</span>
      </div>
      <div className='flex justify-between'>
        <span className='tf-text-dim text-sm'>Parcel</span>
        <span className='tf-text text-sm'>{data.parcelNumber}</span>
      </div>
      {data.propertyType && (
        <div className='flex justify-between'>
          <span className='tf-text-dim text-sm'>Type</span>
          <span className='tf-text text-sm'>{data.propertyType}</span>
        </div>
      )}
      {data.yearBuilt && (
        <div className='flex justify-between'>
          <span className='tf-text-dim text-sm'>Year Built</span>
          <span className='tf-text text-sm'>{data.yearBuilt}</span>
        </div>
      )}
      <div className='border-t tf-border pt-2 mt-2'>
        <div className='flex justify-between'>
          <span className='tf-text-dim text-sm'>Assessed Value</span>
          <span className='tf-text text-sm font-semibold'>{formatCurrency(data.assessedValue)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='tf-text-dim text-sm'>Market Value</span>
          <span className='tf-text text-sm'>{formatCurrency(data.marketValue)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='tf-text-dim text-sm'>Land / Improvement</span>
          <span className='tf-text text-sm'>{formatCurrency(data.landValue)} / {formatCurrency(data.improvementValue)}</span>
        </div>
      </div>
      <div className='flex justify-between'>
        <span className='tf-text-dim text-sm'>Tax Year</span>
        <span className='tf-text text-sm'>{data.taxYear}</span>
      </div>
      {/* CAMA placeholders — only render when populated */}
      {(data.classCode || data.useCode || data.neighborhood) && (
        <div className='border-t tf-border pt-2 mt-2'>
          {data.classCode && (
            <div className='flex justify-between'>
              <span className='tf-text-dim text-sm'>Class Code</span>
              <span className='tf-text text-sm'>{data.classCode}</span>
            </div>
          )}
          {data.useCode && (
            <div className='flex justify-between'>
              <span className='tf-text-dim text-sm'>Use Code</span>
              <span className='tf-text text-sm'>{data.useCode}</span>
            </div>
          )}
          {data.neighborhood && (
            <div className='flex justify-between'>
              <span className='tf-text-dim text-sm'>Neighborhood</span>
              <span className='tf-text text-sm'>{data.neighborhood}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

/** Valuation signals section */
const ValuationSection: React.FC<{ data: NonNullable<import('../../../contracts/dossierDetails').DossierDetailsResponse['valuation']> }> = ({ data }) => (
  <div className='space-y-3'>
    <div className='tf-panel p-4'>
      <div className='flex justify-between mb-3'>
        <span className='tf-text-dim text-sm'>Total Value</span>
        <span className='tf-text font-semibold'>{formatCurrency(data.totalValue)}</span>
      </div>
      <div className='space-y-2'>
        {data.categories.map((cat: DossierValuationCategory, idx: number) => (
          <div key={idx} className='flex items-center justify-between text-sm'>
            <span className='tf-text-secondary'>{cat.name}</span>
            <div className='flex items-center gap-3'>
              <span className='tf-text'>{formatCurrency(cat.amount)}</span>
              <span className='tf-text-dim text-xs w-12 text-right'>
                {cat.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Levy details section */
const LevySection: React.FC<{ data: NonNullable<import('../../../contracts/dossierDetails').DossierDetailsResponse['levies']> }> = ({ data }) => (
  <div className='space-y-3'>
    <div className='tf-panel p-4'>
      <div className='flex justify-between mb-3'>
        <span className='tf-text-dim text-sm'>
          Showing {data.levyCountReturned} of {data.levyCountTotal} levies
        </span>
      </div>
      <div className='space-y-2'>
        {data.recent.map((levy: DossierLevyEntry) => (
          <div key={levy.taxLevyId} className='tf-overlay rounded p-3 text-sm'>
            <div className='flex justify-between'>
              <span className='tf-text font-medium'>{levy.taxingDistrict}</span>
              <span className='tf-text font-semibold'>{formatCurrency(levy.levyAmount)}</span>
            </div>
            <div className='flex justify-between mt-1'>
              <span className='tf-text-dim text-xs'>{levy.purpose}</span>
              <span className='tf-text-dim text-xs'>
                Rate: {levy.taxRate.toFixed(4)} | {levy.taxYear}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Note headers section (PII-redacted: metadata only, no content) */
const NotesSection: React.FC<{ data: NonNullable<import('../../../contracts/dossierDetails').DossierDetailsResponse['notes']> }> = ({ data }) => (
  <div className='space-y-3'>
    <div className='tf-panel p-4'>
      <div className='flex justify-between mb-3'>
        <span className='tf-text-dim text-sm'>
          Showing {data.noteCountReturned} of {data.noteCountTotal} notes (headers only)
        </span>
      </div>
      <div className='space-y-2'>
        {data.items.map((note: DossierNoteHeaderItem) => (
          <div key={note.noteId} className='flex items-center justify-between tf-overlay rounded px-3 py-2 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='tf-text font-medium'>{note.noteType}</span>
              <span className='tf-text-dim text-xs'>by {note.authorKind}</span>
            </div>
            <span className='tf-text-dim text-xs'>
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
        {data.items.length === 0 && (
          <p className='tf-text-dim text-sm italic text-center'>No notes recorded</p>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const PropertyDossier: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const documents = usePropertyStore((s) => s.documents);

  // CX-25: Real dossier details from backend
  const dossierDetails = useDossierDetails(parcelId);

  const [summarizeState, setSummarizeState] = useState<SummarizeState>({ status: 'idle' });
  const [synthesizeState, setSynthesizeState] = useState<SynthesizeState>({ status: 'idle' });
  const [casefileState, setCasefileState] = useState<DossierToolState<CasefileResult>>({ status: 'idle' });
  const [noteState, setNoteState] = useState<DossierToolState<DossierNoteResult>>({ status: 'idle' });
  const [noteText, setNoteText] = useState('');
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);
  const [documentManagement, setDocumentManagement] = useState<DocumentManagementState>({
    loading: false,
    error: null,
    documents: [],
    evidenceItems: [],
    stats: null,
  });
  const [evidenceChain, setEvidenceChain] = useState<EvidenceChainState>({
    loading: false,
    error: null,
    selectedEvidenceId: null,
    events: [],
  });

  // CX-26: Evidence snapshot (manual fetch — point-in-time)
  const evidence = useEvidenceSnapshot(parcelId);

  const loadDocumentManagement = useCallback(async () => {
    if (!parcelId) {
      setDocumentManagement({
        loading: false,
        error: null,
        documents: [],
        evidenceItems: [],
        stats: null,
      });
      return;
    }

    setDocumentManagement((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [documents, evidenceItems, stats] = await Promise.all([
        dossierService.searchDocuments({ parcelId, limit: 5 }),
        dossierService.searchEvidence({ parcelId, limit: 5 }),
        dossierService.getStats(),
      ]);

      setDocumentManagement({
        loading: false,
        error: null,
        documents: documents.results,
        evidenceItems: evidenceItems.results,
        stats,
      });
    } catch (err) {
      setDocumentManagement((prev) => ({
        ...prev,
        loading: false,
        error: {
          message: err instanceof Error ? err.message : 'Failed to load document registry',
          code: 'FETCH_ERROR',
          severity: 'error',
        },
      }));
    }
  }, [parcelId]);

  useEffect(() => {
    void loadDocumentManagement();
  }, [loadDocumentManagement]);

  const loadEvidenceChain = useCallback(async (evidenceId: string) => {
    setEvidenceChain((prev) => ({
      ...prev,
      loading: true,
      error: null,
      selectedEvidenceId: evidenceId,
    }));

    try {
      const events = await dossierService.getChainOfCustody(evidenceId);
      setEvidenceChain({
        loading: false,
        error: null,
        selectedEvidenceId: evidenceId,
        events,
      });
    } catch (err) {
      setEvidenceChain((prev) => ({
        ...prev,
        loading: false,
        error: {
          message: err instanceof Error ? err.message : 'Failed to load chain of custody',
          code: 'FETCH_ERROR',
          severity: 'error',
        },
      }));
    }
  }, []);

  /** Invoke summarize_dossier tool via pilotApi (retained for R2 document integration) */
  const handleSummarize = useCallback(async (dossierId: string) => {
    setSummarizeState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'summarize_dossier',
        params: {
          dossierId,
          focus: 'general',
          length: 'standard',
        },
        parcelId,
      });

      const record: InvocationRecord = {
        id: `inv-${Date.now()}`,
        toolId: 'summarize_dossier',
        status: response.success ? 'success' : 'error',
        correlationId: response.correlationId,
        timestamp: new Date(),
        output: response.result?.output,
        error: response.error
          ? {
              message: response.error.message,
              code: response.error.code,
              correlationId: response.correlationId,
              severity: response.error.severity || 'error',
            }
          : undefined,
      };

      setInvocationHistory((prev) => [record, ...prev]);

      if (response.success && response.result) {
        try {
          const parsed = JSON.parse(response.result.output);
          setSummarizeState({
            status: 'success',
            result: {
              summary: parsed.summary || response.result.output,
              keyFacts: parsed.keyFacts,
            },
            correlationId: response.correlationId,
          });
        } catch {
          setSummarizeState({
            status: 'success',
            result: { summary: response.result.output },
            correlationId: response.correlationId,
          });
        }
      } else if (response.error) {
        setSummarizeState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            message: response.error.message,
            code: response.error.code,
            correlationId: response.correlationId,
            severity: response.error.severity || 'error',
          },
        });
      }
    } catch (err) {
      const correlationId = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const errorInfo: ErrorInfo = {
        message: err instanceof Error ? err.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
        correlationId,
        severity: 'error',
      };

      const record: InvocationRecord = {
        id: `inv-${Date.now()}`,
        toolId: 'summarize_dossier',
        status: 'error',
        correlationId,
        timestamp: new Date(),
        error: errorInfo,
      };

      setInvocationHistory((prev) => [record, ...prev]);
      setSummarizeState({
        status: 'error',
        correlationId,
        error: errorInfo,
      });
    }
  }, [parcelId]);

  const clearSummarizeState = useCallback(() => {
    setSummarizeState({ status: 'idle' });
  }, []);

  /** synthesize_evidence — aggregate evidence items by category */
  const handleSynthesizeEvidence = useCallback(async () => {
    setSynthesizeState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'synthesize_evidence',
        params: { county: 'benton', parcelId },
        parcelId,
      });

      const record: InvocationRecord = {
        id: `inv-${Date.now()}`,
        toolId: 'synthesize_evidence',
        status: response.success ? 'success' : 'error',
        correlationId: response.correlationId,
        timestamp: new Date(),
      };
      setInvocationHistory((prev) => [record, ...prev]);

      if (response.success && response.result) {
        let parsed: SynthesizeResult;
        try {
          parsed = typeof response.result.output === 'string'
            ? JSON.parse(response.result.output)
            : response.result.output;
        } catch {
          parsed = { parcelId, categories: [], totalItems: 0 };
        }
        setSynthesizeState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setSynthesizeState({
          status: 'error', correlationId: response.correlationId,
          error: { code: response.error?.code || 'SYNTHESIZE_FAILED', message: response.error?.message || 'Evidence synthesis failed', severity: 'error', correlationId: response.correlationId },
        });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setSynthesizeState({
        status: 'error', correlationId: cid,
        error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid },
      });
      setInvocationHistory((prev) => [{ id: `inv-${Date.now()}`, toolId: 'synthesize_evidence', status: 'error', correlationId: cid, timestamp: new Date() }, ...prev]);
    }
  }, [parcelId]);

  /** Invoke add_dossier_note — write_low case note */
  const handleAddNote = useCallback(async () => {
    if (!noteText.trim()) return;
    if (noteText.length > 2000) { setNoteState({ status: 'error', error: { code: 'VALIDATION', message: 'Note exceeds 2000 character limit', severity: 'error' } }); return; }
    setNoteState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'add_dossier_note', params: { county: 'benton', parcelId, note: noteText.trim() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setNoteState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setNoteText('');
        setInvocationHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'add_dossier_note', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev]);
      } else {
        setNoteState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'NOTE_FAILED', message: response.error?.message || 'Failed to add note', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setNoteState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, noteText]);

  /** Invoke summarize_parcel_casefile — parcel-based casefile summary */
  const handleCasefileSummary = useCallback(async () => {
    setCasefileState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'summarize_parcel_casefile', params: { county: 'benton', parcelId, include: ['notices', 'appeals', 'permits', 'sales'] }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setCasefileState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setInvocationHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'summarize_parcel_casefile', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev]);
      } else {
        setCasefileState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'CASEFILE_FAILED', message: response.error?.message || 'Casefile summary failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setCasefileState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  return (
    <div className='tf-suite-dossier space-y-6' data-testid='property-dossier-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon="📁"
        title="TerraDossier"
        parcelId={parcelId}
        subtitle={`Documents for parcel ${parcelId}`}
      />

      {/* Documents on File from Store */}
      {documents.length > 0 && (
        <BentoGrid columns={3} gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Documents on File">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}>
              {documents.length}
            </p>
          </BentoCard>
          {documents.slice(0, 2).map((d) => (
            <BentoCard key={d.documentId} variant="stat" title={d.documentType}>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {d.title}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                {new Date(d.uploadedAt).toLocaleDateString()} — {d.mimeType}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* ================================================================ */}
      {/* CX-25: Parcel Details — real backend data                        */}
      {/* ================================================================ */}
      <div data-testid='parcel-details-section'>
        {/* Correlation ID badge + resource links */}
        {dossierDetails.correlationId && (
          <div className='flex items-center gap-3 mb-3 flex-wrap'>
            <div className='flex items-center gap-2'>
              <span className='tf-text-dim text-xs'>Correlation:</span>
              <code className='tf-overlay px-2 py-0.5 rounded text-xs tf-text-secondary'>
                {dossierDetails.correlationId}
              </code>
              <button
                onClick={() => { navigator.clipboard?.writeText(dossierDetails.correlationId || '').catch(() => { /* clipboard unavailable */ }); }}
                className='px-1.5 py-0.5 text-xs tf-hover-surface rounded'
                title='Copy correlation ID'
              >
                Copy
              </button>
            </div>
            {dossierDetails.data?.links && (
              <div className='flex items-center gap-2 text-xs tf-text-dim'>
                <span>Links:</span>
                <span className='tf-text-tertiary'>{dossierDetails.data.links.self}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {dossierDetails.loading && (
          <div className='tf-status-info rounded-xl p-4 mb-4' role='status'>
            <div className='flex items-center gap-3'>
              <div className='w-5 h-5 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(var(--tf-text) / 0.3)', borderTopColor: 'hsl(var(--tf-text))' }} />
              <span className='tf-text'>Loading parcel details...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {dossierDetails.error && (
          <div className='tf-status-error rounded-xl p-4 mb-4'>
            <div className='flex items-center justify-between'>
              <p className='tf-text text-sm'>
                Failed to load details: {dossierDetails.error.message}
              </p>
              <button
                onClick={dossierDetails.refetch}
                className='px-3 py-1 text-xs tf-hover-surface rounded'
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Details sections — 4 BentoGrid cards */}
        {dossierDetails.data && (
          <BentoGrid columns={2} gap={1.5} padding={0}>
            {/* Property */}
            <BentoCard title="Property" actions={<span>🏠</span>}>
              {dossierDetails.data.property
                ? <PropertySection data={dossierDetails.data.property} />
                : <SectionNotIncluded label="Property details" />
              }
            </BentoCard>

            {/* Valuation */}
            <BentoCard title="Valuation" actions={<span>💰</span>}>
              {dossierDetails.data.valuation
                ? <ValuationSection data={dossierDetails.data.valuation} />
                : <SectionNotIncluded label="Valuation signals" />
              }
            </BentoCard>

            {/* Levies */}
            <BentoCard title="Tax Levies" actions={<span>🏛️</span>}>
              {dossierDetails.data.levies
                ? <LevySection data={dossierDetails.data.levies} />
                : <SectionNotIncluded label="Levy details" />
              }
            </BentoCard>

            {/* Notes (headers only) */}
            <BentoCard title="Notes" actions={<span>📝</span>}>
              {dossierDetails.data.notes
                ? <NotesSection data={dossierDetails.data.notes} />
                : <SectionNotIncluded label="Note headers" />
              }
            </BentoCard>
          </BentoGrid>
        )}

        {/* PII redaction badge */}
        {dossierDetails.data?.piiRedacted && (
          <div className='flex items-center gap-2 mt-2'>
            <span className='text-xs tf-text-dim'>🔒 PII redacted</span>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Document Management — live read-only registry                  */}
      {/* ================================================================ */}
      <BentoCard title="Document Management" variant="form">
        <div className='space-y-4' data-testid='document-management-live'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div>
              <p className='tf-text-tertiary font-medium'>Read-only live registry</p>
              <p className='tf-text-dim text-sm mt-1'>
                Parcel-scoped documents and evidence records are now live. Upload and
                write workflows remain deferred.
              </p>
            </div>
            <button
              onClick={() => { void loadDocumentManagement(); }}
              className='px-3 py-1.5 text-xs tf-hover-surface rounded-lg'
              data-testid='document-management-refresh'
              disabled={documentManagement.loading}
            >
              {documentManagement.loading ? 'Refreshing...' : 'Refresh registry'}
            </button>
          </div>

          {documentManagement.loading && (
            <div className='tf-status-info rounded-xl p-4' role='status'>
              <div className='flex items-center gap-3'>
                <div
                  className='w-5 h-5 border-2 rounded-full animate-spin'
                  style={{
                    borderColor: 'hsl(var(--tf-text) / 0.3)',
                    borderTopColor: 'hsl(var(--tf-text))',
                  }}
                />
                <span className='tf-text'>Loading document registry...</span>
              </div>
            </div>
          )}

          {documentManagement.error && (
            <div className='tf-status-error rounded-xl p-5'>
              <ErrorDisplay error={documentManagement.error} />
              <button
                onClick={() => { void loadDocumentManagement(); }}
                className='mt-3 px-3 py-1.5 text-sm tf-hover-surface rounded-lg'
              >
                Retry
              </button>
            </div>
          )}

          {!documentManagement.loading && !documentManagement.error && (
            <div className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-4'>
                <div className='tf-panel p-3 rounded-xl'>
                  <p className='tf-text-dim text-xs uppercase tracking-wide'>Parcel docs</p>
                  <p className='tf-text text-lg font-semibold'>
                    {documentManagement.documents.length}
                  </p>
                </div>
                <div className='tf-panel p-3 rounded-xl'>
                  <p className='tf-text-dim text-xs uppercase tracking-wide'>Parcel evidence</p>
                  <p className='tf-text text-lg font-semibold'>
                    {documentManagement.evidenceItems.length}
                  </p>
                </div>
                <div className='tf-panel p-3 rounded-xl'>
                  <p className='tf-text-dim text-xs uppercase tracking-wide'>County docs</p>
                  <p className='tf-text text-lg font-semibold'>
                    {documentManagement.stats?.totalDocuments ?? 0}
                  </p>
                </div>
                <div className='tf-panel p-3 rounded-xl'>
                  <p className='tf-text-dim text-xs uppercase tracking-wide'>County evidence</p>
                  <p className='tf-text text-lg font-semibold'>
                    {documentManagement.stats?.totalEvidence ?? 0}
                  </p>
                </div>
              </div>

              <div className='grid gap-4 lg:grid-cols-2'>
                <div className='tf-panel p-4 rounded-xl space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='tf-text-tertiary font-medium'>Recent documents</p>
                    <span className='tf-text-dim text-xs'>
                      {documentManagement.documents.length} visible
                    </span>
                  </div>
                  {documentManagement.documents.length > 0 ? (
                    <div className='space-y-2'>
                      {documentManagement.documents.map((document) => (
                        <div
                          key={document.id}
                          className='tf-overlay rounded-lg px-3 py-2 text-sm'
                        >
                          <div className='flex items-center justify-between gap-3'>
                            <span className='tf-text font-medium'>{document.name}</span>
                            <span className='tf-text-dim text-xs uppercase'>
                              {document.status}
                            </span>
                          </div>
                          <div className='mt-1 flex items-center justify-between gap-3 text-xs tf-text-dim'>
                            <span>{document.type}</span>
                            <span>{document.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='tf-text-dim text-sm italic'>
                      No document records found for this parcel.
                    </p>
                  )}
                </div>

                <div className='tf-panel p-4 rounded-xl space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='tf-text-tertiary font-medium'>Recent evidence</p>
                    <span className='tf-text-dim text-xs'>
                      {documentManagement.evidenceItems.length} visible
                    </span>
                  </div>
                  {documentManagement.evidenceItems.length > 0 ? (
                    <div className='space-y-2'>
                      {documentManagement.evidenceItems.map((item) => (
                        <div key={item.id} className='tf-overlay rounded-lg px-3 py-2 text-sm'>
                          <div className='flex items-center justify-between gap-3'>
                            <span className='tf-text font-medium'>{item.title}</span>
                            <span className='tf-text-dim text-xs uppercase'>
                              {item.integrity}
                            </span>
                          </div>
                          <div className='mt-1 flex items-center justify-between gap-3 text-xs tf-text-dim'>
                            <span>{item.evidenceType}</span>
                            <div className='flex items-center gap-3'>
                              <span>{item.lastAction}</span>
                              <button
                                onClick={() => { void loadEvidenceChain(item.id); }}
                                className='px-2 py-1 tf-hover-surface rounded'
                                data-testid={`evidence-chain-trigger-${item.id}`}
                              >
                                {evidenceChain.loading && evidenceChain.selectedEvidenceId === item.id
                                  ? 'Loading chain...'
                                  : 'View chain'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='tf-text-dim text-sm italic'>
                      No evidence records found for this parcel.
                    </p>
                  )}

                  {evidenceChain.selectedEvidenceId && (
                    <div
                      className='border-t tf-border pt-3 space-y-3'
                      data-testid='evidence-chain-panel'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <p className='tf-text-tertiary font-medium'>Chain of custody</p>
                        <span className='tf-text-dim text-xs'>
                          Evidence ID: {evidenceChain.selectedEvidenceId}
                        </span>
                      </div>

                      {evidenceChain.loading && (
                        <p className='tf-text-dim text-sm'>Loading chain-of-custody events...</p>
                      )}

                      {evidenceChain.error && (
                        <div className='tf-status-error rounded-xl p-4'>
                          <ErrorDisplay error={evidenceChain.error} />
                        </div>
                      )}

                      {!evidenceChain.loading && !evidenceChain.error && evidenceChain.events.length > 0 && (
                        <div className='space-y-2'>
                          {evidenceChain.events.map((event, index) => (
                            <div
                              key={`${event.timestamp}-${event.hash}-${index}`}
                              className='tf-panel rounded-lg px-3 py-2 text-sm'
                            >
                              <div className='flex items-center justify-between gap-3'>
                                <span className='tf-text font-medium'>{event.action}</span>
                                <span className='tf-text-dim text-xs'>{event.actor}</span>
                              </div>
                              <div className='mt-1 flex items-center justify-between gap-3 text-xs tf-text-dim'>
                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                                <span>{event.hash}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!evidenceChain.loading && !evidenceChain.error && evidenceChain.events.length === 0 && (
                        <p className='tf-text-dim text-sm italic'>
                          No chain-of-custody events recorded for this evidence item.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </BentoCard>

      {/* CX-26: Evidence Snapshot */}
      <BentoGrid columns={1} gap={1.5} padding={0}>
        <BentoCard variant="table" title="Evidence Snapshot" actions={<span>🔏</span>}>
          {!evidence.snapshot && !evidence.loading && !evidence.error && (
            <div className="tf-panel p-6 text-center">
              <p className="tf-text-tertiary text-sm mb-4">
                Generate a point-in-time evidence snapshot for audit and trace workflows.
              </p>
              <button
                onClick={evidence.fetch}
                className="tf-suite-dossier-cta px-4 py-2 rounded-lg transition-colors"
                data-testid="evidence-fetch-btn"
              >
                📋 Load Evidence Snapshot
              </button>
            </div>
          )}

          {evidence.loading && (
            <div className="tf-status-info rounded-xl p-4" role="status">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'hsl(var(--tf-text) / 0.3)',
                    borderTopColor: 'hsl(var(--tf-text))',
                  }}
                />
                <span className="tf-text">Generating evidence snapshot…</span>
              </div>
            </div>
          )}

          {evidence.error && (
            <div className="tf-status-error rounded-xl p-5">
              <ErrorDisplay
                error={{
                  message: evidence.error,
                  code: evidence.httpStatus ? `HTTP_${evidence.httpStatus}` : 'NETWORK_ERROR',
                  severity: 'error',
                }}
              />
              <button
                onClick={evidence.fetch}
                className="mt-3 px-3 py-1.5 text-sm tf-hover-surface rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {evidence.snapshot && (
            <div>
              <EvidenceSnapshotPanel
                snapshot={evidence.snapshot}
                headerCorrelationId={evidence.headerCorrelationId}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={evidence.fetch}
                  className="px-3 py-1.5 text-xs tf-hover-surface rounded-lg"
                  title="Generate a new point-in-time snapshot"
                >
                  🔄 Refresh Snapshot
                </button>
              </div>
            </div>
          )}
        </BentoCard>
      </BentoGrid>

      {/* ================================================================ */}
      {/* Evidence Synthesis — synthesize_evidence governed tool            */}
      {/* ================================================================ */}
      <BentoCard title="Evidence Synthesis" actions={<span>🔬</span>}>
        <div className='flex items-start justify-between gap-4 flex-wrap mb-3'>
          <p className='tf-text-dim text-sm'>
            Aggregate and categorize all evidence items for this parcel
          </p>
          <button
            onClick={handleSynthesizeEvidence}
            disabled={synthesizeState.status === 'loading'}
            className='px-4 py-2 rounded-lg font-semibold transition-all tf-suite-dossier-cta'
          >
            {synthesizeState.status === 'loading' ? 'Synthesizing...' : 'Synthesize Evidence'}
          </button>
        </div>

        {synthesizeState.status === 'success' && synthesizeState.result && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='tf-text-secondary'>
                {synthesizeState.result.totalItems} total evidence items
              </span>
              {synthesizeState.correlationId && (
                <code className='tf-suite-accent-text font-mono text-xs'>
                  {synthesizeState.correlationId.slice(0, 16)}...
                </code>
              )}
            </div>

            {synthesizeState.result.synthesisNarrative && (
              <p className='tf-text-secondary text-sm'>{synthesizeState.result.synthesisNarrative}</p>
            )}

            {synthesizeState.result.categories?.length ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {synthesizeState.result.categories.map((cat, idx) => (
                  <div key={idx} className='tf-panel p-4 rounded-xl'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='tf-text font-medium'>{cat.category}</span>
                      <span className='tf-text-dim text-xs'>{cat.count} items</span>
                    </div>
                    <div className='space-y-1'>
                      {cat.items.slice(0, 3).map((item, i) => (
                        <p key={i} className='tf-text-tertiary text-xs truncate'>• {item}</p>
                      ))}
                      {cat.items.length > 3 && (
                        <p className='tf-text-dim text-xs'>+{cat.items.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='tf-text-dim text-sm italic'>No categorized evidence returned.</p>
            )}
          </div>
        )}

        {synthesizeState.status === 'error' && synthesizeState.error && (
          <ErrorDisplay error={{ message: synthesizeState.error.message, errorCode: synthesizeState.error.code, correlationId: synthesizeState.correlationId }} />
        )}
      </BentoCard>

      {/* Casefile Summary */}
      <BentoCard title='📋 Casefile Summary' actions={<span>📑</span>}>
        <p className='tf-text-tertiary text-sm mb-4'>Comprehensive casefile overview for {parcelId}</p>
        <button onClick={handleCasefileSummary} disabled={casefileState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dossier-cta mb-4'>
          {casefileState.status === 'loading' ? 'Loading...' : 'Summarize Casefile'}
        </button>
        {casefileState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Loading casefile...</span></div>}
        {casefileState.status === 'success' && casefileState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'><p className='tf-text-secondary'>{casefileState.result.summary}</p></div>
            {casefileState.result.highlights.length > 0 && (
              <div className='space-y-1'>
                {casefileState.result.highlights.map((h, idx) => (
                  <div key={idx} className='flex items-start gap-2 py-1 px-3 tf-panel rounded'>
                    <span className='tf-text-dim'>•</span>
                    <span className='tf-text-secondary text-sm'>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {casefileState.correlationId && (
              <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{casefileState.correlationId.slice(0, 16)}...</code></div>
            )}
          </div>
        )}
        {casefileState.status === 'error' && casefileState.error && <ErrorDisplay error={{ message: casefileState.error.message, errorCode: casefileState.error.code, correlationId: casefileState.correlationId }} />}
      </BentoCard>

      {/* Add Dossier Note (write_low) */}
      <BentoCard title='📝 Add Case Note' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Append a case note to parcel {parcelId}</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder='Enter case note (max 2000 chars)...'
          className='w-full p-3 rounded-lg tf-input resize-y min-h-[80px] mb-2'
          maxLength={2000}
          data-testid='note-textarea'
        />
        <div className='flex items-center justify-between mb-3'>
          <span className='text-xs tf-text-dim'>{noteText.length}/2000</span>
          <button onClick={handleAddNote} disabled={noteState.status === 'loading' || !noteText.trim()} className='py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dossier-cta'>
            {noteState.status === 'loading' ? 'Saving...' : 'Add Note'}
          </button>
        </div>
        {noteState.status === 'success' && noteState.result && (
          <div className='tf-panel p-3 space-y-1'>
            <div className='flex items-center gap-2'><span>✅</span><span className='tf-text-secondary font-medium'>Note appended</span></div>
            <div className='text-xs tf-text-dim'>Note ID: <code className='tf-suite-accent-text font-mono'>{noteState.result.noteId}</code></div>
            {noteState.correlationId && <div className='text-xs tf-text-dim'>Correlation: <code className='tf-suite-accent-text font-mono'>{noteState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {noteState.status === 'error' && noteState.error && <ErrorDisplay error={{ message: noteState.error.message, errorCode: noteState.error.code, correlationId: noteState.correlationId }} />}
      </BentoCard>

      {/* Phase 19: Evidence Packet Assembly */}
      <div data-testid="evidence-packet-section">
        <ParcelEvidencePacket parcelId={parcelId} />
      </div>

      {/* Phase 19 Tranche 3: Narrative Spine */}
      <div data-testid="narrative-section">
        <PacketNarrativeEditor parcelId={parcelId} />
      </div>

      {/* Governed Tool Invocation History */}
      <InvocationHistory
        records={invocationHistory}
        title="Dossier Tool History"
        icon="📜"
        emptyMessage="No governed tool invocations yet."
      />
    </div>
  );
};

export default PropertyDossier;

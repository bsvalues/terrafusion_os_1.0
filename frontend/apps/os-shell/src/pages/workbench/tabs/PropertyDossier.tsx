/**
 * PropertyDossier.tsx
 *
 * Phase 5.2 + CX-25: Property Dossier Tab
 *
 * Two sections:
 * 1. Parcel Details — real backend data from GET /api/dossier/parcels/{parcelId}/details
 *    (property, valuation, levies, note headers — all nullable for selective includes)
 * 2. Document Management — disabled pending R2 backend. Summarize tool invocation retained.
 *
 * Architecture: UI → useDossierDetails hook → real API → correlationId UX
 */

import React, { useCallback, useState } from 'react';
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
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';
import { useDossierDetails } from '../../../hooks/useDossierDetails';
import type {
  DossierLevyEntry,
  DossierNoteHeaderItem,
  DossierValuationCategory,
} from '../../../contracts/dossierDetails';


// InvocationRecord type imported from shared components

interface SummarizeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: { summary: string; keyFacts?: string[] };
  correlationId?: string;
  error?: ErrorInfo;
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

  // CX-25: Real dossier details from backend
  const dossierDetails = useDossierDetails(parcelId);

  const [summarizeState, setSummarizeState] = useState<SummarizeState>({ status: 'idle' });
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  // CX-26: Evidence snapshot (manual fetch — point-in-time)
  const evidence = useEvidenceSnapshot(parcelId);

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

  return (
    <div className='tf-suite-dossier space-y-6' data-testid='property-dossier-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon="📁"
        title="TerraDossier"
        parcelId={parcelId}
        subtitle={`Documents for parcel ${parcelId}`}
      />

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
      {/* Document Management — disabled pending R2 backend               */}
      {/* ================================================================ */}
      <BentoCard title="Document Management" variant="form">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2 opacity-50">📁</div>
          <p className="tf-text-tertiary font-medium">Document Management</p>
          <p className="tf-text-dim text-sm mt-1">
            Document storage and retrieval coming in R2
          </p>
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

      {/* Invocation History */}
      <InvocationHistory
        records={invocationHistory}
        title="Summarization History"
        icon="📜"
        emptyMessage="No summarizations yet."
      />
    </div>
  );
};

export default PropertyDossier;

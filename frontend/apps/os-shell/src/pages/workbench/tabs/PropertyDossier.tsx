/**
 * PropertyDossier.tsx
 *
 * Phase 5.2: Property Dossier Tab - Document Management MWUX Slice
 * Real MWUX with document listing, selection, and summarize tool invocation.
 *
 * Architecture: UI → list docs → select → summarize_dossier tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import {
  ParcelContextHeader,
  InvocationHistory,
  type InvocationRecord,
} from '../../../components/workbench';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

/** Document categories for organization */
const DOCUMENT_CATEGORIES = [
  { id: 'deeds', label: 'Deeds & Titles', icon: '📜' },
  { id: 'permits', label: 'Permits', icon: '🏗️' },
  { id: 'correspondence', label: 'Correspondence', icon: '✉️' },
  { id: 'assessments', label: 'Assessments', icon: '📊' },
  { id: 'photos', label: 'Property Photos', icon: '📸' },
] as const;

/** Mock document data — comprehensive Benton County property dossier */
interface DossierDocument {
  id: string;
  title: string;
  category: string;
  date: string;
  type: string;
  pages?: number;
  fileSize?: string;
  source?: string;
}

const MOCK_DOCUMENTS: DossierDocument[] = [
  { id: 'doc-001', title: 'Warranty Deed', category: 'deeds', date: '2019-03-15', type: 'deed', pages: 4, fileSize: '245 KB', source: 'Benton County Recorder' },
  { id: 'doc-002', title: 'Title Insurance Policy', category: 'deeds', date: '2019-03-15', type: 'title', pages: 12, fileSize: '890 KB', source: 'First American Title' },
  { id: 'doc-003', title: 'Legal Description / Plat Map', category: 'deeds', date: '2019-03-10', type: 'plat', pages: 2, fileSize: '1.2 MB', source: 'Benton County Surveyor' },
  { id: 'doc-004', title: 'Building Permit #BP-2021-4521', category: 'permits', date: '2021-06-22', type: 'permit', pages: 3, fileSize: '180 KB', source: 'Benton County Planning' },
  { id: 'doc-005', title: 'Final Inspection Certificate', category: 'permits', date: '2021-11-30', type: 'inspection', pages: 1, fileSize: '95 KB', source: 'Benton County Building' },
  { id: 'doc-006', title: 'Septic System Permit', category: 'permits', date: '2019-05-10', type: 'permit', pages: 2, fileSize: '150 KB', source: 'Benton-Franklin Health' },
  { id: 'doc-007', title: 'Value Notice — 2024', category: 'correspondence', date: '2024-01-15', type: 'notice', pages: 2, fileSize: '120 KB', source: 'Assessor\'s Office' },
  { id: 'doc-008', title: 'Appeal Response', category: 'correspondence', date: '2024-03-20', type: 'letter', pages: 3, fileSize: '175 KB', source: 'BOE Clerk' },
  { id: 'doc-009', title: 'Exemption Application — Senior/Disabled', category: 'correspondence', date: '2023-09-01', type: 'application', pages: 4, fileSize: '210 KB', source: 'Taxpayer' },
  { id: 'doc-010', title: 'Assessment Record — 2024', category: 'assessments', date: '2024-01-02', type: 'assessment', pages: 6, fileSize: '340 KB', source: 'CAMA System' },
  { id: 'doc-011', title: 'Comparable Sales Report', category: 'assessments', date: '2023-12-15', type: 'comps', pages: 8, fileSize: '520 KB', source: 'Appraisal Staff' },
  { id: 'doc-012', title: 'Cost Approach Worksheet', category: 'assessments', date: '2024-01-02', type: 'cost', pages: 3, fileSize: '190 KB', source: 'CAMA System' },
  { id: 'doc-013', title: 'Front Exterior — Street View', category: 'photos', date: '2023-06-15', type: 'photo', pages: 1, fileSize: '2.4 MB', source: 'Field Inspection' },
  { id: 'doc-014', title: 'Rear Exterior — Yard', category: 'photos', date: '2023-06-15', type: 'photo', pages: 1, fileSize: '1.8 MB', source: 'Field Inspection' },
];

// InvocationRecord type imported from shared components

interface SummarizeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: { summary: string; keyFacts?: string[] };
  correlationId?: string;
  error?: ErrorInfo;
}

export const PropertyDossier: React.FC = () => {
  const { parcelId } = useWorkbenchTab();

  const [selectedDoc, setSelectedDoc] = useState<DossierDocument | null>(null);
  const [summarizeState, setSummarizeState] = useState<SummarizeState>({ status: 'idle' });
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  const handleSelectDocument = useCallback((doc: DossierDocument) => {
    setSelectedDoc(doc);
    setSummarizeState({ status: 'idle' });
  }, []);

  const handleSummarize = useCallback(async () => {
    if (!selectedDoc) return;

    setSummarizeState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'summarize_dossier',
        params: {
          dossierId: selectedDoc.id,
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
  }, [selectedDoc, parcelId]);

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

      {/* Document Categories & List */}
      <BentoGrid columns={3} gap={1.5} padding={0}>
        {/* Categories + Documents List */}
        <BentoCard variant="table" title="Documents" actions={<span>📁</span>}>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <div key={cat.id} className='tf-panel p-4'>
              <h3 className='tf-text font-semibold flex items-center gap-2 mb-3'>
                <span>{cat.icon}</span> {cat.label}
              </h3>
              <ul className='space-y-2'>
                {MOCK_DOCUMENTS.filter((d) => d.category === cat.id).map((doc) => (
                  <li
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                      selectedDoc?.id === doc.id
                        ? 'tf-suite-active'
                        : 'tf-hover-surface'
                    }`}
                  >
                    <p className='tf-text text-sm'>{doc.title}</p>
                    <p className='tf-text-muted text-xs'>{doc.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </BentoCard>

        {/* Document Detail & Actions */}
        <BentoCard span="2x1">
          {selectedDoc ? (
            <div
              className='tf-suite-card p-6'
              data-testid='document-detail'
            >
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='tf-text text-lg font-semibold'>{selectedDoc.title}</h3>
                  <p className='tf-text-tertiary text-sm'>
                    {selectedDoc.type.toUpperCase()} • {selectedDoc.date}
                  </p>
                </div>
                <button
                  onClick={handleSummarize}
                  disabled={summarizeState.status === 'loading'}
                  className='tf-suite-dossier-cta px-4 py-2 rounded-lg transition-colors flex items-center gap-2'
                >
                  {summarizeState.status === 'loading' ? (
                    <>
                      <div className='w-4 h-4 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(var(--tf-text) / 0.3)', borderTopColor: 'hsl(var(--tf-text))' }} />
                      Summarizing...
                    </>
                  ) : (
                    <>📝 Summarize</>
                  )}
                </button>
              </div>

              {/* Document Preview Panel */}
              <div className='tf-overlay rounded-lg overflow-hidden'>
                {/* Document metadata bar */}
                <div className='flex items-center justify-between px-4 py-2' style={{ background: 'hsl(var(--tf-surface-2))' }}>
                  <div className='flex items-center gap-3 text-sm tf-text-tertiary'>
                    <span>{selectedDoc.type.toUpperCase()}</span>
                    {selectedDoc.pages && <span>• {selectedDoc.pages} page{selectedDoc.pages > 1 ? 's' : ''}</span>}
                    {selectedDoc.fileSize && <span>• {selectedDoc.fileSize}</span>}
                  </div>
                  {selectedDoc.source && (
                    <span className='text-xs tf-text-dim'>Source: {selectedDoc.source}</span>
                  )}
                </div>

                {/* Content preview area */}
                <div className='p-6'>
                  {selectedDoc.type === 'photo' ? (
                    <div className='tf-panel p-8 text-center'>
                      <span className='text-6xl block mb-3'>📷</span>
                      <p className='tf-text-secondary font-medium'>{selectedDoc.title}</p>
                      <p className='tf-text-dim text-sm mt-1'>
                        Captured {selectedDoc.date} • {selectedDoc.fileSize}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {/* Simulated document lines */}
                      <div className='tf-panel p-4 font-mono text-xs space-y-2'>
                        <div className='tf-text-secondary text-sm font-sans font-semibold'>
                          {selectedDoc.title}
                        </div>
                        <div className='border-b tf-border pb-2'>
                          <span className='tf-text-dim'>Filed: </span>
                          <span className='tf-text-tertiary'>{selectedDoc.date}</span>
                          {selectedDoc.source && (
                            <>
                              <span className='tf-text-dim'> • From: </span>
                              <span className='tf-text-tertiary'>{selectedDoc.source}</span>
                            </>
                          )}
                        </div>
                        <div className='tf-text-dim italic'>
                          Full document preview requires document storage integration.
                          Use the Summarize button for an AI-generated summary.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className='tf-panel p-8 text-center'>
              <span className='text-4xl mb-4 block'>👈</span>
              <p className='tf-text-tertiary'>Select a document to view details</p>
            </div>
          )}

          {/* Loading State */}
          {summarizeState.status === 'loading' && (
            <div className='tf-status-info rounded-xl p-4' role='status'>
              <div className='flex items-center gap-3'>
                <div className='w-5 h-5 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(var(--tf-text) / 0.3)', borderTopColor: 'hsl(var(--tf-text))' }} />
                <span className='tf-text'>Summarizing document...</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {summarizeState.status === 'success' && summarizeState.result && (
            <div className='tf-status-success rounded-xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold flex items-center gap-2' style={{ color: 'hsl(var(--tf-success))' }}>
                  <span>✅</span> Document Summary
                </h3>
                <div className='flex items-center gap-2'>
                  <span className='tf-text-muted text-sm'>Correlation ID:</span>
                  <code className='tf-overlay px-2 py-1 rounded text-sm tf-text-secondary'>
                    {summarizeState.correlationId}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(summarizeState.correlationId || '')
                    }
                    className='px-2 py-1 text-xs tf-hover-surface rounded'
                    title='Copy correlation ID'
                  >
                    Copy
                  </button>
                  <button
                    onClick={clearSummarizeState}
                    className='px-2 py-1 text-xs tf-hover-surface rounded'
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className='tf-overlay rounded-lg p-4'>
                <p className='tf-text'>{summarizeState.result.summary}</p>
                {summarizeState.result.keyFacts && (
                  <ul className='mt-4 space-y-1'>
                    {summarizeState.result.keyFacts.map((fact, idx) => (
                      <li key={idx} className='tf-text-secondary text-sm flex items-center gap-2'>
                        <span style={{ color: 'hsl(var(--tf-success))' }}>•</span> {fact}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {getEnv().DEV && (
                <details className='mt-4'>
                  <summary className='tf-text-muted text-sm cursor-pointer hover:text-[hsl(var(--tf-text)/0.7)]'>
                    🔍 Developer Info
                  </summary>
                  <div className='mt-2 tf-overlay rounded p-3'>
                    <code className='text-xs tf-text-tertiary block'>
                      pnpm run trace:query --correlation {summarizeState.correlationId}
                    </code>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Error State */}
          {summarizeState.status === 'error' && summarizeState.error && (
            <div className='tf-status-error rounded-xl p-5'>
              <div className='flex justify-end mb-2'>
                <button
                  onClick={clearSummarizeState}
                  className='px-2 py-1 text-xs tf-hover-surface rounded'
                >
                  Dismiss
                </button>
              </div>
              <ErrorDisplay error={summarizeState.error} />
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

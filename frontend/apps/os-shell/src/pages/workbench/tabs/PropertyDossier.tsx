/**
 * PropertyDossier.tsx
 *
 * Phase 5.2: Property Dossier Tab - Document Management MWUX Slice
 * Real MWUX with document listing, selection, and summarize tool invocation.
 *
 * Architecture: UI → list docs → select → summarize_dossier tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import {
  ParcelContextHeader,
  InvocationHistory,
  type InvocationRecord,
} from '../../../components/workbench';

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
  const { parcelId } = useOutletContext<{ parcelId: string }>();

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
    <div className='space-y-6' data-testid='property-dossier-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon="📁"
        title="TerraDossier"
        parcelId={parcelId}
        subtitle={`Documents for parcel ${parcelId}`}
      />

      {/* Document Categories & List */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Categories + Documents List */}
        <div className='lg:col-span-1 space-y-4'>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <div key={cat.id} className='bg-white/5 rounded-xl p-4 border border-white/10'>
              <h3 className='text-white font-semibold flex items-center gap-2 mb-3'>
                <span>{cat.icon}</span> {cat.label}
              </h3>
              <ul className='space-y-2'>
                {MOCK_DOCUMENTS.filter((d) => d.category === cat.id).map((doc) => (
                  <li
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                      selectedDoc?.id === doc.id
                        ? 'bg-emerald-500/30 border border-emerald-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className='text-white text-sm'>{doc.title}</p>
                    <p className='text-white/50 text-xs'>{doc.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Document Detail & Actions */}
        <div className='lg:col-span-2 space-y-4'>
          {selectedDoc ? (
            <div
              className='bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-6 border border-emerald-500/30'
              data-testid='document-detail'
            >
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='text-white text-lg font-semibold'>{selectedDoc.title}</h3>
                  <p className='text-white/60 text-sm'>
                    {selectedDoc.type.toUpperCase()} • {selectedDoc.date}
                  </p>
                </div>
                <button
                  onClick={handleSummarize}
                  disabled={summarizeState.status === 'loading'}
                  className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {summarizeState.status === 'loading' ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      Summarizing...
                    </>
                  ) : (
                    <>📝 Summarize</>
                  )}
                </button>
              </div>

              {/* Document Preview Panel */}
              <div className='bg-black/20 rounded-lg overflow-hidden'>
                {/* Document metadata bar */}
                <div className='flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10'>
                  <div className='flex items-center gap-3 text-sm text-white/60'>
                    <span>{selectedDoc.type.toUpperCase()}</span>
                    {selectedDoc.pages && <span>• {selectedDoc.pages} page{selectedDoc.pages > 1 ? 's' : ''}</span>}
                    {selectedDoc.fileSize && <span>• {selectedDoc.fileSize}</span>}
                  </div>
                  {selectedDoc.source && (
                    <span className='text-xs text-white/40'>Source: {selectedDoc.source}</span>
                  )}
                </div>

                {/* Content preview area */}
                <div className='p-6'>
                  {selectedDoc.type === 'photo' ? (
                    <div className='bg-white/5 rounded-lg p-8 text-center'>
                      <span className='text-6xl block mb-3'>📷</span>
                      <p className='text-white/70 font-medium'>{selectedDoc.title}</p>
                      <p className='text-white/40 text-sm mt-1'>
                        Captured {selectedDoc.date} • {selectedDoc.fileSize}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {/* Simulated document lines */}
                      <div className='bg-white/5 rounded p-4 font-mono text-xs text-white/50 space-y-2'>
                        <div className='text-white/80 text-sm font-sans font-semibold'>
                          {selectedDoc.title}
                        </div>
                        <div className='border-b border-white/10 pb-2'>
                          <span className='text-white/40'>Filed: </span>
                          <span className='text-white/60'>{selectedDoc.date}</span>
                          {selectedDoc.source && (
                            <>
                              <span className='text-white/40'> • From: </span>
                              <span className='text-white/60'>{selectedDoc.source}</span>
                            </>
                          )}
                        </div>
                        <div className='text-white/30 italic'>
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
            <div className='bg-white/5 rounded-xl p-8 border border-white/10 text-center'>
              <span className='text-4xl mb-4 block'>👈</span>
              <p className='text-white/60'>Select a document to view details</p>
            </div>
          )}

          {/* Loading State */}
          {summarizeState.status === 'loading' && (
            <div className='bg-blue-500/20 rounded-xl p-4 border border-blue-500/30' role='status'>
              <div className='flex items-center gap-3'>
                <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                <span className='text-white'>Summarizing document...</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {summarizeState.status === 'success' && summarizeState.result && (
            <div className='bg-emerald-500/20 rounded-xl p-5 border border-emerald-500/30'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-emerald-400 font-semibold flex items-center gap-2'>
                  <span>✅</span> Document Summary
                </h3>
                <div className='flex items-center gap-2'>
                  <span className='text-white/50 text-sm'>Correlation ID:</span>
                  <code className='bg-black/30 px-2 py-1 rounded text-sm text-white/80'>
                    {summarizeState.correlationId}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(summarizeState.correlationId || '')
                    }
                    className='px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20'
                    title='Copy correlation ID'
                  >
                    Copy
                  </button>
                  <button
                    onClick={clearSummarizeState}
                    className='px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20'
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className='bg-black/30 rounded-lg p-4'>
                <p className='text-white/90'>{summarizeState.result.summary}</p>
                {summarizeState.result.keyFacts && (
                  <ul className='mt-4 space-y-1'>
                    {summarizeState.result.keyFacts.map((fact, idx) => (
                      <li key={idx} className='text-white/70 text-sm flex items-center gap-2'>
                        <span className='text-emerald-400'>•</span> {fact}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {getEnv().DEV && (
                <details className='mt-4'>
                  <summary className='text-white/50 text-sm cursor-pointer hover:text-white/70'>
                    🔍 Developer Info
                  </summary>
                  <div className='mt-2 bg-black/20 rounded p-3'>
                    <code className='text-xs text-white/60 block'>
                      pnpm run trace:query --correlation {summarizeState.correlationId}
                    </code>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Error State */}
          {summarizeState.status === 'error' && summarizeState.error && (
            <div className='bg-red-500/20 rounded-xl p-5 border border-red-500/30'>
              <div className='flex justify-end mb-2'>
                <button
                  onClick={clearSummarizeState}
                  className='px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20'
                >
                  Dismiss
                </button>
              </div>
              <ErrorDisplay error={summarizeState.error} />
            </div>
          )}
        </div>
      </div>

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

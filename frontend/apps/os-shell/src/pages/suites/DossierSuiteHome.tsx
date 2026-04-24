/**
 * TerraDossier Suite Home -- Evidence & Document Management
 * ===================================================================
 * Constitutional Suite: dossier (Article IV)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, shared recent parcel queue.
 * Does NOT host parcel execution — that lives in the Property Workbench.
 *
 * Task D3 — receives County Studio Inspector handoff metadata on mount.
 * Supported metadata keys (all optional):
 *   deeplinkQuery:  '?template=SegmentEvidence&segmentId=s1' — raw query;
 *                   parsed as a fallback if pre-split fields are missing.
 *   packetTemplate: string (currently always 'SegmentEvidence').
 *   segmentId:      string — seeds the draft + back-chip.
 *   segmentLabel:   string — human label for the draft.
 */

import { useCallback, useEffect, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import DossierEvidenceDraftPanel from '../../components/dossier/DossierEvidenceDraftPanel';
import { useSegmentEvidenceDraftStore } from './segmentEvidenceDraftStore';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  FolderOpen,
  Shield,
  Package,
  Link2,
  Camera,
  FileSearch,
  Plug,
  RefreshCw,
  Zap,
} from 'lucide-react';

const DOSSIER_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'documents', label: 'Document Manager', icon: FolderOpen, description: 'File repository with search, type filtering, custody chain', launchMode: 'workbench', workbenchTab: 'dossier' },
  { id: 'evidence', label: 'Evidence Viewer', icon: Shield, description: 'Chain-of-custody evidence registry and timeline', launchMode: 'workbench', workbenchTab: 'dossier' },
  { id: 'defense', label: 'Defense Packets', icon: Package, description: 'BOE appeal defense packet assembly via the TerraDais workbench flow', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'chain', label: 'Chain of Custody', icon: Link2, description: 'Full custody chain explorer with hash verification', launchMode: 'workbench', workbenchTab: 'dossier' },
  { id: 'photos', label: 'Photo Manager', icon: Camera, description: 'Geotagged property photos with metadata', launchMode: 'workbench', workbenchTab: 'dossier' },
  { id: 'search', label: 'Deep Search', icon: FileSearch, description: 'Full-text search across all documents and evidence', launchMode: 'workbench', workbenchTab: 'dossier' },
  // Standalone-mode (system/admin, opens standalone window)
  { id: 'pacs-bridge', label: 'Assessment DataBridge', icon: Plug, description: 'County data import/export & sync management', launchMode: 'standalone', moduleId: 'pacs-bridge', truthState: 'queued' },
  { id: 'terra-sync', label: 'TerraSync', icon: RefreshCw, description: 'County data synchronization — multi-source ETL pipeline', launchMode: 'standalone', moduleId: 'terra-sync', truthState: 'queued' },
  { id: 'terra-flow', label: 'TerraFlow', icon: Zap, description: 'Workflow automation engine — assessment pipeline orchestration', launchMode: 'standalone', moduleId: 'terra-flow', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');

interface OpenAppealPacketSummary {
  appealId: string;
  packetRef: string;
  payloadRef: string;
  sections: string[];
  chainOfCustody: string[];
}

interface ExportEqualizationPackageSummary {
  payloadRef: string;
  packageRef: string;
  artifactCount: number;
  checklist: string[];
}

interface ExportAuditBundleSummary {
  payloadRef: string;
  bundleRef: string;
  artifactCount: number;
  traceRef: string;
}

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraDossier stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Fixture-backed county aggregates: TerraDossier stats are using test fixture data, not live backend metrics.';
  }
  return null;
}

/** Best-effort parser for the raw backend deeplink query string (Task D3). */
function parseDossierDeeplinkQuery(raw: unknown): { template?: string; segmentId?: string } {
  if (typeof raw !== 'string' || raw.length === 0) return {};
  try {
    const trimmed = raw.startsWith('?') ? raw.slice(1) : raw;
    const params  = new URLSearchParams(trimmed);
    const out: { template?: string; segmentId?: string } = {};
    const template = params.get('template');
    if (template) out.template = template;
    const segmentId = params.get('segmentId');
    if (segmentId) out.segmentId = segmentId;
    return out;
  } catch {
    return {};
  }
}

export interface DossierSuiteHomeProps {
  /** Optional metadata from the shell's window system (County Studio handoff). */
  metadata?: Record<string, unknown>;
}

export default function DossierSuiteHome({ metadata }: DossierSuiteHomeProps = {}) {
  const { stats, loading, error, source } = useCountyStats();
  const sourceDisclosure = getSourceDisclosure(source);
  const createDraft = useSegmentEvidenceDraftStore((s) => s.createDraft);

  // ── Consume County Studio handoff metadata on mount (Task D3) ───────────
  useEffect(() => {
    if (!metadata) return;
    const parsed = parseDossierDeeplinkQuery(metadata.deeplinkQuery);

    const templateFromMeta = typeof metadata.packetTemplate === 'string' ? metadata.packetTemplate : null;
    const template = templateFromMeta ?? parsed.template ?? null;

    const segmentFromMeta = typeof metadata.segmentId === 'string' ? metadata.segmentId : null;
    const segmentId = segmentFromMeta ?? parsed.segmentId ?? null;

    const labelFromMeta = typeof metadata.segmentLabel === 'string' ? metadata.segmentLabel : null;

    if (template === 'SegmentEvidence' && segmentId) {
      createDraft(template, segmentId, labelFromMeta ?? segmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [appealId, setAppealId] = useState('BOE-2026-001');
  const [draftVersion, setDraftVersion] = useState('benton-2026-working');
  const [packetState, setPacketState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: OpenAppealPacketSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [equalizationState, setEqualizationState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: ExportEqualizationPackageSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [auditBundleState, setAuditBundleState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: ExportAuditBundleSummary; correlationId?: string; error?: string }>({ status: 'idle' });

  const parseToolOutput = <T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  };

  const handleOpenAppealPacket = useCallback(async () => {
    setPacketState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'open_appeal_packet',
        params: { county: 'benton', appealId },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<OpenAppealPacketSummary>(response.result.output, {
          appealId,
          packetRef: '',
          payloadRef: '',
          sections: [],
          chainOfCustody: [],
        });
        setPacketState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setPacketState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to open appeal packet.' });
      }
    } catch (toolError) {
      setPacketState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to open appeal packet.',
      });
    }
  }, [appealId]);

  const handleExportEqualization = useCallback(async () => {
    setEqualizationState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'export_equalization_package',
        params: { county: 'benton', draftVersion, taxYear: 2026, reasonCode: 'annual_certification' },
        confirmation: { confirmed: true, reasonCode: 'annual_certification' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<ExportEqualizationPackageSummary>(response.result.output, {
          payloadRef: '',
          packageRef: '',
          artifactCount: 0,
          checklist: [],
        });
        setEqualizationState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setEqualizationState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to export equalization package.' });
      }
    } catch (toolError) {
      setEqualizationState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to export equalization package.',
      });
    }
  }, [draftVersion]);

  const handleExportAuditBundle = useCallback(async () => {
    setAuditBundleState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'export_audit_bundle',
        params: { county: 'benton', taxYear: 2026, bundleScope: 'county', reasonCode: 'annual_certification' },
        confirmation: { confirmed: true, reasonCode: 'annual_certification' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<ExportAuditBundleSummary>(response.result.output, {
          payloadRef: '',
          bundleRef: '',
          artifactCount: 0,
          traceRef: '',
        });
        setAuditBundleState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setAuditBundleState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to export audit bundle.' });
      }
    } catch (toolError) {
      setAuditBundleState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to export audit bundle.',
      });
    }
  }, []);

  return (
    <div data-testid="suite-dossier-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="dossier" />

      {/* Task D3 — County Studio handoff: segment evidence draft */}
      <DossierEvidenceDraftPanel />

      {/* Source disclosure — only when not live */}
      {stats && sourceDisclosure && (
        <div
          data-testid="dossier-source-disclosure"
          role="status"
          className="px-6 py-2 text-xs"
          style={{
            color: 'hsl(var(--tf-warning))',
            background: 'hsl(var(--tf-warning) / 0.10)',
            borderBottom: '1px solid hsl(var(--tf-warning) / 0.2)',
          }}
        >
          {sourceDisclosure}
        </div>
      )}

      {loading && !stats && (
        <div data-testid="dossier-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="dossier-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-dossier))' }}>{error}</div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-dossier))' }}>{fmtNum(stats.activeAppeals)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Pending Assessments</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.pendingAssessments)}</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-dossier) / 0.15)' }}>
            <FolderOpen size={24} style={{ color: 'hsl(var(--tf-suite-dossier))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraDossier</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Evidence & Document Management</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <section data-testid="dossier-defense-plane" className="px-6 pt-5">
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: 'hsl(var(--tf-border))',
              background: 'hsl(var(--tf-card-bg) / 0.5)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Defense Plane
                </p>
                <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
                  Packet Readiness & Export Posture
                </h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Governed county evidence actions for appeals, equalization, and audit bundles. Use this surface to verify readiness before routing into parcel-scoped dossier work.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(var(--tf-suite-dossier) / 0.12)', color: 'hsl(var(--tf-suite-dossier))' }}
                >
                  {fmtNum(stats?.activeAppeals)} active appeals
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(var(--tf-border) / 0.2)', color: 'hsl(var(--tf-fg))' }}
                >
                  {fmtNum(stats?.pendingAssessments)} pending assessments
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Appeal Packet Access</div>
                    <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Open the governed BOE packet, chain-of-custody view, and section posture for a live appeal.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAppealPacket}
                    disabled={packetState.status === 'loading'}
                    className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
                    style={{
                      borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
                      background: 'hsl(var(--tf-suite-dossier) / 0.12)',
                      color: 'hsl(var(--tf-suite-dossier))',
                    }}
                  >
                    {packetState.status === 'loading' ? 'Opening…' : 'Open Packet'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={appealId}
                    onChange={(e) => setAppealId(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(var(--tf-border))',
                      background: 'hsl(var(--tf-card-bg) / 0.4)',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>
                {packetState.status === 'success' && packetState.result && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Packet Ref</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{packetState.result.packetRef || 'Pending packet reference'}</div>
                      <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{packetState.result.payloadRef}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {packetState.result.sections.map((section) => (
                        <span key={section} className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                          {section}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      Chain of custody: {packetState.result.chainOfCustody.join(' → ') || 'No chain entries returned.'}
                    </div>
                  </div>
                )}
                {packetState.status === 'error' && (
                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.24)', background: 'hsl(var(--tf-suite-dossier) / 0.08)', color: 'hsl(var(--tf-suite-dossier))' }}>
                    {packetState.error}
                  </div>
                )}
              </div>

              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>County Exports</div>
                <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Draft governed equalization and audit artifacts for certification, DOR, and oversight reviews.</div>
                <div className="mt-4 grid gap-3">
                  <input
                    value={draftVersion}
                    onChange={(e) => setDraftVersion(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(var(--tf-border))',
                      background: 'hsl(var(--tf-card-bg) / 0.4)',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExportEqualization}
                      disabled={equalizationState.status === 'loading'}
                      className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
                      style={{
                        borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
                        background: 'hsl(var(--tf-suite-dossier) / 0.12)',
                        color: 'hsl(var(--tf-suite-dossier))',
                      }}
                    >
                      {equalizationState.status === 'loading' ? 'Exporting…' : 'Equalization Package'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAuditBundle}
                      disabled={auditBundleState.status === 'loading'}
                      className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
                      style={{
                        borderColor: 'hsl(var(--tf-border))',
                        background: 'transparent',
                        color: 'hsl(var(--tf-fg))',
                      }}
                    >
                      {auditBundleState.status === 'loading' ? 'Exporting…' : 'Audit Bundle'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {equalizationState.status === 'success' && equalizationState.result && (
                    <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Equalization Package</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{equalizationState.result.packageRef || 'Pending package reference'}</div>
                      <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{equalizationState.result.artifactCount} artifacts</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {equalizationState.result.checklist.map((item) => (
                          <span key={item} className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {auditBundleState.status === 'success' && auditBundleState.result && (
                    <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Audit Bundle</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{auditBundleState.result.bundleRef || 'Pending bundle reference'}</div>
                      <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{auditBundleState.result.artifactCount} artifacts</div>
                      <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{auditBundleState.result.traceRef}</div>
                    </div>
                  )}
                </div>

                {(equalizationState.status === 'error' || auditBundleState.status === 'error') && (
                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.24)', background: 'hsl(var(--tf-suite-dossier) / 0.08)', color: 'hsl(var(--tf-suite-dossier))' }}>
                    {equalizationState.error || auditBundleState.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Proof posture note — workbench tools are parcel-scoped; system integrations are queued */}
        <p
          data-testid="dossier-proof-note"
          role="note"
          className="px-6 pt-4 pb-2 text-xs"
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          Document and evidence tools open in the Property Workbench for parcel-scoped operations.
          Assessment DataBridge, TerraSync, and TerraFlow integrations are scheduled for a future release.
        </p>
        <SuiteModuleGrid modules={DOSSIER_MODULES} accentVar="--tf-suite-dossier" />
        <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-dossier" emptyMessage="No recent parcel activity" />
      </main>
    </div>
  );
}

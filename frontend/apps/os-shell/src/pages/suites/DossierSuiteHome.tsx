/**
 * TerraDossier Suite Home -- Evidence & Document Management
 * ===================================================================
 * Constitutional Suite: dossier (Article IV)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, shared recent parcel queue.
 * Does NOT host parcel execution — that lives in the Property Workbench.
 */

import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
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
  { id: 'pacs-bridge', label: 'PACS DataBridge', icon: Plug, description: 'Harris PACS 9.0 data import/export & sync management', launchMode: 'standalone', moduleId: 'pacs-bridge', truthState: 'queued' },
  { id: 'terra-sync', label: 'TerraSync', icon: RefreshCw, description: 'County data synchronization — multi-source ETL pipeline', launchMode: 'standalone', moduleId: 'terra-sync', truthState: 'queued' },
  { id: 'terra-flow', label: 'TerraFlow', icon: Zap, description: 'Workflow automation engine — assessment pipeline orchestration', launchMode: 'standalone', moduleId: 'terra-flow', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraDossier stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Fixture-backed county aggregates: TerraDossier stats are using test fixture data, not live backend metrics.';
  }
  return null;
}

export default function DossierSuiteHome() {
  const { stats, loading, error, source } = useCountyStats();
  const sourceDisclosure = getSourceDisclosure(source);

  return (
    <div data-testid="suite-dossier-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="dossier" />

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
        {/* Proof posture note — workbench tools are parcel-scoped; system integrations are queued */}
        <p
          data-testid="dossier-proof-note"
          role="note"
          className="px-6 pt-4 pb-2 text-xs"
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          Document and evidence tools open in the Property Workbench for parcel-scoped operations.
          PACS DataBridge, TerraSync, and TerraFlow are queued — these integrations are not yet implemented in this build.
        </p>
        <SuiteModuleGrid modules={DOSSIER_MODULES} accentVar="--tf-suite-dossier" />
        <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-dossier" emptyMessage="No recent parcel activity" />
      </main>
    </div>
  );
}

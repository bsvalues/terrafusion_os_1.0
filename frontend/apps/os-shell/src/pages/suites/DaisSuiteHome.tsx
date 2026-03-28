/**
 * TerraDais Suite Home -- Workflow & Governance Dashboard
 * ===================================================================
 * Constitutional Suite: dais (Article III)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats (appeals, levy revenue), module launcher grid,
 * recent parcel queue. Does NOT host parcel execution.
 *
 * Note: TerraDais API metrics are composed via useDaisSuiteStats.
 * Falls back to county-provider aggregates when live Dais endpoints are unavailable.
 * Per-parcel appeal work routes to the Workbench Dais tab.
 */

import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import NoticeBatchQueuePanel from '../../components/dais/NoticeBatchQueuePanel';
import CertRollPanel from '../../components/dais/CertRollPanel';
import ManagementDashboardPanel from '../../components/dais/ManagementDashboardPanel';
import { useDaisSuiteStats } from './useDaisSuiteStats';
import {
  Scale,
  Receipt,
  Landmark,
  CheckCircle2,
  HardHat,
  Calendar,
  Search,
  Bot,
  LayoutDashboard,
  ClipboardList,
  Mail,
  FileCheck,
} from 'lucide-react';

const DAIS_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'certification', label: 'Certification', icon: CheckCircle2, description: 'Assessment roll certification workflow & progress', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'appeals', label: 'Appeals', icon: Scale, description: 'BOE appeal tracking, scheduling, and outcomes', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, description: 'Assessment cycle deadlines and scheduling', launchMode: 'workbench', workbenchTab: 'dais' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'terra-levy', label: 'TerraLevy', icon: Receipt, description: 'County-wide property tax levy rates by district', launchMode: 'standalone', moduleId: 'terra-levy' },
  { id: 'terra-pilt', label: 'TerraPILT', icon: Landmark, description: 'Payment In Lieu of Taxes — federal/state land values', launchMode: 'standalone', moduleId: 'terra-pilt', truthState: 'queued' },
  { id: 'terra-permit', label: 'TerraPermit', icon: HardHat, description: 'Building permit intake and workflow tracking', launchMode: 'standalone', moduleId: 'terra-permit', truthState: 'queued' },
  { id: 'vei', label: 'VEI', icon: Search, description: 'Vertical Equality Index — assessment equity & PRB analysis', launchMode: 'standalone', moduleId: 'vei', truthState: 'queued' },
  { id: 'property-tax-ai', label: 'PropertyTax AI', icon: Bot, description: 'AI-driven property tax analysis & anomaly detection', launchMode: 'standalone', moduleId: 'property-tax-ai', truthState: 'queued' },
  { id: 'management-dashboard', label: 'Management', icon: LayoutDashboard, description: 'Assessor operations — certification, workload, staff assignment (ADR-003)', launchMode: 'standalone', moduleId: 'management-dashboard' },
  { id: 'terra-queue', label: 'TerraQueue', icon: ClipboardList, description: 'Cross-parcel work queue — assignment, progress, quality review', launchMode: 'standalone', moduleId: 'terra-queue' },
  { id: 'terra-cert', label: 'TerraCert', icon: FileCheck, description: 'Roll sign-off, statutory export, and certification operations', launchMode: 'standalone', moduleId: 'terra-cert', truthState: 'queued' },
  { id: 'terra-notice', label: 'TerraNotice', icon: Mail, description: 'Batch notice dispatch — mail/print queue and delivery tracking', launchMode: 'standalone', moduleId: 'terra-notice', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

export default function DaisSuiteHome() {
  const { stats, loading, error, source } = useDaisSuiteStats();

  return (
    <div data-testid="suite-dais-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="dais" />

      {loading && !stats && (
        <div data-testid="dais-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="dais-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{error}</div>
      )}

      {stats && source === 'county-provider' && (
        <div
          data-testid="dais-source-disclosure"
          role="status"
          className="px-6 py-3 text-sm"
          style={{
            color: 'hsl(var(--tf-warning))',
            background: 'hsl(var(--tf-warning) / 0.12)',
            borderBottom: '1px solid hsl(var(--tf-warning) / 0.24)',
          }}
        >
          County aggregate fallback active: TerraDais overview, certification, and notice panels are currently using county-wide provider aggregates, not TerraDais API metrics.
        </div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div data-testid="dais-stats" className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{fmtNum(stats.activeAppeals)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Levy Revenue</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.totalLevyRevenue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Pending</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.pendingAssessments)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Completion</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{(stats.assessmentCompletionPercent ?? 0).toFixed(1)}%</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-dais) / 0.15)' }}>
            <Scale size={24} style={{ color: 'hsl(var(--tf-suite-dais))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraDais</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Workflow, Governance & Appeals Management</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div data-testid="dais-modules">
          <SuiteModuleGrid modules={DAIS_MODULES} accentVar="--tf-suite-dais" />
        </div>
        <div data-testid="dais-mgmt-ops">
          <ManagementDashboardPanel stats={stats} />
        </div>
        <div data-testid="dais-cert-ops">
          <CertRollPanel stats={stats} />
        </div>
        <div data-testid="dais-notice-ops">
          <NoticeBatchQueuePanel stats={stats} />
        </div>
        <div data-testid="dais-queue">
          <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-dais" emptyMessage="No recent parcel activity" />
        </div>
      </main>
    </div>
  );
}

/**
 * TerraForge Suite Home -- Property Valuation & Cost Analysis
 * ===================================================================
 * Constitutional Suite: forge (Article I)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, recent parcel queue.
 * Does NOT host parcel execution — that lives in the Property Workbench.
 */

import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  ArrowLeft,
  Hammer,
  Calculator,
  BarChart3,
  Scale,
  TrendingUp,
  FileSearch,
  Gavel,
  ShieldCheck,
  LineChart,
  PieChart,
  MapPin,
  DollarSign,
  Search,
} from 'lucide-react';

const FORGE_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'costforge', label: 'CostForge', icon: Calculator, description: 'Benton County Cost Approach — replacement cost calculator', launchMode: 'workbench', workbenchTab: 'forge' },
  { id: 'comps', label: 'CompsForge', icon: BarChart3, description: 'Sales comparison approach with paired adjustments', launchMode: 'workbench', workbenchTab: 'forge' },
  { id: 'income-val', label: 'Income Valuation', icon: DollarSign, description: 'Income approach — direct capitalization & GRM for commercial properties', launchMode: 'workbench', workbenchTab: 'forge' },
  { id: 'comparable-sales', label: 'Comparable Sales', icon: Search, description: 'Parcel-scoped comp selection with paired sale adjustments', launchMode: 'workbench', workbenchTab: 'forge' },
  { id: 'appeal', label: 'AppealForge', icon: Gavel, description: 'BOE appeal preparation, evidence packets, and defense builder', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'reconcile', label: 'Reconciliation', icon: Scale, description: 'Three-approach reconciliation and final opinion of value', launchMode: 'workbench', workbenchTab: 'forge' },
  { id: 'audit', label: 'Value Audit', icon: FileSearch, description: 'FISMA-compliant audit trail for valuation changes', launchMode: 'workbench', workbenchTab: 'audit' },
  { id: 'governed', label: 'Governed Run', icon: ShieldCheck, description: 'Execute run_valuation_model through the governed path', launchMode: 'workbench', workbenchTab: 'forge' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'regression-studio', label: 'Regression Studio', icon: LineChart, description: 'County-wide MRA regression models & IAAO compliance', launchMode: 'standalone', moduleId: 'regression-studio' },
  { id: 'statistics-studio', label: 'Statistics Studio', icon: PieChart, description: 'Ratio studies, COD/PRD/PRB & statistical diagnostics', launchMode: 'standalone', moduleId: 'statistics-studio' },
  { id: 'terra-gama', label: 'TerraGAMA', icon: MapPin, description: 'Geographic Area Market Analysis — neighborhood delineation', launchMode: 'standalone', moduleId: 'terra-gama' },
  { id: 'batch-cost-run', label: 'Batch Cost Runs', icon: TrendingUp, description: 'Batch cost model runs with strata/neighborhood/class filters and dry-run preview', launchMode: 'standalone', moduleId: 'batch-cost-run' },
  { id: 'coefficient-preview', label: 'Coefficient Preview', icon: Scale, description: 'Current vs proposed coefficient comparison with parcel impact analysis', launchMode: 'standalone', moduleId: 'coefficient-preview' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

export default function ForgeSuiteHome() {
  const navigate = useNavigate();
  const { stats, loading, error } = useCountyStats();

  return (
    <div data-testid="suite-forge-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Parcel Context Banner — shows when parcel is active */}
      <ParcelContextBanner suiteTabId="forge" />

      {loading && !stats && (
        <div data-testid="forge-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="forge-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-forge))' }}>{error}</div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div data-testid="forge-stats" className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Avg Assessed</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.averageAssessedValue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Assessed This Year</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.assessedThisYear)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Pending</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-forge))' }}>{fmtNum(stats.pendingAssessments)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Completion</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{(stats.assessmentCompletionPercent ?? 0).toFixed(1)}%</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-forge) / 0.15)' }}>
            <Hammer size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraForge</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Property Valuation & Cost Analysis Engine</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div data-testid="forge-modules">
          <SuiteModuleGrid modules={FORGE_MODULES} accentVar="--tf-suite-forge" />
        </div>
        <div data-testid="forge-queue">
          <OperationalQueue title="Recent Assessments" accentVar="--tf-suite-forge" emptyMessage="No recent assessment activity" />
        </div>
      </main>
    </div>
  );
}

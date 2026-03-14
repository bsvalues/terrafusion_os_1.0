/**
 * TerraDais Suite Home -- Workflow & Governance Dashboard
 * ===================================================================
 * Constitutional Suite: dais (Article III)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats (appeals, levy revenue), module launcher grid,
 * recent parcel queue. Does NOT host parcel execution.
 *
 * Note: County-level stats from useCountyStats provide appeals/levy data.
 * Per-parcel appeal work routes to the Workbench Dais tab.
 */

import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  ArrowLeft,
  Scale,
  Receipt,
  Landmark,
  CheckCircle2,
  HardHat,
  Calendar,
  Search,
  Bot,
} from 'lucide-react';

const DAIS_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'certification', label: 'Certification', icon: CheckCircle2, description: 'Assessment roll certification workflow & progress', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'appeals', label: 'Appeals', icon: Scale, description: 'BOE appeal tracking, scheduling, and outcomes', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, description: 'Assessment cycle deadlines and scheduling', launchMode: 'workbench', workbenchTab: 'dais' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'terra-levy', label: 'TerraLevy', icon: Receipt, description: 'County-wide property tax levy rates by district', launchMode: 'standalone', moduleId: 'terra-levy' },
  { id: 'terra-pilt', label: 'TerraPILT', icon: Landmark, description: 'Payment In Lieu of Taxes — federal/state land values', launchMode: 'standalone', moduleId: 'terra-pilt' },
  { id: 'terra-permit', label: 'TerraPermit', icon: HardHat, description: 'Building permit intake and workflow tracking', launchMode: 'standalone', moduleId: 'terra-permit' },
  { id: 'vei', label: 'VEI', icon: Search, description: 'Vertical Equality Index — assessment equity & PRB analysis', launchMode: 'standalone', moduleId: 'vei' },
  { id: 'property-tax-ai', label: 'PropertyTax AI', icon: Bot, description: 'AI-driven property tax analysis & anomaly detection', launchMode: 'standalone', moduleId: 'property-tax-ai' },
];

const fmtNum = (n: number) => n.toLocaleString();
const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

export default function DaisSuiteHome() {
  const navigate = useNavigate();
  const { stats } = useCountyStats();

  return (
    <div data-testid="suite-dais-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="dais" />

      {/* Stats Strip */}
      {stats && (
        <div className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{fmtNum(stats.activeAppeals)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Levy Revenue</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.totalLevyRevenue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Pending</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.pendingAssessments)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Completion</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{stats.assessmentCompletionPercent.toFixed(1)}%</span></div>
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
        <SuiteModuleGrid modules={DAIS_MODULES} accentVar="--tf-suite-dais" />
        <OperationalQueue title="Pending Appeals" accentVar="--tf-suite-dais" emptyMessage="No recent appeal activity" />
      </main>
    </div>
  );
}

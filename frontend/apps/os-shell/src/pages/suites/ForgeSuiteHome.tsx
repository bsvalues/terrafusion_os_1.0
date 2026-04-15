/**
 * TerraFusion OS — TerraForge Suite Home
 *
 * ⚠️  MODULE LIST IS FROZEN — DO NOT EDIT WITHOUT EXPLICIT INSTRUCTION ⚠️
 *
 * The PRIMARY_MODULES and SECONDARY_MODULES arrays below define the v1
 * TerraForge app list. This list was verified correct at commit 8da26658a.
 *
 * IF THIS FILE LOOKS WRONG (wrong apps, wrong labels, wrong grouping):
 *   git checkout 8da26658a -- frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
 *
 * DO NOT rewrite the module list from memory or "fix" it by editing.
 * Restore from git. That is the only correct action.
 *
 * Verified layout (matches screenshot from 2026-04-09):
 *   PRIMARY   : CostForge (cost approach, AppFrame → port 5002)
 *               CompsForge (sales comparison, standalone React module)
 *               IncomeForge (income approach, queued)
 *   SPECIALIST: Statistics Studio (IAAO diagnostics)
 *               Batch Cost Runs (batch execution)
 *               Regression Studio / TerraGAMA / Coefficient Preview (queued)
 */
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { useCountyStats } from '../../hooks/useCountyStats';
import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';
import { SaleQualificationQueue } from './SaleQualificationQueue';
import { CompsPoolBrowser } from './CompsPoolBrowser';
import './ForgeSuiteHome.css';

type LaunchMode = 'standalone' | 'workbench';
type TruthState = 'live' | 'queued';

interface ForgeModuleDef {
  id: string;
  label: string;
  description: string;
  priority: 'primary' | 'secondary';
  launchMode: LaunchMode;
  chipLabel?: string;
  truthState?: TruthState;
  workbenchTab?: WorkbenchTabSlug;
  moduleId?: string;
}

const PRIMARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'costforge',
    label: 'CostForge',
    description:
      'County-wide cost approach — replacement cost schedules, depreciation tables, land schedules, and RCNLD',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'costforge',
    chipLabel: 'Cost approach',
  },
  {
    id: 'comps-forge',
    label: 'CompsForge',
    description:
      'County-wide sales comparison — adjustment grid studio, paired-sales analysis, and market-derived time trends',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'comps-forge',
    chipLabel: 'Sales comparison',
  },
  {
    id: 'income-forge',
    label: 'IncomeForge',
    description:
      'County-wide income approach — cap rates, NOI modeling, and rent schedules for commercial properties',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'income-forge',
    truthState: 'queued',
    chipLabel: 'Income approach',
  },
  {
    id: 'sales-forge',
    label: 'SalesForge',
    description:
      'Sale qualification & ratio audit — qualify sales, audit WAC codes, review IAAO stats, and export DOR-certified study',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'sales-forge',
    chipLabel: 'Sale qualification',
  },
] as const;

const SECONDARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'statistics-studio',
    label: 'Statistics Studio',
    description: 'IAAO ratio studies — COD, PRD, PRB, and assessment quality diagnostics',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'statistics-studio',
    chipLabel: 'IAAO diagnostics',
  },
  {
    id: 'batch-cost-run',
    label: 'Batch Cost Runs',
    description: 'County-wide cost model runs with strata, neighborhood, and class filters',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'batch-cost-run',
    chipLabel: 'Batch execution',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    description: 'MRA regression models with R² diagnostics for market modeling',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'regression-studio',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'terra-gama',
    label: 'TerraGAMA',
    description: 'Geospatial automated mass appraisal with spatial lag models',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'terra-gama',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    description: 'Live preview of adjustment coefficients before table publication',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'coefficient-preview',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
] as const;

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraForge stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Fixture-backed county aggregates: TerraForge stats are using test fixture data, not live backend metrics.';
  }
  return null;
}

function getLaunchLabel(mod: ForgeModuleDef): string {
  if (mod.truthState === 'queued') {
    return 'Queued surface';
  }
  if (mod.launchMode === 'workbench') {
    return mod.workbenchTab === 'dais' ? 'Opens TerraDais workbench' : 'Opens Property Workbench';
  }
  return 'Launches in window';
}

export default function ForgeSuiteHome() {
  const { stats, loading, error, source } = useCountyStats();
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const recentParcels = usePropertyStore((s) => s.recentParcels);
  const sourceDisclosure = getSourceDisclosure(source);

  // KPI values from live /api/terraforge/county-stats (PacsValuations, SupNum=0 working layer).
  // 95,811 is the correct PACS import count for Benton County working layer.
  const fmt = (n: number | undefined, style: 'decimal' | 'currency' | 'percent', decimals = 0) => {
    if (n === undefined || n === null) return '—';
    if (style === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(n);
    if (style === 'percent') return `${n.toFixed(1)}%`;
    return new Intl.NumberFormat('en-US').format(n);
  };
  const kpiMetrics = [
    { label: 'TOTAL PARCELS',      value: loading ? '…' : fmt(stats?.totalParcels,             'decimal'),   tone: 'neutral'  },
    { label: 'AVG ASSESSED',       value: loading ? '…' : fmt(stats?.averageAssessedValue,      'currency'),  tone: 'neutral'  },
    { label: 'ASSESSED THIS YEAR', value: loading ? '…' : fmt(stats?.assessedThisYear,          'decimal'),   tone: 'neutral'  },
    { label: 'PENDING',            value: loading ? '…' : fmt(stats?.pendingAssessments,        'decimal'),   tone: 'warn'     },
    { label: 'COMPLETION',         value: loading ? '…' : (stats ? fmt(stats.assessmentCompletionPercent, 'percent') : '—'), tone: 'success' },
  ] as const;

  const handleModuleLaunch = (mod: ForgeModuleDef) => {
    if (mod.truthState === 'queued') {
      return;
    }

    if (mod.launchMode === 'workbench') {
      if (!mod.workbenchTab) {
        return;
      }
      const parcelId = activeParcel?.parcelId;
      void activateModule('property-workbench', {
        source: 'system',
        metadata: { tab: mod.workbenchTab, ...(parcelId ? { parcelId } : {}) },
      });
      return;
    }

    const targetId = mod.moduleId ?? mod.id;
    void activateModule(targetId, { source: 'system' });
  };

  const handleParcelOpen = (parcelId: string) => {
    void activateModule('property-workbench', {
      source: 'system',
      metadata: { parcelId },
    });
  };

  return (
    <div data-testid="suite-forge-root" className="forge-workspace h-full flex flex-col">
      <ParcelContextBanner suiteTabId="forge" />

      <main className="forge-workspace__viewport">
        <div className="forge-workspace__stage">
          <header className="forge-workspace__header">
            <div>
              <p className="forge-workspace__eyebrow">Suite-Forge · County-Wide Workspace</p>
              <h1 className="forge-workspace__title">TerraForge</h1>
              <p className="forge-workspace__subtitle">Property Valuation &amp; Cost Analysis Engine</p>
            </div>
            <div className="forge-workspace__status">
              <span className="forge-chip forge-chip--neutral">Layer 2 Workspace</span>
              <span className={`forge-chip ${source === 'live' ? 'forge-chip--success' : 'forge-chip--warn'}`}>
                {source === 'live' ? 'Live metrics' : 'Snapshot-backed'}
              </span>
            </div>
          </header>

          {sourceDisclosure && (
            <div data-testid="forge-source-disclosure" role="status" className="forge-workspace__notice forge-workspace__notice--warn">
              {sourceDisclosure}
            </div>
          )}
          {loading && !stats && (
            <div data-testid="forge-loading" role="status" className="forge-workspace__notice">
              Loading county metrics…
            </div>
          )}
          {error && (
            <div data-testid="forge-error" role="alert" className="forge-workspace__notice forge-workspace__notice--error">
              {error}
            </div>
          )}

          <section data-testid="forge-stats" className="forge-kpi-grid">
            {kpiMetrics.map(({ label, value, tone }) => (
              <div key={label} className="forge-kpi-cell">
                <div className="forge-kpi-cell__label">{label}</div>
                <div className={`forge-kpi-cell__value forge-kpi-cell__value--${tone}`}>{value}</div>
              </div>
            ))}
          </section>

          <section className="forge-panel" data-testid="forge-primary-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Primary Applications</p>
                <h2 className="forge-panel__title">County-wide valuation scenes</h2>
              </div>
            </div>
            <div className="forge-primary-grid">
              {PRIMARY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--primary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={mod.truthState === 'queued'}
                >
                  <div className="forge-card__rail">
                    {mod.chipLabel && <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>}
                    <span className="forge-card__foot">{getLaunchLabel(mod)}</span>
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="forge-panel" data-testid="forge-secondary-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Specialist Applications</p>
                <h2 className="forge-panel__title">Supporting analytics and batch operations</h2>
              </div>
            </div>
            <div className="forge-secondary-grid">
              {SECONDARY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--secondary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={mod.truthState === 'queued'}
                >
                  <div className="forge-card__rail">
                    {mod.chipLabel && <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>}
                    {mod.truthState === 'queued' && <span className="forge-chip forge-chip--warn">Queued</span>}
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                  <div className="forge-card__foot">{getLaunchLabel(mod)}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Slice 1.4 — county-wide sale qualification queue */}
          <SaleQualificationQueue />

          {/* Slice 1.6 — qualified comps pool browser */}
          <CompsPoolBrowser />


          <section className="forge-panel" data-testid="forge-queue">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Operational Queue</p>
                <h2 className="forge-panel__title">Recent parcels</h2>
              </div>
            </div>

            {recentParcels.length === 0 ? (
              <div className="forge-queue forge-queue--empty">No recent parcel activity.</div>
            ) : (
              <div className="forge-queue">
                {recentParcels.slice(0, 8).map((parcel) => (
                  <button
                    key={parcel.parcelId}
                    type="button"
                    className="forge-queue__row"
                    onClick={() => handleParcelOpen(parcel.parcelId)}
                  >
                    <div className="forge-queue__identity">
                      <div className="forge-queue__address">{parcel.address}</div>
                      <div className="forge-queue__meta">
                        {parcel.parcelId} · {parcel.city}
                      </div>
                    </div>
                    <div className="forge-queue__value">{fmtCurrency(parcel.totalAssessedValue)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

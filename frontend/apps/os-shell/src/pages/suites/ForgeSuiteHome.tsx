import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { useCountyStats } from '../../hooks/useCountyStats';
import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';
import { SaleQualificationQueue } from './SaleQualificationQueue';
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
      'Benton County Cost Approach — replacement cost, depreciation, and RCNLD (sample analytics — not county-runtime truth)',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'costforge',
    chipLabel: 'County-wide valuation',
  },
  {
    id: 'statistics-studio',
    label: 'Statistics Studio',
    description: 'Ratio studies, COD/PRD/PRB & IAAO statistical diagnostics',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'statistics-studio',
    chipLabel: 'IAAO diagnostics',
  },
  {
    id: 'batch-cost-run',
    label: 'Batch Cost Runs',
    description: 'County-wide cost model runs with strata, neighborhood, and class filters',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'batch-cost-run',
    chipLabel: 'Batch execution',
  },
] as const;

const SECONDARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'comps',
    label: 'CompsForge',
    description: 'Sales comparison with paired adjustments',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'forge',
    chipLabel: 'Parcel workbench',
  },
  {
    id: 'income-val',
    label: 'Income Valuation',
    description: 'Direct capitalization & GRM for commercial',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'forge',
    chipLabel: 'Parcel workbench',
  },
  {
    id: 'comparable-sales',
    label: 'Comparable Sales',
    description: 'Comp selection with paired sale adjustments',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'forge',
    chipLabel: 'Parcel workbench',
  },
  {
    id: 'reconcile',
    label: 'Reconciliation',
    description: 'Three-approach reconciliation and final value',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'forge',
    chipLabel: 'Parcel workbench',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    description: 'MRA regression models & IAAO compliance',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'regression-studio',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'terra-gama',
    label: 'TerraGAMA',
    description: 'Geographic Area Market Analysis',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'terra-gama',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    description: 'Current vs proposed coefficient comparison',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'coefficient-preview',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'appeal',
    label: 'Appeals',
    description: 'BOE appeal prep → routes through TerraDais',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'dais',
    chipLabel: 'Routes to Dais',
  },
  {
    id: 'audit',
    label: 'Value Audit',
    description: 'FISMA-compliant audit trail for changes',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'audit',
    chipLabel: 'Audit surface',
  },
  {
    id: 'governed',
    label: 'Governed Run',
    description: 'Governed run_valuation_model path',
    priority: 'secondary',
    launchMode: 'workbench',
    workbenchTab: 'forge',
    chipLabel: 'Parcel workbench',
  },
  {
    id: 'cost-manual',
    label: 'Cost Manual',
    description: 'Manual cost schedule — replacement cost tables, depreciation, and RCNLD inputs',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'cost-manual',
    chipLabel: 'Reference',
  },
  {
    id: 'value-audit-module',
    label: 'Value Audit Log',
    description:
      'Per-parcel value change audit log — FISMA-compliant history of all assessment changes',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'value-audit-module',
    chipLabel: 'Reference',
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
  const navigate = useNavigate();
  const { stats, loading, error, source } = useCountyStats();
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const recentParcels = usePropertyStore((s) => s.recentParcels);
  const sourceDisclosure = getSourceDisclosure(source);

  const kpiMetrics = [
    { label: 'TOTAL PARCELS', value: fmtNum(stats?.totalParcels), tone: 'neutral' },
    { label: 'AVG ASSESSED', value: fmtCurrency(stats?.averageAssessedValue), tone: 'neutral' },
    { label: 'ASSESSED THIS YEAR', value: fmtNum(stats?.assessedThisYear), tone: 'neutral' },
    { label: 'PENDING', value: fmtNum(stats?.pendingAssessments), tone: 'warn' },
    {
      label: 'COMPLETION',
      value: stats ? `${(stats.assessmentCompletionPercent ?? 0).toFixed(1)}%` : '—',
      tone: 'success',
    },
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
      if (parcelId) {
        navigate(`/property/${parcelId}/${mod.workbenchTab}`);
      } else {
        navigate(`/property?openTab=${mod.workbenchTab}`);
      }
      return;
    }

    const targetId = mod.moduleId ?? mod.id;
    void activateModule(targetId, { source: 'system' });
    navigate('/');
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
                <h2 className="forge-panel__title">Parcel adapters, references, and planned scenes</h2>
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

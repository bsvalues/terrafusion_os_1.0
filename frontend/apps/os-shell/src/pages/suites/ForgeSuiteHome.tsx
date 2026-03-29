/**
 * TerraForge Suite Home -- Property Valuation & Cost Analysis
 * ===================================================================
 * Constitutional Suite: forge (Article I)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Layout:
 *   KPI Hero Band    — 5 large monospaced county-wide metrics
 *   Header           — Suite identity (no back arrow — suite IS the home)
 *   Primary tools    — 3 large hero cards (CostForge, Stats Studio, Batch Runs)
 *   Secondary tools  — compact grid of specialist modules
 *   Operational Queue — recent parcel activity
 *
 * Does NOT host parcel execution — that lives in the Property Workbench.
 */

import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
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
  // ── PRIMARY: Tools used every assessment cycle ──
  {
    id: 'costforge',
    label: 'CostForge',
    icon: Calculator,
    description: 'Benton County Cost Approach — replacement cost, depreciation, and RCNLD (sample analytics — not county-runtime truth)',
    launchMode: 'standalone',
    moduleId: 'costforge',
    priority: 'primary',
    telemetryLabel: 'Parcel valuation',
  },
  {
    id: 'statistics-studio',
    label: 'Statistics Studio',
    icon: PieChart,
    description: 'Ratio studies, COD/PRD/PRB & IAAO statistical diagnostics',
    launchMode: 'standalone',
    moduleId: 'statistics-studio',
    priority: 'primary',
    telemetryLabel: 'COD · PRD · PRB',
  },
  {
    id: 'batch-cost-run',
    label: 'Batch Cost Runs',
    icon: TrendingUp,
    description: 'County-wide cost model runs with strata, neighborhood, and class filters',
    launchMode: 'standalone',
    moduleId: 'batch-cost-run',
    priority: 'primary',
    telemetryLabel: 'County-wide',
  },

  // ── SECONDARY: Specialist and supporting tools ──
  {
    id: 'comps',
    label: 'CompsForge',
    icon: BarChart3,
    description: 'Sales comparison with paired adjustments',
    launchMode: 'workbench',
    workbenchTab: 'forge',
  },
  {
    id: 'income-val',
    label: 'Income Valuation',
    icon: DollarSign,
    description: 'Direct capitalization & GRM for commercial',
    launchMode: 'workbench',
    workbenchTab: 'forge',
  },
  {
    id: 'comparable-sales',
    label: 'Comparable Sales',
    icon: Search,
    description: 'Comp selection with paired sale adjustments',
    launchMode: 'workbench',
    workbenchTab: 'forge',
  },
  {
    id: 'reconcile',
    label: 'Reconciliation',
    icon: Scale,
    description: 'Three-approach reconciliation and final value',
    launchMode: 'workbench',
    workbenchTab: 'forge',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    icon: LineChart,
    description: 'MRA regression models & IAAO compliance',
    launchMode: 'standalone',
    moduleId: 'regression-studio',
    truthState: 'queued',
  },
  {
    id: 'terra-gama',
    label: 'TerraGAMA',
    icon: MapPin,
    description: 'Geographic Area Market Analysis',
    launchMode: 'standalone',
    moduleId: 'terra-gama',
    truthState: 'queued',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    icon: Scale,
    description: 'Current vs proposed coefficient comparison',
    launchMode: 'standalone',
    moduleId: 'coefficient-preview',
    truthState: 'queued',
  },
  {
    id: 'appeal',
    label: 'Appeals',
    icon: Gavel,
    description: 'BOE appeal prep → routes through TerraDais',
    launchMode: 'workbench',
    workbenchTab: 'dais',
  },
  {
    id: 'audit',
    label: 'Value Audit',
    icon: FileSearch,
    description: 'FISMA-compliant audit trail for changes',
    launchMode: 'workbench',
    workbenchTab: 'audit',
  },
  {
    id: 'governed',
    label: 'Governed Run',
    icon: ShieldCheck,
    description: 'Governed run_valuation_model path',
    launchMode: 'workbench',
    workbenchTab: 'forge',
  },
  {
    id: 'cost-manual',
    label: 'Cost Manual',
    icon: Hammer,
    description: 'Manual cost schedule — replacement cost tables, depreciation, and RCNLD inputs',
    launchMode: 'standalone',
    moduleId: 'cost-manual',
  },
  {
    id: 'value-audit-module',
    label: 'Value Audit Log',
    icon: FileSearch,
    description: 'Per-parcel value change audit log — FISMA-compliant history of all assessment changes',
    launchMode: 'standalone',
    moduleId: 'value-audit-module',
  },
];

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

export default function ForgeSuiteHome() {
  const navigate = useNavigate();
  const { stats, loading, error, source } = useCountyStats();
  const sourceDisclosure = getSourceDisclosure(source);

  const KPI_METRICS = stats
    ? [
        { label: 'TOTAL PARCELS', value: fmtNum(stats.totalParcels), accent: false },
        { label: 'AVG ASSESSED', value: fmtCurrency(stats.averageAssessedValue), accent: false },
        { label: 'ASSESSED THIS YEAR', value: fmtNum(stats.assessedThisYear), accent: false },
        { label: 'PENDING', value: fmtNum(stats.pendingAssessments), accent: true },
        { label: 'COMPLETION', value: `${(stats.assessmentCompletionPercent ?? 0).toFixed(1)}%`, accent: false },
      ]
    : [];

  return (
    <div data-testid="suite-forge-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Parcel Context Banner — shows when parcel is active */}
      <ParcelContextBanner suiteTabId="forge" />

      {/* Source disclosure — only when not live */}
      {stats && sourceDisclosure && (
        <div
          data-testid="forge-source-disclosure"
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

      {/* ── KPI Hero Band ── */}
      {loading && !stats && (
        <div data-testid="forge-loading" role="status" className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
          Loading county metrics…
        </div>
      )}
      {error && (
        <div data-testid="forge-error" role="alert" className="px-6 py-2 text-xs" style={{ color: 'hsl(var(--tf-suite-forge))' }}>
          {error}
        </div>
      )}
      {stats && (
        <div
          data-testid="forge-stats"
          className="shrink-0 grid px-6 py-5"
          style={{
            gridTemplateColumns: `repeat(${KPI_METRICS.length}, 1fr)`,
            gap: '1.5rem',
            borderBottom: '1px solid hsl(var(--tf-border) / 0.15)',
            background: 'hsl(var(--tf-card-bg) / 0.35)',
          }}
        >
          {KPI_METRICS.map(({ label, value, accent }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span
                className="text-[9px] font-semibold tracking-widest uppercase"
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                {label}
              </span>
              <span
                className="text-[1.625rem] font-mono font-bold tabular-nums leading-none"
                style={{
                  color: accent
                    ? 'hsl(var(--tf-suite-forge))'
                    : 'hsl(var(--tf-fg))',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Suite Header ── */}
      <header
        className="shrink-0 backdrop-blur-xl"
        style={{
          borderBottom: '1px solid hsl(var(--tf-border) / 0.12)',
          background: 'hsl(var(--tf-card-bg) / 0.4)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: 'hsl(var(--tf-suite-forge) / 0.15)' }}
          >
            <Hammer size={22} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight" style={{ color: 'hsl(var(--tf-fg))' }}>
              TerraForge
            </h1>
            <p className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
              Property Valuation & Cost Analysis Engine
            </p>
          </div>
        </div>
      </header>

      {/* ── Module Grid + Operational Queue ── */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div data-testid="forge-modules">
          <SuiteModuleGrid modules={FORGE_MODULES} accentVar="--tf-suite-forge" />
        </div>
        <div data-testid="forge-queue">
          <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-forge" emptyMessage="No recent parcel activity" />
        </div>
      </main>
    </div>
  );
}

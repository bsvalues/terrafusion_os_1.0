/**
 * PropertyForge.tsx
 *
 * Phase 1: Forge sub-tab switcher.
 * Refactored from 1,035-line monolith to ~190-line sub-tab router.
 *
 * Sub-tabs:
 *   Overview     — valuation summary cards + governed AI tools
 *   Cost         — cost approach model inputs
 *   Sales        — ComparableSalesPanel + comp rationale tool
 *   Income       — IncomeValuationPanel + income valuation tool
 *
 * Architecture:
 *   - All sub-tabs stay mounted (CSS display:none) to preserve state
 *   - Shared state: taxYear, history records
 *   - Each sub-tab owns its own tool invocation state
 *   - onValueIndicated callback lets sub-tabs report values to overview
 *
 * Constitutional compliance (Doc 0D):
 *   - Does not change suite names or tab order
 *   - Does not bypass write-lane ownership (all tools are Forge-domain)
 *   - Does not modify suiteRegistry.ts governance
 *   - Workbench launch behavior unchanged
 */

import React, { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import {
  ParcelContextHeader,
  WorkbenchSourceBadge,
  type InvocationRecord,
} from '../../../components/workbench';
import { useCostApproach, useParcelYears } from '../../../hooks/forge/useForgeValuation';
import { ForgeOverview } from './forge/ForgeOverview';
import { CostApproach } from './forge/CostApproach';
import { SalesComparison } from './forge/SalesComparison';
import { IncomeApproach } from './forge/IncomeApproach';
import { Reconciliation } from './forge/Reconciliation';
import { ForgeYearSelector } from './forge/ForgeYearSelector';
import { ForgeYearContextPanel } from './forge/ForgeYearContextPanel';
import { CURRENT_YEAR } from './forge/types';
import { SketchModule } from '../../../components/sketch';
import { addObservation } from '../../../services/fieldStoreV2';
import type { FieldObservation } from '../../../types/field';

/* ── Sub-tab definitions ────────────────────────────────── */

type ForgeSubTab = 'overview' | 'cost' | 'sales' | 'income' | 'reconcile' | 'sketch';

const SUB_TABS: { id: ForgeSubTab; label: string; icon: string }[] = [
  { id: 'overview',   label: 'Overview',       icon: '🔥' },
  { id: 'cost',       label: 'Cost',           icon: '🏗️' },
  { id: 'sales',      label: 'Sales',          icon: '🏘️' },
  { id: 'income',     label: 'Income',         icon: '💰' },
  { id: 'reconcile',  label: 'Reconciliation', icon: '⚖️' },
  { id: 'sketch',     label: 'Sketch',         icon: '📐' },
];

const FORGE_SUB_TABS = new Set<ForgeSubTab>(SUB_TABS.map((tab) => tab.id));

function readInitialSubTab(search: string, state: unknown): ForgeSubTab {
  const params = new URLSearchParams(search);
  const queryHint = params.get('tab') ?? params.get('subTab') ?? params.get('initialSubTab');
  if (queryHint && FORGE_SUB_TABS.has(queryHint as ForgeSubTab)) {
    return queryHint as ForgeSubTab;
  }

  if (state && typeof state === 'object') {
    const launchState = state as Record<string, unknown>;
    const rawSubTab = launchState.initialSubTab ?? launchState.subTab ?? launchState.tab;
    if (typeof rawSubTab === 'string' && FORGE_SUB_TABS.has(rawSubTab as ForgeSubTab)) {
      return rawSubTab as ForgeSubTab;
    }

    if (launchState.moduleId === 'comparable-sales') {
      return 'sales';
    }
  }

  return 'overview';
}

/* ── PropertyForge ──────────────────────────────────────── */

export const PropertyForge: React.FC = () => {
  const location = useLocation();
  const { parcelId } = useWorkbenchTab();

  /* Probe the cost endpoint to determine if the Forge API is reachable */
  const forgeProbe = useCostApproach(parcelId, CURRENT_YEAR);

  /* PACS year layers for this parcel */
  const parcelYears = useParcelYears(parcelId);

  /* Shared state */
  const [activeSubTab, setActiveSubTab] = useState<ForgeSubTab>(() =>
    readInitialSubTab(location.search, location.state)
  );
  const [taxYear, setTaxYear] = useState<number>(CURRENT_YEAR);
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  /* Find the layer object matching the currently selected year */
  const selectedLayer = parcelYears.data?.layers.find((l) => l.year === taxYear);

  /** Append a tool invocation record (called by all sub-tabs) */
  const addHistoryRecord = useCallback((record: InvocationRecord) => {
    setHistory((prev) => [record, ...prev.slice(0, 19)]);
  }, []);

  /** Called when a sub-tab produces an indicated value */
  const handleValueIndicated = useCallback((approach: string, value: number) => {
    // Future: update overview summary cards with approach-specific indicated values
  }, []);

  return (
    <div className="tf-suite-forge space-y-4" data-testid="property-forge-tab">
      {/* Header */}
      <ParcelContextHeader
        icon="🔥"
        title="TerraForge"
        parcelId={parcelId}
        subtitle={`Governed valuation tools requested via Forge for ${parcelId}`}
      />

      {/* PACS Year Selector */}
      <ForgeYearSelector
        parcelId={parcelId}
        taxYear={taxYear}
        onTaxYearChange={setTaxYear}
      />

      {/* Year context panel — shows lock state, programs, AV/MV for selected year */}
      <ForgeYearContextPanel layer={selectedLayer} taxYear={taxYear} />

      <div className="tf-status-info rounded-xl p-4" data-testid="forge-baseline-disclosure">
        <div className="flex items-start justify-between gap-3">
          <p className="tf-text">
            Overview baseline values reflect the parcel snapshot already loaded in the workbench.
            Changing Tax Year here changes the governed tool requests below; it does not relabel those baseline cards until a tool result is returned from the selected tool.
          </p>
          <WorkbenchSourceBadge source={forgeProbe.source} className="shrink-0" />
        </div>
      </div>

      {/* Sub-Tab Bar */}
      <nav
        className="flex gap-1 border-b tf-border pb-0"
        role="tablist"
        aria-label="Forge approach tabs"
      >
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            aria-controls={`forge-panel-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg
              transition-all border-b-2
              ${activeSubTab === tab.id
                ? 'tf-suite-accent-text border-current'
                : 'tf-text-tertiary border-transparent hover:tf-text-secondary hover:border-current/30'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Sub-Tab Panels — all stay mounted, CSS hidden preserves state */}
      <div
        id="forge-panel-overview"
        role="tabpanel"
        aria-labelledby="forge-tab-overview"
        style={{ display: activeSubTab === 'overview' ? 'block' : 'none' }}
      >
        <ForgeOverview
          taxYear={taxYear}
          onHistoryRecord={addHistoryRecord}
          onValueIndicated={handleValueIndicated}
          history={history}
        />
      </div>

      <div
        id="forge-panel-cost"
        role="tabpanel"
        aria-labelledby="forge-tab-cost"
        style={{ display: activeSubTab === 'cost' ? 'block' : 'none' }}
      >
        {forgeProbe.loading ? (
          <div
            role="status"
            aria-label="Loading cost data"
            className="flex items-center gap-3 py-8 px-4"
          >
            <div className="tf-spinner h-6 w-6 flex-shrink-0" />
            <span style={{ color: 'hsl(var(--tf-text) / 0.5)' }} className="text-sm">
              Loading cost approach data…
            </span>
          </div>
        ) : (
          <CostApproach
            taxYear={taxYear}
            onHistoryRecord={addHistoryRecord}
            onValueIndicated={handleValueIndicated}
          />
        )}
      </div>

      <div
        id="forge-panel-sales"
        role="tabpanel"
        aria-labelledby="forge-tab-sales"
        style={{ display: activeSubTab === 'sales' ? 'block' : 'none' }}
      >
        {forgeProbe.loading ? (
          <div
            role="status"
            aria-label="Loading sales data"
            className="flex items-center gap-3 py-8 px-4"
          >
            <div className="tf-spinner h-6 w-6 flex-shrink-0" />
            <span style={{ color: 'hsl(var(--tf-text) / 0.5)' }} className="text-sm">
              Loading sales comparison data…
            </span>
          </div>
        ) : (
          <SalesComparison
            taxYear={taxYear}
            onHistoryRecord={addHistoryRecord}
            onValueIndicated={handleValueIndicated}
          />
        )}
      </div>

      <div
        id="forge-panel-income"
        role="tabpanel"
        aria-labelledby="forge-tab-income"
        style={{ display: activeSubTab === 'income' ? 'block' : 'none' }}
      >
        <IncomeApproach
          taxYear={taxYear}
          onHistoryRecord={addHistoryRecord}
          onValueIndicated={handleValueIndicated}
        />
      </div>

      <div
        id="forge-panel-reconcile"
        role="tabpanel"
        aria-labelledby="forge-tab-reconcile"
        style={{ display: activeSubTab === 'reconcile' ? 'block' : 'none' }}
      >
        <Reconciliation
          taxYear={taxYear}
          onHistoryRecord={addHistoryRecord}
          onValueIndicated={handleValueIndicated}
        />
      </div>

      <div
        id="forge-panel-sketch"
        role="tabpanel"
        aria-labelledby="forge-tab-sketch"
        style={{ display: activeSubTab === 'sketch' ? 'block' : 'none' }}
      >
        <SketchModule
          parcelId={parcelId}
          taxYear={taxYear}
          onSaveObservation={async (obs: Omit<FieldObservation, 'id' | 'syncStatus'>) => {
            await addObservation(obs);
          }}
        />
      </div>
    </div>
  );
};

export default PropertyForge;

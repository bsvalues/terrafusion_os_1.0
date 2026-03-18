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
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import {
  ParcelContextHeader,
  type InvocationRecord,
} from '../../../components/workbench';
import { ForgeOverview } from './forge/ForgeOverview';
import { CostApproach } from './forge/CostApproach';
import { SalesComparison } from './forge/SalesComparison';
import { IncomeApproach } from './forge/IncomeApproach';
import { Reconciliation } from './forge/Reconciliation';
import { CURRENT_YEAR, TAX_YEARS } from './forge/types';

/* ── Sub-tab definitions ────────────────────────────────── */

type ForgeSubTab = 'overview' | 'cost' | 'sales' | 'income' | 'reconcile';

const SUB_TABS: { id: ForgeSubTab; label: string; icon: string }[] = [
  { id: 'overview',   label: 'Overview',       icon: '\uD83D\uDD25' },
  { id: 'cost',       label: 'Cost',           icon: '\uD83C\uDFD7\uFE0F' },
  { id: 'sales',      label: 'Sales',          icon: '\uD83C\uDFD8\uFE0F' },
  { id: 'income',     label: 'Income',         icon: '\uD83D\uDCB0' },
  { id: 'reconcile',  label: 'Reconciliation', icon: '\u2696\uFE0F' },
];

/* ── PropertyForge ──────────────────────────────────────── */

export const PropertyForge: React.FC = () => {
  const { parcelId } = useWorkbenchTab();

  /* Shared state */
  const [activeSubTab, setActiveSubTab] = useState<ForgeSubTab>('overview');
  const [taxYear, setTaxYear] = useState<number>(CURRENT_YEAR);
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  /** Append a tool invocation record (called by all sub-tabs) */
  const addHistoryRecord = useCallback((record: InvocationRecord) => {
    setHistory((prev) => [record, ...prev.slice(0, 19)]);
  }, []);

  /** Called when a sub-tab produces an indicated value */
  const handleValueIndicated = useCallback((approach: string, value: number) => {
    // Future: update overview summary cards with approach-specific indicated values
    console.debug(`[Forge] Value indicated: ${approach} = $${value.toLocaleString()}`);
  }, []);

  return (
    <div className="tf-suite-forge space-y-4" data-testid="property-forge-tab">
      {/* Header */}
      <ParcelContextHeader
        icon="\uD83D\uDD25"
        title="TerraForge"
        parcelId={parcelId}
        subtitle={`AI-powered valuation analysis for ${parcelId}`}
      />

      {/* Shared Tax Year Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="forge-tax-year" className="tf-text-secondary text-sm whitespace-nowrap">
          Tax Year
        </label>
        <select
          id="forge-tax-year"
          value={taxYear}
          onChange={(e) => setTaxYear(Number(e.target.value))}
          className="tf-input px-3 py-1.5 text-sm"
        >
          {TAX_YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
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
        <CostApproach
          taxYear={taxYear}
          onHistoryRecord={addHistoryRecord}
          onValueIndicated={handleValueIndicated}
        />
      </div>

      <div
        id="forge-panel-sales"
        role="tabpanel"
        aria-labelledby="forge-tab-sales"
        style={{ display: activeSubTab === 'sales' ? 'block' : 'none' }}
      >
        <SalesComparison
          taxYear={taxYear}
          onHistoryRecord={addHistoryRecord}
          onValueIndicated={handleValueIndicated}
        />
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
    </div>
  );
};

export default PropertyForge;

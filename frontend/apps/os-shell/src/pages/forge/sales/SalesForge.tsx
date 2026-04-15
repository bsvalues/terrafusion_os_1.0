/**
 * SalesForge — Flagship Sale Qualification & Ratio Audit module.
 * Full standalone OS window. Five tabs, live IAAO stats, deep PACS audit.
 *
 * Architecture: Statistics Studio pattern (React module, not AppFrame iframe).
 * Data: All real PACS via .NET API — no fixtures, no mock data.
 */

import { lazy, Suspense } from 'react';
import { useSalesForgeStore } from './salesForgeStore';
import { RunningStatsPanel } from './components/RunningStatsPanel';
import type { SalesForgeTab } from './salesForgeTypes';
import './SalesForge.css';

const QualificationQueuePanel = lazy(() =>
  import('./panels/QualificationQueuePanel').then((m) => ({ default: m.QualificationQueuePanel }))
);
const RatioAuditPanel = lazy(() =>
  import('./panels/RatioAuditPanel').then((m) => ({ default: m.RatioAuditPanel }))
);
const NeighborhoodViewPanel = lazy(() =>
  import('./panels/NeighborhoodViewPanel').then((m) => ({ default: m.NeighborhoodViewPanel }))
);
const CodeAuditPanel = lazy(() =>
  import('./panels/CodeAuditPanel').then((m) => ({ default: m.CodeAuditPanel }))
);
const DorExportPanel = lazy(() =>
  import('./panels/DorExportPanel').then((m) => ({ default: m.DorExportPanel }))
);

const TABS: { id: SalesForgeTab; label: string; title: string }[] = [
  { id: 'queue',         label: 'Queue',          title: 'Sale qualification queue — make decisions' },
  { id: 'ratio-audit',  label: 'Ratio Audit',     title: 'All qualified sales sorted by ratio, outlier flags' },
  { id: 'neighborhoods', label: 'Neighborhoods',  title: 'Hood-level COD/PRD equity view' },
  { id: 'code-audit',   label: 'Code Audit',      title: 'WAC code breakdown — qualifier, ratio type, exclude calc' },
  { id: 'dor-export',   label: 'DOR Export',      title: 'Preview and download DOR-certified CSV' },
];

function TabSpinner() {
  return <div className="sf-state" role="status">Loading…</div>;
}

export default function SalesForge() {
  const activeTab  = useSalesForgeStore((s) => s.activeTab);
  const setActiveTab = useSalesForgeStore((s) => s.setActiveTab);
  const taxYear    = useSalesForgeStore((s) => s.taxYear);

  return (
    <div className="sf-workspace">
      {/* Header */}
      <header className="sf-header">
        <div className="sf-header__row">
          <div>
            <p className="sf-header__eyebrow">TerraForge · Sale Qualification</p>
            <h1 className="sf-header__title">SalesForge</h1>
          </div>
          <div className="sf-header__badges">
            <span className="forge-chip forge-chip--neutral">{taxYear} study year</span>
            <span className="forge-chip forge-chip--success">Live county data</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="sf-tabbar" aria-label="SalesForge sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`sf-tab ${activeTab === tab.id ? 'sf-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main layout: content + stats rail */}
      <div className="sf-layout">
        {/* Left: panel content */}
        <Suspense fallback={<TabSpinner />}>
          {activeTab === 'queue'         && <QualificationQueuePanel />}
          {activeTab === 'ratio-audit'   && <RatioAuditPanel />}
          {activeTab === 'neighborhoods' && <NeighborhoodViewPanel />}
          {activeTab === 'code-audit'    && <CodeAuditPanel />}
          {activeTab === 'dor-export'    && <DorExportPanel />}
        </Suspense>

        {/* Right: live IAAO stats rail */}
        <RunningStatsPanel />
      </div>
    </div>
  );
}

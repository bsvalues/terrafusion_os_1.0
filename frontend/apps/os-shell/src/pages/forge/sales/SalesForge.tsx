/**
 * SalesForge — Flagship Sale Qualification & Ratio Audit module.
 * Full standalone OS window. Five tabs, live IAAO stats, deep source-code audit.
 *
 * Architecture: Statistics Studio pattern (React module, not AppFrame iframe).
 * Data: TerraFusion sale truth via .NET API or the governed Washington launch data package.
 *
 * Task D2 — receives County Studio Inspector deeplinks via window metadata.
 * Supported metadata keys (all optional):
 *   deeplinkQuery: '?stratum=R&year=2026&segmentId=s1'  — raw query from the
 *                  backend action-context endpoint; parsed for redundancy with
 *                  the already-split values below.
 *   stratumKey:    string  — pre-split stratum; selects AI AUDIT stratum list row.
 *   taxYear:       number  — pre-split tax year; swaps the study year filter.
 *   segmentId:     string  — drives the "Scoped From · Segment X" chip.
 *   segmentLabel:  string  — human label for the chip (optional).
 * When stratumKey is present we also switch the active tab to "ai-audit"
 * (that panel is where stratum selection becomes visible).
 */

import { lazy, Suspense, useLayoutEffect } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { useSalesForgeStore } from './salesForgeStore';
import { RunningStatsPanel } from './components/RunningStatsPanel';
import type { SalesForgeTab } from './salesForgeTypes';
import { isWashingtonLaunchDataEnabled, WASHINGTON_COUNTIES } from './washingtonLaunchApi';
import { parseRollupHandoff } from '../shared/rollupHandoff';
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
const AuditCommandCenter = lazy(() =>
  import('./audit/AuditCommandCenter').then((m) => ({ default: m.AuditCommandCenter }))
);

const TABS: { id: SalesForgeTab; label: string; title: string }[] = [
  { id: 'ai-audit',      label: 'AI Audit',       title: 'AI-powered audit — diagnose, qualify, propose adjustments' },
  { id: 'queue',         label: 'Queue',          title: 'Sale qualification queue — make decisions' },
  { id: 'ratio-audit',  label: 'Ratio Audit',     title: 'All qualified sales sorted by ratio, outlier flags' },
  { id: 'neighborhoods', label: 'Neighborhoods',  title: 'Hood-level COD/PRD equity view' },
  { id: 'code-audit',   label: 'Code Audit',      title: 'WAC code breakdown — qualifier, ratio type, exclude calc' },
  { id: 'dor-export',   label: 'DOR Export',      title: 'Preview and download DOR-certified CSV' },
];

function TabSpinner() {
  return <div className="sf-state" role="status">Loading…</div>;
}

export interface SalesForgeProps {
  /**
   * Optional metadata from the shell's window system. Carries the County
   * Studio Inspector handoff payload (stratum / year / segmentId / label).
   */
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort parse of the backend deeplinkQuery when pre-split metadata is
 * missing. Tolerates the leading '?' and missing keys. Only returns fields
 * we actually understand — everything else is dropped.
 */
function parseDeeplinkQuery(raw: unknown): {
  stratum?: string;
  year?: number;
  segmentId?: string;
} {
  if (typeof raw !== 'string' || raw.length === 0) return {};
  try {
    const trimmed = raw.startsWith('?') ? raw.slice(1) : raw;
    const params = new URLSearchParams(trimmed);
    const out: { stratum?: string; year?: number; segmentId?: string } = {};
    const stratum = params.get('stratum');
    if (stratum) out.stratum = stratum;
    const yearStr = params.get('year');
    if (yearStr) {
      const n = Number(yearStr);
      if (Number.isFinite(n)) out.year = n;
    }
    const segmentId = params.get('segmentId');
    if (segmentId) out.segmentId = segmentId;
    return out;
  } catch {
    return {};
  }
}

export default function SalesForge({ metadata }: SalesForgeProps = {}) {
  const activeTab         = useSalesForgeStore((s) => s.activeTab);
  const setActiveTab      = useSalesForgeStore((s) => s.setActiveTab);
  const taxYear           = useSalesForgeStore((s) => s.taxYear);
  const setTaxYear        = useSalesForgeStore((s) => s.setTaxYear);
  const setSelectedStratum = useSalesForgeStore((s) => s.setSelectedStratumKey);
  const setContextSegment = useSalesForgeStore((s) => s.setContextSegment);
  const applyCountyStudioScope = useSalesForgeStore((s) => s.applyCountyStudioScope);
  const contextSegmentId    = useSalesForgeStore((s) => s.contextSegmentId);
  const contextSegmentLabel = useSalesForgeStore((s) => s.contextSegmentLabel);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const launchDataMode = isWashingtonLaunchDataEnabled();
  const handoff = parseRollupHandoff(metadata);
  const selectedCounty = WASHINGTON_COUNTIES.find((county) => county.code === committedFilters.countyCode);

  // ── Consume County Studio handoff metadata before child fetch effects ───
  useLayoutEffect(() => {
    if (!metadata) return;
    const parsed = parseDeeplinkQuery(metadata.deeplinkQuery);
    const stratum = handoff.stratumKey ?? parsed.stratum ?? null;
    const year = handoff.taxYear ?? parsed.year ?? null;
    const segmentId = handoff.segmentId ?? parsed.segmentId ?? null;
    const label = handoff.segmentLabel;

    if (handoff.countyCode) {
      applyCountyStudioScope(
        handoff.countyCode,
        handoff.rollupScope === 'neighborhood' ? handoff.neighborhoodCode : null,
      );
    }

    if (stratum) {
      setSelectedStratum(stratum);
      setActiveTab('ai-audit');
    } else if (handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode) {
      setActiveTab('neighborhoods');
    } else if (handoff.rollupScope === 'city') {
      setActiveTab('queue');
    }
    if (year !== null) {
      setTaxYear(year);
    }
    if (segmentId) {
      setContextSegment(segmentId, label);
    }
  }, [
    applyCountyStudioScope,
    handoff.countyCode,
    handoff.neighborhoodCode,
    handoff.rollupScope,
    handoff.segmentId,
    handoff.segmentLabel,
    handoff.stratumKey,
    handoff.taxYear,
    metadata,
    setActiveTab,
    setContextSegment,
    setSelectedStratum,
    setTaxYear,
  ]);

  const handleBackToCountyStudio = () => {
    // Re-open County Studio via the canonical activation pipeline so the
    // chip lands on the existing window (focus) or opens a fresh one.
    void activateModule('county-studio', {
      source: 'system',
      metadata: contextSegmentId ? { segmentId: contextSegmentId } : undefined,
    });
  };

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
            {contextSegmentId && (
              <button
                type="button"
                data-testid="sf-scoped-from-chip"
                data-segment-id={contextSegmentId}
                onClick={handleBackToCountyStudio}
                title="Back to County Studio"
                style={{
                  background: 'hsl(var(--tf-suite-forge) / 0.12)',
                  border: '1px solid hsl(var(--tf-suite-forge) / 0.4)',
                  color: 'hsl(var(--tf-suite-forge))',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← From County Studio · Segment {contextSegmentLabel ?? contextSegmentId}
              </button>
            )}
            {handoff.rollupScope === 'city' && handoff.city && (
              <span className="forge-chip forge-chip--neutral">
                City overview · {handoff.city}
              </span>
            )}
            {handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode && (
              <span className="forge-chip forge-chip--neutral">
                Neighborhood · {handoff.neighborhoodName ?? handoff.neighborhoodCode}
                {handoff.revalArea !== null ? ` · Reval ${handoff.revalArea}` : ''}
              </span>
            )}
            <span className="forge-chip forge-chip--neutral">{taxYear} study year</span>
            <span className="forge-chip forge-chip--neutral">{selectedCounty?.name ?? handoff.countyName ?? 'County scope required'} County</span>
            <span className="forge-chip forge-chip--success">
              {launchDataMode ? 'Washington launch data package' : 'Live TerraFusion API'}
            </span>
          </div>
        </div>
        {handoff.rollupScope === 'city' && handoff.city && (
          <p className="sf-header__source-note">
            County Studio handed off a city overview for {handoff.city}. Counties actually qualify and defend sales by reval area and neighborhood, so city scope remains triage-only until you narrow below the city rollup.
          </p>
        )}
        {handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode && (
          <p className="sf-header__source-note">
            County Studio handed off neighborhood {handoff.neighborhoodName ?? handoff.neighborhoodCode}
            {handoff.revalArea !== null ? ` in reval ${handoff.revalArea}` : ''}. SalesForge is pinned to that county and neighborhood because counties track reval area and neighborhood before parcel-level action.
          </p>
        )}
        {launchDataMode && (
          <p className="sf-header__source-note">
            Hosted preview reads the Prometheus Washington data package: 39 counties, TerraFusion neighborhood codes, and provenance-bearing sale records.
          </p>
        )}
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
          {activeTab === 'ai-audit'      && <AuditCommandCenter taxYear={taxYear} />}
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

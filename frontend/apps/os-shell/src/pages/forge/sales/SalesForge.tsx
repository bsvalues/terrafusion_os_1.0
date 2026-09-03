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
 *   resetValuationScope: true — keep only county context and clear stale
 *                               neighborhood/stratum/segment state.
 *   launchContext: 'washington-counties-hub' with the public-reference trust
 *                  tier — preserve the handoff's explicit hosted or bundled
 *                  package posture without changing live-suite defaults.
 *   referencePackageSource: 'hosted' | 'repository-reference' — keep package
 *                           selection separate from the data-content posture.
 * When stratumKey is present we also switch the active tab to "ai-audit"
 * (that panel is where stratum selection becomes visible).
 */

import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import {
  resolveWashingtonCountyStatus,
  verifyWashingtonCountySalesShard,
} from '@/services/washingtonCountyLaunch';
import { useSalesForgeStore } from './salesForgeStore';
import { RunningStatsPanel } from './components/RunningStatsPanel';
import { SALESFORGE_TAX_YEAR, type SalesForgeTab } from './salesForgeTypes';
import {
  evictWashingtonLaunchCountyShard,
  isWashingtonLaunchDataEnabled,
  WASHINGTON_COUNTIES,
} from './washingtonLaunchApi';
import {
  getWashingtonSalesReviewCapability,
  parseWashingtonCountiesHubHandoff,
  type WashingtonCountiesHubHandoff,
} from './washingtonSalesReviewCapability';
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
  {
    id: 'ai-audit',
    label: 'AI Audit',
    title: 'AI-powered audit — diagnose, qualify, propose adjustments',
  },
  { id: 'queue', label: 'Queue', title: 'Sale qualification queue — make decisions' },
  {
    id: 'ratio-audit',
    label: 'Ratio Audit',
    title: 'All qualified sales sorted by ratio, outlier flags',
  },
  { id: 'neighborhoods', label: 'Neighborhoods', title: 'Hood-level COD/PRD equity view' },
  {
    id: 'code-audit',
    label: 'Code Audit',
    title: 'WAC code breakdown — qualifier, ratio type, exclude calc',
  },
  { id: 'dor-export', label: 'DOR Export', title: 'Preview and download DOR-certified CSV' },
];

const WASHINGTON_LAUNCH_TABS = new Set<SalesForgeTab>(['queue', 'neighborhoods', 'code-audit']);

const DIRECT_HOSTED_PACKAGE_VERIFICATION_TIMEOUT_MS = 15_000;

function TabSpinner() {
  return (
    <div className='sf-state' role='status'>
      Loading…
    </div>
  );
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

function verifiedReferenceTaxYear(latestSaleDate: string | null): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(latestSaleDate ?? '');
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? Math.min(year, SALESFORGE_TAX_YEAR)
    : null;
}

export default function SalesForge({ metadata }: SalesForgeProps = {}) {
  const setDataSource = useSalesForgeStore((s) => s.setDataSource);
  const activeTab = useSalesForgeStore((s) => s.activeTab);
  const setActiveTab = useSalesForgeStore((s) => s.setActiveTab);
  const taxYear = useSalesForgeStore((s) => s.taxYear);
  const setTaxYear = useSalesForgeStore((s) => s.setTaxYear);
  const setSelectedStratum = useSalesForgeStore((s) => s.setSelectedStratumKey);
  const setContextSegment = useSalesForgeStore((s) => s.setContextSegment);
  const applyCountyStudioScope = useSalesForgeStore((s) => s.applyCountyStudioScope);
  const contextSegmentId = useSalesForgeStore((s) => s.contextSegmentId);
  const contextSegmentLabel = useSalesForgeStore((s) => s.contextSegmentLabel);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const countiesHubHandoffRequested = metadata?.launchContext === 'washington-counties-hub';
  const countiesHubHandoff = useMemo(() => parseWashingtonCountiesHubHandoff(metadata), [metadata]);
  const invalidCountiesHubHandoff = countiesHubHandoffRequested && countiesHubHandoff === null;
  const referencePackageSource = countiesHubHandoff?.referencePackageSource;
  const repositoryReferenceHandoff = referencePackageSource === 'repository-reference';
  const hostedReferenceHandoff = countiesHubHandoff !== null && referencePackageSource === 'hosted';
  const hostedHandoffCountyCode = hostedReferenceHandoff
    ? (countiesHubHandoff?.countyCode ?? null)
    : null;
  const directHostedLaunch = isWashingtonLaunchDataEnabled() && !countiesHubHandoffRequested;
  const [establishedHostedHandoffCountyCode, setEstablishedHostedHandoffCountyCode] = useState<
    string | null
  >(null);
  const [directHostedVerification, setDirectHostedVerification] = useState<{
    countyCode: string | null;
    request: WashingtonCountiesHubHandoff | null;
    state: 'not-required' | 'pending' | 'available' | 'unavailable';
    taxYear: number | null;
  }>({
    countyCode: directHostedLaunch ? committedFilters.countyCode : null,
    request: null,
    state: directHostedLaunch ? 'pending' : 'not-required',
    taxYear: null,
  });
  const [directHostedVerificationAttempt, setDirectHostedVerificationAttempt] = useState(0);
  const syntheticReferenceData =
    countiesHubHandoff?.referenceDataPosture === 'repository_reference_demo';
  const hostedHandoffInitializationPending =
    hostedReferenceHandoff && establishedHostedHandoffCountyCode !== hostedHandoffCountyCode;
  const hostedHandoffVerificationRequired =
    hostedReferenceHandoff && countiesHubHandoff?.salesReviewAvailability !== 'unavailable';
  const hostedVerificationCountyCode = directHostedLaunch
    ? committedFilters.countyCode
    : hostedHandoffVerificationRequired
      ? hostedHandoffInitializationPending
        ? hostedHandoffCountyCode
        : committedFilters.countyCode
      : null;
  const hostedCountyVerificationRequired = hostedVerificationCountyCode !== null;
  const hostedVerificationRequest = hostedHandoffVerificationRequired ? countiesHubHandoff : null;
  const directHostedVerificationMatchesCounty =
    directHostedVerification.countyCode === hostedVerificationCountyCode;
  const directHostedVerificationMatchesRequest =
    directHostedVerification.request === hostedVerificationRequest;
  const directHostedVerificationPending =
    (hostedHandoffInitializationPending && hostedHandoffVerificationRequired) ||
    (hostedCountyVerificationRequired &&
      (!directHostedVerificationMatchesCounty ||
        !directHostedVerificationMatchesRequest ||
        (directHostedVerification.state !== 'available' &&
          directHostedVerification.state !== 'unavailable')));
  const directHostedVerificationUnavailable =
    hostedCountyVerificationRequired &&
    directHostedVerificationMatchesCounty &&
    directHostedVerificationMatchesRequest &&
    directHostedVerification.state === 'unavailable';
  const hostedLaunchReady =
    !hostedHandoffInitializationPending &&
    hostedCountyVerificationRequired &&
    directHostedVerificationMatchesCounty &&
    directHostedVerificationMatchesRequest &&
    directHostedVerification.state === 'available';
  const salesReviewUnavailable =
    invalidCountiesHubHandoff ||
    (countiesHubHandoff !== null && countiesHubHandoff.salesReviewAvailability === 'unavailable') ||
    directHostedVerificationPending ||
    directHostedVerificationUnavailable;
  const hostedLaunchDataMode = directHostedLaunch || hostedReferenceHandoff;
  // Promoted county uploads are served by the protected live API, not a launch-data package.
  const launchDataMode = hostedLaunchDataMode || repositoryReferenceHandoff;
  const handoff = parseRollupHandoff(invalidCountiesHubHandoff ? undefined : metadata);
  const selectedCounty = WASHINGTON_COUNTIES.find(
    (county) => county.code === committedFilters.countyCode
  );
  const countyScopeLabel = selectedCounty?.name
    ? `${selectedCounty.name} County`
    : countiesHubHandoffRequested
      ? countiesHubHandoff
        ? `${countiesHubHandoff.countyName} County`
        : 'County scope required'
      : handoff.countyName
        ? `${handoff.countyName} County`
        : 'County scope required';
  const availableTabs =
    launchDataMode && !salesReviewUnavailable
      ? TABS.filter((tab) => WASHINGTON_LAUNCH_TABS.has(tab.id))
      : salesReviewUnavailable
        ? []
        : TABS;
  // Never mount a live-only panel while the header claims public-package mode.
  const renderedActiveTab =
    launchDataMode && !WASHINGTON_LAUNCH_TABS.has(activeTab) ? 'queue' : activeTab;

  // Establish the handed-off county only after its navigation scope reaches
  // the store. The handoff itself is never treated as package attestation.
  useLayoutEffect(() => {
    if (!hostedReferenceHandoff || hostedHandoffCountyCode === null) {
      setEstablishedHostedHandoffCountyCode((current) => (current === null ? current : null));
      return;
    }

    if (committedFilters.countyCode === hostedHandoffCountyCode) {
      setEstablishedHostedHandoffCountyCode((current) =>
        current === hostedHandoffCountyCode ? current : hostedHandoffCountyCode
      );
    }
  }, [committedFilters.countyCode, hostedHandoffCountyCode, hostedReferenceHandoff]);

  useEffect(() => {
    if (!hostedCountyVerificationRequired || hostedVerificationCountyCode === null) {
      setDirectHostedVerification((current) =>
        current.countyCode === null && current.request === null && current.state === 'not-required'
          ? current
          : { countyCode: null, request: null, state: 'not-required', taxYear: null }
      );
      return;
    }

    const selectedCountyCode = hostedVerificationCountyCode;
    const selectedCountyIsRegistered = WASHINGTON_COUNTIES.some(
      (county) => county.code === selectedCountyCode
    );
    const controller = new AbortController();
    const markUnavailable = (): void => {
      if (selectedCountyIsRegistered) {
        evictWashingtonLaunchCountyShard(selectedCountyCode, 'hosted');
      }
      setDirectHostedVerification({
        countyCode: selectedCountyCode,
        request: hostedVerificationRequest,
        state: 'unavailable',
        taxYear: null,
      });
    };
    const timeout = window.setTimeout(() => {
      controller.abort();
      markUnavailable();
    }, DIRECT_HOSTED_PACKAGE_VERIFICATION_TIMEOUT_MS);
    setDirectHostedVerification({
      countyCode: selectedCountyCode,
      request: hostedVerificationRequest,
      state: 'pending',
      taxYear: null,
    });

    void (async () => {
      const resolution = await resolveWashingtonCountyStatus(controller.signal);
      const county =
        resolution.packageSource === 'hosted'
          ? resolution.counties.find((entry) => entry.countyCode === selectedCountyCode)
          : null;
      if (controller.signal.aborted) return;
      if (!county) {
        markUnavailable();
        return;
      }

      const verifiedCounty = await verifyWashingtonCountySalesShard(county, controller.signal);
      if (controller.signal.aborted) return;
      const eligible = getWashingtonSalesReviewCapability(verifiedCounty).eligible;
      if (!eligible && selectedCountyIsRegistered) {
        evictWashingtonLaunchCountyShard(selectedCountyCode, 'hosted');
      }
      setDirectHostedVerification({
        countyCode: selectedCountyCode,
        request: hostedVerificationRequest,
        state: eligible ? 'available' : 'unavailable',
        taxYear: eligible ? verifiedReferenceTaxYear(verifiedCounty.latestSaleDate) : null,
      });
    })()
      .catch(() => {
        if (!controller.signal.aborted) {
          markUnavailable();
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    countiesHubHandoff,
    directHostedVerificationAttempt,
    hostedCountyVerificationRequired,
    hostedVerificationCountyCode,
    hostedVerificationRequest,
  ]);

  useLayoutEffect(() => {
    setDataSource(
      repositoryReferenceHandoff
        ? 'washington-reference'
        : hostedLaunchReady
          ? 'washington-hosted'
          : 'live-api'
    );
  }, [hostedLaunchReady, repositoryReferenceHandoff, setDataSource]);

  useLayoutEffect(() => {
    if (hostedLaunchReady && directHostedVerification.taxYear !== null) {
      setTaxYear(directHostedVerification.taxYear);
    }
  }, [directHostedVerification.taxYear, hostedLaunchReady, setTaxYear]);

  useLayoutEffect(() => {
    if (launchDataMode && activeTab !== renderedActiveTab) {
      setActiveTab(renderedActiveTab);
    }
  }, [activeTab, launchDataMode, renderedActiveTab, setActiveTab]);

  // ── Consume County Studio handoff metadata before child fetch effects ───
  useLayoutEffect(() => {
    if (!metadata) return;
    if (invalidCountiesHubHandoff) {
      applyCountyStudioScope('', null);
      setSelectedStratum(null);
      setContextSegment(null);
      setActiveTab('queue');
      return;
    }
    const parsed = parseDeeplinkQuery(metadata.deeplinkQuery);
    const stratum = handoff.stratumKey ?? parsed.stratum ?? null;
    const year = handoff.taxYear ?? parsed.year ?? null;
    const segmentId = handoff.segmentId ?? parsed.segmentId ?? null;
    const label = handoff.segmentLabel;
    const resetValuationScope = handoff.resetValuationScope;

    if (handoff.countyCode) {
      applyCountyStudioScope(
        handoff.countyCode,
        !resetValuationScope && handoff.rollupScope === 'neighborhood'
          ? handoff.neighborhoodCode
          : null
      );
    }

    if (resetValuationScope) {
      setSelectedStratum(null);
      setContextSegment(null);
      setActiveTab('queue');
      setTaxYear(year ?? SALESFORGE_TAX_YEAR);
    } else if (stratum) {
      setSelectedStratum(stratum);
      setActiveTab('ai-audit');
    } else if (handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode) {
      setActiveTab('neighborhoods');
    } else if (handoff.rollupScope === 'city') {
      setActiveTab('queue');
    }
    if (!resetValuationScope && year !== null) {
      setTaxYear(year);
    }
    if (!resetValuationScope && segmentId) {
      setContextSegment(segmentId, label);
    }
  }, [
    applyCountyStudioScope,
    handoff.countyCode,
    handoff.neighborhoodCode,
    handoff.resetValuationScope,
    handoff.rollupScope,
    handoff.segmentId,
    handoff.segmentLabel,
    handoff.stratumKey,
    handoff.taxYear,
    invalidCountiesHubHandoff,
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
    <div className='sf-workspace'>
      {/* Header */}
      <header className='sf-header'>
        <div className='sf-header__row'>
          <div>
            <p className='sf-header__eyebrow'>TerraForge · Sale Qualification</p>
            <h1 className='sf-header__title'>SalesForge</h1>
          </div>
          <div className='sf-header__badges'>
            {contextSegmentId && (
              <button
                type='button'
                data-testid='sf-scoped-from-chip'
                data-segment-id={contextSegmentId}
                onClick={handleBackToCountyStudio}
                title='Back to County Studio'
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
            {!handoff.resetValuationScope && handoff.rollupScope === 'city' && handoff.city && (
              <span className='forge-chip forge-chip--neutral'>City overview · {handoff.city}</span>
            )}
            {!handoff.resetValuationScope &&
              handoff.rollupScope === 'neighborhood' &&
              handoff.neighborhoodCode && (
                <span className='forge-chip forge-chip--neutral'>
                  Neighborhood · {handoff.neighborhoodName ?? handoff.neighborhoodCode}
                  {handoff.revalArea !== null ? ` · Reval ${handoff.revalArea}` : ''}
                </span>
              )}
            <span className='forge-chip forge-chip--neutral'>{taxYear} study year</span>
            <span className='forge-chip forge-chip--neutral'>{countyScopeLabel}</span>
            <span
              className={`forge-chip ${salesReviewUnavailable ? 'forge-chip--warn' : 'forge-chip--success'}`}
            >
              {directHostedVerificationPending
                ? 'County context · verifying sales data'
                : salesReviewUnavailable
                  ? 'County context · sales data unavailable'
                  : launchDataMode
                    ? 'Washington launch data package'
                    : 'Live TerraFusion API'}
            </span>
          </div>
        </div>
        {!handoff.resetValuationScope && handoff.rollupScope === 'city' && handoff.city && (
          <p className='sf-header__source-note'>
            County Studio handed off a city overview for {handoff.city}. Counties actually qualify
            and defend sales by reval area and neighborhood, so city scope remains triage-only until
            you narrow below the city rollup.
          </p>
        )}
        {!handoff.resetValuationScope &&
          handoff.rollupScope === 'neighborhood' &&
          handoff.neighborhoodCode && (
            <p className='sf-header__source-note'>
              County Studio handed off neighborhood{' '}
              {handoff.neighborhoodName ?? handoff.neighborhoodCode}
              {handoff.revalArea !== null ? ` in reval ${handoff.revalArea}` : ''}. SalesForge is
              pinned to that county and neighborhood because counties track reval area and
              neighborhood before parcel-level action.
            </p>
          )}
        {launchDataMode && !salesReviewUnavailable && (
          <p className='sf-header__source-note'>
            Public/reference package only — not county-certified valuation truth.
            {syntheticReferenceData
              ? ' This workspace contains invented synthetic sales for workflow validation, not observed public sales or county records.'
              : ''}{' '}
            Review decisions stay browser-local and nonofficial; nothing is written back to a county
            system. Live AI Audit, Ratio Audit, and DOR Export are unavailable in this mode.
          </p>
        )}
        {salesReviewUnavailable && (
          <p className='sf-header__source-note' role='status'>
            {directHostedVerificationPending
              ? 'TerraForge is authenticating the selected county public-data package before any sales record can load.'
              : directHostedVerificationUnavailable
                ? 'No authenticated hosted sales package is currently available for this county.'
                : invalidCountiesHubHandoff
                  ? 'The Counties Hub county handoff is invalid, so no county workflow can run.'
                  : countiesHubHandoff?.salesReviewAvailability === 'verifying'
                    ? 'The selected county public sales package is still being verified.'
                    : (countiesHubHandoff?.salesReviewUnavailableMessage ??
                      'No governed public sales workflow is available for this county.')}{' '}
            County context remains active, and SalesForge does not borrow another county&apos;s
            data.
          </p>
        )}
        {directHostedVerificationUnavailable && (
          <button
            type='button'
            className='forge-chip forge-chip--neutral'
            data-testid='salesforge-retry-hosted-verification'
            onClick={() => setDirectHostedVerificationAttempt((attempt) => attempt + 1)}
          >
            Retry public-data verification
          </button>
        )}
      </header>

      {/* Tab bar */}
      {!salesReviewUnavailable && (
        <nav className='sf-tabbar' aria-label='SalesForge sections'>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
              role='tab'
              aria-selected={renderedActiveTab === tab.id}
              className={`sf-tab ${renderedActiveTab === tab.id ? 'sf-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.title}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* Main layout: content + stats rail */}
      {salesReviewUnavailable ? (
        <div className='sf-state' data-testid='salesforge-data-unavailable' role='status'>
          No sales-review records or data-dependent tools are available in this county context.
        </div>
      ) : (
        <div className='sf-layout'>
          {/* Left: panel content */}
          <Suspense fallback={<TabSpinner />}>
            {renderedActiveTab === 'ai-audit' && <AuditCommandCenter taxYear={taxYear} />}
            {renderedActiveTab === 'queue' && <QualificationQueuePanel />}
            {renderedActiveTab === 'ratio-audit' && <RatioAuditPanel />}
            {renderedActiveTab === 'neighborhoods' && <NeighborhoodViewPanel />}
            {renderedActiveTab === 'code-audit' && <CodeAuditPanel />}
            {renderedActiveTab === 'dor-export' && <DorExportPanel />}
          </Suspense>

          {/* Right: live IAAO stats rail */}
          <RunningStatsPanel />
        </div>
      )}
    </div>
  );
}

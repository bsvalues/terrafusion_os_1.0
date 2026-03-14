/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — PROPERTY WORKBENCH WINDOW ADAPTER
 * Phase A: Workbench-in-a-Window (Desktop Integration)
 *
 * Renders the Property Workbench inside a desktop window.
 * Receives parcelId via window metadata (not URL params).
 *
 * Uses state-based tab switching + WorkbenchTabCtx so tab components
 * get their context without requiring a nested Router (which crashes
 * React Router v6 with "cannot render a Router inside another Router").
 *
 * The full-screen route (/property/:parcelId) remains untouched.
 * This adapter adds window capability without breaking existing code.
 *
 * @see PropertyWorkbench.tsx — Route-based counterpart
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Tier-0 OS Surface
 * ═══════════════════════════════════════════════════════════════
 */

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { usePropertyStore } from '../../stores/propertyStore';
import { SuiteCompass } from '../../components/workbench/SuiteCompass';
import { ContextRibbon } from '../../components/workbench/ContextRibbon';
import { ActivityFeed } from '../../components/workbench/ActivityFeed';
import { BADGE_PROVIDERS } from '../../services/badges';
import { QUICK_ACTION_PROVIDERS } from '../../services/quickActions';
import { useParcelActivity } from '../../services/activityFeed';
import { WorkbenchTabCtx } from '../../context/workbenchTabContext';
import type { WorkbenchTabSlug, WorkMode, Badge, QuickActionDefinition, WorkbenchContext } from '../../contracts/workbench';
import { validateWorkbenchHost } from '../../contracts/objectPlacement';
import type { WorkbenchHostViolation } from '../../contracts/objectPlacement';

// ============================================================================
// Lazy-loaded Tab Components (same as Router.tsx)
// ============================================================================

const PropertySummary = lazy(() =>
  import('./tabs/PropertySummary').then((m) => ({ default: m.PropertySummary }))
);
const PropertyForge = lazy(() =>
  import('./tabs/PropertyForge').then((m) => ({ default: m.PropertyForge }))
);
const PropertyAtlas = lazy(() =>
  import('./tabs/PropertyAtlas').then((m) => ({ default: m.PropertyAtlas }))
);
const PropertyDais = lazy(() =>
  import('./tabs/PropertyDais').then((m) => ({ default: m.PropertyDais }))
);
const PropertyClerk = lazy(() =>
  import('./tabs/PropertyClerk').then((m) => ({ default: m.PropertyClerk }))
);
const PropertyTreasury = lazy(() =>
  import('./tabs/PropertyTreasury').then((m) => ({ default: m.PropertyTreasury }))
);
const PropertyAudit = lazy(() =>
  import('./tabs/PropertyAudit').then((m) => ({ default: m.PropertyAudit }))
);
const PropertyDossier = lazy(() =>
  import('./tabs/PropertyDossier').then((m) => ({ default: m.PropertyDossier }))
);
const PropertyPilot = lazy(() =>
  import('./tabs/PropertyPilot').then((m) => ({ default: m.PropertyPilot }))
);

// ============================================================================
// Tab → Component Map
// ============================================================================

const TAB_COMPONENTS: Record<WorkbenchTabSlug, React.LazyExoticComponent<React.FC>> = {
  summary: PropertySummary,
  forge: PropertyForge,
  atlas: PropertyAtlas,
  dais: PropertyDais,
  clerk: PropertyClerk,
  treasury: PropertyTreasury,
  audit: PropertyAudit,
  dossier: PropertyDossier,
  pilot: PropertyPilot,
};

// ============================================================================
// Types
// ============================================================================

export interface PropertyWorkbenchWindowProps {
  metadata?: Record<string, unknown>;
}

interface TabDef {
  id: WorkbenchTabSlug;
  label: string;
  icon: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Canonical tab order — locked per spec. */
const TABS: readonly TabDef[] = [
  { id: 'summary', label: 'Summary', icon: '📊' },
  { id: 'forge', label: 'Forge', icon: '🔨' },
  { id: 'atlas', label: 'Atlas', icon: '🗺️' },
  { id: 'dais', label: 'Dais', icon: '⚖️' },
  { id: 'clerk', label: 'Clerk', icon: '📜' },
  { id: 'treasury', label: 'Treasury', icon: '💰' },
  { id: 'audit', label: 'Audit', icon: '🔍' },
  { id: 'dossier', label: 'Dossier', icon: '📋' },
  { id: 'pilot', label: 'Pilot', icon: '🤖' },
] as const;

// ============================================================================
// Loading Fallback
// ============================================================================

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center h-32" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
    <div
      className="w-6 h-6 rounded-full animate-spin mr-3"
      style={{
        border: '2px solid hsl(var(--tf-accent) / 0.2)',
        borderTopColor: 'hsl(var(--tf-accent))',
      }}
    />
    Loading...
  </div>
);

// ============================================================================
// No Parcel State
// ============================================================================

const NoParcelSelected: React.FC = () => (
  <div
    className="flex flex-col items-center justify-center h-full gap-4 p-8"
    style={{ color: 'hsl(var(--tf-text) / 0.6)' }}
  >
    <span className="text-5xl">🏠</span>
    <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
      No Parcel Selected
    </h2>
    <p className="text-sm text-center max-w-md">
      Open a parcel from the Start Menu recent parcels, Command Palette search,
      or double-click the Property Workbench icon to get started.
    </p>
  </div>
);

// ============================================================================
// Phase 7: Workbench Host Violation Notice
// ============================================================================

const WorkbenchHostViolationNotice: React.FC<{ violation: WorkbenchHostViolation }> = ({ violation }) => {
  // Log the violation to console for governance traceability
  if (typeof console !== 'undefined') {
    console.warn(
      `[Codex] Workbench host violation: tab '${violation.tabId}' ` +
      `(type: ${violation.objectType}) — ${violation.reason}`
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 p-8"
      style={{ color: 'hsl(var(--tf-text) / 0.6)' }}
    >
      <span className="text-4xl">⛔</span>
      <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
        Codex Violation — Host Boundary
      </h2>
      <p className="text-sm text-center max-w-md">
        Tab &quot;{violation.tabId}&quot; (type: {violation.objectType}) is not
        authorized to render inside the Property Workbench.
      </p>
      <p className="text-xs text-center max-w-md" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
        {violation.reason}
      </p>
    </div>
  );
};

// ============================================================================
// Tab Navigation Bar (state-based, no Router dependency)
// ============================================================================

interface TabBarProps {
  activeTab: WorkbenchTabSlug;
  onTabChange: (tab: WorkbenchTabSlug) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => (
  <nav
    className="border-b px-4 flex gap-1 overflow-x-auto"
    style={{
      borderColor: 'hsl(var(--tf-border) / 0.15)',
      background: 'hsl(var(--tf-bg-surface) / 0.5)',
    }}
  >
    {TABS.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
          style={{
            color: isActive ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-text) / 0.6)',
            borderBottom: isActive ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
            background: isActive ? 'hsl(var(--tf-accent) / 0.05)' : 'transparent',
          }}
          aria-selected={isActive}
          role="tab"
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

// ============================================================================
// Inner Layout Types
// ============================================================================

interface PropertyData {
  parcelId: string;
  address: string;
  owner: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  propertyType: string;
  legalDescription: string;
  source: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PropertyWorkbenchWindow — Desktop window adapter for the Property Workbench.
 *
 * Opens as a floating desktop window via desktopStore.openWindow().
 * Receives parcelId from window metadata.
 * Full-screen route (/property/:parcelId) remains untouched.
 *
 * Architecture:
 * - State-based tab switching (no Router needed)
 * - WorkbenchTabCtx.Provider gives tab components { parcelId, propertyData }
 * - Tab components use useWorkbenchTab() which reads from this context
 */
const PropertyWorkbenchWindow: React.FC<PropertyWorkbenchWindowProps> = ({ metadata }) => {
  const parcelId = (metadata?.parcelId as string) ?? null;
  const initialTab = (metadata?.tabId as WorkbenchTabSlug) ?? 'summary';

  // Resolve initial tab from metadata slug
  const resolvedInitialTab = useMemo<WorkbenchTabSlug>(() => {
    if (!initialTab || initialTab === '/' as string) return 'summary';
    const valid = TABS.find((t) => t.id === initialTab);
    return valid?.id ?? 'summary';
  }, [initialTab]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<WorkbenchTabSlug>(resolvedInitialTab);

  // Property data from store (backed by DataProvider → snapshot/live/fixtures)
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const loading = usePropertyStore((s) => s.activeParcelLoading);
  const selectParcel = usePropertyStore((s) => s.selectParcel);

  // Load parcel via store when parcelId changes (if not already loaded)
  useEffect(() => {
    if (parcelId && activeParcel?.parcelId !== parcelId) {
      selectParcel(parcelId);
    }
  }, [parcelId, activeParcel?.parcelId, selectParcel]);

  const propertyData = useMemo<PropertyData>(
    () => ({
      parcelId: activeParcel?.parcelId || parcelId || 'Unknown',
      address: activeParcel?.address || '',
      owner: activeParcel?.ownerName || '',
      assessedValue: activeParcel?.totalAssessedValue ?? 0,
      marketValue: activeParcel?.marketValue ?? 0,
      landValue: activeParcel?.landValue ?? 0,
      improvementValue: activeParcel?.improvementValue ?? 0,
      propertyType: activeParcel?.propertyType || '',
      legalDescription: activeParcel?.legalDescription || '',
      source: activeParcel?.dataSource || '',
    }),
    [activeParcel, parcelId]
  );

  // Work Mode state
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

  // Context value for tab components (via WorkbenchTabCtx)
  const tabContextValue = useMemo(
    () => ({ parcelId: parcelId || 'Unknown', propertyData }),
    [parcelId, propertyData]
  );

  // Badge state — collected from all providers
  const [badges, setBadges] = useState<Badge[]>([]);

  // Fetch badges when parcelId changes
  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;

    const ctx: WorkbenchContext = {
      countyId: 'benton', // TODO: from session
      userId: 'current-user', // TODO: from auth
      roles: [],
      parcelId,
      workMode,
    };

    Promise.allSettled(
      BADGE_PROVIDERS.map((p) => p.getBadges(parcelId, ctx))
    ).then((results) => {
      if (cancelled) return;
      const allBadges: Badge[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') allBadges.push(...r.value);
      }
      setBadges(allBadges);
    });

    return () => { cancelled = true; };
  }, [parcelId, workMode]);

  // Quick Actions — mode-aware, collected from providers
  const [quickActions, setQuickActions] = useState<QuickActionDefinition[]>([]);

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;

    const ctx: WorkbenchContext = {
      countyId: 'benton',
      userId: 'current-user',
      roles: [],
      parcelId,
      workMode,
    };

    Promise.allSettled(
      QUICK_ACTION_PROVIDERS.map((p) => p.getActions(ctx))
    ).then((results) => {
      if (cancelled) return;
      const all: QuickActionDefinition[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value);
      }
      setQuickActions(all);
    });

    return () => { cancelled = true; };
  }, [parcelId, workMode]);

  // Pop out to full-screen route
  const handlePopOut = useCallback(() => {
    if (parcelId) {
      window.open(`/property/${encodeURIComponent(parcelId)}`, '_self');
    }
  }, [parcelId]);

  // Tab change handler
  const handleTabChange = useCallback((slug: WorkbenchTabSlug) => {
    setActiveTab(slug);
    // TODO: Emit TerraTrace tab_switched event
  }, []);

  // Activity Feed state — collapsible bottom panel
  const [activityOpen, setActivityOpen] = useState(false);
  const { entries: activityEntries, loading: activityLoading } = useParcelActivity(parcelId);

  // Phase 7: Workbench Host Boundary Check
  // Validates that the active tab is lawfully hosted inside the workbench.
  const hostViolation: WorkbenchHostViolation | null = useMemo(
    () => validateWorkbenchHost(activeTab),
    [activeTab],
  );

  // Resolve active tab component
  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  // No parcel selected
  if (!parcelId) {
    return <NoParcelSelected />;
  }

  return (
    <div className="flex flex-col h-full w-full" style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Context Ribbon replaces old ParcelHeader */}
      <ContextRibbon
        parcelId={parcelId}
        address={propertyData.address}
        owner={propertyData.owner}
        countyName="Benton County"
        badges={badges}
        quickActions={quickActions}
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        onPopOut={handlePopOut}
      />

      {/* Workbench content — state-based tabs, no Router needed */}
      <WorkbenchTabCtx.Provider value={tabContextValue}>
        <div className="flex flex-1 min-h-0">
          {/* Suite Compass — left rail (desktop) / top bar (tablet) */}
          <div className="shrink-0">
            <SuiteCompass activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0">
            <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 overflow-auto">
              {hostViolation ? (
                <WorkbenchHostViolationNotice violation={hostViolation} />
              ) : loading ? (
                <TabLoader />
              ) : (
                <ErrorBoundary>
                  <Suspense fallback={<TabLoader />}>
                    <ActiveTabComponent />
                  </Suspense>
                </ErrorBoundary>
              )}
            </main>
          </div>
        </div>
      </WorkbenchTabCtx.Provider>

      {/* Collapsible Activity Feed — bottom drawer */}
      <div
        className="shrink-0"
        style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}
      >
        <button
          onClick={() => setActivityOpen((o) => !o)}
          className="flex items-center gap-2 w-full px-4 py-1.5 text-xs font-medium transition-colors"
          style={{
            color: 'hsl(var(--tf-text) / 0.5)',
            background: 'hsl(var(--tf-bg-surface) / 0.3)',
          }}
          aria-expanded={activityOpen}
          aria-controls="workbench-activity-feed"
        >
          <span>{activityOpen ? '▼' : '▶'}</span>
          <span>Activity ({activityEntries.length})</span>
        </button>
        {activityOpen && (
          <div
            id="workbench-activity-feed"
            className="max-h-48 overflow-auto"
          >
            {activityLoading ? (
              <div
                className="flex items-center gap-2 px-4 py-3 text-xs"
                style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
              >
                <div
                  className="w-3 h-3 rounded-full animate-spin"
                  style={{
                    border: '1.5px solid hsl(var(--tf-accent) / 0.2)',
                    borderTopColor: 'hsl(var(--tf-accent))',
                  }}
                />
                Loading activity...
              </div>
            ) : (
              <ActivityFeed entries={activityEntries} maxEntries={15} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyWorkbenchWindow;

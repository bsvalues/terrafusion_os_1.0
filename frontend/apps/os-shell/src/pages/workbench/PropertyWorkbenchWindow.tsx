/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — PROPERTY WORKBENCH WINDOW ADAPTER
 * Phase A: Workbench-in-a-Window (Desktop Integration)
 *
 * Renders the Property Workbench inside a desktop window.
 * Receives parcelId via window metadata (not URL params).
 * Uses MemoryRouter + Outlet so tab components work unchanged.
 *
 * The full-screen route (/property/:parcelId) remains untouched.
 * This adapter adds window capability without breaking existing code.
 *
 * @see PropertyWorkbench.tsx — Route-based counterpart
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Tier-0 OS Surface
 * ═══════════════════════════════════════════════════════════════
 */

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { MemoryRouter, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { usePropertyLookup } from '../../hooks/usePropertyLookup';
import { SuiteCompass } from '../../components/workbench/SuiteCompass';
import { ContextRibbon } from '../../components/workbench/ContextRibbon';
import { ActivityFeed } from '../../components/workbench/ActivityFeed';
import type { ActivityEntry } from '../../components/workbench/ActivityFeed';
import { BADGE_PROVIDERS } from '../../services/badges';
import type { WorkbenchTabSlug, WorkMode, Badge, WorkbenchContext } from '../../contracts/workbench';

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
const PropertyDossier = lazy(() =>
  import('./tabs/PropertyDossier').then((m) => ({ default: m.PropertyDossier }))
);
const PropertyPilot = lazy(() =>
  import('./tabs/PropertyPilot').then((m) => ({ default: m.PropertyPilot }))
);

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
  path: string; // relative path for MemoryRouter
}

// ============================================================================
// Constants
// ============================================================================

/** Canonical tab order — locked per spec. */
const TABS: readonly TabDef[] = [
  { id: 'summary', label: 'Summary', icon: '📊', path: '/' },
  { id: 'forge', label: 'Forge', icon: '🔨', path: '/forge' },
  { id: 'atlas', label: 'Atlas', icon: '🗺️', path: '/atlas' },
  { id: 'dais', label: 'Dais', icon: '⚖️', path: '/dais' },
  { id: 'dossier', label: 'Dossier', icon: '📋', path: '/dossier' },
  { id: 'pilot', label: 'Pilot', icon: '🤖', path: '/pilot' },
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
// Inner Layout (inside MemoryRouter)
// ============================================================================

interface WorkbenchLayoutProps {
  parcelId: string;
  propertyData: PropertyData;
  loading: boolean;
}

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

/**
 * Tab navigation bar — reuses the locked tab order.
 */
const TabBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      className="border-b px-4 flex gap-1 overflow-x-auto"
      style={{
        borderColor: 'hsl(var(--tf-border) / 0.15)',
        background: 'hsl(var(--tf-bg-surface) / 0.5)',
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              color: isActive ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-text) / 0.6)',
              borderBottom: isActive ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
              background: isActive ? 'hsl(var(--tf-accent) / 0.05)' : 'transparent',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

/**
 * Layout wrapper inside the MemoryRouter.
 * Provides Outlet context so tab components work unchanged.
 * Includes SuiteCompass left rail.
 */
const WorkbenchLayout: React.FC<WorkbenchLayoutProps & { onTabChange: (slug: WorkbenchTabSlug) => void }> = ({
  parcelId,
  propertyData,
  loading,
  onTabChange,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from MemoryRouter location
  const activeTab: WorkbenchTabSlug = useMemo(() => {
    const path = location.pathname.replace(/^\//, '');
    if (!path) return 'summary';
    const tabMap: Record<string, WorkbenchTabSlug> = {
      forge: 'forge',
      atlas: 'atlas',
      dais: 'dais',
      dossier: 'dossier',
      pilot: 'pilot',
    };
    return tabMap[path] ?? 'summary';
  }, [location.pathname]);

  // Navigate inside MemoryRouter when SuiteCompass is clicked
  const handleCompassNav = useCallback(
    (slug: WorkbenchTabSlug) => {
      const tab = TABS.find((t) => t.id === slug);
      if (tab) {
        navigate(tab.path);
        onTabChange(slug);
      }
    },
    [navigate, onTabChange]
  );

  return (
    <div className="flex h-full">
      {/* Suite Compass — left rail (desktop) / top bar (tablet) */}
      <div className="shrink-0">
        <SuiteCompass activeTab={activeTab} onTabChange={handleCompassNav} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TabBar />
        <main className="flex-1 overflow-auto">
          {loading ? (
            <TabLoader />
          ) : (
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <Outlet context={{ parcelId, propertyData }} />
              </Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
};

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
 * - MemoryRouter provides internal route context for tab components
 * - Outlet context provides { parcelId, propertyData } (same as route-based workbench)
 * - Tab components (PropertySummary, PropertyForge, etc.) work unchanged
 */
const PropertyWorkbenchWindow: React.FC<PropertyWorkbenchWindowProps> = ({ metadata }) => {
  const parcelId = (metadata?.parcelId as string) ?? null;
  const initialTab = (metadata?.tabId as string) ?? '/';

  // Resolve initial MemoryRouter entry from tab slug
  const initialEntry = useMemo(() => {
    if (!initialTab || initialTab === 'summary' || initialTab === '/') return '/';
    const tab = TABS.find((t) => t.id === initialTab);
    return tab?.path ?? '/';
  }, [initialTab]);

  // Property data from PACS
  const { data: pacsData, loading } = usePropertyLookup(parcelId);

  const propertyData = useMemo<PropertyData>(
    () => ({
      parcelId: pacsData?.geoId || parcelId || 'Unknown',
      address: pacsData?.address || '',
      owner: pacsData?.ownerName || '',
      assessedValue: pacsData?.assessedValue ?? 0,
      marketValue: pacsData?.marketValue ?? 0,
      landValue: pacsData?.landValue ?? 0,
      improvementValue: pacsData?.improvementValue ?? 0,
      propertyType: pacsData?.propertyType || '',
      legalDescription: pacsData?.legalDescription || '',
      source: pacsData?.source || '',
    }),
    [pacsData, parcelId]
  );

  // Work Mode state
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

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

  // Pop out to full-screen route
  const handlePopOut = useCallback(() => {
    if (parcelId) {
      window.open(`/property/${encodeURIComponent(parcelId)}`, '_self');
    }
  }, [parcelId]);

  // Tab change callback (for future trace emission)
  const handleTabChange = useCallback((_slug: WorkbenchTabSlug) => {
    // TODO: Emit TerraTrace tab_switched event
  }, []);

  // Activity Feed state — collapsible bottom panel
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityEntries] = useState<ActivityEntry[]>([]);
  // TODO: Populate activity entries from a real event source (SignalR hub, polling, etc.)

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
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        onPopOut={handlePopOut}
      />

      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <WorkbenchLayout
                parcelId={parcelId}
                propertyData={propertyData}
                loading={loading}
                onTabChange={handleTabChange}
              />
            }
          >
            <Route index element={<PropertySummary />} />
            <Route path="forge" element={<PropertyForge />} />
            <Route path="atlas" element={<PropertyAtlas />} />
            <Route path="dais" element={<PropertyDais />} />
            <Route path="dossier" element={<PropertyDossier />} />
            <Route path="pilot" element={<PropertyPilot />} />
          </Route>
        </Routes>
      </MemoryRouter>

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
            <ActivityFeed entries={activityEntries} maxEntries={15} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyWorkbenchWindow;

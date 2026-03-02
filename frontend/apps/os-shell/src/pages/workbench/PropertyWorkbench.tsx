/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — PROPERTY WORKBENCH
 * Tier-0 OS Surface (Parcel-Context Hub)
 *
 * The unified parcel view with canonical tab order.
 * All suite views for a given parcel are orchestrated here.
 *
 * Route: /property/:parcelId/*
 *
 * Layout: ContextRibbon (top) → SuiteCompass (left) + Tabs (center) → ActivityFeed (bottom)
 *
 * Tab Order (Locked per Constitution v1.0):
 * 1. Summary — Property overview
 * 2. Forge — AI valuation & appeals
 * 3. Atlas — GIS & mapping
 * 4. Dais — Workflow status
 * 5. Dossier — Documents
 * 6. Pilot — Tool execution log
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Tier-0 OS Surface
 * @see PropertyWorkbenchWindow.tsx — Desktop window adapter (same layout)
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { ContextRibbon } from '../../components/workbench/ContextRibbon';
import { SuiteCompass } from '../../components/workbench/SuiteCompass';
import { ActivityFeed } from '../../components/workbench/ActivityFeed';
import { BADGE_PROVIDERS } from '../../services/badges';
import { QUICK_ACTION_PROVIDERS } from '../../services/quickActions';
import { useParcelActivity } from '../../services/activityFeed';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';
import { usePropertyLookup } from '../../hooks/usePropertyLookup';
import type { WorkbenchTabSlug, WorkMode, Badge, QuickActionDefinition, WorkbenchContext } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

interface WorkbenchTab {
  id: WorkbenchTabSlug;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Simple hash function for parcel ID (PII-safe)
 * Uses a simple djb2-like hash for deterministic output
 */
function hashParcelId(parcelId: string): string {
  let hash = 5381;
  for (let i = 0; i < parcelId.length; i++) {
    hash = (hash * 33) ^ parcelId.charCodeAt(i);
  }
  return `hash_${(hash >>> 0).toString(16)}`;
}

/**
 * Determine current tab from path
 */
function getCurrentTabFromPath(pathname: string, parcelId: string): WorkbenchTabSlug {
  const basePath = `/property/${parcelId}`;
  const pathAfterBase = pathname.replace(basePath, '').replace(/^\//, '');

  if (!pathAfterBase || pathAfterBase === '') return 'summary';
  const tabPathMap: Record<string, WorkbenchTabSlug> = {
    forge: 'forge',
    atlas: 'atlas',
    dais: 'dais',
    dossier: 'dossier',
    pilot: 'pilot',
  };
  return tabPathMap[pathAfterBase] ?? 'summary';
}

// ============================================================================
// Tab Configuration (Locked Order)
// ============================================================================

const WORKBENCH_TABS: WorkbenchTab[] = [
  { id: 'summary', label: 'Summary', icon: '📊', path: '', enabled: true },
  { id: 'forge', label: 'Forge', icon: '🔥', path: 'forge', enabled: true },
  { id: 'atlas', label: 'Atlas', icon: '🗺️', path: 'atlas', enabled: true },
  { id: 'dais', label: 'Dais', icon: '📋', path: 'dais', enabled: true },
  { id: 'dossier', label: 'Dossier', icon: '📁', path: 'dossier', enabled: true },
  { id: 'pilot', label: 'Pilot', icon: '🎮', path: 'pilot', enabled: true },
];

/**
 * Work-mode → tab emphasis mapping.
 * Each mode highlights the tab most relevant to that workflow.
 * overview highlights nothing (all tabs equally relevant).
 */
const MODE_TAB_EMPHASIS: Record<WorkMode, WorkbenchTabSlug | null> = {
  overview: null,
  valuation: 'forge',
  mapping: 'atlas',
  admin: 'dais',
  case: 'dossier',
};

// ============================================================================
// Tab Content Components (Lazy Loaded)
// ============================================================================

// Tab content is resolved by React Router child routes (see Router.tsx).
// No local lazy imports needed — Outlet renders the matched child route.

// ============================================================================
// Components
// ============================================================================

/**
 * Loading skeleton for tab content
 */
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

/**
 * Tab Navigation — uses NavLink for route-based switching with trace emission
 */
const TabNavigation: React.FC<{
  parcelId: string;
  tabs: WorkbenchTab[];
  currentTabId: WorkbenchTabSlug;
  emphasizedTabId: WorkbenchTabSlug | null;
  onTabClick: (tab: WorkbenchTab, isActive: boolean) => void;
}> = ({ parcelId, tabs, currentTabId, emphasizedTabId, onTabClick }) => (
  <nav
    className="border-b px-4 flex gap-1 overflow-x-auto"
    style={{
      borderColor: 'hsl(var(--tf-border) / 0.15)',
      background: 'hsl(var(--tf-bg-surface) / 0.5)',
    }}
  >
    {tabs.map((tab) => {
      const isCurrentTab = tab.id === currentTabId;
      return (
        <NavLink
          key={tab.id}
          to={tab.path ? `/property/${parcelId}/${tab.path}` : `/property/${parcelId}`}
          end={tab.path === ''}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
          style={({ isActive }) => {
            const isEmphasized = emphasizedTabId === tab.id && !isActive;
            return {
              color: isActive
                ? 'hsl(var(--tf-accent))'
                : isEmphasized
                  ? 'hsl(var(--tf-accent) / 0.8)'
                  : 'hsl(var(--tf-text) / 0.6)',
              borderBottom: isActive
                ? '2px solid hsl(var(--tf-accent))'
                : isEmphasized
                  ? '2px solid hsl(var(--tf-accent) / 0.4)'
                  : '2px solid transparent',
              background: isActive
                ? 'hsl(var(--tf-accent) / 0.05)'
                : isEmphasized
                  ? 'hsl(var(--tf-accent) / 0.02)'
                  : 'transparent',
              opacity: tab.enabled ? 1 : 0.5,
              cursor: tab.enabled ? 'pointer' : 'not-allowed',
            };
          }}
          onClick={(e) => {
            if (!tab.enabled) {
              e.preventDefault();
              return;
            }
            onTabClick(tab, isCurrentTab);
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      );
    })}
  </nav>
);

// ============================================================================
// Property Workbench Component
// ============================================================================

export interface PropertyWorkbenchProps {
  className?: string;
}

/**
 * PropertyWorkbench — The parcel-context hub
 *
 * Route: /property/:parcelId/*
 *
 * Layout: ContextRibbon (top) → SuiteCompass (left) + TabBar + Outlet (center) → ActivityFeed (bottom)
 * This is the primary user path — 100% of users reach the workbench via this route.
 */
export const PropertyWorkbench: React.FC<PropertyWorkbenchProps> = ({ className = '' }) => {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Track whether this is initial mount (to avoid trace on mount)
  const isInitialMount = useRef(true);

  // Calculate current tab from path
  const currentTabId = useMemo(
    () => (parcelId ? getCurrentTabFromPath(location.pathname, parcelId) : 'summary'),
    [location.pathname, parcelId]
  );

  // Real PACS property data (falls back to parcelId-only stub while loading)
  const { data: pacsData, loading: propertyLoading } = usePropertyLookup(parcelId);
  const propertyData = useMemo(
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

  // ── Work Mode state ──
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

  // ── Badge state — collected from all suite providers ──
  const [badges, setBadges] = useState<Badge[]>([]);

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

  // ── Quick Actions — mode-aware, collected from providers ──
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

  // ── Activity Feed — collapsible bottom panel ──
  const [activityOpen, setActivityOpen] = useState(false);
  const { entries: activityEntries, loading: activityLoading } = useParcelActivity(parcelId);

  // ── Navigation ──
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handlePopOut = useCallback(() => {
    // Pop out to a new browser window (rare case, mostly for desktop workflows)
    if (parcelId) {
      window.open(`/property/${encodeURIComponent(parcelId)}`, '_blank', 'noopener');
    }
  }, [parcelId]);

  /**
   * Handle tab click — emits OS action trace for user-initiated tab switches
   */
  const handleTabClick = useCallback(
    (tab: WorkbenchTab, isCurrentTab: boolean) => {
      isInitialMount.current = false;

      if (isCurrentTab) return;

      const targetHref = tab.path ? `/property/${parcelId}/${tab.path}` : `/property/${parcelId}`;

      const action: OsAction = {
        id: 'workbench_tab_switch',
        label: `Switch to ${tab.label}`,
        intent: 'workbench',
        href: targetHref,
        disabled: !tab.enabled,
        disabledReason: !tab.enabled ? 'Tab is currently disabled' : undefined,
      };

      const context: OsActionContext = {
        navigate: () => {}, // Navigation handled by NavLink
        suiteId: 'workbench',
        surface: 'workbench',
        moduleId: 'workbench_tabs',
        parcelIdHash: parcelId ? hashParcelId(parcelId) : undefined,
        tabId: tab.id,
      };

      executeOsAction(action, context);
    },
    [parcelId]
  );

  // ── No parcel ──
  if (!parcelId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 p-8"
        style={{ color: 'hsl(var(--tf-text) / 0.6)', background: 'hsl(var(--tf-bg))' }}
        data-testid="workbench-no-parcel"
      >
        <span className="text-5xl">🏠</span>
        <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
          No Parcel Selected
        </h2>
        <p className="text-sm text-center max-w-md">
          Search for a parcel to view the Property Workbench.
        </p>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'hsl(var(--tf-accent))',
            color: 'hsl(var(--tf-bg))',
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (propertyLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'hsl(var(--tf-bg))' }}
      >
        <div className="text-center p-8">
          <div
            className="animate-spin h-8 w-8 rounded-full mx-auto mb-4"
            style={{
              borderWidth: 4,
              borderStyle: 'solid',
              borderColor: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
              borderTopColor: 'transparent',
            }}
          />
          <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading property {parcelId}…</p>
        </div>
      </div>
    );
  }

  // ── Spec-compliant layout ──
  return (
    <div className={`flex flex-col h-screen ${className}`} style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Context Ribbon — parcel identity, badges, work mode, pop-out */}
      <ContextRibbon
        parcelId={propertyData.parcelId}
        address={propertyData.address}
        owner={propertyData.owner}
        countyName="Benton County"
        badges={badges}
        quickActions={quickActions}
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        onQuickAction={(action) => {
          // Quick actions are tool-bound — route through TerraPilot
          executeOsAction(
            {
              id: action.id,
              label: action.label,
              intent: 'pilot-tool',
              disabled: false,
            },
            {
              navigate,
              suiteId: 'workbench',
              surface: 'context-ribbon',
              moduleId: 'quick-actions',
              parcelIdHash: parcelId ? hashParcelId(parcelId) : undefined,
            }
          );
        }}
        onPopOut={handlePopOut}
      />

      {/* Workbench content: SuiteCompass (left) + Tab bar + Outlet (center) */}
      <div className="flex flex-1 min-h-0">
        {/* Suite Compass — left rail navigation */}
        <div className="shrink-0">
          <SuiteCompass
            activeTab={currentTabId}
            onTabChange={(slug) => {
              const tab = WORKBENCH_TABS.find((t) => t.id === slug);
              if (tab) {
                const href = tab.path
                  ? `/property/${parcelId}/${tab.path}`
                  : `/property/${parcelId}`;
                navigate(href);
              }
            }}
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Tab Navigation */}
          <TabNavigation
            parcelId={parcelId}
            tabs={WORKBENCH_TABS}
            currentTabId={currentTabId}
            emphasizedTabId={MODE_TAB_EMPHASIS[workMode]}
            onTabClick={handleTabClick}
          />

          {/* Tab Content via React Router Outlet */}
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <Outlet context={{ parcelId, propertyData, workMode }} />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>

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

export default PropertyWorkbench;

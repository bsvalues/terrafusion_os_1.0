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
 * Tab Order (Locked per Constitution v1.0 + R3 Extensions):
 * 1. Summary — Property overview
 * 2. Forge — AI valuation & appeals
 * 3. Atlas — GIS & mapping
 * 4. Dais — Workflow status
 * 5. Clerk — Recording & title (R3.2)
 * 6. Treasury — Tax collection (R3.3)
 * 7. Audit — Financial compliance (R3.4)
 * 8. Dossier — Documents
 * 9. Pilot — Tool execution log
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
import { usePropertyStore } from '../../stores/propertyStore';
import type { WorkbenchTabSlug, WorkMode, Badge, QuickActionDefinition, WorkbenchContext } from '../../contracts/workbench';
import { useWorkbenchRoles } from '../../hooks/useWorkbenchRoles';
import { useSession } from '../../auth/useSession';
import { useAuthContext, toOsActor } from '../../auth/useAuthContext';
import type { SuiteCompassItem } from '../../components/workbench/SuiteCompass';

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
    clerk: 'clerk',
    treasury: 'treasury',
    audit: 'audit',
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
  { id: 'clerk', label: 'Clerk', icon: '📜', path: 'clerk', enabled: true },
  { id: 'treasury', label: 'Treasury', icon: '💰', path: 'treasury', enabled: true },
  { id: 'audit', label: 'Audit', icon: '🔍', path: 'audit', enabled: true },
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
    className="border-b px-2 flex gap-0 overflow-x-auto"
    style={{
      borderColor: 'hsl(var(--tf-border) / 0.2)',
      background: 'hsl(var(--tf-surface))',
    }}
  >
    {tabs.map((tab) => {
      const isCurrentTab = tab.id === currentTabId;
      return (
        <NavLink
          key={tab.id}
          to={tab.path ? `/property/${parcelId}/${tab.path}` : `/property/${parcelId}`}
          end={tab.path === ''}
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap uppercase tracking-wide"
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
  const session = useSession();
  const auth = useAuthContext();

  // Track whether this is initial mount (to avoid trace on mount)
  const isInitialMount = useRef(true);

  // Calculate current tab from path
  const currentTabId = useMemo(
    () => (parcelId ? getCurrentTabFromPath(location.pathname, parcelId) : 'summary'),
    [location.pathname, parcelId]
  );

  // Property data from store (backed by DataProvider → snapshot/live/fixtures)
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const propertyLoading = usePropertyStore((s) => s.activeParcelLoading);
  const selectParcel = usePropertyStore((s) => s.selectParcel);

  // Load parcel via store when parcelId changes (if not already loaded)
  useEffect(() => {
    if (parcelId && activeParcel?.parcelId !== parcelId) {
      selectParcel(parcelId);
    }
  }, [parcelId, activeParcel?.parcelId, selectParcel]);

  const propertyData = useMemo(
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

  // ── Work Mode state ──
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

  // ── Role-based tab visibility (auth claims first, session fallback) ──
  const countyId = auth.countyId ?? session.countyId;
  const userId = auth.userId ?? session.userId;
  const roles = useMemo(
    () => (auth.roles.length > 0 ? [...auth.roles] : session.role ? [session.role] : []),
    [auth.roles, session.role]
  );
  const { visibleTabs, hiddenCount, showAll, toggleShowAll } = useWorkbenchRoles(roles);

  /** Tabs filtered by role visibility — order preserved, never mutated */
  const filteredTabs = useMemo(
    () => WORKBENCH_TABS.filter((tab) => visibleTabs.includes(tab.id)),
    [visibleTabs]
  );

  /** SuiteCompass items filtered by role visibility */
  const compassItems = useMemo<SuiteCompassItem[]>(() => {
    const compassMap: Record<WorkbenchTabSlug, SuiteCompassItem> = {
      summary:  { slug: 'summary',  label: 'Summary',       shortLabel: 'Sum',     icon: '📊', affordance: 'Parcel at a glance',  color: 'var(--tf-accent)' },
      forge:    { slug: 'forge',    label: 'TerraForge',    shortLabel: 'Forge',   icon: '🔨', affordance: 'Build value',         color: 'var(--tf-suite-forge)' },
      atlas:    { slug: 'atlas',    label: 'TerraAtlas',    shortLabel: 'Atlas',   icon: '🗺️', affordance: 'See the county',      color: 'var(--tf-suite-atlas)' },
      dais:     { slug: 'dais',     label: 'TerraDais',     shortLabel: 'Dais',    icon: '⚖️', affordance: 'Operate value',       color: 'var(--tf-suite-dais)' },
      clerk:    { slug: 'clerk',    label: 'TerraClerk',    shortLabel: 'Clerk',   icon: '📜', affordance: 'Record & title',      color: 'var(--tf-accent)' },
      treasury: { slug: 'treasury', label: 'TerraTreasury', shortLabel: 'Treas',   icon: '💰', affordance: 'Tax collection',      color: 'var(--tf-accent)' },
      audit:    { slug: 'audit',    label: 'TerraAudit',    shortLabel: 'Audit',   icon: '🔍', affordance: 'Financial compliance', color: 'var(--tf-accent)' },
      dossier:  { slug: 'dossier',  label: 'TerraDossier',  shortLabel: 'Dossier', icon: '📋', affordance: 'Prove the decision',  color: 'var(--tf-suite-dossier)' },
      pilot:    { slug: 'pilot',    label: 'TerraPilot',    shortLabel: 'Pilot',   icon: '🤖', affordance: 'Act or draft',        color: 'var(--tf-accent)' },
    };
    return visibleTabs.map((slug) => compassMap[slug]);
  }, [visibleTabs]);

  // ── Badge state — collected from all suite providers ──
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;

    const ctx: WorkbenchContext = {
      countyId,
      userId,
      roles,
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
  }, [countyId, parcelId, roles, userId, workMode]);

  // ── Quick Actions — mode-aware, collected from providers ──
  const [quickActions, setQuickActions] = useState<QuickActionDefinition[]>([]);

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;

    const ctx: WorkbenchContext = {
      countyId,
      userId,
      roles,
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
  }, [countyId, parcelId, roles, userId, workMode]);

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
        actor: toOsActor(auth),
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
        className="flex items-center justify-center h-full"
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
    <div className={`flex flex-col h-full ${className}`} style={{ background: 'hsl(var(--tf-bg))' }}>
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
              actor: toOsActor(auth),
            }
          );
        }}
        onPopOut={handlePopOut}
      />

      {/* Workbench content: SuiteCompass (left on desktop) + Tab bar + Outlet */}
      <div className="flex flex-1 min-h-0">
        {/* Suite Compass — left rail (desktop only, SuiteCompass handles responsive internally) */}
        <div className="shrink-0 hidden lg:block">
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
            items={compassItems}
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Tab Navigation — filtered by role visibility */}
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <TabNavigation
                parcelId={parcelId}
                tabs={filteredTabs}
                currentTabId={currentTabId}
                emphasizedTabId={MODE_TAB_EMPHASIS[workMode]}
                onTabClick={handleTabClick}
              />
            </div>
            {hiddenCount > 0 && (
              <button
                onClick={toggleShowAll}
                className="shrink-0 px-3 py-1 mr-2 text-xs rounded transition-colors"
                style={{
                  color: showAll ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-text) / 0.4)',
                  background: showAll ? 'hsl(var(--tf-accent) / 0.1)' : 'transparent',
                }}
                title={showAll ? 'Show role-default tabs' : `Show all tabs (+${hiddenCount} hidden)`}
              >
                {showAll ? 'Role view' : `+${hiddenCount} more`}
              </button>
            )}
          </div>

          {/* Tab Content via React Router Outlet */}
          <main className="flex-1 overflow-auto p-2">
            <div className="min-h-full">
              <ErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <Outlet context={{ parcelId, propertyData, workMode }} />
                </Suspense>
              </ErrorBoundary>
            </div>
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
          className="flex items-center gap-2 w-full px-3 py-1 text-xs font-medium transition-colors"
          style={{
            color: 'hsl(var(--tf-text) / 0.5)',
            background: 'hsl(var(--tf-surface))',
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

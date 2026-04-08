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

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { usePropertyStore } from '../../stores/propertyStore';
import { ContextRibbon } from '../../components/workbench/ContextRibbon';
import { ActivityFeed } from '../../components/workbench/ActivityFeed';
import { BADGE_PROVIDERS } from '../../services/badges';
import { QUICK_ACTION_PROVIDERS } from '../../services/quickActions';
import { useParcelActivity } from '../../services/activityFeed';
import { WorkbenchTabCtx } from '../../context/workbenchTabContext';
import { emitTraceEvent } from '../../services/terraTrace';
import type { WorkbenchTabSlug, WorkMode, Badge, QuickActionDefinition, WorkbenchContext } from '../../contracts/workbench';
import { useWorkbenchRoles } from '../../hooks/useWorkbenchRoles';
import { validateWorkbenchHost } from '../../contracts/objectPlacement';
import type { WorkbenchHostViolation } from '../../contracts/objectPlacement';
import { useRecentParcels, openWorkbenchWindow } from '../../context/parcelContext';
import { useCompanionStore } from '../../stores/companionStore';
import { useParcelSearch } from '../../shell/command-palette/useParcelSearch';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useSession } from '../../auth/useSession';
import { useAuthContext } from '../../auth/useAuthContext';
import { cn } from '@/lib/utils';
import { buildContextRibbonFacts } from '../../components/workbench/parcelContextFacts';

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
// Tab → Component Map
// ============================================================================

const TAB_COMPONENTS: Record<WorkbenchTabSlug, React.LazyExoticComponent<React.FC>> = {
  summary: PropertySummary,
  forge: PropertyForge,
  atlas: PropertyAtlas,
  dais: PropertyDais,
  clerk: PropertyDossier,
  treasury: PropertyDais,
  audit: PropertyDossier,
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
}

// ============================================================================
// Constants
// ============================================================================

/** Canonical tab order — locked per spec. */
const TABS: readonly TabDef[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'forge', label: 'Forge' },
  { id: 'atlas', label: 'Atlas' },
  { id: 'dais', label: 'Dais' },
  { id: 'dossier', label: 'Dossier' },
  { id: 'pilot', label: 'Pilot' },
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
// Workbench Start Scene — Parcel Intake Surface
// ============================================================================

/** Plain panel wrapper (data surface — no glass per Liquid Glass spec) */
const StartGlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={cn('p-4 flex flex-col rounded-lg', className)} style={{ border: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-surface))' }}>
    {children}
  </div>
);

/** Section header */
const StartSectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="opacity-50">{icon}</span>
    <span
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
    >
      {title}
    </span>
  </div>
);

/** Clickable action row */
const StartActionRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  subtle?: boolean;
  shortcut?: string;
}> = ({ icon, label, sublabel, onClick, subtle = false, shortcut }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left',
      'transition-all duration-150',
      'hover:bg-[hsl(var(--tf-text)_/_0.08)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--tf-accent))]',
      subtle ? 'opacity-60 hover:opacity-90' : 'opacity-80 hover:opacity-100',
    )}
  >
    <span className="flex-shrink-0 opacity-60">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="text-sm font-medium truncate block" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-xs truncate block" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
          {sublabel}
        </span>
      )}
    </span>
    {shortcut && (
      <span
        className="ml-auto flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
        style={{
          color: 'hsl(var(--tf-text) / 0.35)',
          background: 'hsl(var(--tf-text) / 0.06)',
        }}
      >
        {shortcut}
      </span>
    )}
  </button>
);

/** Workbench Start Scene — parcel intake when no parcel is active */
const WorkbenchStartScene: React.FC = () => {
  const recentParcels = useRecentParcels();
  const openPalette = useCommandPaletteStore((s) => s.open);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Inline search
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading } = useParcelSearch(searchQuery, searchQuery.length >= 3);
  const [showResults, setShowResults] = useState(false);

  // Autofocus the search input
  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Show results when we have them
  useEffect(() => {
    setShowResults(results.length > 0);
  }, [results]);

  const handleSelectParcel = useCallback((parcelId: string) => {
    openWorkbenchWindow(parcelId);
  }, []);

  const handleResumeLast = useCallback(() => {
    if (recentParcels.length > 0) {
      openWorkbenchWindow(recentParcels[0]);
    }
  }, [recentParcels]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      openWorkbenchWindow(results[0].parcelNumber);
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      setShowResults(false);
    }
  }, [results]);

  return (
    <div className="h-full flex gap-3 p-6" style={{ background: 'hsl(var(--tf-bg))' }}>

      {/* ═══ Left Panel: Recent Parcels ═══ */}
      <div className="w-[240px] shrink-0 flex flex-col gap-3">
        <StartGlassCard className="flex-1">
          <StartSectionHeader icon={<span className="text-sm">&#128339;</span>} title="Recent Parcels" />
          <div className="flex flex-col gap-0.5 -mx-2.5 flex-1">
            {recentParcels.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 opacity-40">
                <span className="text-2xl">&#127970;</span>
                <p className="text-xs text-center" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  No recent parcels.
                  <br />
                  Use ⌘K to search.
                </p>
              </div>
            ) : (
              recentParcels.slice(0, 8).map((parcelId) => (
                <StartActionRow
                  key={parcelId}
                  icon={<span className="text-sm">&#127970;</span>}
                  label={parcelId}
                  onClick={() => handleSelectParcel(parcelId)}
                />
              ))
            )}
          </div>
        </StartGlassCard>
      </div>

      {/* ═══ Center Panel: Parcel Search ═══ */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <StartGlassCard className="flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <span className="text-4xl opacity-20">&#127970;</span>
            <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
              Property Workbench
            </h2>
            <p className="text-sm text-center" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              Search or select a parcel to begin
            </p>

            {/* Search input */}
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => results.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Search by parcel number, address, or owner..."
                className={cn(
                  'w-full px-4 py-3 rounded-lg text-sm',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2',
                )}
                style={{
                  background: 'hsl(var(--tf-text) / 0.06)',
                  color: 'hsl(var(--tf-text))',
                  border: '1px solid hsl(var(--tf-border) / 0.15)',
                }}
                aria-label="Search parcels"
              />
              {isLoading && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-spin"
                  style={{
                    border: '2px solid hsl(var(--tf-accent) / 0.2)',
                    borderTopColor: 'hsl(var(--tf-accent))',
                  }}
                />
              )}

              {/* Results dropdown */}
              {showResults && results.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-10"
                  style={{
                    background: 'hsl(var(--tf-bg-surface))',
                    border: '1px solid hsl(var(--tf-border) / 0.2)',
                    boxShadow: '0 4px 12px hsl(0 0% 0% / 0.3)',
                  }}
                >
                  {results.map((r) => (
                    <button
                      key={r.parcelNumber}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectParcel(r.parcelNumber)}
                      className={cn(
                        'flex flex-col w-full px-4 py-2.5 text-left',
                        'transition-colors duration-100',
                        'hover:bg-[hsl(var(--tf-text)_/_0.06)]',
                      )}
                    >
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
                        {r.parcelNumber}
                      </span>
                      <span className="text-xs" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                        {r.address}{r.ownerName ? ` — ${r.ownerName}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs" style={{ color: 'hsl(var(--tf-text) / 0.3)' }}>
              Press ⌘K for full search
            </p>
          </div>
        </StartGlassCard>
      </div>

      {/* ═══ Right Panel: Quick Actions ═══ */}
      <div className="w-[240px] shrink-0 flex flex-col gap-3">
        <StartGlassCard className="flex-1">
          <StartSectionHeader icon={<span className="text-sm">&#9889;</span>} title="Quick Actions" />
          <div className="flex flex-col gap-0.5 -mx-2.5">
            <StartActionRow
              icon={<span className="text-sm">&#128269;</span>}
              label="Search Parcels"
              onClick={openPalette}
              shortcut="⌘K"
            />
            {recentParcels.length > 0 && (
              <StartActionRow
                icon={<span className="text-sm">&#9654;</span>}
                label="Resume Last Parcel"
                sublabel={recentParcels[0]}
                onClick={handleResumeLast}
              />
            )}
          </div>
        </StartGlassCard>
      </div>

    </div>
  );
};

// ============================================================================
// Phase 7: Workbench Host Violation Notice
// ============================================================================

const WorkbenchHostViolationNotice: React.FC<{ violation: WorkbenchHostViolation }> = ({ violation }) => {
  // Log the violation to console for governance traceability
  if (typeof console !== 'undefined') {
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
  /** Filtered tabs to display (Phase 2 role visibility) */
  tabs?: readonly TabDef[];
  /** Number of hidden tabs (for toggle badge) */
  hiddenCount?: number;
  /** Whether showing all tabs */
  showAll?: boolean;
  /** Toggle show-all override */
  onToggleShowAll?: () => void;
}

const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  tabs = TABS,
  hiddenCount = 0,
  showAll = false,
  onToggleShowAll,
}) => (
  <div className="flex items-center">
    <nav
      className="flex-1 min-w-0 border-b px-4 flex gap-1 overflow-x-auto"
      style={{
        borderColor: 'hsl(var(--tf-border) / 0.4)',
        background: 'hsl(var(--tf-surface) / 0.92)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              color: isActive ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-text) / 0.6)',
              borderBottom: isActive ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
              background: isActive ? 'hsl(var(--tf-accent) / 0.08)' : 'transparent',
            }}
            aria-selected={isActive}
            role="tab"
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
    {hiddenCount > 0 && onToggleShowAll && (
      <button
        onClick={onToggleShowAll}
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
  const session = useSession();
  const auth = useAuthContext();

  // Resolve initial tab from metadata slug
  const resolvedInitialTab = useMemo<WorkbenchTabSlug>(() => {
    if (!initialTab || initialTab === '/' as string) return 'summary';
    if (initialTab === 'clerk' || initialTab === 'audit') return 'dossier';
    if (initialTab === 'treasury') return 'dais';
    const valid = TABS.find((t) => t.id === initialTab);
    return valid?.id ?? 'summary';
  }, [initialTab]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<WorkbenchTabSlug>(resolvedInitialTab);

  // Sync initial tab to companion context bus on mount
  const setCompanionTabOnMount = useCompanionStore((state) => state.setActiveTab);
  useEffect(() => {
    setCompanionTabOnMount(resolvedInitialTab);
    return () => { setCompanionTabOnMount(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const parcelFacts = useMemo(
    () => buildContextRibbonFacts(activeParcel).slice(0, 6),
    [activeParcel]
  );

  // Work Mode state
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

  // ── Role-based tab visibility (auth claims first, session fallback) ──
  const countyId = auth.countyId ?? session.countyId;
  const userId = auth.userId ?? session.userId;
  const roles = useMemo(
    () => (auth.roles.length > 0 ? [...auth.roles] : session.role ? [session.role] : []),
    [auth.roles, session.role]
  );
  const { visibleTabs, hiddenCount, showAll, toggleShowAll } = useWorkbenchRoles(roles);

  /** Tabs filtered by role visibility — order preserved */
  const filteredTabs = useMemo(
    () => TABS.filter((tab) => visibleTabs.includes(tab.id)),
    [visibleTabs]
  );

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

  // Quick Actions — mode-aware, collected from providers
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

  // Pop out to full-screen route
  const handlePopOut = useCallback(() => {
    if (parcelId) {
      window.open(`/property/${encodeURIComponent(parcelId)}`, '_self');
    }
  }, [parcelId]);

  // Tab change handler
  const setCompanionTab = useCompanionStore((state) => state.setActiveTab);
  const handleTabChange = useCallback((slug: WorkbenchTabSlug) => {
    const previousTab = activeTab;
    setActiveTab(slug);
    setCompanionTab(slug);
    emitTraceEvent('tab_switched', 'workbench', parcelId ?? 'unknown', { tab: previousTab }, { tab: slug });
  }, [activeTab, parcelId, setCompanionTab]);

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

  // No parcel selected — show parcel intake scene
  if (!parcelId) {
    return <WorkbenchStartScene />;
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
        parcelFacts={parcelFacts}
        quickActions={quickActions}
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        onPopOut={handlePopOut}
      />

      {/* Workbench content — state-based tabs, no Router needed */}
      <WorkbenchTabCtx.Provider value={tabContextValue}>
        <div className="flex flex-1 min-h-0">
          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0">
            <TabBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              tabs={filteredTabs}
              hiddenCount={hiddenCount}
              showAll={showAll}
              onToggleShowAll={toggleShowAll}
            />
            {/*
              Stable tabpanel containers — one per top tab entry.
              Inactive panels use the HTML `hidden` attribute (display:none),
              meaning AT skips them and they cost nothing in layout.
              Content is only mounted when the tab is active (lazy).
            */}
            <main className="flex-1 overflow-auto">
              {filteredTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const TabComponent = TAB_COMPONENTS[tab.id];
                return (
                  <section
                    key={tab.id}
                    id={`panel-${tab.id}`}
                    role="tabpanel"
                    aria-label={tab.label}
                    hidden={!isActive}
                  >
                    {isActive && (
                      hostViolation ? (
                        <WorkbenchHostViolationNotice violation={hostViolation} />
                      ) : loading ? (
                        <TabLoader />
                      ) : (
                        <ErrorBoundary>
                          <Suspense fallback={<TabLoader />}>
                            <TabComponent />
                          </Suspense>
                        </ErrorBoundary>
                      )
                    )}
                  </section>
                );
              })}
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
            background: 'hsl(var(--tf-bg-surface))',
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

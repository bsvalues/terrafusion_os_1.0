/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - PROPERTY WORKBENCH
 * Phase 5: Tier-0 OS Surface (Parcel-Context Hub)
 *
 * The unified parcel view with canonical tab order.
 * All suite views for a given parcel are orchestrated here.
 *
 * Route: /property/:parcelId/*
 *
 * Tab Order (Locked):
 * 1. Summary - Property overview
 * 2. Forge - AI valuation & appeals
 * 3. Atlas - GIS & mapping
 * 4. Dais - Workflow status
 * 5. Dossier - Documents
 * 6. Pilot - Tool execution log
 *
 * @see Slice 19: Workbench action instrumentation with trace emission
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { Suspense, lazy, useCallback, useMemo, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';

// ============================================================================
// Types
// ============================================================================

interface WorkbenchTab {
  id: string;
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
function getCurrentTabFromPath(pathname: string, parcelId: string): string {
  const basePath = `/property/${parcelId}`;
  const pathAfterBase = pathname.replace(basePath, '').replace(/^\//, '');

  // Map path to tab ID
  if (!pathAfterBase || pathAfterBase === '') return 'summary';
  const tabPathMap: Record<string, string> = {
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

// ============================================================================
// Tab Content Components (Lazy Loaded)
// ============================================================================

// Placeholder components - in production, these would be real suite integrations
const PropertySummary = lazy(() => import('./tabs/PropertySummary'));
const PropertyForge = lazy(() => import('./tabs/PropertyForge'));
const PropertyAtlas = lazy(() => import('./tabs/PropertyAtlas'));
const PropertyDais = lazy(() => import('./tabs/PropertyDais'));
const PropertyDossier = lazy(() => import('./tabs/PropertyDossier'));
const PropertyPilot = lazy(() => import('./tabs/PropertyPilot'));

// ============================================================================
// Components
// ============================================================================

/**
 * Loading skeleton for tab content
 */
const TabLoader: React.FC = () => (
  <div className='flex items-center justify-center h-64'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2'></div>
      <p className='text-white/60 text-sm'>Loading...</p>
    </div>
  </div>
);

/**
 * Property Header - Shows parcel info and navigation
 */
const PropertyHeader: React.FC<{
  parcelId: string;
  address?: string;
  onBack: () => void;
}> = ({ parcelId, address, onBack }) => (
  <header className='bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-6 py-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <button
          onClick={onBack}
          className='p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'
          title='Back to Home'
        >
          <svg
            className='w-5 h-5 text-white/70'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
        </button>
        <div>
          <h1 className='text-xl font-bold text-white flex items-center gap-2'>
            <span>🏠</span>
            <span>Parcel {parcelId}</span>
          </h1>
          {address && <p className='text-white/60 text-sm'>{address}</p>}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <span className='px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full'>
          Active
        </span>
      </div>
    </div>
  </header>
);

/**
 * Tab Navigation - Locked order tabs with trace emission
 */
const TabNavigation: React.FC<{
  parcelId: string;
  tabs: WorkbenchTab[];
  currentTabId: string;
  onTabClick: (tab: WorkbenchTab, isActive: boolean) => void;
}> = ({ parcelId, tabs, currentTabId, onTabClick }) => (
  <nav className='bg-slate-900/50 border-b border-white/10 px-6'>
    <div className='flex gap-1 overflow-x-auto'>
      {tabs.map((tab) => {
        const isCurrentTab = tab.id === currentTabId;
        return (
          <NavLink
            key={tab.id}
            to={tab.path ? `/property/${parcelId}/${tab.path}` : `/property/${parcelId}`}
            end={tab.path === ''}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
              ${
                isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }
              ${!tab.enabled ? 'opacity-50 cursor-not-allowed' : ''}`
            }
            onClick={(e) => {
              if (!tab.enabled) {
                e.preventDefault();
                return;
              }
              // Emit trace for user-initiated tab switch (not current tab)
              onTabClick(tab, isCurrentTab);
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  </nav>
);

// ============================================================================
// Property Workbench Component
// ============================================================================

export interface PropertyWorkbenchProps {
  className?: string;
}

/**
 * PropertyWorkbench - The parcel-context hub
 *
 * Route: /property/:parcelId/*
 *
 * This is the unified view for a parcel with all suite tabs.
 * Users arrive here after selecting a parcel from Shell Home.
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

  // Mock property data (in production, fetch from API)
  const propertyData = useMemo(
    () => ({
      parcelId: parcelId || 'Unknown',
      address: '123 Main Street, Richland, WA 99352',
      owner: 'John Doe',
      assessedValue: 425000,
    }),
    [parcelId]
  );

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Handle tab click - emits OS action trace for user-initiated tab switches
   * Only emits if:
   * 1. Tab is not currently active (no duplicate trace)
   * 2. Tab is enabled (disabled tabs emit blocked trace)
   */
  const handleTabClick = useCallback(
    (tab: WorkbenchTab, isCurrentTab: boolean) => {
      // Mark as no longer initial mount after first interaction
      isInitialMount.current = false;

      // Don't emit trace if clicking current tab
      if (isCurrentTab) {
        return;
      }

      // Build target href
      const targetHref = tab.path ? `/property/${parcelId}/${tab.path}` : `/property/${parcelId}`;

      // Create action for tab switch
      const action: OsAction = {
        id: 'workbench_tab_switch',
        label: `Switch to ${tab.label}`,
        intent: 'workbench',
        href: targetHref,
        disabled: !tab.enabled,
        disabledReason: !tab.enabled ? 'Tab is currently disabled' : undefined,
      };

      // Create context with workbench surface and tab metadata
      const context: OsActionContext = {
        navigate: () => {
          // Navigation is handled by NavLink's default behavior
          // We just need to emit the trace
        },
        suiteId: 'workbench',
        surface: 'workbench',
        moduleId: 'workbench_tabs',
        parcelIdHash: parcelId ? hashParcelId(parcelId) : undefined,
        tabId: tab.id,
      };

      // Execute action (emits trace, but navigation is handled by NavLink)
      executeOsAction(action, context);
    },
    [parcelId]
  );

  if (!parcelId) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-slate-900' data-testid='workbench-no-parcel'>
        <div className='text-center p-8'>
          <h2 className='text-2xl font-bold text-white mb-2'>No Parcel Selected</h2>
          <p className='text-white/60 mb-4'>Search for a parcel to view the Property Workbench.</p>
          <button
            onClick={handleBack}
            className='px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors'
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-slate-900 ${className}`}>
      {/* Header */}
      <PropertyHeader
        parcelId={propertyData.parcelId}
        address={propertyData.address}
        onBack={handleBack}
      />

      {/* Tab Navigation */}
      <TabNavigation
        parcelId={parcelId}
        tabs={WORKBENCH_TABS}
        currentTabId={currentTabId}
        onTabClick={handleTabClick}
      />

      {/* Tab Content */}
      <main className='flex-1 overflow-auto p-6'>
        <ErrorBoundary>
          <Suspense fallback={<TabLoader />}>
            <Outlet context={{ parcelId, propertyData }} />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default PropertyWorkbench;

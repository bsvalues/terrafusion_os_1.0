/**
 * TerraFusion OS — canonical Property Workbench surface.
 *
 * This component owns the parcel load/auth/ribbon/activity behavior.
 * Route and OS-window adapters provide only navigation and tab rendering.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { ActivityFeed } from '../../components/workbench/ActivityFeed';
import { ContextRibbon } from '../../components/workbench/ContextRibbon';
import { buildContextRibbonFacts as buildContextRibbonFactsBase } from '../../components/workbench/parcelContextFacts';
import type { WorkbenchSegmentHandoffContext, WorkbenchTabData } from '../../context/workbenchTabContext';
import type { Badge, QuickActionDefinition, WorkbenchContext, WorkbenchTabSlug, WorkMode } from '../../contracts/workbench';
import { useAuthContext, toOsActor } from '../../auth/useAuthContext';
import { useSession } from '../../auth/useSession';
import { useWorkbenchRoles } from '../../hooks/useWorkbenchRoles';
import { useParcelActivity } from '../../services/activityFeed';
import { BADGE_PROVIDERS } from '../../services/badges';
import { executeOsAction } from '../../services/osActions';
import { QUICK_ACTION_PROVIDERS } from '../../services/quickActions';
import { usePropertyStore } from '../../stores/propertyStore';
import { activateModule } from '../../orchestration/moduleActivation';

export interface WorkbenchTab {
  id: WorkbenchTabSlug;
  label: string;
  path: string;
  enabled: boolean;
}

export interface PropertyWorkbenchSurfaceNavigationArgs {
  tabs: WorkbenchTab[];
  parcelId: string;
  currentTabId: WorkbenchTabSlug;
}

export interface PropertyWorkbenchSurfaceProps {
  parcelId?: string | null;
  currentTabId: WorkbenchTabSlug;
  className?: string;
  segmentHandoff?: WorkbenchSegmentHandoffContext | null;
  rolesOverride?: readonly string[];
  showBreadcrumb?: boolean;
  buildContextRibbonFacts?: typeof buildContextRibbonFactsBase;
  onBack: () => void;
  onSearch: () => void;
  onPopOut?: () => void;
  renderNavigation: (args: PropertyWorkbenchSurfaceNavigationArgs) => React.ReactNode;
  renderContent: (context: WorkbenchTabData) => React.ReactNode;
}

export const WORKBENCH_TABS: WorkbenchTab[] = [
  { id: 'summary', label: 'Summary', path: '', enabled: true },
  { id: 'forge', label: 'Forge', path: 'forge', enabled: true },
  { id: 'atlas', label: 'Atlas', path: 'atlas', enabled: true },
  { id: 'dais', label: 'Dais', path: 'dais', enabled: true },
  { id: 'clerk', label: 'Clerk', path: 'clerk', enabled: true },
  { id: 'treasury', label: 'Treasury', path: 'treasury', enabled: true },
  { id: 'audit', label: 'Audit', path: 'audit', enabled: true },
  { id: 'dossier', label: 'Dossier', path: 'dossier', enabled: true },
  { id: 'pilot', label: 'Pilot', path: 'pilot', enabled: true },
];

export function hashParcelId(parcelId: string): string {
  let hash = 5381;
  for (let i = 0; i < parcelId.length; i++) {
    hash = (hash * 33) ^ parcelId.charCodeAt(i);
  }
  return `hash_${(hash >>> 0).toString(16)}`;
}

export function getCurrentTabFromPath(pathname: string, parcelId: string): WorkbenchTabSlug {
  const basePath = `/property/${parcelId}`;
  const pathAfterBase = pathname.replace(basePath, '').replace(/^\//, '');

  if (!pathAfterBase) return 'summary';
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

export function hasUsableWorkbenchToken(token: string | null): boolean {
  if (!token || token === 'dev-preview-token') return false;
  try {
    const [, payload] = token.split('.');
    if (!payload) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
    if (typeof decoded.exp !== 'number') return false;
    return decoded.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
}

export const TabLoader: React.FC = () => (
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

export const PropertyWorkbenchSurface: React.FC<PropertyWorkbenchSurfaceProps> = ({
  parcelId,
  currentTabId,
  className = '',
  segmentHandoff = null,
  rolesOverride,
  showBreadcrumb = true,
  buildContextRibbonFacts = buildContextRibbonFactsBase,
  onBack,
  onSearch,
  onPopOut,
  renderNavigation,
  renderContent,
}) => {
  const session = useSession();
  const auth = useAuthContext();

  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const propertyLoading = usePropertyStore((s) => s.activeParcelLoading);
  const activeParcelError = usePropertyStore((s) => s.activeParcelError);
  const selectParcel = usePropertyStore((s) => s.selectParcel);
  const hasWorkbenchAuth = hasUsableWorkbenchToken(auth.token);
  const [authWaitExpired, setAuthWaitExpired] = useState(false);

  useEffect(() => {
    if (!parcelId || hasWorkbenchAuth) {
      setAuthWaitExpired(false);
      return;
    }

    const timer = window.setTimeout(() => setAuthWaitExpired(true), 8_000);
    return () => window.clearTimeout(timer);
  }, [hasWorkbenchAuth, parcelId]);

  useEffect(() => {
    if (parcelId && hasWorkbenchAuth && activeParcel?.parcelId !== parcelId) {
      selectParcel(parcelId);
    }
  }, [parcelId, hasWorkbenchAuth, activeParcel?.parcelId, selectParcel]);

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
    [activeParcel, parcelId],
  );

  const parcelFacts = useMemo(
    () => buildContextRibbonFacts(activeParcel).slice(0, 6),
    [activeParcel, buildContextRibbonFacts],
  );

  const countyId = auth.countyId ?? session.countyId;
  const userId = auth.userId ?? session.userId;
  const roles = useMemo(
    () => (rolesOverride ? [...rolesOverride] : auth.roles.length > 0 ? [...auth.roles] : session.role ? [session.role] : []),
    [auth.roles, rolesOverride, session.role],
  );
  const { visibleTabs } = useWorkbenchRoles(roles);

  const filteredTabs = useMemo(
    () => WORKBENCH_TABS.filter((tab) => visibleTabs.includes(tab.id)),
    [visibleTabs],
  );

  const [badges, setBadges] = useState<Badge[]>([]);
  const [workMode, setWorkMode] = useState<WorkMode>('overview');

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;
    const ctx: WorkbenchContext = { countyId, userId, roles, parcelId, workMode };

    Promise.allSettled(BADGE_PROVIDERS.map((p) => p.getBadges(parcelId, ctx))).then((results) => {
      if (cancelled) return;
      const allBadges: Badge[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') allBadges.push(...result.value);
      }
      setBadges(allBadges);
    });

    return () => {
      cancelled = true;
    };
  }, [countyId, parcelId, roles, userId, workMode]);

  const [quickActions, setQuickActions] = useState<QuickActionDefinition[]>([]);

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;
    const ctx: WorkbenchContext = { countyId, userId, roles, parcelId, workMode };

    Promise.allSettled(QUICK_ACTION_PROVIDERS.map((p) => p.getActions(ctx))).then((results) => {
      if (cancelled) return;
      const all: QuickActionDefinition[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') all.push(...result.value);
      }
      setQuickActions(all);
    });

    return () => {
      cancelled = true;
    };
  }, [countyId, parcelId, roles, userId, workMode]);

  const [activityOpen, setActivityOpen] = useState(false);
  const { entries: activityEntries, loading: activityLoading } = useParcelActivity(parcelId);

  const handleQuickAction = useCallback(
    (action: QuickActionDefinition) => {
      if (!parcelId) return;
      executeOsAction(
        {
          id: action.id,
          label: action.label,
          intent: 'pilot-tool',
          disabled: false,
        },
        {
          navigate: () => undefined,
          suiteId: 'workbench',
          surface: 'context-ribbon',
          moduleId: 'quick-actions',
          parcelIdHash: hashParcelId(parcelId),
          actor: toOsActor(auth),
        },
      );
    },
    [auth, parcelId],
  );

  const handleSegmentBackToCountyStudio = useCallback(() => {
    if (!segmentHandoff) return;

    void activateModule('county-studio', {
      source: 'system',
      metadata: {
        segmentId: segmentHandoff.segmentId,
        segmentLabel: segmentHandoff.segmentLabel,
        studyId: segmentHandoff.studyId,
        countyId: segmentHandoff.countyId,
        sourceSuite: segmentHandoff.source,
        countyStudioHandoff: segmentHandoff.handoffTemplate,
        exceptionSetId: segmentHandoff.exceptionSetId,
        downstreamReceiptId: segmentHandoff.downstreamReceiptId,
        downstreamStatus: segmentHandoff.downstreamStatus,
      },
    });
  }, [segmentHandoff]);

  if (!parcelId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 p-8"
        style={{ color: 'hsl(var(--tf-text) / 0.6)', background: 'hsl(var(--tf-bg))' }}
        data-testid="workbench-no-parcel"
      >
        <div className="text-[11px] uppercase tracking-widest" style={{ color: 'hsl(var(--tf-muted) / 0.88)' }}>
          Property Workbench
        </div>
        <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
          No Parcel Selected
        </h2>
        <p className="text-sm text-center max-w-md">
          Search for a parcel to view the Property Workbench.
        </p>
        {segmentHandoff && (
          <div
            className="w-full max-w-lg rounded-lg p-4 text-left"
            style={{
              background: 'hsl(var(--tf-surface))',
              border: '1px solid hsl(var(--tf-border) / 0.45)',
              color: 'hsl(var(--tf-text) / 0.82)',
            }}
            data-testid="workbench-segment-handoff-card"
          >
            <div className="text-[11px] uppercase tracking-widest" style={{ color: 'hsl(var(--tf-muted) / 0.88)' }}>
              County Studio Context
            </div>
            <h3 className="mt-1 text-base font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {segmentHandoff.segmentLabel ?? segmentHandoff.segmentId}
            </h3>
            <p className="mt-2 text-sm">
              Segment handoff is preserved, but no parcel is selected for Workbench runtime.
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt style={{ color: 'hsl(var(--tf-muted))' }}>Handoff</dt>
                <dd>{segmentHandoff.handoffTemplate ?? 'Not specified'}</dd>
              </div>
              <div>
                <dt style={{ color: 'hsl(var(--tf-muted))' }}>Downstream Status</dt>
                <dd>{segmentHandoff.downstreamStatus ?? 'Not returned'}</dd>
              </div>
              <div>
                <dt style={{ color: 'hsl(var(--tf-muted))' }}>Receipt</dt>
                <dd>{segmentHandoff.downstreamReceiptId ?? 'Not returned'}</dd>
              </div>
              <div>
                <dt style={{ color: 'hsl(var(--tf-muted))' }}>Study</dt>
                <dd>{segmentHandoff.studyId ?? 'Not specified'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleSegmentBackToCountyStudio}
              className="mt-4 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'hsl(var(--tf-surface-alt, var(--tf-surface)))',
                color: 'hsl(var(--tf-text))',
                border: '1px solid hsl(var(--tf-border) / 0.45)',
              }}
              data-testid="workbench-segment-back-county-studio"
            >
              Back to County Studio
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'hsl(var(--tf-accent))', color: 'hsl(var(--tf-text))' }}
          >
            Search Parcels
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'hsl(var(--tf-surface))',
              color: 'hsl(var(--tf-text))',
              border: '1px solid hsl(var(--tf-border) / 0.45)',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!hasWorkbenchAuth) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 p-8"
        style={{ color: 'hsl(var(--tf-text) / 0.72)', background: 'hsl(var(--tf-bg))' }}
        data-testid={authWaitExpired ? 'workbench-auth-error' : 'workbench-auth-bootstrap'}
        role={authWaitExpired ? 'alert' : undefined}
      >
        <div className="text-[11px] uppercase tracking-widest" style={{ color: 'hsl(var(--tf-muted) / 0.88)' }}>
          Property Workbench
        </div>
        <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
          {authWaitExpired ? 'Workbench authentication unavailable' : 'Preparing authenticated Workbench session'}
        </h2>
        <p className="text-sm text-center max-w-lg">
          {authWaitExpired
            ? 'A valid Workbench auth token was not available, so parcel data was not requested.'
            : `Waiting for a valid Benton Workbench token before loading parcel ${parcelId}.`}
        </p>
      </div>
    );
  }

  const parcelLoadPending = Boolean(parcelId && activeParcel?.parcelId !== parcelId && !activeParcelError);

  if (propertyLoading || parcelLoadPending) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'hsl(var(--tf-bg))' }}>
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

  if (activeParcelError) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 p-8"
        style={{ color: 'hsl(var(--tf-text) / 0.72)', background: 'hsl(var(--tf-bg))' }}
        data-testid="workbench-parcel-load-error"
        role="alert"
      >
        <div className="text-[11px] uppercase tracking-widest" style={{ color: 'hsl(var(--tf-muted) / 0.88)' }}>
          Property Workbench
        </div>
        <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
          Parcel data unavailable
        </h2>
        <p className="text-sm text-center max-w-lg">{activeParcelError}</p>
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'hsl(var(--tf-accent))', color: 'hsl(var(--tf-text))' }}
          >
            Search Properties
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'hsl(var(--tf-surface))',
              color: 'hsl(var(--tf-text))',
              border: '1px solid hsl(var(--tf-border) / 0.45)',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tabContext: WorkbenchTabData = {
    parcelId,
    propertyData,
    workMode,
    segmentHandoff,
  };

  return (
    <div className={`flex flex-col h-full ${className}`} style={{ background: 'hsl(var(--tf-bg))' }} data-testid="property-workbench-root">
      {showBreadcrumb && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.375rem 1rem',
            background: 'hsl(var(--tf-surface) / 0.9)',
            borderBottom: '1px solid hsl(var(--tf-border) / 0.4)',
            fontSize: '0.75rem',
            color: 'hsl(var(--tf-muted))',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'hsl(var(--tf-muted))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
            }}
            aria-label="Go to Home"
          >
            <Home size={12} />
            <span>Home</span>
          </button>
          <ChevronRight size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
          <button
            onClick={onSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'hsl(var(--tf-muted))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
            }}
            aria-label="Go to Property Search"
          >
            Property Search
          </button>
          <ChevronRight size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
          <span style={{ color: 'hsl(var(--tf-text) / 0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parcelId}
          </span>
        </nav>
      )}

      <ContextRibbon
        parcelId={propertyData.parcelId}
        address={propertyData.address}
        owner={propertyData.owner}
        countyName="Benton County"
        badges={badges}
        parcelFacts={parcelFacts}
        quickActions={quickActions}
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        onQuickAction={handleQuickAction}
        onPopOut={onPopOut}
      />

      <div className="flex flex-row flex-1 min-h-0">
        {renderNavigation({ tabs: filteredTabs, parcelId, currentTabId })}
        <main className="flex-1 overflow-auto p-2" style={{ minWidth: 0, paddingBottom: '80px' }}>
          <div className="min-h-full">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>{renderContent(tabContext)}</Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <div className="shrink-0" style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}>
        <button
          onClick={() => setActivityOpen((o) => !o)}
          className="flex items-center gap-2 w-full px-3 py-1 text-xs font-medium transition-colors"
          style={{ color: 'hsl(var(--tf-text) / 0.5)', background: 'hsl(var(--tf-surface))' }}
          aria-expanded={activityOpen}
          aria-controls="workbench-activity-feed"
        >
          <span>{activityOpen ? '▼' : '▶'}</span>
          <span>Activity ({activityEntries.length})</span>
        </button>
        {activityOpen && (
          <div id="workbench-activity-feed" className="max-h-48 overflow-auto">
            {activityLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
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

export default PropertyWorkbenchSurface;

/** @deprecated Phase 8 deletion candidate. Replaced by StageZeroState (County Operations Scene). */

/**
 * TerraFusion OS - Shell Home
 *
 * macOS Tahoe-inspired OS landing surface.
 * Layout: Top System Bar → Stage (search + suite grid + recents) → Dock
 *
 * Uses design primitives:
 * - TerraSphere (brand logo in header)
 * - TerraSphereIcon (suite tile icons with category colors)
 * - Lucide icons (system entrypoints, search, UI elements)
 * - LiquidPanel (glass containers)
 * - TactileButton (interactive controls)
 * - Design tokens (no ad-hoc CSS values)
 *
 * @module shell/home/ShellHome
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import {
  CONSTITUTIONAL_SUITES,
  getStandaloneSuites,
  getSuiteIntent,
  getWorkbenchHrefWithContext,
  INTENT_LABELS,
  isWorkbenchSuite,
  type SuiteId,
} from '../../config/suiteRegistry';
import { getLucideIcon } from '../../config/iconMap';
import { useParcelContext, useRecentParcels } from '../../context/parcelContext';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { LiquidPanel, TactileButton } from '../../ui/materials';
import { TerraSphere } from '../../ui/brand/TerraSphere';
import { TerraSphereIcon, type TerraSphereIconVariant } from '../../ui/brand/TerraSphereIcon';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { SystemHealthPanel } from '../../components/SystemHealthPanel';
import { PacsProofCard } from '../../components/PacsProofCard';
import { PropertySearchWidget } from '../../components/PropertySearchWidget';
import { useParcelContextActions } from '../../context/parcelContext';
import { BentonCountyConfigService } from '../../services/BentonCountyConfig';

// ============================================================================
// Icon + variant mapping (replaces emoji ICON_MAP)
// ============================================================================

/** Maps suite iconName → Lucide icon name for getLucideIcon */
const SUITE_LUCIDE_MAP: Record<string, string> = {
  Hammer: 'HardHat',
  Globe: 'Globe',
  LayoutDashboard: 'LayoutDashboard',
  FileStack: 'FileText',
  Bot: 'Brain',
  Compass: 'Terminal',
  Activity: 'Activity',
  Code: 'Terminal',
};

/** Maps suite id → TerraSphereIcon variant for category coloring */
const SUITE_SPHERE_VARIANT: Record<string, TerraSphereIconVariant> = {
  forge: 'assessment',
  atlas: 'mapping',
  dais: 'analytics',
  dossier: 'records',
  gpt: 'ai',
  pilot: 'system',
  trace: 'system',
  canon: 'system',
  prime: 'default',
};

/** Suite gradient backgrounds using design tokens */
const SUITE_GRADIENTS: Record<string, string> = {
  forge: 'linear-gradient(140deg, hsl(var(--tf-warning-hs) 55% / 0.85), hsl(var(--tf-error-hs) 52% / 0.8))',
  atlas: 'linear-gradient(140deg, hsl(var(--tf-network-blue-hs) 58% / 0.85), hsl(var(--tf-transcend-cyan-hs) 50% / 0.8))',
  dais: 'linear-gradient(140deg, hsl(var(--tf-info-hs) 56% / 0.85), hsl(var(--tf-info-hs) 66% / 0.8))',
  dossier: 'linear-gradient(140deg, hsl(var(--tf-success-hs) 50% / 0.85), hsl(var(--tf-transcend-cyan-hs) 45% / 0.75))',
  gpt: 'linear-gradient(140deg, hsl(var(--tf-info-hs) 60% / 0.85), hsl(var(--tf-network-blue-hs) 58% / 0.8))',
};

// ============================================================================
// Types
// ============================================================================

interface SuiteCardModel {
  id: string;
  name: string;
  description: string;
  iconName: string;
  route: string;
  intent: 'workbench' | 'standalone';
  gradient: string;
}

interface OSEntrypoint {
  id: string;
  name: string;
  description: string;
  iconName: string;
  route: string;
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

// ============================================================================
// Data builders
// ============================================================================

function buildSuiteCards(parcelId: string | null): SuiteCardModel[] {
  return CONSTITUTIONAL_SUITES.map((suite) => {
    const route = isWorkbenchSuite(suite)
      ? getWorkbenchHrefWithContext(suite, parcelId).href
      : suite.route;
    return {
      id: suite.id,
      name: suite.displayName,
      description: suite.description,
      iconName: suite.iconName,
      route,
      intent: getSuiteIntent(suite.id as SuiteId),
      gradient: SUITE_GRADIENTS[suite.id] || 'linear-gradient(140deg, hsl(var(--tf-surface)), hsl(var(--tf-surface-2)))',
    };
  });
}

const OS_ENTRYPOINTS: OSEntrypoint[] = [
  ...getStandaloneSuites().map((feature) => ({
    id: feature.id,
    name: feature.homeMeta.title || feature.displayName,
    description: feature.description,
    iconName: feature.iconName,
    route: feature.route,
  })),
  {
    id: 'prime',
    name: 'TerraPrime',
    description: 'Property viewer',
    iconName: 'Building2',
    route: '/property',
  },
];

// ============================================================================
// Sub-components
// ============================================================================

/** Search bar with glass effect and Lucide search icon */
const StageSearch: React.FC<{
  onSearch: (query: string) => void;
  onFocusPalette: () => void;
}> = ({ onSearch, onFocusPalette }) => {
  const [query, setQuery] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = query.trim();
        if (v) onSearch(v);
      }}
      className='w-full'
    >
      <div className='relative'>
        <Search
          className='absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none'
          size={18}
          style={{ color: 'hsl(var(--tf-muted))' }}
        />
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocusPalette}
          placeholder='Search parcels, cases, persons, documents...'
          aria-label='Search parcels'
          style={{
            width: '100%',
            padding: '0.85rem 3.5rem 0.85rem 2.75rem',
            borderRadius: '0.875rem',
            border: '1px solid hsl(var(--tf-border) / 0.5)',
            background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.5)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            color: 'hsl(var(--tf-text))',
            fontSize: '0.95rem',
            outline: 'none',
            boxShadow: '0 4px 20px hsl(var(--tf-tokens-black-hs) 0% / 0.2)',
          }}
        />
        <div className='absolute right-2 top-1/2 -translate-y-1/2'>
          <TactileButton type='submit' variant='primary' size='sm' aria-label='Search'>
            <ChevronRight size={16} />
          </TactileButton>
        </div>
      </div>
      <div
        style={{
          marginTop: '0.4rem',
          fontSize: '0.72rem',
          color: 'hsl(var(--tf-muted))',
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <kbd
          style={{
            border: '1px solid hsl(var(--tf-border) / 0.4)',
            borderRadius: '0.25rem',
            padding: '0.1rem 0.35rem',
            background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.4)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
          }}
        >
          Ctrl+K
        </kbd>
        <span>Command Palette</span>
      </div>
    </form>
  );
};

/** Suite tile with TerraSphereIcon + Lucide glyph overlay */
const SuiteTile: React.FC<{
  suite: SuiteCardModel;
  onLaunch: () => void;
}> = ({ suite, onLaunch }) => {
  const intentLabel = INTENT_LABELS[suite.intent];
  const LucideIcon = getLucideIcon(SUITE_LUCIDE_MAP[suite.iconName] || suite.iconName);
  const sphereVariant = SUITE_SPHERE_VARIANT[suite.id] || 'default';

  return (
    <LiquidPanel
      variant='interactive'
      radius='lg'
      role='button'
      tabIndex={0}
      data-intent={suite.intent}
      aria-label={`${suite.name} - ${intentLabel.description}`}
      className='group relative cursor-pointer overflow-hidden'
      onClick={onLaunch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLaunch();
        }
      }}
      style={{ minHeight: '10rem' }}
    >
      {/* Gradient background */}
      <div
        aria-hidden='true'
        className='absolute inset-0'
        style={{ background: suite.gradient, opacity: 0.7 }}
      />

      <div
        className='relative z-10 h-full'
        style={{
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        {/* Top row: TerraSphereIcon + intent badge */}
        <div className='flex items-start justify-between'>
          <TerraSphereIcon
            size={36}
            variant={sphereVariant}
            glyph={<LucideIcon size={12} strokeWidth={2.5} />}
          />
          <span
            title={intentLabel.description}
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '0.15rem 0.45rem',
              border: '1px solid hsl(var(--tf-border) / 0.3)',
              background: 'hsl(var(--tf-bg) / 0.3)',
              color: 'hsl(var(--tf-fg) / 0.9)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {suite.intent === 'workbench' ? 'Workbench' : 'Standalone'}
          </span>
        </div>

        {/* Bottom: name + description */}
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'hsl(var(--tf-fg))',
              lineHeight: 1.2,
            }}
          >
            {suite.name}
          </h3>
          <p
            style={{
              margin: '0.25rem 0 0',
              fontSize: '0.7rem',
              color: 'hsl(var(--tf-fg) / 0.8)',
              lineHeight: 1.3,
            }}
          >
            {suite.description}
          </p>
        </div>
      </div>
    </LiquidPanel>
  );
};

/** OS entrypoint button with Lucide icon */
const OSEntrypointButton: React.FC<{
  entrypoint: OSEntrypoint;
  onLaunch: () => void;
}> = ({ entrypoint, onLaunch }) => {
  const LucideIcon = getLucideIcon(SUITE_LUCIDE_MAP[entrypoint.iconName] || entrypoint.iconName);

  return (
    <TactileButton
      variant='ghost'
      size='md'
      onClick={onLaunch}
      className='w-full'
      style={{
        justifyContent: 'flex-start',
        gap: '0.55rem',
        background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.35)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <LucideIcon size={18} style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 50%)' }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{entrypoint.name}</span>
        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--tf-muted))' }}>{entrypoint.description}</span>
      </span>
    </TactileButton>
  );
};

// ============================================================================
// Shell Home
// ============================================================================

export interface ShellHomeProps {
  className?: string;
}

export const ShellHome: React.FC<ShellHomeProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  const recentApps = useStartMenuStore((state) => state.recentApps);
  const parcelContext = useParcelContext();
  const { setFromRoute } = useParcelContextActions();
  const { health, loading: healthLoading, refresh: refreshHealth } = useSystemHealth();

  // Context pills from county config + dynamic year
  const contextPills = useMemo(() => {
    const county = BentonCountyConfigService.getInstance().getCountyInfo();
    const deployment = BentonCountyConfigService.getInstance().getDeploymentInfo();
    const taxYear = new Date().getFullYear();
    const role = deployment.mode === 'demo' ? 'Demo' : 'Assessor';
    return [
      { label: county.name, accent: false },
      { label: `Tax Year ${taxYear}`, accent: false },
      { label: role, accent: true },
    ];
  }, []);

  const suites = useMemo(
    () => buildSuiteCards(parcelContext?.parcelId ?? null),
    [parcelContext?.parcelId]
  );

  // Recent items from parcel context or start menu
  const storedRecentParcels = useRecentParcels();
  const recentItems = useMemo<RecentItem[]>(() => {
    if (storedRecentParcels.length > 0) {
      return storedRecentParcels.slice(0, 3).map((parcelId, idx) => ({
        id: `recent-${idx}`,
        title: parcelId,
        subtitle: 'Benton County parcel',
        route: `/property/${parcelId}`,
      }));
    }
    if (Array.isArray(recentApps) && recentApps.length > 0) {
      return recentApps.slice(0, 3).map((app) => ({
        id: `recent-${app.id}`,
        title: app.name,
        subtitle: app.description || app.category || 'Recent module',
        route: `/modules/${app.id}`,
      }));
    }
    // Empty state — no hardcoded parcels; user should search
    return [];
  }, [storedRecentParcels, recentApps]);

  const actionContext: OsActionContext = useMemo(
    () => ({ navigate, suiteId: 'shell', surface: 'shellhome' }),
    [navigate]
  );

  const launchSuite = useCallback(
    (suite: SuiteCardModel) => {
      executeOsAction(
        { id: suite.id, label: suite.name, intent: suite.intent, href: suite.route },
        { ...actionContext, suiteId: suite.id }
      );
    },
    [actionContext]
  );

  const launchEntrypoint = useCallback(
    (ep: OSEntrypoint) => {
      executeOsAction(
        { id: ep.id, label: ep.name, intent: 'standalone', href: ep.route },
        { ...actionContext, suiteId: ep.id }
      );
    },
    [actionContext]
  );

  const openRecent = useCallback(
    (item: RecentItem) => {
      executeOsAction(
        { id: item.id, label: item.title, intent: 'workbench', href: item.route },
        actionContext
      );
    },
    [actionContext]
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (/[0-9]/.test(query)) {
        navigate(`/property/${encodeURIComponent(query)}`);
        return;
      }
      openCommandPalette();
    },
    [navigate, openCommandPalette]
  );

  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        padding: '0.75rem 1rem 4rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* ─── Top System Bar ─── */}
      <LiquidPanel
        variant='shell'
        radius='xl'
        style={{
          padding: '0.6rem 0.85rem',
          flexShrink: 0,
        }}
      >
        <header className='flex items-center justify-between' role='banner'>
          {/* Left: TerraSphere logo + branding */}
          <div className='flex items-center gap-3'>
            <TerraSphere size={32} state='idle' />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'hsl(var(--tf-text))',
                }}
              >
                TerraFusion OS
              </h1>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'hsl(var(--tf-muted))' }}>
                Government. Transcended.
              </p>
            </div>
          </div>

          {/* Right: Context pills + command palette */}
          <div className='flex items-center gap-2' aria-label='System context'>
            {contextPills.map((pill, i) => (
              <span
                key={pill.label}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  borderRadius: '999px',
                  padding: '0.2rem 0.55rem',
                  border: `1px solid ${pill.accent
                    ? 'hsl(var(--tf-success-hs) 52% / 0.4)'
                    : 'hsl(var(--tf-border) / 0.5)'}`,
                  background: pill.accent
                    ? 'hsl(var(--tf-success-hs) 52% / 0.12)'
                    : 'hsl(var(--tf-surface-dark-hs) 10% / 0.4)',
                  color: pill.accent
                    ? 'hsl(var(--tf-success-hs) 52%)'
                    : 'hsl(var(--tf-text))',
                }}
              >
                {pill.label}
              </span>
            ))}
            <TactileButton variant='secondary' size='sm' onClick={openCommandPalette}>
              <Search size={13} />
              <span style={{ marginLeft: '0.3rem' }}>Ctrl+K</span>
            </TactileButton>
          </div>
        </header>
      </LiquidPanel>

      {/* ─── Stage + Control Center ─── */}
      <div
        className='grid grid-cols-1 xl:grid-cols-[1fr_18rem]'
        style={{ gap: '0.75rem', flex: 1, minHeight: 0 }}
      >
        {/* Stage (main workspace area) */}
        <main role='main'>
          <LiquidPanel variant='shell' radius='xl' style={{ padding: '1rem', height: '100%' }}>
            {/* Search */}
            <section style={{ marginBottom: '1.25rem' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 650,
                  color: 'hsl(var(--tf-text))',
                }}
              >
                Property Operations
              </h2>
              <p style={{ margin: '0.2rem 0 0.75rem', fontSize: '0.78rem', color: 'hsl(var(--tf-muted))' }}>
                Find &rarr; Decide &rarr; Act
              </p>
              <StageSearch onSearch={handleSearch} onFocusPalette={openCommandPalette} />
            </section>

            {/* Suite grid */}
            <section style={{ marginBottom: '1rem' }}>
              <h2
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--tf-muted))',
                  fontWeight: 700,
                }}
              >
                Launch Suite
              </h2>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                {suites.map((suite) => (
                  <SuiteTile key={suite.id} suite={suite} onLaunch={() => launchSuite(suite)} />
                ))}
              </div>
            </section>

            {/* Recent items */}
            <section>
              <h2
                style={{
                  margin: '0 0 0.45rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--tf-muted))',
                  fontWeight: 700,
                }}
              >
                Recent
              </h2>
              {recentItems.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openRecent(item)}
                      className='text-left'
                      style={{
                        width: '100%',
                        border: '1px solid hsl(var(--tf-border) / 0.4)',
                        background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.4)',
                        color: 'hsl(var(--tf-text))',
                        borderRadius: '0.75rem',
                        padding: '0.65rem 0.75rem',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.title}</div>
                      <div style={{ marginTop: '0.15rem', fontSize: '0.68rem', color: 'hsl(var(--tf-muted))' }}>
                        {item.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'hsl(var(--tf-muted))', padding: '0.5rem 0' }}>
                  Search for a parcel to start building your history.
                </p>
              )}
            </section>
          </LiquidPanel>
        </main>

        {/* Control Center (sidebar) */}
        <aside>
          <LiquidPanel
            variant='infrastructure'
            radius='xl'
            style={{
              padding: '0.85rem',
              position: 'sticky',
              top: '0.5rem',
            }}
          >
            {/* OS Entrypoints */}
            <section style={{ marginBottom: '0.75rem' }}>
              <h2
                style={{
                  margin: '0 0 0.1rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--tf-muted))',
                  fontWeight: 700,
                }}
              >
                Control Center
              </h2>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.68rem', color: 'hsl(var(--tf-muted))' }}>
                System surfaces and tools
              </p>
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {OS_ENTRYPOINTS.map((ep) => (
                  <OSEntrypointButton key={ep.id} entrypoint={ep} onLaunch={() => launchEntrypoint(ep)} />
                ))}
              </div>
            </section>

            {/* System status — live from /health */}
            <div
              style={{
                borderTop: '1px solid hsl(var(--tf-border) / 0.3)',
                paddingTop: '0.6rem',
              }}
            >
              <SystemHealthPanel
                health={health}
                loading={healthLoading}
                onRefresh={refreshHealth}
              />
            </div>

            {/* PACS contract proof — live from /ops/pacs/proof */}
            <div
              style={{
                borderTop: '1px solid hsl(var(--tf-border) / 0.3)',
                paddingTop: '0.6rem',
                marginTop: '0.4rem',
              }}
            >
              <PacsProofCard />
            </div>

            {/* Property search — /ops/pacs/properties */}
            <div
              style={{
                borderTop: '1px solid hsl(var(--tf-border) / 0.3)',
                paddingTop: '0.6rem',
                marginTop: '0.4rem',
              }}
            >
              <PropertySearchWidget
                onSelect={(geoId) => {
                  setFromRoute(geoId);
                  navigate(`/workbench/dais?parcelId=${encodeURIComponent(geoId)}`);
                }}
              />
            </div>
          </LiquidPanel>
        </aside>
      </div>

      {/* ─── Dock (macOS-style floating centered) ─── */}
      {/* aria-hidden: dock is a visual mouse-shortcut bar; the suite grid above
          provides the canonical accessible interface for screen readers & keyboard. */}
      <nav
        aria-hidden='true'
        style={{
          position: 'fixed',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.35rem 0.65rem',
          height: '3rem',
          borderRadius: '1rem',
          background: 'hsl(var(--tf-bg) / 0.55)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          border: '1px solid hsl(var(--tf-border) / 0.4)',
          boxShadow: '0 8px 32px hsl(var(--tf-tokens-black-hs) 0% / 0.4), 0 0 0 0.5px hsl(var(--tf-border) / 0.2)',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        {/* Home button */}
        <button
          onClick={() => navigate('/desktop')}
          tabIndex={-1}
          title='Desktop'
          className='flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:bg-white/8 focus:outline-none'
        >
          <TerraSphere size={28} state='idle' />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'hsl(var(--tf-border) / 0.3)', flexShrink: 0 }} />

        {/* Suite icons */}
        {suites.map((suite) => {
          const LucideIcon = getLucideIcon(SUITE_LUCIDE_MAP[suite.iconName] || suite.iconName);
          const variant = SUITE_SPHERE_VARIANT[suite.id] || 'default';
          return (
            <button
              key={`dock-${suite.id}`}
              onClick={() => launchSuite(suite)}
              tabIndex={-1}
              title={suite.name}
              className='flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:bg-white/8 focus:outline-none'
            >
              <TerraSphereIcon
                size={28}
                variant={variant}
                glyph={<LucideIcon size={10} strokeWidth={2.5} />}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ShellHome;

/**
 * TerraFusion OS - Shell Home
 *
 * Canonical landing surface: spatial "OS scene" for Find -> Decide -> Act.
 * - Top system bar (county/year/role + command palette access)
 * - Stage (search, suite launcher, recent work)
 * - Control center rail (standalone entrypoints + system status)
 * - Dock (fast launch for constitutional suites)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Command as CommandIcon, Search } from 'lucide-react';
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
import { useParcelContext } from '../../context/parcelContext';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { TerraSphereIcon, type TerraSphereIconVariant } from '../../ui/brand/TerraSphereIcon';
import { LiquidPanel, TactileButton } from '../../ui/materials';

interface SuiteCardModel {
  id: string;
  name: string;
  description: string;
  iconName: string;
  iconVariant: TerraSphereIconVariant;
  route: string;
  intent: 'workbench' | 'standalone';
  gradient: string;
}

interface OSEntrypoint {
  id: string;
  name: string;
  description: string;
  iconName: string;
  iconVariant: TerraSphereIconVariant;
  route: string;
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

const SUITE_VARIANTS: Record<string, TerraSphereIconVariant> = {
  forge: 'assessment',
  atlas: 'mapping',
  dais: 'analytics',
  dossier: 'records',
  gpt: 'ai',
};

const ENTRYPOINT_VARIANTS: Record<string, TerraSphereIconVariant> = {
  pilot: 'system',
  trace: 'analytics',
  canon: 'system',
  prime: 'assessment',
};

const SUITE_GRADIENTS: Record<string, string> = {
  forge:
    'linear-gradient(140deg, hsl(var(--tf-warning-hs) 55% / 0.9), hsl(var(--tf-error-hs) 56% / 0.88))',
  atlas:
    'linear-gradient(140deg, hsl(var(--tf-network-blue-hs) 61% / 0.9), hsl(var(--tf-transcend-cyan-hs) 53% / 0.88))',
  dais:
    'linear-gradient(140deg, hsl(var(--tf-info-hs) 56% / 0.9), hsl(var(--tf-info-hs) 64% / 0.88))',
  dossier:
    'linear-gradient(140deg, hsl(var(--tf-success-hs) 52% / 0.9), hsl(var(--tf-transcend-cyan-hs) 48% / 0.85))',
  gpt:
    'linear-gradient(140deg, hsl(var(--tf-info-hs) 62% / 0.9), hsl(var(--tf-network-blue-hs) 64% / 0.88))',
};

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
      iconVariant: SUITE_VARIANTS[suite.id] ?? 'default',
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
    iconVariant: ENTRYPOINT_VARIANTS[feature.id] ?? 'system',
    route: feature.route,
  })),
  {
    id: 'prime',
    name: 'TerraPrime',
    description: 'Property viewer',
    iconName: 'FileText',
    iconVariant: ENTRYPOINT_VARIANTS.prime,
    route: '/suites/terra-prime',
  },
];

const STAGE_FALLBACK_RECENTS: RecentItem[] = [
  {
    id: 'rec-12345-001',
    title: '12345-001',
    subtitle: 'Benton County parcel context',
    route: '/property/12345-001',
  },
  {
    id: 'rec-67890-002',
    title: '67890-002',
    subtitle: 'Benton County parcel context',
    route: '/property/67890-002',
  },
  {
    id: 'rec-apl-0042',
    title: 'APL-2026-0042',
    subtitle: 'Valuation appeal review',
    route: '/suites/terra-prime',
  },
];

const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  onFocusPalette: () => void;
}> = ({ onSearch, onFocusPalette }) => {
  const [query, setQuery] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
      className='w-full'
    >
      <div className='relative'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocusPalette}
          placeholder='Search parcels, cases, persons, documents...'
          aria-label='Search parcels'
          className='w-full'
          style={{
            borderRadius: '1rem',
            border: '1px solid hsl(var(--tf-border) / 0.7)',
            background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.62)',
            color: 'hsl(var(--tf-text))',
            fontSize: '1.05rem',
            padding: '0.95rem 3.75rem 0.95rem 1rem',
            outline: 'none',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
            boxShadow: '0 10px 28px hsl(var(--tf-tokens-black-hs) 0% / 0.28)',
          }}
        />
        <div className='absolute right-2 top-1/2 -translate-y-1/2'>
          <TactileButton type='submit' variant='primary' size='sm' aria-label='Run search'>
            <Search className='h-4 w-4' aria-hidden='true' />
          </TactileButton>
        </div>
      </div>
      <div
        style={{
          marginTop: '0.55rem',
          fontSize: '0.78rem',
          color: 'hsl(var(--tf-muted))',
          display: 'flex',
          gap: '0.3rem',
          alignItems: 'center',
        }}
      >
        <span>Command palette:</span>
        <kbd
          style={{
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: '0.35rem',
            padding: '0.1rem 0.4rem',
            color: 'hsl(var(--tf-text))',
            background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.64)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Ctrl+K
        </kbd>
      </div>
    </form>
  );
};

const SuiteTile: React.FC<{
  suite: SuiteCardModel;
  onLaunch: () => void;
}> = ({ suite, onLaunch }) => {
  const SuiteIcon = getLucideIcon(suite.iconName);
  const intentLabel = INTENT_LABELS[suite.intent];
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
      style={{
        minHeight: '9.25rem',
        borderColor: 'hsl(var(--tf-border) / 0.85)',
      }}
    >
      <div
        aria-hidden='true'
        className='absolute inset-0'
        style={{
          background: suite.gradient,
          opacity: 0.72,
        }}
      />
      <div
        className='relative z-10 h-full'
        style={{
          padding: '0.9rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.6rem',
        }}
      >
        <div className='flex items-start justify-between gap-2'>
          <TerraSphereIcon
            size={34}
            variant={suite.iconVariant}
            glyph={<SuiteIcon className='h-3.5 w-3.5' />}
          />
          <span
            title={intentLabel.description}
            aria-label={intentLabel.badge}
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '0.2rem 0.5rem',
              border: '1px solid hsl(var(--tf-text-primary-hs) 100% / 0.35)',
              background: 'hsl(var(--tf-tokens-black-hs) 0% / 0.35)',
              color: 'hsl(var(--tf-text-primary-hs) 100% / 0.95)',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {suite.intent === 'workbench' ? 'Workbench' : 'Standalone'}
          </span>
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'hsl(var(--tf-text-primary-hs) 100%)',
              lineHeight: 1.2,
            }}
          >
            {suite.name}
          </h3>
          <p
            style={{
              marginTop: '0.35rem',
              marginBottom: 0,
              fontSize: '0.72rem',
              color: 'hsl(var(--tf-text-primary-hs) 100% / 0.86)',
            }}
          >
            {suite.description}
          </p>
        </div>
      </div>
    </LiquidPanel>
  );
};

const OSEntrypointButton: React.FC<{
  entrypoint: OSEntrypoint;
  onLaunch: () => void;
}> = ({ entrypoint, onLaunch }) => {
  const EntrypointIcon = getLucideIcon(entrypoint.iconName);
  return (
    <TactileButton
      variant='ghost'
      size='md'
      onClick={onLaunch}
      className='w-full'
      style={{
        justifyContent: 'flex-start',
        gap: '0.6rem',
        borderColor: 'hsl(var(--tf-border) / 0.7)',
        background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.46)',
        color: 'hsl(var(--tf-text))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <TerraSphereIcon
        size={28}
        variant={entrypoint.iconVariant}
        glyph={<EntrypointIcon className='h-3 w-3' />}
      />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600 }}>{entrypoint.name}</span>
        <span style={{ fontSize: '0.68rem', color: 'hsl(var(--tf-muted))' }}>{entrypoint.description}</span>
      </span>
    </TactileButton>
  );
};

export interface ShellHomeProps {
  className?: string;
}

export const ShellHome: React.FC<ShellHomeProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  const recentApps = useStartMenuStore((state) => state.recentApps);
  const parcelContext = useParcelContext();

  const suites = useMemo(
    () => buildSuiteCards(parcelContext?.parcelId ?? null),
    [parcelContext?.parcelId]
  );

  const recentItems = useMemo<RecentItem[]>(() => {
    if (Array.isArray(recentApps) && recentApps.length > 0) {
      return recentApps.slice(0, 3).map((app) => ({
        id: `recent-${app.id}`,
        title: app.name,
        subtitle: app.description || app.category || 'Recent module',
        route: `/modules/${app.id}`,
      }));
    }
    return STAGE_FALLBACK_RECENTS;
  }, [recentApps]);

  const actionContext: OsActionContext = useMemo(
    () => ({
      navigate,
      suiteId: 'shell',
      surface: 'shellhome',
    }),
    [navigate]
  );

  const launchSuite = useCallback(
    (suite: SuiteCardModel) => {
      const action: OsAction = {
        id: suite.id,
        label: suite.name,
        intent: suite.intent,
        href: suite.route,
      };
      executeOsAction(action, { ...actionContext, suiteId: suite.id });
    },
    [actionContext]
  );

  const launchEntrypoint = useCallback(
    (entrypoint: OSEntrypoint) => {
      const action: OsAction = {
        id: entrypoint.id,
        label: entrypoint.name,
        intent: 'standalone',
        href: entrypoint.route,
      };
      executeOsAction(action, { ...actionContext, suiteId: entrypoint.id });
    },
    [actionContext]
  );

  const openRecent = useCallback(
    (item: RecentItem) => {
      const action: OsAction = {
        id: item.id,
        label: item.title,
        intent: 'workbench',
        href: item.route,
      };
      executeOsAction(action, actionContext);
    },
    [actionContext]
  );

  const handleSearch = useCallback(
    (query: string) => {
      const value = query.trim();
      if (!value) {
        return;
      }
      if (/[0-9]/.test(value)) {
        navigate(`/property/${encodeURIComponent(value)}`);
        return;
      }
      openCommandPalette();
    },
    [navigate, openCommandPalette]
  );

  return (
    <div
      className={`tf-css-ambient ${className}`}
      style={{
        minHeight: '100%',
        padding: '1rem 1.1rem 1rem',
        position: 'relative',
      }}
    >
      <div className='tf-ambient-mesh' aria-hidden='true' />
      <div className='tf-ambient-noise' aria-hidden='true' />
      <div className='tf-ambient-vignette' aria-hidden='true' />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '88rem', margin: '0 auto' }}>
        <LiquidPanel
          variant='shell'
          radius='xl'
          className='glass-panel'
          style={{
            padding: '0.8rem 1rem',
            marginBottom: '0.95rem',
            borderColor: 'hsl(var(--tf-border) / 0.85)',
          }}
        >
          <header className='flex items-center justify-between gap-3' role='banner'>
            <div className='flex items-center gap-3'>
              <TerraSphereIcon size={30} variant='system' glyph={<Building2 className='h-3 w-3' />} />
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: 'hsl(var(--tf-text-primary-hs) 100%)',
                  }}
                >
                  TerraFusion OS
                </h1>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'hsl(var(--tf-muted))' }}>
                  Government. Transcended.
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2' aria-label='System context'>
              <span
                style={{
                  fontSize: '0.7rem',
                  borderRadius: '999px',
                  padding: '0.24rem 0.6rem',
                  border: '1px solid hsl(var(--tf-border))',
                  background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.55)',
                  color: 'hsl(var(--tf-text))',
                }}
              >
                Benton County
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  borderRadius: '999px',
                  padding: '0.24rem 0.6rem',
                  border: '1px solid hsl(var(--tf-border))',
                  background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.55)',
                  color: 'hsl(var(--tf-text))',
                }}
              >
                Tax Year 2026
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  borderRadius: '999px',
                  padding: '0.24rem 0.6rem',
                  border: '1px solid hsl(var(--tf-success-hs) 52% / 0.45)',
                  background: 'hsl(var(--tf-success-hs) 52% / 0.14)',
                  color: 'hsl(var(--tf-success-hs) 52%)',
                }}
              >
                Assessor Role
              </span>
              <TactileButton variant='secondary' size='sm' onClick={openCommandPalette}>
                <CommandIcon className='h-3.5 w-3.5' aria-hidden='true' />
                <span>Command Palette</span>
              </TactileButton>
            </div>
          </header>
        </LiquidPanel>

        <div className='grid grid-cols-1 xl:grid-cols-[1fr_20rem]' style={{ gap: '0.95rem' }}>
          <main role='main'>
            <LiquidPanel
              variant='shell'
              radius='xl'
              className='glass-panel'
              style={{
                padding: '1rem',
                borderColor: 'hsl(var(--tf-border) / 0.75)',
              }}
            >
              <section style={{ marginBottom: '1rem' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    color: 'hsl(var(--tf-text-primary-hs) 100%)',
                    fontWeight: 650,
                  }}
                >
                  Property Operations Stage
                </h2>
                <p style={{ margin: '0.3rem 0 0.85rem', color: 'hsl(var(--tf-muted))', fontSize: '0.82rem' }}>
                  Find → Decide → Act with parcel-first navigation and governed execution.
                </p>
                <SearchBar onSearch={handleSearch} onFocusPalette={openCommandPalette} />
              </section>

              <section style={{ marginBottom: '1rem' }}>
                <h2
                  style={{
                    margin: '0 0 0.6rem',
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.11em',
                    color: 'hsl(var(--tf-muted))',
                    fontWeight: 700,
                  }}
                >
                  Launch Suite
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
                  {suites.map((suite) => (
                    <SuiteTile key={suite.id} suite={suite} onLaunch={() => launchSuite(suite)} />
                  ))}
                </div>
              </section>

              <section>
                <h2
                  style={{
                    margin: '0 0 0.55rem',
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.11em',
                    color: 'hsl(var(--tf-muted))',
                    fontWeight: 700,
                  }}
                >
                  Recent
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openRecent(item)}
                      className='text-left'
                      style={{
                        width: '100%',
                        border: '1px solid hsl(var(--tf-border))',
                        background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.55)',
                        color: 'hsl(var(--tf-text))',
                        borderRadius: '0.9rem',
                        padding: '0.75rem 0.8rem',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      <div style={{ fontWeight: 650, fontSize: '0.85rem' }}>{item.title}</div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: 'hsl(var(--tf-muted))' }}>
                        {item.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </LiquidPanel>
          </main>

          <aside>
            <LiquidPanel
              variant='infrastructure'
              radius='xl'
              className='glass-panel'
              style={{
                padding: '0.95rem',
                borderColor: 'hsl(var(--tf-border) / 0.75)',
                position: 'sticky',
                top: '0.5rem',
              }}
            >
              <section style={{ marginBottom: '0.85rem' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.11em',
                    color: 'hsl(var(--tf-muted))',
                    fontWeight: 700,
                  }}
                >
                  Control Center
                </h2>
                <p style={{ margin: '0.28rem 0 0', fontSize: '0.72rem', color: 'hsl(var(--tf-muted))' }}>
                  System-level standalone surfaces and status.
                </p>
              </section>

              <section aria-label='System entrypoints' style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {OS_ENTRYPOINTS.map((entrypoint) => (
                    <OSEntrypointButton
                      key={entrypoint.id}
                      entrypoint={entrypoint}
                      onLaunch={() => launchEntrypoint(entrypoint)}
                    />
                  ))}
                </div>
              </section>

              <div
                style={{
                  borderTop: '1px solid hsl(var(--tf-border))',
                  paddingTop: '0.65rem',
                  display: 'grid',
                  gap: '0.4rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'hsl(var(--tf-muted))',
                  }}
                >
                  <span>PACS Connectivity</span>
                  <span style={{ color: 'hsl(var(--tf-success-hs) 52%)' }}>Online</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'hsl(var(--tf-muted))',
                  }}
                >
                  <span>Audit Trail</span>
                  <span style={{ color: 'hsl(var(--tf-network-blue-hs) 61%)' }}>Live</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'hsl(var(--tf-muted))',
                  }}
                >
                  <span>AI Orchestration</span>
                  <span style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 53%)' }}>Ready</span>
                </div>
              </div>
            </LiquidPanel>
          </aside>
        </div>

        <LiquidPanel
          variant='shell'
          radius='xl'
          className='glass-dock'
          style={{
            marginTop: '0.95rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '1rem',
            border: '1px solid hsl(var(--tf-border) / 0.65)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {suites.map((suite) => {
              const DockIcon = getLucideIcon(suite.iconName);
              return (
                <TactileButton
                  key={`dock-${suite.id}`}
                  variant='ghost'
                  size='sm'
                  onClick={() => launchSuite(suite)}
                  aria-label={`Dock launch ${suite.id}`}
                  title={`${suite.name} (${suite.intent})`}
                  style={{
                    minWidth: '2.2rem',
                    justifyContent: 'center',
                    borderColor: 'hsl(var(--tf-border) / 0.65)',
                    background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.46)',
                  }}
                >
                  <TerraSphereIcon
                    size={22}
                    variant={suite.iconVariant}
                    glyph={<DockIcon className='h-2.5 w-2.5' />}
                  />
                </TactileButton>
              );
            })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--tf-muted))', textAlign: 'right' }}>
            TerraFusion OS Scene
            <div style={{ fontFamily: 'var(--font-mono)', marginTop: '0.16rem' }}>
              Lane B / Shell / Governed
            </div>
          </div>
        </LiquidPanel>
      </div>
    </div>
  );
};

export default ShellHome;

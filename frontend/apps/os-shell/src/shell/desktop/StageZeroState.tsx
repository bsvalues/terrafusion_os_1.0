/**
 * TerraFusion OS — County Operations Scene (Stage Zero-State)
 *
 * When no windows are active, the stage shows a county operations orientation:
 * - Center: County map overview (SVG-based)
 * - Left panel: Recent Work (department-aware)
 * - Right panel: Quick Actions
 * - Bottom strip: County status
 *
 * This is an OS-level surface. The Assessment department contributes
 * content (recent parcels, stats) but the layout is department-agnostic.
 * Search lives in ⌘K — NOT as the home hero.
 *
 * DATA POSTURE (proof-sealed 2026-03-29, card 50E):
 * - Recent Work: live parcel browsing history from OS session state.
 * - Parcel count: from useParcelCount() API data; unavailable stays unavailable.
 * - Today's Work: TerraDais queue API data only; unavailable state renders
 *   explicitly and never falls back to seeded sample tasks.
 * - County status strip: Last sync, appeal count, and system status fields render
 *   "–" (dash) because no live backend source exists yet. They do not claim live state.
 *
 * @module shell/desktop/StageZeroState
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  ArrowRight,
  Building2,
  BarChart3,
  CalendarDays,
  FileSearch,
  Map,
  Zap,
  Search,
  LayoutDashboard,
  Shield,
  Compass,
  FolderOpen,
} from 'lucide-react';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useRecentParcels } from '../../context/parcelContext';
import { activateModule } from '../../orchestration/moduleActivation';
import { useTodaysWork, type TodaysWorkItem } from '../../hooks/useTodaysWork';
import { useParcelCount } from '../../hooks/useParcelCount';
import {
  WASHINGTON_COUNTY_RUNTIME_POSTURES,
  getCountyRuntimePosture,
} from '../../config/countyRuntimePosture';
import { LiquidPanel } from '../../ui/materials';
import { invokeTool } from '../../api/pilotApi';
import { Z } from './zIndex';

// ============================================================================
// Types
// ============================================================================

export interface StageZeroStateProps {
  id?: string;
  className?: string;
}

interface ExecutivePostureState {
  dais: {
    status: 'idle' | 'loading' | 'success' | 'error';
    summary?: string;
    queueType?: string;
    recommendedTool?: string;
    correlationId?: string;
  };
  forge: {
    status: 'idle' | 'loading' | 'success' | 'error';
    summary?: string;
    readiness?: string;
    correlationId?: string;
  };
  atlas: {
    status: 'idle' | 'loading' | 'success' | 'error';
    summary?: string;
    hotspots?: number;
    correlationId?: string;
  };
  dossier: {
    status: 'idle' | 'loading' | 'success' | 'error';
    summary?: string;
    packetRef?: string;
    correlationId?: string;
  };
}

// ============================================================================
// Sub-components
// ============================================================================

/** Glass card wrapper */
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <LiquidPanel
    variant='shell'
    radius='lg'
    className={cn('p-4 flex flex-col', className)}
  >
    {children}
  </LiquidPanel>
);

/** Section header */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className='flex items-center gap-2 mb-3'>
    <span className='opacity-50'>{icon}</span>
    <span
      className='text-xs font-semibold uppercase tracking-wider'
      style={{ color: 'hsl(var(--tf-muted))' }}
    >
      {title}
    </span>
  </div>
);

/** Clickable action row */
const ActionRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  subtle?: boolean;
  shortcut?: string;
}> = ({ icon, label, onClick, subtle = false, shortcut }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left',
      'transition-all duration-150',
      'hover:bg-[hsl(var(--tf-text)_/_0.07)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
      subtle ? 'opacity-60 hover:opacity-90' : 'opacity-80 hover:opacity-100'
    )}
  >
    <span className='flex-shrink-0 opacity-60'>{icon}</span>
    <span className='text-sm font-medium truncate' style={{ color: 'hsl(var(--tf-text))' }}>
      {label}
    </span>
    {shortcut && (
      <span
        className='ml-auto flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded'
        style={{
          color: 'hsl(var(--tf-text))',
          background: 'hsl(var(--tf-surface-2))',
        }}
      >
        {shortcut}
      </span>
    )}
    {!shortcut && <ArrowRight className='h-3 w-3 ml-auto opacity-30 flex-shrink-0' />}
  </button>
);

/** Today's Work panel — shows TerraDais queue tasks from useTodaysWork hook */
function TodaysWorkPanel({
  tasks,
  loading,
  error,
  onActivate,
}: {
  tasks: TodaysWorkItem[];
  loading: boolean;
  error: string | null;
  onActivate: (route: string) => void;
}) {
  if (loading) {
    return (
      <div data-testid="todays-work-panel" className="flex flex-col items-center justify-center py-6" style={{ color: 'hsl(var(--tf-muted))' }}>
        <CalendarDays className="w-8 h-8 mb-2" />
        <span className="text-sm">Loading Dais queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="todays-work-panel" className="flex flex-col items-center justify-center py-6" style={{ color: 'hsl(var(--tf-warning-hs) 55%)' }}>
        <CalendarDays className="w-8 h-8 mb-2" />
        <span className="text-sm text-center">Today's work unavailable from TerraDais.</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div data-testid="todays-work-panel" className="flex flex-col items-center justify-center py-6" style={{ color: 'hsl(var(--tf-muted))' }}>
        <CalendarDays className="w-8 h-8 mb-2" />
        <span className="text-sm">No tasks for today</span>
      </div>
    );
  }

  return (
    <div data-testid="todays-work-panel" className="flex flex-col gap-1">
      <SectionHeader icon={<CalendarDays className='h-3.5 w-3.5' />} title="Today's Work" />
      {tasks.map((task) => (
        <ActionRow
          key={task.id}
          icon={<Clock className='h-3.5 w-3.5' />}
          label={`${task.title} — ${task.subtitle}`}
          onClick={() => onActivate(task.route)}
        />
      ))}
    </div>
  );
}

function parseToolOutput<T>(output: unknown): T | null {
  try {
    return typeof output === 'string' ? JSON.parse(output) as T : output as T;
  } catch {
    return null;
  }
}

// ============================================================================
// County Map — Mapbox GL satellite map with parcel layer
// ============================================================================
import BentonCountyMap from './BentonCountyMap';

/**
 * Real Mapbox GL satellite map of Benton County WA.
 * Parcel click → opens PropertyWorkbench for that parcel.
 */
const CountyMapOverview: React.FC<{
  onParcelSelect: (parcelId: string) => void;
}> = ({ onParcelSelect }) => (
  <div
    className='relative w-full h-full rounded-xl overflow-hidden'
    aria-label='Benton County WA — satellite GIS map'
  >
    <span className='sr-only' role='img' aria-label='Open TerraAtlas for full county map' />

    {/* Mapbox GL satellite map */}
    <BentonCountyMap
      onParcelSelect={onParcelSelect}
      className='w-full h-full'
    />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const StageZeroState: React.FC<StageZeroStateProps> = ({ id, className = '' }) => {
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  const recentParcels = useRecentParcels();
  const { tasks: todaysTasks, loading: todaysTasksLoading, error: todaysTasksError } = useTodaysWork();
  const { data: statsData } = useParcelCount();
  const bentonPosture = getCountyRuntimePosture('benton');
  const sourceOnlyCountyCount = WASHINGTON_COUNTY_RUNTIME_POSTURES.filter(
    (posture) => !posture.runtimeActionsAllowed
  ).length;
  const runtimeEnabledCountyCount = WASHINGTON_COUNTY_RUNTIME_POSTURES.length - sourceOnlyCountyCount;
  const parcelCountLabel = typeof statsData?.totalParcels === 'number'
    ? `${statsData.totalParcels.toLocaleString()} parcels`
    : 'Parcel count unavailable';
  const [executivePosture, setExecutivePosture] = useState<ExecutivePostureState>({
    dais: { status: 'idle' },
    forge: { status: 'idle' },
    atlas: { status: 'idle' },
    dossier: { status: 'idle' },
  });

  const handleOpenAtlas = useCallback(() => {
    activateModule('suite-atlas', { source: 'desktop' });
  }, []);

  const handleOpenWorkbench = useCallback(() => {
    import('../../context/parcelContext').then(({ openWorkbenchWindow }) => {
      openWorkbenchWindow();
    });
  }, []);

  const handleSelectParcel = useCallback((parcelId: string) => {
    import('../../context/parcelContext').then(({ selectRecentParcel, openWorkbenchWindow }) => {
      selectRecentParcel(parcelId);
      openWorkbenchWindow(parcelId);
    });
  }, []);

  const handleOpenForge = useCallback(() => {
    activateModule('suite-forge', { source: 'desktop' });
  }, []);

  const handleOpenDais = useCallback(() => {
    activateModule('suite-dais', { source: 'desktop' });
  }, []);

  const handleOpenDossier = useCallback(() => {
    activateModule('suite-dossier', { source: 'desktop' });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadExecutivePosture() {
      const taxYear = new Date().getFullYear();

      setExecutivePosture({
        dais: { status: 'loading' },
        forge: { status: 'loading' },
        atlas: { status: 'loading' },
        dossier: { status: 'loading' },
      });

      const [daisResult, forgeResult, atlasResult, dossierResult] = await Promise.allSettled([
        invokeTool({
          toolId: 'generate_morning_brief',
          params: { county: 'benton', role: 'assessor_leadership', taxYear },
        }),
        invokeTool({
          toolId: 'generate_morning_brief',
          params: { county: 'benton', role: 'chief_appraiser', taxYear },
        }),
        invokeTool({
          toolId: 'explain_spatial_anomaly',
          params: { county: 'benton', taxYear, metric: 'residual_cluster', geographyId: 'BENTON-COUNTY' },
        }),
        invokeTool({
          toolId: 'open_appeal_packet',
          params: { county: 'benton', appealId: 'BOE-2026-001' },
        }),
      ]);

      if (cancelled) {
        return;
      }

      setExecutivePosture({
        dais: daisResult.status === 'fulfilled' && daisResult.value.success
          ? (() => {
              const parsed = parseToolOutput<{ queueType?: string; summary?: string; recommendedTool?: string }>(
                daisResult.value.result?.output
              );
              return {
                status: 'success',
                summary: parsed?.summary || 'Summary not returned.',
                queueType: parsed?.queueType,
                recommendedTool: parsed?.recommendedTool,
                correlationId: daisResult.value.correlationId,
              };
            })()
          : { status: 'error', summary: 'County leadership briefing unavailable.' },
        forge: forgeResult.status === 'fulfilled' && forgeResult.value.success
          ? (() => {
              const parsed = parseToolOutput<{ summary?: string; queueType?: string }>(
                forgeResult.value.result?.output
              );
              return {
                status: 'success',
                summary: parsed?.summary || 'Summary not returned.',
                readiness: parsed?.queueType,
                correlationId: forgeResult.value.correlationId,
              };
            })()
          : { status: 'error', summary: 'Chief appraiser brief unavailable.' },
        atlas: atlasResult.status === 'fulfilled' && atlasResult.value.success
          ? (() => {
              const parsed = parseToolOutput<{ narrative?: string; hotspotCount?: number }>(
                atlasResult.value.result?.output
              );
              return {
                status: 'success',
                summary: parsed?.narrative || 'Summary not returned.',
                hotspots: parsed?.hotspotCount,
                correlationId: atlasResult.value.correlationId,
              };
            })()
          : { status: 'error', summary: 'Spatial audit posture unavailable.' },
        dossier: dossierResult.status === 'fulfilled' && dossierResult.value.success
          ? (() => {
              const parsed = parseToolOutput<{ packetRef?: string; payloadRef?: string }>(
                dossierResult.value.result?.output
              );
              return {
                status: 'success',
                summary: parsed?.payloadRef || 'Summary not returned.',
                packetRef: parsed?.packetRef,
                correlationId: dossierResult.value.correlationId,
              };
            })()
          : { status: 'error', summary: 'Packet readiness unavailable.' },
      });
    }

    void loadExecutivePosture();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      id={id}
      data-testid='stage-zero-state'
      className={cn(
        'absolute inset-0',
        'pointer-events-none',
        className
      )}
      style={{
        zIndex: Z.desktop,
        paddingTop: 48,
        paddingBottom: 88,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <div className='pointer-events-auto h-full flex flex-col gap-3'>
        <div className='flex-1 min-h-0 flex gap-3'>
          {/* ═══ Left Panel: Recent Work ═══ */}
          <div data-testid='recent-work-panel' className='w-[240px] shrink-0 flex flex-col gap-3'>
            <GlassCard className='flex-1'>
              <SectionHeader icon={<Clock className='h-3.5 w-3.5' />} title='Recent Work' />
              <div className='flex flex-col gap-0.5 -mx-2.5 flex-1'>
                {recentParcels.length === 0 ? (
                  <div className='flex flex-col items-center justify-center flex-1 gap-2 opacity-40'>
                    <Building2 className='h-6 w-6' />
                    <p className='text-xs text-center'>No recent parcels.<br />Use ⌘K to search.</p>
                  </div>
                ) : (
                  recentParcels.slice(0, 8).map((parcelId) => (
                    <ActionRow
                      key={parcelId}
                      icon={<Building2 className='h-3.5 w-3.5' />}
                      label={parcelId}
                      onClick={() => handleSelectParcel(parcelId)}
                    />
                  ))
                )}
              </div>
            </GlassCard>
          </div>

          {/* ═══ Center: County Overview ═══ */}
          <div data-testid='county-map-center' className='flex-1 min-w-0'>
            <GlassCard className='h-full p-2'>
              <CountyMapOverview onParcelSelect={handleSelectParcel} />
            </GlassCard>
          </div>

          {/* ═══ Right Panel: Today's Work + Quick Actions ═══ */}
          <div className='w-[240px] shrink-0 flex flex-col gap-3'>
            <GlassCard className='flex-1'>
              <TodaysWorkPanel
                tasks={todaysTasks}
                loading={todaysTasksLoading}
                error={todaysTasksError}
                onActivate={(route) => activateModule(route, { source: 'desktop' })}
              />
            </GlassCard>
            <GlassCard className='shrink-0'>
              <SectionHeader icon={<Zap className='h-3.5 w-3.5' />} title='Quick Actions' />
              <div className='flex flex-col gap-0.5 -mx-2.5'>
                <ActionRow
                  icon={<Search className='h-3.5 w-3.5' />}
                  label='Search Parcels'
                  onClick={openCommandPalette}
                  shortcut='⌘K'
                />
                <ActionRow
                  icon={<LayoutDashboard className='h-3.5 w-3.5' />}
                  label='Open Workbench'
                  onClick={handleOpenWorkbench}
                />
                <ActionRow
                  icon={<Map className='h-3.5 w-3.5' />}
                  label='Launch Atlas'
                  onClick={handleOpenAtlas}
                />
                <ActionRow
                  icon={<BarChart3 className='h-3.5 w-3.5' />}
                  label='Open Ratio Study'
                  onClick={handleOpenForge}
                  subtle
                />
                <ActionRow
                  icon={<FileSearch className='h-3.5 w-3.5' />}
                  label='Review Appeals'
                  onClick={handleOpenDais}
                  subtle
                />
              </div>
            </GlassCard>
          </div>
        </div>

        <LiquidPanel variant='shell' radius='lg' className='px-4 py-4 shrink-0'>
          <div data-testid='executive-command-surface' className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <div className='text-[10px] font-semibold uppercase tracking-[0.14em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Executive Command Surface
                </div>
                <div className='text-sm font-semibold mt-1' style={{ color: 'hsl(var(--tf-text))' }}>
                  Cross-suite county posture
                </div>
              </div>
              <div className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                Benton County • Governed summaries only
              </div>
            </div>

            <div
              data-testid='county-runtime-posture-summary'
              data-total-counties={String(WASHINGTON_COUNTY_RUNTIME_POSTURES.length)}
              data-runtime-enabled-count={String(runtimeEnabledCountyCount)}
              data-source-intake-count={String(sourceOnlyCountyCount)}
              data-benton-runtime-mode={bentonPosture.runtimeMode}
              data-intake-canonical-import-allowed='false'
              className='rounded-xl p-3 text-xs leading-5'
              style={{
                border: '1px solid hsl(var(--tf-border) / 0.7)',
                background: 'hsl(var(--tf-surface) / 0.36)',
                color: 'hsl(var(--tf-muted))',
              }}
            >
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <span className='font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
                  39 Washington counties registered
                </span>
                <span>{runtimeEnabledCountyCount} runtime-enabled: Benton</span>
                <span>{sourceOnlyCountyCount} County Data Intake only</span>
                <span>canonicalImportAllowed: false for intake counties</span>
              </div>
              <div className='mt-1'>
                Non-Benton runtime actions remain blocked until source provenance, onboarding, and lineage proof are promoted.
              </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-4 gap-3'>
              <button
                type='button'
                onClick={handleOpenDais}
                className='rounded-xl p-3 text-left transition-all duration-150 hover:bg-[hsl(var(--tf-text)_/_0.04)]'
                style={{ border: '1px solid hsl(var(--tf-border) / 0.7)' }}
              >
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <LayoutDashboard className='h-3.5 w-3.5' />
                  Dais
                </div>
                <div className='mt-2 text-sm font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
                  {executivePosture.dais.queueType || 'Staff queues'}
                </div>
                <div className='mt-2 text-xs leading-5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {executivePosture.dais.summary || 'Loading county leadership briefing…'}
                </div>
              </button>

              <button
                type='button'
                onClick={handleOpenForge}
                className='rounded-xl p-3 text-left transition-all duration-150 hover:bg-[hsl(var(--tf-text)_/_0.04)]'
                style={{ border: '1px solid hsl(var(--tf-border) / 0.7)' }}
              >
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <Shield className='h-3.5 w-3.5' />
                  Forge
                </div>
                <div className='mt-2 text-sm font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
                  {executivePosture.forge.readiness || 'Calibration posture'}
                </div>
                <div className='mt-2 text-xs leading-5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {executivePosture.forge.summary || 'Loading chief appraiser brief…'}
                </div>
              </button>

              <button
                type='button'
                onClick={handleOpenAtlas}
                className='rounded-xl p-3 text-left transition-all duration-150 hover:bg-[hsl(var(--tf-text)_/_0.04)]'
                style={{ border: '1px solid hsl(var(--tf-border) / 0.7)' }}
              >
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <Compass className='h-3.5 w-3.5' />
                  Atlas
                </div>
                <div className='mt-2 text-sm font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
                  {executivePosture.atlas.hotspots != null ? `${executivePosture.atlas.hotspots} hotspots` : 'Spatial pulse'}
                </div>
                <div className='mt-2 text-xs leading-5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {executivePosture.atlas.summary || 'Loading spatial anomaly posture…'}
                </div>
              </button>

              <button
                type='button'
                onClick={handleOpenDossier}
                className='rounded-xl p-3 text-left transition-all duration-150 hover:bg-[hsl(var(--tf-text)_/_0.04)]'
                style={{ border: '1px solid hsl(var(--tf-border) / 0.7)' }}
              >
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <FolderOpen className='h-3.5 w-3.5' />
                  Dossier
                </div>
                <div className='mt-2 text-sm font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
                  {executivePosture.dossier.packetRef || 'Packet readiness'}
                </div>
                <div className='mt-2 text-xs leading-5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {executivePosture.dossier.summary || 'Loading evidence packet posture…'}
                </div>
              </button>
            </div>
          </div>
        </LiquidPanel>

        {/* Bottom strip: County status */}
        <LiquidPanel variant='shell' radius='lg' className='px-4 py-2 shrink-0'>
          <div data-testid='county-status-strip' className='flex items-center justify-between text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
            <span className='font-medium' style={{ color: 'hsl(var(--tf-text))' }}>
              Benton County, WA
            </span>
            <span>{parcelCountLabel}</span>
            <span>Last sync: –</span>
            <span>Appeals: –</span>
            <span className='flex items-center gap-1'>
              <span className='inline-block w-1.5 h-1.5 rounded-full bg-green-400' />
              Status: –
            </span>
          </div>
        </LiquidPanel>
      </div>
    </div>
  );
};

export default StageZeroState;

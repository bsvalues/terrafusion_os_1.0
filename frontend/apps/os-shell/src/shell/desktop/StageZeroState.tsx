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
 * - Recent Work: live parcel browsing history from OS session state (not sample).
 * - Parcel count: from useParcelCount() → API-backed, falls back to 89,247 if offline.
 * - Today's Work: DemoDataBanner conditioned on `isSampleData` from useTodaysWork().
 * - County status strip: Last sync, appeal count, and system status fields render
 *   "–" (dash) because no live backend source exists yet. They do not claim live state.
 *
 * @module shell/desktop/StageZeroState
 */

import { cn } from '@/lib/utils';
import React, { useCallback } from 'react';
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
} from 'lucide-react';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useRecentParcels } from '../../context/parcelContext';
import { activateModule } from '../../orchestration/moduleActivation';
import { useTodaysWork, type TodaysWorkItem } from '../../hooks/useTodaysWork';
import { useParcelCount } from '../../hooks/useParcelCount';
import { DemoDataBanner } from '../../components/governance/DemoDataBanner';
import { LiquidPanel } from '../../ui/materials';
import { Z } from './zIndex';

// ============================================================================
// Types
// ============================================================================

export interface StageZeroStateProps {
  id?: string;
  className?: string;
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

/** Today's Work panel — shows tasks from useTodaysWork hook */
function TodaysWorkPanel({ tasks, onActivate }: { tasks: TodaysWorkItem[]; onActivate: (route: string) => void }) {
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

// ============================================================================
// County Map — Mapbox GL satellite map with parcel layer
// ============================================================================
import BentonCountyMap from './BentonCountyMap';

/**
 * Real Mapbox GL satellite map of Benton County WA.
 * Search bar floats above the map — opens the OS command palette.
 * Parcel click → opens PropertyWorkbench for that parcel.
 */
const CountyMapOverview: React.FC<{
  onOpenSearch: () => void;
  onParcelSelect: (parcelId: string) => void;
}> = ({ onOpenSearch, onParcelSelect }) => (
  <div
    className='relative w-full h-full rounded-xl overflow-hidden'
    aria-label='Benton County WA — satellite GIS map'
  >
    {/* Floating search bar */}
    <div
      className='absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[380px] max-w-[90%]'
      style={{ pointerEvents: 'auto' }}
    >
      <button
        onClick={onOpenSearch}
        className='w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all duration-150'
        style={{
          background: 'hsl(var(--glass-bg))',
          backdropFilter: 'blur(12px)',
          border: '1px solid hsl(var(--tf-border) / 0.6)',
          color: 'hsl(var(--tf-muted))',
          boxShadow: '0 4px 16px hsl(var(--tf-tokens-black-hs) 0% / 0.12)',
        }}
      >
        <Search
          className='h-4 w-4 flex-shrink-0'
          style={{ color: 'hsl(var(--tf-accent))' }}
        />
        <span className='text-sm flex-1'>Search parcels, addresses, owners…</span>
        <kbd
          className='text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0'
          style={{
            background: 'hsl(var(--tf-surface-2))',
            color: 'hsl(var(--tf-text))',
          }}
        >
          ⌘K
        </kbd>
      </button>
    </div>

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
  const { tasks: todaysTasks, isSampleData } = useTodaysWork();
  const { data: statsData } = useParcelCount();
  const parcelCount = statsData?.totalParcels ?? 89_247;

  const handleOpenAtlas = useCallback(() => {
    activateModule('suite-atlas', { source: 'desktop' });
  }, []);

  const handleOpenWorkbench = useCallback(() => {
    import('../../context/parcelContext').then(({ openWorkbenchWindow }) => {
      openWorkbenchWindow();
    });
  }, []);

  const handleSelectParcel = useCallback((parcelId: string) => {
    import('../../context/parcelContext').then(({ openWorkbenchWindow }) => {
      openWorkbenchWindow(parcelId);
    });
  }, []);

  const handleOpenForge = useCallback(() => {
    activateModule('suite-forge', { source: 'desktop' });
  }, []);

  const handleOpenDais = useCallback(() => {
    activateModule('suite-dais', { source: 'desktop' });
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
      <div className='pointer-events-auto h-full flex gap-3'>

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
        <div data-testid='county-map-center' className='flex-1 flex flex-col gap-3 min-w-0'>
          <GlassCard className='flex-1 p-2'>
            <CountyMapOverview onOpenSearch={openCommandPalette} onParcelSelect={handleSelectParcel} />
          </GlassCard>

          {/* Bottom strip: County status */}
          <LiquidPanel variant='shell' radius='lg' className='px-4 py-2 shrink-0'>
            <div data-testid='county-status-strip' className='flex items-center justify-between text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
              <span className='font-medium' style={{ color: 'hsl(var(--tf-text))' }}>
                Benton County, WA
              </span>
              <span>{parcelCount.toLocaleString()} parcels</span>
              <span>Last sync: –</span>
              <span>Appeals: –</span>
              <span className='flex items-center gap-1'>
                <span className='inline-block w-1.5 h-1.5 rounded-full bg-green-400' />
                Status: –
              </span>
            </div>
          </LiquidPanel>
        </div>

        {/* ═══ Right Panel: Today's Work + Quick Actions ═══ */}
        <div className='w-[240px] shrink-0 flex flex-col gap-3'>
          <GlassCard className='flex-1'>
            {isSampleData && <DemoDataBanner module="Today's Work" />}
            <TodaysWorkPanel tasks={todaysTasks} onActivate={(route) => activateModule(route, { source: 'desktop' })} />
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
    </div>
  );
};

export default StageZeroState;

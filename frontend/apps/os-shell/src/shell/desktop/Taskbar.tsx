/**
 * TerraFusion OS Dock
 *
 * Primary launcher and switcher for constitutional suites and active work.
 *
 * Layout: [TerraSphere] | [Forge] [Atlas] [Dais] [Dossier] [GPT] | (Running)
 *
 * Zone A: Home (TerraSphere → Launchpad)
 * Zone B: Constitutional suites (from suiteRegistry, centered, visually dominant)
 * Zone B overflow: Running app windows not matching a pinned suite
 *
 * @module shell/desktop/Taskbar
 */

import { cn } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Hammer,
  Globe,
  LayoutDashboard,
  FileStack,
  Bot,
} from 'lucide-react';
import { getLucideIcon } from '../../config/iconMap';
import { CONSTITUTIONAL_SUITES, type SuiteDefinition } from '../../config/suiteRegistry';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useWindowPeek } from '../../hooks/useWindowPeek';
import { useDesktopStore } from '../../stores/desktopStore';
import { Z } from './zIndex';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { useNavigate } from 'react-router-dom';

// useDataMode removed — DataModeIndicator moved to TopBar (Desktop.tsx)
import { TerraSphere } from '../../ui/brand/TerraSphere';
import { LiquidPanel } from '../../ui/materials';

import { TaskbarContextMenu } from './TaskbarContextMenu';
import { VirtualDesktopSwitcher } from './VirtualDesktopSwitcher';

// ============================================================================
// Icon resolver — maps registry iconName to actual Lucide component.
// FileStack and Bot are NOT in the shared LUCIDE_ICON_MAP, so we map directly.
// ============================================================================

const SUITE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer,
  Globe,
  LayoutDashboard,
  FileStack,
  Bot,
};

function getSuiteIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return SUITE_ICON_MAP[iconName] ?? Hammer;
}

// Suite brand accent colors — wrapped in hsl() since tokens store raw HSL tuples.
// These drive icon color (active), hover background, and running indicator dot.
const SUITE_ACCENT_MAP: Record<string, string> = {
  forge:    'hsl(var(--tf-suite-forge))',    // copper  hsl(28 82% 58%)
  atlas:    'hsl(var(--tf-suite-atlas))',    // blue    hsl(207 72% 58%)
  dais:     'hsl(var(--tf-suite-dais))',     // claret  hsl(347 48% 56%)
  dossier:  'hsl(var(--tf-suite-dossier))', // green   hsl(148 38% 46%)
  pilot:    'hsl(var(--tf-suite-pilot))',   // indigo  hsl(226 58% 61%)
};

function getSuiteAccent(suiteId: string): string {
  return SUITE_ACCENT_MAP[suiteId] ?? 'hsl(var(--tf-accent))';
}

// ============================================================================
// Zone A: Home Button (TerraSphere)
// ============================================================================

const DockHomeButton: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = useStartMenuStore();
  const navigate = useNavigate();

  return (
    <button
      id='tf-start-button'
      onClick={() => navigate('/')}
      onContextMenu={(e) => { e.preventDefault(); toggle(); }}
      title="Right-click to open launcher"
      aria-label={t('taskbar.startMenu')}
      aria-expanded={isOpen}
      aria-haspopup='menu'
      className={cn(
        'flex items-center justify-center',
        'w-16 h-16 rounded-2xl',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
        'hover:bg-[hsl(var(--tf-text)_/_0.07)]',
        isOpen && 'bg-[hsl(var(--tf-text)_/_0.10)]'
      )}
    >
      <TerraSphere size={56} state={isOpen ? 'processing' : 'idle'} />
    </button>
  );
};

// ============================================================================
// Zone B: Pinned Suite Button (Constitutional)
// ============================================================================

const DockSuiteButton: React.FC<{
  suite: SuiteDefinition;
  isRunning: boolean;
  isActive: boolean;
  onContextMenu?: (e: React.MouseEvent, suiteId: string) => void;
}> = ({ suite, isRunning, isActive, onContextMenu }) => {
  const Icon = getSuiteIcon(suite.iconName);
  const accent = getSuiteAccent(suite.id);
  const { openWindow, focusWindow, windows, activeWindowId, currentDesktopId } = useDesktopStore();

  const handleClick = () => {
    const suiteModuleId = `suite-${suite.id}`;
    const visibleWindows = windows.filter((w) => w.desktopId === currentDesktopId);
    const existing = visibleWindows.find((w) => w.moduleId === suiteModuleId);

    if (existing) {
      // Toggle: focusWindow handles minimize-if-active and restore-if-minimized
      focusWindow(existing.id);
    } else {
      openWindow(suiteModuleId, suite.displayName, suite.iconName);
    }
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu?.(e, suite.id)}
      aria-label={suite.displayName}
      title={suite.displayName}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5',
        'w-14 h-14 rounded-2xl',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
        isActive && 'bg-[hsl(var(--tf-text)_/_0.10)]'
      )}
      style={isActive ? undefined : undefined}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${accent} 12%, transparent)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      <Icon
        className='h-5 w-5'
        style={{ color: isActive ? accent : 'hsl(var(--tf-text) / 0.7)' }}
      />
      <span
        className='text-[11px] font-medium leading-none'
        style={{ color: isActive ? accent : 'hsl(var(--tf-muted))' }}
      >
        {suite.shortName}
      </span>
      {/* Running indicator — suite brand color */}
      {isRunning && (
        <div
          className='absolute bottom-0.5 left-1/2 -translate-x-1/2'
          style={{
            width: isActive ? 6 : 4,
            height: isActive ? 6 : 4,
            borderRadius: '50%',
            background: accent,
            boxShadow: isActive ? `0 0 6px color-mix(in srgb, ${accent} 60%, transparent)` : 'none',
            opacity: isActive ? 1 : 0.6,
          }}
        />
      )}
    </button>
  );
};

// ============================================================================
// Zone B: Core Suite Zone (pinned suites)
// ============================================================================

const CoreSuiteZone: React.FC = () => {
  const { windows, activeWindowId, currentDesktopId } = useDesktopStore();
  const visibleWindows = windows.filter((w) => w.desktopId === currentDesktopId);
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();
  const [contextMenuWindow, setContextMenuWindow] = useState<(typeof windows)[0] | null>(null);

  const handleSuiteContextMenu = (e: React.MouseEvent, suiteId: string) => {
    const suiteWindow = visibleWindows.find((w) => w.moduleId === `suite-${suiteId}`);
    if (suiteWindow) {
      handleContextMenu(e);
      setContextMenuWindow(suiteWindow);
    }
  };

  return (
    <>
      <div className='flex items-center gap-1' role='group' aria-label='Core suites'>
        {CONSTITUTIONAL_SUITES.map((suite) => {
          const suiteModuleId = `suite-${suite.id}`;
          const isRunning = visibleWindows.some((w) => w.moduleId === suiteModuleId);
          const isActive = visibleWindows.some((w) => w.moduleId === suiteModuleId && w.id === activeWindowId);
          return (
            <DockSuiteButton
              key={suite.id}
              suite={suite}
              isRunning={isRunning}
              isActive={isActive}
              onContextMenu={handleSuiteContextMenu}
            />
          );
        })}
      </div>

      {isContextMenuOpen && contextMenuWindow && (
        <TaskbarContextMenu
          window={contextMenuWindow}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
};

// ============================================================================
// Zone B (overflow): Running Apps not matching pinned suites
// ============================================================================

interface DockAppButtonProps {
  windowId: string;
  title: string;
  icon: string;
  isActive: boolean;
  isMinimized: boolean;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onMouseEnter: (rect: DOMRect) => void;
  onMouseLeave: () => void;
}

const DockAppButton: React.FC<DockAppButtonProps> = ({
  windowId,
  title,
  icon,
  isActive,
  isMinimized,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const Icon = getLucideIcon(icon);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => {
        if (buttonRef.current) onMouseEnter(buttonRef.current.getBoundingClientRect());
      }}
      onMouseLeave={onMouseLeave}
      aria-label={title}
      aria-pressed={isActive}
      data-minimized={isMinimized}
      title={title}
      className={cn(
        'relative flex items-center justify-center',
        'w-12 h-12 rounded-xl',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
        'hover:bg-[hsl(var(--tf-text)_/_0.07)]',
        isActive && 'bg-[hsl(var(--tf-text)_/_0.10)]',
        isMinimized && !isActive && 'opacity-50'
      )}
    >
      <Icon className='h-5 w-5' style={{ color: 'hsl(var(--tf-text) / 0.75)' }} />
      {isActive && (
        <div
          className='absolute -bottom-0.5 left-1/2 -translate-x-1/2'
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
            boxShadow: '0 0 6px hsl(var(--tf-transcend-cyan-hs) 50% / 0.6)',
          }}
        />
      )}
    </button>
  );
};

const RunningApps: React.FC = () => {
  const { t } = useTranslation();
  const { windows, activeWindowId, focusWindow, currentDesktopId } = useDesktopStore();
  const { handleMouseEnter: peekMouseEnter, handleMouseLeave: peekMouseLeave } = useWindowPeek();
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();
  const [contextMenuWindow, setContextMenuWindow] = useState<(typeof windows)[0] | null>(null);

  // Only show windows that DON'T match a constitutional suite (those are in CoreSuiteZone)
  const pinnedIds = new Set(CONSTITUTIONAL_SUITES.map((s) => s.id));
  const visibleWindows = windows.filter(
    (w) => w.desktopId === currentDesktopId && !pinnedIds.has(w.moduleId ?? '')
  );

  if (visibleWindows.length === 0) return null;

  return (
    <>
      <div
        data-testid='running-apps'
        className='flex items-center gap-1'
        role='group'
        aria-label={t('taskbar.runningApps')}
      >
        {visibleWindows.map((window) => (
          <DockAppButton
            key={window.id}
            windowId={window.id}
            title={window.title}
            icon={window.icon}
            isActive={window.id === activeWindowId}
            isMinimized={window.state === 'minimized'}
            onClick={() => focusWindow(window.id)}
            onContextMenu={(e) => {
              handleContextMenu(e);
              setContextMenuWindow(window);
            }}
            onMouseEnter={(rect) => peekMouseEnter(window.id, rect)}
            onMouseLeave={peekMouseLeave}
          />
        ))}
      </div>

      {isContextMenuOpen && contextMenuWindow && (
        <TaskbarContextMenu
          window={contextMenuWindow}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
};

// ============================================================================
// Dock Divider
// ============================================================================

const DockDivider: React.FC = () => (
  <div
    style={{
      width: 1,
      height: 36,
      background: 'hsl(var(--tf-border) / 0.2)',
      flexShrink: 0,
    }}
  />
);

// DataModeIndicator has been extracted to DataModeIndicator.tsx
// and moved to the TopBar (Desktop.tsx Zone C) where system-level
// status indicators belong. The dock is a launcher and window switcher only.

// ============================================================================
// Main Dock Component
// ============================================================================

export interface TaskbarProps {
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  className,
}) => {
  const { t } = useTranslation();
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);

  return (
    <>
      <VirtualDesktopSwitcher isOpen={isTaskViewOpen} onClose={() => setIsTaskViewOpen(false)} />
      <LiquidPanel
        variant='shell'
        radius='xl'
        role='navigation'
        aria-label={t('taskbar.ariaLabel')}
        className={cn(
          // Floating centered dock
          'fixed bottom-4 left-1/2 -translate-x-1/2',
          // Layout
          'flex items-center gap-2 px-3 h-[68px]',
          className
        )}
        style={{ maxWidth: 'calc(100vw - 2rem)', zIndex: Z.dock }}
      >
        {/* Zone A: Home */}
        <DockHomeButton />

        <DockDivider />

        {/* Zone B: Core Suites (centered, dominant) */}
        <CoreSuiteZone />

        {/* Running apps that aren't constitutional suites */}
        <RunningApps />
      </LiquidPanel>
    </>
  );
};

export default Taskbar;

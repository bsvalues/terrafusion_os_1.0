/**
 * TerraFusion OS Taskbar Component
 *
 * Government-Grade Desktop Taskbar
 * Fixed position at bottom of screen with Start button, running apps, and system tray.
 *
 * @module shell/desktop/Taskbar
 * @see SUCCESS CRITERIA SC-2, Phase 7
 */

import { cn } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ParcelContextIndicator } from '../../components/ParcelContext';
import { getLucideIcon } from '../../config/iconMap';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useWindowPeek } from '../../hooks/useWindowPeek';
import { SentinelChip } from '../../sentinel/SentinelChip';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { TerraSphere } from '../../ui/brand/TerraSphere';
import { TerraSphereIcon } from '../../ui/brand/TerraSphereIcon';
import { AIStatusIndicator, defaultAIStatus, type AIStatus } from './AIStatusPanel';
import { Clock } from './Clock';
import { NotificationBell, type Notification } from './NotificationBell';
import { TaskbarContextMenu } from './TaskbarContextMenu';
import { VirtualDesktopSwitcher } from './VirtualDesktopSwitcher';

const SOVEREIGN_NODES = ['Files', 'Identity', 'Finance'];

// ============================================================================
// Default Demo Data
// ============================================================================

const defaultNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Assessment Complete',
    message: 'Property assessment for 123 Main St has been completed successfully.',
    type: 'success',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'AI Analysis Ready',
    message: 'CostForge AI has finished analyzing the Q4 data. View results now.',
    type: 'info',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    title: 'System Update Available',
    message: 'TerraFusion OS v2.1 is ready to install. Restart to apply updates.',
    type: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * TerraFusion Start Button
 */
const StartButton: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = useStartMenuStore();

  return (
    <button
      onClick={toggle}
      aria-label={t('taskbar.startMenu')}
      aria-expanded={isOpen}
      aria-haspopup='menu'
      className={cn(
        // Base styles
        'flex items-center justify-center',
        'w-12 h-10 rounded-md',
        'transition-all duration-200 ease-out',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        // Hover state
        'hover:bg-white/10',
        // Active/pressed state
        isOpen && 'bg-white/15 shadow-[0_0_20px_rgba(0,255,238,0.3)]'
      )}
    >
      {/* TerraSphere Logo */}
      <TerraSphere size={32} state={isOpen ? 'processing' : 'idle'} />
    </button>
  );
};

/**
 * Task View Button
 */
const TaskViewButton: React.FC<{ onClick: () => void; isOpen: boolean }> = ({
  onClick,
  isOpen,
}) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      aria-label={t('taskbar.taskView')}
      aria-pressed={isOpen}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md transition-all hover:bg-white/10',
        isOpen && 'bg-white/15'
      )}
      title={t('taskbar.taskView')}
    >
      <span className='text-xl'>🔲</span>
    </button>
  );
};

const SovereignDock: React.FC = () => {
  const { openWindow } = useDesktopStore();

  const handleNodeClick = (node: string) => {
    if (node === 'Files') {
      openWindow('axiom-fs', 'AxiomFS', '🌀');
    }
  };

  return (
    <div className='flex items-center gap-2 px-2 shrink-0'>
      {SOVEREIGN_NODES.map((node) => (
        <button
          key={node}
          type='button'
          onClick={() => handleNodeClick(node)}
          data-testid={`sovereign-launch-${node.toLowerCase()}`}
          className='glass-button px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-white/90'
        >
          {node}
        </button>
      ))}
    </div>
  );
};

/**
 * Taskbar App Button for running windows
 */
interface TaskbarAppButtonProps {
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

const TaskbarAppButton: React.FC<TaskbarAppButtonProps> = ({
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

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      onMouseEnter(buttonRef.current.getBoundingClientRect());
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={title}
      aria-pressed={isActive}
      data-minimized={isMinimized}
      className={cn(
        // Base styles
        'flex items-center gap-2 px-3 h-10',
        'max-w-[180px] min-w-[100px]',
        'rounded-md',
        'transition-all duration-150 ease-out',
        // Text styles
        'text-sm text-white/90 truncate',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        // Hover state
        'hover:bg-white/10',
        // Active window indicator
        isActive && [
          'bg-white/15',
          'border-b-2 border-[var(--tf-transcend-highlight)]',
          'shadow-[0_2px_10px_rgba(0,255,238,0.3)]',
        ],
        // Minimized state (dimmed)
        isMinimized && !isActive && 'opacity-60'
      )}
    >
      <div className='flex-shrink-0' role='img' aria-hidden='true'>
        <TerraSphereIcon size={28} variant='default' glyph={<Icon className='h-3 w-3' />} />
      </div>
      <span className='truncate'>{title}</span>
    </button>
  );
};

/**
 * Running Apps Section
 */
const RunningAppsBar: React.FC = () => {
  const { t } = useTranslation();
  const { windows, activeWindowId, focusWindow, currentDesktopId } = useDesktopStore();

  // Window peek hover handlers
  const { handleMouseEnter: peekMouseEnter, handleMouseLeave: peekMouseLeave } = useWindowPeek();

  // Context menu state
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();
  const [contextMenuWindow, setContextMenuWindow] = useState<(typeof windows)[0] | null>(null);

  const handleAppClick = (windowId: string) => {
    focusWindow(windowId);
  };

  const handleAppContextMenu = (event: React.MouseEvent, window: (typeof windows)[0]) => {
    handleContextMenu(event);
    setContextMenuWindow(window);
  };

  const handlePeekEnter = (windowId: string, rect: DOMRect) => {
    peekMouseEnter(windowId, rect);
  };

  const visibleWindows = windows.filter((w) => w.desktopId === currentDesktopId);

  return (
    <>
      <div
        data-testid='running-apps'
        className='flex items-center gap-1 flex-1 min-w-0 px-2'
        role='group'
        aria-label={t('taskbar.runningApps')}
      >
        {visibleWindows.map((window) => (
          <TaskbarAppButton
            key={window.id}
            windowId={window.id}
            title={window.title}
            icon={window.icon}
            isActive={window.id === activeWindowId}
            isMinimized={window.state === 'minimized'}
            onClick={() => handleAppClick(window.id)}
            onContextMenu={(e) => handleAppContextMenu(e, window)}
            onMouseEnter={(rect) => handlePeekEnter(window.id, rect)}
            onMouseLeave={peekMouseLeave}
          />
        ))}
      </div>

      {/* Taskbar Context Menu */}
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

/**
 * System Tray - Enhanced with AI Status, Health, Notifications, Clock
 */
interface SystemTrayProps {
  aiStatus?: AIStatus;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationClearAll?: () => void;
}

const SystemTray: React.FC<SystemTrayProps> = ({
  aiStatus = defaultAIStatus,
  notifications = defaultNotifications,
  onNotificationClick,
  onNotificationDismiss,
  onNotificationClearAll,
}) => {
  const { t } = useTranslation();
  return (
    <div
      data-testid='system-tray'
      className='flex items-center gap-1 border-l border-white/10 pl-3'
      role='group'
      aria-label={t('taskbar.systemTray')}
    >
      {/* Parcel Context (Slice 10: always visible) */}
      <ParcelContextIndicator compact />

      {/* Divider */}
      <div className='w-px h-6 bg-white/10 mx-1' />

      {/* Backend Health (single source of truth) */}
      <SentinelChip variant='tray' />

      {/* Agents Online */}
      <AIStatusIndicator status={aiStatus} />

      {/* Divider */}
      <div className='w-px h-6 bg-white/10 mx-1' />

      {/* Notifications */}
      <NotificationBell
        notifications={notifications}
        onNotificationClick={onNotificationClick}
        onDismiss={onNotificationDismiss}
        onClearAll={onNotificationClearAll}
      />

      {/* Clock */}
      <Clock />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface TaskbarProps {
  aiStatus?: AIStatus;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationClearAll?: () => void;
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  aiStatus,
  notifications,
  onNotificationClick,
  onNotificationDismiss,
  onNotificationClearAll,
  className,
}) => {
  const { t } = useTranslation();
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);

  return (
    <>
      <VirtualDesktopSwitcher isOpen={isTaskViewOpen} onClose={() => setIsTaskViewOpen(false)} />
      <nav
        role='navigation'
        aria-label={t('taskbar.ariaLabel')}
        className={cn(
          // Position
          'fixed bottom-0 left-0 right-0 z-50',
          // Size
          'h-12', // 48px
          // Layout
          'flex items-center px-1',
          // Glass effect class for tests/consistency
          'backdrop-blur-xl',
          className
        )}
        style={{
          // Immersive Glassmorphism - floats over WebGL
          background: 'rgba(10, 14, 26, 0.7)',
          backdropFilter: 'saturate(200%) blur(30px)',
          WebkitBackdropFilter: 'saturate(200%) blur(30px)',
          borderTop: '1px solid rgba(0, 229, 255, 0.25)',
          boxShadow: `
            0 -8px 32px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(0, 229, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08)
          `,
        }}
      >
        {/* Start Button */}
        <StartButton />

        {/* Task View Button */}
        <div className='ml-1'>
          <TaskViewButton
            onClick={() => setIsTaskViewOpen(!isTaskViewOpen)}
            isOpen={isTaskViewOpen}
          />
        </div>

        {/* Divider */}
        <div className='w-px h-8 bg-white/10 mx-1' />

        {/* Sovereign Dock */}
        <SovereignDock />

        {/* Running Apps */}
        <RunningAppsBar />

        {/* System Tray */}
        <SystemTray
          aiStatus={aiStatus}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onNotificationDismiss={onNotificationDismiss}
          onNotificationClearAll={onNotificationClearAll}
        />
      </nav>
    </>
  );
};

export default Taskbar;

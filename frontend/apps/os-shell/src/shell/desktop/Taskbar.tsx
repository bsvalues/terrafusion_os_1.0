/**
 * TerraFusion OS Dock
 *
 * macOS Tahoe-inspired floating centered dock with glass effect.
 * Replaces the Windows 11-style full-width taskbar.
 *
 * Layout: [TerraSphere home] | [Running apps] | [System tray]
 *
 * @module shell/desktop/Taskbar
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
import { LiquidPanel } from '../../ui/materials';
import { AIStatusIndicator, defaultAIStatus, type AIStatus } from './AIStatusPanel';
import { Clock } from './Clock';
import { NotificationBell, type Notification } from './NotificationBell';
import { TaskbarContextMenu } from './TaskbarContextMenu';
import { VirtualDesktopSwitcher } from './VirtualDesktopSwitcher';

// ============================================================================
// Default notification state (empty — populated by real events at runtime)
// ============================================================================

const defaultNotifications: Notification[] = [];

// ============================================================================
// Dock Home Button (TerraSphere)
// ============================================================================

const DockHomeButton: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = useStartMenuStore();

  return (
    <button
      id='tf-start-button'
      onClick={toggle}
      aria-label={t('taskbar.startMenu')}
      aria-expanded={isOpen}
      aria-haspopup='menu'
      className={cn(
        'flex items-center justify-center',
        'w-10 h-10 rounded-lg',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
        'hover:bg-white/8',
        isOpen && 'bg-white/12'
      )}
    >
      <TerraSphere size={28} state={isOpen ? 'processing' : 'idle'} />
    </button>
  );
};

// ============================================================================
// Dock App Button (running windows)
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
        'w-10 h-10 rounded-lg',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
        'hover:bg-white/8',
        isActive && 'bg-white/10',
        isMinimized && !isActive && 'opacity-50'
      )}
    >
      <TerraSphereIcon size={28} variant='default' glyph={<Icon className='h-3 w-3' />} />
      {/* Active indicator dot */}
      {isActive && (
        <div
          className='absolute -bottom-0.5 left-1/2 -translate-x-1/2'
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
            boxShadow: '0 0 6px hsl(var(--tf-transcend-cyan-hs) 50% / 0.6)',
          }}
        />
      )}
      {/* Running indicator dot (not active) */}
      {!isActive && !isMinimized && (
        <div
          className='absolute -bottom-0.5 left-1/2 -translate-x-1/2'
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'hsl(var(--tf-neutral-hs) 60%)',
          }}
        />
      )}
    </button>
  );
};

// ============================================================================
// Running Apps
// ============================================================================

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

  const visibleWindows = windows.filter((w) => w.desktopId === currentDesktopId);

  if (visibleWindows.length === 0) return null;

  return (
    <>
      <div
        data-testid='running-apps'
        className='flex items-center gap-0.5'
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
// System Tray (compact)
// ============================================================================

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
      className='flex items-center gap-1'
      role='group'
      aria-label={t('taskbar.systemTray')}
    >
      <ParcelContextIndicator compact />
      <SentinelChip variant='tray' />
      <AIStatusIndicator status={aiStatus} />
      <NotificationBell
        notifications={notifications}
        onNotificationClick={onNotificationClick}
        onDismiss={onNotificationDismiss}
        onClearAll={onNotificationClearAll}
      />
      <Clock />
    </div>
  );
};

// ============================================================================
// Main Dock Component
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
      <LiquidPanel
        variant='shell'
        radius='xl'
        role='navigation'
        aria-label={t('taskbar.ariaLabel')}
        className={cn(
          // Floating centered dock
          'fixed bottom-2 left-1/2 -translate-x-1/2 z-[1000]',
          // Layout
          'flex items-center gap-1 px-2 h-12',
          className
        )}
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {/* Home button */}
        <DockHomeButton />

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'hsl(var(--tf-border) / 0.3)', flexShrink: 0 }} />

        {/* Running apps */}
        <RunningApps />

        {/* Divider (only if running apps exist) */}
        <div style={{ width: 1, height: 24, background: 'hsl(var(--tf-border) / 0.3)', flexShrink: 0 }} />

        {/* System tray */}
        <SystemTray
          aiStatus={aiStatus}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onNotificationDismiss={onNotificationDismiss}
          onNotificationClearAll={onNotificationClearAll}
        />
      </LiquidPanel>
    </>
  );
};

export default Taskbar;

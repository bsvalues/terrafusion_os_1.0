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
import { useContextMenu } from '../../hooks/useContextMenu';
import { useWindowPeek } from '../../hooks/useWindowPeek';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { AIStatusIndicator, defaultAIStatus, type AIStatus } from './AIStatusPanel';
import { Clock } from './Clock';
import { NotificationBell, type Notification } from './NotificationBell';
import {
  SystemHealthIndicator,
  defaultHealthStatus,
  type SystemHealthStatus,
} from './SystemHealthPanel';
import { TaskbarContextMenu } from './TaskbarContextMenu';
import { VirtualDesktopSwitcher } from './VirtualDesktopSwitcher';

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
      {/* TerraFusion Logo */}
      <div
        className={cn(
          'w-7 h-7 rounded-md',
          'flex items-center justify-center',
          'font-bold text-sm',
          'bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)]',
          'text-[var(--tf-void-black)]',
          'shadow-[0_0_10px_rgba(0,153,255,0.5)]',
          'transition-transform duration-200',
          isOpen && 'scale-110'
        )}
      >
        TF
      </div>
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
      <span className='text-lg flex-shrink-0' role='img' aria-hidden='true'>
        {icon}
      </span>
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
  healthStatus?: SystemHealthStatus;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationClearAll?: () => void;
}

const SystemTray: React.FC<SystemTrayProps> = ({
  aiStatus = defaultAIStatus,
  healthStatus = defaultHealthStatus,
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
      {/* AI Status */}
      <AIStatusIndicator status={aiStatus} />

      {/* System Health */}
      <SystemHealthIndicator status={healthStatus} />

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
  healthStatus?: SystemHealthStatus;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationClearAll?: () => void;
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  aiStatus,
  healthStatus,
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
          // Background with glass effect
          'bg-[var(--tf-void-black)]/80 backdrop-blur-xl',
          // Border
          'border-t border-[var(--tf-transcend-highlight)]/20',
          // Shadow
          'shadow-[0_-4px_20px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
          // Layout
          'flex items-center px-1',
          className
        )}
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

        {/* Running Apps */}
        <RunningAppsBar />

        {/* System Tray */}
        <SystemTray
          aiStatus={aiStatus}
          healthStatus={healthStatus}
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

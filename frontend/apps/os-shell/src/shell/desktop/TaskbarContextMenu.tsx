/**
 * TerraFusion OS Taskbar Context Menu
 *
 * Right-click context menu for taskbar items (running windows)
 * - Close
 * - Minimize
 * - Maximize/Restore
 * - Pin to Start
 *
 * @module shell/desktop/TaskbarContextMenu
 */

import React from 'react';
import { Maximize2, Minimize2, Minus, Pin, X } from 'lucide-react';
import { useDesktopStore, type DesktopWindow } from '../../stores/desktopStore';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

// ============================================================================
// Types
// ============================================================================

export interface TaskbarContextMenuProps {
  /** Window associated with taskbar item */
  window: DesktopWindow;
  /** Position to render menu */
  position: { x: number; y: number };
  /** Callback when menu should close */
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TaskbarContextMenu - Taskbar item right-click menu
 *
 * Actions:
 * - Close (closes window)
 * - Minimize (minimizes window)
 * - Maximize/Restore (toggles maximized state)
 * - Pin to Start (adds to start menu pinned items - future feature)
 *
 * Usage:
 * ```tsx
 * {isMenuOpen && (
 *   <TaskbarContextMenu
 *     window={window}
 *     position={menuPosition}
 *     onClose={() => setIsMenuOpen(false)}
 *   />
 * )}
 * ```
 */
export const TaskbarContextMenu: React.FC<TaskbarContextMenuProps> = ({
  window,
  position,
  onClose,
}) => {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow } = useDesktopStore();

  const isMaximized = window.state === 'maximized';
  const isMinimized = window.state === 'minimized';

  const menuItems: ContextMenuItem[] = [
    {
      id: 'restore',
      label: 'Restore',
      icon: <Minimize2 className='h-3.5 w-3.5' />,
      disabled: !isMaximized && !isMinimized,
      onClick: () => restoreWindow(window.id),
    },
    {
      id: 'minimize',
      label: 'Minimize',
      icon: <Minus className='h-3.5 w-3.5' />,
      disabled: isMinimized,
      onClick: () => minimizeWindow(window.id),
      shortcut: 'Win+↓',
    },
    {
      id: 'maximize',
      label: 'Maximize',
      icon: <Maximize2 className='h-3.5 w-3.5' />,
      disabled: isMaximized,
      onClick: () => maximizeWindow(window.id),
      shortcut: 'Win+↑',
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
    },
    {
      id: 'close',
      label: 'Close Window',
      icon: <X className='h-3.5 w-3.5' />,
      onClick: () => closeWindow(window.id),
      shortcut: 'Alt+F4',
    },
    {
      id: 'separator-2',
      label: '',
      separator: true,
    },
    {
      id: 'pin-to-start',
      label: 'Pin to Start',
      icon: <Pin className='h-3.5 w-3.5' />,
      disabled: true, // Future feature - requires start menu integration
      onClick: () => {
        // TODO: Add to start menu pinned items
      },
    },
  ];

  return <ContextMenu items={menuItems} position={position} onClose={onClose} />;
};

export default TaskbarContextMenu;

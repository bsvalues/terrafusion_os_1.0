/**
 * TerraFusion OS Window Context Menu
 *
 * Right-click context menu for window titlebar
 * - Minimize
 * - Maximize/Restore
 * - Close
 * - Snap Left
 * - Snap Right
 *
 * @module shell/desktop/WindowContextMenu
 */

import React from 'react';
import { useDesktopStore, type DesktopWindow } from '../../stores/desktopStore';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

// ============================================================================
// Types
// ============================================================================

export interface WindowContextMenuProps {
  /** Window to control */
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
 * WindowContextMenu - Window titlebar right-click menu
 *
 * Actions:
 * - Minimize (minimizes window)
 * - Maximize/Restore (toggles maximized state)
 * - Close (closes window)
 * - Snap Left (snaps window to left half)
 * - Snap Right (snaps window to right half)
 *
 * Usage:
 * ```tsx
 * {isMenuOpen && (
 *   <WindowContextMenu
 *     window={window}
 *     position={menuPosition}
 *     onClose={() => setIsMenuOpen(false)}
 *   />
 * )}
 * ```
 */
export const WindowContextMenu: React.FC<WindowContextMenuProps> = ({
  window: windowData,
  position,
  onClose,
}) => {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, snapWindow } =
    useDesktopStore();

  const isMaximized = windowData.state === 'maximized';
  const isMinimized = windowData.state === 'minimized';
  const isSnapped = windowData.state === 'snapped';

  const menuItems: ContextMenuItem[] = [
    {
      id: 'restore',
      label: 'Restore',
      icon: '🗗',
      disabled: !isMaximized && !isMinimized && !isSnapped,
      onClick: () => restoreWindow(windowData.id),
    },
    {
      id: 'minimize',
      label: 'Minimize',
      icon: '🗕',
      disabled: isMinimized,
      onClick: () => minimizeWindow(windowData.id),
      shortcut: 'Win+↓',
    },
    {
      id: 'maximize',
      label: 'Maximize',
      icon: '🗖',
      disabled: isMaximized,
      onClick: () => maximizeWindow(windowData.id),
      shortcut: 'Win+↑',
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
    },
    {
      id: 'snap-left',
      label: 'Snap to Left',
      icon: '⬅️',
      disabled: isMaximized || isMinimized || (isSnapped && windowData.snapZone === 'left'),
      onClick: () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        snapWindow(windowData.id, 'left', viewportWidth, viewportHeight);
      },
      shortcut: 'Win+←',
    },
    {
      id: 'snap-right',
      label: 'Snap to Right',
      icon: '➡️',
      disabled: isMaximized || isMinimized || (isSnapped && windowData.snapZone === 'right'),
      onClick: () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        snapWindow(windowData.id, 'right', viewportWidth, viewportHeight);
      },
      shortcut: 'Win+→',
    },
    {
      id: 'separator-2',
      label: '',
      separator: true,
    },
    {
      id: 'close',
      label: 'Close',
      icon: '✖',
      onClick: () => closeWindow(windowData.id),
      shortcut: 'Alt+F4',
    },
  ];

  return <ContextMenu items={menuItems} position={position} onClose={onClose} />;
};

export default WindowContextMenu;

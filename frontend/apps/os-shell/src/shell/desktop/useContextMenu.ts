/**
 * TerraFusion OS Context Menu Hook
 *
 * Custom React hook for managing context menu state:
 * - Position tracking
 * - Open/close state
 * - Right-click event handling
 *
 * @module shell/desktop/useContextMenu
 */

import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UseContextMenuReturn {
  /** Whether context menu is currently open */
  isOpen: boolean;
  /** Current menu position */
  position: ContextMenuPosition;
  /** Open menu at specific position */
  openMenu: (x: number, y: number) => void;
  /** Close menu */
  closeMenu: () => void;
  /** Handle right-click event (prevents default, opens menu) */
  handleContextMenu: (e: React.MouseEvent) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useContextMenu - Context menu state management
 *
 * Handles:
 * 1. Menu open/close state
 * 2. Position tracking
 * 3. Right-click event handling
 *
 * Usage:
 * ```tsx
 * const { isOpen, position, closeMenu, handleContextMenu } = useContextMenu();
 *
 * return (
 *   <div onContextMenu={handleContextMenu}>
 *     {isOpen && (
 *       <ContextMenu
 *         position={position}
 *         onClose={closeMenu}
 *         items={menuItems}
 *       />
 *     )}
 *   </div>
 * );
 * ```
 *
 * @returns Context menu state and control functions
 */
export function useContextMenu(): UseContextMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

  /**
   * Open menu at specific position
   */
  const openMenu = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  /**
   * Close menu
   */
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Handle right-click event
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      openMenu(e.clientX, e.clientY);
    },
    [openMenu]
  );

  return {
    isOpen,
    position,
    openMenu,
    closeMenu,
    handleContextMenu,
  };
}

export default useContextMenu;

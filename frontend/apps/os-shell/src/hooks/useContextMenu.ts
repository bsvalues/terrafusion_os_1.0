/**
 * TerraFusion OS useContextMenu Hook
 *
 * Priority 6: Reusable context menu state management.
 *
 * Features:
 * - Position tracking at cursor location
 * - Open/close state management
 * - Click outside to close
 * - Escape key to close
 * - Generic targetData for menu context
 *
 * @module hooks/useContextMenu
 * @see Priority 6: Context Menus
 */

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UseContextMenuReturn<T = unknown> {
  /** Whether the context menu is currently open */
  isOpen: boolean;
  /** Current position of the context menu */
  position: ContextMenuPosition;
  /** Data associated with the target element (e.g., module ID, window ID) */
  targetData: T | null;
  /** Open the context menu at a specific position */
  openMenu: (position: ContextMenuPosition, data?: T) => void;
  /** Close the context menu */
  closeMenu: () => void;
  /** Event handler for onContextMenu - convenience method */
  handleContextMenu: (event: React.MouseEvent, data?: T) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useContextMenu - Reusable context menu state management hook.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, position, targetData, handleContextMenu, closeMenu } = useContextMenu<{ id: string }>();
 *
 *   return (
 *     <>
 *       <div onContextMenu={(e) => handleContextMenu(e, { id: 'item-1' })}>
 *         Right-click me
 *       </div>
 *       {isOpen && (
 *         <ContextMenu position={position} data={targetData} onClose={closeMenu} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * @template T - Type for targetData (e.g., { moduleId: string } or { windowId: string })
 * @returns Context menu state and handlers
 */
export function useContextMenu<T = unknown>(): UseContextMenuReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetData, setTargetData] = useState<T | null>(null);

  // ==========================================================================
  // Open Menu
  // ==========================================================================

  const openMenu = useCallback((pos: ContextMenuPosition, data?: T) => {
    setPosition(pos);
    setTargetData(data ?? null);
    setIsOpen(true);
  }, []);

  // ==========================================================================
  // Close Menu
  // ==========================================================================

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setTargetData(null);
  }, []);

  // ==========================================================================
  // Event Handler for onContextMenu
  // ==========================================================================

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, data?: T) => {
      event.preventDefault();
      openMenu({ x: event.clientX, y: event.clientY }, data);
    },
    [openMenu]
  );

  // ==========================================================================
  // Escape Key Handler (SC-9.5)
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeMenu]);

  // ==========================================================================
  // Click Outside Handler (SC-9.4)
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = () => {
      closeMenu();
    };

    // Delay attachment to prevent immediate close from the right-click itself
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    isOpen,
    position,
    targetData,
    openMenu,
    closeMenu,
    handleContextMenu,
  };
}

export default useContextMenu;

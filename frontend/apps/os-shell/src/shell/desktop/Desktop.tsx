/**
 * TerraFusion OS Desktop Component
 *
 * Root orchestrator that combines all shell components into a cohesive
 * desktop environment. Handles global keyboard shortcuts and layout.
 * Includes error boundary protection and toast notifications.
 *
 * @module shell/desktop/Desktop
 * @see SUCCESS CRITERIA SC-2.4, SC-3.1, SC-3.11, SC-5.1, SC-7, SC-9
 */

import { useCallback, useEffect } from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { ToastContainer } from '../notifications/ToastContainer';
import { DesktopBackground } from './DesktopBackground';
import { DesktopErrorBoundary } from './DesktopErrorBoundary';
import { DesktopIconGrid } from './DesktopIconGrid';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';

// ============================================================================
// Types
// ============================================================================

export interface DesktopProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Desktop Component
// ============================================================================

/**
 * Desktop - Root orchestrator for the TerraFusion OS shell.
 *
 * Architecture:
 * ```
 * <DesktopErrorBoundary>
 *   <Desktop>
 *     ├── <DesktopBackground />  (z: 0)
 *     ├── <WindowManager />      (z: 1-999)
 *     ├── <Taskbar />            (z: 1000)
 *     ├── <StartMenu />          (z: 1001, conditional)
 *     └── <ToastContainer />     (z: 50)
 *   </Desktop>
 * </DesktopErrorBoundary>
 * ```
 *
 * Features:
 * - Global keyboard shortcuts (Meta/Win, Escape)
 * - Click-outside to close Start Menu
 * - Full viewport coverage with overflow hidden
 * - Proper stacking context for all layers
 * - Error boundary protection against crashes
 * - Toast notifications for user feedback
 *
 * @example
 * ```tsx
 * // In app root
 * <DesktopWithErrorBoundary />
 * ```
 */
export function Desktop({ className = '' }: DesktopProps) {
  // Subscribe to Start Menu state
  const isStartMenuOpen = useStartMenuStore((state) => state.isOpen);
  const toggleStartMenu = useStartMenuStore((state) => state.toggle);
  const closeStartMenu = useStartMenuStore((state) => state.close); // Used by click-outside handler

  // ============================================================================
  // Global Keyboard Shortcuts (Priority 2)
  // Ctrl+1..7 for modules, Ctrl+` for Start Menu, Escape to close
  // ============================================================================
  useKeyboardShortcuts();

  // ============================================================================
  // Keyboard Shortcut Handler (Meta/Windows key only)
  // Note: Ctrl+1..7, Ctrl+`, and Escape are handled by useKeyboardShortcuts()
  // ============================================================================

  const handleMetaKey = useCallback(
    (event: KeyboardEvent) => {
      // Meta (Windows key) or OS key - toggle Start Menu
      if (event.key === 'Meta' || event.key === 'OS') {
        event.preventDefault();
        toggleStartMenu();
        return;
      }
    },
    [toggleStartMenu]
  );

  // Register Meta key listener (separate from useKeyboardShortcuts)
  useEffect(() => {
    document.addEventListener('keydown', handleMetaKey);
    return () => {
      document.removeEventListener('keydown', handleMetaKey);
    };
  }, [handleMetaKey]);

  // ============================================================================
  // Click Outside Handler
  // ============================================================================

  const handleDesktopClick = useCallback(
    (event: React.MouseEvent) => {
      // Only close if Start Menu is open and click is on the desktop itself
      if (isStartMenuOpen && event.target === event.currentTarget) {
        closeStartMenu();
      }
    },
    [isStartMenuOpen, closeStartMenu]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      data-testid='desktop'
      role='main'
      aria-label='TerraFusion Desktop'
      tabIndex={-1}
      className={`
        relative w-screen h-screen overflow-hidden
        bg-[#0a0e1a]
        ${className}
      `.trim()}
      onMouseDown={handleDesktopClick}
    >
      {/* Layer 0: Background */}
      <DesktopBackground />

      {/* Layer 0.5: Desktop Icons (Priority 3) */}
      <DesktopIconGrid className="absolute top-4 left-4 z-[1]" />

      {/* Layer 1-999: Windows */}
      <WindowManager />

      {/* Layer 1000: Taskbar */}
      <Taskbar />

      {/* Layer 1001: Start Menu (conditional) */}
      {isStartMenuOpen && <StartMenu />}

      {/* Layer 50: Toast Notifications (bottom-right, above taskbar) */}
      <ToastContainer />
    </div>
  );
}

/**
 * Desktop with Error Boundary
 *
 * Wraps the Desktop in a DesktopErrorBoundary for crash protection.
 * Use this as the main export for app entry points.
 */
export function DesktopWithErrorBoundary(props: DesktopProps) {
  return (
    <DesktopErrorBoundary>
      <Desktop {...props} />
    </DesktopErrorBoundary>
  );
}

export default Desktop;

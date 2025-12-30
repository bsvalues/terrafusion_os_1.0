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
import { useStartMenuStore } from '../../stores/startMenuStore';
import { DesktopBackground } from './DesktopBackground';
import { DesktopErrorBoundary } from './DesktopErrorBoundary';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { ToastContainer } from '../notifications/ToastContainer';

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
  const closeStartMenu = useStartMenuStore((state) => state.close);

  // ============================================================================
  // Keyboard Shortcut Handler
  // ============================================================================

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Meta (Windows key) or OS key - toggle Start Menu
      if (event.key === 'Meta' || event.key === 'OS') {
        event.preventDefault();
        toggleStartMenu();
        return;
      }

      // Escape - close Start Menu if open
      if (event.key === 'Escape' && isStartMenuOpen) {
        event.preventDefault();
        closeStartMenu();
        return;
      }
    },
    [isStartMenuOpen, toggleStartMenu, closeStartMenu]
  );

  // Register global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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

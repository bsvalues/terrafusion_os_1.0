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

import { useCallback, useEffect, useRef } from 'react';
import { Building2, Command } from 'lucide-react';
import { Launcher } from '../../components/launcher';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useIpcBridge } from '../../ipc/useIpcBridge';
import { SentinelPanel } from '../../sentinel/SentinelPanel';
import { useSentinelStore } from '../../sentinel/sentinelStore';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useAltTabStore } from '../../stores/altTabStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { TerraSphereIcon } from '../../ui/brand/TerraSphereIcon';
import { LiquidPanel, TactileButton } from '../../ui/materials';
import { AmbientCompositor } from '../ambient/AmbientCompositor';
import { CommandPalette } from '../command-palette/CommandPalette';
import { ToastContainer } from '../notifications/ToastContainer';
import { AltTabSwitcher } from './AltTabSwitcher';
import { DesktopContextMenu } from './DesktopContextMenu';
import { DesktopErrorBoundary } from './DesktopErrorBoundary';
import { DesktopIconGrid } from './DesktopIconGrid';
import { StartMenu } from './StartMenu';
import { TaskbarWithNotifications } from './TaskbarWithNotifications';
import { WindowManager } from './WindowManager';
import { WindowPeek } from './WindowPeek';

// ============================================================================
// Types
// ============================================================================

export interface DesktopProps {
  /** Optional className for additional styling */
  className?: string;
}

const DesktopTopSystemBar: React.FC<{ onOpenCommandPalette: () => void }> = ({
  onOpenCommandPalette,
}) => (
  <div className='absolute top-3 left-1/2 -translate-x-1/2 z-[980] w-[min(96vw,1080px)] pointer-events-none'>
    <LiquidPanel
      variant='shell'
      className='pointer-events-auto flex items-center justify-between rounded-2xl px-4 py-2.5'
      style={{
        borderColor: 'hsl(var(--tf-border) / 0.8)',
        background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.68)',
      }}
    >
      <div className='flex items-center gap-3'>
        <TerraSphereIcon size={28} variant='system' glyph={<Building2 className='h-3 w-3' />} />
        <div>
          <div
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 650,
              letterSpacing: '-0.01em',
              color: 'hsl(var(--tf-text-primary-hs) 100%)',
            }}
          >
            TerraFusion OS
          </div>
          <div style={{ margin: 0, fontSize: '0.68rem', color: 'hsl(var(--tf-muted))' }}>
            Benton County · Tax Year 2026 · Assessor
          </div>
        </div>
      </div>
      <TactileButton
        variant='ghost'
        size='sm'
        onClick={onOpenCommandPalette}
        aria-label='Open command palette'
        leftIcon={<Command className='h-3.5 w-3.5' />}
      >
        Command Palette
      </TactileButton>
    </LiquidPanel>
  </div>
);

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
  // Install IPC bridge for app ↔ shell communication (Phase 6)
  useIpcBridge();

  const { panelOpen, setPanelOpen } = useSentinelStore();
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  // Subscribe to Start Menu state
  const isStartMenuOpen = useStartMenuStore((state) => state.isOpen);
  const toggleStartMenu = useStartMenuStore((state) => state.toggle);
  const closeStartMenu = useStartMenuStore((state) => state.close); // Used by click-outside handler

  // Subscribe to virtual desktop actions (Priority 9)
  const nextDesktop = useDesktopStore((state) => state.nextDesktop);
  const previousDesktop = useDesktopStore((state) => state.previousDesktop);

  // Subscribe to desktop state for Alt+Tab (Priority 14)
  const windows = useDesktopStore((state) => state.windows);
  const currentDesktopId = useDesktopStore((state) => state.currentDesktopId);
  const activeWindowId = useDesktopStore((state) => state.activeWindowId);
  const focusWindow = useDesktopStore((state) => state.focusWindow);

  // Subscribe to Alt+Tab store (Priority 14)
  const isAltTabOpen = useAltTabStore((state) => state.isOpen);
  const openAltTab = useAltTabStore((state) => state.open);
  const nextAltTab = useAltTabStore((state) => state.next);
  const prevAltTab = useAltTabStore((state) => state.prev);
  const commitAltTab = useAltTabStore((state) => state.commit);
  const cancelAltTab = useAltTabStore((state) => state.cancel);

  // Track Alt key state for Alt+Tab (Priority 14)
  const altKeyDownRef = useRef(false);

  // ============================================================================
  // Desktop Context Menu (Priority 6)
  // ============================================================================
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();

  // ============================================================================
  // Global Keyboard Shortcuts (Priority 2)
  // Ctrl+1..7 for modules, Ctrl+` for Start Menu, Escape to close
  // ============================================================================
  useKeyboardShortcuts();

  // ============================================================================
  // Theme Effect (Phase 12)
  // Applies theme classes and font size to document root
  // ============================================+ Virtual Desktop switching)
  // Note: Ctrl+1..7, Ctrl+`, and Escape are handled by useKeyboardShortcuts()
  // Priority 9: Ctrl+Win+Left/Right for virtual desktop switching
  // Priority 14: Alt+Tab/Shift+Alt+Tab for window switching
  // ============================================================================

  /**
   * Build candidate window list for Alt+Tab switcher
   * MVP: Only windows on currentDesktopId, non-minimized, sorted by zIndex descending
   */
  const buildAltTabCandidates = useCallback(() => {
    const eligibleWindows = windows.filter(
      (w) => w.desktopId === currentDesktopId && w.state !== 'minimized'
    );

    // Sort by zIndex descending (highest first)
    eligibleWindows.sort((a, b) => b.zIndex - a.zIndex);

    return eligibleWindows.map((w) => w.id);
  }, [windows, currentDesktopId]);

  const handleMetaKey = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target && target.tagName) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
          return;
        }
      }

      // Alt+Tab - Open Alt+Tab switcher (Priority 14)
      if (event.altKey && event.key === 'Tab' && !isAltTabOpen) {
        event.preventDefault();
        const candidates = buildAltTabCandidates();
        if (candidates.length > 0) {
          openAltTab(candidates, activeWindowId);
          altKeyDownRef.current = true;
        }
        return;
      }

      // Tab - Cycle forward in Alt+Tab (Priority 14)
      if (isAltTabOpen && event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        nextAltTab();
        return;
      }

      // Shift+Tab - Cycle backward in Alt+Tab (Priority 14)
      if (isAltTabOpen && event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        prevAltTab();
        return;
      }

      // Escape - Cancel Alt+Tab (Priority 14)
      if (isAltTabOpen && event.key === 'Escape') {
        event.preventDefault();
        const restoredWindowId = cancelAltTab();
        altKeyDownRef.current = false;
        if (restoredWindowId) {
          focusWindow(restoredWindowId);
        }
        return;
      }

      // Meta (Windows key) or OS key - toggle Start Menu
      if (event.key === 'Meta' || event.key === 'OS') {
        event.preventDefault();
        toggleStartMenu();
        return;
      }

      // Ctrl+Win+Left - Previous Desktop (Priority 9)
      if (event.ctrlKey && (event.metaKey || event.key === 'Meta') && event.key === 'ArrowLeft') {
        event.preventDefault();
        previousDesktop();
        return;
      }

      // Ctrl+Win+Right - Next Desktop (Priority 9)
      if (event.ctrlKey && (event.metaKey || event.key === 'Meta') && event.key === 'ArrowRight') {
        event.preventDefault();
        nextDesktop();
        return;
      }
    },
    [
      toggleStartMenu,
      nextDesktop,
      previousDesktop,
      isAltTabOpen,
      openAltTab,
      nextAltTab,
      prevAltTab,
      commitAltTab,
      cancelAltTab,
      buildAltTabCandidates,
      activeWindowId,
      focusWindow,
    ]
  );

  /**
   * Handle Alt key release for committing Alt+Tab selection
   */
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Alt key released - commit Alt+Tab selection (Priority 14)
      if (event.key === 'Alt' && isAltTabOpen && altKeyDownRef.current) {
        event.preventDefault();
        const selectedWindowId = commitAltTab();
        altKeyDownRef.current = false;
        if (selectedWindowId) {
          focusWindow(selectedWindowId);
        }
        return;
      }
    },
    [isAltTabOpen, commitAltTab, focusWindow]
  );

  // Register Meta key listener (separate from useKeyboardShortcuts)
  useEffect(() => {
    document.addEventListener('keydown', handleMetaKey);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleMetaKey);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMetaKey, handleKeyUp]);

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
        relative w-screen h-screen overflow-hidden bg-transparent
        ${className}
      `.trim()}
      onMouseDown={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {/* Layer 0: Ambient Background - ALWAYS ON (CSS mode) */}
      <AmbientCompositor forcedMode='css' />

      {/* Layer 0.75: Top System Bar */}
      <DesktopTopSystemBar onOpenCommandPalette={openCommandPalette} />

      {/* Layer 0.5: Desktop Icons (Priority 3) */}
      <DesktopIconGrid className='absolute top-20 left-4 z-[1]' />

      {/* Layer 1-999: Windows */}
      <WindowManager />

      {/* Layer 1000: Taskbar (with live notifications) */}
      <TaskbarWithNotifications />

      {/* Layer 1001: Start Menu (conditional) */}
      {isStartMenuOpen && <StartMenu />}

      {/* Layer 1002: Launcher (unified navigation surface) */}
      <Launcher />

      {/* Layer 50: Toast Notifications (bottom-right, above taskbar) */}
      <ToastContainer />

      {/* Layer 100: Context Menu (Priority 6) */}
      {isContextMenuOpen && (
        <DesktopContextMenu position={contextMenuPosition} onClose={closeContextMenu} />
      )}

      {/* Layer 10000: Command Palette (Priority 10) */}
      <CommandPalette />

      {/* Layer 9998: Alt+Tab Switcher (Priority 14) */}
      <AltTabSwitcher />

      {/* Layer 9999: Window Peek Preview (Priority 13) */}
      <WindowPeek />

      <SentinelPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
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

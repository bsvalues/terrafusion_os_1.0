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

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { Layers, Search, Settings2, User } from 'lucide-react';
import { Launcher } from '../../components/launcher';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useIpcBridge } from '../../ipc/useIpcBridge';
import { SentinelChip } from '../../sentinel/SentinelChip';
import { SentinelPanel } from '../../sentinel/SentinelPanel';
import { useSentinelStore } from '../../sentinel/sentinelStore';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useAltTabStore } from '../../stores/altTabStore';
import { useControlCenterStore } from '../../stores/controlCenterStore';
import { useDesktopStore, openCompanionWindow } from '../../stores/desktopStore';
import { useCompanionStore } from '../../stores/companionStore';
import { useDevContext } from '../../hooks/useDevContext';
import { useShellMode, useShellModeActions, useShellSurfaces } from '../../stores/desktopStore';
import { useNotificationStore, useNotifications } from '../../stores/notificationStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { LiquidPanel } from '../../ui/materials';
import { AmbientCompositor } from '../ambient/AmbientCompositor';
import { CommandPalette } from '../command-palette/CommandPalette';
import { ToastContainer } from '../notifications/ToastContainer';
import { AltTabSwitcher } from './AltTabSwitcher';
import { Clock } from './Clock';
import { ControlCenter } from './ControlCenter';
import { DataModeIndicator } from './DataModeIndicator';
import SceneSelector from './SceneSelector';
import { DesktopContextMenu } from './DesktopContextMenu';
import { NotificationBell } from './NotificationBell';
import { DesktopErrorBoundary } from './DesktopErrorBoundary';
import { StartMenu } from './StartMenu';
import { StageZeroState } from './StageZeroState';
import { DesktopIconGrid } from './DesktopIconGrid';
import { TaskbarWithNotifications } from './TaskbarWithNotifications';
import { WindowManager } from './WindowManager';
import { WindowPeek } from './WindowPeek';
import { Z } from './zIndex';

// ============================================================================
// Types
// ============================================================================

export interface DesktopProps {
  /** Optional className for additional styling */
  className?: string;
  /** Optional children — when absent, Desktop renders <Outlet /> for nested routes */
  children?: React.ReactNode;
}

/** NotificationBell connected to the notification store (used in top bar) */
const TopBarNotifications: React.FC = () => {
  const notifications = useNotifications();
  const { dismissNotification, markAsRead, clearAll } = useNotificationStore();
  return (
    <NotificationBell
      notifications={notifications}
      onNotificationClick={(n) => markAsRead(n.id)}
      onDismiss={dismissNotification}
      onClearAll={clearAll}
    />
  );
};

const DesktopTopSystemBar: React.FC<{
  onOpenCommandPalette: () => void;
  onToggleControlCenter: () => void;
  onToggleSceneSelector: () => void;
}> = ({
  onOpenCommandPalette,
  onToggleControlCenter,
  onToggleSceneSelector,
}) => (
  <div data-testid='desktop-top-system-bar' className='absolute top-0 left-0 right-0 pointer-events-none'
      style={{ zIndex: Z.topbar }}>
    <LiquidPanel
      variant='shell'
      radius='none'
      className='pointer-events-auto flex items-center justify-between px-4 py-1.5'
    >
      {/* Zone A: OS Identity (left) */}
      <div className='flex items-center gap-3'>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'hsl(var(--tf-text))',
          }}
        >
          TerraFusion OS
        </span>
      </div>

      {/* Zone B: County + Department Context (center) */}
      <div className='absolute left-1/2 -translate-x-1/2 flex items-center gap-2'>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--tf-muted))', fontWeight: 500 }}>
          Benton County
        </span>
        <div
          style={{
            width: 1,
            height: 12,
            background: 'hsl(var(--tf-border) / 0.5)',
          }}
        />
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--tf-text) / 0.7)', fontWeight: 500 }}>
          Assessor&apos;s Office
        </span>
      </div>

      {/* Zone C: Global Actions + Utilities (right) */}
      <div className='flex items-center gap-2' role='group' aria-label='System utilities'>
        {/* ⌘K Search */}
        <button
          onClick={onOpenCommandPalette}
          className='flex items-center gap-1 px-2 py-0.5 rounded-md opacity-60 hover:opacity-100 hover:bg-[hsl(var(--tf-text)_/_0.07)] transition-all text-xs'
          aria-label='Search (Ctrl+K)'
          title='Search (Ctrl+K)'
        >
          <Search className='h-3 w-3' />
          <span className='text-[11px]'>⌘K</span>
        </button>

        {/* Scenes */}
        <button
          onClick={onToggleSceneSelector}
          className='flex items-center opacity-50 hover:opacity-90 transition-opacity'
          aria-label='Scenes (Ctrl+,)'
          title='Scenes'
        >
          <Layers className='h-3.5 w-3.5' />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'hsl(var(--tf-border) / 0.15)' }} />

        {/* Sentinel (system health) */}
        <SentinelChip variant='tray' />

        {/* Data mode — live vs mock backend (belongs in TopBar, not dock) */}
        <DataModeIndicator />

        {/* Notifications */}
        <TopBarNotifications />

        {/* Clock */}
        <Clock />

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'hsl(var(--tf-border) / 0.15)' }} />

        {/* Control Center */}
        <button
          onClick={onToggleControlCenter}
          className='flex items-center opacity-50 hover:opacity-90 transition-opacity'
          aria-label='Control Center (Ctrl+.)'
          title='Control Center'
        >
          <Settings2 className='h-3.5 w-3.5' />
        </button>

        {/* Profile */}
        <button
          className='flex items-center opacity-40 hover:opacity-80 transition-opacity'
          aria-label='Profile'
          title='Profile'
        >
          <User className='h-3.5 w-3.5' />
        </button>
      </div>
    </LiquidPanel>
  </div>
);

// ============================================================================
// Desktop Component
// ============================================================================

/**
 * Safe pathname hook — returns '/' when rendered outside a Router (e.g. in tests).
 * useLocation() throws if there is no Router ancestor. We detect this via the
 * navigation context: when navigator is null, we know there is no Router.
 *
 * NOTE: This hook conditionally calls useLocation(), which technically violates
 * react-hooks/rules-of-hooks. The pattern is safe here because in production
 * Desktop always has a Router ancestor, so the call-order is stable across renders.
 * The only Router-less consumers are tests and Storybook, which always see the
 * early-return path. Do not copy this pattern to hooks with variable call-order.
 */
function useSafePathname(): string {
  const ctx = useContext(UNSAFE_NavigationContext);
  if (!ctx?.navigator) {
    // No Router ancestor — default to home so Desktop shows StageZeroState
    return '/';
  }
  // Safe to call — Router is present
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLocation().pathname;
}

/**
 * Desktop - Root orchestrator for the TerraFusion OS shell.
 *
 * Architecture:
 * ```
 * <DesktopErrorBoundary>
 *   <Desktop>
 *     ├── <DesktopBackground />       (z: 0)
 *     ├── <routed-content-outlet />   (z: 2, non-home routes via Outlet)
 *     ├── <WindowManager />           (z: 30+)
 *     ├── <Taskbar />                 (z: 1000)
 *     ├── <StartMenu />               (z: 1001, conditional)
 *     └── <ToastContainer />          (z: 50)
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
export function Desktop({ className = '', children }: DesktopProps) {
  // Route-aware home detection — gate desktop icons vs routed content
  const pathname = useSafePathname();
  const isHome = pathname === '/';

  // Install IPC bridge for app ↔ shell communication (Phase 6)
  useIpcBridge();

  // Shell Mode — contract-driven surface visibility
  const shellMode = useShellMode();
  const surfaces = useShellSurfaces();
  const { enterDesktop: transitionToDesktop } = useShellModeActions();

  // Scene Selector state (Phase 8)
  const [isSceneSelectorOpen, setSceneSelectorOpen] = useState(false);
  const toggleSceneSelector = useCallback(() => setSceneSelectorOpen((o) => !o), []);
  const closeSceneSelector = useCallback(() => setSceneSelectorOpen(false), []);

  const { panelOpen, setPanelOpen } = useSentinelStore();
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  const toggleControlCenter = useControlCenterStore((state) => state.toggle);
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

  // Track previous StartMenu state for focus-return (WCAG 2.1 AA)
  const prevStartMenuOpen = useRef(isStartMenuOpen);
  useEffect(() => {
    if (prevStartMenuOpen.current && !isStartMenuOpen) {
      // StartMenu just closed → return focus to start button
      document.getElementById('tf-start-button')?.focus();
    }
    prevStartMenuOpen.current = isStartMenuOpen;
  }, [isStartMenuOpen]);

  // ============================================================================
  // TerraPilot Companion — auto-spawn on desktop mount as floating window
  // ============================================================================
  useEffect(() => {
    openCompanionWindow();
  }, []);

  // ============================================================================
  // Dev context bus — wire engineering signals (buildStatus, branch, file)
  // ============================================================================
  useDevContext();

  // ============================================================================
  // Companion context bus — write active suite to companionStore when the
  // focused window changes. Muse reads this to know what the operator is in.
  // ============================================================================
  const setActiveSuite = useCompanionStore((state) => state.setActiveSuite);
  useEffect(() => {
    const activeWindow = windows.find((w) => w.id === activeWindowId);
    if (!activeWindow) return;

    const moduleId = activeWindow.moduleId ?? '';
    // suite-forge → 'forge', suite-atlas → 'atlas', etc.
    if (moduleId.startsWith('suite-')) {
      setActiveSuite(moduleId.replace('suite-', ''));
    } else if (moduleId === 'os-pilot') {
      // Focusing the companion itself doesn't change the suite context
    } else {
      setActiveSuite(null);
    }
  }, [activeWindowId, windows, setActiveSuite]);

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

      // Ctrl+. - Toggle Control Center
      if (event.ctrlKey && event.key === '.') {
        event.preventDefault();
        toggleControlCenter();
        return;
      }

      // Ctrl+, - Toggle Scene Selector (Phase 8)
      if (event.ctrlKey && event.key === ',') {
        event.preventDefault();
        toggleSceneSelector();
        return;
      }
    },
    [
      toggleStartMenu,
      toggleControlCenter,
      toggleSceneSelector,
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
      // Only act when clicking on the desktop surface itself (not children)
      if (event.target !== event.currentTarget) return;

      // Close Start Menu if open
      if (isStartMenuOpen) {
        closeStartMenu();
      }

      // Home → Desktop: clicking the desktop background enters desktop mode
      if (shellMode === 'home') {
        transitionToDesktop();
      }
    },
    [isStartMenuOpen, closeStartMenu, shellMode, transitionToDesktop]
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
      {/* WCAG 2.1 AA: Skip-to-content link for keyboard users */}
      <a
        href='#desktop-main-content'
        style={{ zIndex: Z.skipNav }}
        className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-[hsl(var(--tf-surface-dark-hs)_12%)] focus:text-[hsl(var(--tf-text))] focus:ring-2 focus:ring-[var(--tf-transcend-highlight)]'
      >
        Skip to desktop content
      </a>

      {/* Layer 0: Ambient Background - ALWAYS ON (CSS mode) */}
      <AmbientCompositor forcedMode='css' />

      {/* Layer 0.75: Top System Bar */}
      <DesktopTopSystemBar
        onOpenCommandPalette={openCommandPalette}
        onToggleControlCenter={toggleControlCenter}
        onToggleSceneSelector={toggleSceneSelector}
      />

      {/* Layer 0.3–0.8: Home surfaces OR routed OS content */}
      {isHome ? (
        <>
          {/* Layer 0.3: Desktop Icons — only interactive when desktop surface is visible */}
          {surfaces.desktop !== 'hidden' && (
            <DesktopIconGrid className='absolute top-12 left-4' />
          )}

          {/* Layer 0.5: Stage Zero-State — gated by shell mode surface policy */}
          {surfaces.recentWork !== 'hidden' && (
            <StageZeroState id='desktop-main-content' />
          )}
        </>
      ) : (
        <div
          id='desktop-main-content'
          className='absolute left-0 right-0 top-12 bottom-12 overflow-auto'
          style={{ zIndex: 2 }}
          data-testid='shell-routed-content'
        >
          {children ?? <Outlet />}
        </div>
      )}

      {/* Layer 1-999: Windows */}
      <WindowManager />

      {/* Layer 1000: Taskbar (with live notifications) */}
      <TaskbarWithNotifications />

      {/* Layer 1002: Launcher (unified navigation surface — replaces StartMenu) */}
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

      {/* Layer 9997: Control Center Drawer */}
      <ControlCenter />

      {/* Layer 9996: Scene Selector (Phase 8) */}
      <SceneSelector isOpen={isSceneSelectorOpen} onClose={closeSceneSelector} />
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

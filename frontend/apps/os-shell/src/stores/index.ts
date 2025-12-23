/**
 * TerraFusion OS Stores
 * 
 * Central export for all Zustand stores used in the desktop shell.
 * 
 * @module stores
 */

// Desktop window management
export {
  useDesktopStore,
  useWindows,
  useActiveWindowId,
  useWindowActions,
  type DesktopWindow,
  type DesktopState,
  type WindowState,
  type Position,
  type Size,
} from './desktopStore';

// Start Menu state management
export {
  useStartMenuStore,
  useStartMenuOpen,
  useSearchQuery,
  usePinnedApps,
  useAllApps,
  useStartMenuActions,
  type Module,
  type ModuleStatus,
  type StartMenuState,
} from './startMenuStore';

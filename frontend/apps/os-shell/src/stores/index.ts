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
  useSnapPreview,
  useSnapActions,
  type DesktopWindow,
  type DesktopState,
  type WindowState,
  type Position,
  type Size,
  type SnapZone,
  type SnapBounds,
  type SnapPreview,
} from './desktopStore';

// Start Menu state management
export {
  useStartMenuStore,
  useStartMenuOpen,
  useSearchQuery,
  usePinnedApps,
  useRecentApps,
  useAllApps,
  useFocusState,
  useStartMenuActions,
  type Module,
  type ModuleStatus,
  type FocusedSection,
  type StartMenuState,
} from './startMenuStore';

// Module Registry - manages module definitions and loading state
export {
  useModuleRegistryStore,
  useModuleRegistryInitialized,
  useAllModules,
  useActiveModules,
  useCoreModules,
  useModuleRegistryActions,
  useIsModuleLoaded,
  useIsModuleLoading,
  type ModuleDefinition,
  type ModuleLoadState,
  type ModuleTier,
  type ModuleRegistryState,
  type LoadStatus,
} from './moduleRegistryStore';

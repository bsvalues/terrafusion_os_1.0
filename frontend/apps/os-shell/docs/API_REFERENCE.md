# 📖 TerraFusion OS Shell - API Reference

Complete API reference for stores, hooks, and services.

---

## Table of Contents

1. [Stores](#stores)
   - [desktopStore](#desktopstore)
   - [startMenuStore](#startmenustore)
   - [moduleRegistryStore](#moduleregistrystore)
   - [notificationStore](#notificationstore)
2. [Hooks](#hooks)
   - [useHydration](#usehydration)
   - [useErrorReporter](#useerrorreporter)
   - [useErrorToast](#useerrortoast)
   - [useModuleLaunchNotifications](#usemodulaunchnotifications)
3. [Services](#services)
   - [persistenceService](#persistenceservice)
   - [moduleNotifications](#modulenotifications)
4. [Components](#components)
   - [Error Boundaries](#error-boundaries)
5. [Types](#types)

---

## Stores

### desktopStore

Window management and desktop state.

#### State

```typescript
interface DesktopState {
  windows: DesktopWindow[];
  activeWindowId: string | null;
  nextZIndex: number;
  snapPreview: SnapPreview | null;
}

interface DesktopWindow {
  id: string;
  moduleId: string;
  title: string;
  icon: string;
  position: Position;
  size: Size;
  state: WindowState;
  zIndex: number;
  snapZone?: SnapZone;
  previousBounds?: { position: Position; size: Size };
}

type WindowState = 'normal' | 'minimized' | 'maximized' | 'snapped';
type SnapZone = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximize';
```

#### Actions

```typescript
// Open a new window
openWindow(moduleId: string, title: string, icon: string): string

// Close a window
closeWindow(windowId: string): void

// Focus a window (bring to front)
focusWindow(windowId: string): void

// Minimize a window
minimizeWindow(windowId: string): void

// Maximize a window
maximizeWindow(windowId: string): void

// Restore from maximized/minimized
restoreWindow(windowId: string): void

// Snap window to zone
snapWindow(windowId: string, zone: SnapZone, bounds: SnapBounds): void

// Update window position
updateWindowPosition(windowId: string, position: Position): void

// Update window size
updateWindowSize(windowId: string, size: Size): void

// Show/hide snap preview
setSnapPreview(preview: SnapPreview | null): void
```

#### Hooks

```typescript
// Get all windows
const windows = useWindows();

// Get active window ID
const activeId = useActiveWindowId();

// Get snap preview
const preview = useSnapPreview();

// Get window actions
const { openWindow, closeWindow, focusWindow } = useWindowActions();

// Get snap actions
const { snapWindow, setSnapPreview } = useSnapActions();
```

#### Example

```typescript
import { useDesktopStore, useWindows, useWindowActions } from '@/stores';

function MyComponent() {
  const windows = useWindows();
  const { openWindow, closeWindow } = useWindowActions();

  const handleOpen = () => {
    const id = openWindow('my-module', 'My Window', '📦');
    console.log('Opened window:', id);
  };

  return (
    <div>
      <button onClick={handleOpen}>Open Window</button>
      {windows.map(w => (
        <div key={w.id}>
          {w.title}
          <button onClick={() => closeWindow(w.id)}>Close</button>
        </div>
      ))}
    </div>
  );
}
```

---

### startMenuStore

Start Menu UI state management.

#### State

```typescript
interface StartMenuState {
  isOpen: boolean;
  searchQuery: string;
  pinnedModuleIds: string[];
  recentApps: Module[];
  focusedIndex: number;
  focusedSection: FocusedSection;
}

type FocusedSection = 'search' | 'pinned' | 'recent' | 'all';

interface Module {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  category: string;
  status: ModuleStatus;
}
```

#### Actions

```typescript
// Toggle Start Menu open/closed
toggle(): void

// Open Start Menu
open(): void

// Close Start Menu
close(): void

// Set search query
setSearchQuery(query: string): void

// Clear search
clearSearch(): void

// Pin an app
pinApp(moduleId: string): void

// Unpin an app
unpinApp(moduleId: string): void

// Add to recent apps
addRecentApp(module: Module): void

// Keyboard navigation
moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void
setFocusedSection(section: FocusedSection): void
```

#### Hooks

```typescript
// Check if open
const isOpen = useStartMenuOpen();

// Get search query
const query = useSearchQuery();

// Get pinned apps
const pinned = usePinnedApps();

// Get recent apps
const recent = useRecentApps();

// Get all apps
const all = useAllApps();

// Get focus state
const { focusedIndex, focusedSection } = useFocusState();

// Get actions
const { toggle, open, close, pinApp, unpinApp } = useStartMenuActions();
```

#### Example

```typescript
import { useStartMenuStore, useStartMenuOpen, useSearchQuery } from '@/stores';

function StartMenuButton() {
  const isOpen = useStartMenuOpen();
  const toggle = useStartMenuStore((s) => s.toggle);

  return (
    <button onClick={toggle}>
      {isOpen ? 'Close' : 'Open'} Start Menu
    </button>
  );
}

function SearchBar() {
  const query = useSearchQuery();
  const setSearchQuery = useStartMenuStore((s) => s.setSearchQuery);

  return (
    <input
      value={query}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search apps..."
    />
  );
}
```

---

### moduleRegistryStore

Module definitions and loading state.

#### State

```typescript
interface ModuleRegistryState {
  modules: Map<string, ModuleDefinition>;
  loadStates: Map<string, ModuleLoadState>;
  isInitialized: boolean;
  initError: string | null;
}

interface ModuleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  tier: ModuleTier;
  status: ModuleStatus;
  version: string;
  launchPath: string;
  isCore: boolean;
  priority: number;
}

interface ModuleLoadState {
  status: LoadStatus;
  error: string | null;
  windowId: string | null;
}

type ModuleTier = 'Tier1' | 'Tier2' | 'Tier3';
type ModuleStatus = 'active' | 'inactive' | 'loading' | 'error';
type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
```

#### Actions

```typescript
// Register modules from API
registerModules(modules: ModuleDefinition[]): void

// Launch a module (opens window)
launchModule(moduleId: string): Promise<string | null>

// Close a module
closeModule(moduleId: string): void

// Set module error state
setModuleError(moduleId: string, error: string): void
```

#### Selectors

```typescript
// Get module by ID
getModuleById(moduleId: string): ModuleDefinition | undefined

// Get modules grouped by category
getModulesByCategory(): Record<string, ModuleDefinition[]>

// Get modules by tier
getModulesByTier(tier: ModuleTier): ModuleDefinition[]

// Get active modules
getActiveModules(): ModuleDefinition[]

// Get core modules
getCoreModules(): ModuleDefinition[]

// Get all modules as array
getAllModulesArray(): ModuleDefinition[]

// Check if module is loaded
isModuleLoaded(moduleId: string): boolean

// Check if module is loading
isModuleLoading(moduleId: string): boolean

// Get module's window ID
getModuleWindowId(moduleId: string): string | null
```

#### Hooks

```typescript
// Check initialization
const isInit = useModuleRegistryInitialized();

// Get all modules
const modules = useAllModules();

// Get active modules
const active = useActiveModules();

// Get core modules
const core = useCoreModules();

// Check specific module
const isLoaded = useIsModuleLoaded('module-id');
const isLoading = useIsModuleLoading('module-id');

// Get actions
const { registerModules, launchModule, closeModule } = useModuleRegistryActions();
```

---

### notificationStore

Notifications and toast popups.

#### State

```typescript
interface NotificationState {
  notifications: Notification[];
  toasts: Toast[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast extends Notification {
  duration: number;
}

type NotificationType = 'info' | 'success' | 'warning' | 'error';
```

#### Actions

```typescript
// Add notification (returns ID)
addNotification(
  notification: Pick<Notification, 'title' | 'message' | 'type'>,
  options?: AddNotificationOptions
): string

interface AddNotificationOptions {
  showToast?: boolean;    // Default: true
  duration?: number;      // Default: 5000ms
  action?: { label: string; onClick: () => void };
}

// Dismiss from history
dismissNotification(id: string): void

// Dismiss toast only (keeps in history)
dismissToast(id: string): void

// Mark as read
markAsRead(id: string): void

// Mark all as read
markAllAsRead(): void

// Clear all
clearAll(): void

// Get unread count
getUnreadCount(): number
```

#### Hooks

```typescript
// Get all notifications
const notifications = useNotifications();

// Get visible toasts
const toasts = useToasts();

// Get unread count
const unread = useUnreadCount();

// Get actions
const {
  addNotification,
  dismissNotification,
  dismissToast,
  markAsRead,
  markAllAsRead,
  clearAll,
} = useNotificationActions();
```

#### Example

```typescript
import { useNotificationStore, useNotifications, useUnreadCount } from '@/stores';

function NotificationBell() {
  const unread = useUnreadCount();
  const { markAllAsRead } = useNotificationStore.getState();

  return (
    <button onClick={markAllAsRead}>
      🔔 {unread > 0 && <span>{unread}</span>}
    </button>
  );
}

function AddNotificationButton() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleClick = () => {
    addNotification({
      title: 'Hello!',
      message: 'This is a notification',
      type: 'info',
    });
  };

  return <button onClick={handleClick}>Notify</button>;
}
```

---

## Hooks

### useHydration

Hydrate stores from localStorage on app load.

```typescript
interface HydrationResult {
  isHydrating: boolean;
  isHydrated: boolean;
  error: Error | null;
}

function useHydration(): HydrationResult
```

#### Example

```typescript
import { useHydration } from '@/hooks';

function App() {
  const { isHydrating, isHydrated, error } = useHydration();

  if (isHydrating) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return <Desktop />;
}
```

---

### useErrorReporter

Centralized error reporting with tracking.

```typescript
interface ErrorReporter {
  reportError: (error: Error, context?: ErrorContext) => void;
  reportWarning: (message: string, context?: ErrorContext) => void;
  errorCount: number;
  hasRecentErrors: boolean;
  clearErrors: () => void;
}

function useErrorReporter(componentName: string): ErrorReporter
```

#### Example

```typescript
import { useErrorReporter } from '@/hooks';

function MyComponent() {
  const { reportError, reportWarning, errorCount } = useErrorReporter('MyComponent');

  const handleRiskyAction = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      reportError(error, { action: 'riskyOperation' });
    }
  };

  return (
    <div>
      <button onClick={handleRiskyAction}>Do Something</button>
      {errorCount > 0 && <span>Errors: {errorCount}</span>}
    </div>
  );
}
```

---

### useErrorToast

Combines error reporting with toast notifications.

```typescript
interface ErrorToastReporter {
  reportError: (error: Error, context?: ErrorContext) => void;
  reportWarning: (message: string, context?: ErrorContext) => void;
  errorCount: number;
  hasRecentErrors: boolean;
  clearErrors: () => void;
}

function useErrorToast(componentName: string): ErrorToastReporter
```

#### Example

```typescript
import { useErrorToast } from '@/hooks';

function DataLoader() {
  const { reportError } = useErrorToast('DataLoader');

  const loadData = async () => {
    try {
      await fetchData();
    } catch (error) {
      // Logs error AND shows toast
      reportError(error, { endpoint: '/api/data' });
    }
  };

  return <button onClick={loadData}>Load Data</button>;
}
```

---

### useModuleLaunchNotifications

Launch modules with automatic notifications.

```typescript
interface ModuleLaunchHook {
  launchWithNotification: (moduleId: string) => Promise<string | null>;
  isLaunching: boolean;
  lastError: Error | null;
}

function useModuleLaunchNotifications(): ModuleLaunchHook
```

#### Example

```typescript
import { useModuleLaunchNotifications } from '@/hooks';

function AppLauncher({ module }) {
  const { launchWithNotification, isLaunching } = useModuleLaunchNotifications();

  const handleLaunch = () => {
    launchWithNotification(module.id);
    // Automatically shows success/error toast
  };

  return (
    <button onClick={handleLaunch} disabled={isLaunching}>
      {isLaunching ? 'Launching...' : 'Launch'}
    </button>
  );
}
```

---

## Services

### persistenceService

localStorage persistence for desktop state.

```typescript
// Save desktop state
function saveDesktopState(state: PersistedDesktopState): void

// Load desktop state
function loadDesktopState(): PersistedDesktopState | null

// Save start menu state
function saveStartMenuState(state: PersistedStartMenuState): void

// Load start menu state
function loadStartMenuState(): PersistedStartMenuState | null

// Clear all persisted state
function clearPersistedState(): void

// Check storage version
function getStorageVersion(): number

// Migrate storage schema
function migrateStorage(fromVersion: number): void
```

---

### moduleNotifications

Notification helpers for module events.

```typescript
// Module launched successfully
function notifyModuleLaunched(moduleName: string, icon?: string): string

// Module failed to load
function notifyModuleError(moduleName: string, errorMessage: string): string

// Module closed
function notifyModuleClosed(moduleName: string, options?: { silent?: boolean }): string

// Module recovered
function notifyModuleRecovery(moduleName: string, success: boolean): string

// System notification
function notifySystem(
  title: string,
  message: string,
  type?: NotificationType
): string
```

#### Example

```typescript
import {
  notifyModuleLaunched,
  notifyModuleError,
  notifySystem,
} from '@/services/moduleNotifications';

// After successful launch
notifyModuleLaunched('Assessment Pro', '📊');

// On error
notifyModuleError('GIS Viewer', 'Connection timeout');

// System message
notifySystem('Update Available', 'A new version is ready', 'info');
```

---

## Components

### Error Boundaries

#### WindowErrorBoundary

Isolates errors within a single window.

```typescript
interface WindowErrorBoundaryProps {
  windowId: string;
  moduleName: string;
  children: ReactNode;
  onReload?: (windowId: string) => void;
  onClose?: (windowId: string) => void;
}
```

#### Example

```typescript
import { WindowErrorBoundary } from '@/shell/desktop';

<WindowErrorBoundary
  windowId={window.id}
  moduleName={window.title}
  onReload={handleReload}
  onClose={handleClose}
>
  <ModuleLoader moduleId={window.moduleId} />
</WindowErrorBoundary>
```

#### DesktopErrorBoundary

Top-level error boundary for catastrophic errors.

```typescript
interface DesktopErrorBoundaryProps {
  children: ReactNode;
}
```

#### Example

```typescript
import { DesktopErrorBoundary } from '@/shell/desktop';

<DesktopErrorBoundary>
  <Desktop />
</DesktopErrorBoundary>
```

---

## Types

### Common Types

```typescript
// Position
interface Position {
  x: number;
  y: number;
}

// Size
interface Size {
  width: number;
  height: number;
}

// Snap bounds
interface SnapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Snap preview
interface SnapPreview {
  zone: SnapZone;
  bounds: SnapBounds;
}

// Error context
interface ErrorContext {
  [key: string]: unknown;
}
```

### Re-exports

All types are re-exported from store index files:

```typescript
// From stores/index.ts
export type {
  DesktopState,
  DesktopWindow,
  Position,
  Size,
  SnapBounds,
  SnapPreview,
  SnapZone,
  WindowState,
  StartMenuState,
  FocusedSection,
  Module,
  ModuleStatus,
  ModuleDefinition,
  ModuleLoadState,
  ModuleTier,
  LoadStatus,
  Notification,
  NotificationType,
  Toast,
  AddNotificationOptions,
};
```

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design
- [Developer Guide](./DEVELOPER_GUIDE.md) - How to contribute
- [README](../README.md) - Project overview

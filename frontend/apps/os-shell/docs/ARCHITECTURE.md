# 🏗️ TerraFusion OS Shell - Architecture Guide

This document describes the architecture of the TerraFusion OS Shell desktop environment.

---

## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [Error Handling](#error-handling)
6. [Persistence](#persistence)
7. [Module System](#module-system)
8. [Design Decisions](#design-decisions)

---

## Overview

The TerraFusion OS Shell is a **single-page application** that renders a complete desktop environment. It follows these architectural principles:

| Principle | Implementation |
|-----------|---------------|
| **Unidirectional Data Flow** | Zustand stores → React components |
| **Component Isolation** | Error boundaries at window level |
| **State Colocation** | Related state in single store |
| **Composition over Inheritance** | Functional components with hooks |

---

## Component Hierarchy

```
App (Entry Point)
└── DesktopErrorBoundary
    └── Desktop
        ├── DesktopBackground
        │   └── Starfield Animation
        │
        ├── WindowManager
        │   └── Window[] (for each open window)
        │       └── WindowErrorBoundary
        │           └── ModuleLoader
        │               ├── LoadingState
        │               ├── ErrorState
        │               └── LoadedState (iframe)
        │
        ├── Taskbar
        │   ├── StartButton
        │   ├── RunningAppsBar
        │   │   └── TaskbarAppButton[]
        │   └── SystemTray
        │       ├── AIStatusIndicator
        │       │   └── AIStatusPanel
        │       ├── SystemHealthIndicator
        │       │   └── SystemHealthPanel
        │       ├── NotificationBell
        │       │   └── NotificationPanel
        │       └── Clock
        │
        ├── StartMenu (conditional)
        │   ├── SearchInput
        │   ├── PinnedAppsSection
        │   ├── RecentAppsSection
        │   └── AllAppsSection
        │
        └── ToastContainer
            └── Toast[]
```

### Layer Stacking (z-index)

| Layer | z-index | Component |
|-------|---------|-----------|
| Background | 0 | DesktopBackground |
| Windows | 1-999 | WindowManager → Window[] |
| Taskbar | 1000 | Taskbar |
| Start Menu | 1001 | StartMenu |
| System Tray Panels | 1002 | AIStatusPanel, etc. |
| Toasts | 50 | ToastContainer |
| Error Overlays | 9999 | DesktopErrorBoundary fallback |

---

## State Management

### Store Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ZUSTAND STORES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐     ┌─────────────────────┐                   │
│  │   desktopStore      │     │  startMenuStore     │                   │
│  ├─────────────────────┤     ├─────────────────────┤                   │
│  │ windows[]           │     │ isOpen              │                   │
│  │ activeWindowId      │     │ searchQuery         │                   │
│  │ nextZIndex          │     │ pinnedModuleIds[]   │                   │
│  │ snapPreview         │     │ recentApps[]        │                   │
│  ├─────────────────────┤     │ focusedIndex        │                   │
│  │ openWindow()        │     │ focusedSection      │                   │
│  │ closeWindow()       │     ├─────────────────────┤                   │
│  │ focusWindow()       │     │ toggle()            │                   │
│  │ minimizeWindow()    │     │ close()             │                   │
│  │ maximizeWindow()    │     │ addRecentApp()      │                   │
│  │ snapWindow()        │     │ setSearchQuery()    │                   │
│  └─────────────────────┘     └─────────────────────┘                   │
│           │                           │                                 │
│           └───────────┬───────────────┘                                 │
│                       ▼                                                 │
│            ┌─────────────────────┐                                      │
│            │ persistenceService  │ ← localStorage                       │
│            └─────────────────────┘                                      │
│                                                                         │
│  ┌─────────────────────┐     ┌─────────────────────┐                   │
│  │ moduleRegistryStore │     │ notificationStore   │                   │
│  ├─────────────────────┤     ├─────────────────────┤                   │
│  │ modules Map         │     │ notifications[]     │                   │
│  │ loadStates Map      │     │ toasts[]            │                   │
│  │ isInitialized       │     ├─────────────────────┤                   │
│  ├─────────────────────┤     │ addNotification()   │                   │
│  │ registerModules()   │     │ dismissToast()      │                   │
│  │ launchModule()      │     │ markAsRead()        │                   │
│  │ closeModule()       │     │ clearAll()          │                   │
│  └─────────────────────┘     └─────────────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Store Responsibilities

#### desktopStore
- **Purpose**: Window lifecycle management
- **State**: All open windows, active window, z-index counter
- **Actions**: Open, close, minimize, maximize, focus, snap windows
- **Persistence**: Yes (window positions, sizes, states)

#### startMenuStore
- **Purpose**: Start Menu UI state
- **State**: Open/closed, search query, pinned apps, recent apps
- **Actions**: Toggle, search, pin/unpin, keyboard navigation
- **Persistence**: Yes (pinned apps, recent apps)

#### moduleRegistryStore
- **Purpose**: Module definitions and loading state
- **State**: Module definitions, load states per module
- **Actions**: Register modules, launch module, track load state
- **Persistence**: No (reloaded from API)

#### notificationStore
- **Purpose**: User notifications and toasts
- **State**: Notification history, visible toasts
- **Actions**: Add notification, dismiss, mark read
- **Persistence**: No (transient)

---

## Data Flow

### Module Launch Flow

```
User clicks app in StartMenu
         │
         ▼
StartMenu.handleAppClick(moduleId)
         │
         ▼
startMenuStore.addRecentApp(module)
         │
         ▼
moduleRegistryStore.launchModule(moduleId)
         │
         ├──► Sets loadState to 'loading'
         │
         ▼
desktopStore.openWindow(moduleId, title, icon)
         │
         ├──► Creates window object
         ├──► Assigns z-index
         ├──► Cascades position
         │
         ▼
WindowManager re-renders
         │
         ▼
Window component renders with ModuleLoader
         │
         ▼
ModuleLoader shows loading → loaded (iframe)
         │
         ▼
notificationStore.addNotification('Module Opened')
```

### Window Focus Flow

```
User clicks on window
         │
         ▼
Window.handleFocus()
         │
         ▼
desktopStore.focusWindow(windowId)
         │
         ├──► Sets activeWindowId
         ├──► Increments window z-index
         │
         ▼
WindowManager re-renders (sorted by z-index)
         │
         ▼
Taskbar re-renders (active app highlighted)
```

### Error Flow

```
Module throws JavaScript error
         │
         ▼
WindowErrorBoundary.componentDidCatch()
         │
         ├──► Logs error with context
         ├──► Sets hasError state
         │
         ▼
ErrorFallback UI renders in window
         │
         ├──► Shows error message
         ├──► Shows Reload / Close buttons
         │
         ▼
User clicks "Reload Module"
         │
         ▼
WindowErrorBoundary.handleReload()
         │
         ├──► Closes current window
         ├──► Relaunches module
         │
         ▼
notificationStore.addNotification('Module Reloaded')
```

---

## Error Handling

### Error Boundary Hierarchy

```
DesktopErrorBoundary (catches everything)
│
├── Desktop
│   └── WindowManager
│       └── Window
│           └── WindowErrorBoundary (catches module errors)
│               └── ModuleLoader
│                   └── <iframe> (module content)
```

### Error Types and Handling

| Error Type | Caught By | Recovery |
|------------|-----------|----------|
| Module JS error | WindowErrorBoundary | Reload Module, Close Window |
| Rendering error | WindowErrorBoundary | Same as above |
| Store error | DesktopErrorBoundary | Restart Desktop |
| Catastrophic | DesktopErrorBoundary | Clear Data & Restart |

### Error Reporting Hook

```typescript
// Usage in any component
const { reportError, reportWarning, errorCount } = useErrorReporter('ComponentName');

try {
  await riskyOperation();
} catch (error) {
  reportError(error, { operation: 'riskyOperation', context: 'details' });
}
```

---

## Persistence

### Storage Schema

```typescript
// localStorage keys
const STORAGE_KEYS = {
  DESKTOP: 'terrafusion:desktop',
  STARTMENU: 'terrafusion:startmenu',
  VERSION: 'terrafusion:version',
};

// Desktop state structure
interface PersistedDesktopState {
  windows: Array<{
    id: string;
    moduleId: string;
    title: string;
    icon: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    state: 'normal' | 'minimized' | 'maximized' | 'snapped';
    snapZone?: SnapZone;
  }>;
  activeWindowId: string | null;
}

// StartMenu state structure
interface PersistedStartMenuState {
  pinnedModuleIds: string[];
  recentApps: Module[];
}
```

### Hydration Flow

```
App mounts
    │
    ▼
useHydration() hook runs
    │
    ├──► loadDesktopState() from localStorage
    ├──► loadStartMenuState() from localStorage
    │
    ▼
Stores hydrated with persisted data
    │
    ▼
Desktop renders with restored state
```

### Persistence Triggers

| Event | Persisted Data |
|-------|---------------|
| Window opened | windows array |
| Window moved | window position |
| Window resized | window size |
| Window snapped | window snapZone |
| Window closed | windows array |
| App pinned/unpinned | pinnedModuleIds |
| App launched | recentApps |

---

## Module System

### Module Definition

```typescript
interface ModuleDefinition {
  id: string;              // Unique identifier
  name: string;            // Internal name
  displayName: string;     // User-facing name
  description: string;     // Module description
  icon: string;            // Emoji or icon URL
  category: string;        // Grouping category
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  status: 'active' | 'inactive' | 'loading' | 'error';
  version: string;
  launchPath: string;      // URL for iframe
  isCore: boolean;         // Core system module
  priority: number;        // Sort order
}
```

### Module Load States

```
idle ──► loading ──► loaded
              │
              └──► error
```

### Module Isolation

Each module runs in a sandboxed iframe:
```html
<iframe
  src={module.launchPath}
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
/>
```

---

## Design Decisions

### Why Zustand?

| Alternative | Why Not Used |
|-------------|--------------|
| Redux | Too much boilerplate for this scale |
| Context | Performance issues with frequent updates |
| Jotai | Less familiar to team |
| MobX | Implicit reactivity harder to trace |

**Zustand wins because:**
- Minimal boilerplate
- Built-in devtools
- Easy persistence middleware
- Excellent TypeScript support
- No providers needed

### Why react-rnd?

| Alternative | Why Not Used |
|-------------|--------------|
| react-draggable | No resize support |
| react-resizable | No drag support |
| Custom implementation | Time-consuming, error-prone |

**react-rnd wins because:**
- Combined drag + resize
- Bounds support
- Snap-to-grid capability
- Well-maintained

### Why Error Boundaries at Window Level?

Instead of a single app-level boundary, we use per-window boundaries because:

1. **Isolation** - Module A crash doesn't kill Module B
2. **Recovery** - User can reload single module
3. **UX** - Other work preserved
4. **Government requirement** - Data loss prevention

### Why localStorage for Persistence?

| Alternative | Why Not Used |
|-------------|--------------|
| Server-side storage | Adds latency, complexity |
| IndexedDB | Overkill for simple state |
| SessionStorage | Lost on tab close |

**localStorage wins because:**
- Synchronous API
- Simple key-value model
- Survives browser restart
- No backend dependency

---

## Future Considerations

### Potential Enhancements

1. **Theme System** - Light/dark mode, custom colors
2. **Window Tiling** - Predefined layouts (Win+Z)
3. **Virtual Desktops** - Multiple desktop spaces
4. **Module Communication** - Cross-module messaging
5. **Offline Support** - Service worker caching

### Scaling Considerations

- **Many Windows**: Consider virtualization if >20 windows
- **Large Module Registry**: Paginate module list
- **Frequent Updates**: Debounce persistence writes
- **Memory Leaks**: Clean up subscriptions in useEffect

---

## Related Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) - How to contribute
- [API Reference](./API_REFERENCE.md) - Store and hook APIs
- [README](../README.md) - Project overview

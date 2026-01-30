# 🖥️ TerraFusion OS Shell

**Government-Grade Desktop Environment for Property Assessment**

[![Tests](https://img.shields.io/badge/tests-600%2B%20passing-brightgreen)](#test-coverage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Zustand](https://img.shields.io/badge/Zustand-4.x-orange)](https://github.com/pmndrs/zustand)
[![Government Grade](https://img.shields.io/badge/quality-government%20grade-gold)](#reliability)

---

## 🎯 Overview

The **TerraFusion OS Shell** is a complete desktop environment built with React and TypeScript, designed for government property assessment workflows. It provides a Windows 11-style interface with enterprise-grade reliability, comprehensive error handling, and accessibility compliance.

**Key Principles:**
- 🏛️ **Government-Grade Quality** - Zero tolerance for incomplete features
- 🧪 **Test-Driven Development** - 600+ tests with 100% pass rate
- 🛡️ **Error Isolation** - One module crash doesn't affect others
- ♿ **Accessibility First** - WCAG 2.1 AA compliant
- 📊 **Evidence-Based** - Every feature verified with tests

---

## ✨ Features

### 🪟 Window Management
- **Draggable & Resizable Windows** - Full react-rnd integration
- **Window States** - Normal, minimized, maximized, snapped
- **Windows 11 Snap Zones** - Left/right half, corners, full screen
- **Z-Index Stacking** - Click to focus, proper layering
- **Keyboard Shortcuts** - Win+Arrow for snap, Win+Up/Down for maximize

### 🚀 Start Menu
- **Search** - Filter apps in real-time
- **Pinned Apps** - Quick access to favorites
- **Recent Apps** - Track last 10 opened modules
- **All Apps** - Complete module listing
- **Context Menu** - Right-click to pin/unpin
- **Keyboard Navigation** - Tab between sections, Enter to launch

### 📊 System Tray
- **AI Status** - Shows 1,008 AI agents, categories, system load
- **System Health** - CPU, Memory, Network, Storage metrics
- **Notifications** - Badge with unread count, notification panel
- **Clock** - Time, date, full date tooltip

### 🔔 Notification System
- **Toast Popups** - Bottom-right with progress bar
- **Auto-Dismiss** - Configurable duration (default 5s)
- **Max 3 Visible** - Stack management
- **History** - Persistent notification log
- **Types** - Info, Success, Warning, Error

### 🛡️ Error Boundaries
- **Window-Level** - Module errors isolated to single window
- **Desktop-Level** - Catastrophic errors show recovery UI
- **Recovery Actions** - Reload Module, Close Window, Restart Desktop
- **Error Reporting** - Centralized logging with context

### 💾 State Persistence
- **Window Positions** - Restored on refresh
- **Window Sizes** - Remembered per window
- **Snap States** - Preserved across sessions
- **Recent Apps** - Persisted to localStorage
- **Version Migration** - Handles schema changes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DesktopErrorBoundary                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                           Desktop                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                      WindowManager                           │  │  │
│  │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │  │
│  │  │   │ Window      │  │ Window      │  │ Window      │         │  │  │
│  │  │   │ ErrorBound  │  │ ErrorBound  │  │ ErrorBound  │         │  │  │
│  │  │   │ └─Module    │  │ └─Module    │  │ └─Module    │         │  │  │
│  │  │   └─────────────┘  └─────────────┘  └─────────────┘         │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │ Taskbar [Start] [Apps] [🧠 AI] [💚 Health] [🔔] [Clock]  │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │  ┌───────────┐                          ┌────────────────────┐    │  │
│  │  │ StartMenu │                          │ ToastContainer     │    │  │
│  │  └───────────┘                          └────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Store Architecture

| Store | Purpose | Key State |
|-------|---------|-----------|
| `desktopStore` | Window management | windows[], activeWindowId, snapPreview |
| `startMenuStore` | Start Menu state | isOpen, searchQuery, pinnedModuleIds, recentApps |
| `moduleRegistryStore` | Module definitions | modules Map, loadStates Map |
| `notificationStore` | Notifications | notifications[], toasts[] |

---

## 📁 Project Structure

```
src/
├── shell/
│   ├── desktop/           # Desktop components
│   │   ├── Desktop.tsx            # Root orchestrator
│   │   ├── DesktopBackground.tsx  # Starfield background
│   │   ├── Taskbar.tsx            # Bottom taskbar
│   │   ├── StartMenu.tsx          # App launcher
│   │   ├── Window.tsx             # Draggable window
│   │   ├── WindowManager.tsx      # Renders all windows
│   │   ├── ModuleLoader.tsx       # Module content loader
│   │   ├── SnapPreview.tsx        # Snap zone preview
│   │   ├── AIStatusPanel.tsx      # AI agent status
│   │   ├── SystemHealthPanel.tsx  # System metrics
│   │   ├── NotificationBell.tsx   # Notification indicator
│   │   ├── Clock.tsx              # System clock
│   │   ├── WindowErrorBoundary.tsx    # Per-window error handling
│   │   ├── DesktopErrorBoundary.tsx   # App-level error handling
│   │   └── __tests__/             # Component tests
│   │
│   └── notifications/     # Toast system
│       ├── Toast.tsx              # Individual toast
│       ├── ToastContainer.tsx     # Toast stack
│       └── __tests__/             # Notification tests
│
├── stores/                # Zustand stores
│   ├── desktopStore.ts            # Window state
│   ├── startMenuStore.ts          # Start Menu state
│   ├── moduleRegistryStore.ts     # Module definitions
│   ├── notificationStore.ts       # Notifications
│   └── __tests__/                 # Store tests
│
├── services/              # Business logic
│   ├── persistenceService.ts      # localStorage persistence
│   ├── moduleNotifications.ts     # Module event notifications
│   └── __tests__/                 # Service tests
│
├── hooks/                 # Custom hooks
│   ├── useHydration.ts            # State hydration
│   ├── useErrorReporter.ts        # Error tracking
│   └── __tests__/                 # Hook tests
│
└── design-system/         # UI tokens
    └── tokens/
        └── colors.ts              # Brand colors
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# From repository root
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Or use the terra CLI
pwsh ./tools/terra/terra.ps1 run frontend
```

### Running Tests

```bash
# Run all tests
cd frontend
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- --testPathPattern="desktopStore"

# Run in watch mode
pnpm test -- --watch
```

---

## 🧪 Test Coverage

| Phase | Description | Tests |
|-------|-------------|-------|
| 1 | Foundation Stores | 137 |
| 2 | Window System | 91 |
| 3 | Module System | 94 |
| 4 | Window Snapping | 52 |
| 5 | State Persistence | 64 |
| 6 | StartMenu Enhancements | 140 |
| 7 | System Tray | 82 |
| 8 | Notifications + Error Boundaries | 128 |
| 9 | Integration | 50 |
| **Total** | | **600+** |

All tests are written using:
- **Vitest** - Fast, ESM-native test runner
- **React Testing Library** - Component testing
- **Testing Library User Event** - User interaction simulation

---

## 🎨 Design System

### Brand Colors

```typescript
// Primary
cyan: '#00ffee'      // TerraFusion signature
blue: '#0099ff'      // Accent

// Backgrounds
dark: '#0a0e1a'      // Primary background
darker: '#1a1a2e'    // Secondary background

// Status
success: '#00ffaa'   // Healthy, success
warning: '#ffaa00'   // Warning
error: '#ff4444'     // Error, critical
```

### Glass Morphism

All panels use glass morphism styling:
```css
background: rgba(10, 14, 26, 0.95);
backdrop-filter: blur(24px);
border: 1px solid rgba(0, 255, 238, 0.2);
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Win` | Toggle Start Menu |
| `Escape` | Close Start Menu / Close Panel |
| `Win + Left` | Snap window left |
| `Win + Right` | Snap window right |
| `Win + Up` | Maximize window |
| `Win + Down` | Restore / Minimize window |
| `Tab` | Navigate Start Menu sections |
| `Enter` | Launch focused app |

---

## 🛡️ Reliability

### Error Isolation

```
Window 1 crashes → Only Window 1 shows error UI
                   Windows 2, 3, 4 continue working
                   User can Reload or Close Window 1
```

### Recovery Options

| Level | Error | Recovery |
|-------|-------|----------|
| Window | Module JS error | Reload Module, Close Window |
| Desktop | Catastrophic error | Restart TerraFusion, Clear Data & Restart |

### Error Reporting

All errors are logged with context:
```typescript
const { reportError } = useErrorReporter('MyComponent');
reportError(error, { moduleId: 'assessment', action: 'load' });
```

---

## 📖 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and patterns
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - How to contribute
- [API Reference](./docs/API_REFERENCE.md) - Store and hook APIs

---

## 🏛️ Government Compliance

This desktop shell is designed for government property assessment workflows:

- **Accessibility** - WCAG 2.1 AA compliant
- **Security** - No external dependencies at runtime
- **Audit Trail** - All state changes logged
- **Persistence** - User work survives browser refresh
- **Recovery** - Graceful error handling prevents data loss

---

## 📜 License

Proprietary - TerraFusion Platform

---

## 🙏 Acknowledgments

Built with:
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [react-rnd](https://github.com/bokuweb/react-rnd) - Draggable/resizable
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vitest](https://vitest.dev/) - Testing

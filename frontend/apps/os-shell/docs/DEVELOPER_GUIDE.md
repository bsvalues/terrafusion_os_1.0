# 👨‍💻 TerraFusion OS Shell - Developer Guide

This guide covers how to develop, test, and contribute to the TerraFusion OS Shell.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Testing Strategy](#testing-strategy)
4. [Adding Features](#adding-features)
5. [Code Style](#code-style)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

```bash
# Required
Node.js 18+
pnpm 8+

# Recommended
VS Code with extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Vitest
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd terrafusion_os_1.0

# Install dependencies
cd frontend
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run all tests |
| `pnpm test -- --watch` | Watch mode |
| `pnpm test -- --coverage` | Coverage report |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |

---

## Development Workflow

### Test-Driven Development (Required)

We follow strict TDD. Every feature must:

1. **Define Success Criteria** - What does "done" look like?
2. **Write Tests First** - Tests before implementation
3. **Implement to Pass Tests** - Code to satisfy tests
4. **Verify All Tests Pass** - No regressions
5. **Commit** - Conventional commits

```bash
# Example workflow
# 1. Create test file
touch src/shell/desktop/__tests__/MyFeature.test.tsx

# 2. Write failing tests
# 3. Run tests (should fail)
pnpm test -- --testPathPattern="MyFeature"

# 4. Implement feature
# 5. Run tests (should pass)
pnpm test -- --testPathPattern="MyFeature"

# 6. Run full suite (no regressions)
pnpm test

# 7. Commit
git add .
git commit -m "feat(shell): add MyFeature with tests"
```

### Branch Strategy

```
main
├── feature/window-snapping
├── feature/notification-system
├── fix/window-focus-bug
└── docs/architecture-update
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
feat(shell): add window snapping functionality
feat(store): implement notification persistence

# Fixes
fix(window): correct z-index stacking on focus
fix(taskbar): prevent double-click race condition

# Documentation
docs(readme): update installation instructions

# Tests
test(desktop): add error boundary integration tests

# Refactoring
refactor(store): extract persistence logic to service
```

---

## Testing Strategy

### Test File Structure

```
src/
├── shell/desktop/
│   ├── Window.tsx
│   └── __tests__/
│       └── Window.test.tsx    # Colocated tests
│
├── stores/
│   ├── desktopStore.ts
│   └── __tests__/
│       └── desktopStore.test.ts
```

### Test Categories

#### Unit Tests (Stores)

```typescript
// src/stores/__tests__/desktopStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDesktopStore } from '../desktopStore';

describe('desktopStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
  });

  it('opens a window', () => {
    const store = useDesktopStore.getState();
    const windowId = store.openWindow('module-1', 'Title', '📦');
    
    expect(store.windows).toHaveLength(1);
    expect(store.windows[0].id).toBe(windowId);
  });
});
```

#### Component Tests

```typescript
// src/shell/desktop/__tests__/Window.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Window } from '../Window';

describe('Window', () => {
  const mockWindow = {
    id: 'test-1',
    title: 'Test Window',
    icon: '📦',
    // ... other props
  };

  it('renders window title', () => {
    render(<Window window={mockWindow} />);
    expect(screen.getByText('Test Window')).toBeInTheDocument();
  });

  it('calls close on close button click', async () => {
    render(<Window window={mockWindow} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    // Assert close was called
  });
});
```

#### Integration Tests

```typescript
// src/shell/desktop/__tests__/DesktopIntegration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Desktop } from '../Desktop';
import { useDesktopStore } from '../../../stores/desktopStore';

describe('Desktop Integration', () => {
  it('renders window when opened via store', () => {
    render(<Desktop />);
    
    act(() => {
      useDesktopStore.getState().openWindow('mod-1', 'New Window', '📦');
    });
    
    expect(screen.getByText('New Window')).toBeInTheDocument();
  });
});
```

### Testing Utilities

```typescript
// Test helpers we use frequently

// Reset all stores
const resetStores = () => {
  act(() => {
    useDesktopStore.setState({ windows: [], activeWindowId: null });
    useStartMenuStore.setState({ isOpen: false, searchQuery: '' });
    useNotificationStore.getState().clearAll();
  });
};

// Create test window data
const createTestWindow = (overrides = {}) => ({
  id: `window-${Date.now()}`,
  moduleId: 'test-module',
  title: 'Test Window',
  icon: '📦',
  position: { x: 100, y: 100 },
  size: { width: 800, height: 600 },
  state: 'normal' as const,
  zIndex: 1,
  ...overrides,
});
```

---

## Adding Features

### Step-by-Step Process

#### 1. Define Success Criteria

```markdown
SUCCESS CRITERIA - Feature: Window Snapping
═══════════════════════════════════════════

SC-1: Dragging window to left edge snaps to left half
SC-2: Dragging window to right edge snaps to right half
SC-3: Dragging window to corner snaps to quarter
SC-4: Snap preview shows before drop
SC-5: Keyboard shortcut Win+Arrow also snaps
```

#### 2. Create Test Plan

```markdown
TEST PLAN
═════════

| Test | File | Description |
|------|------|-------------|
| detectSnapZone | snapUtils.test.ts | Detect zone from position |
| calculateSnapBounds | snapUtils.test.ts | Calculate snapped size |
| SnapPreview | SnapPreview.test.tsx | Preview renders correctly |
| Window snap | Window.test.tsx | Window snaps on drag end |
```

#### 3. Write Tests

```typescript
// src/utils/__tests__/snapUtils.test.ts
describe('detectSnapZone', () => {
  it('returns left zone when near left edge', () => {
    const zone = detectSnapZone({ x: 5, y: 300 }, viewport);
    expect(zone).toBe('left');
  });
});
```

#### 4. Implement Feature

```typescript
// src/utils/snapUtils.ts
export function detectSnapZone(position: Position, viewport: Size): SnapZone | null {
  const SNAP_THRESHOLD = 20;
  
  if (position.x <= SNAP_THRESHOLD) return 'left';
  if (position.x >= viewport.width - SNAP_THRESHOLD) return 'right';
  // ... more zones
  
  return null;
}
```

#### 5. Verify Tests Pass

```bash
pnpm test -- --testPathPattern="snapUtils"
# All tests should pass
```

#### 6. Integration Testing

```bash
pnpm test -- --testPathPattern="Window|Desktop"
# Verify no regressions
```

#### 7. Commit

```bash
git add .
git commit -m "feat(shell): implement window snapping with preview"
```

---

## Code Style

### TypeScript Guidelines

```typescript
// ✅ Use explicit types for public APIs
export interface WindowProps {
  window: DesktopWindow;
  children?: React.ReactNode;
}

// ✅ Use type inference for internal variables
const [isOpen, setIsOpen] = useState(false);

// ✅ Prefer interfaces for objects
interface Position {
  x: number;
  y: number;
}

// ✅ Use type for unions/intersections
type WindowState = 'normal' | 'minimized' | 'maximized' | 'snapped';

// ✅ Export types separately
export type { WindowProps, WindowState };
```

### Component Guidelines

```typescript
// ✅ Functional components with explicit return type
export const Window: React.FC<WindowProps> = ({ window, children }) => {
  // Implementation
};

// ✅ Use meaningful test IDs
<div data-testid="window-titlebar">

// ✅ Accessibility attributes
<button aria-label="Close window" onClick={handleClose}>

// ✅ Semantic HTML
<nav role="navigation" aria-label="Taskbar">
```

### File Organization

```typescript
/**
 * TerraFusion OS Window Component
 *
 * Description of what this component does.
 *
 * @module shell/desktop/Window
 * @see SUCCESS CRITERIA SC-4
 */

import { ... } from 'react';          // React imports first
import { ... } from '@/lib/utils';    // Internal imports
import { ... } from './SubComponent'; // Local imports

// ============================================================================
// Types
// ============================================================================

export interface WindowProps { ... }

// ============================================================================
// Constants
// ============================================================================

const MIN_WIDTH = 400;

// ============================================================================
// Subcomponents
// ============================================================================

const TitleBar: React.FC<...> = () => { ... };

// ============================================================================
// Main Component
// ============================================================================

export const Window: React.FC<WindowProps> = () => { ... };

export default Window;
```

---

## Common Patterns

### Store Access in Components

```typescript
// ✅ Select specific state (prevents unnecessary re-renders)
const windows = useDesktopStore((state) => state.windows);
const activeId = useDesktopStore((state) => state.activeWindowId);

// ✅ Select multiple values with shallow compare
const { openWindow, closeWindow } = useDesktopStore((state) => ({
  openWindow: state.openWindow,
  closeWindow: state.closeWindow,
}));

// ❌ Don't select entire store
const store = useDesktopStore(); // Re-renders on ANY change
```

### Error Handling

```typescript
// ✅ Use error boundaries for component errors
<WindowErrorBoundary
  windowId={window.id}
  moduleName={window.title}
  onReload={handleReload}
  onClose={handleClose}
>
  <ModuleLoader moduleId={window.moduleId} />
</WindowErrorBoundary>

// ✅ Use try-catch for async operations
const handleLaunch = async () => {
  try {
    await launchModule(moduleId);
    addNotification({ title: 'Success', type: 'success' });
  } catch (error) {
    addNotification({ title: 'Failed', type: 'error' });
  }
};

// ✅ Use error reporter for logging
const { reportError } = useErrorReporter('MyComponent');
reportError(error, { context: 'additional info' });
```

### Keyboard Shortcuts

```typescript
// ✅ Global shortcuts in Desktop component
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Meta') {
      e.preventDefault();
      toggleStartMenu();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [toggleStartMenu]);

// ✅ Component-specific shortcuts
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    onClose();
  }
};
```

### Notifications

```typescript
// ✅ Use notification helpers
import { notifyModuleLaunched, notifyModuleError } from '@/services/moduleNotifications';

// On success
notifyModuleLaunched('Assessment Pro', '📊');

// On error
notifyModuleError('GIS Viewer', 'Connection timeout');

// Custom notification
addNotification({
  title: 'Custom Title',
  message: 'Custom message',
  type: 'info', // 'info' | 'success' | 'warning' | 'error'
}, {
  showToast: true,
  duration: 5000,
});
```

---

## Troubleshooting

### Common Issues

#### Tests Failing After Store Changes

```bash
# Reset store state in beforeEach
beforeEach(() => {
  act(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
  });
});
```

#### Component Not Re-rendering

```typescript
// Check selector - might be selecting stale reference
// ❌ Bad - object reference doesn't change
const state = useStore((s) => s);

// ✅ Good - primitives or shallow compare
const windows = useStore((s) => s.windows);
```

#### Error Boundary Not Catching

```typescript
// Error boundaries only catch errors during:
// - Rendering
// - Lifecycle methods
// - Constructor

// ❌ Not caught - async error
useEffect(() => {
  fetchData().catch(console.error); // Not caught by boundary
}, []);

// ✅ Caught - render error
const Component = () => {
  throw new Error('Render error'); // Caught by boundary
};
```

#### localStorage Not Persisting

```typescript
// Check if running in test environment
if (typeof window !== 'undefined' && window.localStorage) {
  localStorage.setItem(key, value);
}

// Check storage quota
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available');
}
```

### Debug Tools

```typescript
// Enable Zustand devtools
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set, get) => ({ ... }),
    { name: 'StoreName' }
  )
);

// Log state changes
useStore.subscribe(console.log);

// Inspect current state
console.log(useStore.getState());
```

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design
- [API Reference](./API_REFERENCE.md) - Store and hook APIs
- [README](../README.md) - Project overview

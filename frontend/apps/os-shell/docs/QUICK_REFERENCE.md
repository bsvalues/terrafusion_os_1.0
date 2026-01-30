# ⚡ TerraFusion OS Shell - Quick Reference

One-page reference for common tasks.

---

## 🪟 Window Management

```typescript
import { useWindowActions, useWindows } from '@/stores';

// Open window
const { openWindow } = useWindowActions();
const windowId = openWindow('module-id', 'Title', '📦');

// Close window
const { closeWindow } = useWindowActions();
closeWindow(windowId);

// Get all windows
const windows = useWindows();

// Focus window
const { focusWindow } = useWindowActions();
focusWindow(windowId);

// Snap window
const { snapWindow } = useSnapActions();
snapWindow(windowId, 'left', { x: 0, y: 0, width: 960, height: 1032 });
```

---

## 🚀 Start Menu

```typescript
import { useStartMenuStore, useStartMenuOpen } from '@/stores';

// Toggle
const toggle = useStartMenuStore((s) => s.toggle);
toggle();

// Check if open
const isOpen = useStartMenuOpen();

// Search
const setSearchQuery = useStartMenuStore((s) => s.setSearchQuery);
setSearchQuery('assessment');

// Pin/Unpin
const { pinApp, unpinApp } = useStartMenuStore.getState();
pinApp('module-id');
unpinApp('module-id');

// Recent apps
const { addRecentApp } = useStartMenuStore.getState();
addRecentApp({ id: 'mod', name: 'mod', displayName: 'Module', icon: '📦' });
```

---

## 🔔 Notifications

```typescript
import { useNotificationStore } from '@/stores';

// Add notification with toast
const { addNotification } = useNotificationStore.getState();
addNotification({
  title: 'Success!',
  message: 'Operation completed',
  type: 'success', // 'info' | 'success' | 'warning' | 'error'
});

// Silent notification (no toast)
addNotification({ title: 'Note', message: 'Info', type: 'info' }, { showToast: false });

// Custom duration
addNotification({ title: 'Alert', message: 'Read me', type: 'warning' }, { duration: 10000 });

// Dismiss
const { dismissNotification, dismissToast } = useNotificationStore.getState();
dismissNotification(id);  // Remove from history
dismissToast(id);         // Remove toast only

// Clear all
const { clearAll, markAllAsRead } = useNotificationStore.getState();
```

---

## 🛡️ Error Handling

```typescript
import { useErrorReporter, useErrorToast } from '@/hooks';

// Basic error reporting
const { reportError, reportWarning } = useErrorReporter('ComponentName');
try {
  await riskyOperation();
} catch (error) {
  reportError(error, { context: 'additional info' });
}

// Error reporting with auto-toast
const { reportError } = useErrorToast('ComponentName');
reportError(error); // Logs AND shows error toast
```

---

## 📦 Module System

```typescript
import { useModuleRegistryStore, useModuleLaunchNotifications } from '@/stores';

// Launch with notifications
const { launchWithNotification } = useModuleLaunchNotifications();
await launchWithNotification('module-id'); // Auto success/error toast

// Manual launch
const { launchModule } = useModuleRegistryStore.getState();
const windowId = await launchModule('module-id');

// Get module info
const { getModuleById } = useModuleRegistryStore.getState();
const module = getModuleById('module-id');

// Check load state
const isLoaded = useIsModuleLoaded('module-id');
const isLoading = useIsModuleLoading('module-id');
```

---

## 💾 Persistence

```typescript
import { useHydration } from '@/hooks';
import { saveDesktopState, loadDesktopState, clearPersistedState } from '@/services/persistenceService';

// Auto-hydration on mount
const { isHydrating, isHydrated, error } = useHydration();

// Manual persistence (usually automatic)
saveDesktopState({ windows: [...], activeWindowId: '...' });
const state = loadDesktopState();

// Clear all
clearPersistedState();
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Handler Location |
|----------|--------|------------------|
| `Win` | Toggle Start Menu | Desktop.tsx |
| `Escape` | Close Start Menu / Panel | Desktop.tsx |
| `Win + ←` | Snap left | Window.tsx |
| `Win + →` | Snap right | Window.tsx |
| `Win + ↑` | Maximize | Window.tsx |
| `Win + ↓` | Restore / Minimize | Window.tsx |
| `Tab` | Navigate sections | StartMenu.tsx |
| `Enter` | Launch focused app | StartMenu.tsx |

---

## 🧪 Testing Patterns

```typescript
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDesktopStore } from '@/stores';

// Reset stores before each test
beforeEach(() => {
  act(() => {
    useDesktopStore.setState({ windows: [], activeWindowId: null });
  });
});

// Test store action
it('opens window', () => {
  const { openWindow } = useDesktopStore.getState();
  const id = openWindow('mod', 'Title', '📦');
  expect(useDesktopStore.getState().windows).toHaveLength(1);
});

// Test component with store
it('renders windows', () => {
  act(() => {
    useDesktopStore.getState().openWindow('mod', 'Title', '📦');
  });
  render(<WindowManager />);
  expect(screen.getByText('Title')).toBeInTheDocument();
});

// Test user interaction
it('closes on button click', async () => {
  render(<Window window={mockWindow} />);
  await userEvent.click(screen.getByRole('button', { name: /close/i }));
  // Assert window closed
});
```

---

## 📁 Import Paths

```typescript
// Stores
import { useDesktopStore, useStartMenuStore, useNotificationStore } from '@/stores';

// Hooks
import { useHydration, useErrorReporter, useErrorToast } from '@/hooks';

// Components
import { Desktop, Window, Taskbar, StartMenu } from '@/shell/desktop';
import { Toast, ToastContainer } from '@/shell/notifications';

// Services
import { saveDesktopState, loadDesktopState } from '@/services/persistenceService';
import { notifyModuleLaunched, notifyModuleError } from '@/services/moduleNotifications';

// Types
import type { DesktopWindow, Position, Size, SnapZone } from '@/stores';
```

---

## 🎨 Brand Colors

```css
/* Primary */
--cyan: #00ffee;      /* TerraFusion signature */
--blue: #0099ff;      /* Accent */

/* Backgrounds */
--dark: #0a0e1a;      /* Primary background */
--darker: #1a1a2e;    /* Secondary background */

/* Status */
--success: #00ffaa;   /* Green */
--warning: #ffaa00;   /* Yellow */
--error: #ff4444;     /* Red */

/* Glass morphism */
background: rgba(10, 14, 26, 0.95);
backdrop-filter: blur(24px);
border: 1px solid rgba(0, 255, 238, 0.2);
```

---

## 📖 Full Documentation

- [README](../README.md) - Project overview
- [Architecture](./ARCHITECTURE.md) - System design
- [Developer Guide](./DEVELOPER_GUIDE.md) - Contributing
- [API Reference](./API_REFERENCE.md) - Complete API

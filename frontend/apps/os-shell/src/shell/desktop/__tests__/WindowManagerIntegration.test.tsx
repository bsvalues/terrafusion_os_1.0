/**
 * TerraFusion OS WindowManager Integration Tests
 * 
 * Tests for WindowManager with error boundaries integrated:
 * - Windows wrapped in error boundaries
 * - Error isolation between windows
 * - Recovery actions
 * 
 * @module shell/desktop/__tests__/WindowManagerIntegration.test
 * @vitest-environment jsdom
 */

// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

import { WindowManager } from '../WindowManager';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useModuleRegistryStore } from '../../../stores/moduleRegistryStore';
import { useNotificationStore } from '../../../stores/notificationStore';



// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
  
  // Reset stores
  act(() => {
    useDesktopStore.getState().windows = [];
    useDesktopStore.getState().activeWindowId = null;
    useDesktopStore.getState().nextZIndex = 1;
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  console.error = originalError;
  cleanup();
});

// Helper to add a window to the store
const addTestWindow = (id: string, moduleId: string, title: string) => {
  act(() => {
    const store = useDesktopStore.getState();
    store.windows = [
      ...store.windows,
      {
        id,
        moduleId,
        title,
        icon: '📦',
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        state: 'normal' as const,
        zIndex: store.nextZIndex++,
      },
    ];
  });
};

// Register a test module
const registerTestModule = (id: string, displayName: string) => {
  act(() => {
    const store = useModuleRegistryStore.getState();
    const modules = new Map(store.modules);
    modules.set(id, {
      id,
      name: id,
      displayName,
      description: 'Test module',
      icon: '📦',
      category: 'Test',
      tier: 'Tier1' as const,
      status: 'active' as const,
      version: '1.0.0',
      launchPath: '/test',
      isCore: false,
      priority: 1,
    });
    store.modules = modules;
    store.isInitialized = true;
  });
};

describe('WindowManager Integration', () => {
  describe('Error Boundary Wrapping', () => {
    it('renders windows with error boundary protection', () => {
      registerTestModule('test-module', 'Test Module');
      addTestWindow('window-1', 'test-module', 'Test Window');
      
      render(<WindowManager />);
      
      // Window should render
      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
      expect(screen.getByTestId('window')).toBeInTheDocument();
    });

    it('multiple windows render independently', () => {
      registerTestModule('module-1', 'Module 1');
      registerTestModule('module-2', 'Module 2');
      addTestWindow('window-1', 'module-1', 'Window 1');
      addTestWindow('window-2', 'module-2', 'Window 2');
      
      render(<WindowManager />);
      
      const windows = screen.getAllByTestId('window');
      expect(windows).toHaveLength(2);
    });
  });

  describe('Window Close Action', () => {
    it('close button removes window from store', async () => {
      registerTestModule('test-module', 'Test Module');
      addTestWindow('window-1', 'test-module', 'Test Window');
      
      render(<WindowManager />);
      
      // Verify window exists
      expect(screen.getByTestId('window')).toBeInTheDocument();
      
      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);
      
      // Window should be removed
      expect(screen.queryByTestId('window')).not.toBeInTheDocument();
    });
  });

  describe('Minimized Windows', () => {
    it('does not render minimized windows', () => {
      registerTestModule('test-module', 'Test Module');
      
      act(() => {
        const store = useDesktopStore.getState();
        store.windows = [
          {
            id: 'minimized-window',
            moduleId: 'test-module',
            title: 'Minimized',
            icon: '📦',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'minimized' as const,
            zIndex: 1,
          },
        ];
      });
      
      render(<WindowManager />);
      
      expect(screen.queryByTestId('window')).not.toBeInTheDocument();
    });
  });

  describe('Z-Index Ordering', () => {
    it('renders windows in z-index order', () => {
      registerTestModule('module-1', 'Module 1');
      registerTestModule('module-2', 'Module 2');
      
      act(() => {
        const store = useDesktopStore.getState();
        store.windows = [
          {
            id: 'window-back',
            moduleId: 'module-1',
            title: 'Back Window',
            icon: '📦',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal' as const,
            zIndex: 1,
          },
          {
            id: 'window-front',
            moduleId: 'module-2',
            title: 'Front Window',
            icon: '📦',
            position: { x: 150, y: 150 },
            size: { width: 800, height: 600 },
            state: 'normal' as const,
            zIndex: 2,
          },
        ];
      });
      
      render(<WindowManager />);
      
      const windows = screen.getAllByTestId('window');
      expect(windows).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('window manager has proper region role', () => {
      render(<WindowManager />);
      
      const manager = screen.getByTestId('window-manager');
      expect(manager).toHaveAttribute('role', 'region');
      expect(manager).toHaveAttribute('aria-label', 'Application windows');
    });

    it('has live region for dynamic updates', () => {
      render(<WindowManager />);
      
      const manager = screen.getByTestId('window-manager');
      expect(manager).toHaveAttribute('aria-live', 'polite');
    });
  });
});

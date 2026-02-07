/**
 * TerraFusion OS Desktop Integration Tests
 *
 * Tests for Desktop with error boundary and toast container integrated:
 * - Desktop wrapped in error boundary
 * - Toast container rendered
 * - Full stack protection
 *
 * @module shell/desktop/__tests__/DesktopIntegration.test
 * @vitest-environment jsdom
 */

// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { useDesktopStore } from '../../../stores/desktopStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { DesktopWithErrorBoundary } from '../Desktop';

/**
 * Test wrapper providing Router context required by DesktopIconGrid
 * which uses useNavigate() for module launch routing.
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/desktop']}>{children}</MemoryRouter>
);

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();

  // Reset stores
  act(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
    });
    useStartMenuStore.setState({
      isOpen: false,
      searchQuery: '',
      pinnedModuleIds: [],
      recentApps: [],
      focusedIndex: -1,
      focusedSection: 'search',
    });
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  console.error = originalError;
  cleanup();
});

describe('Desktop Integration', () => {
  describe('Desktop Rendering', () => {
    it('renders desktop with all components', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument();
    });

    it('renders toast container', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });
  });

  describe('Toast Display', () => {
    it('displays toast when notification added', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      // Add a notification
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test Toast',
          message: 'This is a test notification',
          type: 'info',
        });
      });

      // Toast should appear
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('displays multiple toasts up to max', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      // Add multiple notifications
      act(() => {
        const store = useNotificationStore.getState();
        store.addNotification({ title: 'Toast 1', message: 'Message 1', type: 'info' });
        store.addNotification({ title: 'Toast 2', message: 'Message 2', type: 'success' });
        store.addNotification({ title: 'Toast 3', message: 'Message 3', type: 'warning' });
      });

      // All 3 should be visible (max is 3)
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });

  describe('Error Protection', () => {
    it('desktop is protected by error boundary', () => {
      // The DesktopWithErrorBoundary should not throw even if there's an error
      // This test verifies the structure is correct
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('desktop has proper main role', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('toast container has live region', () => {
      render(<DesktopWithErrorBoundary />, { wrapper: TestWrapper });

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });
});

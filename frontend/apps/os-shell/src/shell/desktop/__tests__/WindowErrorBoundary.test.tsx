/**
 * TerraFusion OS Window Error Boundary Tests
 *
 * Tests for error boundary that wraps window content:
 * - Catches errors within window
 * - Shows friendly error UI
 * - Preserves other windows
 * - Recovery functionality
 *
 * @module shell/desktop/__tests__/WindowErrorBoundary.test
 * @vitest-environment jsdom
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';

import { WindowErrorBoundary } from '../WindowErrorBoundary';



// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  cleanup();
});

// Component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div data-testid='child-content'>Normal content</div>;
};

// Component that throws on click
const ThrowOnClickComponent: React.FC = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Error triggered by user action');
  }

  return (
    <button onClick={() => setShouldThrow(true)} data-testid='trigger-error'>
      Click to trigger error
    </button>
  );
};

import React from 'react';

describe('WindowErrorBoundary', () => {
  describe('Normal Operation', () => {
    it('renders children when no error', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <div data-testid='child-content'>Normal content</div>
        </WindowErrorBoundary>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('does not show error UI when no error', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <div>Normal content</div>
        </WindowErrorBoundary>
      );

      expect(screen.queryByTestId('window-error-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('catches errors from child components', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByTestId('window-error-fallback')).toBeInTheDocument();
    });

    it('shows error fallback UI', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('displays module name in error UI', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Government Edition'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByText(/Government Edition/)).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      // Error message appears both in the error text and stack trace
      const elements = screen.getAllByText(/Test error from component/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('logs error to console', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Recovery', () => {
    it('shows reload button', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    });

    it('calls onReload when reload button clicked', async () => {
      const onReload = vi.fn();

      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module' onReload={onReload}>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      await userEvent.click(screen.getByRole('button', { name: /reload/i }));

      expect(onReload).toHaveBeenCalledWith('test-window');
    });

    it('resets error state on reload', async () => {
      const TestWrapper: React.FC = () => {
        const [key, setKey] = React.useState(0);
        const [shouldThrow, setShouldThrow] = React.useState(true);

        const handleReload = () => {
          setShouldThrow(false);
          setKey((k) => k + 1);
        };

        return (
          <WindowErrorBoundary
            key={key}
            windowId='test-window'
            moduleName='Test Module'
            onReload={handleReload}
          >
            <ThrowingComponent shouldThrow={shouldThrow} />
          </WindowErrorBoundary>
        );
      };

      render(<TestWrapper />);

      // Initially shows error
      expect(screen.getByTestId('window-error-fallback')).toBeInTheDocument();

      // Click reload
      await userEvent.click(screen.getByRole('button', { name: /reload/i }));

      // Should show normal content now
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Close Window', () => {
    it('shows close button', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();

      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module' onClose={onClose}>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledWith('test-window');
    });
  });

  describe('Isolation', () => {
    it('error in one boundary does not affect siblings', () => {
      render(
        <div>
          <WindowErrorBoundary windowId='window-1' moduleName='Module 1'>
            <ThrowingComponent />
          </WindowErrorBoundary>
          <WindowErrorBoundary windowId='window-2' moduleName='Module 2'>
            <div data-testid='sibling-content'>Sibling still works</div>
          </WindowErrorBoundary>
        </div>
      );

      // First window shows error
      expect(screen.getByTestId('window-error-fallback')).toBeInTheDocument();

      // Second window still works
      expect(screen.getByTestId('sibling-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('error fallback has role="alert"', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('buttons have accessible labels', () => {
      render(
        <WindowErrorBoundary windowId='test-window' moduleName='Test Module'>
          <ThrowingComponent />
        </WindowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /close/i })).toHaveAccessibleName();
    });
  });
});

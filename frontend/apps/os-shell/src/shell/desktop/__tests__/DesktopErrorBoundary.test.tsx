/**
 * TerraFusion OS Desktop Error Boundary Tests
 *
 * Tests for top-level error boundary:
 * - Catches catastrophic errors
 * - Shows full-screen recovery UI
 * - Restart functionality
 *
 * @module shell/desktop/__tests__/DesktopErrorBoundary.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';

import { DesktopErrorBoundary } from '../DesktopErrorBoundary';

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  cleanup();
});

import React from 'react';

// Component that throws an error
const CatastrophicError: React.FC = () => {
  throw new Error('Catastrophic system failure');
};

describe('DesktopErrorBoundary', () => {
  describe('Normal Operation', () => {
    it('renders children when no error', () => {
      render(
        <DesktopErrorBoundary>
          <div data-testid='desktop-content'>Desktop Content</div>
        </DesktopErrorBoundary>
      );

      expect(screen.getByTestId('desktop-content')).toBeInTheDocument();
    });

    it('does not show error UI when no error', () => {
      render(
        <DesktopErrorBoundary>
          <div>Desktop Content</div>
        </DesktopErrorBoundary>
      );

      expect(screen.queryByTestId('desktop-error-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('catches catastrophic errors', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(screen.getByTestId('desktop-error-fallback')).toBeInTheDocument();
    });

    it('shows full-screen error UI', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      const fallback = screen.getByTestId('desktop-error-fallback');
      // Should take full viewport
      expect(fallback).toHaveClass('w-screen', 'h-screen');
    });

    it('displays TerraFusion branding', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      // TerraFusion appears in multiple places (header, button, footer)
      const brandingElements = screen.getAllByText(/TerraFusion/i);
      expect(brandingElements.length).toBeGreaterThan(0);
    });

    it('displays recovery message', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Recovery', () => {
    it('shows restart button', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      // Use specific aria-label to avoid matching "Clear Data & Restart" button
      expect(screen.getByRole('button', { name: /restart terrafusion os/i })).toBeInTheDocument();
    });

    // Skip: jsdom doesn't allow redefining window.location reliably
    it.skip('restart button triggers page reload', async () => {
      // Mock window.location.reload using delete+assign pattern
      const originalLocation = window.location;
      const reloadMock = jest.fn();
      // @ts-expect-error - deleting location for mock
      delete window.location;
      window.location = { ...originalLocation, reload: reloadMock } as Location;

      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      // Use specific aria-label to avoid matching "Clear Data & Restart" button
      await userEvent.click(screen.getByRole('button', { name: /restart terrafusion os/i }));

      expect(reloadMock).toHaveBeenCalled();
    });

    it('shows "Clear Data & Restart" option', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /clear data/i })).toBeInTheDocument();
    });

    // Skip: jsdom doesn't allow redefining window.location reliably
    it.skip('clear data button clears localStorage', async () => {
      // Store original localStorage
      const originalClear = window.localStorage.clear.bind(window.localStorage);
      const clearMock = jest.fn();
      window.localStorage.clear = clearMock;

      // Mock window.location.reload using delete+assign pattern
      const originalLocation = window.location;
      const reloadMock = jest.fn();
      // @ts-expect-error - deleting location for mock
      delete window.location;
      window.location = { ...originalLocation, reload: reloadMock } as Location;

      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      await userEvent.click(screen.getByRole('button', { name: /clear data/i }));

      expect(clearMock).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();

      // Restore
      window.localStorage.clear = originalClear;
      window.location = originalLocation;
    });
  });

  describe('Error Details', () => {
    it('shows error details in expandable section', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      // Error message appears both in the error text and stack trace
      const elements = screen.getAllByText(/Catastrophic system failure/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('error fallback has role="alert"', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('buttons are focusable', () => {
      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );

      // Use specific aria-label to avoid matching "Clear Data & Restart" button
      const restartButton = screen.getByRole('button', { name: /restart terrafusion os/i });
      restartButton.focus();
      expect(document.activeElement).toBe(restartButton);
    });
  });
});

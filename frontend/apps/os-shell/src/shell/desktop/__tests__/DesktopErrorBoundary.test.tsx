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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as matchers from '@testing-library/jest-dom/matchers';

import { DesktopErrorBoundary } from '../DesktopErrorBoundary';

expect.extend(matchers);

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
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
          <div data-testid="desktop-content">Desktop Content</div>
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
      
      expect(screen.getByText(/TerraFusion/i)).toBeInTheDocument();
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
      
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('restart button triggers page reload', async () => {
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );
      
      await userEvent.click(screen.getByRole('button', { name: /restart/i }));
      
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

    it('clear data button clears localStorage', async () => {
      // Mock localStorage
      const clearMock = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { clear: clearMock },
        writable: true,
      });

      // Mock reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );
      
      await userEvent.click(screen.getByRole('button', { name: /clear data/i }));
      
      expect(clearMock).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();
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
      
      expect(screen.getByText(/Catastrophic system failure/i)).toBeInTheDocument();
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
      
      const restartButton = screen.getByRole('button', { name: /restart/i });
      restartButton.focus();
      expect(document.activeElement).toBe(restartButton);
    });
  });
});

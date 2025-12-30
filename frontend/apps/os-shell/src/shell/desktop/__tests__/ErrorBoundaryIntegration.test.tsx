/**
 * TerraFusion OS Error Boundary Integration Tests
 * 
 * Tests for error boundaries working together:
 * - Window errors isolated from desktop
 * - Multiple windows with errors
 * - Recovery flows
 * 
 * @module shell/desktop/__tests__/ErrorBoundaryIntegration.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

import { WindowErrorBoundary } from '../WindowErrorBoundary';
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

// Test components
const WorkingComponent: React.FC<{ id: string }> = ({ id }) => (
  <div data-testid={`working-${id}`}>Working content {id}</div>
);

const FailingComponent: React.FC<{ id: string }> = ({ id }) => {
  throw new Error(`Error in component ${id}`);
};

// Simulated desktop with multiple windows
const SimulatedDesktop: React.FC<{
  windows: Array<{ id: string; fails: boolean }>;
}> = ({ windows }) => (
  <DesktopErrorBoundary>
    <div data-testid="desktop-container">
      {windows.map(w => (
        <WindowErrorBoundary
          key={w.id}
          windowId={w.id}
          moduleName={`Module ${w.id}`}
        >
          {w.fails ? <FailingComponent id={w.id} /> : <WorkingComponent id={w.id} />}
        </WindowErrorBoundary>
      ))}
    </div>
  </DesktopErrorBoundary>
);

describe('Error Boundary Integration', () => {
  describe('Window Error Isolation', () => {
    it('failing window does not crash sibling windows', () => {
      render(
        <SimulatedDesktop
          windows={[
            { id: 'window-1', fails: true },
            { id: 'window-2', fails: false },
            { id: 'window-3', fails: false },
          ]}
        />
      );
      
      // Window 1 shows error
      expect(screen.getByText(/Error in component window-1/)).toBeInTheDocument();
      
      // Windows 2 and 3 still work
      expect(screen.getByTestId('working-window-2')).toBeInTheDocument();
      expect(screen.getByTestId('working-window-3')).toBeInTheDocument();
    });

    it('multiple windows can fail independently', () => {
      render(
        <SimulatedDesktop
          windows={[
            { id: 'window-1', fails: true },
            { id: 'window-2', fails: true },
            { id: 'window-3', fails: false },
          ]}
        />
      );
      
      // Both failing windows show errors
      expect(screen.getByText(/Error in component window-1/)).toBeInTheDocument();
      expect(screen.getByText(/Error in component window-2/)).toBeInTheDocument();
      
      // Window 3 still works
      expect(screen.getByTestId('working-window-3')).toBeInTheDocument();
    });

    it('desktop container remains intact when windows fail', () => {
      render(
        <SimulatedDesktop
          windows={[
            { id: 'window-1', fails: true },
          ]}
        />
      );
      
      // Desktop container is still there
      expect(screen.getByTestId('desktop-container')).toBeInTheDocument();
      
      // NOT the desktop error fallback
      expect(screen.queryByTestId('desktop-error-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Error Boundary', () => {
    it('catches errors outside window boundaries', () => {
      const ErrorOutsideWindow: React.FC = () => {
        throw new Error('Error outside window');
      };

      render(
        <DesktopErrorBoundary>
          <ErrorOutsideWindow />
        </DesktopErrorBoundary>
      );
      
      expect(screen.getByTestId('desktop-error-fallback')).toBeInTheDocument();
    });

    it('shows desktop error fallback with branding', () => {
      const CatastrophicError: React.FC = () => {
        throw new Error('Catastrophic failure');
      };

      render(
        <DesktopErrorBoundary>
          <CatastrophicError />
        </DesktopErrorBoundary>
      );
      
      expect(screen.getByText(/TerraFusion/i)).toBeInTheDocument();
      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('window reload callback is called with correct windowId', async () => {
      const onReload = vi.fn();
      
      render(
        <WindowErrorBoundary
          windowId="test-123"
          moduleName="Test Module"
          onReload={onReload}
        >
          <FailingComponent id="test" />
        </WindowErrorBoundary>
      );
      
      await userEvent.click(screen.getByRole('button', { name: /reload/i }));
      
      expect(onReload).toHaveBeenCalledWith('test-123');
    });

    it('window close callback is called with correct windowId', async () => {
      const onClose = vi.fn();
      
      render(
        <WindowErrorBoundary
          windowId="test-456"
          moduleName="Test Module"
          onClose={onClose}
        >
          <FailingComponent id="test" />
        </WindowErrorBoundary>
      );
      
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      
      expect(onClose).toHaveBeenCalledWith('test-456');
    });
  });

  describe('Error Logging', () => {
    it('logs window errors with component context', () => {
      render(
        <WindowErrorBoundary
          windowId="logged-window"
          moduleName="Logged Module"
        >
          <FailingComponent id="logged" />
        </WindowErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('logged-window'),
        expect.any(Error),
        expect.anything()
      );
    });

    it('logs desktop errors as critical', () => {
      const CriticalError: React.FC = () => {
        throw new Error('Critical');
      };

      render(
        <DesktopErrorBoundary>
          <CriticalError />
        </DesktopErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Error),
        expect.anything()
      );
    });
  });

  describe('Accessibility', () => {
    it('window error fallback is announced to screen readers', () => {
      render(
        <WindowErrorBoundary windowId="a11y-test" moduleName="A11y Module">
          <FailingComponent id="a11y" />
        </WindowErrorBoundary>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('desktop error fallback is announced to screen readers', () => {
      const Error: React.FC = () => { throw new Error('Test'); };
      
      render(
        <DesktopErrorBoundary>
          <Error />
        </DesktopErrorBoundary>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('all recovery buttons are keyboard accessible', () => {
      render(
        <WindowErrorBoundary windowId="kb-test" moduleName="KB Module">
          <FailingComponent id="kb" />
        </WindowErrorBoundary>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });
});

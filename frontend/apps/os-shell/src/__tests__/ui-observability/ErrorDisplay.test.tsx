/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - UI OBSERVABILITY TEST SUITE
 * Phase 1: correlationId-First Error Display Contract
 *
 * Tests the core contract from UI_CONTRACT.md:
 * - correlationId visible when present
 * - Copy button works
 * - Trace query hint shown in dev mode only
 * - User-safe error messages
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ErrorDisplay } from '../../components/errors/ErrorDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('ErrorDisplay - correlationId Contract', () => {
  const mockError = {
    message: 'This action requires confirmation',
    errorCode: 'CONFIRMATION_REQUIRED',
    correlationId: 'corr-abc123',
    timestamp: '2026-02-04T10:00:00Z',
    component: 'ToolRunner',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('correlationId Display', () => {
    it('displays correlationId when provided', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText(/corr-abc123/i)).toBeInTheDocument();
    });

    it('does not crash when correlationId is missing', () => {
      const errorWithoutCorrelation = { ...mockError, correlationId: undefined };

      render(<ErrorDisplay error={errorWithoutCorrelation} />);

      expect(screen.getByText(/This action requires confirmation/i)).toBeInTheDocument();
    });

    it('renders correlationId in a copyable format', () => {
      render(<ErrorDisplay error={mockError} />);

      const correlationElement = screen.getByText(/corr-abc123/i);
      expect(correlationElement.tagName).toBe('CODE'); // Should be in <code> tag
    });
  });

  describe('Copy Button', () => {
    it('has a copy button when correlationId is present', () => {
      render(<ErrorDisplay error={mockError} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('copies correlationId to clipboard when clicked', async () => {
      render(<ErrorDisplay error={mockError} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('corr-abc123');
      });
    });

    it('shows feedback after copying', async () => {
      render(<ErrorDisplay error={mockError} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('does not show copy button when correlationId is missing', () => {
      const errorWithoutCorrelation = { ...mockError, correlationId: undefined };

      render(<ErrorDisplay error={errorWithoutCorrelation} />);

      expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    });
  });

  describe('Dev Mode Trace Query Hint', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('shows trace query hint in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText(/pnpm run trace:query/i)).toBeInTheDocument();
      expect(screen.getByText(/--correlation/i)).toBeInTheDocument();
    });

    it('hides trace query hint in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(<ErrorDisplay error={mockError} />);

      expect(screen.queryByText(/pnpm run trace:query/i)).not.toBeInTheDocument();
    });

    it('includes correlationId in trace query command', () => {
      process.env.NODE_ENV = 'development';

      render(<ErrorDisplay error={mockError} />);

      const hint = screen.getByText(/corr-abc123/i, { selector: 'pre code' });
      expect(hint.textContent).toContain('pnpm run trace:query --correlation corr-abc123');
    });
  });

  describe('User-Safe Error Messages', () => {
    it('displays user-safe message for error code', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText(/This action requires confirmation/i)).toBeInTheDocument();
    });

    it('handles WRITE_LANE_MISMATCH error code', () => {
      const error = {
        ...mockError,
        errorCode: 'WRITE_LANE_MISMATCH',
        message: 'Write lane must match suite',
      };

      render(<ErrorDisplay error={error} />);

      expect(screen.getByText(/Write lane/i)).toBeInTheDocument();
    });

    it('shows component name when provided', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText(/ToolRunner/i)).toBeInTheDocument();
    });

    it('shows timestamp in readable format', () => {
      render(<ErrorDisplay error={mockError} />);

      const timestampRegex = /2\/4\/2026/i; // MM/DD/YYYY format
      expect(screen.getByText(timestampRegex)).toBeInTheDocument();
    });
  });

  describe('Error Severity Styling', () => {
    it('applies critical styling for EXECUTION_FAILED errors', () => {
      const criticalError = {
        ...mockError,
        errorCode: 'EXECUTION_FAILED',
      };

      const { container } = render(<ErrorDisplay error={criticalError} />);

      // Should have red/critical styling classes
      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer.className).toMatch(/red|error|critical/i);
    });

    it('applies warning styling for validation errors', () => {
      const validationError = {
        ...mockError,
        errorCode: 'CONFIRMATION_REQUIRED',
      };

      const { container } = render(<ErrorDisplay error={validationError} />);

      // Should have yellow/warning styling classes
      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer.className).toMatch(/yellow|orange|warning/i);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('copy button has descriptive label', () => {
      render(<ErrorDisplay error={mockError} />);

      const copyButton = screen.getByRole('button', { name: /copy correlation id/i });
      expect(copyButton).toBeInTheDocument();
    });
  });
});

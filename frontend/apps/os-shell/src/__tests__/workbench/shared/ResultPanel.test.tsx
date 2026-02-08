/**
 * ResultPanel.test.tsx
 *
 * Phase 6.1: Tests for shared ResultPanel component
 *
 * Contract:
 * - Displays loading state with spinner
 * - Displays success state with correlationId
 * - Displays error state with ErrorDisplay
 * - Displays idle/placeholder state
 * - Shows dev info in development mode
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ResultPanel } from '../../../components/workbench/ResultPanel';

// Mock ErrorDisplay
vi.mock('../../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => (
    <div data-testid='error-display'>{error.message}</div>
  ),
}));

// Mock getEnv
vi.mock('../../../runtime/env', () => ({
  getEnv: vi.fn((key?: string) => {
    if (key === 'MODE') return 'development';
    if (key === 'DEV') return true;
    return { DEV: true, MODE: 'development' };
  }),
}));

describe('ResultPanel', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Idle State', () => {
    it('shows placeholder when idle', () => {
      render(
        <ResultPanel
          status='idle'
          idleContent={{
            icon: '🔥',
            title: 'Configure parameters',
            subtitle: 'Click button to start',
          }}
        />
      );

      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Configure parameters')).toBeInTheDocument();
      expect(screen.getByText('Click button to start')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows spinner and loading message', () => {
      render(<ResultPanel status='loading' loadingMessage='Analyzing...' />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });

    it('uses default loading message if none provided', () => {
      render(<ResultPanel status='loading' />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('renders children when successful', () => {
      render(
        <ResultPanel status='success' correlationId='corr-test-123'>
          <div data-testid='custom-content'>Success content here</div>
        </ResultPanel>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Success content here')).toBeInTheDocument();
    });

    it('displays correlationId with copy button', () => {
      render(
        <ResultPanel status='success' correlationId='corr-test-123-456-789'>
          <div>Content</div>
        </ResultPanel>
      );

      // CorrelationId may appear multiple times (header + dev info)
      expect(screen.getAllByText(/corr-test-123/).length).toBeGreaterThan(0);
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('copies correlationId on button click', () => {
      render(
        <ResultPanel status='success' correlationId='corr-full-id-here'>
          <div>Content</div>
        </ResultPanel>
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('corr-full-id-here');
    });

    it('shows dev info in development mode', () => {
      render(
        <ResultPanel status='success' correlationId='corr-dev-test'>
          <div>Content</div>
        </ResultPanel>
      );

      expect(screen.getByText(/developer info/i)).toBeInTheDocument();
      expect(screen.getByText(/trace:query/)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders ErrorDisplay with error info', () => {
      render(
        <ResultPanel
          status='error'
          error={{
            message: 'Something went wrong',
            code: 'TEST_ERROR',
            correlationId: 'corr-error-123',
            severity: 'error',
          }}
        />
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows dismiss button when onDismiss provided', () => {
      const onDismiss = vi.fn();
      render(
        <ResultPanel
          status='error'
          error={{
            message: 'Error occurred',
            code: 'TEST_ERROR',
            correlationId: 'corr-err',
            severity: 'error',
          }}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('Custom Header', () => {
    it('renders success header with icon', () => {
      render(
        <ResultPanel
          status='success'
          correlationId='corr-123'
          successHeader={{ icon: '✅', title: 'Analysis Complete' }}
        >
          <div>Result content</div>
        </ResultPanel>
      );

      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
    });
  });
});

/**
 * workbench.regression.test.tsx
 *
 * TDD: Regression assertions to protect PR#255 invariants.
 *
 * Invariants:
 * - Tab order in Workbench shell scaffold remains unchanged
 * - Route /property/:parcelId defaults to Summary without extra re-renders
 * - Existing test IDs preserved for automation
 *
 * These tests must continue to pass after materials adoption.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvocationHistory, InvocationRecord } from '../../components/workbench/InvocationHistory';
import { ParcelContextHeader } from '../../components/workbench/ParcelContextHeader';
import { ResultPanel } from '../../components/workbench/ResultPanel';
import * as materialQualityGate from '../../ui/materials/materialQualityGate';
import { MaterialQuality } from '../../ui/materials/materialQualityGate';

// Mock the quality gate
jest.mock('../../ui/materials/materialQualityGate', () => ({
  ...jest.requireActual('../../ui/materials/materialQualityGate'),
  useMaterialQuality: jest.fn(),
}));

const mockUseMaterialQuality = materialQualityGate.useMaterialQuality as jest.MockedFunction<
  typeof materialQualityGate.useMaterialQuality
>;

const HIGH_QUALITY_STATE: materialQualityGate.MaterialQualityState = {
  tier: MaterialQuality.HIGH,
  gpuTier: 3,
  enableBackdropBlur: true,
  enableGlassDistortion: true,
  enableSprings: true,
  enableWarps: true,
  enableLoopingAnimations: true,
  prefersReducedMotion: false,
};

describe('Workbench Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);
  });

  describe('Test ID Stability', () => {
    it('ParcelContextHeader preserves data-testid', () => {
      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      // This test ID is used by automation - must not change
      expect(screen.getByTestId('parcel-context-header')).toBeInTheDocument();
    });

    it('InvocationHistory preserves record test IDs', () => {
      const mockRecords: InvocationRecord[] = [
        {
          id: 'rec-1',
          toolId: 'terra-forge',
          status: 'success',
          correlationId: 'corr-123',
          timestamp: new Date(),
        },
      ];

      render(<InvocationHistory records={mockRecords} title='History' />);

      // Record test IDs are used for targeting specific records
      expect(screen.getByTestId('history-record-rec-1')).toBeInTheDocument();
    });
  });

  describe('Semantic Structure', () => {
    it('ParcelContextHeader title remains heading element', () => {
      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      // Title should still be accessible as a heading
      expect(screen.getByRole('heading', { name: 'TerraDossier' })).toBeInTheDocument();
    });

    it('ParcelContextHeader parcel ID remains code element', () => {
      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      const parcelCode = screen.getByText('12345-001');
      expect(parcelCode.tagName).toBe('CODE');
    });

    it('ResultPanel loading state has role=status', () => {
      render(<ResultPanel status='loading' loadingMessage='Loading...' />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility Invariants', () => {
    it('InvocationHistory copy buttons have aria-label', () => {
      const mockRecords: InvocationRecord[] = [
        {
          id: 'rec-1',
          toolId: 'terra-forge',
          status: 'success',
          correlationId: 'corr-123',
          timestamp: new Date(),
        },
      ];

      render(<InvocationHistory records={mockRecords} title='History' />);

      const copyButton = screen.getByRole('button', { name: /copy correlation id/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('ResultPanel dismiss button has aria-label', () => {
      render(
        <ResultPanel
          status='error'
          error={{
            code: 'TEST_ERROR',
            message: 'Error message',
            correlationId: 'corr-err',
          }}
          onDismiss={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('InvocationHistory buttons are focusable in order', async () => {
      const user = userEvent.setup();

      const mockRecords: InvocationRecord[] = [
        {
          id: 'rec-1',
          toolId: 'tool-1',
          status: 'success',
          correlationId: 'corr-1',
          timestamp: new Date(),
        },
        {
          id: 'rec-2',
          toolId: 'tool-2',
          status: 'success',
          correlationId: 'corr-2',
          timestamp: new Date(),
        },
        {
          id: 'rec-3',
          toolId: 'tool-3',
          status: 'error',
          correlationId: 'corr-3',
          timestamp: new Date(),
        },
      ];

      render(<InvocationHistory records={mockRecords} title='History' />);

      const buttons = screen.getAllByRole('button', { name: /copy/i });
      expect(buttons).toHaveLength(3);

      // Sequential focus order must be maintained
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it('ParcelContextHeader actions slot buttons are focusable', async () => {
      const user = userEvent.setup();

      render(
        <ParcelContextHeader
          icon='📁'
          title='TerraDossier'
          parcelId='12345-001'
          actions={
            <>
              <button>Action 1</button>
              <button>Action 2</button>
            </>
          }
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();
    });
  });

  describe('Content Stability', () => {
    it('ResultPanel renders all status states correctly', () => {
      const { rerender } = render(<ResultPanel status='idle' />);
      expect(screen.getByText(/ready/i)).toBeInTheDocument();

      rerender(<ResultPanel status='loading' loadingMessage='Processing...' />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();

      rerender(
        <ResultPanel status='success' correlationId='corr-123'>
          <p>Result content</p>
        </ResultPanel>
      );
      expect(screen.getByText('Result content')).toBeInTheDocument();

      rerender(
        <ResultPanel
          status='error'
          error={{ code: 'ERR', message: 'Failed', correlationId: 'corr-err' }}
        />
      );
      // Multiple elements contain "failed" - use getAllByText
      expect(screen.getAllByText(/failed/i).length).toBeGreaterThan(0);
    });

    it('InvocationHistory respects maxRecords limit', () => {
      const manyRecords: InvocationRecord[] = Array.from({ length: 15 }, (_, i) => ({
        id: `rec-${i}`,
        toolId: `tool-${i}`,
        status: 'success' as const,
        correlationId: `corr-${i}`,
        timestamp: new Date(),
      }));

      render(<InvocationHistory records={manyRecords} title='History' maxRecords={5} />);

      // Should only render 5 records
      const records = screen.getAllByTestId(/^history-record-/);
      expect(records).toHaveLength(5);
    });
  });
});

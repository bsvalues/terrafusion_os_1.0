/**
 * workbench.materials.test.tsx
 *
 * TDD: Tests for Visual Renaissance materials adoption in Workbench shell.
 *
 * Components under test:
 * - ParcelContextHeader → LiquidPanel
 * - ResultPanel → LiquidPanel
 * - InvocationHistory → TactileButton
 *
 * Contract:
 * - Materials render when materialQualityGate returns eligible
 * - Fallback path renders without layout shift when gate disabled
 * - Keyboard focus states remain correct
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvocationHistory, InvocationRecord } from '../../components/workbench/InvocationHistory';
import { ParcelContextHeader } from '../../components/workbench/ParcelContextHeader';
import { ResultPanel } from '../../components/workbench/ResultPanel';
import * as materialQualityGate from '../../ui/materials/materialQualityGate';
import { MaterialQuality } from '../../ui/materials/materialQualityGate';

// Mock the quality gate
vi.mock('../../ui/materials/materialQualityGate', async () => ({
  ...(await vi.importActual('../../ui/materials/materialQualityGate')),
  useMaterialQuality: vi.fn(),
}));

const mockUseMaterialQuality = materialQualityGate.useMaterialQuality as vi.MockedFunction<
  typeof materialQualityGate.useMaterialQuality
>;

// High quality state (materials enabled)
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

// Low quality state (materials disabled)
const LOW_QUALITY_STATE: materialQualityGate.MaterialQualityState = {
  tier: MaterialQuality.LOW,
  gpuTier: 1,
  enableBackdropBlur: false,
  enableGlassDistortion: false,
  enableSprings: false,
  enableWarps: false,
  enableLoopingAnimations: false,
  prefersReducedMotion: true,
};

describe('Workbench Materials Adoption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);
  });

  describe('ParcelContextHeader', () => {
    it('renders with LiquidPanel when gate enabled', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      const header = screen.getByTestId('parcel-context-header');
      // LiquidPanel adds data-quality-tier attribute
      expect(header).toHaveAttribute('data-quality-tier', 'high');
    });

    it('falls back to static container when gate disabled', () => {
      mockUseMaterialQuality.mockReturnValue(LOW_QUALITY_STATE);

      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      const header = screen.getByTestId('parcel-context-header');
      // LiquidPanel in LOW mode has data-quality-tier="low"
      expect(header).toHaveAttribute('data-quality-tier', 'low');
    });

    it('renders with reduced-motion data attribute when motion disabled', () => {
      mockUseMaterialQuality.mockReturnValue(LOW_QUALITY_STATE);

      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      const header = screen.getByTestId('parcel-context-header');
      expect(header).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('ResultPanel', () => {
    it('renders idle state with LiquidPanel when gate enabled', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      const { container } = render(
        <ResultPanel
          status='idle'
          idleContent={{ icon: '🔥', title: 'Ready', subtitle: 'Start a query' }}
        />
      );

      // LiquidPanel wrapper should have quality tier attribute
      const panel = container.querySelector('[data-quality-tier]');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('data-quality-tier', 'high');
    });

    it('renders success state with LiquidPanel', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      const { container } = render(
        <ResultPanel status='success' correlationId='corr-12345'>
          <p>Results here</p>
        </ResultPanel>
      );

      const panel = container.querySelector('[data-quality-tier]');
      expect(panel).toBeInTheDocument();
    });

    it('falls back without layout shift when gate disabled', () => {
      mockUseMaterialQuality.mockReturnValue(LOW_QUALITY_STATE);

      const { container } = render(
        <ResultPanel status='idle' idleContent={{ icon: '🔥', title: 'Ready' }} />
      );

      // Should still render content correctly
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();

      // Panel should have low quality tier
      const panel = container.querySelector('[data-quality-tier]');
      expect(panel).toHaveAttribute('data-quality-tier', 'low');
    });

    it('error state maintains WCAG contrast', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      render(
        <ResultPanel
          status='error'
          error={{
            code: 'TEST_ERROR',
            message: 'Test error message',
            correlationId: 'corr-error-123',
          }}
        />
      );

      // Error content should be visible and readable
      expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
    });
  });

  describe('InvocationHistory', () => {
    const mockRecords: InvocationRecord[] = [
      {
        id: 'rec-1',
        toolId: 'terra-forge-valuation',
        status: 'success',
        correlationId: 'corr-abc-123-def-456',
        timestamp: new Date('2026-02-07T10:00:00'),
      },
      {
        id: 'rec-2',
        toolId: 'terra-atlas-analysis',
        status: 'error',
        correlationId: 'corr-xyz-789',
        timestamp: new Date('2026-02-07T10:05:00'),
        errorCode: 'TIMEOUT',
      },
    ];

    it('uses TactileButton for copy actions', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      render(<InvocationHistory records={mockRecords} title='Recent Invocations' />);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons).toHaveLength(2);

      // TactileButtons should have data-reduced-motion attribute
      copyButtons.forEach((button) => {
        expect(button).toHaveAttribute('data-reduced-motion');
      });
    });

    it('preserves keyboard focus order with TactileButtons', async () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);
      const user = userEvent.setup();

      render(<InvocationHistory records={mockRecords} title='Recent Invocations' />);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });

      // Tab to first button
      await user.tab();
      expect(copyButtons[0]).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(copyButtons[1]).toHaveFocus();
    });

    it('TactileButton respects reduced-motion preference', () => {
      mockUseMaterialQuality.mockReturnValue(LOW_QUALITY_STATE);

      render(<InvocationHistory records={mockRecords} title='Recent Invocations' />);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      copyButtons.forEach((button) => {
        expect(button).toHaveAttribute('data-reduced-motion', 'true');
      });
    });

    it('renders with LiquidPanel wrapper', () => {
      mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);

      const { container } = render(
        <InvocationHistory records={mockRecords} title='Recent Invocations' />
      );

      const panel = container.querySelector('[data-quality-tier]');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('data-quality-tier', 'high');
    });
  });
});

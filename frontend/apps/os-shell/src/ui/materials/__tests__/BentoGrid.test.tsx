/**
 * @fileoverview BentoGrid & BentoCard Component Tests
 *
 * TDD Contract: BentoGrid MUST:
 * 1. Render a CSS Grid container with correct column classes
 * 2. Support auto-fit responsive columns
 * 3. Apply custom gap/padding via CSS custom properties
 * 4. Forward refs, className, and data attributes
 *
 * TDD Contract: BentoCard MUST:
 * 1. Render inside LiquidPanel variant="infrastructure"
 * 2. Apply correct span classes (1x1, 2x1, 1x2, 2x2, full)
 * 3. Render header when title/subtitle/actions provided
 * 4. Apply promote state class when promote=true
 * 5. Apply variant class for content layout
 */

import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('../materialQualityGate', () => ({
  useMaterialQuality: vi.fn().mockReturnValue({
    tier: 'high',
    enableBackdropBlur: true,
    enableGlassDistortion: false,
    enableSprings: true,
    enableWarps: false,
    enableLoopingAnimations: false,
    prefersReducedMotion: false,
  }),
  MaterialQuality: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
}));

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { BentoGrid } from '../BentoGrid';
import { BentoCard } from '../BentoCard';

// ============================================================================
// BentoGrid Tests
// ============================================================================

describe('BentoGrid', () => {
  it('renders with auto-fit columns by default', () => {
    render(<BentoGrid data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('bento-grid');
    expect(grid.className).toContain('bento-grid--auto');
  });

  it('renders with explicit column count', () => {
    render(<BentoGrid columns={3} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('bento-grid--cols-3');
    expect(grid.className).not.toContain('bento-grid--auto');
  });

  it.each([1, 2, 3, 4] as const)('supports %i columns', (cols) => {
    render(<BentoGrid columns={cols} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain(`bento-grid--cols-${cols}`);
  });

  it('applies custom gap and padding via CSS custom properties', () => {
    render(<BentoGrid gap={1.5} padding={2} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--bento-gap')).toBe('1.5rem');
    expect(grid.style.getPropertyValue('--bento-padding')).toBe('2rem');
  });

  it('applies minColumnWidth for auto mode', () => {
    render(<BentoGrid columns="auto" minColumnWidth={320} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--bento-col-min')).toBe('320px');
  });

  it('does not set --bento-col-min for explicit column counts', () => {
    render(<BentoGrid columns={2} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--bento-col-min')).toBe('');
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<BentoGrid ref={ref}>content</BentoGrid>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom className', () => {
    render(<BentoGrid className="my-custom" data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('bento-grid');
    expect(grid.className).toContain('my-custom');
  });

  it('merges custom style', () => {
    render(<BentoGrid style={{ maxHeight: '500px' }} data-testid="grid">content</BentoGrid>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.maxHeight).toBe('500px');
  });

  it('renders children', () => {
    render(
      <BentoGrid>
        <div data-testid="child">Card</div>
      </BentoGrid>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

// ============================================================================
// BentoCard Tests
// ============================================================================

describe('BentoCard', () => {
  describe('Rendering', () => {
    it('renders as BentoCard with bento material identity', () => {
      render(<BentoCard data-testid="card">content</BentoCard>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bento-card');
      expect(card.getAttribute('data-material')).toBe('bento');
    });

    it('renders children in content area', () => {
      render(
        <BentoCard data-testid="card">
          <span data-testid="child">Content</span>
        </BentoCard>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<BentoCard ref={ref}>content</BentoCard>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('merges custom className', () => {
      render(<BentoCard className="my-card" data-testid="card">content</BentoCard>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bento-card');
      expect(card.className).toContain('my-card');
    });
  });

  describe('Span Sizes', () => {
    it('defaults to 1x1 (no span class)', () => {
      render(<BentoCard data-testid="card">content</BentoCard>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bento-card');
      expect(card.className).not.toContain('bento-card--1x1');
    });

    it('applies 2x1 span class', () => {
      render(<BentoCard span="2x1" data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card--2x1');
    });

    it('applies 1x2 span class', () => {
      render(<BentoCard span="1x2" data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card--1x2');
    });

    it('applies 2x2 span class', () => {
      render(<BentoCard span="2x2" data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card--2x2');
    });

    it('applies full span class', () => {
      render(<BentoCard span="full" data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card--full');
    });
  });

  describe('Variants', () => {
    it.each(['stat', 'chart', 'table', 'form', 'map'] as const)(
      'applies %s variant class',
      (variant) => {
        render(<BentoCard variant={variant} data-testid="card">content</BentoCard>);
        expect(screen.getByTestId('card').className).toContain(`bento-card--${variant}`);
      }
    );
  });

  describe('Header', () => {
    it('renders header with title', () => {
      render(<BentoCard title="Total Parcels" data-testid="card">content</BentoCard>);
      expect(screen.getByText('Total Parcels')).toBeInTheDocument();
    });

    it('renders header with subtitle', () => {
      render(
        <BentoCard title="Parcels" subtitle="Benton County" data-testid="card">
          content
        </BentoCard>
      );
      expect(screen.getByText('Benton County')).toBeInTheDocument();
    });

    it('renders header with actions', () => {
      render(
        <BentoCard title="Stats" actions={<button data-testid="action">Refresh</button>} data-testid="card">
          content
        </BentoCard>
      );
      expect(screen.getByTestId('action')).toBeInTheDocument();
    });

    it('does not render header when no title/subtitle/actions', () => {
      const { container } = render(<BentoCard data-testid="card">content</BentoCard>);
      expect(container.querySelector('.bento-card__header')).toBeNull();
    });
  });

  describe('Promote State', () => {
    it('applies promote class when promote=true', () => {
      render(<BentoCard promote data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card--promote');
    });

    it('does not apply promote class by default', () => {
      render(<BentoCard data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).not.toContain('bento-card--promote');
    });
  });

  describe('Material Integration', () => {
    it('has bento material class', () => {
      render(<BentoCard data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card').className).toContain('bento-card');
    });

    it('has bento material identity data attribute', () => {
      render(<BentoCard data-testid="card">content</BentoCard>);
      expect(screen.getByTestId('card')).toHaveAttribute('data-material', 'bento');
    });
  });
});

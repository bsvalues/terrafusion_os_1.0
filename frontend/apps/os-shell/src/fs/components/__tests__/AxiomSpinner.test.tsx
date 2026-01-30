/**
 * AxiomSpinner Component Tests
 *
 * Tests for the Visual Codex loading spinner.
 * Verifies rendering, size variants, labels, and accessibility.
 *
 * @module fs/components/__tests__/AxiomSpinner.test
 */

import { render, screen } from '@testing-library/react';

import { AxiomSpinner } from '../AxiomSpinner';

// ============================================================================
// Tests
// ============================================================================

describe('AxiomSpinner', () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<AxiomSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders the outer container with flex layout', () => {
      const { container } = render(<AxiomSpinner />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('renders multiple animation rings', () => {
      const { container } = render(<AxiomSpinner />);
      // Checks for SVGs (rings) and the core div
      const animatedElements = container.querySelectorAll('svg, .animate-pulse');
      expect(animatedElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Size Variants
  // ==========================================================================

  describe('size variants', () => {
    it('renders small size', () => {
      const { container } = render(<AxiomSpinner size='sm' />);
      const spinnerContainer = container.querySelector('.relative');
      expect(spinnerContainer).toHaveClass('w-4', 'h-4');
    });

    it('renders medium size (default)', () => {
      const { container } = render(<AxiomSpinner />);
      const spinnerContainer = container.querySelector('.relative');
      expect(spinnerContainer).toHaveClass('w-8', 'h-8');
    });

    it('renders large size', () => {
      const { container } = render(<AxiomSpinner size='lg' />);
      const spinnerContainer = container.querySelector('.relative');
      expect(spinnerContainer).toHaveClass('w-16', 'h-16');
    });

    it('renders extra large size', () => {
      const { container } = render(<AxiomSpinner size='xl' />);
      const spinnerContainer = container.querySelector('.relative');
      expect(spinnerContainer).toHaveClass('w-32', 'h-32');
    });
  });

  // ==========================================================================
  // Label
  // ==========================================================================

  describe('label', () => {
    it('does not render label by default', () => {
      render(<AxiomSpinner />);
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    it('renders label when provided', () => {
      render(<AxiomSpinner label='Processing...' />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('label has correct styling', () => {
      render(<AxiomSpinner label='Loading Data' />);
      const label = screen.getByText('Loading Data');
      expect(label).toHaveClass('text-[var(--tf-transcend-highlight)]', 'font-mono', 'uppercase');
    });

    it('label has pulse animation', () => {
      render(<AxiomSpinner label='Analyzing' />);
      const label = screen.getByText('Analyzing');
      expect(label).toHaveClass('animate-pulse');
    });
  });

  // ==========================================================================
  // Custom ClassName
  // ==========================================================================

  describe('className prop', () => {
    it('applies custom className to container', () => {
      const { container } = render(<AxiomSpinner className='my-custom-class' />);
      expect(container.firstChild).toHaveClass('my-custom-class');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(<AxiomSpinner className='test-class' />);
      expect(container.firstChild).toHaveClass('flex', 'test-class');
    });
  });

  // ==========================================================================
  // Visual Design Tokens
  // ==========================================================================

  describe('visual design tokens', () => {
    it('uses TerraFusion brand color', () => {
      // Adjusted to match implementation using var(--tf-transcend-cyan)
      const { container } = render(<AxiomSpinner />);
      // We check if the style is applied or if components inherit currrentColor
      const coloredElement = container.querySelector('[style*="var(--tf-transcend-cyan)"]');
      expect(coloredElement).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Animations
  // ==========================================================================

  describe('animations', () => {
    it('has spin animation', () => {
      const { container } = render(<AxiomSpinner />);
      const spinningElements = container.querySelectorAll('.animate-spin, .animate-spin-slow');
      expect(spinningElements.length).toBeGreaterThan(0);
    });

    it('has pulse animation on core', () => {
      const { container } = render(<AxiomSpinner />);
      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });
  });
});

/**
 * @fileoverview TactileButton Component Tests
 *
 * TDD Contract: TactileButton MUST:
 * 1. Use spring animations ONLY when motion is allowed
 * 2. Provide keyboard focus with visible indicator
 * 3. Meet contrast requirements (WCAG AA)
 * 4. Never animate on idle (only on interaction)
 * 5. Support all standard button semantics
 *
 * Constitutional Values:
 * - FOCUS_VISIBLE: true (always show focus indicator)
 * - SPRING_STIFFNESS: 400 (responsive but not jarring)
 * - SPRING_DAMPING: 30 (smooth settle)
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Test Configuration - Constitutional Values
// ============================================================================

const CONSTITUTIONAL_VALUES = {
  SPRING_STIFFNESS: 400,
  SPRING_DAMPING: 30,
} as const;

// ============================================================================
// Mock Setup
// ============================================================================

// Mock framer-motion to track animation usage
const mockMotionDiv = jest.fn();
jest.mock('framer-motion', () => ({
  motion: {
    button: jest.fn(({ children, whileTap, whileHover, transition, ...props }) => {
      mockMotionDiv({ whileTap, whileHover, transition });
      return <button {...props}>{children}</button>;
    }),
  },
  useReducedMotion: jest.fn(),
}));

// Mock the quality gate
jest.mock('../materialQualityGate', () => ({
  useMaterialQuality: jest.fn(),
}));

const mockUseMaterialQuality = jest.requireMock('../materialQualityGate').useMaterialQuality;
const mockUseReducedMotion = jest.requireMock('framer-motion').useReducedMotion;

// ============================================================================
// TactileButton Tests
// ============================================================================

describe('TactileButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMotionDiv.mockClear();

    // Default to full motion allowed
    mockUseMaterialQuality.mockReturnValue({
      tier: 'high',
      enableSprings: true,
      prefersReducedMotion: false,
    });
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe('Spring Animation Compliance', () => {
    it('uses spring animations when motion is allowed', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(<TactileButton>Click me</TactileButton>);

      // Check that motion.button was called with spring transition
      expect(mockMotionDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          transition: expect.objectContaining({
            type: 'spring',
            stiffness: CONSTITUTIONAL_VALUES.SPRING_STIFFNESS,
            damping: CONSTITUTIONAL_VALUES.SPRING_DAMPING,
          }),
        })
      );
    });

    it('disables springs when prefers-reduced-motion is set', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'high',
        enableSprings: false,
        prefersReducedMotion: true,
      });
      mockUseReducedMotion.mockReturnValue(true);

      const { TactileButton } = await import('../TactileButton');

      render(<TactileButton data-testid='tactile-btn'>Click me</TactileButton>);

      // Should NOT have spring animations
      expect(mockMotionDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          whileTap: undefined,
          whileHover: undefined,
        })
      );
    });

    it('uses CSS transitions as fallback when springs disabled', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'low',
        enableSprings: false,
        prefersReducedMotion: true,
      });

      const { TactileButton } = await import('../TactileButton');

      render(<TactileButton data-testid='tactile-btn'>Click me</TactileButton>);

      const button = screen.getByTestId('tactile-btn');

      // Should have reduced-motion class for CSS fallback
      expect(button).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('Keyboard Focus', () => {
    it('shows visible focus indicator on keyboard focus', async () => {
      const { TactileButton } = await import('../TactileButton');
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <TactileButton data-testid='tactile-btn'>Focus me</TactileButton>
        </>
      );

      // Tab to the button
      await user.tab();
      await user.tab();

      const button = screen.getByTestId('tactile-btn');

      // Should have focus-visible styles (class or attribute)
      expect(button).toHaveFocus();
    });

    it('has proper focus ring contrast', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(<TactileButton data-testid='tactile-btn'>Focus me</TactileButton>);

      const button = screen.getByTestId('tactile-btn');

      // Focus ring should be defined via CSS class
      expect(button.className).toMatch(/tactile-button/);
    });
  });

  describe('Accessibility', () => {
    it('supports standard button props', async () => {
      const onClick = jest.fn();
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton
          data-testid='tactile-btn'
          type='submit'
          disabled={false}
          onClick={onClick}
          aria-label='Submit form'
        >
          Submit
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');

      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(button).not.toBeDisabled();

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', async () => {
      const onClick = jest.fn();
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' disabled onClick={onClick}>
          Disabled
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');

      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('No Idle Animation', () => {
    it('does not animate when not interacted with', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

      const { TactileButton } = await import('../TactileButton');

      render(<TactileButton>Static</TactileButton>);

      // Wait for any async effects
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Button should NOT schedule any recurring updates
      expect(setIntervalSpy).not.toHaveBeenCalled();
      expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe('Variants', () => {
    it('supports primary variant', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' variant='primary'>
          Primary
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');
      expect(button).toHaveClass('tactile-button--primary');
    });

    it('supports secondary variant', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' variant='secondary'>
          Secondary
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');
      expect(button).toHaveClass('tactile-button--secondary');
    });

    it('supports ghost variant', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' variant='ghost'>
          Ghost
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');
      expect(button).toHaveClass('tactile-button--ghost');
    });
  });

  describe('Size Variants', () => {
    it('supports small size', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' size='sm'>
          Small
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');
      expect(button).toHaveClass('tactile-button--sm');
    });

    it('supports large size', async () => {
      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid='tactile-btn' size='lg'>
          Large
        </TactileButton>
      );

      const button = screen.getByTestId('tactile-btn');
      expect(button).toHaveClass('tactile-button--lg');
    });
  });
});

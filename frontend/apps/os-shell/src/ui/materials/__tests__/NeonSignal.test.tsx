/**
 * NeonSignal Component Tests
 *
 * Validates the semantic status indicator renders correct classes,
 * roles, and variants for the Neon-as-Signal system.
 *
 * @module NeonSignal.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

/* ── Jest mock: framer-motion passthrough ─────────────────────── */
jest.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_t, prop) => React.forwardRef((p: Record<string, unknown>, ref) => React.createElement(prop as string, { ...p, ref })) }),
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

import { NeonSignal } from '../NeonSignal';

// ============================================================================
// Rendering
// ============================================================================

describe('NeonSignal', () => {
  it('renders with role="status"', () => {
    render(<NeonSignal status='healthy'>OK</NeonSignal>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders children text', () => {
    render(<NeonSignal status='healthy'>SENTINEL Healthy</NeonSignal>);
    expect(screen.getByText(/SENTINEL Healthy/)).toBeInTheDocument();
  });

  it('applies the correct status class', () => {
    const { container } = render(<NeonSignal status='degraded'>WARN</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('neon-signal--degraded')).toBe(true);
  });

  it('applies size class', () => {
    const { container } = render(<NeonSignal status='down' size='xs'>ERR</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('neon-signal--xs')).toBe(true);
  });

  it('applies pulse class when pulse=true', () => {
    const { container } = render(<NeonSignal status='active' pulse>AUDIT</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('neon-signal--pulse')).toBe(true);
  });

  it('does not apply pulse class by default', () => {
    const { container } = render(<NeonSignal status='healthy'>OK</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('neon-signal--pulse')).toBe(false);
  });

  it('renders the dot indicator', () => {
    const { container } = render(<NeonSignal status='locked'>LOCKED</NeonSignal>);
    const dot = container.querySelector('.neon-signal__dot');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
  });

  it('supports className prop', () => {
    const { container } = render(<NeonSignal status='healthy' className='custom-class'>OK</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('custom-class')).toBe(true);
  });

  it('supports aria-label override', () => {
    render(<NeonSignal status='healthy' aria-label='System is healthy'>OK</NeonSignal>);
    expect(screen.getByLabelText('System is healthy')).toBeInTheDocument();
  });

  it('defaults to sm size', () => {
    const { container } = render(<NeonSignal status='healthy'>OK</NeonSignal>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('neon-signal--sm')).toBe(true);
  });
});

// ============================================================================
// All 5 status variants
// ============================================================================

describe('NeonSignal status variants', () => {
  const statuses = ['healthy', 'degraded', 'down', 'active', 'locked'] as const;

  statuses.forEach((status) => {
    it(`renders ${status} variant correctly`, () => {
      const { container } = render(
        <NeonSignal status={status}>{status.toUpperCase()}</NeonSignal>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains(`neon-signal--${status}`)).toBe(true);
    });
  });
});

// ============================================================================
// All 3 size variants
// ============================================================================

describe('NeonSignal size variants', () => {
  const sizes = ['xs', 'sm', 'md'] as const;

  sizes.forEach((size) => {
    it(`applies ${size} size class`, () => {
      const { container } = render(
        <NeonSignal status='healthy' size={size}>OK</NeonSignal>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains(`neon-signal--${size}`)).toBe(true);
    });
  });
});

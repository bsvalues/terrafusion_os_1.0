import { vi, describe, test, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LatticeNodeLayout, SovereignObject } from '../../types';
import { GlassVoxel } from '../GlassVoxel';

const MOCK_OBJECT: SovereignObject = {
  id: 'test-1',
  label: 'Test Node',
  type: 'document',
  status: 'verified',
  relations: [],
  tags: [],
};

const MOCK_LAYOUT: LatticeNodeLayout = {
  id: 'test-1',
  x: 100,
  y: 100,
  z: 0,
  ring: 0,
  scale: 1.0,
  opacity: 1.0,
  blurPx: 0,
  zIndex: 100,
  width: 'var(--tf-voxel-size)',
  height: 'var(--tf-voxel-size)',
};

describe('GlassVoxel', () => {
  test('renders label correctly', () => {
    render(<GlassVoxel object={MOCK_OBJECT} layout={MOCK_LAYOUT} onSelect={() => {}} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('button has correct aria-label', () => {
    render(<GlassVoxel object={MOCK_OBJECT} layout={MOCK_LAYOUT} onSelect={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test Node (document, verified)');
  });

  test('verified status uses success token class', () => {
    render(<GlassVoxel object={MOCK_OBJECT} layout={MOCK_LAYOUT} onSelect={() => {}} />);
    // The icon container should have the success green text class
    const iconContainer = screen.getByText('T').parentElement;
    expect(iconContainer?.className).toContain('text-[var(--tf-success-green)]');
  });

  test('uses layout props from engine output', () => {
    const blurredLayout = { ...MOCK_LAYOUT, blurPx: 5 };
    render(<GlassVoxel object={MOCK_OBJECT} layout={blurredLayout} onSelect={() => {}} />);
    const button = screen.getByRole('button');
    // Framer motion applies styles inline
    expect(button.style.filter).toContain('blur(5px)');
    expect(button.style.zIndex).toBe('100');
    expect(button.style.width).toBe('var(--tf-voxel-size)');
  });

  test('focus ring is present', () => {
    const { container } = render(
      <GlassVoxel object={MOCK_OBJECT} layout={MOCK_LAYOUT} onSelect={() => {}} />
    );
    // Check for the div with class tf-focus-ring
    const focusRing = container.querySelector('.tf-focus-ring');
    expect(focusRing).toBeInTheDocument();
  });

  test('click calls onSelect(id)', () => {
    const handleSelect = vi.fn();
    render(<GlassVoxel object={MOCK_OBJECT} layout={MOCK_LAYOUT} onSelect={handleSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalledWith('test-1');
  });
});

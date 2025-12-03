/**
 * OSGlassPanel Tests
 *
 * Tests for the universal glass container primitive.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { OSGlassPanel } from '../OSGlassPanel';

describe('OSGlassPanel', () => {
  test('renders children inside a glass panel', () => {
    render(
      <OSGlassPanel testId='glass'>
        <div>content</div>
      </OSGlassPanel>
    );

    const el = screen.getByTestId('glass');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('content');
  });

  test('uses default testId when not provided', () => {
    render(
      <OSGlassPanel>
        <span>default</span>
      </OSGlassPanel>
    );

    expect(screen.getByTestId('os-glass-panel')).toBeInTheDocument();
  });

  test('applies custom padding', () => {
    render(
      <OSGlassPanel padding={24} testId='padded'>
        <div>padded content</div>
      </OSGlassPanel>
    );

    const el = screen.getByTestId('padded');
    expect(el).toHaveStyle({ padding: '24px' });
  });

  test('applies fullHeight style when enabled', () => {
    render(
      <OSGlassPanel fullHeight testId='full'>
        <div>full height</div>
      </OSGlassPanel>
    );

    const el = screen.getByTestId('full');
    expect(el).toHaveStyle({ height: '100%' });
  });

  test('merges custom styles', () => {
    render(
      <OSGlassPanel style={{ marginTop: 20 }} testId='styled'>
        <div>styled</div>
      </OSGlassPanel>
    );

    const el = screen.getByTestId('styled');
    expect(el).toHaveStyle({ marginTop: '20px' });
  });

  test('applies glass styling (background, backdrop-filter)', () => {
    render(
      <OSGlassPanel testId='glass-style'>
        <div>glass</div>
      </OSGlassPanel>
    );

    const el = screen.getByTestId('glass-style');
    // Check that glass-related styles are applied
    expect(el).toHaveStyle({ background: 'rgba(20, 20, 20, 0.35)' });
    expect(el).toHaveStyle({ borderRadius: '12px' });
  });
});

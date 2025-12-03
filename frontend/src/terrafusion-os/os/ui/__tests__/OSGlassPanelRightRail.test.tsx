/**
 * OSGlassPanelRightRail Tests
 *
 * Tests for the right-rail glass panel variant.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { OSGlassPanelRightRail } from '../OSGlassPanelRightRail';

describe('OSGlassPanelRightRail', () => {
  test('renders right-rail panel with children', () => {
    render(
      <OSGlassPanelRightRail testId='rr'>
        <span>Hi</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('rr');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('Hi');
  });

  test('uses default testId when not provided', () => {
    render(
      <OSGlassPanelRightRail>
        <span>default</span>
      </OSGlassPanelRightRail>
    );

    expect(screen.getByTestId('os-glass-panel-right-rail')).toBeInTheDocument();
  });

  test('applies default width of 360px', () => {
    render(
      <OSGlassPanelRightRail testId='default-width'>
        <span>content</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('default-width');
    expect(el).toHaveStyle({ width: '360px' });
  });

  test('applies custom width', () => {
    render(
      <OSGlassPanelRightRail width={400} testId='custom-width'>
        <span>content</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('custom-width');
    expect(el).toHaveStyle({ width: '400px' });
  });

  test('applies custom padding', () => {
    render(
      <OSGlassPanelRightRail padding={24} testId='custom-padding'>
        <span>content</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('custom-padding');
    expect(el).toHaveStyle({ padding: '24px' });
  });

  test('has full height and flex column layout', () => {
    render(
      <OSGlassPanelRightRail testId='layout'>
        <span>content</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('layout');
    expect(el).toHaveStyle({ height: '100%' });
    expect(el).toHaveStyle({ display: 'flex' });
    expect(el).toHaveStyle({ flexDirection: 'column' });
  });

  test('applies glass styling with left border', () => {
    render(
      <OSGlassPanelRightRail testId='glass-style'>
        <span>glass</span>
      </OSGlassPanelRightRail>
    );

    const el = screen.getByTestId('glass-style');
    expect(el).toHaveStyle({ background: 'rgba(20, 20, 20, 0.35)' });
    expect(el).toHaveStyle({ borderLeft: '1px solid rgba(255, 255, 255, 0.08)' });
  });
});

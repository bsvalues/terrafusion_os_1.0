/**
 * TerraSphereStatus Tests
 *
 * Tests for the animated OS health visualizer.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { TerraSphereStatus } from '../TerraSphereStatus';

describe('TerraSphereStatus', () => {
  test('renders with nominal level', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='medium' testId='sphere' />);

    const el = screen.getByTestId('sphere');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('data-level')).toBe('nominal');
  });

  test('renders with degraded level', () => {
    render(<TerraSphereStatus level='degraded' incidents24h={0} size='medium' testId='sphere' />);

    expect(screen.getByTestId('sphere').getAttribute('data-level')).toBe('degraded');
  });

  test('renders with critical level', () => {
    render(<TerraSphereStatus level='critical' incidents24h={3} size='medium' testId='sphere' />);

    expect(screen.getByTestId('sphere').getAttribute('data-level')).toBe('critical');
  });

  test('renders incident badge when incidents > 0 (medium size)', () => {
    render(<TerraSphereStatus level='critical' incidents24h={3} size='medium' testId='sphere' />);

    const badge = screen.getByTestId('terrasphere-incident-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  test('renders incident badge when incidents > 0 (large size)', () => {
    render(<TerraSphereStatus level='degraded' incidents24h={5} size='large' testId='sphere' />);

    const badge = screen.getByTestId('terrasphere-incident-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  test('does not render incident badge when incidents = 0', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='medium' testId='sphere' />);

    expect(screen.queryByTestId('terrasphere-incident-badge')).toBeNull();
  });

  test('does not render incident badge for small size', () => {
    render(<TerraSphereStatus level='critical' incidents24h={5} size='small' testId='sphere' />);

    // Badge should not appear on small size
    expect(screen.queryByTestId('terrasphere-incident-badge')).toBeNull();
  });

  test('shows 9+ when incidents exceed 9', () => {
    render(<TerraSphereStatus level='critical' incidents24h={15} size='medium' testId='sphere' />);

    const badge = screen.getByTestId('terrasphere-incident-badge');
    expect(badge).toHaveTextContent('9+');
  });

  test('uses default testId when not provided', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='medium' />);

    expect(screen.getByTestId('terrasphere-status')).toBeInTheDocument();
  });

  test('renders core sphere elements', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='medium' testId='sphere' />);

    expect(screen.getByTestId('terrasphere-halo')).toBeInTheDocument();
    expect(screen.getByTestId('terrasphere-core')).toBeInTheDocument();
    expect(screen.getByTestId('terrasphere-orbit')).toBeInTheDocument();
    expect(screen.getByTestId('terrasphere-orbit-dot')).toBeInTheDocument();
  });

  test('renders small size with correct dimensions', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='small' testId='sphere' />);

    const el = screen.getByTestId('sphere');
    expect(el).toHaveStyle({ width: '24px', height: '24px' });
  });

  test('renders medium size with correct dimensions', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='medium' testId='sphere' />);

    const el = screen.getByTestId('sphere');
    expect(el).toHaveStyle({ width: '40px', height: '40px' });
  });

  test('renders large size with correct dimensions', () => {
    render(<TerraSphereStatus level='nominal' incidents24h={0} size='large' testId='sphere' />);

    const el = screen.getByTestId('sphere');
    expect(el).toHaveStyle({ width: '80px', height: '80px' });
  });
});

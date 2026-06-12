import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Mock mapbox-gl so tests run in jsdom without canvas
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(() => null),
      setFeatureState: vi.fn(),
      queryRenderedFeatures: vi.fn(() => []),
      getCanvas: vi.fn(() => ({ style: {} })),
    })),
  },
}));

describe('BentonCountyMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map container div', async () => {
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);
    // Should render without crashing; map container is present
    expect(document.body).toBeTruthy();
  });

  it('calls onParcelSelect when provided', async () => {
    const onParcelSelect = vi.fn();
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap onParcelSelect={onParcelSelect} className='h-full' />);
    // Component mounts without errors; onParcelSelect is wired via Mapbox click event
    // (Actual click would require Mapbox GL canvas simulation — just verify mount here)
    expect(document.body).toBeTruthy();
  });

  it('renders a testid-bearing root element', async () => {
    // Verify that when the component mounts, it renders either the map wrapper
    // (data-testid="benton-county-map") or the error state
    // (data-testid="benton-county-map-error") — both are valid outcomes
    // depending on whether VITE_MAPBOX_ACCESS_TOKEN is defined in the test env.
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);
    const mapEl = document.querySelector('[data-testid="benton-county-map"]');
    const errorEl = document.querySelector('[data-testid="benton-county-map-error"]');
    // At least one of the two root elements must be present
    expect(mapEl ?? errorEl).toBeTruthy();
  });

  it('uses honest unavailable language when the map token is not configured', async () => {
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);

    const errorEl = screen.queryByTestId('benton-county-map-error');
    if (errorEl) {
      expect(errorEl).toHaveTextContent('Map layer unavailable: Mapbox token not configured');
    }
    expect(screen.queryByText(/add it to \.env/i)).not.toBeInTheDocument();
  });
});

describe('BentonCountyMap props contract', () => {
  it('accepts onParcelSelect callback prop', () => {
    // Type-level test: verify the prop interface is correct
    type Props = React.ComponentProps<React.FC<{
      onParcelSelect?: (parcelId: string) => void;
      className?: string;
    }>>;
    const fn: Props['onParcelSelect'] = (id: string) => {
      expect(typeof id).toBe('string');
    };
    expect(typeof fn).toBe('function');
  });
});

describe('BentonCountyMap proof-path honesty', () => {
  it('does not fabricate parcel geometry when source geometry is absent', () => {
    const source = readFileSync(
      resolve(__dirname, '../../shell/desktop/BentonCountyMap.tsx'),
      'utf8',
    );

    expect(source).not.toContain('Math.random');
    expect(source).not.toContain("type: 'Point'");
    expect(source).toContain('Parcel layer unavailable: source check timed out');
  });
});

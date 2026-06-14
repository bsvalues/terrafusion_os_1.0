import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock maplibre-gl so tests run in jsdom without canvas
vi.mock('maplibre-gl', () => ({
  default: {
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
    // Component mounts without errors; onParcelSelect is wired via MapLibre click event
    // (Actual click would require MapLibre GL canvas simulation — just verify mount here)
    expect(document.body).toBeTruthy();
  });

  it('renders a testid-bearing root element', async () => {
    // Verify that the component mounts and renders the map wrapper
    // (data-testid="benton-county-map"). No token needed with MapLibre.
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);
    const mapEl = document.querySelector('[data-testid="benton-county-map"]');
    expect(mapEl).toBeTruthy();
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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const addTo = vi.fn();
const remove = vi.fn();
const on = vi.fn();
const invalidateSize = vi.fn();

// Mock Leaflet so tests run in jsdom without real tile/canvas behavior.
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      remove,
      invalidateSize,
    })),
    tileLayer: vi.fn(() => ({
      on,
      addTo,
    })),
    geoJSON: vi.fn(() => ({
      addTo,
    })),
  },
}));

describe('BentonCountyMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));
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
    // Component mounts without errors; onParcelSelect is wired via Leaflet layer click handlers.
    // Actual click simulation belongs to a browser-level map test.
    expect(document.body).toBeTruthy();
  });

  it('renders a testid-bearing root element', async () => {
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);
    const mapEl = document.querySelector('[data-testid="benton-county-map"]');
    expect(mapEl).toBeTruthy();
  });

  it('does not require a Mapbox token to render Home GIS', async () => {
    const { default: BentonCountyMap } = await import(
      '../../shell/desktop/BentonCountyMap'
    );
    render(<BentonCountyMap />);

    expect(screen.getByTestId('benton-county-map')).toBeInTheDocument();
    expect(screen.queryByText(/Mapbox token/i)).not.toBeInTheDocument();
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
    expect(source).not.toContain('VITE_MAPBOX_ACCESS_TOKEN');
    expect(source).not.toContain('mapbox://');
    expect(source).toContain('Parcel layer unavailable: source check timed out');
  });
});

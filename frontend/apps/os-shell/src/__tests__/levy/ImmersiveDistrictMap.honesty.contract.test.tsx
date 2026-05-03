/**
 * Immersive district map honesty contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const getBentonTaxingDistrictsMock = vi.fn();

vi.mock('../../services/levyService', () => ({
  getBentonTaxingDistricts: () => getBentonTaxingDistrictsMock(),
}));

import ImmersiveDistrictMap from '../../pages/levy/Map/ImmersiveDistrictMap';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ImmersiveDistrictMap honesty contract', () => {
  it('renders governed unavailable map posture while loading live Benton metadata', () => {
    getBentonTaxingDistrictsMock.mockReturnValue(new Promise(() => {}));

    render(<ImmersiveDistrictMap />);

    expect(screen.getByTestId('immersive-district-map-unavailable')).toHaveTextContent(
      'District boundary map unavailable.',
    );
    expect(screen.getByText(/Loading Benton district registry/i)).toBeInTheDocument();
  });

  it('loads live Benton district registry details without rendering demo polygons', async () => {
    getBentonTaxingDistrictsMock.mockResolvedValue({
      source: 'Benton County levy district registry',
      fiscalYear: '2026',
      count: 2,
      districts: [
        {
          code: 'FD-001',
          name: 'Benton Fire District 1',
          type: 'Fire',
          statutoryLimitPerThousand: 1.5,
          rcwReference: 'RCW 52.16.160',
          isVoted: false,
        },
        {
          code: 'SD-400',
          name: 'Benton School District 400',
          type: 'School',
          statutoryLimitPerThousand: 2.5,
          rcwReference: 'RCW 84.52.0531',
          isVoted: true,
        },
      ],
    });

    render(<ImmersiveDistrictMap />);

    await waitFor(() => {
      expect(screen.getByText(/Live Benton district registry loaded: 2 districts\./i)).toBeInTheDocument();
      expect(screen.getByText('Benton Fire District 1')).toBeInTheDocument();
      expect(screen.getByText('Benton School District 400')).toBeInTheDocument();
    });

    expect(screen.getByTestId('immersive-district-map-unavailable')).toHaveTextContent(
      'Demo polygons are not rendered here.',
    );
  });
});

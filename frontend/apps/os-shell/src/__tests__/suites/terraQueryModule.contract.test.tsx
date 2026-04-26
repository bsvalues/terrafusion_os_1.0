import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraQueryModule from '../../pages/suites/modules/TerraQueryModule';

const mockExecuteTerraQuerySearch = vi.fn();

vi.mock('@/services/atlasService', () => ({
  atlasService: {
    executeTerraQuerySearch: (...args: unknown[]) => mockExecuteTerraQuerySearch(...args),
  },
}));

describe('TerraQueryModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteTerraQuerySearch.mockResolvedValue({
      criteria: { zoning: 'R1', limit: 25 },
      whereClause: "ZONE_CODE = 'R1'",
      queryUrl: 'https://example.test/arcgis/query',
      rowCount: 2,
      source: 'Benton County ArcGIS parcel layer',
      records: [
        {
          parcelId: '104841000017400',
          address: '5501 W Canal Dr',
          ownerName: 'BENTON OWNER ONE',
          propertyType: 'Residential',
          assessedValue: 892000,
          landValue: 245000,
          improvementValue: 647000,
          acreage: 0.412,
          source: 'Benton County ArcGIS parcel layer',
        },
        {
          parcelId: '104841000031200',
          address: '2801 W 27th Ave',
          ownerName: 'BENTON OWNER TWO',
          propertyType: 'Residential',
          assessedValue: 745000,
          landValue: 210000,
          improvementValue: 535000,
          acreage: 0.335,
          source: 'Benton County ArcGIS parcel layer',
        },
      ],
    });
  });

  it('renders governed live-query strip', () => {
    render(<TerraQueryModule />);

    expect(screen.getByTestId('terraquery-governed-brief')).toBeInTheDocument();
    // The brief now phrases the SQL-mock removal as "Offline SQL editors and
    // simulated result timers are not part of this lane." — match the new copy.
    expect(
      screen.getByText(/offline sql editors and simulated result timers are not part of this lane/i),
    ).toBeInTheDocument();
  });

  it('runs a live Benton recipe and shows routing guidance from real rows', async () => {
    render(<TerraQueryModule />);

    fireEvent.click(screen.getByRole('button', { name: /R1 Zoning Slice/i }));

    await waitFor(() => {
      expect(screen.getByText(/This zoning slice returned 2 live Benton parcels under R1\./i)).toBeInTheDocument();
      expect(
        screen.getByText(/Keep the analysis in TerraAtlas until boundary and overlay facts are verified/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/ZONE_CODE = 'R1'/i)).toBeInTheDocument();
      expect(screen.getByText(/5501 W Canal Dr/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$892,000/i)).toHaveLength(2);
    });
  });
});

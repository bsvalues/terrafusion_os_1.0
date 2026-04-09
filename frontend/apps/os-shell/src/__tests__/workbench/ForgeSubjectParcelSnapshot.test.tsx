import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: '101843040000010',
    propertyData: {
      parcelId: '101843040000010',
      address: '123 Main St',
      owner: 'Jane Owner',
      assessedValue: 333530,
      marketValue: 360000,
      landValue: 90000,
      improvementValue: 243530,
      propertyType: 'residential',
      legalDescription: 'Lot 7 Block 2',
      source: 'live',
    },
    workMode: 'overview',
  }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (state: any) => any) =>
    selector({
      activeParcel: {
        parcelId: '101843040000010',
        countyCode: 'benton',
        address: '123 Main St',
        city: 'Kennewick',
        state: 'WA',
        zip: '99336',
        legalDescription: 'Lot 7 Block 2',
        neighborhood: '13171',
        zoning: 'RS-12',
        ownerName: 'Jane Owner',
        propertyType: 'residential',
        propertyUseCode: 'R1',
        landUseDescription: 'Single Family',
        landAcreage: 0.24,
        yearBuilt: 1998,
        buildingSquareFeet: 1842,
        bedrooms: 3,
        bathrooms: 2,
        landValue: 90000,
        improvementValue: 243530,
        totalAssessedValue: 333530,
        marketValue: 360000,
        taxableValue: 321530,
        exemptionAmount: 12000,
        assessmentStatus: 'active',
        assessmentYear: 2026,
        assessmentDate: '2026-01-01',
        lastUpdated: '2026-04-06',
        lastSaleDate: '2024-05-10',
        lastSalePrice: 325000,
        hasActivePermits: true,
        hasAppeals: true,
        taxDistrictCode: 'TA-12',
        taxDistrictName: 'Kennewick',
        dataSource: 'harris-pacs-live',
      },
      appeals: [{ appealId: 'APL-1' }],
    })
  ),
}));

import { ForgeSubjectParcelSnapshot } from '../../pages/workbench/tabs/forge/ForgeSubjectParcelSnapshot';

describe('ForgeSubjectParcelSnapshot', () => {
  it('renders parcel valuation and classification context', () => {
    render(<ForgeSubjectParcelSnapshot />);

    expect(screen.getByTestId('forge-subject-parcel')).toBeInTheDocument();
    expect(screen.getByText('Subject Parcel')).toBeInTheDocument();
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('13171')).toBeInTheDocument();
    expect(screen.getByText('Kennewick (TA-12)')).toBeInTheDocument();
    expect(screen.getByText('$333,530')).toBeInTheDocument();
    expect(screen.getByText('$360,000')).toBeInTheDocument();
    expect(screen.getByText('1 appeal on record')).toBeInTheDocument();
    expect(screen.getByText('Active permits')).toBeInTheDocument();
  });
});

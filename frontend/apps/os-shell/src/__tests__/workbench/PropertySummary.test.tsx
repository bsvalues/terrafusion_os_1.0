/**
 * PropertySummary.test.tsx
 * Phase 5 — Wave 3B proof: Summary tab shows real parcel data from store/context
 */
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkbenchTabCtx } from '../../context/workbenchTabContext';
import PropertySummary from '../../pages/workbench/tabs/PropertySummary';

const { buildPropertyStoreState, propertyStoreState } = vi.hoisted(() => {
  const buildPropertyStoreState = () => ({
    activeParcel: {
      parcelId: 'SUMMARY-TEST-001',
      address: '123 Real Data St',
      city: 'Kennewick',
      zip: '99336',
      yearBuilt: 1985,
      buildingSquareFeet: 1800,
      landAcreage: 0.25,
      assessmentYear: 2026,
      assessmentStatus: 'certified',
      landUseDescription: 'Single Family Residential',
      exemptionAmount: 15000,
      exemptionTypes: ['Senior/Disabled'],
      hasAppeals: true,
      hasActivePermits: false,
      lastSaleDate: '2021-06-15T00:00:00Z',
      lastSalePrice: 285000,
      taxDistrictName: 'Benton County',
      taxDistrictCode: 'BC-001',
    },
    assessments: [
      {
        assessmentId: 'ASMT-2026',
        assessmentYear: 2026,
        landValue: 80000,
        improvementValue: 170000,
        totalAssessedValue: 250000,
        marketValue: 265000,
        taxableValue: 235000,
      },
      {
        assessmentId: 'ASMT-2025',
        assessmentYear: 2025,
        landValue: 75000,
        improvementValue: 160000,
        totalAssessedValue: 235000,
        marketValue: 248000,
        taxableValue: 220000,
      },
    ],
    appeals: [{ appealId: 'APP-001', status: 'pending' }],
  });

  return {
    buildPropertyStoreState,
    propertyStoreState: buildPropertyStoreState(),
  };
});

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: {
    activeParcel: {
      parcelId: string; address: string; city: string; zip: string;
      yearBuilt: number; buildingSquareFeet: number; landAcreage: number;
      assessmentYear: number; assessmentStatus: string; landUseDescription: string;
      exemptionAmount: number; exemptionTypes: string[]; hasAppeals: boolean;
      hasActivePermits: boolean; lastSaleDate: string; lastSalePrice: number;
      taxDistrictName: string; taxDistrictCode: string;
    };
    assessments: Array<{
      assessmentId: string; assessmentYear: number; landValue: number;
      improvementValue: number; totalAssessedValue: number; marketValue: number; taxableValue: number;
    }>;
    appeals: Array<{ appealId: string; status: string }>;
  }) => unknown) => {
    return typeof selector === 'function' ? selector(propertyStoreState) : propertyStoreState;
  },
}));

const PARCEL_CTX = {
  parcelId: 'SUMMARY-TEST-001',
  propertyData: {
    parcelId: 'SUMMARY-TEST-001',
    address: '123 Real Data St',
    owner: 'Jane Assessor',
    assessedValue: 250000,
    marketValue: 265000,
    landValue: 80000,
    improvementValue: 170000,
    propertyType: 'residential',
    legalDescription: 'LOT 5 BLOCK 2 REAL DATA PLAT',
    source: 'PACS',
  },
  workMode: 'overview' as const,
};

const Wrapper: React.FC = () => (
  <MemoryRouter>
    <WorkbenchTabCtx.Provider value={PARCEL_CTX}>
      <PropertySummary />
    </WorkbenchTabCtx.Provider>
  </MemoryRouter>
);

describe('PropertySummary — Phase 5 honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(propertyStoreState, buildPropertyStoreState());
  });

  describe('Identity data', () => {
    it('renders parcel ID from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/SUMMARY-TEST-001/).length).toBeGreaterThan(0);
    });

    it('renders owner name from context', () => {
      render(<Wrapper />);
      expect(screen.getByText(/Jane Assessor/)).toBeInTheDocument();
    });

    it('renders address from context', () => {
      render(<Wrapper />);
      expect(screen.getByText(/123 Real Data St/)).toBeInTheDocument();
    });

    it('renders property type from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/Residential/i).length).toBeGreaterThan(0);
    });
  });

  describe('Valuation data', () => {
    it('renders market value from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/265,000/).length).toBeGreaterThan(0);
    });

    it('renders assessed value from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/250,000/).length).toBeGreaterThan(0);
    });

    it('renders land value from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/80,000/).length).toBeGreaterThan(0);
    });

    it('renders improvement value from context', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/170,000/).length).toBeGreaterThan(0);
    });

    it('discloses the assessment-year snapshot framing for displayed valuation amounts', () => {
      render(<Wrapper />);
      expect(screen.getByText(/Valuation Snapshot/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Displayed values reflect the loaded parcel summary for assessment year 2026\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This route does not show a more precise as-of timestamp than that assessment year\. Source: PACS\./i)
      ).toBeInTheDocument();
    });
  });

  describe('Property detail data from store', () => {
    it('renders year built from activeParcel', () => {
      render(<Wrapper />);
      expect(screen.getByText(/1985/)).toBeInTheDocument();
    });

    it('renders assessment year from activeParcel', () => {
      render(<Wrapper />);
      expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    });

    it('renders assessment status from activeParcel', () => {
      render(<Wrapper />);
      expect(screen.getByText(/certified/i)).toBeInTheDocument();
    });

    it('renders tax district from activeParcel', () => {
      render(<Wrapper />);
      expect(screen.getByText(/Benton County/)).toBeInTheDocument();
    });
  });

  describe('Assessment history from store', () => {
    it('renders assessment history section with real year data', () => {
      render(<Wrapper />);
      const yearCells = screen.getAllByText(/2026|2025/);
      expect(yearCells.length).toBeGreaterThan(0);
    });
  });

  describe('Status flags from store', () => {
    it('renders exemption amount when present', () => {
      render(<Wrapper />);
      expect(screen.getByText(/15,000/)).toBeInTheDocument();
    });

    it('renders appeal count from store appeals', () => {
      render(<Wrapper />);
      expect(screen.getByText(/1 appeal/i)).toBeInTheDocument();
    });

    it('uses loaded-appeals wording for store-backed appeal records', () => {
      render(<Wrapper />);
      expect(screen.getByText(/Loaded Appeals/i)).toBeInTheDocument();
      expect(screen.getByText(/Shown from the appeal records currently loaded for this parcel\./i)).toBeInTheDocument();
      expect(screen.queryByText(/^Active Appeals$/i)).not.toBeInTheDocument();
    });

    it('uses loaded-parcel permit wording for the store-backed permit flag', () => {
      propertyStoreState.activeParcel.hasActivePermits = true;

      render(<Wrapper />);

      expect(screen.getByText(/Loaded parcel is marked with active permits\./i)).toBeInTheDocument();
      expect(screen.getByText(/Shown from the parcel summary currently loaded for this parcel\./i)).toBeInTheDocument();
      expect(screen.queryByText(/Active permits on file/i)).not.toBeInTheDocument();
    });
  });

  describe('Legal description', () => {
    it('renders legal description from context', () => {
      render(<Wrapper />);
      expect(screen.getByText(/LOT 5 BLOCK 2 REAL DATA PLAT/)).toBeInTheDocument();
    });
  });

  describe('No hardcoded placeholders', () => {
    it('does not render generic placeholder text in idle state', () => {
      render(<Wrapper />);
      expect(screen.queryByText(/No data available/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Placeholder/i)).not.toBeInTheDocument();
    });
  });
});

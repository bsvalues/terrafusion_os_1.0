import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IncomeValuationPanel } from '../../components/workbench/IncomeValuationPanel';
import * as incomeService from '../../services/incomeValuationService';

let mockParcelId: string | undefined = 'P-100';
let mockActiveParcel:
  | { parcelId: string; address: string; propertyType?: string }
  | null = {
    parcelId: 'P-100',
    address: '123 Main St',
    propertyType: 'Commercial',
  };

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: mockParcelId }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: { activeParcel: typeof mockActiveParcel }) => unknown) =>
    selector({ activeParcel: mockActiveParcel }),
}));

vi.mock('../../services/incomeValuationService', async () => {
  const actual = await vi.importActual<typeof import('../../services/incomeValuationService')>(
    '../../services/incomeValuationService',
  );

  return {
    ...actual,
    calculateIncomeValuation: vi.fn(),
    previewValuation: vi.fn(),
  };
});

const calculateIncomeValuation = vi.mocked(incomeService.calculateIncomeValuation);
const previewValuation = vi.mocked(incomeService.previewValuation);

describe('IncomeValuationPanel', () => {
  beforeEach(() => {
    mockParcelId = 'P-100';
    mockActiveParcel = {
      parcelId: 'P-100',
      address: '123 Main St',
      propertyType: 'Commercial',
    };
    vi.clearAllMocks();
  });

  it('shows a no-parcel empty state when no parcel context exists', () => {
    mockParcelId = undefined;
    mockActiveParcel = null;

    render(<IncomeValuationPanel />);

    expect(screen.getByText(/select a parcel to run income valuation/i)).toBeInTheDocument();
  });

  it('renders backend valuation output when the service succeeds', async () => {
    calculateIncomeValuation.mockResolvedValue({
      netOperatingIncome: 84000,
      capRate: 7.5,
      location: 'Richland',
      locationMultiplier: 1.1,
      propertyType: '300',
      rawValuation: 1120000,
      adjustedValuation: 1234000,
      grossIncomeMultiplier: 13.69,
      cashOnCashReturn: 7.1,
      riskClassification: 'low',
      effectiveDate: '2026-03-18',
      source: 'backend-income',
    });

    render(<IncomeValuationPanel />);

    fireEvent.click(screen.getByRole('button', { name: /run income valuation/i }));

    await waitFor(() => {
      expect(calculateIncomeValuation).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/\$1,234,000/)).toBeInTheDocument();
      expect(screen.getByText(/backend-income/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/preview only/i)).not.toBeInTheDocument();
  });

  it('falls back to preview output when the backend is unavailable', async () => {
    calculateIncomeValuation.mockRejectedValue(new Error('offline'));
    previewValuation.mockReturnValue({
      netOperatingIncome: 76000,
      capRate: 7.5,
      location: 'Richland',
      locationMultiplier: 1.0,
      propertyType: '300',
      rawValuation: 1013333,
      adjustedValuation: 1013333,
      grossIncomeMultiplier: 13.33,
      cashOnCashReturn: 7.5,
      riskClassification: 'medium',
      effectiveDate: '2026-03-18',
      source: 'Client-side preview (not authoritative)',
    });

    render(<IncomeValuationPanel />);

    fireEvent.click(screen.getByRole('button', { name: /run income valuation/i }));

    await waitFor(() => {
      expect(previewValuation).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/preview only/i)).toBeInTheDocument();
      expect(screen.getByText(/\$1,013,333/)).toBeInTheDocument();
    });
  });
});

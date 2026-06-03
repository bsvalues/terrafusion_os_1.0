import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRuntime = vi.hoisted(() => ({
  countyScope: {
    countyId: '19190019-1919-1919-1919-191919191919',
    supported: true,
    message: null as string | null,
  },
  fetchReferenceData: vi.fn(),
  calculateValuation: vi.fn(),
}));

vi.mock('../incomeForgeStore', () => {
  const mockStore = vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      capRates: [
        { propertyType: 'commercial', label: 'Commercial', min: 5.25, typical: 6.25, max: 7.25 },
        { propertyType: 'industrial', label: 'Industrial', min: 6.0, typical: 7.0, max: 8.0 },
      ],
      marketData: {
        county: 'Benton',
        state: 'WA',
        medianHouseholdIncome: 82500,
        unemploymentRate: 4.2,
        populationGrowthRate: 1.6,
        medianHomePrice: 485000,
        medianPricePerSqft: 255,
        medianDaysOnMarket: 24,
        monthsOfInventory: 2.1,
        employmentSectors: [{ sector: 'Health Care', jobs: 24500, share: 18.4 }],
        effectiveDate: '2025-01-01',
        source: 'US Census ACS 2024, WA ESD, Benton-Franklin Trends',
      },
      expenseRatios: [
        { propertyType: 'commercial', label: 'Commercial', lowPct: 25, typicalPct: 35, highPct: 45 },
      ],
      expenseCategories: ['propertyTaxes', 'insurance'],
      locationPremiums: [
        { location: 'Richland', multiplier: 1.1 },
        { location: 'Kennewick', multiplier: 1.05 },
      ],
      valuationResult: {
        netOperatingIncome: 82000,
        capRate: 6.25,
        location: 'Richland',
        locationMultiplier: 1.1,
        propertyType: 'Commercial',
        rawValuation: 1312000,
        adjustedValuation: 1443200,
        grossIncomeMultiplier: 12.0,
        cashOnCashReturn: 6.25,
        riskClassification: 'medium',
        effectiveDate: '2025-01-01',
        source: 'Benton County Assessor - Income Approach Valuation FY 2025',
      },
      stats: {
        propertyTypes: 2,
        locations: 2,
        marketCapRate: 6.25,
        medianHomePrice: 485000,
        medianIncome: 82500,
      },
      countyScope: mockRuntime.countyScope,
      referenceSource: 'Benton County Assessor - Income Approach Market Study FY 2025',
      capRatesLoading: false,
      marketLoading: false,
      expensesLoading: false,
      locationsLoading: false,
      valuationLoading: false,
      capRatesError: null,
      marketError: null,
      expensesError: null,
      locationsError: null,
      valuationError: null,
      fetchReferenceData: mockRuntime.fetchReferenceData,
      calculateValuation: mockRuntime.calculateValuation,
    };
    return selector ? selector(state) : state;
  });

  return { useIncomeForgeStore: mockStore };
});

import IncomeForge from '../IncomeForge';

describe('IncomeForge', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRuntime.countyScope = {
      countyId: '19190019-1919-1919-1919-191919191919',
      supported: true,
      message: null,
    };
  });

  it('renders the live API workspace with stats and provenance', () => {
    render(<IncomeForge />);

    expect(screen.getByTestId('income-forge')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'IncomeForge', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Live API')).toBeInTheDocument();
    expect(screen.getByText('Property Types')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Benton County Assessor/i).length).toBeGreaterThan(0);
  });

  it('opens as an income evidence readiness desk instead of a final valuation engine', () => {
    render(<IncomeForge />);

    expect(screen.getAllByText('Income Evidence Readiness Desk').length).toBeGreaterThan(0);
    expect(screen.getByText('Case Desk derived from live IncomeForge reference records and staff evidence state.')).toBeInTheDocument();
    expect(screen.getByText('Can this parcel support an income approach?')).toBeInTheDocument();
    expect(screen.getAllByText('Not income-ready').length).toBeGreaterThan(0);
    expect(screen.getByText('Work Queue')).toBeInTheDocument();
    expect(screen.getByText('Rent Roll / Income Evidence')).toBeInTheDocument();
    expect(screen.getByText('Expense Normalization')).toBeInTheDocument();
    expect(screen.getByText('Vacancy / Collection Loss')).toBeInTheDocument();
    expect(screen.getByText('Reference market cap rate')).toBeInTheDocument();
    expect(screen.getByText('NOI Reconciliation Readiness')).toBeInTheDocument();
    expect(screen.getByText('Evidence Trail')).toBeInTheDocument();
  });

  it('uses a three-pane operational case desk instead of a dominant error blanket', () => {
    render(<IncomeForge />);

    expect(screen.getByText('Active Income Case')).toBeInTheDocument();
    expect(screen.getByText('Readiness Inspector')).toBeInTheDocument();
    expect(screen.getByTestId('income-workbench-shell')).toBeInTheDocument();
    expect(screen.getByText('Evidence Binder')).toBeInTheDocument();
    expect(screen.getByText('Decision Inspector')).toBeInTheDocument();
    expect(screen.getByText('Final value blocked')).toBeInTheDocument();
    expect(screen.getByText('Local decision state')).toBeInTheDocument();
    expect(screen.getByTestId('income-readiness-desk')).not.toHaveClass('bg-red-50/70');
    expect(screen.getAllByText('Not income-ready').length).toBeGreaterThan(0);
  });

  it('does not auto-run or foreground a final income value conclusion', () => {
    render(<IncomeForge />);

    expect(mockRuntime.calculateValuation).not.toHaveBeenCalled();
    expect(screen.queryByText('Backend Valuation Result')).not.toBeInTheDocument();
    expect(screen.queryByText('Calculate Valuation')).not.toBeInTheDocument();
    expect(screen.queryByText('Adjusted Value')).not.toBeInTheDocument();
  });

  it('persists selected case, reviewer decision, reason code, and evidence trail locally without unlocking valuation', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<IncomeForge />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /IF-2026-002 Restaurant lease review/i }));
      await user.click(screen.getByRole('button', { name: 'Chief Review Hold' }));
      await user.click(screen.getByRole('button', { name: 'Expense support incomplete' }));
    });

    expect(screen.getByText('Active case: IF-2026-002')).toBeInTheDocument();
    expect(screen.getByText('Current decision: Chief Review Hold')).toBeInTheDocument();
    expect(screen.getByText('Reason code: Expense support incomplete')).toBeInTheDocument();
    expect(screen.getByText(/IF-2026-002 .* Chief Review Hold .* Expense support incomplete/)).toBeInTheDocument();
    expect(screen.queryByText('Calculate Valuation')).not.toBeInTheDocument();

    unmount();
    render(<IncomeForge />);

    expect(screen.getByText('Active case: IF-2026-002')).toBeInTheDocument();
    expect(screen.getByText('Current decision: Chief Review Hold')).toBeInTheDocument();
    expect(screen.getByText('Reason code: Expense support incomplete')).toBeInTheDocument();
    expect(screen.getByText(/IF-2026-002 .* Chief Review Hold .* Expense support incomplete/)).toBeInTheDocument();
    expect(screen.queryByText('Backend Valuation Result')).not.toBeInTheDocument();
  });

  it('keeps reference support tabs without making them the primary workflow', () => {
    render(<IncomeForge />);

    expect(screen.getByText('Review Desk')).toBeInTheDocument();
    expect(screen.getByText('Cap Rates')).toBeInTheDocument();
    expect(screen.getByText('Market Data')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Locations' })).toBeInTheDocument();
  });

  it('shows a county availability guard for unsupported county scopes', () => {
    mockRuntime.countyScope = {
      countyId: 'cowlitz',
      supported: false,
      message: 'IncomeForge live income-approach references are currently certified for Benton County only.',
    };

    render(<IncomeForge />);

    expect(screen.getByText('Benton-certified data required')).toBeInTheDocument();
    expect(screen.getByText(/Active county: cowlitz/i)).toBeInTheDocument();
  });
});

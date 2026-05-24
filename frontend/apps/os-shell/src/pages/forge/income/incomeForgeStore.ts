/**
 * incomeForgeStore.ts - Zustand store for the standalone IncomeForge module.
 *
 * Pattern: API-first. Reference data and valuation math come from the
 * CostForge income-approach endpoints; the frontend only captures inputs and
 * renders results.
 */
import { create } from 'zustand';
import { getToken } from '@/auth/authStorage';
import { getSession } from '@/auth/session';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';
import { apiFetchJson } from '../../../lib/apiBase';

export interface CapRateEntry {
  propertyType: string;
  label: string;
  min: number;
  max: number;
  typical: number;
}

export interface CapRatesResponse {
  capRates: CapRateEntry[];
  marketCapRate: number;
  effectiveDate: string;
  source: string;
}

export interface EmploymentSector {
  sector: string;
  percentOfTotal: number;
}

export interface MarketData {
  county: string;
  state: string;
  medianHouseholdIncome: number;
  unemploymentRate: number;
  populationGrowthRate: number;
  medianHomePrice: number;
  medianPricePerSqft: number;
  medianDaysOnMarket: number;
  monthsOfInventory: number;
  employmentSectors: EmploymentSector[];
  effectiveDate: string;
  source: string;
}

export interface ExpenseRatioEntry {
  propertyType: string;
  label: string;
  lowPct: number;
  highPct: number;
  typicalPct: number;
}

interface ExpenseRatiosResponse {
  expenseRatios: ExpenseRatioEntry[];
  expenseCategories: string[];
  effectiveDate: string;
  source: string;
}

export interface LocationPremium {
  location: string;
  multiplier: number;
  note: string;
}

interface LocationPremiumsResponse {
  locationPremiums: LocationPremium[];
  effectiveDate: string;
  source: string;
}

export interface IncomeExpenses {
  propertyTaxes: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  managementFees: number;
  replacementReserves: number;
  otherExpenses: number;
}

export interface IncomeValuationRequest {
  annualRentalIncome: number;
  vacancyRate: number;
  otherIncome: number;
  expenses: IncomeExpenses;
  capRate: number;
  location: string;
  propertyType: string;
}

export interface IncomeValuationResult {
  netOperatingIncome: number;
  capRate: number;
  location: string;
  locationMultiplier: number;
  propertyType: string;
  rawValuation: number;
  adjustedValuation: number;
  grossIncomeMultiplier: number;
  cashOnCashReturn: number;
  riskClassification: string;
  effectiveDate: string;
  source: string;
}

interface IncomeForgeStats {
  propertyTypes: number;
  locations: number;
  marketCapRate: number;
  medianHomePrice: number;
  medianIncome: number;
}

interface IncomeForgeCountyScope {
  countyId: string | null;
  supported: boolean;
  message: string | null;
}

interface IncomeForgeState {
  capRates: CapRateEntry[];
  marketData: MarketData | null;
  expenseRatios: ExpenseRatioEntry[];
  expenseCategories: string[];
  locationPremiums: LocationPremium[];
  valuationResult: IncomeValuationResult | null;

  capRatesLoading: boolean;
  marketLoading: boolean;
  expensesLoading: boolean;
  locationsLoading: boolean;
  valuationLoading: boolean;

  capRatesError: string | null;
  marketError: string | null;
  expensesError: string | null;
  locationsError: string | null;
  valuationError: string | null;

  stats: IncomeForgeStats;
  referenceSource: string | null;
  countyScope: IncomeForgeCountyScope;

  fetchReferenceData: () => Promise<void>;
  fetchCapRates: () => Promise<void>;
  fetchMarketData: () => Promise<void>;
  fetchExpenseRatios: () => Promise<void>;
  fetchLocationPremiums: () => Promise<void>;
  calculateValuation: (request: IncomeValuationRequest) => Promise<void>;
}

const emptyStats: IncomeForgeStats = {
  propertyTypes: 0,
  locations: 0,
  marketCapRate: 0,
  medianHomePrice: 0,
  medianIncome: 0,
};

const bentonCountyIds = new Set([
  '19190019-1919-1919-1919-191919191919',
  'benton',
  'benton-county',
  'benton-wa',
]);

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function getIncomeForgeCountyScope(session = getSession()): IncomeForgeCountyScope {
  const countyId = session?.countyId?.trim() || null;
  const supported = countyId ? bentonCountyIds.has(countyId.toLowerCase()) : false;
  return {
    countyId,
    supported,
    message: supported
      ? null
      : 'IncomeForge live income-approach references are currently certified for Benton County only.',
  };
}

function markUnsupportedCounty(set: (partial: Partial<IncomeForgeState>) => void): void {
  const countyScope = getIncomeForgeCountyScope();
  set({
    countyScope,
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
    capRates: [],
    marketData: null,
    expenseRatios: [],
    expenseCategories: [],
    locationPremiums: [],
    valuationResult: null,
    stats: emptyStats,
    referenceSource: null,
  });
}

function incomeForgeHeaders(): { headers: Record<string, string>; countyScope: IncomeForgeCountyScope } {
  const token = getToken();
  const session = getSession();
  const { headers } = buildCountyScopedSessionHeaders(session);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { headers, countyScope: getIncomeForgeCountyScope(session) };
}

export const useIncomeForgeStore = create<IncomeForgeState>((set, get) => ({
  capRates: [],
  marketData: null,
  expenseRatios: [],
  expenseCategories: [],
  locationPremiums: [],
  valuationResult: null,

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

  stats: emptyStats,
  referenceSource: null,
  countyScope: getIncomeForgeCountyScope(),

  fetchReferenceData: async () => {
    if (!getIncomeForgeCountyScope().supported) {
      markUnsupportedCounty(set);
      return;
    }
    await Promise.all([
      get().fetchCapRates(),
      get().fetchMarketData(),
      get().fetchExpenseRatios(),
      get().fetchLocationPremiums(),
    ]);
  },

  fetchCapRates: async () => {
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ capRatesLoading: true, capRatesError: null });
    try {
      const data = await apiFetchJson<CapRatesResponse>('/costforge/income-approach/cap-rates', {
        headers,
      });
      set((state) => ({
        countyScope,
        capRates: data.capRates,
        referenceSource: data.source,
        capRatesLoading: false,
        stats: {
          ...state.stats,
          propertyTypes: data.capRates.length,
          marketCapRate: data.marketCapRate,
        },
      }));
    } catch (error: unknown) {
      set({ capRatesError: errorMessage(error), capRatesLoading: false });
    }
  },

  fetchMarketData: async () => {
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ marketLoading: true, marketError: null });
    try {
      const data = await apiFetchJson<MarketData>('/costforge/income-approach/market-data/benton', {
        headers,
      });
      set((state) => ({
        countyScope,
        marketData: data,
        marketLoading: false,
        stats: {
          ...state.stats,
          medianHomePrice: data.medianHomePrice,
          medianIncome: data.medianHouseholdIncome,
        },
      }));
    } catch (error: unknown) {
      set({ marketError: errorMessage(error), marketLoading: false });
    }
  },

  fetchExpenseRatios: async () => {
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ expensesLoading: true, expensesError: null });
    try {
      const data = await apiFetchJson<ExpenseRatiosResponse>(
        '/costforge/income-approach/expense-ratios',
        { headers }
      );
      set({
        countyScope,
        expenseRatios: data.expenseRatios,
        expenseCategories: data.expenseCategories,
        expensesLoading: false,
      });
    } catch (error: unknown) {
      set({ expensesError: errorMessage(error), expensesLoading: false });
    }
  },

  fetchLocationPremiums: async () => {
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ locationsLoading: true, locationsError: null });
    try {
      const data = await apiFetchJson<LocationPremiumsResponse>(
        '/costforge/income-approach/location-premiums/benton',
        { headers }
      );
      set((state) => ({
        countyScope,
        locationPremiums: data.locationPremiums,
        locationsLoading: false,
        stats: {
          ...state.stats,
          locations: data.locationPremiums.length,
        },
      }));
    } catch (error: unknown) {
      set({ locationsError: errorMessage(error), locationsLoading: false });
    }
  },

  calculateValuation: async (request: IncomeValuationRequest) => {
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ valuationLoading: true, valuationError: null });
    try {
      const data = await apiFetchJson<IncomeValuationResult>(
        '/costforge/income-approach/calculate-valuation',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            annualRentalIncome: request.annualRentalIncome,
            vacancyRate: request.vacancyRate,
            otherIncome: request.otherIncome,
            propertyTaxes: request.expenses.propertyTaxes,
            insurance: request.expenses.insurance,
            utilities: request.expenses.utilities,
            maintenance: request.expenses.maintenance,
            managementFees: request.expenses.managementFees,
            replacementReserves: request.expenses.replacementReserves,
            otherExpenses: request.expenses.otherExpenses,
            capRate: request.capRate,
            location: request.location,
            propertyType: request.propertyType,
          }),
        }
      );
      set({ countyScope, valuationResult: data, valuationLoading: false });
    } catch (error: unknown) {
      set({ valuationError: errorMessage(error), valuationLoading: false });
    }
  },
}));

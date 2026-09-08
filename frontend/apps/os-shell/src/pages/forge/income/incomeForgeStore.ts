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
import { apiFetch, apiFetchJson } from '../../../lib/apiBase';

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
  parcelId: string;
  annualRentalIncome: number;
  vacancyRate: number;
  otherIncome: number;
  expenses: IncomeExpenses;
  capRate: number;
  location: string;
  propertyType: string;
}

export interface IncomeValuationResult {
  canonical?: { schemaVersion: string; parcelId: string; annualRentalIncome: number; vacancyLoss: number;
    otherIncome: number; effectiveGrossIncome: number; totalExpenses: number; expenseRatio: number;
    netOperatingIncome: number; capRate: number; locationMultiplier: number; rawValuation: number;
    adjustedValuation: number; grossIncomeMultiplier: number; cashOnCashReturn: number; riskClassification: string };
  provenance?: { countyId: string; parcelId: string; sourceCommit: string; executableSha256: string;
    inputHash: string; requestId: string; stdoutSha256: string; auditEventId: string };
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
  valuationErrorCorrelationId: string | null;

  stats: IncomeForgeStats;
  referenceSource: string | null;
  countyScope: IncomeForgeCountyScope;

  fetchReferenceData: () => Promise<void>;
  fetchCapRates: () => Promise<void>;
  fetchMarketData: () => Promise<void>;
  fetchExpenseRatios: () => Promise<void>;
  fetchLocationPremiums: () => Promise<void>;
  calculateValuation: (request: IncomeValuationRequest) => Promise<void>;
  resetValuation: () => void;
}

let valuationGeneration = 0;
let valuationRequest: AbortController | null = null;

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
    valuationErrorCorrelationId: null,
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
  valuationErrorCorrelationId: null,

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
    const generation = ++valuationGeneration;
    valuationRequest?.abort();
    const controller = new AbortController(); valuationRequest = controller;
    const sessionIdentity = JSON.stringify(getSession());
    const isCurrent = () => generation === valuationGeneration && sessionIdentity === JSON.stringify(getSession());
    const { headers, countyScope } = incomeForgeHeaders();
    if (!countyScope.supported) {
      markUnsupportedCounty(set);
      return;
    }
    set({ valuationLoading: true, valuationError: null, valuationErrorCorrelationId: null, valuationResult: null });
    try {
      if (!request.parcelId?.trim()) throw new Error('An explicit parcel is required for canonical Income.');
      const response = await apiFetch(
        '/costforge/income-approach/calculate-valuation',
        {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            parcelId: request.parcelId,
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
      if (!response.ok) {
        const failure = await response.json().catch(() => ({})) as { code?: string; message?: string; correlationId?: string };
        const cid = response.headers.get('X-Correlation-ID') ?? failure.correlationId;
        if (isCurrent() && typeof cid === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(cid)) set({ valuationErrorCorrelationId: cid });
        throw new Error([failure.code ?? `Canonical Income request failed: ${response.status}`, failure.message].filter(Boolean).join(' — '));
      }
      const data = await response.json() as IncomeValuationResult;
      if (!isCurrent()) return;
      const canonical = data.canonical;
      if (canonical?.schemaVersion !== '1.0.0' || canonical.parcelId !== request.parcelId
        || data.provenance?.parcelId !== request.parcelId || !/^[a-f0-9]{40}$/.test(data.provenance.sourceCommit)
        || typeof data.provenance.countyId !== 'string'
        || !bentonCountyIds.has(data.provenance.countyId.trim().toLowerCase())
        || !/^[a-f0-9]{64}$/.test(data.provenance.executableSha256) || !/^[a-f0-9]{64}$/.test(data.provenance.inputHash)
        || !/^[a-f0-9]{64}$/.test(data.provenance.stdoutSha256)
        || typeof data.provenance.requestId !== 'string' || !data.provenance.requestId.trim()
        || typeof data.provenance.auditEventId !== 'string' || !data.provenance.auditEventId.trim()
        || ![canonical.annualRentalIncome, canonical.vacancyLoss, canonical.otherIncome, canonical.effectiveGrossIncome,
          canonical.totalExpenses, canonical.expenseRatio, canonical.netOperatingIncome, canonical.capRate,
          canonical.locationMultiplier, canonical.rawValuation, canonical.adjustedValuation,
          canonical.grossIncomeMultiplier, canonical.cashOnCashReturn].every(Number.isFinite)
        || typeof canonical.riskClassification !== 'string' || !canonical.riskClassification.trim()
        || data.netOperatingIncome !== canonical.netOperatingIncome || data.capRate !== canonical.capRate
        || data.locationMultiplier !== canonical.locationMultiplier || data.rawValuation !== canonical.rawValuation
        || data.adjustedValuation !== canonical.adjustedValuation || data.grossIncomeMultiplier !== canonical.grossIncomeMultiplier
        || data.cashOnCashReturn !== canonical.cashOnCashReturn || data.riskClassification !== canonical.riskClassification)
        throw new Error('Canonical Income response provenance is missing or mismatched.');
      set({ countyScope, valuationResult: data, valuationLoading: false });
    } catch (error: unknown) {
      if (isCurrent()) set({ valuationError: errorMessage(error), valuationLoading: false, valuationResult: null });
    } finally {
      if (generation === valuationGeneration) set({ valuationLoading: false });
    }
  },
  resetValuation: () => {
    valuationGeneration++;
    valuationRequest?.abort();
    set({ valuationResult: null, valuationError: null, valuationErrorCorrelationId: null, valuationLoading: false });
  },
}));

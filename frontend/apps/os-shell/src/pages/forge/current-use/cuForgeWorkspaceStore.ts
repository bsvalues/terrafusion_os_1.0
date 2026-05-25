/**
 * cuForgeWorkspaceStore.ts
 * Global workspace state for CUForge (Current Use Program).
 * Manages active tab, classifications, rollback calculations, interest rates, and removals.
 *
 * Architecture: Zustand store with apiFetchJson (same pattern as CostForge).
 * API Base: /currentuse/* (proxied via Vite → backend:5000)
 *
 * NOTE: The backend does NOT have a /stats endpoint. Stats are derived client-side
 * from the classifications list and interest rates data.
 */
import { create } from 'zustand';
import { apiFetchJson } from '@/lib/apiBase';

const CLASSIFICATION_STATS_PAGE_SIZE = 1000;

// ── Types ────────────────────────────────────────────────────────────────────

export type CUForgeTab = 'classifications' | 'rollback' | 'interest' | 'removals';

/** Backend ClassificationDto shape */
export interface Classification {
  id: string;
  parcelId: string;
  classificationCode: string;
  description: string;
  enrollmentDate: string;
  status: string;
  acreage: number | null;
  currentMarketValue: number | null;
  currentUseValue: number | null;
  taxSavings: number | null;
  countyId: string | null;
}

export interface ClassificationsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Classification[];
}

/** Backend YearBreakdown shape */
export interface RollbackYear {
  year: number;
  marketValue: number;
  currentUseValue: number;
  difference: number;
  interestRate: number;
  interestAmount: number;
  subtotal: number;
}

/** Backend RollbackResult shape */
export interface RollbackResult {
  totalRollbackTax: number;
  totalInterest: number;
  totalPenalty: number;
  grandTotal: number;
  yearBreakdowns: RollbackYear[];
  penaltyApplied: boolean;
  penaltyExceptionApplied: boolean;
  exceptionCode: string | null;
}

/** Backend InterestRateDto shape */
export interface InterestRate {
  year: number;
  rate: number; // decimal fraction (e.g. 0.02440 = 2.44%)
  source: string;
  effectiveDate: string;
}

/** Backend RemovalDto shape */
export interface Removal {
  id: string;
  parcelId: string;
  classificationCode: string;
  reason: string;
  initiatedDate: string;
  status: string;
  removalDate: string | null;
  rollbackAmount: number | null;
  interestAmount: number | null;
  penaltyAmount: number | null;
  totalDue: number | null;
}

/** Client-side computed stats */
export interface CUForgeStats {
  totalEnrolled: number;
  dflCount: number;
  cufaCount: number;
  cuosCount: number;
  cutlCount: number;
  totalTaxBenefit: number;
  pendingRemovals: number;
  currentInterestRate: number; // as percentage (e.g. 2.44)
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface CUForgeWorkspaceState {
  activeTab: CUForgeTab;
  taxYear: number;

  // Stats rail (computed client-side)
  stats: CUForgeStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Classifications
  classifications: Classification[];
  classificationsTotal: number;
  classificationsPage: number;
  classificationsLoading: boolean;
  classificationsError: string | null;

  // Rollback
  rollbackResult: RollbackResult | null;
  rollbackLoading: boolean;
  rollbackError: string | null;

  // Interest rates
  interestRates: InterestRate[];
  interestRatesLoading: boolean;
  interestRatesError: string | null;

  // Removals
  removals: Removal[];
  removalsLoading: boolean;
  removalsError: string | null;

  // Actions
  setActiveTab(tab: CUForgeTab): void;
  setTaxYear(year: number): void;
  fetchStats(signal?: AbortSignal): Promise<void>;
  fetchClassifications(page?: number, signal?: AbortSignal): Promise<void>;
  calculateRollback(parcelId: string, classificationCode: string, enrollmentYear: number, removalYear: number, marketValues: Record<string, number>, currentUseValues: Record<string, number>, signal?: AbortSignal): Promise<void>;
  fetchInterestRates(signal?: AbortSignal): Promise<void>;
  fetchRemovals(signal?: AbortSignal): Promise<void>;
}

async function fetchAllClassificationsForStats(signal?: AbortSignal): Promise<Classification[]> {
  const firstPage = await apiFetchJson<ClassificationsResponse>(
    `/currentuse/classifications?page=1&pageSize=${CLASSIFICATION_STATS_PAGE_SIZE}`,
    { signal }
  );
  const pageSize = firstPage.pageSize || CLASSIFICATION_STATS_PAGE_SIZE;
  const totalPages = Math.ceil(firstPage.total / pageSize);

  if (totalPages <= 1) {
    return firstPage.items;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      apiFetchJson<ClassificationsResponse>(
        `/currentuse/classifications?page=${index + 2}&pageSize=${pageSize}`,
        { signal }
      )
    )
  );

  return [firstPage, ...remainingPages].flatMap(page => page.items);
}

// ── Store Implementation ─────────────────────────────────────────────────────

export const useCUForgeWorkspaceStore = create<CUForgeWorkspaceState>((set, get) => ({
  activeTab: 'classifications',
  taxYear: 2026,

  stats: null,
  statsLoading: false,
  statsError: null,

  classifications: [],
  classificationsTotal: 0,
  classificationsPage: 1,
  classificationsLoading: false,
  classificationsError: null,

  rollbackResult: null,
  rollbackLoading: false,
  rollbackError: null,

  interestRates: [],
  interestRatesLoading: false,
  interestRatesError: null,

  removals: [],
  removalsLoading: false,
  removalsError: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setTaxYear: (year) => set({ taxYear: year, stats: null }),

  /**
   * Fetch stats by aggregating classifications + interest rates + removals.
   * The backend doesn't expose a /stats endpoint, so we derive it client-side.
   */
  fetchStats: async (signal) => {
    set({ statsLoading: true, statsError: null });
    try {
      const [items, rates, removals] = await Promise.all([
        fetchAllClassificationsForStats(signal),
        apiFetchJson<InterestRate[]>('/currentuse/interest-rates', { signal }),
        apiFetchJson<Removal[]>('/currentuse/removals', { signal }),
      ]);

      const activeItems = items.filter(c => c.status === 'Active');
      const dflCount = activeItems.filter(c => c.classificationCode === 'DFL').length;
      const cufaCount = activeItems.filter(c => c.classificationCode === 'CUFA').length;
      const cuosCount = activeItems.filter(c => c.classificationCode === 'CUOS').length;
      const cutlCount = activeItems.filter(c => c.classificationCode === 'CUTL').length;
      const totalTaxBenefit = activeItems.reduce((sum, c) => sum + (c.taxSavings ?? 0), 0);
      const pendingRemovals = removals.filter(r => r.status === 'Pending').length;

      // Latest interest rate (as percentage)
      const sortedRates = [...rates].sort((a, b) => b.year - a.year);
      const currentRate = sortedRates.length > 0 ? sortedRates[0].rate * 100 : 0;

      set({
        stats: {
          totalEnrolled: activeItems.length,
          dflCount,
          cufaCount,
          cuosCount,
          cutlCount,
          totalTaxBenefit,
          pendingRemovals,
          currentInterestRate: currentRate,
        },
        statsLoading: false,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ statsLoading: false });
        return;
      }
      set({
        statsError: err instanceof Error ? err.message : 'Failed to fetch stats',
        statsLoading: false,
      });
    }
  },

  fetchClassifications: async (page = 1, signal) => {
    set({ classificationsLoading: true, classificationsError: null });
    try {
      const data = await apiFetchJson<ClassificationsResponse>(
        `/currentuse/classifications?page=${page}&pageSize=50`,
        { signal }
      );
      set({
        classifications: data.items,
        classificationsTotal: data.total,
        classificationsPage: data.page,
        classificationsLoading: false,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ classificationsLoading: false });
        return;
      }
      set({
        classificationsError: err instanceof Error ? err.message : 'Failed to fetch classifications',
        classificationsLoading: false,
      });
    }
  },

  calculateRollback: async (parcelId, classificationCode, enrollmentYear, removalYear, marketValues, currentUseValues, signal) => {
    set({ rollbackLoading: true, rollbackError: null, rollbackResult: null });
    try {
      const data = await apiFetchJson<RollbackResult>(
        '/currentuse/rollback/calculate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parcelId,
            classificationCode,
            enrollmentYear,
            removalYear,
            marketValues,
            currentUseValues,
          }),
          signal,
        }
      );
      set({ rollbackResult: data, rollbackLoading: false });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ rollbackLoading: false });
        return;
      }
      set({
        rollbackError: err instanceof Error ? err.message : 'Failed to calculate rollback',
        rollbackLoading: false,
      });
    }
  },

  fetchInterestRates: async (signal) => {
    set({ interestRatesLoading: true, interestRatesError: null });
    try {
      const data = await apiFetchJson<InterestRate[]>(
        '/currentuse/interest-rates',
        { signal }
      );
      set({ interestRates: data, interestRatesLoading: false });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ interestRatesLoading: false });
        return;
      }
      set({
        interestRatesError: err instanceof Error ? err.message : 'Failed to fetch interest rates',
        interestRatesLoading: false,
      });
    }
  },

  fetchRemovals: async (signal) => {
    set({ removalsLoading: true, removalsError: null });
    try {
      const data = await apiFetchJson<Removal[]>(
        '/currentuse/removals',
        { signal }
      );
      set({ removals: data, removalsLoading: false });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ removalsLoading: false });
        return;
      }
      set({
        removalsError: err instanceof Error ? err.message : 'Failed to fetch removals',
        removalsLoading: false,
      });
    }
  },
}));

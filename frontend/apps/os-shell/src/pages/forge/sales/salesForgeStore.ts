/**
 * SalesForge Zustand store.
 * Owns: qualification queue, sale detail, running stats, neighborhood stats, code audit.
 * Pattern: API-first — no fixture fallback (all data is real PACS).
 */

import { create } from 'zustand';
import { apiFetch } from '../../../lib/apiBase';
import type {
  SaleQueuePage,
  SaleDetail,
  RunningStats,
  NeighborhoodStats,
  CodeAudit,
  FilterForm,
  CommittedFilters,
  PatchStatus,
  QueueTab,
  SalesForgeTab,
} from './salesForgeTypes';
import {
  EMPTY_FILTER_FORM,
  EMPTY_COMMITTED,
  SALESFORGE_TAX_YEAR,
  QUEUE_PAGE_SIZE,
} from './salesForgeTypes';

// ── State interface ───────────────────────────────────────────────────────────

interface SalesForgeState {
  // Active tab
  activeTab: SalesForgeTab;

  // Filters
  taxYear: number;
  filterForm: FilterForm;
  committedFilters: CommittedFilters;

  // Queue
  queueTab: QueueTab;
  queuePage: number;
  queueData: SaleQueuePage | null;
  queueLoading: boolean;
  queueError: string | null;

  // Selected sale detail (bottom expand panel)
  selectedSaleId: string | null;
  saleDetail: SaleDetail | null;
  detailLoading: boolean;
  detailError: string | null;

  // Running stats (right sidebar)
  runningStats: RunningStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Per-sale PATCH state
  patchState: Record<string, PatchStatus>;

  // Neighborhood stats (Tab 3)
  hoodStats: NeighborhoodStats | null;
  hoodStatsLoading: boolean;
  hoodStatsError: string | null;

  // Code audit (Tab 4)
  codeAudit: CodeAudit | null;
  codeAuditLoading: boolean;
  codeAuditError: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────

  setActiveTab: (tab: SalesForgeTab) => void;
  setQueueTab: (tab: QueueTab) => void;
  setQueuePage: (page: number) => void;
  setFilterForm: (form: Partial<FilterForm>) => void;
  applyFilters: () => void;
  clearFilters: () => void;

  selectSale: (saleId: string) => void;
  clearSelection: () => void;

  fetchQueue: () => Promise<void>;
  fetchSaleDetail: (saleId: string) => Promise<void>;
  fetchRunningStats: () => Promise<void>;
  fetchHoodStats: () => Promise<void>;
  fetchCodeAudit: () => Promise<void>;

  patchDecision: (
    saleId: string,
    decision: string,
    notes: string,
    decidedBy: string,
    decisionSource?: string,
  ) => Promise<void>;

  bulkDecision: (
    saleIds: string[],
    decision: string,
    notes: string,
    decidedBy: string,
  ) => Promise<void>;

  refreshStats: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSalesForgeStore = create<SalesForgeState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  activeTab: 'queue',
  taxYear: SALESFORGE_TAX_YEAR,
  filterForm: EMPTY_FILTER_FORM,
  committedFilters: EMPTY_COMMITTED,

  queueTab: 'all',
  queuePage: 1,
  queueData: null,
  queueLoading: false,
  queueError: null,

  selectedSaleId: null,
  saleDetail: null,
  detailLoading: false,
  detailError: null,

  runningStats: null,
  statsLoading: false,
  statsError: null,

  patchState: {},

  hoodStats: null,
  hoodStatsLoading: false,
  hoodStatsError: null,

  codeAudit: null,
  codeAuditLoading: false,
  codeAuditError: null,

  // ── Tab/page/filter actions ────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  setQueueTab: (tab) =>
    set({ queueTab: tab, queuePage: 1, queueData: null, queueError: null }),

  setQueuePage: (page) =>
    set({ queuePage: page, queueData: null, queueError: null }),

  setFilterForm: (partial) =>
    set((s) => ({ filterForm: { ...s.filterForm, ...partial } })),

  applyFilters: () => {
    const { filterForm } = get();
    const toNum = (v: string) => {
      const n = parseFloat(v.replace(/,/g, ''));
      return isNaN(n) ? null : n;
    };
    set({
      committedFilters: {
        hood:         filterForm.hood.trim() || null,
        propertyType: filterForm.propertyType.trim() || null,
        saleDateFrom: filterForm.saleDateFrom.trim() || null,
        saleDateTo:   filterForm.saleDateTo.trim() || null,
        minPrice:     toNum(filterForm.minPrice),
        maxPrice:     toNum(filterForm.maxPrice),
      },
      queuePage: 1,
      queueData: null,
      queueError: null,
    });
  },

  clearFilters: () =>
    set({
      filterForm: EMPTY_FILTER_FORM,
      committedFilters: EMPTY_COMMITTED,
      queuePage: 1,
      queueData: null,
      queueError: null,
    }),

  selectSale: (saleId) => {
    set({ selectedSaleId: saleId, saleDetail: null, detailError: null });
    void get().fetchSaleDetail(saleId);
  },

  clearSelection: () =>
    set({ selectedSaleId: null, saleDetail: null, detailError: null }),

  // ── API fetches ────────────────────────────────────────────────────────────

  fetchQueue: async () => {
    const { taxYear, queueTab, queuePage, committedFilters } = get();
    set({ queueLoading: true, queueError: null });

    const statusParam = queueTab === 'all' ? 'all'
      : queueTab === 'pending' ? 'pending'
      : queueTab === 'staff' ? 'staff-confirmed'
      : 'appraiser-final';

    const params = new URLSearchParams();
    params.set('taxYear', String(taxYear));
    params.set('status', statusParam);
    params.set('page', String(queuePage));
    params.set('pageSize', String(QUEUE_PAGE_SIZE));
    if (committedFilters.hood)         params.set('hood',         committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    if (committedFilters.saleDateFrom) params.set('saleDateFrom', committedFilters.saleDateFrom);
    if (committedFilters.saleDateTo)   params.set('saleDateTo',   committedFilters.saleDateTo);
    if (committedFilters.minPrice)     params.set('minPrice',     String(committedFilters.minPrice));
    if (committedFilters.maxPrice)     params.set('maxPrice',     String(committedFilters.maxPrice));

    try {
      const res = await apiFetch(`/terraforge/sale-qualification?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SaleQueuePage;

      // Page-clamp: if empty and not on page 1, step back.
      if (data.items.length === 0 && queuePage > 1) {
        const lastPage = Math.max(1, Math.ceil(data.total / QUEUE_PAGE_SIZE));
        set({ queuePage: lastPage, queueData: null, queueLoading: false });
        return;
      }

      set({ queueData: data, queueLoading: false });
    } catch (e) {
      set({
        queueLoading: false,
        queueError: e instanceof Error ? e.message : 'Failed to load queue',
      });
    }
  },

  fetchSaleDetail: async (saleId) => {
    set({ detailLoading: true, detailError: null });
    try {
      const res = await apiFetch(`/terraforge/sale-qualification/${saleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ saleDetail: (await res.json()) as SaleDetail, detailLoading: false });
    } catch (e) {
      set({
        detailLoading: false,
        detailError: e instanceof Error ? e.message : 'Failed to load detail',
      });
    }
  },

  fetchRunningStats: async () => {
    const { taxYear, committedFilters } = get();
    set({ statsLoading: true, statsError: null });
    const params = new URLSearchParams({ taxYear: String(taxYear) });
    if (committedFilters.hood)         params.set('hood',         committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    try {
      const res = await apiFetch(`/terraforge/sale-qualification/running-stats?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ runningStats: (await res.json()) as RunningStats, statsLoading: false });
    } catch (e) {
      set({
        statsLoading: false,
        statsError: e instanceof Error ? e.message : 'Failed to load stats',
      });
    }
  },

  fetchHoodStats: async () => {
    const { taxYear, committedFilters } = get();
    set({ hoodStatsLoading: true, hoodStatsError: null });
    const params = new URLSearchParams({ taxYear: String(taxYear) });
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    try {
      const res = await apiFetch(`/terraforge/sale-qualification/neighborhood-stats?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ hoodStats: (await res.json()) as NeighborhoodStats, hoodStatsLoading: false });
    } catch (e) {
      set({
        hoodStatsLoading: false,
        hoodStatsError: e instanceof Error ? e.message : 'Failed to load neighborhood stats',
      });
    }
  },

  fetchCodeAudit: async () => {
    const { taxYear } = get();
    set({ codeAuditLoading: true, codeAuditError: null });
    try {
      const res = await apiFetch(`/terraforge/sale-qualification/code-audit?taxYear=${taxYear}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ codeAudit: (await res.json()) as CodeAudit, codeAuditLoading: false });
    } catch (e) {
      set({
        codeAuditLoading: false,
        codeAuditError: e instanceof Error ? e.message : 'Failed to load code audit',
      });
    }
  },

  refreshStats: () => {
    void get().fetchRunningStats();
  },

  // ── Decisions ──────────────────────────────────────────────────────────────

  patchDecision: async (saleId, decision, notes, decidedBy, decisionSource = 'StaffConfirmed') => {
    set((s) => ({ patchState: { ...s.patchState, [saleId]: 'working' } }));
    try {
      const res = await apiFetch(`/terraforge/sale-qualification/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualificationDecision: decision,
          researchNotes: notes || null,
          decidedBy,
          decisionSource,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ patchState: { ...s.patchState, [saleId]: 'done' } }));
      // Refresh queue + stats after decision.
      await get().fetchQueue();
      void get().fetchRunningStats();
    } catch {
      set((s) => ({ patchState: { ...s.patchState, [saleId]: 'error' } }));
    }
  },

  bulkDecision: async (saleIds, decision, notes, decidedBy) => {
    // Mark all as working.
    set((s) => {
      const patch = { ...s.patchState };
      saleIds.forEach((id) => { patch[id] = 'working'; });
      return { patchState: patch };
    });
    try {
      const res = await apiFetch('/terraforge/sale-qualification/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleIds,
          qualificationDecision: decision,
          researchNotes: notes || null,
          decidedBy,
          decisionSource: 'StaffConfirmed',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => {
        const patch = { ...s.patchState };
        saleIds.forEach((id) => { patch[id] = 'done'; });
        return { patchState: patch };
      });
      await get().fetchQueue();
      void get().fetchRunningStats();
    } catch {
      set((s) => {
        const patch = { ...s.patchState };
        saleIds.forEach((id) => { patch[id] = 'error'; });
        return { patchState: patch };
      });
    }
  },
}));

/**
 * SalesForge Zustand store.
 * Owns: qualification queue, sale detail, running stats, neighborhood stats, code audit.
 * Pattern: API-first — all data is TerraFusion sale truth.
 */

import { create } from 'zustand';
import { getSession } from '@/auth/session';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';
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
import {
  bulkPatchWashingtonLaunchDecision,
  fetchWashingtonLaunchCodeAudit,
  fetchWashingtonLaunchNeighborhoodStats,
  fetchWashingtonLaunchQueue,
  fetchWashingtonLaunchRunningStats,
  fetchWashingtonLaunchSaleDetail,
  isWashingtonLaunchDataEnabled,
  patchWashingtonLaunchDecision,
} from './washingtonLaunchApi';

export function getSalesForgeCountyScope() {
  const session = getSession();
  const { headers, isolated } = buildCountyScopedSessionHeaders(session);
  return {
    countyId: session?.countyId ?? null,
    headers,
    isolated,
  };
}

function addCountyScopeParam(params: URLSearchParams, countyId: string | null): void {
  if (countyId) params.set('countyId', countyId);
}

type RequestLane = 'queue' | 'detail' | 'stats' | 'hoodStats' | 'codeAudit' | 'decision';

export type SalesForgeDataSource = 'live-api' | 'washington-reference';

const ALL_REQUEST_LANES: RequestLane[] = [
  'queue',
  'detail',
  'stats',
  'hoodStats',
  'codeAudit',
  'decision',
];

const requestGeneration: Record<RequestLane, number> = {
  queue: 0,
  detail: 0,
  stats: 0,
  hoodStats: 0,
  codeAudit: 0,
  decision: 0,
};

function invalidateRequests(...lanes: RequestLane[]): void {
  lanes.forEach((lane) => {
    requestGeneration[lane] += 1;
  });
}

function beginRequest(lane: RequestLane): number {
  invalidateRequests(lane);
  return requestGeneration[lane];
}

function requestIsStale(lane: RequestLane, generation: number): boolean {
  return requestGeneration[lane] !== generation;
}

function usesWashingtonReferenceData(dataSource: SalesForgeDataSource): boolean {
  return dataSource === 'washington-reference' || isWashingtonLaunchDataEnabled();
}

function clearedDerivedData() {
  return {
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
    patchState: {} as Record<string, PatchStatus>,
    hoodStats: null,
    hoodStatsLoading: false,
    hoodStatsError: null,
    codeAudit: null,
    codeAuditLoading: false,
    codeAuditError: null,
  };
}

// ── State interface ───────────────────────────────────────────────────────────

interface SalesForgeState {
  // Explicit for Counties Hub handoffs; hosted/query public-package mode is
  // still honored by usesWashingtonReferenceData.
  dataSource: SalesForgeDataSource;

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

  // AI audit (Tab 0)
  selectedStratumKey: string | null;

  // County Studio handoff context (null when opened standalone).
  // Populated on mount when SalesForge receives a deeplink from the
  // Inspector's "Reconcile sales" button; drives the "Scoped From" chip.
  contextSegmentId: string | null;
  contextSegmentLabel: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────

  setDataSource: (dataSource: SalesForgeDataSource) => void;
  setActiveTab: (tab: SalesForgeTab) => void;
  setSelectedStratumKey: (key: string | null) => void;
  setTaxYear: (year: number) => void;
  setContextSegment: (segmentId: string | null, label?: string | null) => void;
  applyCountyStudioScope: (countyCode: string, hood?: string | null) => void;
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
  dataSource: 'live-api',
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

  selectedStratumKey: null,

  contextSegmentId: null,
  contextSegmentLabel: null,

  // ── Tab/page/filter actions ────────────────────────────────────────────────

  setDataSource: (dataSource) => {
    if (get().dataSource === dataSource) return;
    invalidateRequests(...ALL_REQUEST_LANES);
    set({ dataSource, ...clearedDerivedData() });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedStratumKey: (key) => set({ selectedStratumKey: key }),

  setTaxYear: (year) => {
    invalidateRequests(...ALL_REQUEST_LANES);
    set({
      taxYear: year,
      queuePage: 1,
      ...clearedDerivedData(),
    });
  },

  setContextSegment: (segmentId, label = null) =>
    set({ contextSegmentId: segmentId, contextSegmentLabel: label }),

  applyCountyStudioScope: (countyCode, hood = null) => {
    invalidateRequests(...ALL_REQUEST_LANES);
    set({
      filterForm: {
        ...EMPTY_FILTER_FORM,
        countyCode,
        hood: hood ?? '',
      },
      committedFilters: {
        ...EMPTY_COMMITTED,
        countyCode,
        hood,
      },
      queuePage: 1,
      ...clearedDerivedData(),
      selectedStratumKey: null,
      contextSegmentId: null,
      contextSegmentLabel: null,
    });
  },

  setQueueTab: (tab) => {
    invalidateRequests('queue', 'detail');
    set({
      queueTab: tab,
      queuePage: 1,
      queueData: null,
      queueLoading: false,
      queueError: null,
      selectedSaleId: null,
      saleDetail: null,
      detailLoading: false,
      detailError: null,
    });
  },

  setQueuePage: (page) => {
    invalidateRequests('queue', 'detail');
    set({
      queuePage: page,
      queueData: null,
      queueLoading: false,
      queueError: null,
      selectedSaleId: null,
      saleDetail: null,
      detailLoading: false,
      detailError: null,
    });
  },

  setFilterForm: (partial) =>
    set((s) => ({ filterForm: { ...s.filterForm, ...partial } })),

  applyFilters: () => {
    const { filterForm, committedFilters } = get();
    const toNum = (v: string) => {
      const n = parseFloat(v.replace(/,/g, ''));
      return isNaN(n) ? null : n;
    };
    invalidateRequests(...ALL_REQUEST_LANES);
    set({
      committedFilters: {
        // County is persistent workspace scope, not a disposable filter.
        // A blank form value must preserve the current explicit county.
        countyCode:    filterForm.countyCode.trim() || committedFilters.countyCode,
        hood:         filterForm.hood.trim() || null,
        propertyType: filterForm.propertyType.trim() || null,
        saleDateFrom: filterForm.saleDateFrom.trim() || null,
        saleDateTo:   filterForm.saleDateTo.trim() || null,
        minPrice:     toNum(filterForm.minPrice),
        maxPrice:     toNum(filterForm.maxPrice),
      },
      queuePage: 1,
      ...clearedDerivedData(),
      selectedStratumKey: null,
      contextSegmentId: null,
      contextSegmentLabel: null,
    });
  },

  clearFilters: () => {
    invalidateRequests(...ALL_REQUEST_LANES);
    set((state) => ({
      // Clear subordinate query filters while retaining county scope.
      filterForm: {
        ...EMPTY_FILTER_FORM,
        countyCode: state.committedFilters.countyCode,
      },
      committedFilters: {
        ...EMPTY_COMMITTED,
        countyCode: state.committedFilters.countyCode,
      },
      queuePage: 1,
      ...clearedDerivedData(),
      selectedStratumKey: null,
      contextSegmentId: null,
      contextSegmentLabel: null,
    }));
  },

  selectSale: (saleId) => {
    set({ selectedSaleId: saleId, saleDetail: null, detailError: null });
    void get().fetchSaleDetail(saleId);
  },

  clearSelection: () => {
    invalidateRequests('detail');
    set({
      selectedSaleId: null,
      saleDetail: null,
      detailLoading: false,
      detailError: null,
    });
  },

  // ── API fetches ────────────────────────────────────────────────────────────

  fetchQueue: async () => {
    const requestId = beginRequest('queue');
    const { taxYear, queueTab, queuePage, committedFilters } = get();
    const countyScope = getSalesForgeCountyScope();
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
    params.set('countyCode', committedFilters.countyCode);
    addCountyScopeParam(params, countyScope.countyId);

    try {
      const data = usesWashingtonReferenceData(get().dataSource)
        ? await fetchWashingtonLaunchQueue(taxYear, queueTab, queuePage, QUEUE_PAGE_SIZE, committedFilters)
        : await (async () => {
            const res = await apiFetch(`/terraforge/sale-qualification?${params}`, { headers: countyScope.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as SaleQueuePage;
          })();

      if (requestIsStale('queue', requestId)) return;

      // Page-clamp: if empty and not on page 1, step back.
      if (data.items.length === 0 && queuePage > 1) {
        const lastPage = Math.max(1, Math.ceil(data.total / QUEUE_PAGE_SIZE));
        set({ queuePage: lastPage, queueData: null, queueLoading: false });
        return;
      }

      set({ queueData: data, queueLoading: false });
    } catch (e) {
      if (requestIsStale('queue', requestId)) return;
      set({
        queueLoading: false,
        queueError: e instanceof Error ? e.message : 'Failed to load queue',
      });
    }
  },

  fetchSaleDetail: async (saleId) => {
    const requestId = beginRequest('detail');
    const { committedFilters } = get();
    const countyScope = getSalesForgeCountyScope();
    set({ detailLoading: true, detailError: null });
    try {
      const detail = usesWashingtonReferenceData(get().dataSource)
        ? await fetchWashingtonLaunchSaleDetail(saleId, committedFilters)
        : await (async () => {
            const params = new URLSearchParams();
            addCountyScopeParam(params, countyScope.countyId);
            const query = params.toString();
            const res = await apiFetch(`/terraforge/sale-qualification/${saleId}${query ? `?${query}` : ''}`, { headers: countyScope.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as SaleDetail;
          })();
      if (requestIsStale('detail', requestId)) return;
      set({ saleDetail: detail, detailLoading: false });
    } catch (e) {
      if (requestIsStale('detail', requestId)) return;
      set({
        detailLoading: false,
        detailError: e instanceof Error ? e.message : 'Failed to load detail',
      });
    }
  },

  fetchRunningStats: async () => {
    const requestId = beginRequest('stats');
    const { taxYear, committedFilters } = get();
    const countyScope = getSalesForgeCountyScope();
    set({ statsLoading: true, statsError: null });
    const params = new URLSearchParams({ taxYear: String(taxYear) });
    params.set('countyCode', committedFilters.countyCode);
    addCountyScopeParam(params, countyScope.countyId);
    if (committedFilters.hood)         params.set('hood',         committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    try {
      const stats = usesWashingtonReferenceData(get().dataSource)
        ? await fetchWashingtonLaunchRunningStats(taxYear, committedFilters)
        : await (async () => {
            const res = await apiFetch(`/terraforge/sale-qualification/running-stats?${params}`, { headers: countyScope.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as RunningStats;
          })();
      if (requestIsStale('stats', requestId)) return;
      set({ runningStats: stats, statsLoading: false });
    } catch (e) {
      if (requestIsStale('stats', requestId)) return;
      set({
        statsLoading: false,
        statsError: e instanceof Error ? e.message : 'Failed to load stats',
      });
    }
  },

  fetchHoodStats: async () => {
    const requestId = beginRequest('hoodStats');
    const { taxYear, committedFilters } = get();
    const countyScope = getSalesForgeCountyScope();
    set({ hoodStatsLoading: true, hoodStatsError: null });
    const params = new URLSearchParams({ taxYear: String(taxYear) });
    params.set('countyCode', committedFilters.countyCode);
    addCountyScopeParam(params, countyScope.countyId);
    if (committedFilters.hood)         params.set('hood',         committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    try {
      const stats = usesWashingtonReferenceData(get().dataSource)
        ? await fetchWashingtonLaunchNeighborhoodStats(taxYear, committedFilters)
        : await (async () => {
            const res = await apiFetch(`/terraforge/sale-qualification/neighborhood-stats?${params}`, { headers: countyScope.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as NeighborhoodStats;
          })();
      if (requestIsStale('hoodStats', requestId)) return;
      set({ hoodStats: stats, hoodStatsLoading: false });
    } catch (e) {
      if (requestIsStale('hoodStats', requestId)) return;
      set({
        hoodStatsLoading: false,
        hoodStatsError: e instanceof Error ? e.message : 'Failed to load neighborhood stats',
      });
    }
  },

  fetchCodeAudit: async () => {
    const requestId = beginRequest('codeAudit');
    const { taxYear, committedFilters } = get();
    const countyScope = getSalesForgeCountyScope();
    set({ codeAuditLoading: true, codeAuditError: null });
    const params = new URLSearchParams({ taxYear: String(taxYear) });
    params.set('countyCode', committedFilters.countyCode);
    addCountyScopeParam(params, countyScope.countyId);
    if (committedFilters.hood) params.set('hood', committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    try {
      const audit = usesWashingtonReferenceData(get().dataSource)
        ? await fetchWashingtonLaunchCodeAudit(taxYear, committedFilters)
        : await (async () => {
            const res = await apiFetch(`/terraforge/sale-qualification/code-audit?${params}`, { headers: countyScope.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as CodeAudit;
          })();
      if (requestIsStale('codeAudit', requestId)) return;
      set({ codeAudit: audit, codeAuditLoading: false });
    } catch (e) {
      if (requestIsStale('codeAudit', requestId)) return;
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
    const requestedCountyCode = get().committedFilters.countyCode;
    const decisionGeneration = requestGeneration.decision;
    const countyScope = getSalesForgeCountyScope();
    set((s) => ({ patchState: { ...s.patchState, [saleId]: 'working' } }));
    try {
      if (usesWashingtonReferenceData(get().dataSource)) {
        await patchWashingtonLaunchDecision(
          requestedCountyCode,
          saleId,
          decision,
          notes,
          decidedBy,
          decisionSource,
        );
      } else {
        const params = new URLSearchParams();
        addCountyScopeParam(params, countyScope.countyId);
        const query = params.toString();
        const res = await apiFetch(`/terraforge/sale-qualification/${saleId}${query ? `?${query}` : ''}`, {
          method: 'PATCH',
          headers: { ...countyScope.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qualificationDecision: decision,
            researchNotes: notes || null,
            decidedBy,
            decisionSource,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      if (requestIsStale('decision', decisionGeneration)) return;
      set((s) => ({ patchState: { ...s.patchState, [saleId]: 'done' } }));
      // Refresh queue + stats after decision.
      await get().fetchQueue();
      if (requestIsStale('decision', decisionGeneration)) return;
      void get().fetchRunningStats();
    } catch {
      if (requestIsStale('decision', decisionGeneration)) return;
      set((s) => ({ patchState: { ...s.patchState, [saleId]: 'error' } }));
    }
  },

  bulkDecision: async (saleIds, decision, notes, decidedBy) => {
    const requestedCountyCode = get().committedFilters.countyCode;
    const decisionGeneration = requestGeneration.decision;
    const countyScope = getSalesForgeCountyScope();
    // Mark all as working.
    set((s) => {
      const patch = { ...s.patchState };
      saleIds.forEach((id) => { patch[id] = 'working'; });
      return { patchState: patch };
    });
    try {
      if (usesWashingtonReferenceData(get().dataSource)) {
        await bulkPatchWashingtonLaunchDecision(
          requestedCountyCode,
          saleIds,
          decision,
          notes,
          decidedBy,
        );
      } else {
        const params = new URLSearchParams();
        addCountyScopeParam(params, countyScope.countyId);
        const query = params.toString();
        const res = await apiFetch(`/terraforge/sale-qualification/bulk${query ? `?${query}` : ''}`, {
          method: 'PATCH',
          headers: { ...countyScope.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleIds,
            qualificationDecision: decision,
            researchNotes: notes || null,
            decidedBy,
            decisionSource: 'StaffConfirmed',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      if (requestIsStale('decision', decisionGeneration)) return;
      set((s) => {
        const patch = { ...s.patchState };
        saleIds.forEach((id) => { patch[id] = 'done'; });
        return { patchState: patch };
      });
      await get().fetchQueue();
      if (requestIsStale('decision', decisionGeneration)) return;
      void get().fetchRunningStats();
    } catch {
      if (requestIsStale('decision', decisionGeneration)) return;
      set((s) => {
        const patch = { ...s.patchState };
        saleIds.forEach((id) => { patch[id] = 'error'; });
        return { patchState: patch };
      });
    }
  },
}));

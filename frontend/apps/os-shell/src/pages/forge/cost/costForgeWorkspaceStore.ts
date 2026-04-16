/**
 * costForgeWorkspaceStore.ts
 * Global workspace state for CostForge audit-diagnose-fix workflow.
 * Persists active tab, selected neighborhood, and selected parcel across renders.
 */
import { create } from 'zustand';
import { apiFetch } from '@/lib/apiBase';

export type CostForgeTab =
  | 'triage'
  | 'hood-audit'
  | 'calibration'
  | 'parcel'
  | 'depreciation'
  | 'data-quality'
  | 'schedule'
  | 'calc-trace';

export interface DashboardStats {
  totalParcels: number;
  avgCostPerSqft: number | null;
  avgPctGood: number | null;
  weightedMedianRatio: number | null;
  avgCod: number | null;
  hoodsOutOfCompliance: number;
  qualifiedSalesCount: number;
}

interface CostForgeWorkspaceState {
  activeTab: CostForgeTab;
  selectedHoodCd: string | null;
  selectedParcelId: string | null;
  taxYear: number;
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  setActiveTab(tab: CostForgeTab): void;
  setSelectedHood(hoodCd: string | null): void;
  setSelectedParcel(parcelId: string | null): void;
  /** Navigate to hood-audit tab for the given neighborhood */
  drillIntoHood(hoodCd: string): void;
  /** Navigate to parcel tab for the given parcel */
  drillIntoParcel(parcelId: string): void;
  fetchDashboardStats(signal?: AbortSignal): Promise<void>;
}

export const useCostForgeWorkspaceStore = create<CostForgeWorkspaceState>((set, get) => ({
  activeTab: 'triage',
  selectedHoodCd: null,
  selectedParcelId: null,
  taxYear: 2026,
  dashboardStats: null,
  dashboardLoading: false,
  dashboardError: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedHood: (hoodCd) => set({ selectedHoodCd: hoodCd }),
  setSelectedParcel: (parcelId) => set({ selectedParcelId: parcelId }),

  drillIntoHood: (hoodCd) => set({ selectedHoodCd: hoodCd, activeTab: 'hood-audit' }),
  drillIntoParcel: (parcelId) => set({ selectedParcelId: parcelId, activeTab: 'parcel' }),

  fetchDashboardStats: async (signal) => {
    const { taxYear } = get();
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const data = await apiFetch<DashboardStats>(
        `/costforge/dashboard-stats?taxYear=${taxYear}`,
        { signal }
      );
      set({ dashboardStats: data, dashboardLoading: false });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ dashboardLoading: false });
        return;
      }
      set({
        dashboardError: err instanceof Error ? err.message : 'Failed to load stats',
        dashboardLoading: false,
      });
    }
  },
}));

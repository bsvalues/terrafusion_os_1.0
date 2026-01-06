import { create } from 'zustand';

export interface KPI {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  status: 'verified' | 'pending' | 'anomaly';
  trend?: number[]; // For sparkline
}

interface MetricsStore {
  kpis: KPI[];
  status: 'idle' | 'loading' | 'ok' | 'error';
  error: string | null;

  setKpis: (kpis: KPI[]) => void;
  setStatus: (status: MetricsStore['status']) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  kpis: [],
  status: 'idle',
  error: null,

  setKpis: (kpis) => set({ kpis }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 618));

      // Mock Data
      const mockData: KPI[] = [
        { id: '1', label: 'System Health', value: '99.9%', status: 'verified', delta: '+0.1%' },
        { id: '2', label: 'Active Agents', value: '1,008', status: 'verified', delta: '+12' },
        { id: '3', label: 'Cost Savings', value: '$4.2M', status: 'verified', delta: '+5%' }, // Costforge
        { id: '4', label: 'Threats Blocked', value: '0', status: 'verified' },
      ];

      set({ kpis: mockData, status: 'ok' });
    } catch (e) {
      set({ status: 'error', error: 'Failed to fetch metrics' });
    }
  },
}));

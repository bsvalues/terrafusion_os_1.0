/**
 * Dashboard Redux Slice
 * Elite Power User - Dashboard State Management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DashboardState, DashboardPanel } from '../../types/pacs';

const initialState: DashboardState = {
  selectedMetrics: ['totalAccounts', 'totalProperties', 'totalPayments', 'activeWorkflows'],
  layout: {
    panels: [],
  },
  refreshInterval: 5000,
  realTimeEnabled: true,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedMetrics: (state, action: PayloadAction<string[]>) => {
      state.selectedMetrics = action.payload;
    },
    setLayout: (state, action: PayloadAction<{ panels: DashboardPanel[] }>) => {
      state.layout = action.payload;
    },
    addPanel: (state, action: PayloadAction<DashboardPanel>) => {
      state.layout.panels.push(action.payload);
    },
    removePanel: (state, action: PayloadAction<string>) => {
      state.layout.panels = state.layout.panels.filter((p) => p.id !== action.payload);
    },
    updatePanel: (state, action: PayloadAction<{ id: string; panel: Partial<DashboardPanel> }>) => {
      const index = state.layout.panels.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.layout.panels[index] = { ...state.layout.panels[index], ...action.payload.panel };
      }
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    setRealTimeEnabled: (state, action: PayloadAction<boolean>) => {
      state.realTimeEnabled = action.payload;
    },
    resetDashboard: () => initialState,
  },
});

export const {
  setSelectedMetrics,
  setLayout,
  addPanel,
  removePanel,
  updatePanel,
  setRefreshInterval,
  setRealTimeEnabled,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;


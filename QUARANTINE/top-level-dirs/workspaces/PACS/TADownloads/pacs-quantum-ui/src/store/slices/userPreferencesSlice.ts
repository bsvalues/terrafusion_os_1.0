/**
 * User Preferences Redux Slice
 * Elite Power User - Personalization State Management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserPreferences, CustomMetric, SavedQuery, QueryTemplate, WorkflowTemplate } from '../../types/pacs';

const initialState: UserPreferences = {
  theme: 'dark',
  dashboardLayout: {
    panels: [],
  },
  keyboardShortcuts: {
    'Ctrl+K': 'search',
    'Ctrl+Q': 'query',
    'Ctrl+D': 'dashboard',
    'Ctrl+S': 'save',
    'Ctrl+/': 'help',
  },
  defaultRefreshInterval: 5000,
  customMetrics: [],
  savedQueries: [],
  queryTemplates: [],
  workflowTemplates: [],
};

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    updateTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    updateDashboardLayout: (state, action: PayloadAction<Partial<{ panels: any[]; compactMode?: boolean; showStatisticalBreakdown?: boolean; showCorrelationMatrix?: boolean; showLiveCharts?: boolean; autoRefresh?: boolean; showNotifications?: boolean }>>) => {
      state.dashboardLayout = { ...state.dashboardLayout, ...action.payload };
    },
    setKeyboardShortcut: (state, action: PayloadAction<{ key: string; action: string }>) => {
      state.keyboardShortcuts[action.payload.key] = action.payload.action;
    },
    removeKeyboardShortcut: (state, action: PayloadAction<string>) => {
      delete state.keyboardShortcuts[action.payload];
    },
    setDefaultRefreshInterval: (state, action: PayloadAction<number>) => {
      state.defaultRefreshInterval = action.payload;
    },
    addCustomMetric: (state, action: PayloadAction<CustomMetric>) => {
      state.customMetrics.push(action.payload);
    },
    updateCustomMetric: (state, action: PayloadAction<{ id: string; metric: Partial<CustomMetric> }>) => {
      const index = state.customMetrics.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.customMetrics[index] = { ...state.customMetrics[index], ...action.payload.metric };
      }
    },
    removeCustomMetric: (state, action: PayloadAction<string>) => {
      state.customMetrics = state.customMetrics.filter((m) => m.id !== action.payload);
    },
    addSavedQuery: (state, action: PayloadAction<SavedQuery>) => {
      state.savedQueries.push(action.payload);
    },
    updateSavedQuery: (state, action: PayloadAction<{ id: string; query: Partial<SavedQuery> }>) => {
      const index = state.savedQueries.findIndex((q) => q.id === action.payload.id);
      if (index !== -1) {
        state.savedQueries[index] = { ...state.savedQueries[index], ...action.payload.query };
        state.savedQueries[index].lastExecuted = new Date();
        state.savedQueries[index].executionCount += 1;
      }
    },
    removeSavedQuery: (state, action: PayloadAction<string>) => {
      state.savedQueries = state.savedQueries.filter((q) => q.id !== action.payload);
    },
    addQueryTemplate: (state, action: PayloadAction<QueryTemplate>) => {
      if (!state.queryTemplates) state.queryTemplates = [];
      state.queryTemplates.push(action.payload);
    },
    removeQueryTemplate: (state, action: PayloadAction<string>) => {
      if (state.queryTemplates) {
        state.queryTemplates = state.queryTemplates.filter((t) => t.id !== action.payload);
      }
    },
    addWorkflowTemplate: (state, action: PayloadAction<WorkflowTemplate>) => {
      if (!state.workflowTemplates) state.workflowTemplates = [];
      state.workflowTemplates.push(action.payload);
    },
    removeWorkflowTemplate: (state, action: PayloadAction<string>) => {
      if (state.workflowTemplates) {
        state.workflowTemplates = state.workflowTemplates.filter((t) => t.id !== action.payload);
      }
    },
    updateKeyboardShortcuts: (state, action: PayloadAction<Record<string, string>>) => {
      state.keyboardShortcuts = { ...state.keyboardShortcuts, ...action.payload };
    },
    resetPreferences: () => initialState,
  },
});

export const {
  setTheme,
  updateTheme,
  updateDashboardLayout,
  setKeyboardShortcut,
  removeKeyboardShortcut,
  updateKeyboardShortcuts,
  setDefaultRefreshInterval,
  addCustomMetric,
  updateCustomMetric,
  removeCustomMetric,
  addSavedQuery,
  updateSavedQuery,
  removeSavedQuery,
  addQueryTemplate,
  removeQueryTemplate,
  addWorkflowTemplate,
  removeWorkflowTemplate,
  resetPreferences,
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;


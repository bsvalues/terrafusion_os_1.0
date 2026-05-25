import {
  mockCurrentUseOverview,
  mockEvidenceItems,
  mockTimelineEvents,
} from '../data/currentUseMockAdapter';
import { calculateRollback } from '../domain/rollback/rollbackEngine';
import type {
  CurrentUseEvidenceItem,
  CurrentUseParcelOverview,
  CurrentUseTimelineEvent,
} from '../types/currentUseTypes';
import type {
  RollbackCalculationInput,
  RollbackCalculationResult,
} from '../domain/rollback/rollbackTypes';

const USE_MOCK_CURRENT_USE = true;

interface CurrentUseApi {
  getOverview(parcelId: string): Promise<CurrentUseParcelOverview>;
  getEvidence(parcelId: string): Promise<CurrentUseEvidenceItem[]>;
  getTimeline(parcelId: string): Promise<CurrentUseTimelineEvent[]>;
  calculateRollback(input: RollbackCalculationInput): Promise<RollbackCalculationResult>;
}

const mockCurrentUseApi: CurrentUseApi = {
  async getOverview(parcelId) {
    return { ...mockCurrentUseOverview, parcelId };
  },

  async getEvidence(parcelId) {
    return mockEvidenceItems.map((item) => ({ ...item, parcelId }));
  },

  async getTimeline(parcelId) {
    return mockTimelineEvents.map((event) => ({ ...event, parcelId }));
  },

  async calculateRollback(input) {
    return calculateRollback(input);
  },
};

const realCurrentUseApi: CurrentUseApi = {
  async getOverview(parcelId) {
    const response = await fetch(`/api/forge/current-use/parcels/${parcelId}/overview`);
    if (!response.ok) throw new Error('Failed to load Current Use overview.');
    return response.json();
  },

  async getEvidence(parcelId) {
    const response = await fetch(`/api/forge/current-use/parcels/${parcelId}/evidence`);
    if (!response.ok) throw new Error('Failed to load Current Use evidence.');
    return response.json();
  },

  async getTimeline(parcelId) {
    const response = await fetch(`/api/forge/current-use/parcels/${parcelId}/timeline`);
    if (!response.ok) throw new Error('Failed to load Current Use timeline.');
    return response.json();
  },

  async calculateRollback(input) {
    const response = await fetch('/api/forge/current-use/rollback/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to calculate Current Use rollback.');
    return response.json();
  },
};

export const currentUseApi: CurrentUseApi = USE_MOCK_CURRENT_USE
  ? mockCurrentUseApi
  : realCurrentUseApi;

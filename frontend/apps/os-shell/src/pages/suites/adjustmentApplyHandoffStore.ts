import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdjustmentApplyHandoffStatus = 'Prepared' | 'Opened';

export interface AdjustmentApplyHandoff {
  adjustmentSetId: string;
  scenarioId: string;
  studyId: string;
  status: AdjustmentApplyHandoffStatus;
  preparedAt: string;
  updatedAt: string;
}

interface AdjustmentApplyHandoffState {
  handoffs: Record<string, AdjustmentApplyHandoff>;
  prepareHandoff: (handoff: {
    adjustmentSetId: string;
    scenarioId: string;
    studyId: string;
  }) => void;
  markOpened: (adjustmentSetId: string) => void;
  clearHandoff: (adjustmentSetId: string) => void;
}

export const useAdjustmentApplyHandoffStore = create<AdjustmentApplyHandoffState>()(
  persist(
    (set) => ({
      handoffs: {},

      prepareHandoff: ({ adjustmentSetId, scenarioId, studyId }) =>
        set((state) => {
          const existing = state.handoffs[adjustmentSetId];
          const now = new Date().toISOString();
          return {
            handoffs: {
              ...state.handoffs,
              [adjustmentSetId]: {
                adjustmentSetId,
                scenarioId,
                studyId,
                status: existing?.status ?? 'Prepared',
                preparedAt: existing?.preparedAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),

      markOpened: (adjustmentSetId) =>
        set((state) => {
          const existing = state.handoffs[adjustmentSetId];
          if (!existing) return state;
          return {
            handoffs: {
              ...state.handoffs,
              [adjustmentSetId]: {
                ...existing,
                status: 'Opened',
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      clearHandoff: (adjustmentSetId) =>
        set((state) => {
          const { [adjustmentSetId]: _removed, ...rest } = state.handoffs;
          return { handoffs: rest };
        }),
    }),
    {
      name: 'terrafusion-adjustment-apply-handoffs',
      version: 1,
      partialize: (state) => ({ handoffs: state.handoffs }),
    },
  ),
);

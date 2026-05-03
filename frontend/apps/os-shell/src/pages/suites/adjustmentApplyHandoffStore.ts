import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CountyApplyHandoffReceiptDto, CountyApplyHandoffReceiptStatus } from '../forge/county-studio/countyStudyApi';

export type AdjustmentApplyHandoffStatus = CountyApplyHandoffReceiptStatus;

export interface AdjustmentApplyHandoff {
  adjustmentSetId: string;
  scenarioId: string;
  studyId: string;
  status: AdjustmentApplyHandoffStatus;
  preparedAt: string;
  updatedAt: string;
  evidenceRef?: string | null;
  notes?: string | null;
}

interface AdjustmentApplyHandoffState {
  handoffs: Record<string, AdjustmentApplyHandoff>;
  prepareHandoff: (handoff: {
    adjustmentSetId: string;
    scenarioId: string;
    studyId: string;
  }) => void;
  ingestReceipt: (receipt: CountyApplyHandoffReceiptDto) => void;
  ingestReceipts: (receipts: CountyApplyHandoffReceiptDto[]) => void;
  replaceReceiptsForStudy: (studyId: string, receipts: CountyApplyHandoffReceiptDto[]) => void;
  markOpened: (adjustmentSetId: string) => void;
  markAppliedExternally: (adjustmentSetId: string, evidenceRef: string, notes?: string) => void;
  markRolledBack: (adjustmentSetId: string, notes: string, evidenceRef?: string) => void;
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

      ingestReceipt: (receipt) =>
        set((state) => {
          const existing = state.handoffs[receipt.adjustmentSetId];
          return {
            handoffs: {
              ...state.handoffs,
              [receipt.adjustmentSetId]: {
                adjustmentSetId: receipt.adjustmentSetId,
                scenarioId: receipt.scenarioId,
                studyId: receipt.studyId,
                status: receipt.status,
                preparedAt: existing?.preparedAt ?? receipt.preparedAt,
                updatedAt: receipt.updatedAt,
                evidenceRef: receipt.evidenceRef,
                notes: receipt.notes,
              },
            },
          };
        }),

      ingestReceipts: (receipts) =>
        set((state) => {
          const next = { ...state.handoffs };
          for (const receipt of receipts) {
            const existing = next[receipt.adjustmentSetId];
            next[receipt.adjustmentSetId] = {
              adjustmentSetId: receipt.adjustmentSetId,
              scenarioId: receipt.scenarioId,
              studyId: receipt.studyId,
              status: receipt.status,
              preparedAt: existing?.preparedAt ?? receipt.preparedAt,
              updatedAt: receipt.updatedAt,
              evidenceRef: receipt.evidenceRef,
              notes: receipt.notes,
            };
          }
          return { handoffs: next };
        }),

      replaceReceiptsForStudy: (studyId, receipts) =>
        set((state) => {
          const receiptIds = new Set(receipts.map((receipt) => receipt.adjustmentSetId));
          const next: Record<string, AdjustmentApplyHandoff> = {};

          for (const [adjustmentSetId, handoff] of Object.entries(state.handoffs)) {
            if (handoff.studyId !== studyId || receiptIds.has(adjustmentSetId)) {
              next[adjustmentSetId] = handoff;
            }
          }

          for (const receipt of receipts) {
            const existing = next[receipt.adjustmentSetId];
            next[receipt.adjustmentSetId] = {
              adjustmentSetId: receipt.adjustmentSetId,
              scenarioId: receipt.scenarioId,
              studyId: receipt.studyId,
              status: receipt.status,
              preparedAt: existing?.preparedAt ?? receipt.preparedAt,
              updatedAt: receipt.updatedAt,
              evidenceRef: receipt.evidenceRef,
              notes: receipt.notes,
            };
          }

          return { handoffs: next };
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

      markAppliedExternally: (adjustmentSetId, evidenceRef, notes) =>
        set((state) => {
          const existing = state.handoffs[adjustmentSetId];
          if (!existing) return state;
          return {
            handoffs: {
              ...state.handoffs,
              [adjustmentSetId]: {
                ...existing,
                status: 'AppliedExternally',
                evidenceRef,
                notes: notes ?? existing.notes,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      markRolledBack: (adjustmentSetId, notes, evidenceRef) =>
        set((state) => {
          const existing = state.handoffs[adjustmentSetId];
          if (!existing) return state;
          return {
            handoffs: {
              ...state.handoffs,
              [adjustmentSetId]: {
                ...existing,
                status: 'RolledBack',
                evidenceRef: evidenceRef ?? existing.evidenceRef,
                notes,
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

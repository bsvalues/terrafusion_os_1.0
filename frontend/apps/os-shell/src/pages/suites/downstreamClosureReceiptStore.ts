import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DownstreamDestination = 'Dais' | 'Dossier';
export type DownstreamReceiptStatus = 'Drafted' | 'Opened' | 'Returned';

export interface DownstreamClosureReceipt {
  exceptionSetId: string;
  destination: DownstreamDestination;
  template: string;
  segmentId: string;
  segmentLabel: string;
  status: DownstreamReceiptStatus;
  draftedAt: string;
  updatedAt: string;
}

interface DownstreamClosureReceiptState {
  receipts: Record<string, DownstreamClosureReceipt>;
  ingestReceipt: (receipt: DownstreamClosureReceipt) => void;
  ingestReceipts: (receipts: DownstreamClosureReceipt[]) => void;
  recordDraft: (receipt: {
    exceptionSetId: string;
    destination: DownstreamDestination;
    template: string;
    segmentId: string;
    segmentLabel: string;
  }) => void;
  markOpened: (exceptionSetId: string) => void;
  markReturned: (exceptionSetId: string) => void;
  clearReceipt: (exceptionSetId: string) => void;
}

function transitionReceipt(
  receipt: DownstreamClosureReceipt | undefined,
  status: DownstreamReceiptStatus,
): DownstreamClosureReceipt | undefined {
  if (!receipt) return undefined;
  return {
    ...receipt,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export const useDownstreamClosureReceiptStore = create<DownstreamClosureReceiptState>()(
  persist(
    (set) => ({
      receipts: {},

      ingestReceipt: (receipt) =>
        set((state) => ({
          receipts: {
            ...state.receipts,
            [receipt.exceptionSetId]: receipt,
          },
        })),

      ingestReceipts: (receipts) =>
        set((state) => ({
          receipts: {
            ...state.receipts,
            ...Object.fromEntries(receipts.map((receipt) => [receipt.exceptionSetId, receipt])),
          },
        })),

      recordDraft: ({ exceptionSetId, destination, template, segmentId, segmentLabel }) =>
        set((state) => {
          const existing = state.receipts[exceptionSetId];
          const now = new Date().toISOString();
          return {
            receipts: {
              ...state.receipts,
              [exceptionSetId]: {
                exceptionSetId,
                destination,
                template,
                segmentId,
                segmentLabel: segmentLabel || segmentId,
                status: existing?.status ?? 'Drafted',
                draftedAt: existing?.draftedAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),

      markOpened: (exceptionSetId) =>
        set((state) => {
          const updated = transitionReceipt(state.receipts[exceptionSetId], 'Opened');
          if (!updated) return state;
          return {
            receipts: {
              ...state.receipts,
              [exceptionSetId]: updated,
            },
          };
        }),

      markReturned: (exceptionSetId) =>
        set((state) => {
          const updated = transitionReceipt(state.receipts[exceptionSetId], 'Returned');
          if (!updated) return state;
          return {
            receipts: {
              ...state.receipts,
              [exceptionSetId]: updated,
            },
          };
        }),

      clearReceipt: (exceptionSetId) =>
        set((state) => {
          const { [exceptionSetId]: _removed, ...rest } = state.receipts;
          return { receipts: rest };
        }),
    }),
    {
      name: 'terrafusion-downstream-closure-receipts',
      version: 1,
      partialize: (state) => ({
        receipts: state.receipts,
      }),
    },
  ),
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DownstreamDestination = 'Dais' | 'Dossier';
export type DownstreamReceiptStatus = 'Drafted' | 'Opened' | 'Returned';

export interface DownstreamClosureReceipt {
  receiptId?: string;
  exceptionSetId?: string | null;
  sourceType?: 'ExceptionQueue' | 'SegmentInspector';
  destination: DownstreamDestination;
  template: string;
  segmentId: string;
  segmentLabel: string;
  status: DownstreamReceiptStatus;
  downstreamEntityId?: string | null;
  evidenceRef?: string | null;
  notes?: string | null;
  draftedAt: string;
  updatedAt: string;
}

interface DownstreamClosureReceiptState {
  receipts: Record<string, DownstreamClosureReceipt>;
  ingestReceipt: (receipt: DownstreamClosureReceipt) => void;
  ingestReceipts: (receipts: DownstreamClosureReceipt[]) => void;
  recordDraft: (receipt: {
    receiptId?: string;
    exceptionSetId?: string | null;
    sourceType?: 'ExceptionQueue' | 'SegmentInspector';
    destination: DownstreamDestination;
    template: string;
    segmentId: string;
    segmentLabel: string;
  }) => void;
  markOpened: (receiptKey: string) => void;
  markReturned: (receiptKey: string) => void;
  clearReceipt: (receiptKey: string) => void;
}

export function downstreamReceiptKey(receipt: Pick<DownstreamClosureReceipt, 'receiptId' | 'exceptionSetId'>): string {
  return receipt.exceptionSetId ?? receipt.receiptId ?? '';
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
            [downstreamReceiptKey(receipt)]: receipt,
          },
        })),

      ingestReceipts: (receipts) =>
        set((state) => ({
          receipts: {
            ...state.receipts,
            ...Object.fromEntries(receipts
              .map((receipt) => [downstreamReceiptKey(receipt), receipt])
              .filter(([key]) => key)),
          },
        })),

      recordDraft: ({ receiptId, exceptionSetId, sourceType, destination, template, segmentId, segmentLabel }) =>
        set((state) => {
          const key = exceptionSetId ?? receiptId;
          if (!key) return state;
          const existing = state.receipts[key];
          const now = new Date().toISOString();
          return {
            receipts: {
              ...state.receipts,
              [key]: {
                receiptId,
                exceptionSetId,
                sourceType,
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

      markOpened: (receiptKey) =>
        set((state) => {
          const updated = transitionReceipt(state.receipts[receiptKey], 'Opened');
          if (!updated) return state;
          return {
            receipts: {
              ...state.receipts,
              [receiptKey]: updated,
            },
          };
        }),

      markReturned: (receiptKey) =>
        set((state) => {
          const updated = transitionReceipt(state.receipts[receiptKey], 'Returned');
          if (!updated) return state;
          return {
            receipts: {
              ...state.receipts,
              [receiptKey]: updated,
            },
          };
        }),

      clearReceipt: (receiptKey) =>
        set((state) => {
          const { [receiptKey]: _removed, ...rest } = state.receipts;
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

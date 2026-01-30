import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncItem {
  id: string;
  storeName: string;
  action: string;
  payload: any;
  timestamp: number;
}

interface SyncState {
  status: SyncStatus;
  pendingQueue: SyncItem[];
  lastSynced: number | null;

  addToQueue: (item: Omit<SyncItem, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  setStatus: (status: SyncStatus) => void;
  setLastSynced: (timestamp: number) => void;
}

export const useSyncStore = create<SyncState>()(
  devtools((set) => ({
    status: 'idle',
    pendingQueue: [],
    lastSynced: null,

    addToQueue: (item) =>
      set((state) => ({
        pendingQueue: [
          ...state.pendingQueue,
          {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          },
        ],
      })),

    removeFromQueue: (id) =>
      set((state) => ({
        pendingQueue: state.pendingQueue.filter((i) => i.id !== id),
      })),

    setStatus: (status) => set({ status }),
    setLastSynced: (timestamp) => set({ lastSynced: timestamp }),
  }))
);

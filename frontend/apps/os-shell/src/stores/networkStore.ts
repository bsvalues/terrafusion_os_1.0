import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface NetworkState {
  isOnline: boolean;
  setOnline: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>()(
  devtools((set) => ({
    isOnline: navigator.onLine,
    setOnline: (status) => set({ isOnline: status }),
  }))
);

// Setup listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useNetworkStore.getState().setOnline(true));
  window.addEventListener('offline', () => useNetworkStore.getState().setOnline(false));
}

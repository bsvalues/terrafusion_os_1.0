import { useNetworkStore } from '../stores/networkStore';
import { useStartMenuStore } from '../stores/startMenuStore';
import { useSyncStore } from '../stores/syncStore';
import { useThemeStore } from '../stores/themeStore';
import logger from '../utils/logger';

const CHANNEL_NAME = 'terrafusion_sync_channel';

class SyncService {
  private channel: BroadcastChannel | null = null;
  private isInitialized = false;
  public isApplyingSync = false;

  constructor() {
    // Channel initialized in init() to allow for mocking/lazy loading
  }

  public init() {
    if (this.isInitialized) return;

    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = this.handleMessage.bind(this);

    // Listen for online status to process queue
    useNetworkStore.subscribe((state) => {
      if (state.isOnline) {
        this.processQueue();
      }
    });

    this.isInitialized = true;
    logger.info('SyncService initialized');
  }

  public broadcast(storeName: string, action: string, payload: any) {
    const isOnline = useNetworkStore.getState().isOnline;

    if (isOnline) {
      // Send immediately
      if (this.channel) {
        this.channel.postMessage({ storeName, action, payload, timestamp: Date.now() });
      }
      useSyncStore.getState().setLastSynced(Date.now());
      useSyncStore.getState().setStatus('syncing');
      setTimeout(() => useSyncStore.getState().setStatus('idle'), 500);
    } else {
      // Queue for later
      useSyncStore.getState().addToQueue({ storeName, action, payload });
    }
  }

  private handleMessage(event: MessageEvent) {
    const { storeName, action, payload } = event.data;
    logger.debug(`[Sync] Received update for ${storeName}: ${action}`, payload);

    this.isApplyingSync = true;

    // Apply updates to local stores
    // Note: We need to be careful not to create infinite loops.
    // The stores should have a way to apply updates without triggering a broadcast.

    try {
      switch (storeName) {
        case 'theme':
          if (action === 'setTheme') {
            useThemeStore.setState({ theme: payload });
          }
          break;
        case 'startMenu':
          if (action === 'setPinnedApps') {
            useStartMenuStore.setState({ pinnedApps: payload });
          } else if (action === 'pinApp') {
            // Direct state manipulation to avoid triggering another broadcast if we were hooking into actions
            useStartMenuStore.setState((state) => ({
              pinnedApps: [...state.pinnedApps, payload],
            }));
          } else if (action === 'unpinApp') {
            useStartMenuStore.setState((state) => ({
              pinnedApps: state.pinnedApps.filter((appId) => appId !== payload),
            }));
          }
          break;
      }
    } finally {
      this.isApplyingSync = false;
    }

    useSyncStore.getState().setLastSynced(Date.now());
  }

  private processQueue() {
    const queue = useSyncStore.getState().pendingQueue;
    if (queue.length === 0) return;

    logger.info(`[Sync] Processing ${queue.length} offline items`);
    useSyncStore.getState().setStatus('syncing');

    queue.forEach((item) => {
      if (this.channel) {
        this.channel.postMessage({
          storeName: item.storeName,
          action: item.action,
          payload: item.payload,
          timestamp: Date.now(),
        });
      }
      useSyncStore.getState().removeFromQueue(item.id);
    });

    useSyncStore.getState().setLastSynced(Date.now());
    useSyncStore.getState().setStatus('idle');
  }
}

export const syncService = new SyncService();

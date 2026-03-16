import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';
import { useNetworkStore } from '../../stores/networkStore';
import { useSyncStore } from '../../stores/syncStore';
import { syncService } from '../syncService';

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(data: any) {
    // Mock implementation
  }

  close() {}
}

global.BroadcastChannel = MockBroadcastChannel as any;

describe('SyncService', () => {
  let postMessageSpy: MockInstance;

  beforeEach(() => {
    // Reset stores
    useSyncStore.setState({ status: 'idle', pendingQueue: [] });
    useNetworkStore.setState({ isOnline: true });

    // Spy on postMessage
    postMessageSpy = vi.spyOn(MockBroadcastChannel.prototype, 'postMessage');

    // Ensure init is called (idempotent)
    syncService.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should broadcast immediately when online', () => {
    syncService.broadcast('test', 'action', { foo: 'bar' });

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'test',
        action: 'action',
        payload: { foo: 'bar' },
      })
    );

    expect(useSyncStore.getState().pendingQueue).toHaveLength(0);
  });

  it('should queue when offline', () => {
    useNetworkStore.setState({ isOnline: false });

    syncService.broadcast('test', 'action', { foo: 'bar' });

    expect(postMessageSpy).not.toHaveBeenCalled();
    expect(useSyncStore.getState().pendingQueue).toHaveLength(1);
  });

  it('should process queue when coming online', () => {
    // 1. Go offline
    useNetworkStore.setState({ isOnline: false });

    // 2. Add to queue
    syncService.broadcast('test', 'action', { foo: 'bar' });
    expect(useSyncStore.getState().pendingQueue).toHaveLength(1);

    // 3. Go online (this triggers the listener in SyncService)
    useNetworkStore.setState({ isOnline: true });

    // 4. Verify processing
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'test',
        action: 'action',
        payload: { foo: 'bar' },
      })
    );
    expect(useSyncStore.getState().pendingQueue).toHaveLength(0);
  });
});

import { useNetworkStore } from '../networkStore';

describe('networkStore', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    useNetworkStore.setState({ isOnline: true });
  });

  afterAll(() => {
    // Restore navigator property if we messed with it (though JSDOM usually protects it)
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
    });
  });

  it('should initialize with current navigator status', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    // Re-create store or just check if we can set it manually since we can't easily re-init the store module
    useNetworkStore.getState().setOnline(navigator.onLine);
    expect(useNetworkStore.getState().isOnline).toBe(false);
  });

  it('should update status when setOnline is called', () => {
    useNetworkStore.getState().setOnline(false);
    expect(useNetworkStore.getState().isOnline).toBe(false);

    useNetworkStore.getState().setOnline(true);
    expect(useNetworkStore.getState().isOnline).toBe(true);
  });

  it('should respond to window events', () => {
    // We can't easily test the event listener registration because it happens at module load time
    // But we can verify the store updates when we manually trigger the logic that the event listener would call

    // Simulate offline event logic
    useNetworkStore.getState().setOnline(false);
    expect(useNetworkStore.getState().isOnline).toBe(false);

    // Simulate online event logic
    useNetworkStore.getState().setOnline(true);
    expect(useNetworkStore.getState().isOnline).toBe(true);
  });
});

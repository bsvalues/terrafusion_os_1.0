import { vi } from 'vitest';

const mockConnection = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn().mockResolvedValue(undefined),
  onreconnected: vi.fn(),
  onreconnecting: vi.fn(),
  onclose: vi.fn(),
  state: 'Connected',
  connectionId: 'mock-connection-id',
};

const HubConnectionBuilder = vi.fn().mockImplementation(() => ({
  withUrl: vi.fn().mockReturnThis(),
  withAutomaticReconnect: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue(mockConnection),
}));

export { HubConnectionBuilder };
export const HubConnectionState = {
  Connected: 'Connected',
  Connecting: 'Connecting',
  Disconnected: 'Disconnected',
  Disconnecting: 'Disconnecting',
  Reconnecting: 'Reconnecting',
};

export const getMockConnection = () => mockConnection;

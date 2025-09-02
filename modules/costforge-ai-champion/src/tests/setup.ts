import { beforeEach, vi } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// Setup DOM globals
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
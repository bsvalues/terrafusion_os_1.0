import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRuntimeActivity,
  defaultWorkspaceActivityProvider,
  getWorkspaceActivityProvider,
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('WorkspaceActivityProvider', () => {
  beforeEach(() => {
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  describe('getRecentActivity', () => {
    it('default provider returns default items for unknown workspace', async () => {
      const provider = defaultWorkspaceActivityProvider;
      const items = await provider.getRecentActivity('nonexistent-workspace');

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('id');
      expect(items[0]).toHaveProperty('summary');
      expect(items[0]).toHaveProperty('timestamp');
      expect(items[0]).toHaveProperty('type');
    });

    it('default provider returns workspace-specific items when available', async () => {
      const provider = defaultWorkspaceActivityProvider;
      const items = await provider.getRecentActivity('home');

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      // Home workspace should have home-specific events
      expect(items.some((item) => item.id.startsWith('home-'))).toBe(true);
    });

    it('respects limit option', async () => {
      const provider = defaultWorkspaceActivityProvider;
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items).toHaveLength(1);
    });

    it('returns items newest first', async () => {
      const provider = defaultWorkspaceActivityProvider;

      // Record some activity with known order
      await provider.recordActivity('test-order', {
        summary: 'First event',
        type: 'info',
        kind: 'user_action',
      });
      await provider.recordActivity('test-order', {
        summary: 'Second event',
        type: 'info',
        kind: 'user_action',
      });

      const items = await provider.getRecentActivity('test-order', { limit: 10 });

      // Newest (second) should be first
      expect(items[0].summary).toBe('Second event');
      expect(items[1].summary).toBe('First event');
    });
  });

  describe('recordActivity', () => {
    it('records activity to workspace', async () => {
      const provider = defaultWorkspaceActivityProvider;

      await provider.recordActivity('test-workspace', {
        summary: 'Test action',
        type: 'info',
        kind: 'user_action',
        source: 'Test',
      });

      const items = await provider.getRecentActivity('test-workspace', { limit: 1 });

      expect(items[0].summary).toBe('Test action');
      expect(items[0].source).toBe('Test');
      expect(items[0].kind).toBe('user_action');
    });

    it('generates unique IDs for recorded activity', async () => {
      const provider = defaultWorkspaceActivityProvider;

      await provider.recordActivity('test-ids', {
        summary: 'Event 1',
        type: 'info',
      });
      await provider.recordActivity('test-ids', {
        summary: 'Event 2',
        type: 'info',
      });

      const items = await provider.getRecentActivity('test-ids', { limit: 2 });

      expect(items[0].id).not.toBe(items[1].id);
    });

    it('auto-generates timestamp for recorded activity', async () => {
      const provider = defaultWorkspaceActivityProvider;
      const beforeRecord = new Date();

      await provider.recordActivity('test-time', {
        summary: 'Timed event',
        type: 'info',
      });

      const items = await provider.getRecentActivity('test-time', { limit: 1 });
      const recordedTime = new Date(items[0].timestamp);

      expect(recordedTime.getTime()).toBeGreaterThanOrEqual(beforeRecord.getTime());
    });

    it('respects MAX_PER_WORKSPACE limit', async () => {
      const provider = defaultWorkspaceActivityProvider;

      // Record more than 100 items
      for (let i = 0; i < 110; i++) {
        await provider.recordActivity('test-limit', {
          summary: `Event ${i}`,
          type: 'info',
        });
      }

      // Get all items (high limit)
      const items = await provider.getRecentActivity('test-limit', { limit: 200 });

      // Should be capped at MAX_PER_WORKSPACE (100)
      expect(items.length).toBeLessThanOrEqual(100);
      // Most recent should be the last recorded
      expect(items[0].summary).toBe('Event 109');
    });

    it('preserves existing seed data when recording', async () => {
      const provider = defaultWorkspaceActivityProvider;

      // Home has seed data
      await provider.recordActivity('home', {
        summary: 'New event',
        type: 'info',
      });

      const items = await provider.getRecentActivity('home', { limit: 10 });

      // Should have both new event and seed data
      expect(items.some((item) => item.summary === 'New event')).toBe(true);
      expect(items.some((item) => item.id.startsWith('home-'))).toBe(true);
    });
  });

  describe('provider swapping', () => {
    it('active provider can be swapped at runtime', async () => {
      const fakeProvider = {
        async getRecentActivity() {
          return [
            {
              id: 'test-1',
              timestamp: new Date().toISOString(),
              summary: 'Test event from fake provider',
              type: 'info' as const,
              source: 'Test',
            },
          ];
        },
        async recordActivity() {
          // no-op
        },
      };

      setWorkspaceActivityProvider(fakeProvider);
      const items = await getWorkspaceActivityProvider().getRecentActivity('any-workspace');

      expect(items).toHaveLength(1);
      expect(items[0].summary).toBe('Test event from fake provider');
      expect(items[0].source).toBe('Test');
    });

    it('resetWorkspaceActivityProvider restores default provider', async () => {
      const fakeProvider = {
        async getRecentActivity() {
          return [{ id: 'fake', timestamp: '', summary: 'Fake', type: 'info' as const }];
        },
        async recordActivity() {
          // no-op
        },
      };

      setWorkspaceActivityProvider(fakeProvider);
      resetWorkspaceActivityProvider();

      const items = await getWorkspaceActivityProvider().getRecentActivity('home');

      // Should be back to default provider's home workspace data
      expect(items.some((item) => item.id.startsWith('home-'))).toBe(true);
    });
  });

  describe('clearRuntimeActivity', () => {
    it('clears all runtime activity data', async () => {
      const provider = defaultWorkspaceActivityProvider;

      // Record some activity
      await provider.recordActivity('test-clear', {
        summary: 'Will be cleared',
        type: 'info',
      });

      // Verify it's there
      let items = await provider.getRecentActivity('test-clear', { limit: 10 });
      expect(items.some((item) => item.summary === 'Will be cleared')).toBe(true);

      // Clear
      clearRuntimeActivity();

      // Should now get fresh seed data (fallback to default)
      items = await provider.getRecentActivity('test-clear', { limit: 10 });
      expect(items.some((item) => item.summary === 'Will be cleared')).toBe(false);
    });
  });
});

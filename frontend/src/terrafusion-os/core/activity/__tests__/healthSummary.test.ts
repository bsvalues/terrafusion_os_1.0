/**
 * Health Summary Tests
 *
 * Tests for computeWorkspaceHealthSummary utility function.
 */
import { describe, expect, test } from 'vitest';
import { computeWorkspaceHealthSummary } from '../healthSummary';
import type { WorkspaceActivityItem } from '../types';

// Helper to create activity items
function createItem(
  type: 'info' | 'warning' | 'incident',
  hoursAgo: number,
  summary: string = `${type} item`
): WorkspaceActivityItem {
  const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  return {
    id: `${type}-${hoursAgo}-${Math.random()}`,
    timestamp,
    summary,
    type,
    source: 'test',
  };
}

describe('computeWorkspaceHealthSummary', () => {
  describe('level determination', () => {
    test('returns nominal when no items', () => {
      const result = computeWorkspaceHealthSummary([]);
      expect(result.level).toBe('nominal');
      expect(result.incidents24h).toBe(0);
      expect(result.warnings24h).toBe(0);
      expect(result.summaryText).toBe('All systems nominal');
    });

    test('returns nominal when only info items', () => {
      const items = [createItem('info', 1), createItem('info', 2), createItem('info', 3)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('nominal');
    });

    test('returns degraded when warnings present (no incidents)', () => {
      const items = [createItem('info', 1), createItem('warning', 2), createItem('info', 3)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('degraded');
      expect(result.warnings24h).toBe(1);
    });

    test('returns critical when incidents present', () => {
      const items = [createItem('info', 1), createItem('warning', 2), createItem('incident', 3)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('critical');
      expect(result.incidents24h).toBe(1);
    });

    test('returns critical even when warnings also present', () => {
      const items = [createItem('warning', 1), createItem('warning', 2), createItem('incident', 3)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('critical');
      expect(result.incidents24h).toBe(1);
      expect(result.warnings24h).toBe(2);
    });
  });

  describe('24h window filtering', () => {
    test('ignores items older than 24 hours', () => {
      const items = [
        createItem('incident', 25), // Older than 24h
        createItem('warning', 26), // Older than 24h
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('nominal');
      expect(result.incidents24h).toBe(0);
      expect(result.warnings24h).toBe(0);
    });

    test('includes items within 24 hours', () => {
      const items = [
        createItem('incident', 23), // Within 24h
        createItem('warning', 12), // Within 24h
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('critical');
      expect(result.incidents24h).toBe(1);
      expect(result.warnings24h).toBe(1);
    });

    test('mixes recent and old items correctly', () => {
      const items = [
        createItem('incident', 25), // Old - ignored
        createItem('warning', 12), // Recent - counted
        createItem('info', 1), // Recent - counted but doesn't affect level
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.level).toBe('degraded');
      expect(result.incidents24h).toBe(0);
      expect(result.warnings24h).toBe(1);
    });
  });

  describe('counting', () => {
    test('counts multiple incidents', () => {
      const items = [
        createItem('incident', 1),
        createItem('incident', 2),
        createItem('incident', 3),
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.incidents24h).toBe(3);
    });

    test('counts multiple warnings', () => {
      const items = [
        createItem('warning', 1),
        createItem('warning', 2),
        createItem('warning', 3),
        createItem('warning', 4),
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.warnings24h).toBe(4);
    });
  });

  describe('lastIncident', () => {
    test('returns null when no incidents', () => {
      const items = [createItem('warning', 1), createItem('info', 2)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.lastIncident).toBeNull();
    });

    test('returns most recent incident', () => {
      const items = [
        createItem('incident', 3, 'oldest incident'),
        createItem('incident', 1, 'newest incident'),
        createItem('incident', 2, 'middle incident'),
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.lastIncident).not.toBeNull();
      expect(result.lastIncident!.summary).toBe('newest incident');
    });
  });

  describe('summaryText', () => {
    test('returns "All systems nominal" when nominal', () => {
      const result = computeWorkspaceHealthSummary([]);
      expect(result.summaryText).toBe('All systems nominal');
    });

    test('returns singular warning text', () => {
      const items = [createItem('warning', 1)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.summaryText).toBe('1 warning in last 24h');
    });

    test('returns plural warnings text', () => {
      const items = [createItem('warning', 1), createItem('warning', 2)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.summaryText).toBe('2 warnings in last 24h');
    });

    test('returns singular incident text', () => {
      const items = [createItem('incident', 1)];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.summaryText).toBe('1 incident in last 24h');
    });

    test('returns plural incidents text', () => {
      const items = [
        createItem('incident', 1),
        createItem('incident', 2),
        createItem('incident', 3),
      ];
      const result = computeWorkspaceHealthSummary(items);
      expect(result.summaryText).toBe('3 incidents in last 24h');
    });
  });

  describe('custom now parameter', () => {
    test('respects custom now for testing', () => {
      const fixedNow = new Date('2025-12-03T12:00:00Z').getTime();
      const items: WorkspaceActivityItem[] = [
        {
          id: '1',
          timestamp: new Date('2025-12-03T10:00:00Z').toISOString(), // 2h ago from fixedNow
          summary: 'Recent incident',
          type: 'incident',
        },
        {
          id: '2',
          timestamp: new Date('2025-12-02T10:00:00Z').toISOString(), // 26h ago from fixedNow
          summary: 'Old incident',
          type: 'incident',
        },
      ];

      const result = computeWorkspaceHealthSummary(items, fixedNow);
      expect(result.incidents24h).toBe(1); // Only the recent one
    });
  });
});

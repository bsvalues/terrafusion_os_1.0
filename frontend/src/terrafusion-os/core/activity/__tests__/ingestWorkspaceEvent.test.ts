/**
 * ingestWorkspaceEvent tests – validates external event ingestion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestWorkspaceEvent } from '../ingestWorkspaceEvent';
import type { WorkspaceActivityItem } from '../types';
import {
  clearRuntimeActivity,
  getWorkspaceActivityProvider,
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('ingestWorkspaceEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRuntimeActivity();
  });

  afterEach(() => {
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  describe('basic ingestion', () => {
    it('writes event to provider', async () => {
      const recorded: {
        workspaceId: string;
        entry: Omit<WorkspaceActivityItem, 'id' | 'timestamp'>;
      }[] = [];

      setWorkspaceActivityProvider({
        async getRecentActivity(): Promise<WorkspaceActivityItem[]> {
          return [];
        },
        async recordActivity(workspaceId, entry) {
          recorded.push({ workspaceId, entry });
        },
      });

      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Telemetry: CPU high',
        type: 'warning',
        source: 'Telemetry',
        kind: 'system_event',
      });

      expect(recorded).toHaveLength(1);
      expect(recorded[0].workspaceId).toBe('home');
      expect(recorded[0].entry.summary).toBe('Telemetry: CPU high');
      expect(recorded[0].entry.type).toBe('warning');
      expect(recorded[0].entry.source).toBe('Telemetry');
      expect(recorded[0].entry.kind).toBe('system_event');
    });

    it('works with default provider', async () => {
      await ingestWorkspaceEvent({
        workspaceId: 'test-workspace',
        summary: 'Test event ingested',
        type: 'info',
        source: 'Test',
        kind: 'health_update',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('test-workspace', { limit: 10 });

      const ingestedItem = items.find((item) => item.summary === 'Test event ingested');
      expect(ingestedItem).toBeDefined();
      expect(ingestedItem?.type).toBe('info');
      expect(ingestedItem?.source).toBe('Test');
      expect(ingestedItem?.kind).toBe('health_update');
    });

    it('ingests incident type events', async () => {
      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Critical system failure',
        type: 'incident',
        source: 'System Monitor',
        kind: 'health_update',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const incident = items.find((item) => item.summary === 'Critical system failure');
      expect(incident).toBeDefined();
      expect(incident?.type).toBe('incident');
    });
  });

  describe('validation', () => {
    it('skips event when workspaceId is missing', async () => {
      const recorded: unknown[] = [];

      setWorkspaceActivityProvider({
        async getRecentActivity(): Promise<WorkspaceActivityItem[]> {
          return [];
        },
        async recordActivity(_workspaceId, entry) {
          recorded.push(entry);
        },
      });

      await ingestWorkspaceEvent({
        workspaceId: '',
        summary: 'Should not appear',
        type: 'info',
      });

      expect(recorded).toHaveLength(0);
    });

    it('skips event when summary is missing', async () => {
      const recorded: unknown[] = [];

      setWorkspaceActivityProvider({
        async getRecentActivity(): Promise<WorkspaceActivityItem[]> {
          return [];
        },
        async recordActivity(_workspaceId, entry) {
          recorded.push(entry);
        },
      });

      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: '',
        type: 'info',
      });

      expect(recorded).toHaveLength(0);
    });

    it('skips event when type is missing', async () => {
      const recorded: unknown[] = [];

      setWorkspaceActivityProvider({
        async getRecentActivity(): Promise<WorkspaceActivityItem[]> {
          return [];
        },
        async recordActivity(_workspaceId, entry) {
          recorded.push(entry);
        },
      });

      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Valid summary',
        type: '' as 'info', // Force invalid type
      });

      expect(recorded).toHaveLength(0);
    });
  });

  describe('optional fields', () => {
    it('handles events without source', async () => {
      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Event without source',
        type: 'info',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const item = items.find((i) => i.summary === 'Event without source');
      expect(item).toBeDefined();
      expect(item?.source).toBeUndefined();
    });

    it('handles events without kind', async () => {
      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Event without kind',
        type: 'warning',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const item = items.find((i) => i.summary === 'Event without kind');
      expect(item).toBeDefined();
      expect(item?.kind).toBeUndefined();
    });

    it('ignores timestamp field (provider generates timestamp)', async () => {
      const beforeIngest = new Date();

      await ingestWorkspaceEvent({
        workspaceId: 'home',
        summary: 'Event with external timestamp',
        type: 'info',
        timestamp: '2020-01-01T00:00:00.000Z', // Old timestamp
      });

      const afterIngest = new Date();

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const item = items.find((i) => i.summary === 'Event with external timestamp');
      expect(item).toBeDefined();

      // Timestamp should be generated by provider, not the old one we passed
      const itemTime = new Date(item!.timestamp);
      expect(itemTime.getTime()).toBeGreaterThanOrEqual(beforeIngest.getTime());
      expect(itemTime.getTime()).toBeLessThanOrEqual(afterIngest.getTime() + 100);
    });
  });

  describe('integration with activity pipeline', () => {
    it('ingested events appear in getRecentActivity', async () => {
      // Ingest multiple events
      await ingestWorkspaceEvent({
        workspaceId: 'integration-test',
        summary: 'First event',
        type: 'info',
        source: 'Test',
      });

      await ingestWorkspaceEvent({
        workspaceId: 'integration-test',
        summary: 'Second event',
        type: 'warning',
        source: 'Test',
      });

      await ingestWorkspaceEvent({
        workspaceId: 'integration-test',
        summary: 'Third event',
        type: 'incident',
        source: 'Test',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('integration-test', { limit: 10 });

      // Should have seed data + 3 ingested events
      expect(items.length).toBeGreaterThanOrEqual(3);

      // Newest first (reverse chronological)
      const summaries = items.map((i) => i.summary);
      expect(summaries).toContain('First event');
      expect(summaries).toContain('Second event');
      expect(summaries).toContain('Third event');
    });

    it('different workspaces receive independent events', async () => {
      await ingestWorkspaceEvent({
        workspaceId: 'workspace-a',
        summary: 'Event for A',
        type: 'info',
      });

      await ingestWorkspaceEvent({
        workspaceId: 'workspace-b',
        summary: 'Event for B',
        type: 'warning',
      });

      const provider = getWorkspaceActivityProvider();

      const itemsA = await provider.getRecentActivity('workspace-a', { limit: 10 });
      const itemsB = await provider.getRecentActivity('workspace-b', { limit: 10 });

      const summariesA = itemsA.map((i) => i.summary);
      const summariesB = itemsB.map((i) => i.summary);

      expect(summariesA).toContain('Event for A');
      expect(summariesA).not.toContain('Event for B');

      expect(summariesB).toContain('Event for B');
      expect(summariesB).not.toContain('Event for A');
    });
  });
});

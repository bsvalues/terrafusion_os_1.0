/**
 * ingestTelemetry tests – validates telemetry → activity mapping.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestWorkspaceTelemetry } from '../ingestTelemetry';
import type { WorkspaceTelemetryEvent } from '../telemetryTypes';
import type { WorkspaceActivityItem } from '../types';
import {
    clearRuntimeActivity,
    getWorkspaceActivityProvider,
    resetWorkspaceActivityProvider,
    setWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('ingestWorkspaceTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRuntimeActivity();
  });

  afterEach(() => {
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  describe('severity mapping', () => {
    it('maps critical telemetry to incident activity', async () => {
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

      const event: WorkspaceTelemetryEvent = {
        workspaceId: 'home',
        severity: 'critical',
        kind: 'incident',
        message: 'Swarm degraded',
        source: 'SwarmMonitor',
      };

      await ingestWorkspaceTelemetry(event);

      expect(recorded).toHaveLength(1);
      expect(recorded[0].workspaceId).toBe('home');
      expect(recorded[0].entry.type).toBe('incident');
      expect(recorded[0].entry.kind).toBe('health_update');
      expect(recorded[0].entry.summary).toBe('Swarm degraded');
      expect(recorded[0].entry.source).toBe('SwarmMonitor');
    });

    it('maps warning telemetry to warning activity', async () => {
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

      const event: WorkspaceTelemetryEvent = {
        workspaceId: 'home',
        severity: 'warning',
        kind: 'health',
        message: 'CPU usage at 85%',
        source: 'SystemMonitor',
      };

      await ingestWorkspaceTelemetry(event);

      expect(recorded).toHaveLength(1);
      expect(recorded[0].entry.type).toBe('warning');
    });

    it('maps info telemetry to info activity', async () => {
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

      const event: WorkspaceTelemetryEvent = {
        workspaceId: 'home',
        severity: 'info',
        kind: 'system',
        message: 'Service started',
        source: 'Orchestrator',
      };

      await ingestWorkspaceTelemetry(event);

      expect(recorded).toHaveLength(1);
      expect(recorded[0].entry.type).toBe('info');
    });
  });

  describe('kind mapping', () => {
    it('maps health kind to health_update activity kind', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'info',
        kind: 'health',
        message: 'Health check passed',
      });

      expect(recorded[0].entry.kind).toBe('health_update');
    });

    it('maps incident kind to health_update activity kind', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'critical',
        kind: 'incident',
        message: 'Service crashed',
      });

      expect(recorded[0].entry.kind).toBe('health_update');
    });

    it('maps user_action kind to user_action activity kind', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'info',
        kind: 'user_action',
        message: 'User clicked button',
      });

      expect(recorded[0].entry.kind).toBe('user_action');
    });

    it('maps system kind to system_event activity kind', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'info',
        kind: 'system',
        message: 'System event occurred',
      });

      expect(recorded[0].entry.kind).toBe('system_event');
    });
  });

  describe('default source', () => {
    it('uses "Telemetry" as default source when not provided', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'info',
        kind: 'system',
        message: 'Event without source',
      });

      expect(recorded[0].entry.source).toBe('Telemetry');
    });

    it('uses provided source when specified', async () => {
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

      await ingestWorkspaceTelemetry({
        workspaceId: 'home',
        severity: 'info',
        kind: 'system',
        message: 'Event with custom source',
        source: 'CustomService',
      });

      expect(recorded[0].entry.source).toBe('CustomService');
    });
  });

  describe('integration with default provider', () => {
    it('ingested events appear in getRecentActivity', async () => {
      await ingestWorkspaceTelemetry({
        workspaceId: 'integration-test',
        severity: 'warning',
        kind: 'health',
        message: 'Integration test event',
        source: 'TestService',
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('integration-test', { limit: 10 });

      const ingested = items.find((i) => i.summary === 'Integration test event');
      expect(ingested).toBeDefined();
      expect(ingested?.type).toBe('warning');
      expect(ingested?.kind).toBe('health_update');
      expect(ingested?.source).toBe('TestService');
    });

    it('events from different workspaces are isolated', async () => {
      await ingestWorkspaceTelemetry({
        workspaceId: 'workspace-a',
        severity: 'info',
        kind: 'system',
        message: 'Event for A',
      });

      await ingestWorkspaceTelemetry({
        workspaceId: 'workspace-b',
        severity: 'info',
        kind: 'system',
        message: 'Event for B',
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

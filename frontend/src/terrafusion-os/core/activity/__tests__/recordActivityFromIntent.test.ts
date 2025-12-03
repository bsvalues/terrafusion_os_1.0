/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  recordActivityFromIntent,
  recordWorkspaceActivityFromIntent,
  type IntentPayload,
} from '../recordActivityFromIntent';
import {
  clearRuntimeActivity,
  getWorkspaceActivityProvider,
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
  type WorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

describe('recordActivityFromIntent', () => {
  beforeEach(() => {
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  afterEach(() => {
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  describe('intent type mapping', () => {
    it('maps object_selected to user_action kind', async () => {
      const intent: IntentPayload = {
        type: 'object_selected',
        objectType: 'parcel',
        objectId: 'P-12345',
      };

      await recordActivityFromIntent('test-workspace', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('test-workspace', { limit: 1 });

      expect(items[0].kind).toBe('user_action');
      expect(items[0].summary).toContain('parcel');
      expect(items[0].summary).toContain('P-12345');
    });

    it('maps workspace_status_selected to health_update kind', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_selected',
        workspaceId: 'quantumLab',
      };

      await recordActivityFromIntent('quantumLab', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('quantumLab', { limit: 1 });

      expect(items[0].kind).toBe('health_update');
      expect(items[0].summary).toContain('workspace status');
    });

    it('maps terra_command to user_action kind', async () => {
      const intent: IntentPayload = {
        type: 'terra_command',
        value: 'show levy scenarios',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].kind).toBe('user_action');
      expect(items[0].summary).toContain('TerraCommand');
      expect(items[0].summary).toContain('show levy scenarios');
    });

    it('maps system_init to system_event kind', async () => {
      const intent: IntentPayload = {
        type: 'system_init',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].kind).toBe('system_event');
    });

    it('defaults unknown intent types to user_action', async () => {
      const intent: IntentPayload = {
        type: 'unknown_custom_intent',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].kind).toBe('user_action');
      expect(items[0].type).toBe('info');
    });
  });

  describe('workspace_status_changed intent', () => {
    it('maps workspace_status_changed to health_update kind', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'home',
        metadata: {
          previousStatus: 'nominal',
          currentStatus: 'warning',
        },
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].kind).toBe('health_update');
    });

    it('generates correct summary for status transitions', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'quantumLab',
        metadata: {
          previousStatus: 'nominal',
          currentStatus: 'critical',
        },
      };

      await recordActivityFromIntent('quantumLab', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('quantumLab', { limit: 1 });

      expect(items[0].summary).toBe('Status changed: nominal → critical');
    });

    it('sets type to incident when currentStatus is critical', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'home',
        metadata: {
          previousStatus: 'warning',
          currentStatus: 'critical',
        },
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].type).toBe('incident');
    });

    it('sets type to warning when currentStatus is warning', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'home',
        metadata: {
          previousStatus: 'nominal',
          currentStatus: 'warning',
        },
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].type).toBe('warning');
    });

    it('sets type to info when currentStatus is nominal', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'home',
        metadata: {
          previousStatus: 'critical',
          currentStatus: 'nominal',
        },
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].type).toBe('info');
    });

    it('sets source to WorkspaceStatusChip', async () => {
      const intent: IntentPayload = {
        type: 'workspace_status_changed',
        workspaceId: 'home',
        metadata: {
          previousStatus: 'nominal',
          currentStatus: 'warning',
        },
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].source).toBe('WorkspaceStatusChip');
    });
  });

  describe('summary generation', () => {
    it('generates summary for navigate intent', async () => {
      const intent: IntentPayload = {
        type: 'navigate',
        objectId: 'levyStudio',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].summary).toContain('Navigated to');
      expect(items[0].summary).toContain('levyStudio');
    });

    it('generates summary for search intent', async () => {
      const intent: IntentPayload = {
        type: 'search',
        value: 'levy scenario 2024',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].summary).toContain('Searched');
      expect(items[0].summary).toContain('levy scenario 2024');
    });

    it('handles missing optional fields gracefully', async () => {
      const intent: IntentPayload = {
        type: 'object_selected',
        // objectType and objectId missing
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].summary).toContain('Selected');
      expect(items[0].summary).toContain('object'); // default
    });
  });

  describe('source attribution', () => {
    it('sets source to OmniIntent', async () => {
      const intent: IntentPayload = {
        type: 'terra_command',
        value: 'test',
      };

      await recordActivityFromIntent('home', intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 1 });

      expect(items[0].source).toBe('OmniIntent');
    });
  });

  describe('recordWorkspaceActivityFromIntent', () => {
    it('records activity when workspace ID is available', async () => {
      const getWorkspaceId = () => 'test-ws';
      const intent: IntentPayload = {
        type: 'navigate',
        value: 'parcels',
      };

      await recordWorkspaceActivityFromIntent(getWorkspaceId, intent);

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('test-ws', { limit: 1 });

      expect(items[0].summary).toContain('Navigated');
    });

    it('skips recording when workspace ID is null', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const getWorkspaceId = () => null;
      const intent: IntentPayload = {
        type: 'navigate',
        value: 'test',
      };

      await recordWorkspaceActivityFromIntent(getWorkspaceId, intent);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No workspace context'));

      consoleWarnSpy.mockRestore();
    });

    it('skips recording when workspace ID is undefined', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const getWorkspaceId = () => undefined;
      const intent: IntentPayload = {
        type: 'navigate',
        value: 'test',
      };

      await recordWorkspaceActivityFromIntent(getWorkspaceId, intent);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No workspace context'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('custom provider integration', () => {
    it('uses custom provider when set', async () => {
      const customRecordActivity = vi.fn();
      const customProvider: WorkspaceActivityProvider = {
        async getRecentActivity() {
          return [];
        },
        async recordActivity(workspaceId, entry) {
          customRecordActivity(workspaceId, entry);
        },
      };

      setWorkspaceActivityProvider(customProvider);

      const intent: IntentPayload = {
        type: 'terra_command',
        value: 'custom test',
      };

      await recordActivityFromIntent('custom-ws', intent);

      expect(customRecordActivity).toHaveBeenCalledWith(
        'custom-ws',
        expect.objectContaining({
          summary: expect.stringContaining('TerraCommand'),
          kind: 'user_action',
          source: 'OmniIntent',
        })
      );
    });
  });
});

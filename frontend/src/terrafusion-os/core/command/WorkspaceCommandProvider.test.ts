/**
 * WorkspaceCommandProvider tests – validates provider pattern for OS commands.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultWorkspaceCommandProvider,
  getWorkspaceCommandProvider,
  resetWorkspaceCommandProvider,
  setWorkspaceCommandProvider,
  type WorkspaceCommandProvider,
} from './WorkspaceCommandProvider';

describe('WorkspaceCommandProvider', () => {
  afterEach(() => {
    resetWorkspaceCommandProvider();
  });

  describe('defaultWorkspaceCommandProvider', () => {
    it('returns static commands including open-health-timeline', async () => {
      const commands = await defaultWorkspaceCommandProvider.getCommands();
      const healthCmd = commands.find((c) => c.id === 'open-health-timeline');
      expect(healthCmd).toBeDefined();
      expect(healthCmd?.label).toBe('Open Health Timeline');
      expect(healthCmd?.category).toBe('navigation');
    });

    it('returns static commands including open-activity-feed', async () => {
      const commands = await defaultWorkspaceCommandProvider.getCommands();
      const activityCmd = commands.find((c) => c.id === 'open-activity-feed');
      expect(activityCmd).toBeDefined();
      expect(activityCmd?.label).toBe('Open Activity Feed');
      expect(activityCmd?.category).toBe('navigation');
    });

    it('returns static commands including refresh-workspace', async () => {
      const commands = await defaultWorkspaceCommandProvider.getCommands();
      const refreshCmd = commands.find((c) => c.id === 'refresh-workspace');
      expect(refreshCmd).toBeDefined();
      expect(refreshCmd?.label).toBe('Refresh Workspace');
      expect(refreshCmd?.category).toBe('system');
    });

    it('returns exactly 3 static commands', async () => {
      const commands = await defaultWorkspaceCommandProvider.getCommands();
      expect(commands).toHaveLength(3);
    });
  });

  describe('getWorkspaceCommandProvider', () => {
    it('returns the default provider initially', () => {
      const provider = getWorkspaceCommandProvider();
      expect(provider).toBe(defaultWorkspaceCommandProvider);
    });
  });

  describe('setWorkspaceCommandProvider', () => {
    it('allows swapping to a custom provider', async () => {
      const customCommands = [{ id: 'custom-cmd', label: 'Custom Command' }];
      const customProvider: WorkspaceCommandProvider = {
        getCommands: vi.fn().mockResolvedValue(customCommands),
      };

      setWorkspaceCommandProvider(customProvider);

      const provider = getWorkspaceCommandProvider();
      expect(provider).toBe(customProvider);

      const commands = await provider.getCommands();
      expect(commands).toEqual(customCommands);
      expect(customProvider.getCommands).toHaveBeenCalled();
    });
  });

  describe('resetWorkspaceCommandProvider', () => {
    it('restores the default provider', async () => {
      const customProvider: WorkspaceCommandProvider = {
        getCommands: vi.fn().mockResolvedValue([]),
      };

      setWorkspaceCommandProvider(customProvider);
      expect(getWorkspaceCommandProvider()).toBe(customProvider);

      resetWorkspaceCommandProvider();
      expect(getWorkspaceCommandProvider()).toBe(defaultWorkspaceCommandProvider);
    });
  });
});

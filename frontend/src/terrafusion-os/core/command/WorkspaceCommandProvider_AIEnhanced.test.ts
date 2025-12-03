/**
 * Tests for AI-enhanced command provider factory.
 *
 * Covers:
 * - Deduplication (suggestions with same ID as core commands are filtered out)
 * - Kind tagging (core commands get 'core', suggestions get 'suggested')
 * - Score sorting (suggestions sorted by score desc, then label asc)
 * - Ordering (core commands first, then suggestions)
 */
import { describe, expect, it } from 'vitest';
import type { WorkspaceCommandSuggestionProvider } from './SuggestionProvider';
import type { WorkspaceCommand } from './types';
import type { WorkspaceCommandProvider } from './WorkspaceCommandProvider';
import {
  baseWorkspaceCommandProvider,
  createAIEnhancedCommandProvider,
} from './WorkspaceCommandProvider';

describe('createAIEnhancedCommandProvider', () => {
  const testWorkspaceId = 'ws-enhanced-test';

  // Base commands without kind (should be tagged as 'core')
  const baseCommands: WorkspaceCommand[] = [
    { id: 'cmd-a', label: 'Alpha Command' },
    { id: 'cmd-b', label: 'Beta Command', description: 'Second command' },
    { id: 'cmd-c', label: 'Charlie Command' },
  ];

  // Stub base provider (async to match interface)
  const stubBaseProvider: WorkspaceCommandProvider = {
    getCommands: async () => [...baseCommands],
  };

  describe('kind tagging', () => {
    it('should tag base commands with kind=core', async () => {
      const noopSuggestions: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, noopSuggestions);
      const commands = await enhanced.getCommands(testWorkspaceId);

      commands.forEach((cmd) => {
        expect(cmd.kind).toBe('core');
      });
    });

    it('should preserve kind=core if already set on base commands', async () => {
      const baseWithKind: WorkspaceCommandProvider = {
        getCommands: async () => [{ id: 'x', label: 'X', kind: 'core' as const }],
      };
      const noopSuggestions: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [],
      };
      const enhanced = createAIEnhancedCommandProvider(baseWithKind, noopSuggestions);
      const commands = await enhanced.getCommands(testWorkspaceId);

      expect(commands[0].kind).toBe('core');
    });

    it('should tag suggestions with kind=suggested', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'sug-1', label: 'Suggestion One', score: 0.9 },
          { id: 'sug-2', label: 'Suggestion Two', score: 0.8 },
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      const suggestions = commands.filter((c) => c.id.startsWith('sug-'));
      expect(suggestions).toHaveLength(2);
      suggestions.forEach((cmd) => {
        expect(cmd.kind).toBe('suggested');
      });
    });
  });

  describe('deduplication', () => {
    it('should filter out suggestions that duplicate core command IDs', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'cmd-a', label: 'Duplicate of Alpha', score: 0.95 }, // Same ID as core
          { id: 'unique-sug', label: 'Unique Suggestion', score: 0.85 },
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      // Should have 3 core + 1 unique suggestion
      expect(commands).toHaveLength(4);

      // The 'cmd-a' should be the core version, not the suggestion
      const cmdA = commands.find((c) => c.id === 'cmd-a');
      expect(cmdA?.label).toBe('Alpha Command');
      expect(cmdA?.kind).toBe('core');

      // Unique suggestion should be included
      const uniqueSug = commands.find((c) => c.id === 'unique-sug');
      expect(uniqueSug).toBeDefined();
      expect(uniqueSug?.kind).toBe('suggested');
    });

    it('should keep all suggestions when none duplicate core IDs', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'sug-x', label: 'Suggestion X', score: 0.7 },
          { id: 'sug-y', label: 'Suggestion Y', score: 0.6 },
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      // 3 core + 2 suggestions
      expect(commands).toHaveLength(5);
    });
  });

  describe('ordering', () => {
    it('should place core commands before suggestions', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'sug-first', label: 'AAA First Suggestion', score: 0.99 },
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      // Even with high score and alphabetically first label, suggestion should come after core
      const coreCommands = commands.filter((c) => c.kind === 'core');
      const suggestedCommands = commands.filter((c) => c.kind === 'suggested');

      expect(coreCommands).toHaveLength(3);
      expect(suggestedCommands).toHaveLength(1);

      // Core commands should be first in the array
      const firstSuggestionIndex = commands.findIndex((c) => c.kind === 'suggested');
      const lastCoreIndex = commands.findIndex((c) => c.kind === 'core') + coreCommands.length - 1;
      expect(firstSuggestionIndex).toBeGreaterThan(lastCoreIndex);
    });

    it('should sort suggestions by score descending, then label ascending', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'sug-low', label: 'Low Score', score: 0.5 },
          { id: 'sug-high', label: 'High Score', score: 0.9 },
          { id: 'sug-mid-b', label: 'Mid Score B', score: 0.7 },
          { id: 'sug-mid-a', label: 'Mid Score A', score: 0.7 }, // Same score as B
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      const suggestions = commands.filter((c) => c.kind === 'suggested');
      expect(suggestions).toHaveLength(4);

      // Order should be: High (0.9), Mid A (0.7), Mid B (0.7), Low (0.5)
      expect(suggestions[0].id).toBe('sug-high');
      expect(suggestions[1].id).toBe('sug-mid-a');
      expect(suggestions[2].id).toBe('sug-mid-b');
      expect(suggestions[3].id).toBe('sug-low');
    });

    it('should handle suggestions without scores (treated as 0)', async () => {
      const suggestionProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async () => [
          { id: 'sug-scored', label: 'Scored', score: 0.5 },
          { id: 'sug-unscored', label: 'Unscored' }, // No score
        ],
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, suggestionProvider);
      const commands = await enhanced.getCommands(testWorkspaceId);

      const suggestions = commands.filter((c) => c.kind === 'suggested');
      // Scored (0.5) should come before Unscored (0 default)
      expect(suggestions[0].id).toBe('sug-scored');
      expect(suggestions[1].id).toBe('sug-unscored');
    });
  });

  describe('suggestion context', () => {
    it('should pass workspaceId to suggestion provider', async () => {
      let receivedContext: { workspaceId: string } | null = null;
      const contextCapturingProvider: WorkspaceCommandSuggestionProvider = {
        getSuggestedCommands: async (ctx) => {
          receivedContext = ctx;
          return [];
        },
      };
      const enhanced = createAIEnhancedCommandProvider(stubBaseProvider, contextCapturingProvider);

      await enhanced.getCommands('captured-workspace-id');
      expect(receivedContext?.workspaceId).toBe('captured-workspace-id');
    });
  });

  describe('baseWorkspaceCommandProvider', () => {
    it('should provide core commands with kind=core', async () => {
      const commands = await baseWorkspaceCommandProvider.getCommands('any-workspace');
      expect(commands.length).toBeGreaterThan(0);
      commands.forEach((cmd) => {
        expect(cmd.kind).toBe('core');
      });
    });

    it('should include expected core commands', async () => {
      const commands = await baseWorkspaceCommandProvider.getCommands('any-workspace');
      const ids = commands.map((c) => c.id);

      expect(ids).toContain('open-health-timeline');
      expect(ids).toContain('open-activity-feed');
      expect(ids).toContain('refresh-workspace');
    });
  });
});

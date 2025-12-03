/**
 * WorkspaceCommandProvider – pluggable source for workspace commands.
 *
 * Default provider returns static OS commands.
 * Can be swapped for AI-driven, role-based, or workspace-specific providers.
 *
 * The createAIEnhancedCommandProvider factory composes a base provider
 * with a suggestion provider for AI/heuristic suggestions.
 */
import type { WorkspaceCommandSuggestionProvider } from './SuggestionProvider';
import { noopSuggestionProvider } from './SuggestionProvider';
import type { WorkspaceCommand } from './types';

export interface WorkspaceCommandProvider {
  getCommands(workspaceId: string): Promise<WorkspaceCommand[]>;
}

/**
 * Static OS commands – domain-neutral operations.
 */
const STATIC_COMMANDS: WorkspaceCommand[] = [
  {
    id: 'open-health-timeline',
    label: 'Open Health Timeline',
    description: 'View workspace health events',
    category: 'navigation',
    kind: 'core',
  },
  {
    id: 'open-activity-feed',
    label: 'Open Activity Feed',
    description: 'View recent workspace activity',
    category: 'navigation',
    kind: 'core',
  },
  {
    id: 'refresh-workspace',
    label: 'Refresh Workspace',
    description: 'Reload workspace data',
    category: 'system',
    kind: 'core',
  },
];

/**
 * Base provider returning static core commands.
 * This is the foundation for all command providers.
 */
export const baseWorkspaceCommandProvider: WorkspaceCommandProvider = {
  async getCommands(_workspaceId: string): Promise<WorkspaceCommand[]> {
    return STATIC_COMMANDS;
  },
};

/**
 * Create an AI-enhanced command provider that composes base commands
 * with AI/heuristic suggestions.
 *
 * @param base - Base provider for core commands
 * @param suggestions - Suggestion provider for AI/heuristic commands
 * @returns Composite provider that merges core + suggestions
 *
 * @example
 * ```ts
 * const enhanced = createAIEnhancedCommandProvider(
 *   baseWorkspaceCommandProvider,
 *   stubAISuggestionProvider
 * );
 * setWorkspaceCommandProvider(enhanced);
 * ```
 */
export function createAIEnhancedCommandProvider(
  base: WorkspaceCommandProvider,
  suggestions: WorkspaceCommandSuggestionProvider
): WorkspaceCommandProvider {
  return {
    async getCommands(workspaceId: string): Promise<WorkspaceCommand[]> {
      const [core, suggestedRaw] = await Promise.all([
        base.getCommands(workspaceId),
        suggestions.getSuggestedCommands({ workspaceId }),
      ]);

      // Tag core commands and build ID set for deduplication
      const coreWithKind = core.map<WorkspaceCommand>((cmd) => ({
        ...cmd,
        kind: cmd.kind ?? 'core',
      }));
      const coreIds = new Set(coreWithKind.map((c) => c.id));

      // Filter and tag suggested commands (dedupe against core)
      const suggested = suggestedRaw
        .filter((cmd) => !coreIds.has(cmd.id))
        .map<WorkspaceCommand>((cmd) => ({
          ...cmd,
          kind: cmd.kind ?? 'suggested',
        }));

      // Sort suggestions by score (desc), then label (asc)
      const sortedSuggested = [...suggested].sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.label.localeCompare(b.label);
      });

      // Merge: core commands first, then sorted suggestions
      return [...coreWithKind, ...sortedSuggested];
    },
  };
}

/**
 * Default provider – base commands with no suggestions.
 * Maintained for backwards compatibility.
 */
export const defaultWorkspaceCommandProvider: WorkspaceCommandProvider =
  createAIEnhancedCommandProvider(baseWorkspaceCommandProvider, noopSuggestionProvider);

let activeProvider: WorkspaceCommandProvider = defaultWorkspaceCommandProvider;

/**
 * Swap the active command provider (e.g., for testing or AI-driven commands).
 */
export const setWorkspaceCommandProvider = (provider: WorkspaceCommandProvider): void => {
  activeProvider = provider;
};

/**
 * Get the current command provider.
 */
export const getWorkspaceCommandProvider = (): WorkspaceCommandProvider => activeProvider;

/**
 * Reset to default provider (useful for tests).
 */
export const resetWorkspaceCommandProvider = (): void => {
  activeProvider = defaultWorkspaceCommandProvider;
};

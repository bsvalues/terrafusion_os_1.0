/**
 * SuggestionProvider – pluggable AI/heuristic command suggestions.
 *
 * Defines the interface for providing suggested commands.
 * Implementations can call AI backends, apply heuristics, or return stubs.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import type { WorkspaceCommand } from './types';

/**
 * Context passed to suggestion providers.
 * Extensible for future data sources.
 */
export interface WorkspaceCommandSuggestionContext {
  /** Target workspace ID */
  workspaceId: string;

  // Future-safe extensions:
  // recentActivity?: WorkspaceActivityItem[];
  // userRole?: string;
  // workspaceHealth?: 'healthy' | 'degraded' | 'critical';
}

/**
 * Interface for AI/heuristic suggestion providers.
 *
 * Implementations should return commands with `kind: 'suggested'`.
 */
export interface WorkspaceCommandSuggestionProvider {
  /**
   * Get suggested commands for the given context.
   *
   * @param context - Context including workspaceId and future extensions
   * @returns Promise of suggested commands (may be empty)
   */
  getSuggestedCommands(context: WorkspaceCommandSuggestionContext): Promise<WorkspaceCommand[]>;
}

/**
 * No-op suggestion provider – returns empty array.
 *
 * Use as default when AI suggestions are disabled or unavailable.
 * Ensures the system always works without requiring AI backend.
 */
export const noopSuggestionProvider: WorkspaceCommandSuggestionProvider = {
  async getSuggestedCommands(): Promise<WorkspaceCommand[]> {
    return [];
  },
};

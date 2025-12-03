/**
 * StubAISuggestionProvider – test/demo suggestion provider.
 *
 * Returns placeholder suggestions so you can test the UX
 * without wiring a real AI backend.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import type {
  WorkspaceCommandSuggestionContext,
  WorkspaceCommandSuggestionProvider,
} from './SuggestionProvider';
import type { WorkspaceCommand } from './types';

/**
 * Stub AI suggestion provider for testing and demos.
 *
 * Later, replace with a provider that:
 * - Calls a backend endpoint
 * - Which calls AI / heuristics
 * - And returns the same neutral WorkspaceCommand[] structure
 *
 * No changes needed to the UI when you swap implementations.
 */
export const stubAISuggestionProvider: WorkspaceCommandSuggestionProvider = {
  async getSuggestedCommands(
    context: WorkspaceCommandSuggestionContext
  ): Promise<WorkspaceCommand[]> {
    const { workspaceId } = context;

    // Completely neutral placeholder suggestions
    const suggestions: WorkspaceCommand[] = [
      {
        id: 'inspect-recent-incidents',
        label: 'Inspect recent incidents',
        description: 'Review recent incident events for this workspace.',
        category: 'health',
        kind: 'suggested',
        score: 0.9,
      },
      {
        id: 'review-activity-last-hour',
        label: 'Review last hour of activity',
        description: 'Focus the activity feed on the last hour.',
        category: 'activity',
        kind: 'suggested',
        score: 0.8,
      },
      {
        id: 'check-system-health',
        label: 'Check system health',
        description: 'Run a quick health diagnostic.',
        category: 'health',
        kind: 'suggested',
        score: 0.7,
      },
    ];

    // Future: vary by workspaceId, recent activity, health status, etc.
    void workspaceId; // Avoid unused variable warning

    return suggestions;
  },
};

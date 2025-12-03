/**
 * Command module barrel export.
 */

// Types
export type { WorkspaceCommand, WorkspaceCommandId, WorkspaceCommandKind } from './types';

// Suggestion provider interface + noop default
export { noopSuggestionProvider } from './SuggestionProvider';
export type {
  WorkspaceCommandSuggestionContext,
  WorkspaceCommandSuggestionProvider,
} from './SuggestionProvider';

// Stub AI suggestion provider for testing/demos
export { stubAISuggestionProvider } from './StubAISuggestionProvider';

// Command provider + AI-enhanced factory
export {
  baseWorkspaceCommandProvider,
  createAIEnhancedCommandProvider,
  defaultWorkspaceCommandProvider,
  getWorkspaceCommandProvider,
  resetWorkspaceCommandProvider,
  setWorkspaceCommandProvider,
  type WorkspaceCommandProvider,
} from './WorkspaceCommandProvider';

// Hook
export {
  useWorkspaceCommands,
  type UseWorkspaceCommandsOptions,
  type UseWorkspaceCommandsResult,
} from './useWorkspaceCommands';

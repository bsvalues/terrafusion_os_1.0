/**
 * OS-level command types.
 * Domain-neutral – no parcel/property/levy semantics.
 */

export type WorkspaceCommandId = string;

/**
 * Command kind: core OS commands vs AI/heuristic suggestions.
 */
export type WorkspaceCommandKind = 'core' | 'suggested';

export interface WorkspaceCommand {
  id: WorkspaceCommandId;
  label: string;
  description?: string;
  category?: string;

  /** Command kind: 'core' for static OS commands, 'suggested' for AI/heuristics (default: 'core') */
  kind?: WorkspaceCommandKind;

  /** Relevance score for ranking suggestions (0–1); higher = more relevant */
  score?: number;

  // Future-safe extensions:
  // icon?: string;
  // shortcut?: string;
  // disabled?: boolean;
}

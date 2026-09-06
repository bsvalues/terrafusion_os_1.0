import manifest from './conferenceWorkspace.json';

export type ConferenceStartupMode = 'cold';
export type ConferenceNetworkPolicy = 'local-only';

export interface ConferenceWorkspaceView {
  readonly id: string;
  readonly label: string;
  readonly moduleId: string;
  readonly route: string;
  readonly purpose: string;
}

export interface ConferenceWorkspaceManifest {
  readonly schemaVersion: 1;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly startup: {
    readonly mode: ConferenceStartupMode;
    readonly networkPolicy: ConferenceNetworkPolicy;
  };
  readonly views: readonly ConferenceWorkspaceView[];
  readonly requiredLocalChecks: readonly string[];
}

export const WACO_CONFERENCE_WORKSPACE = Object.freeze(
  manifest,
) as ConferenceWorkspaceManifest;

/**
 * Validate the conference manifest without consulting a runtime or network.
 * The validator intentionally checks only the deterministic launch contract;
 * it does not claim that the referenced runtime surfaces are healthy.
 */
export function isConferenceWorkspaceManifest(
  value: unknown,
): value is ConferenceWorkspaceManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const candidate = value as Partial<ConferenceWorkspaceManifest>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.workspaceId !== 'string' ||
    candidate.workspaceId.length === 0 ||
    typeof candidate.displayName !== 'string' ||
    candidate.displayName.length === 0
  ) {
    return false;
  }

  if (
    !candidate.startup ||
    candidate.startup.mode !== 'cold' ||
    candidate.startup.networkPolicy !== 'local-only'
  ) {
    return false;
  }

  if (!Array.isArray(candidate.views) || candidate.views.length === 0) return false;
  const ids = new Set<string>();
  for (const view of candidate.views) {
    if (
      !view ||
      typeof view.id !== 'string' ||
      typeof view.label !== 'string' ||
      typeof view.moduleId !== 'string' ||
      typeof view.route !== 'string' ||
      typeof view.purpose !== 'string' ||
      !view.route.startsWith('/') ||
      view.route.startsWith('//') ||
      ids.has(view.id)
    ) {
      return false;
    }
    ids.add(view.id);
  }

  return (
    Array.isArray(candidate.requiredLocalChecks) &&
    candidate.requiredLocalChecks.length > 0 &&
    candidate.requiredLocalChecks.every(
      (check) => typeof check === 'string' && check.length > 0,
    )
  );
}

if (!isConferenceWorkspaceManifest(WACO_CONFERENCE_WORKSPACE)) {
  throw new Error('Invalid WACO conference workspace manifest');
}

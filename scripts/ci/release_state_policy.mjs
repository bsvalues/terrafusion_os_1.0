const SHA = /^[0-9a-f]{40}$/;
const DIGEST_REF =
  /^ghcr\.io\/[a-z0-9_.-]+\/terrafusion-os-(backend|frontend)-internal@sha256:[0-9a-f]{64}$/;
const SAFE_METADATA = new Set([
  'COMPOSE_PROJECT_NAME',
  'TF_RELEASE_SHA',
  'TF_RELEASE_ENV',
  'TF_SKIP_AUTO_MIGRATE',
  'TF_AUTO_MIGRATE_MODE',
  'TF_RELEASE_DEPLOYED_AT',
  'TF_PUBLIC_URL',
  'TF_PUBLIC_HOST',
]);

function validateArtifact(artifact) {
  if (!artifact || !SHA.test(artifact.sha)) throw new Error('artifact SHA is invalid');
  if (!DIGEST_REF.test(artifact.backendRef) || !artifact.backendRef.includes('-backend-')) {
    throw new Error('backend artifact ref is invalid');
  }
  if (!DIGEST_REF.test(artifact.frontendRef) || !artifact.frontendRef.includes('-frontend-')) {
    throw new Error('frontend artifact ref is invalid');
  }
  return artifact;
}

export function planDeployment(state, candidate) {
  validateArtifact(candidate);
  const existing = state.snapshots[candidate.sha];
  const legacyCurrent = state.legacyCurrentArtifact;
  if (state.currentSha === candidate.sha && !existing) {
    if (!legacyCurrent)
      throw new Error('same-SHA legacy migration requires resolved running identity');
    validateArtifact(legacyCurrent);
    if (
      legacyCurrent.backendRef !== candidate.backendRef ||
      legacyCurrent.frontendRef !== candidate.frontendRef
    ) {
      throw new Error('same SHA cannot be rebound to different image digests');
    }
  }
  if (
    existing &&
    (existing.backendRef !== candidate.backendRef || existing.frontendRef !== candidate.frontendRef)
  ) {
    throw new Error('same SHA cannot be rebound to different image digests');
  }
  return {
    preserveCurrent: Boolean(state.currentSha && !state.snapshots[state.currentSha]),
    nextState: {
      currentSha: candidate.sha,
      snapshots: { ...state.snapshots, [candidate.sha]: candidate },
    },
  };
}

export function planRollback(state, targetSha) {
  if (!SHA.test(targetSha)) throw new Error('rollback target SHA is invalid');
  const target = state.snapshots[targetSha];
  if (!target) throw new Error('rollback target has no immutable snapshot');
  validateArtifact(target);
  if (state.currentSha === targetSha) {
    return { noop: true, fromSha: state.currentSha, nextState: state };
  }
  return {
    noop: false,
    fromSha: state.currentSha,
    nextState: { currentSha: targetSha, snapshots: { ...state.snapshots } },
  };
}

export function createSecretlessArtifactMetadata(legacyEnvironment, resolved) {
  const metadata = {};
  for (const [key, value] of Object.entries(legacyEnvironment)) {
    if (SAFE_METADATA.has(key)) metadata[key] = value;
  }
  metadata.TF_BACKEND_IMAGE = resolved.backendRef;
  metadata.TF_FRONTEND_IMAGE = resolved.frontendRef;
  if (!SHA.test(metadata.TF_RELEASE_SHA ?? '')) throw new Error('legacy release SHA is invalid');
  validateArtifact({
    sha: metadata.TF_RELEASE_SHA,
    backendRef: metadata.TF_BACKEND_IMAGE,
    frontendRef: metadata.TF_FRONTEND_IMAGE,
  });
  return metadata;
}

export const QUARANTINE_PATTERNS = [
  /^_archive\//,
  /^Dev - Copy\//,
  /^_pre_restore_safety_/,
  /^node_modules\//,
  /^\.[^/]+/,
  /^workspaces\/[^/]+\/\.github\/instructions/,
];

export const PRIVACY_TIER_ONLY_MARKERS = [
  "tier_17_privacy",
  "tier_18_immersive_privacy",
];

export const WEIGHTS = {
  // Buildability
  packageJsonBuildTest: 2,
  cargoToml: 2,
  dotnetSolutionOrProj: 2,
  dockerArtifacts: 2,
  nextAppApiRoutes: 1,
  viteConfig: 1,
  pythonProject: 1,

  // Governance (inherited allowed)
  pnpmLockLocal: 2,
  pnpmLockInherited: 1,
  workflowRef: 2,
  renovateRef: 2,

  // Runtime wiring
  serviceRegistryRef: 3,
  composeRef: 3,
  osShellMountRef: 3,
  kernelGatewayRef: 3,
};

export type Bucket =
  | "CORE_OS_RUNTIME"
  | "CORE_OS_TOOLING"
  | "GEN2_APPS"
  | "QUARANTINE";

export const FORCE_BUCKETS: Record<string, Bucket> = {
  ".": "CORE_OS_TOOLING",
  "_CLEAN_BUILD_ZONE": "CORE_OS_TOOLING",
  SDK: "CORE_OS_TOOLING",
  "ecosystem/intake": "CORE_OS_TOOLING",
};

export const FORCE_BUCKET_PATTERNS: Array<{ pattern: RegExp; bucket: Bucket }> = [
  { pattern: /^\.[^/]+/, bucket: "QUARANTINE" },
];

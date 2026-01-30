import {
  Bucket,
  FORCE_BUCKETS,
  FORCE_BUCKET_PATTERNS,
  QUARANTINE_PATTERNS,
  WEIGHTS,
} from "./config";
import type { MarkerOrigin } from "./scanMarkers";

export type RootFacts = {
  root: string;
  markers: string[];
  markerOrigins: MarkerOrigin[];
  inheritedMarkers: string[];
  wiring: string[];
  touchedRelease: boolean;
  touchedDev: boolean;
  pathFlags: string[];
};

export type Classification = {
  bucket: Bucket;
  evidence: {
    score: number;
    scoreLocal: number;
    scoreTotal: number;
    buildableLocal: boolean;
    markers: string[];
    markerOrigins: MarkerOrigin[];
    inherited: string[];
    wiring: string[];
    touchedRelease: boolean;
    touchedDev: boolean;
    pathFlags: string[];
  };
};

export function classifyRoot(facts: RootFacts): Classification {
  const forcedBucket =
    FORCE_BUCKETS[facts.root] ??
    FORCE_BUCKET_PATTERNS.find((rule) => rule.pattern.test(facts.root))?.bucket;
  const skipQuarantine = Boolean(forcedBucket && forcedBucket !== "QUARANTINE");
  if (!skipQuarantine && QUARANTINE_PATTERNS.some((re) => re.test(facts.root))) {
    return {
      bucket: "QUARANTINE",
      evidence: {
        score: 0,
        scoreLocal: 0,
        scoreTotal: 0,
        buildableLocal: false,
        markers: facts.markers,
        markerOrigins: facts.markerOrigins,
        inherited: facts.inheritedMarkers,
        wiring: facts.wiring,
        touchedRelease: facts.touchedRelease,
        touchedDev: facts.touchedDev,
        pathFlags: facts.pathFlags,
      },
    };
  }

  if (!skipQuarantine && facts.pathFlags.includes("privacy-tier-only")) {
    return {
      bucket: "QUARANTINE",
      evidence: {
        score: 0,
        scoreLocal: 0,
        scoreTotal: 0,
        buildableLocal: false,
        markers: facts.markers,
        markerOrigins: facts.markerOrigins,
        inherited: facts.inheritedMarkers,
        wiring: facts.wiring,
        touchedRelease: facts.touchedRelease,
        touchedDev: facts.touchedDev,
        pathFlags: facts.pathFlags,
      },
    };
  }

  const markerSet = new Set(facts.markers);
  const inheritedSet = new Set(facts.inheritedMarkers);
  const wiringSet = new Set(facts.wiring);

  const has = (m: string) => markerSet.has(m);
  const inh = (m: string) => inheritedSet.has(m);
  const wire = (w: string) => wiringSet.has(w);

  let scoreLocal = 0;
  if (has("package.json:buildOrTest")) scoreLocal += WEIGHTS.packageJsonBuildTest;
  if (has("Cargo.toml")) scoreLocal += WEIGHTS.cargoToml;
  if (has("dotnet")) scoreLocal += WEIGHTS.dotnetSolutionOrProj;
  if (has("docker")) scoreLocal += WEIGHTS.dockerArtifacts;
  if (has("next:appApiRoutes") || has("next:config")) scoreLocal += WEIGHTS.nextAppApiRoutes;
  if (has("vite")) scoreLocal += WEIGHTS.viteConfig;
  if (has("python")) scoreLocal += WEIGHTS.pythonProject;

  let scoreTotal = scoreLocal;

  if (has("pnpm-lock.yaml")) scoreTotal += WEIGHTS.pnpmLockLocal;
  else if (inh("pnpm-lock.yaml")) scoreTotal += WEIGHTS.pnpmLockInherited;
  if (inh("workflow-ref")) scoreTotal += WEIGHTS.workflowRef;
  if (inh("renovate-ref")) scoreTotal += WEIGHTS.renovateRef;

  if (wire("service-registry-ref")) scoreTotal += WEIGHTS.serviceRegistryRef;
  if (wire("compose-ref")) scoreTotal += WEIGHTS.composeRef;
  if (wire("os-shell-mount-ref")) scoreTotal += WEIGHTS.osShellMountRef;
  if (wire("kernel-gateway-ref")) scoreTotal += WEIGHTS.kernelGatewayRef;

  const wiringScore =
    (wire("service-registry-ref") ? WEIGHTS.serviceRegistryRef : 0) +
    (wire("compose-ref") ? WEIGHTS.composeRef : 0) +
    (wire("os-shell-mount-ref") ? WEIGHTS.osShellMountRef : 0) +
    (wire("kernel-gateway-ref") ? WEIGHTS.kernelGatewayRef : 0);

  const buildableLocal = scoreLocal >= 2;
  const isToolingRoot =
    facts.root.includes("TerraFusionIDE") || facts.root.includes("terrabuild-modernization");

  let bucket: Bucket = "QUARANTINE";

  if (forcedBucket) {
    bucket = forcedBucket;
  } else if (!buildableLocal) {
    bucket = "QUARANTINE";
  } else if (wiringScore >= 6) {
    bucket = "CORE_OS_RUNTIME";
  } else if (isToolingRoot) {
    bucket = "CORE_OS_TOOLING";
  } else if (facts.touchedDev || facts.touchedRelease) {
    bucket = "GEN2_APPS";
  } else {
    bucket = "QUARANTINE";
  }

  return {
    bucket,
    evidence: {
      score: scoreTotal,
      scoreLocal,
      scoreTotal,
      buildableLocal,
      markers: facts.markers,
      markerOrigins: facts.markerOrigins,
      inherited: facts.inheritedMarkers,
      wiring: facts.wiring,
      touchedRelease: facts.touchedRelease,
      touchedDev: facts.touchedDev,
      pathFlags: facts.pathFlags,
    },
  };
}

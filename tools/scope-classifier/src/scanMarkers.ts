import fs from "node:fs";
import path from "node:path";

export type MarkerOrigin = {
  marker: string;
  foundAt: string;
};

export type MarkerScan = {
  root: string;
  markers: string[];
  markerOrigins: MarkerOrigin[];
  pathFlags: string[];
};

export type ScanOptions = {
  recursive?: boolean;
  maxDepth?: number;
  maxFiles?: number;
  trackedDirs?: Set<string> | null;
};

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".pnpm-store",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
  "artifacts",
  "_artifacts",
  ".ci_artifacts_local",
  "Dev",
  "Dev - Copy",
  "Dev - Copy (2)",
]);

function exists(p: string) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readJson(p: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function hasAnyScriptBuildOrTest(pkg: any): boolean {
  const scripts = pkg?.scripts ?? {};
  return Boolean(scripts.build || scripts.test || scripts["test:ci"] || scripts["build:ci"]);
}

function toRel(repoRoot: string, p: string): string {
  return path.relative(repoRoot, p).replace(/\\/g, "/");
}

export function scanRootMarkers(
  repoRoot: string,
  relRoot: string,
  options: ScanOptions = {}
): MarkerScan {
  const abs = path.join(repoRoot, relRoot);
  const markers = new Set<string>();
  const markerOrigins: MarkerOrigin[] = [];
  const pathFlags: string[] = [];

  const recursive = options.recursive ?? true;
  const maxDepth = options.maxDepth ?? 3;
  const maxFiles = options.maxFiles ?? 5000;
  const trackedDirs = options.trackedDirs ?? null;

  const rootEntries = exists(abs) ? fs.readdirSync(abs, { withFileTypes: true }) : [];
  const hasTier = rootEntries.some(
    (d) => d.isDirectory() && (d.name === "tier_17_privacy" || d.name === "tier_18_immersive_privacy")
  );
  const hasNonTierDir = rootEntries.some(
    (d) => d.isDirectory() && d.name !== "tier_17_privacy" && d.name !== "tier_18_immersive_privacy"
  );
  const hasNonTierFile = rootEntries.some(
    (d) => d.isFile() && d.name !== "tier_17_privacy" && d.name !== "tier_18_immersive_privacy"
  );

  if (hasTier && !hasNonTierDir && !hasNonTierFile) {
    pathFlags.push("privacy-tier-only");
  }

  let fileCount = 0;

  function addMarker(marker: string, foundAt: string) {
    markers.add(marker);
    markerOrigins.push({ marker, foundAt });
  }

  function isTrackedDir(dir: string): boolean {
    if (!trackedDirs) return true;
    const rel = toRel(repoRoot, dir);
    return trackedDirs.has(rel === "" ? "." : rel);
  }

  function scanDir(dir: string, depth: number) {
    if (!exists(dir)) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (!isTrackedDir(full)) continue;
        if (entry.name === "api" && path.basename(path.dirname(full)) === "app") {
          addMarker("next:appApiRoutes", toRel(repoRoot, full));
        }
        if (recursive && depth < maxDepth) {
          scanDir(full, depth + 1);
        }
        continue;
      }

      if (!entry.isFile()) continue;

      fileCount += 1;
      if (fileCount > maxFiles) {
        pathFlags.push("scan:fileCapExceeded");
        return;
      }

      const name = entry.name;
      const relFound = toRel(repoRoot, full);

      if (name === "package.json") {
        const pkg = readJson(full);
        if (pkg?.packageManager) addMarker("packageManager", relFound);
        if (hasAnyScriptBuildOrTest(pkg)) addMarker("package.json:buildOrTest", relFound);
        continue;
      }

      if (name === "pnpm-lock.yaml") {
        addMarker("pnpm-lock.yaml", relFound);
        continue;
      }

      if (name === "pnpm-workspace.yaml") {
        addMarker("pnpm-workspace.yaml", relFound);
        continue;
      }

      if (name === "Cargo.toml") {
        addMarker("Cargo.toml", relFound);
        continue;
      }

      if (name.endsWith(".sln") || name.endsWith(".csproj")) {
        addMarker("dotnet", relFound);
        continue;
      }

      if (name === "Dockerfile") {
        addMarker("docker", relFound);
        continue;
      }

      const lower = name.toLowerCase();
      if (lower.startsWith("docker-compose") || lower === "compose.yml" || lower === "compose.yaml") {
        addMarker("docker", relFound);
        continue;
      }

      if (name === "next.config.js" || name === "next.config.mjs") {
        addMarker("next:config", relFound);
        continue;
      }

      if (name === "vite.config.ts" || name === "vite.config.js") {
        addMarker("vite", relFound);
        continue;
      }

      if (name === "pyproject.toml" || name === "requirements.txt" || name === "Pipfile") {
        addMarker("python", relFound);
        continue;
      }
    }
  }

  scanDir(abs, 0);

  const markerList = Array.from(markers).sort();
  const markerOriginsSorted = markerOrigins.sort((a, b) => {
    const markerCmp = a.marker.localeCompare(b.marker);
    if (markerCmp !== 0) return markerCmp;
    return a.foundAt.localeCompare(b.foundAt);
  });

  return { root: relRoot, markers: markerList, markerOrigins: markerOriginsSorted, pathFlags };
}

export function scanRoots(repoRoot: string, roots: string[], options: ScanOptions = {}): MarkerScan[] {
  return roots.map((r) => scanRootMarkers(repoRoot, r, options));
}

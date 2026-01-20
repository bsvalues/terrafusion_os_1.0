import fs from "node:fs";
import path from "node:path";

export type RefScan = {
  inheritedMarkers: string[];
  wiring: string[];
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

function exists(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function collectFiles(
  root: string,
  predicate: (p: string) => boolean,
  repoRoot: string,
  trackedDirs?: Set<string> | null
): string[] {
  const files: string[] = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (trackedDirs) {
          const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
          if (!trackedDirs.has(rel === "" ? "." : rel)) continue;
        }
        stack.push(full);
        continue;
      }
      if (entry.isFile() && predicate(full)) {
        files.push(full);
      }
    }
  }
  return files.sort();
}

function readFileSafe(p: string): string {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function buildTokens(root: string): string[] {
  if (root === ".") return [];
  const normalized = root.replace(/\\/g, "/");
  const tokens = new Set<string>();
  tokens.add(normalized);
  tokens.add(`./${normalized}`);
  tokens.add(normalized.replace(/\//g, "\\"));
  if (!normalized.includes("/")) {
    tokens.add(`${normalized}/`);
    tokens.add(`${normalized}\\`);
    tokens.add(`./${normalized}/`);
    tokens.add(`./${normalized}\\`);
  }
  return Array.from(tokens).filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesToken(text: string, token: string): boolean {
  const escaped = escapeRegex(token);
  const boundary = "[\\s\"'()\\[\\]{}:=]";
  if (token.includes("/") || token.includes("\\")) {
    const pathBoundary = `${boundary}|[\\\\/]`;
    const endBoundary = token.endsWith("/") || token.endsWith("\\") ? "" : `($|${pathBoundary})`;
    const re = new RegExp(`(^|${pathBoundary})${escaped}${endBoundary}`);
    return re.test(text);
  }
  const re = new RegExp(`(^|${boundary}|[\\\\/])${escaped}($|${boundary}|[\\\\/])`);
  return re.test(text);
}

function matchRoots(
  content: string,
  roots: string[],
  rootTokens: Record<string, string[]>
): string[] {
  const matches: string[] = [];
  for (const root of roots) {
    const tokens = rootTokens[root];
    if (!tokens || tokens.length === 0) continue;
    if (tokens.some((t) => matchesToken(content, t))) {
      matches.push(root);
    }
  }
  return matches;
}

export function scanRefs(
  repoRoot: string,
  roots: string[],
  trackedDirs?: Set<string> | null
): Record<string, RefScan> {
  const result: Record<string, RefScan> = {};
  for (const root of roots) {
    result[root] = { inheritedMarkers: [], wiring: [] };
  }

  const rootTokens: Record<string, string[]> = {};
  for (const root of roots) {
    rootTokens[root] = buildTokens(root);
  }

  const repoHasPnpmLock = exists(path.join(repoRoot, "pnpm-lock.yaml"));
  const repoRenovate = path.join(repoRoot, "renovate.json");
  const repoRenovateText = exists(repoRenovate) ? readFileSafe(repoRenovate) : "";

  const workflowDir = path.join(repoRoot, ".github", "workflows");
  const workflowFiles = exists(workflowDir)
    ? collectFiles(
        workflowDir,
        (p) => p.endsWith(".yml") || p.endsWith(".yaml"),
        repoRoot,
        trackedDirs
      )
    : [];

  const serviceRegistryDir = path.join(repoRoot, "config", "service-registry");
  const serviceRegistryFiles: string[] = [];
  if (exists(serviceRegistryDir)) {
    serviceRegistryFiles.push(
      ...collectFiles(
        serviceRegistryDir,
        (p) => p.endsWith(".json") || p.endsWith(".yml") || p.endsWith(".yaml"),
        repoRoot,
        trackedDirs
      )
    );
  }
  const rootRegistry = path.join(repoRoot, "registry.json");
  if (exists(rootRegistry)) serviceRegistryFiles.push(rootRegistry);

  const composeFiles = collectFiles(
    repoRoot,
    (p) => {
      const name = path.basename(p).toLowerCase();
      return name.startsWith("docker-compose") || name === "compose.yml" || name === "compose.yaml";
    },
    repoRoot,
    trackedDirs
  );

  const osShellDir = path.join(repoRoot, "frontend", "apps", "os-shell");
  const osShellFiles = exists(osShellDir)
    ? collectFiles(
        osShellDir,
        (p) =>
          p.endsWith(".ts") ||
          p.endsWith(".tsx") ||
          p.endsWith(".js") ||
          p.endsWith(".json") ||
          p.endsWith(".yml") ||
          p.endsWith(".yaml"),
        repoRoot,
        trackedDirs
      )
    : [];

  const backendDir = path.join(repoRoot, "backend");
  const backendFiles = exists(backendDir)
    ? collectFiles(
        backendDir,
        (p) => p.endsWith(".ts") || p.endsWith(".cs") || p.endsWith(".json") || p.endsWith(".yml") || p.endsWith(".yaml"),
        repoRoot,
        trackedDirs
      )
    : [];

  for (const root of roots) {
    if (repoHasPnpmLock && !exists(path.join(repoRoot, root, "pnpm-lock.yaml"))) {
      result[root].inheritedMarkers.push("pnpm-lock.yaml");
    }
  }

  const workflowText = workflowFiles.map(readFileSafe).join("\n");
  const workflowMatches = matchRoots(workflowText, roots, rootTokens);
  for (const root of workflowMatches) {
    result[root].inheritedMarkers.push("workflow-ref");
  }

  if (repoRenovateText) {
    const renovateMatches = matchRoots(repoRenovateText, roots, rootTokens);
    for (const root of renovateMatches) {
      result[root].inheritedMarkers.push("renovate-ref");
    }
  }

  const serviceText = serviceRegistryFiles.map(readFileSafe).join("\n");
  const serviceMatches = matchRoots(serviceText, roots, rootTokens);
  for (const root of serviceMatches) {
    result[root].wiring.push("service-registry-ref");
  }

  const composeText = composeFiles.map(readFileSafe).join("\n");
  const composeMatches = matchRoots(composeText, roots, rootTokens);
  for (const root of composeMatches) {
    result[root].wiring.push("compose-ref");
  }

  const osShellText = osShellFiles.map(readFileSafe).join("\n");
  const osShellMatches = matchRoots(osShellText, roots, rootTokens);
  for (const root of osShellMatches) {
    result[root].wiring.push("os-shell-mount-ref");
  }

  const backendText = backendFiles.map(readFileSafe).join("\n");
  const backendMatches = matchRoots(backendText, roots, rootTokens);
  for (const root of backendMatches) {
    result[root].wiring.push("kernel-gateway-ref");
  }

  for (const root of roots) {
    result[root].inheritedMarkers = Array.from(new Set(result[root].inheritedMarkers)).sort();
    result[root].wiring = Array.from(new Set(result[root].wiring)).sort();
  }

  return result;
}

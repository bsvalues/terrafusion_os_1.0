import fs from "node:fs";
import path from "node:path";
import { scanRootMarkers } from "./scanMarkers";
import { scanRefs } from "./scanRefs";
import { getTouchedRoots } from "./gitTouched";
import { classifyRoot } from "./classify";
import { writeScopeOutputs } from "./writeOutputs";
import { getTrackedDirs } from "./trackedDirs";

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

const TWO_SEGMENT_ROOTS = new Set([
  "applications",
  "workspaces",
  "agents",
  "tools",
  "os-platform",
  "packages",
  "marketplace",
  "ecosystem",
  "deployment",
  "infrastructure",
]);

const FILE_MARKERS = [
  "package.json",
  "Cargo.toml",
  "Dockerfile",
  "pyproject.toml",
  "requirements.txt",
  "Pipfile",
];

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.split("=");
    if (value) {
      args[key] = value;
    } else if (i + 1 < argv.length) {
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
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

function rootFromPath(repoRoot: string, filePath: string): string {
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  if (!rel || !rel.includes("/")) return ".";
  const parts = rel.split("/");
  const first = parts[0];
  if (TWO_SEGMENT_ROOTS.has(first) && parts.length >= 2) {
    const candidate = path.join(repoRoot, first, parts[1]);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return `${first}/${parts[1]}`;
    }
  }
  return first;
}

function collectCandidateRoots(repoRoot: string, trackedDirs?: Set<string> | null): string[] {
  const roots = new Set<string>(["."]);

  const markerFiles = collectFiles(repoRoot, (p) => {
    const name = path.basename(p);
    if (FILE_MARKERS.includes(name)) return true;
    if (name.endsWith(".sln") || name.endsWith(".csproj")) return true;
    if (name.toLowerCase().startsWith("docker-compose")) return true;
    if (name === "compose.yml" || name === "compose.yaml") return true;
    return false;
  }, repoRoot, trackedDirs);

  for (const file of markerFiles) {
    roots.add(rootFromPath(repoRoot, file));
  }

  return Array.from(roots).sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(args["--repoRoot"] ?? process.cwd());
  const trackedDirs = getTrackedDirs(repoRoot);
  const anchors = {
    release: args["--solidBase"] ?? "567fbcec5",
    dev: args["--archAnchor"] ?? "9af5bb291",
  };

  const roots = collectCandidateRoots(repoRoot, trackedDirs);
  const recursive = args["--recursive"] ? args["--recursive"] !== "false" : true;
  const maxDepth = Number(args["--maxDepth"] ?? 3);
  const maxFiles = Number(args["--maxFiles"] ?? 5000);
  const markerScans = new Map(
    roots.map((r) => [
      r,
      scanRootMarkers(repoRoot, r, {
        recursive: r === "." ? false : recursive,
        maxDepth,
        maxFiles,
        trackedDirs,
      }),
    ])
  );
  const refScans = scanRefs(repoRoot, roots, trackedDirs);
  const touched = getTouchedRoots(repoRoot, anchors);

  const classified = roots.map((root) => {
    const markers = markerScans.get(root);
    const refs = refScans[root] ?? { inheritedMarkers: [], wiring: [] };
    const touchedRelease = Boolean(touched.touchedRelease[root]);
    const touchedDev = Boolean(touched.touchedDev[root]);

    const classification = classifyRoot({
      root,
      markers: markers?.markers ?? [],
      markerOrigins: markers?.markerOrigins ?? [],
      inheritedMarkers: refs.inheritedMarkers,
      wiring: refs.wiring,
      touchedRelease,
      touchedDev,
      pathFlags: markers?.pathFlags ?? [],
    });

    return {
      root,
      bucket: classification.bucket,
      evidence: classification.evidence,
    };
  });

  writeScopeOutputs(repoRoot, classified, anchors);

  console.log("scope-classifier: outputs written");
  console.log(`ROOTS=${roots.length}`);
  console.log(`ANCHORS: release=${anchors.release} dev=${anchors.dev}`);
}

main();

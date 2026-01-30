import { execSync } from "node:child_process";
import fs from "node:fs";

export type AnchorInputs = {
  release: string;
  dev: string;
};

export type TouchedMap = Record<string, boolean>;

export type TouchedRoots = {
  touchedRelease: TouchedMap;
  touchedDev: TouchedMap;
};

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

function rootFromPath(p: string, repoRoot?: string): string {
  const normalized = p.replace(/\\/g, "/");
  if (!normalized || !normalized.includes("/")) return ".";
  const parts = normalized.split("/");
  const first = parts[0];
  if (TWO_SEGMENT_ROOTS.has(first) && parts.length >= 2) {
    if (repoRoot) {
      const candidate = `${repoRoot}/${first}/${parts[1]}`.replace(/\\/g, "/");
      try {
        const stat = fs.statSync(candidate);
        if (stat.isDirectory()) {
          return `${first}/${parts[1]}`;
        }
      } catch {
        // fall through
      }
    } else {
      return `${first}/${parts[1]}`;
    }
  }
  return first === "" ? "." : first;
}

export function computeTouchedFromNames(names: string[], repoRoot?: string): TouchedMap {
  const touched: TouchedMap = {};
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const root = rootFromPath(trimmed, repoRoot);
    touched[root] = true;
    touched["."] = true;
  }
  return touched;
}

function gitNames(repoRoot: string, anchor: string): string[] {
  const cmd = `git -C "${repoRoot}" diff --name-only ${anchor}..HEAD`;
  const out = execSync(cmd, { encoding: "utf8" });
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function computeTouched(repoRoot: string, anchor: string): TouchedMap {
  return computeTouchedFromNames(gitNames(repoRoot, anchor), repoRoot.replace(/\\/g, "/"));
}

export function getTouchedRoots(repoRoot: string, anchors: AnchorInputs): TouchedRoots {
  return {
    touchedRelease: computeTouched(repoRoot, anchors.release),
    touchedDev: computeTouched(repoRoot, anchors.dev),
  };
}

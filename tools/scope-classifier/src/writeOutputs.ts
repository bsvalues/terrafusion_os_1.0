import fs from "node:fs";
import path from "node:path";
import type { Bucket } from "./config";
import type { MarkerOrigin } from "./scanMarkers";

export type Classified = {
  root: string;
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

function sortKeysWrapper(key: string, value: any) {
  if (value instanceof Object && !(value instanceof Array)) {
    return Object.keys(value)
      .sort()
      .reduce((sorted: any, key: string) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
  }
  return value;
}

export function writeJson(p: string, obj: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  // Use a temporary object-sorter replacer or pre-sort the object
  // JSON.stringify(obj, replacer) isn't enough for deep key sort in all engines, 
  // but creating a new object with sorted keys works.
  
  // Actually, a simple deep sort function is better.
  const sortedObj = deepSortKeys(obj);
  fs.writeFileSync(p, JSON.stringify(sortedObj, null, 2) + "\n", "utf8");
}

function deepSortKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepSortKeys); // Process arrays but don't sort the array itself (order might matter)
  }
  if (obj && typeof obj === "object") {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = deepSortKeys(obj[key]);
      });
    return sorted;
  }
  return obj;
}

export function writeMarkdown(p: string, md: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, md, "utf8");
}

export function writeScopeOutputs(
  repoRoot: string,
  items: Classified[],
  anchors: { release: string; dev: string }
) {
  const by: Record<string, Classified[]> = {
    CORE_OS_RUNTIME: [],
    CORE_OS_TOOLING: [],
    GEN2_APPS: [],
    QUARANTINE: [],
  };

  for (const it of items) by[it.bucket].push(it);
  for (const k of Object.keys(by)) by[k].sort((a, b) => a.root.localeCompare(b.root));

  writeJson(path.join(repoRoot, "DEPENDENCY_SCOPE_CORE_OS_RUNTIME.json"), by.CORE_OS_RUNTIME);
  writeJson(path.join(repoRoot, "DEPENDENCY_SCOPE_CORE_OS_TOOLING.json"), by.CORE_OS_TOOLING);
  writeJson(path.join(repoRoot, "DEPENDENCY_SCOPE_GEN2_APPS.json"), by.GEN2_APPS);
  writeJson(path.join(repoRoot, "DEPENDENCY_SCOPE_QUARANTINE.json"), by.QUARANTINE);
  writeJson(
    path.join(repoRoot, "DEPENDENCY_SCOPE_SOLIDIFIED_OS.json"),
    [...by.CORE_OS_RUNTIME, ...by.CORE_OS_TOOLING]
  );
  writeJson(
    path.join(repoRoot, "DEPENDENCY_SCOPE_LEGACY_QUARANTINE.json"),
    by.QUARANTINE
  );

  const md = [
    "# TerraFusion Scope Report",
    "",
    `SOLID_BASE: ${anchors.release}`,
    `ARCH_ANCHOR: ${anchors.dev}`,
    "",
    "## Totals",
    `- CORE_OS_RUNTIME: ${by.CORE_OS_RUNTIME.length}`,
    `- CORE_OS_TOOLING: ${by.CORE_OS_TOOLING.length}`,
    `- GEN2_APPS: ${by.GEN2_APPS.length}`,
    `- QUARANTINE: ${by.QUARANTINE.length}`,
    "",
    "## Top Evidence Samples",
    ...items.slice(0, 20).map((i) =>
      `- ${i.root} -> ${i.bucket} (local=${i.evidence.scoreLocal}; total=${i.evidence.scoreTotal}; wiring=${i.evidence.wiring.join(",") || "none"})`
    ),
    "",
  ].join("\n");

  writeMarkdown(path.join(repoRoot, "DEPENDENCY_SCOPE_REPORT.md"), md);
}

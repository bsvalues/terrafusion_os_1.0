/**
 * Phase 161 — Governance Contract
 * "All referenced --tf-*-hs anchors must be centrally defined."
 *
 * For every file that USES a `var(--tf-<name>-hs)` reference, the anchor
 * must be declared EITHER:
 *   (a) in the SAME file (component-scoped / file-local), OR
 *   (b) in one of the canonical token sources (shared / semantic).
 *
 * Fails CI if a sweep introduces an anchor that has no definition anywhere.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Directories / files where shared HS anchors MUST be defined */
const CANONICAL_ROOTS: string[] = [
  path.join(REPO_ROOT, "frontend/apps/os-shell/src/styles"),
  path.join(REPO_ROOT, "frontend/apps/os-shell/src/design-system"),
  path.join(REPO_ROOT, "frontend/apps/os-shell/src/design"),
  path.join(
    REPO_ROOT,
    "frontend/apps/os-shell/src/components/terrafusion-design-system.ts",
  ),
];

/** Extensions considered when scanning for usages and definitions */
const SCAN_EXTENSIONS = new Set([
  ".css",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
]);

/** Pattern that matches a DEFINITION of an HS anchor
 *  CSS:  --tf-xxx-hs: value;
 *  JS:   '--tf-xxx-hs': value   or   "--tf-xxx-hs": value
 */
const HS_DEFINITION_RE = /--tf-([a-z0-9-]+)-hs['"]?\s*:/g;

/** Pattern that matches a USAGE / reference of an HS anchor */
const HS_USAGE_RE = /var\(\s*--tf-([a-z0-9-]+)-hs\b/g;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Recursively collect file paths under `dir` matching allowed extensions */
function collectFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.has(path.extname(dir))) results.push(dir);
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git" ||
        entry.name === "build"
      ) {
        continue;
      }
      results.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }

  return results;
}

/** Extract all unique HS anchor names matching `regex` from files under `roots` */
function extractAnchors(roots: string[], regex: RegExp): Set<string> {
  const anchors = new Set<string>();

  for (const root of roots) {
    for (const file of collectFiles(root)) {
      const content = fs.readFileSync(file, "utf8");
      let match: RegExpExecArray | null;
      const re = new RegExp(regex.source, "g");
      while ((match = re.exec(content)) !== null) {
        anchors.add(match[1]);
      }
    }
  }

  return anchors;
}

/** Extract HS anchor names from a single file's content */
function extractFromContent(content: string, regex: RegExp): Set<string> {
  const anchors = new Set<string>();
  const re = new RegExp(regex.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    anchors.add(match[1]);
  }
  return anchors;
}

/* ------------------------------------------------------------------ */
/* Test                                                                */
/* ------------------------------------------------------------------ */

describe("Governance: HS Anchor Central Definitions", () => {
  const frontendSrc = path.join(REPO_ROOT, "frontend/apps/os-shell/src");

  it("every --tf-*-hs usage has a definition (file-local or canonical)", () => {
    // 1. Collect all HS anchor DEFINITIONS from canonical roots
    const canonicalDefs = extractAnchors(CANONICAL_ROOTS, HS_DEFINITION_RE);

    expect(
      canonicalDefs.size,
      "Expected at least one --tf-*-hs definition in canonical sources",
    ).toBeGreaterThan(0);

    // 2. Walk every file in frontend/src; for each usage, verify it's defined
    //    either in the same file or in a canonical root
    const orphans: Array<{ anchor: string; file: string }> = [];
    const allFiles = collectFiles(frontendSrc);

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const usages = extractFromContent(content, HS_USAGE_RE);
      if (usages.size === 0) continue;

      // Definitions in THIS file (component-scoped anchors)
      const localDefs = extractFromContent(content, HS_DEFINITION_RE);

      for (const anchor of usages) {
        if (!localDefs.has(anchor) && !canonicalDefs.has(anchor)) {
          orphans.push({
            anchor: `--tf-${anchor}-hs`,
            file: path.relative(REPO_ROOT, filePath),
          });
        }
      }
    }

    // 3. Assert zero orphans
    if (orphans.length > 0) {
      // De-duplicate by anchor name for the summary
      const uniqueAnchors = [...new Set(orphans.map((o) => o.anchor))].sort();
      const details = orphans
        .map((o) => `  • ${o.anchor}  (used in ${o.file})`)
        .join("\n");

      expect(
        orphans,
        [
          `${uniqueAnchors.length} HS anchor(s) have NO definition (not file-local, not canonical):`,
          details,
          "",
          "Canonical roots searched:",
          ...CANONICAL_ROOTS.map((r) => `  ${path.relative(REPO_ROOT, r)}`),
          "",
          "Fix: define the anchor in the component file OR add it to a canonical token file.",
        ].join("\n"),
      ).toHaveLength(0);
    }
  });

  it("canonical token sources exist", () => {
    const stylesDir = path.join(
      REPO_ROOT,
      "frontend/apps/os-shell/src/styles",
    );
    expect(
      fs.existsSync(stylesDir),
      `Canonical styles directory missing: ${stylesDir}`,
    ).toBe(true);
  });

  it("reports defined canonical anchors (informational)", () => {
    const definedAnchors = extractAnchors(CANONICAL_ROOTS, HS_DEFINITION_RE);

    const sorted = [...definedAnchors].sort();
    console.log(
      `\n  Canonical HS anchors (${sorted.length}):\n` +
        sorted.map((a) => `    --tf-${a}-hs`).join("\n"),
    );

    expect(sorted.length).toBeGreaterThan(0);
  });
});

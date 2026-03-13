/**
 * Shell Governance: no hardcoded z-[NUMBER] in primary shell components
 *
 * Primary shell chrome (Desktop, Taskbar, StartMenu, CommandPalette,
 * AltTabSwitcher, DesktopIconGrid, StageZeroState) must use Z.* constants
 * from zIndex.ts — never raw Tailwind z-[NUMBER] classes.
 *
 * Hardcoded z-index values create layering conflicts and make the
 * z-stack impossible to reason about globally.
 *
 * Window.tsx is exempt — its z-[N] values are local within-window layers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SHELL_DIR = path.resolve(
  import.meta.dirname,
  "../../../frontend/apps/os-shell/src/shell/desktop"
);

/** Primary shell files that must use Z.* constants */
const PRIMARY_SHELL_FILES = [
  "Desktop.tsx",
  "Taskbar.tsx",
  "StartMenu.tsx",
  "DesktopIconGrid.tsx",
  "StageZeroState.tsx",
];

/** Regex: Tailwind z-[NUMBER] pattern */
const Z_HARDCODED = /\bz-\[\d+\]/g;

test("primary shell components have no hardcoded z-[NUMBER] classes", async (t) => {
  const violations = [];

  for (const file of PRIMARY_SHELL_FILES) {
    const filePath = path.join(SHELL_DIR, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const matches = content.match(Z_HARDCODED);
    if (matches) {
      violations.push({ file, matches });
    }
  }

  assert.equal(
    violations.length,
    0,
    `Found hardcoded z-[NUMBER] in shell components:\n${violations
      .map((v) => `  ${v.file}: ${v.matches.join(", ")}`)
      .join("\n")}\nUse Z.* constants from zIndex.ts instead.`
  );
});

test("primary shell files import Z from zIndex", async (t) => {
  const missing = [];

  for (const file of PRIMARY_SHELL_FILES) {
    const filePath = path.join(SHELL_DIR, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");

    // Check if file uses any z-index at all (via Z. or style zIndex)
    const usesZIndex =
      content.includes("zIndex") || content.includes("Z.");

    if (usesZIndex && !content.includes("from './zIndex'") && !content.includes('from "./zIndex"')) {
      missing.push(file);
    }
  }

  assert.equal(
    missing.length,
    0,
    `Shell files use z-index but don't import from zIndex.ts:\n${missing
      .map((f) => `  ${f}`)
      .join("\n")}`
  );
});

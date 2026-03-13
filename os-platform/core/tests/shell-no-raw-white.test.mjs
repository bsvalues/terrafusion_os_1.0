/**
 * Shell Governance: no raw white/* Tailwind in shell chrome components
 *
 * Shell chrome (dock, top bar, window chrome, desktop surface) must use
 * TerraFusion design tokens or semantic classes — never raw Tailwind
 * `text-white/N`, `bg-white/N`, `border-white/N` etc.
 *
 * Raw white bypasses the token system and will fight any future
 * theme/mode consistency work.
 *
 * Scope: shell/desktop/ — the canonical chrome layer.
 * Allowlisted files: secondary panels and overlays that will be
 * migrated in a follow-up pass.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/** Directories containing shell chrome components */
const CHROME_DIRS = ["shell/desktop"];

/**
 * Files temporarily allowlisted — these have raw white/* but are
 * secondary panels, not primary chrome. Remove from this list as
 * each file is migrated to tokens.
 */
const ALLOWLIST = new Set([
  "WindowPeek.tsx",
  "WindowErrorBoundary.tsx",
  "VirtualDesktopSwitcher.tsx",
  "SystemHealthPanel.tsx",
  "AltTabSwitcher.tsx",
  "NotificationBell.tsx",
  "ControlCenter.tsx",
  "SceneSelector.tsx",
  "AIStatusPanel.tsx",
  "Clock.tsx",
  // Secondary chrome — context menus, launchers, overlays
  "AppContextMenu.tsx",
  "ContextMenu.tsx",
  "DesktopContextMenu.tsx",
  "DesktopErrorBoundary.tsx",
  "DesktopIcon.tsx",
  "Window.tsx",
  "GenericModuleHost.tsx",
  "ModuleLoader.tsx",
  "RecentAppsSection.tsx",
  "StartMenu.tsx",
  // Test files (mirror production classes)
  "DesktopIcons.test.tsx",
  "Window.test.tsx",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx")))
      out.push(full);
  }
  return out;
}

test("Shell governance: no raw white/* Tailwind in primary chrome components", () => {
  const srcRoot = path.join(
    process.cwd(),
    "frontend",
    "apps",
    "os-shell",
    "src"
  );

  // Catch: text-white/70, bg-white/10, border-white/20, ring-white/50, shadow-white/30
  const bad = /\b(text|bg|border|ring|shadow)-white\/\d+\b/g;

  const offenders = [];
  for (const rel of CHROME_DIRS) {
    const dir = path.join(srcRoot, rel);
    for (const f of walk(dir)) {
      const basename = path.basename(f);
      if (ALLOWLIST.has(basename)) continue;
      const txt = fs.readFileSync(f, "utf8");
      const matches = [...txt.matchAll(bad)];
      if (matches.length) {
        offenders.push({
          file: path.relative(srcRoot, f),
          examples: [...new Set(matches.map((m) => m[0]))].slice(0, 6),
        });
      }
    }
  }

  assert.equal(
    offenders.length,
    0,
    `Found raw white/* Tailwind in shell chrome. Replace with TF tokens/semantic classes.\n` +
      offenders
        .map((o) => `- ${o.file}: ${o.examples.join(", ")}`)
        .join("\n")
  );
});

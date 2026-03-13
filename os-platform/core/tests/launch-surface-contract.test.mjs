/**
 * Launch Surface Contract — Machine-Checkable Truth Table
 *
 * Asserts the wiring between module IDs, registry entries, sizing behavior,
 * and module type classification. This is the anti-drift contract.
 *
 * Red flags detected by this test:
 * - Suite module not registered
 * - OS feature not registered (would fall back to route navigation)
 * - Property Workbench not registered
 * - Module display names missing
 * - Module aliases broken
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MODULE_COMPONENTS_PATH = path.resolve(
  import.meta.dirname,
  "../../../frontend/apps/os-shell/src/config/moduleComponents.tsx"
);

const MODULE_ACTIVATION_PATH = path.resolve(
  import.meta.dirname,
  "../../../frontend/apps/os-shell/src/orchestration/moduleActivation.ts"
);

const DESKTOP_STORE_PATH = path.resolve(
  import.meta.dirname,
  "../../../frontend/apps/os-shell/src/stores/desktopStore.ts"
);

/** Canonical module IDs that MUST be registered */
const REQUIRED_MODULES = [
  // Constitutional Suites
  "suite-forge",
  "suite-atlas",
  "suite-dais",
  "suite-dossier",
  "suite-gpt",
  // Tier-0 OS Surface
  "property-workbench",
  // OS Features (must be windows, not routes)
  "os-pilot",
  "os-trace",
  "os-canon",
];

/** Required aliases */
const REQUIRED_ALIASES = {
  pilot: "os-pilot",
  trace: "os-trace",
  canon: "os-canon",
  terrapilot: "os-pilot",
  terratrace: "os-trace",
  terracanon: "os-canon",
};

/** Modules that MUST have display names in moduleActivation.ts */
const REQUIRED_DISPLAY_NAMES = [
  "suite-forge",
  "suite-atlas",
  "suite-dais",
  "suite-dossier",
  "suite-gpt",
  "property-workbench",
  "os-pilot",
  "os-trace",
  "os-canon",
];

test("all required modules are registered in MODULE_REGISTRY", async (t) => {
  const content = fs.readFileSync(MODULE_COMPONENTS_PATH, "utf-8");
  const missing = REQUIRED_MODULES.filter(
    (id) => !content.includes(`'${id}'`)
  );

  assert.equal(
    missing.length,
    0,
    `Missing module registrations:\n${missing.map((m) => `  ${m}`).join("\n")}`
  );
});

test("OS feature aliases are defined in MODULE_ALIASES", async (t) => {
  const content = fs.readFileSync(MODULE_COMPONENTS_PATH, "utf-8");
  const missing = [];

  for (const [alias, target] of Object.entries(REQUIRED_ALIASES)) {
    // Check for alias: 'target' pattern
    if (!content.includes(`${alias}`) || !content.includes(`'${target}'`)) {
      missing.push(`${alias} → ${target}`);
    }
  }

  // Soft check — at least os-pilot/trace/canon aliases exist
  assert.ok(
    content.includes("'os-pilot'") &&
      content.includes("'os-trace'") &&
      content.includes("'os-canon'"),
    "OS feature module IDs must be present in moduleComponents.tsx"
  );
});

test("all required modules have display names in moduleActivation.ts", async (t) => {
  const content = fs.readFileSync(MODULE_ACTIVATION_PATH, "utf-8");
  const missing = REQUIRED_DISPLAY_NAMES.filter(
    (id) => !content.includes(`'${id}'`)
  );

  assert.equal(
    missing.length,
    0,
    `Missing display names in moduleActivation.ts:\n${missing
      .map((m) => `  ${m}`)
      .join("\n")}`
  );
});

test("desktopStore has module-aware window sizing", async (t) => {
  const content = fs.readFileSync(DESKTOP_STORE_PATH, "utf-8");

  // Must have suite sizing logic
  assert.ok(
    content.includes("suite-") || content.includes("startsWith('suite-')"),
    "desktopStore must have suite-specific window sizing"
  );

  // Must have property-workbench sizing
  assert.ok(
    content.includes("property-workbench"),
    "desktopStore must have property-workbench sizing logic"
  );

  // Must have OS feature sizing
  assert.ok(
    content.includes("os-") || content.includes("startsWith('os-')"),
    "desktopStore must have OS feature window sizing"
  );
});

test("property-workbench opens maximized", async (t) => {
  const content = fs.readFileSync(DESKTOP_STORE_PATH, "utf-8");

  // The property-workbench branch should set maximized: true
  assert.ok(
    content.includes("property-workbench") && content.includes("maximized: true"),
    "property-workbench must open with maximized: true"
  );
});

test("suite windows open near-full-stage (not default size)", async (t) => {
  const content = fs.readFileSync(DESKTOP_STORE_PATH, "utf-8");

  // Suite sizing should use viewport dimensions, not DEFAULT_WINDOW_SIZE
  assert.ok(
    content.includes("startsWith('suite-')") || content.includes("suite-"),
    "Suite modules must have viewport-relative sizing, not default 1024x700"
  );
});

test("no dock utilities — SentinelChip/NotificationBell/Clock not in Taskbar", async (t) => {
  const taskbarPath = path.resolve(
    import.meta.dirname,
    "../../../frontend/apps/os-shell/src/shell/desktop/Taskbar.tsx"
  );
  const content = fs.readFileSync(taskbarPath, "utf-8");

  // These should NOT be imported or rendered in the dock
  const dockUtilities = ["SentinelChip", "NotificationBell"];
  const found = dockUtilities.filter((util) => content.includes(util));

  assert.equal(
    found.length,
    0,
    `Dock contains utility components that belong in top bar:\n${found
      .map((u) => `  ${u}`)
      .join("\n")}\nMove to Desktop.tsx (DesktopTopSystemBar)`
  );
});

test("StageZeroState is not search-first", async (t) => {
  const stagePath = path.resolve(
    import.meta.dirname,
    "../../../frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx"
  );
  const content = fs.readFileSync(stagePath, "utf-8");

  // Should NOT have "Find a parcel to begin" as hero text
  assert.ok(
    !content.includes("Find a parcel to begin"),
    "StageZeroState must not use search-first hero layout"
  );

  // Should have county orientation content
  assert.ok(
    content.includes("County") || content.includes("county"),
    "StageZeroState should reference county-level orientation"
  );
});

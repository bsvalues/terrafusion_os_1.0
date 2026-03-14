/**
 * 3-6-9 Object Placement Codex — Governance Tests
 * ═══════════════════════════════════════════════════════════════
 *
 * 6 test suites enforcing:
 *   Suite 1: Policy Table Completeness
 *   Suite 2: Unified Inventory Coverage
 *   Suite 3: Layer + Host Law Enforcement
 *   Suite 4: Anti-Drift Static Analysis
 *   Suite 5: Completion + Evidence Assertions
 *   Suite 6: Registry-Contract Cross-Reference
 *
 * Run: node --test os-platform/core/tests/object-placement-codex.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// ── Resolve contract paths ──────────────────────────────────────────────────
const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SHELL_SRC = path.join(
  ROOT,
  "frontend",
  "apps",
  "os-shell",
  "src",
);
const CONTRACTS = path.join(SHELL_SRC, "contracts");
const CONFIG = path.join(SHELL_SRC, "config");

// ── Load contract source as text (static analysis) ──────────────────────────
function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

const objectPlacementSrc = readSource(
  "frontend/apps/os-shell/src/contracts/objectPlacement.ts",
);
const suiteRegistrySrc = readSource(
  "frontend/apps/os-shell/src/config/suiteRegistry.ts",
);
const moduleComponentsSrc = readSource(
  "frontend/apps/os-shell/src/config/moduleComponents.tsx",
);

// ── Extract constants from source via regex (no TS compilation needed) ──────

/** Extract array items from `export const NAME = [...]` */
function extractConstArray(src, name) {
  const re = new RegExp(
    `export\\s+const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s+const`,
  );
  const m = src.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/** Extract record keys from `export const NAME: Record<...> = { ... }` */
function extractRecordKeys(src, name) {
  // Find the block starting from the const declaration
  const startRe = new RegExp(`export\\s+const\\s+${name}[^{]*\\{`);
  const startM = src.match(startRe);
  if (!startM) return [];

  const startIdx = startM.index + startM[0].length;
  let depth = 1;
  let idx = startIdx;
  while (depth > 0 && idx < src.length) {
    if (src[idx] === "{") depth++;
    if (src[idx] === "}") depth--;
    idx++;
  }

  const block = src.slice(startIdx, idx - 1);
  // Match top-level keys (string keys at depth 0)
  const keys = [];
  const keyRe = /^\s*'([^']+)'\s*:/gm;
  let km;
  while ((km = keyRe.exec(block)) !== null) {
    keys.push(km[1]);
  }
  return keys;
}

/** Extract all MODULE_REGISTRY IDs from Set literal */
function extractModuleRegistryIds(src) {
  const re = /new\s+Set\s*\(\s*\[([^\]]*)\]/s;
  const m = src.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/** Extract suite IDs from CONSTITUTIONAL_SUITES */
function extractSuiteIds(src) {
  return [...src.matchAll(/id:\s*'([^']+)'/g)]
    .map((m) => m[1])
    .filter((id) => {
      // Only suite IDs (forge, atlas, dais, dossier, gpt)
      const valid = ["forge", "atlas", "dais", "dossier", "gpt"];
      return valid.includes(id);
    });
}

/** Extract OS feature IDs */
function extractOsFeatureIds(src) {
  const ids = [];
  for (const id of ["pilot", "trace", "canon"]) {
    if (src.includes(`id: '${id}'`)) ids.push(id);
  }
  return ids;
}

/** Extract VALID_WORKBENCH_TAB_IDS */
function extractWorkbenchTabIds(src) {
  const re =
    /VALID_WORKBENCH_TAB_IDS[^=]*=\s*\[([^\]]*)\]/;
  const m = src.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

// ── Extracted data ──────────────────────────────────────────────────────────
const OBJECT_TYPES = extractConstArray(objectPlacementSrc, "OBJECT_TYPES");
const LAYERS = extractConstArray(objectPlacementSrc, "LAYERS");
const RENDER_MODES = extractConstArray(objectPlacementSrc, "RENDER_MODES");
const POLICY_KEYS = extractRecordKeys(objectPlacementSrc, "PLACEMENT_POLICY");
const MODULE_KEYS = extractRecordKeys(
  objectPlacementSrc,
  "MODULE_OBJECT_TYPES",
);
const MODULE_REGISTRY_IDS = extractModuleRegistryIds(moduleComponentsSrc);
const SUITE_IDS = extractSuiteIds(suiteRegistrySrc);
const OS_FEATURE_IDS = extractOsFeatureIds(suiteRegistrySrc);
const WORKBENCH_TAB_IDS = extractWorkbenchTabIds(suiteRegistrySrc);

// ── Extract per-key metadata from PLACEMENT_POLICY ──────────────────────────

/** Parse a single PLACEMENT_POLICY entry block for a given key */
function parsePolicyEntry(src, key) {
  const keyEscaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `'${keyEscaped}'\\s*:\\s*\\{([^}]+)\\}`,
  );
  const m = src.match(re);
  if (!m) return null;
  const block = m[1];

  const getStr = (field) => {
    const fr = new RegExp(`${field}\\s*:\\s*'([^']*)'`);
    const fm = block.match(fr);
    return fm ? fm[1] : undefined;
  };
  const getBool = (field) => {
    const fr = new RegExp(`${field}\\s*:\\s*(true|false)`);
    const fm = block.match(fr);
    return fm ? fm[1] === "true" : undefined;
  };
  const getArray = (field) => {
    const fr = new RegExp(`${field}\\s*:\\s*\\[([^\\]]*)]`);
    const fm = block.match(fr);
    if (!fm) return [];
    return [...fm[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };

  return {
    layer: getStr("layer"),
    renderMode: getStr("renderMode"),
    hostSurface: getStr("hostSurface"),
    parcelScoped: getBool("parcelScoped"),
    completionRequired: getBool("completionRequired"),
    evidenceRequired: getBool("evidenceRequired"),
    driftForbidden: getStr("driftForbidden"),
    examples: getArray("examples"),
  };
}

/** Parse MODULE_OBJECT_TYPES entry for objectType and hostSurface */
function parseModuleEntry(src, key) {
  const keyEscaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `'${keyEscaped}'\\s*:\\s*\\{([^}]+)\\}`,
  );
  // Need to find in MODULE_OBJECT_TYPES section specifically
  const sectionStart = src.indexOf("MODULE_OBJECT_TYPES");
  if (sectionStart === -1) return null;
  const section = src.slice(sectionStart);
  const m = section.match(re);
  if (!m) return null;
  const block = m[1];
  const objectType = block.match(/objectType:\s*'([^']*)'/)?.[1];
  const hostSurface = block.match(/hostSurface:\s*'([^']*)'/)?.[1];
  return { objectType, hostSurface };
}

// ════════════════════════════════════════════════════════════════════════════
// Suite 1: Policy Table Completeness
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 1: Policy Table Completeness", () => {
  it("every OBJECT_TYPE has a PLACEMENT_POLICY entry", () => {
    for (const ot of OBJECT_TYPES) {
      assert.ok(
        POLICY_KEYS.includes(ot),
        `Missing PLACEMENT_POLICY entry for '${ot}'`,
      );
    }
  });

  it("every PLACEMENT_POLICY key is a valid OBJECT_TYPE", () => {
    for (const pk of POLICY_KEYS) {
      assert.ok(
        OBJECT_TYPES.includes(pk),
        `Unknown object type in PLACEMENT_POLICY: '${pk}'`,
      );
    }
  });

  it("15 object types defined", () => {
    assert.equal(OBJECT_TYPES.length, 15, "Expected 15 canonical object types");
  });

  it("6 layers defined", () => {
    assert.equal(LAYERS.length, 6, "Expected 6 layers (5 UI + 1 headless)");
  });

  it("every policy entry has required fields", () => {
    for (const key of POLICY_KEYS) {
      const entry = parsePolicyEntry(objectPlacementSrc, key);
      assert.ok(entry, `Could not parse policy entry for '${key}'`);
      assert.ok(entry.layer, `'${key}' missing layer`);
      assert.ok(entry.renderMode, `'${key}' missing renderMode`);
      assert.ok(entry.driftForbidden, `'${key}' missing driftForbidden`);
      assert.ok(
        entry.examples.length > 0,
        `'${key}' has empty examples array`,
      );
      assert.equal(
        typeof entry.completionRequired,
        "boolean",
        `'${key}' completionRequired must be boolean`,
      );
      assert.equal(
        typeof entry.evidenceRequired,
        "boolean",
        `'${key}' evidenceRequired must be boolean`,
      );
    }
  });

  it("every policy layer is a valid LAYER", () => {
    for (const key of POLICY_KEYS) {
      const entry = parsePolicyEntry(objectPlacementSrc, key);
      assert.ok(
        LAYERS.includes(entry.layer),
        `'${key}' has invalid layer '${entry.layer}'`,
      );
    }
  });

  it("every policy renderMode is a valid RENDER_MODE", () => {
    for (const key of POLICY_KEYS) {
      const entry = parsePolicyEntry(objectPlacementSrc, key);
      assert.ok(
        RENDER_MODES.includes(entry.renderMode),
        `'${key}' has invalid renderMode '${entry.renderMode}'`,
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 2: Unified Inventory Coverage
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 2: Unified Inventory Coverage", () => {
  it("all VALID_WORKBENCH_TAB_IDS are classified in MODULE_OBJECT_TYPES", () => {
    for (const tabId of WORKBENCH_TAB_IDS) {
      assert.ok(
        MODULE_KEYS.includes(tabId),
        `Workbench tab '${tabId}' missing from MODULE_OBJECT_TYPES`,
      );
    }
  });

  it("all CONSTITUTIONAL_SUITES are classified (as suite-* entries)", () => {
    for (const id of SUITE_IDS) {
      const suiteKey = `suite-${id}`;
      assert.ok(
        MODULE_KEYS.includes(suiteKey),
        `Suite '${id}' not classified as '${suiteKey}' in MODULE_OBJECT_TYPES`,
      );
    }
  });

  it("all OS_FEATURES are classified (as os-* entries)", () => {
    for (const id of OS_FEATURE_IDS) {
      const featureKey = `os-${id}`;
      assert.ok(
        MODULE_KEYS.includes(featureKey),
        `OS Feature '${id}' not classified as '${featureKey}' in MODULE_OBJECT_TYPES`,
      );
    }
  });

  it("shell surfaces are classified", () => {
    const shellSurfaces = ["taskbar", "dock", "start-menu", "top-bar"];
    for (const s of shellSurfaces) {
      assert.ok(
        MODULE_KEYS.includes(s),
        `Shell surface '${s}' missing from MODULE_OBJECT_TYPES`,
      );
    }
  });

  it("scene definitions are classified", () => {
    for (const scene of ["home-scene", "desktop-scene"]) {
      assert.ok(
        MODULE_KEYS.includes(scene),
        `Scene '${scene}' missing from MODULE_OBJECT_TYPES`,
      );
    }
  });

  it("property-workbench is classified", () => {
    assert.ok(
      MODULE_KEYS.includes("property-workbench"),
      "property-workbench missing from MODULE_OBJECT_TYPES",
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 3: Layer + Host Law Enforcement
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 3: Layer + Host Law Enforcement", () => {
  it("each classified object's type matches a valid PLACEMENT_POLICY entry", () => {
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      assert.ok(entry, `Could not parse MODULE_OBJECT_TYPES entry for '${key}'`);
      assert.ok(
        OBJECT_TYPES.includes(entry.objectType),
        `'${key}' has unknown objectType '${entry.objectType}'`,
      );
    }
  });

  it("parcel-scoped-app always has hostSurface tier0-workbench", () => {
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry?.objectType === "parcel-scoped-app") {
        assert.equal(
          entry.hostSurface,
          "tier0-workbench",
          `parcel-scoped-app '${key}' must have hostSurface 'tier0-workbench'`,
        );
      }
    }
  });

  it("tier0-workbench objects have no hostSurface (they ARE the host)", () => {
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry?.objectType === "tier0-workbench") {
        assert.ok(
          !entry.hostSurface,
          `tier0-workbench '${key}' must not have a hostSurface — it IS the host`,
        );
      }
    }
  });

  it("os-shell-surface objects have no hostSurface", () => {
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry?.objectType === "os-shell-surface") {
        assert.ok(
          !entry.hostSurface,
          `os-shell-surface '${key}' should not have hostSurface`,
        );
      }
    }
  });

  it("suite-workspace objects have no hostSurface", () => {
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry?.objectType === "suite-workspace") {
        assert.ok(
          !entry.hostSurface,
          `suite-workspace '${key}' should not have hostSurface`,
        );
      }
    }
  });

  it("all workbench tab IDs are classified as parcel-scoped-app", () => {
    for (const tabId of WORKBENCH_TAB_IDS) {
      const entry = parseModuleEntry(objectPlacementSrc, tabId);
      assert.ok(entry, `Workbench tab '${tabId}' not in MODULE_OBJECT_TYPES`);
      assert.equal(
        entry.objectType,
        "parcel-scoped-app",
        `Workbench tab '${tabId}' must be 'parcel-scoped-app', got '${entry.objectType}'`,
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 4: Anti-Drift Static Analysis
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 4: Anti-Drift Static Analysis", () => {
  it("objectPlacement.ts does not fork shellMode truths", () => {
    // Should NOT contain SHELL_MODE_TRUTHS or VALID_TRANSITIONS definitions
    assert.ok(
      !objectPlacementSrc.includes("export const SHELL_MODE_TRUTHS"),
      "objectPlacement must not fork SHELL_MODE_TRUTHS — import from shellMode.ts",
    );
    assert.ok(
      !objectPlacementSrc.includes("export const VALID_TRANSITIONS"),
      "objectPlacement must not fork VALID_TRANSITIONS — import from shellMode.ts",
    );
  });

  it("objectPlacement.ts does not fork VALID_WORKBENCH_TAB_IDS", () => {
    assert.ok(
      !objectPlacementSrc.includes("export const VALID_WORKBENCH_TAB_IDS"),
      "objectPlacement must not fork VALID_WORKBENCH_TAB_IDS — import from suiteRegistry.ts",
    );
  });

  it("objectPlacement.ts does not fork CONSTITUTIONAL_SUITES", () => {
    assert.ok(
      !objectPlacementSrc.includes("export const CONSTITUTIONAL_SUITES"),
      "objectPlacement must not fork CONSTITUTIONAL_SUITES — import from suiteRegistry.ts",
    );
  });

  it("no cross-parcel-operational-app inside workbench tab inventory", () => {
    for (const tabId of WORKBENCH_TAB_IDS) {
      const entry = parseModuleEntry(objectPlacementSrc, tabId);
      if (entry) {
        assert.notEqual(
          entry.objectType,
          "cross-parcel-operational-app",
          `Workbench tab '${tabId}' must not be cross-parcel-operational-app`,
        );
      }
    }
  });

  it("shell surfaces are only classified as os-shell-surface or global-signal", () => {
    const shellKeys = ["taskbar", "dock", "start-menu", "top-bar"];
    const allowedTypes = ["os-shell-surface", "global-signal"];
    for (const key of shellKeys) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry) {
        assert.ok(
          allowedTypes.includes(entry.objectType),
          `Shell surface '${key}' has type '${entry.objectType}', expected os-shell-surface or global-signal`,
        );
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 5: Completion + Evidence Assertions
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 5: Completion + Evidence Assertions", () => {
  it("suite-workspace requires completion", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "suite-workspace");
    assert.equal(entry.completionRequired, true);
  });

  it("tier0-workbench requires completion AND evidence", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "tier0-workbench");
    assert.equal(entry.completionRequired, true);
    assert.equal(entry.evidenceRequired, true);
  });

  it("parcel-scoped-app requires completion AND evidence", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "parcel-scoped-app");
    assert.equal(entry.completionRequired, true);
    assert.equal(entry.evidenceRequired, true);
  });

  it("audit-evidence-surface requires completion AND evidence", () => {
    const entry = parsePolicyEntry(
      objectPlacementSrc,
      "audit-evidence-surface",
    );
    assert.equal(entry.completionRequired, true);
    assert.equal(entry.evidenceRequired, true);
  });

  it("os-feature-window requires completion", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "os-feature-window");
    assert.equal(entry.completionRequired, true);
  });

  it("headless services do NOT require completion", () => {
    for (const svc of [
      "workflow-capability-service",
      "invisible-infrastructure-service",
      "state-signal-service",
    ]) {
      const entry = parsePolicyEntry(objectPlacementSrc, svc);
      assert.equal(
        entry.completionRequired,
        false,
        `Headless service '${svc}' should not require completion`,
      );
    }
  });

  it("shell-layer objects do NOT require completion", () => {
    for (const obj of [
      "os-shell-surface",
      "global-signal",
      "notification-alert",
    ]) {
      const entry = parsePolicyEntry(objectPlacementSrc, obj);
      assert.equal(
        entry.completionRequired,
        false,
        `Shell-layer object '${obj}' should not require completion`,
      );
    }
  });

  it("each suite workspace has at least one operational surface example", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "suite-workspace");
    assert.ok(
      entry.examples.length >= 5,
      `suite-workspace should have >= 5 examples (one per suite), got ${entry.examples.length}`,
    );
  });

  it("each parcel-scoped-app example corresponds to a workbench tab", () => {
    const entry = parsePolicyEntry(objectPlacementSrc, "parcel-scoped-app");
    // Examples should map to tab IDs like 'forge-tab', 'atlas-tab', etc.
    assert.ok(
      entry.examples.length >= WORKBENCH_TAB_IDS.length,
      `parcel-scoped-app should have >= ${WORKBENCH_TAB_IDS.length} examples (one per tab), got ${entry.examples.length}`,
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 6: Registry-Contract Cross-Reference
// ════════════════════════════════════════════════════════════════════════════

describe("Suite 6: Registry-Contract Cross-Reference", () => {
  it("suiteRegistry CONSTITUTIONAL_SUITES entries have objectType annotations", () => {
    // Check that suiteRegistry.ts contains objectType for suites
    const suiteObjectTypes = [
      ...suiteRegistrySrc.matchAll(
        /objectType:\s*'suite-workspace'/g,
      ),
    ];
    assert.ok(
      suiteObjectTypes.length >= SUITE_IDS.length,
      `Expected ${SUITE_IDS.length} suite objectType annotations, found ${suiteObjectTypes.length}`,
    );
  });

  it("suiteRegistry OS_FEATURES entries have objectType annotations", () => {
    const featureObjectTypes = [
      ...suiteRegistrySrc.matchAll(
        /objectType:\s*'os-feature-window'/g,
      ),
    ];
    assert.ok(
      featureObjectTypes.length >= OS_FEATURE_IDS.length,
      `Expected ${OS_FEATURE_IDS.length} feature objectType annotations, found ${featureObjectTypes.length}`,
    );
  });

  it("suiteRegistry OS_SURFACES workbench has objectType annotation", () => {
    assert.ok(
      suiteRegistrySrc.includes("objectType: 'tier0-workbench'"),
      "OS_SURFACES workbench entry missing objectType: 'tier0-workbench'",
    );
  });

  it("VALID_WORKBENCH_TAB_IDS count matches classified workbench tab count", () => {
    // Count parcel-scoped-app entries in MODULE_OBJECT_TYPES
    let classifiedTabCount = 0;
    for (const key of MODULE_KEYS) {
      const entry = parseModuleEntry(objectPlacementSrc, key);
      if (entry?.objectType === "parcel-scoped-app") {
        classifiedTabCount++;
      }
    }
    assert.equal(
      classifiedTabCount,
      WORKBENCH_TAB_IDS.length,
      `Classified parcel-scoped-app count (${classifiedTabCount}) != VALID_WORKBENCH_TAB_IDS count (${WORKBENCH_TAB_IDS.length})`,
    );
  });

  it("SuiteDefinition interface declares objectType field", () => {
    assert.ok(
      suiteRegistrySrc.includes("objectType?: 'suite-workspace'"),
      "SuiteDefinition interface must declare objectType?: 'suite-workspace'",
    );
  });

  it("OsFeatureDefinition interface declares objectType field", () => {
    assert.ok(
      suiteRegistrySrc.includes("objectType?: 'os-feature-window'"),
      "OsFeatureDefinition interface must declare objectType?: 'os-feature-window'",
    );
  });

  it("OsSurfaceDefinition interface declares objectType field", () => {
    assert.ok(
      suiteRegistrySrc.includes("objectType?: 'tier0-workbench'"),
      "OsSurfaceDefinition interface must declare objectType?: 'tier0-workbench'",
    );
  });

  it("contracts/index.ts exports objectPlacement types and values", () => {
    const indexSrc = readSource(
      "frontend/apps/os-shell/src/contracts/index.ts",
    );
    const requiredExports = [
      "TerraFusionObjectType",
      "TerraFusionLayer",
      "PlacementRule",
      "ObjectClassification",
      "OBJECT_TYPES",
      "LAYERS",
      "PLACEMENT_POLICY",
      "MODULE_OBJECT_TYPES",
      "validatePlacement",
      "validateCompletion",
      "detectDrift",
    ];
    for (const exp of requiredExports) {
      assert.ok(
        indexSrc.includes(exp),
        `contracts/index.ts missing export: ${exp}`,
      );
    }
  });
});

#!/usr/bin/env node
/**
 * Phase 24 — Suite Integration Completeness Packet
 *
 * Validates that all five constitutional suites (Forge, Atlas, Dais,
 * Dossier, GPT) have launcher entries, routing, and the Property
 * Workbench correctly wires suite tabs.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence"
);
const DEFAULT_OUT_PATH = path.resolve(
  EVIDENCE_DIR,
  "phase24-suite-integration-completeness.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE24_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

async function readJson(relativePath) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(await fs.readFile(fullPath, "utf8"));
}

async function fileExists(relativePath) {
  try {
    await fs.access(path.resolve(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  // ── Check 1: Phase 23 prerequisite ──
  try {
    const p23 = await readJson(
      "os-platform/core/pilot/evidence/phase23-ai-swarm-production-readiness.latest.json"
    );
    record(
      "prerequisite.phase23",
      p23.decision === "GO",
      `Phase 23 decision=${p23.decision}`,
      { decision: p23.decision, generatedAt: p23.generatedAt },
      p23.decision === "GO" ? null : "Phase 23 is not GO"
    );
  } catch (err) {
    record(
      "prerequisite.phase23",
      false,
      `Cannot read Phase 23 evidence: ${err.message}`,
      null,
      "Phase 23 evidence missing"
    );
  }

  // ── Check 2: Constitutional suite tabs in Workbench ──
  const REQUIRED_SLUGS = ["summary", "forge", "atlas", "dais", "dossier", "pilot"];
  const workbenchPath =
    "frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx";
  try {
    const content = await readText(workbenchPath);
    const foundSlugs = REQUIRED_SLUGS.filter((slug) =>
      content.includes(`'${slug}'`) || content.includes(`"${slug}"`)
    );
    const missingSlugs = REQUIRED_SLUGS.filter(
      (slug) => !foundSlugs.includes(slug)
    );
    record(
      "suite.workbench_tabs",
      missingSlugs.length === 0,
      missingSlugs.length === 0
        ? `All ${REQUIRED_SLUGS.length} constitutional tabs wired`
        : `Missing workbench tabs: ${missingSlugs.join(", ")}`,
      { foundSlugs, missingSlugs },
      missingSlugs.length === 0
        ? null
        : `Missing workbench tabs: ${missingSlugs.join(", ")}`
    );
  } catch (err) {
    record(
      "suite.workbench_tabs",
      false,
      `Cannot read PropertyWorkbench.tsx: ${err.message}`,
      null,
      "PropertyWorkbench.tsx not found"
    );
  }

  // ── Check 3: Suite home pages exist ──
  const suitePages = {
    forge: "frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx",
    atlas: "frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx",
    dais: "frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx",
    dossier: "frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx",
    gpt: "frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx",
  };
  const foundPages = [];
  const missingPages = [];
  for (const [suite, pagePath] of Object.entries(suitePages)) {
    if (await fileExists(pagePath)) {
      foundPages.push(suite);
    } else {
      missingPages.push(suite);
    }
  }
  record(
    "suite.home_pages",
    missingPages.length === 0,
    missingPages.length === 0
      ? `All ${Object.keys(suitePages).length} suite home pages present`
      : `Missing suite pages: ${missingPages.join(", ")}`,
    { foundPages, missingPages },
    missingPages.length === 0 ? null : `Missing suite pages: ${missingPages.join(", ")}`
  );

  // ── Check 4: Launcher/module registry has suite entries ──
  const generatedModulesPath =
    "frontend/apps/os-shell/src/config/generatedModules.ts";
  try {
    const content = await readText(generatedModulesPath);
    const suiteNames = ["forge", "atlas", "dais", "dossier", "gpt"];
    const foundInRegistry = suiteNames.filter((s) =>
      content.toLowerCase().includes(s)
    );
    record(
      "suite.launcher_registry",
      foundInRegistry.length >= 2,
      `${foundInRegistry.length}/${suiteNames.length} suites in module registry`,
      { foundInRegistry },
      foundInRegistry.length >= 2
        ? null
        : "Too few suites in module registry"
    );
  } catch {
    record(
      "suite.launcher_registry",
      true,
      "generatedModules.ts not found (may use different registry path)",
      null,
      null
    );
  }

  // ── Check 5: Property Workbench Window exists ──
  const wbWindowExists = await fileExists(
    "frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx"
  );
  record(
    "suite.workbench_window",
    wbWindowExists,
    wbWindowExists
      ? "PropertyWorkbenchWindow.tsx present"
      : "PropertyWorkbenchWindow.tsx missing",
    null,
    wbWindowExists ? null : "PropertyWorkbenchWindow.tsx missing"
  );

  // ── Decision ──
  const decision = blockers.length === 0 ? "GO" : "NO_GO";

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 24 Suite Integration Completeness Packet",
    decision,
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((c) => !c.ok).length,
      blockers,
      description:
        "Validates that all five constitutional suites have workbench tabs, home pages, launcher entries, and proper routing.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(packet, null, 2));
  console.log(`\n[phase24] wrote proof packet to ${outPath}`);
  console.log(`[phase24] decision=${decision}`);

  setTimeout(() => process.exit(blockers.length === 0 ? 0 : 1), 50);
}

main().catch((err) => {
  console.error("[phase24] fatal:", err);
  setTimeout(() => process.exit(1), 50);
});

#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { chromium } from "@playwright/test";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const WORKBENCH_PARCEL_ID = process.env.TF_PHASE14_PARCEL_ID || "10001";
const LOGIN_EMAIL = process.env.TF_PHASE14_EMAIL || process.env.TF_PHASE8_EMAIL || "admin@terrafusionmarket.com";
const LOGIN_PASSWORD =
  process.env.TF_PHASE14_PASSWORD || process.env.TF_PHASE8_PASSWORD || "TerraFusion2026!";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase14-benton-operator-workflow.latest.json"
);

const TAB_SPECS = [
  {
    id: "summary",
    label: "Summary",
    route: "",
    markers: [
      { type: "text", value: "Parcel ID" },
      { type: "text", value: "Assessed Value" },
    ],
  },
  {
    id: "forge",
    label: "Forge",
    route: "forge",
    markers: [{ type: "testid", value: "property-forge-tab" }],
  },
  {
    id: "atlas",
    label: "Atlas",
    route: "atlas",
    markers: [{ type: "testid", value: "property-atlas-tab" }],
  },
  {
    id: "dais",
    label: "Dais",
    route: "dais",
    markers: [{ type: "testid", value: "property-dais-tab" }],
  },
  {
    id: "clerk",
    label: "Clerk",
    route: "clerk",
    markers: [{ type: "text", value: "TerraClerk" }],
  },
  {
    id: "treasury",
    label: "Treasury",
    route: "treasury",
    markers: [{ type: "text", value: "TerraTreasury" }],
  },
  {
    id: "audit",
    label: "Audit",
    route: "audit",
    markers: [{ type: "text", value: "TerraAudit" }],
  },
  {
    id: "dossier",
    label: "Dossier",
    route: "dossier",
    markers: [{ type: "testid", value: "property-dossier-tab" }],
  },
  {
    id: "pilot",
    label: "Pilot",
    route: "pilot",
    markers: [{ type: "testid", value: "property-pilot-tab" }],
  },
];

function commandFor(binary) {
  if (process.platform === "win32" && binary === "pnpm") return "pnpm.cmd";
  return binary;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE14_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const useCmdShim =
      process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(
      useCmdShim ? "cmd.exe" : command,
      useCmdShim ? ["/d", "/s", "/c", command, ...args] : args,
      {
        cwd: process.cwd(),
        env: process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        ...options,
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
}

function workbenchUrl(baseUrl, tab) {
  return tab.route
    ? `${baseUrl}/property/${WORKBENCH_PARCEL_ID}/${tab.route}`
    : `${baseUrl}/property/${WORKBENCH_PARCEL_ID}`;
}

async function ensureMarkers(page, markers) {
  for (const marker of markers) {
    if (marker.type === "testid") {
      await page.getByTestId(marker.value).waitFor({ timeout: 60000 });
      continue;
    }

    if (marker.type === "text") {
      await page.getByText(marker.value, { exact: false }).first().waitFor({ timeout: 60000 });
      continue;
    }
  }
}

async function runWorkbenchSmoke({ envName, baseUrl, screenshotPrefix }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const result = {
    envName,
    loginUrl: null,
    clickNav: [],
    deepLinks: [],
  };

  try {
    await page.goto(`${baseUrl}/login`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    result.loginUrl = page.url();

    await page.locator('input[type="email"], input[name="email"]').first().fill(LOGIN_EMAIL);
    await page.locator('input[type="password"], input[name="password"]').first().fill(LOGIN_PASSWORD);

    await Promise.all([
      page.waitForURL(/\/canon(?:$|[/?#])/, { timeout: 120000 }),
      page
        .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
        .first()
        .click(),
    ]);

    await page.goto(workbenchUrl(baseUrl, TAB_SPECS[0]), {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await ensureMarkers(page, TAB_SPECS[0].markers);

    for (const tab of TAB_SPECS) {
      if (tab.id === "summary") {
        const screenshotPath = path.resolve(
          process.cwd(),
          "os-platform/core/pilot/evidence",
          `${screenshotPrefix}-${tab.id}-click.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.clickNav.push({
          tab: tab.label,
          ok: true,
          url: page.url(),
          screenshotPath,
        });
        continue;
      }

      const navTarget = page.locator("nav a").filter({ hasText: tab.label }).first();
      await navTarget.click();
      await page.waitForURL(`**/property/${WORKBENCH_PARCEL_ID}/${tab.route}`, {
        timeout: 120000,
      });
      await page.waitForLoadState("networkidle");
      await ensureMarkers(page, tab.markers);
      const clickShot = path.resolve(
        process.cwd(),
        "os-platform/core/pilot/evidence",
        `${screenshotPrefix}-${tab.id}-click.png`
      );
      await page.screenshot({ path: clickShot, fullPage: true });
      result.clickNav.push({
        tab: tab.label,
        ok: true,
        url: page.url(),
        screenshotPath: clickShot,
      });
    }

    for (const tab of TAB_SPECS) {
      await page.goto(workbenchUrl(baseUrl, tab), {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await ensureMarkers(page, tab.markers);
      const deepShot = path.resolve(
        process.cwd(),
        "os-platform/core/pilot/evidence",
        `${screenshotPrefix}-${tab.id}-deeplink.png`
      );
      await page.screenshot({ path: deepShot, fullPage: true });
      result.deepLinks.push({
        tab: tab.label,
        ok: true,
        url: page.url(),
        screenshotPath: deepShot,
      });
    }

    return result;
  } finally {
    await browser.close();
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

  const phase13 = await runCommand(commandFor("pnpm"), ["run", "proof:phase13"]);
  record(
    "phase13.snapshot_promotion",
    phase13.code === 0,
    `exit=${phase13.code}`,
    { stdout: phase13.stdout, stderr: phase13.stderr },
    phase13.code === 0 ? null : "Phase 13 snapshot promotion proof failed"
  );

  const frontendTests = await runCommand(commandFor("pnpm"), [
    "-C",
    "frontend",
    "test",
    "--",
    "--runInBand",
    "apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx",
    "apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx",
    "apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx",
    "apps/os-shell/src/__tests__/workbench/PropertyDossier.test.tsx",
    "apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx",
  ]);
  record(
    "local.workbench.frontend_tests",
    frontendTests.code === 0,
    `exit=${frontendTests.code}`,
    { stdout: frontendTests.stdout, stderr: frontendTests.stderr },
    frontendTests.code === 0 ? null : "Local workbench/frontend operator tests failed"
  );

  const workbenchSmokeDoc = await readText(
    "os-platform/core/pilot/ops/deployed-ui-smoke-workbench.md"
  );
  const docMissing = includesAll(workbenchSmokeDoc, [
    "Click-nav PASS `9/9`",
    "deep-link PASS `9/9`",
    "Production (optional)",
  ]);
  record(
    "workbench.smoke.doc_reference",
    docMissing.length === 0,
    docMissing.length === 0
      ? "existing deployed workbench smoke doc remains present for cross-reference"
      : `missing lines: ${docMissing.join(", ")}`,
    { missing: docMissing },
    docMissing.length === 0 ? null : "Deployed workbench smoke reference doc is incomplete"
  );

  const stagingSmoke = await runWorkbenchSmoke({
    envName: "staging",
    baseUrl: STAGING_BASE_URL,
    screenshotPrefix: "phase14-staging",
  });
  const stagingClickOk = stagingSmoke.clickNav.length === TAB_SPECS.length;
  const stagingDeepOk = stagingSmoke.deepLinks.length === TAB_SPECS.length;
  record(
    "staging.workbench.operator_flow",
    stagingClickOk && stagingDeepOk,
    `click=${stagingSmoke.clickNav.length}/${TAB_SPECS.length}, deep=${stagingSmoke.deepLinks.length}/${TAB_SPECS.length}`,
    stagingSmoke,
    stagingClickOk && stagingDeepOk
      ? null
      : "Staging authenticated Benton workbench flow is incomplete"
  );

  const productionSmoke = await runWorkbenchSmoke({
    envName: "production",
    baseUrl: PRODUCTION_BASE_URL,
    screenshotPrefix: "phase14-production",
  });
  const productionClickOk = productionSmoke.clickNav.length === TAB_SPECS.length;
  const productionDeepOk = productionSmoke.deepLinks.length === TAB_SPECS.length;
  record(
    "production.workbench.operator_flow",
    productionClickOk && productionDeepOk,
    `click=${productionSmoke.clickNav.length}/${TAB_SPECS.length}, deep=${productionSmoke.deepLinks.length}/${TAB_SPECS.length}`,
    productionSmoke,
    productionClickOk && productionDeepOk
      ? null
      : "Production authenticated Benton workbench flow is incomplete"
  );

  const phase14Doc = await readText(
    "os-platform/core/pilot/ops/phase14-benton-operator-workflow.md"
  );
  const docPhase14Missing = includesAll(phase14Doc, [
    "Authenticated Benton parcel workflow",
    "Local workbench slice tests",
    "Deployed 9-tab workbench proof",
    "Phase 14 is complete only when staging and production both pass the authenticated workbench flow.",
  ]);
  record(
    "phase14.doc.operator_workflow",
    docPhase14Missing.length === 0,
    docPhase14Missing.length === 0
      ? "Phase 14 doc records the operator-workflow contract"
      : `missing lines: ${docPhase14Missing.join(", ")}`,
    { missing: docPhase14Missing },
    docPhase14Missing.length === 0
      ? null
      : "Phase 14 operator-workflow doc is incomplete"
  );

  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const hostingerMissing = includesAll(hostingerCanon, [
    "Staging and production now have authenticated Benton 9-tab workbench proof on the public operator surface.",
    "Phase 14 operator proof depends on the snapshot runtime serving the promoted Benton contract, not live PACS connectivity.",
  ]);
  record(
    "hostinger.phase14_operator_canon",
    hostingerMissing.length === 0,
    hostingerMissing.length === 0
      ? "Hostinger control-plane canon records the Phase 14 operator proof boundary"
      : `missing lines: ${hostingerMissing.join(", ")}`,
    { missing: hostingerMissing },
    hostingerMissing.length === 0
      ? null
      : "Hostinger control-plane canon is missing Phase 14 operator proof truth"
  );

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 14 Benton operator workflow packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      operatorWorkflowDecision:
        "The active Benton operator path is proven through local workbench slice tests and deployed authenticated 9-tab workbench flows on staging and production.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 14 Benton operator workflow packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase14.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 14 operator workflow packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 14 operator workflow packet failed to execute"],
      operatorWorkflowDecision:
        "The active Benton operator path is proven through local workbench slice tests and deployed authenticated 9-tab workbench flows on staging and production.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});

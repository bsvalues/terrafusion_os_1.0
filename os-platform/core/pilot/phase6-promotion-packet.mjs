#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { chromium } from "@playwright/test";

const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase6-promotion-packet.latest.json"
);

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const PRODUCTION_EDGE_IP = "72.60.126.11";
const WORKBENCH_PATH = "/property/10001/forge";
const LOGIN_EMAIL = process.env.TF_PHASE6_EMAIL || "admin@terrafusionmarket.com";
const LOGIN_PASSWORD = process.env.TF_PHASE6_PASSWORD || "TerraFusion2026!";

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    outPath: readValue("--out", process.env.PHASE6_PROOF_OUT || DEFAULT_OUT_PATH),
  };
}

function commandFor(binary) {
  if (process.platform === "win32" && binary === "curl") {
    return "curl.exe";
  }

  if (process.platform === "win32" && binary === "pnpm") {
    return "pnpm.cmd";
  }

  return binary;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

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

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function parseCurlStatus(output) {
  const marker = "\n__STATUS__:";
  const index = output.lastIndexOf(marker);
  if (index === -1) {
    return { body: output, status: null };
  }

  return {
    body: output.slice(0, index),
    status: Number(output.slice(index + marker.length).trim()),
  };
}

async function curlRequest(
  url,
  { method = "GET", headers = {}, data = null, resolveHost = null, includeHeaders = false } = {}
) {
  const args = [
    "--silent",
    "--show-error",
    "--location",
    "--write-out",
    "\n__STATUS__:%{http_code}",
  ];

  if (includeHeaders) {
    args.push("--include");
  }

  if (resolveHost) {
    args.push("--resolve", `${resolveHost.host}:443:${resolveHost.ip}`);
    args.push("--resolve", `${resolveHost.host}:80:${resolveHost.ip}`);
  }

  if (method !== "GET") {
    args.push("-X", method);
  }

  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }

  if (data !== null) {
    args.push("--data", typeof data === "string" ? data : JSON.stringify(data));
  }

  args.push(url);

  const result = await runCommand(commandFor("curl"), args);
  const parsed = parseCurlStatus(result.stdout);

  return {
    ...result,
    ...parsed,
  };
}

async function getJson(url, options = {}) {
  const response = await curlRequest(url, options);
  const bodyText = response.body.trim();
  let json = null;

  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    json = null;
  }

  return { ...response, json };
}

function responseHeadersFromCurl(raw) {
  const sections = raw.split(/\r?\n\r?\n/).filter(Boolean);
  if (sections.length === 0) {
    return {};
  }

  const headerSection = sections[0];
  const lines = headerSection.split(/\r?\n/).slice(1);
  const headers = {};

  for (const line of lines) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    headers[key] = value;
  }

  return headers;
}

async function getText(url, options = {}) {
  const response = await curlRequest(url, { ...options, includeHeaders: true });
  return {
    ...response,
    headers: responseHeadersFromCurl(response.body),
  };
}

async function browserSmoke({ name, baseUrl, resolveHost = null, screenshotName }) {
  const args = [];
  if (resolveHost) {
    args.push(`--host-resolver-rules=MAP ${resolveHost.host} ${resolveHost.ip}`);
  }

  const browser = await chromium.launch({
    headless: true,
    args,
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const loginResponses = [];

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/auth/login")) {
      loginResponses.push({ url, status: response.status() });
    }
  });

  try {
    await page.goto(`${baseUrl}/login`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    await page.locator('input[type="email"], input[name="email"]').first().fill(LOGIN_EMAIL);
    await page.locator('input[type="password"], input[name="password"]').first().fill(LOGIN_PASSWORD);

    await Promise.all([
      page.waitForURL("**/canon", { timeout: 120000 }),
      page
        .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
        .first()
        .click(),
    ]);

    await page.goto(`${baseUrl}${WORKBENCH_PATH}`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    const body = await page.locator("body").innerText();
    const screenshotPath = path.resolve(
      process.cwd(),
      "os-platform/core/pilot/evidence",
      screenshotName
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const url = page.url();
    const ok = url.includes(WORKBENCH_PATH) && body.includes("TerraForge");

    return {
      ok,
      name,
      url,
      title: await page.title(),
      bodySnippet: body.slice(0, 500),
      loginResponses,
      screenshotPath,
    };
  } finally {
    await browser.close();
  }
}

async function loadJsonIfPresent(target) {
  if (!(await fileExists(target))) {
    return null;
  }

  return JSON.parse(await fs.readFile(target, "utf8"));
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const evidence = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 6 promotion packet for Benton recovery local-to-deployed proof",
    decision: "NO_GO",
    checks: [],
    summary: { ok: false, failures: 0, blockers: [] },
  };

  const record = (name, ok, detail, payload = null, blocker = null) => {
    evidence.checks.push({ name, ok, detail, payload, blocker });
    if (!ok) {
      evidence.summary.failures += 1;
      if (blocker) {
        evidence.summary.blockers.push(blocker);
      }
    }
    const stream = ok ? process.stdout : process.stderr;
    stream.write(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}\n`);
  };

  try {
    const requiredLocalDocs = [
      "docs/recovery/BENTON_CONVERSION_LEDGER.md",
      "docs/recovery/PHASE3_COSTFORGE_PROOF.md",
      "docs/recovery/PHASE4_WORKBENCH_PROOF.md",
      "docs/recovery/PHASE5_GOVERNANCE_PROOF.md",
      "docs/recovery/PHASE5_TRUTH_CLASSIFICATION.md",
    ].map((target) => path.resolve(process.cwd(), target));

    const localDocStates = await Promise.all(
      requiredLocalDocs.map(async (target) => ({ path: target, exists: await fileExists(target) }))
    );
    const localDocsOk = localDocStates.every((entry) => entry.exists);
    record(
      "local.recovery.docs",
      localDocsOk,
      localDocsOk ? "required local Benton recovery artifacts present" : "one or more recovery artifacts missing",
      localDocStates,
      localDocsOk ? null : "Local Benton recovery artifact set is incomplete"
    );

    const localUiTest =
      process.platform === "win32"
        ? await runCommand("cmd.exe", [
            "/d",
            "/s",
            "/c",
            "pnpm -C frontend test -- --runInBand apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx",
          ])
        : await runCommand("pnpm", [
            "-C",
            "frontend",
            "test",
            "--",
            "--runInBand",
            "apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx",
          ]);
    record(
      "local.propertyforge.ui",
      localUiTest.code === 0,
      `exit=${localUiTest.code}`,
      {
        stdout: localUiTest.stdout,
        stderr: localUiTest.stderr,
      },
      localUiTest.code === 0 ? null : "Local PropertyForge operator slice test failed"
    );

    const continuityPolicyPath = path.resolve(
      process.cwd(),
      "docs/recovery/PHASE6_PACS_CONTINUITY_POLICY.md"
    );
    const continuityPolicyExists = await fileExists(continuityPolicyPath);
    record(
      "policy.pacs.continuity",
      continuityPolicyExists,
      continuityPolicyExists ? "present" : "missing",
      { path: continuityPolicyPath },
      continuityPolicyExists ? null : "PACS continuity/write-back policy missing"
    );

    const stagingHealth = await getText(`${STAGING_BASE_URL}/health`);
    const stagingHealthOk = stagingHealth.code === 0 && stagingHealth.status === 200;
    record(
      "staging.health.direct",
      stagingHealthOk,
      stagingHealthOk
        ? `sha=${stagingHealth.headers["X-Release-Sha"] ?? "unknown"}`
        : `status=${stagingHealth.status ?? "curl-failed"}`,
      {
        status: stagingHealth.status,
        headers: stagingHealth.headers,
        body: stagingHealth.body,
      },
      stagingHealthOk ? null : "Staging health not reachable"
    );

    const stagingRoot = await getText(`${STAGING_BASE_URL}/`);
    const stagingRootOk =
      stagingRoot.code === 0 &&
      stagingRoot.status === 200 &&
      stagingRoot.body.includes("TerraFusion OS - Government. Transcended.") &&
      stagingRoot.body.includes('<div id="root">');
    record(
      "staging.frontend.shell",
      stagingRootOk,
      stagingRootOk ? "staging frontend served SPA shell" : `status=${stagingRoot.status ?? "curl-failed"}`,
      { status: stagingRoot.status },
      stagingRootOk ? null : "Staging frontend shell did not render"
    );

    const stagingLogin = await getJson(`${STAGING_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
      },
    });
    const stagingToken = typeof stagingLogin.json?.token === "string" ? stagingLogin.json.token : null;
    record(
      "staging.auth.login",
      stagingLogin.status === 200 && Boolean(stagingToken),
      stagingLogin.status === 200 ? LOGIN_EMAIL : `status=${stagingLogin.status ?? "curl-failed"}`,
      stagingLogin.json,
      stagingLogin.status === 200 ? null : "Staging auth login failed"
    );

    const stagingSyncStatus = await getJson(`${STAGING_BASE_URL}/api/TerraFusionSync/status`, {
      headers: stagingToken ? { Authorization: `Bearer ${stagingToken}` } : {},
    });
    const stagingConfigured =
      stagingSyncStatus.status === 200 &&
      Number(stagingSyncStatus.json?.metrics?.TotalSystems ?? 0) > 0 &&
      Number(stagingSyncStatus.json?.metrics?.ActiveCounties ?? 0) > 0;
    record(
      "staging.sync.configured",
      stagingConfigured,
      stagingConfigured
        ? `systems=${stagingSyncStatus.json.metrics.TotalSystems}, counties=${stagingSyncStatus.json.metrics.ActiveCounties}`
        : `systems=${stagingSyncStatus.json?.metrics?.TotalSystems ?? "n/a"}, counties=${stagingSyncStatus.json?.metrics?.ActiveCounties ?? "n/a"}`,
      stagingSyncStatus.json,
      stagingConfigured ? null : "Staging deployed runtime is not configured with the Benton canonical sync/data spine"
    );

    const stagingBrowser = await browserSmoke({
      name: "staging",
      baseUrl: STAGING_BASE_URL,
      screenshotName: "phase6-staging-workbench-smoke.png",
    });
    record(
      "staging.ui.workbench",
      stagingBrowser.ok,
      stagingBrowser.ok ? stagingBrowser.url : "staging workbench route did not render",
      stagingBrowser,
      stagingBrowser.ok ? null : "Staging workbench/operator route failed"
    );

    const productionDirectHealth = await getText(`${PRODUCTION_BASE_URL}/health`);
    const productionDirectOk = productionDirectHealth.code === 0 && productionDirectHealth.status === 200;
    record(
      "production.health.direct_dns",
      productionDirectOk,
      productionDirectOk ? "production apex DNS resolved publicly" : productionDirectHealth.stderr.trim() || `status=${productionDirectHealth.status ?? "curl-failed"}`,
      {
        code: productionDirectHealth.code,
        status: productionDirectHealth.status,
        stderr: productionDirectHealth.stderr,
      },
      productionDirectOk ? null : "Production apex domain does not currently resolve publicly"
    );

    const productionResolveHealth = await getText(`${PRODUCTION_BASE_URL}/health`, {
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
    });
    const productionResolveOk =
      productionResolveHealth.code === 0 && productionResolveHealth.status === 200;
    record(
      "production.health.resolve",
      productionResolveOk,
      productionResolveOk
        ? `sha=${productionResolveHealth.headers["X-Release-Sha"] ?? "unknown"}`
        : `status=${productionResolveHealth.status ?? "curl-failed"}`,
      {
        status: productionResolveHealth.status,
        headers: productionResolveHealth.headers,
        body: productionResolveHealth.body,
      },
      productionResolveOk ? null : "Production runtime not reachable through edge IP-resolve fallback"
    );

    const productionRoot = await getText(`${PRODUCTION_BASE_URL}/`, {
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
    });
    const productionRootOk =
      productionRoot.code === 0 &&
      productionRoot.status === 200 &&
      productionRoot.body.includes("TerraFusion OS - Government. Transcended.") &&
      productionRoot.body.includes('<div id="root">');
    record(
      "production.frontend.shell",
      productionRootOk,
      productionRootOk ? "production frontend served SPA shell via host resolve" : `status=${productionRoot.status ?? "curl-failed"}`,
      { status: productionRoot.status },
      productionRootOk ? null : "Production frontend shell not reachable"
    );

    const productionLogin = await getJson(`${PRODUCTION_BASE_URL}/api/auth/login`, {
      method: "POST",
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
      headers: { "Content-Type": "application/json" },
      data: {
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
      },
    });
    const productionToken = typeof productionLogin.json?.token === "string" ? productionLogin.json.token : null;
    record(
      "production.auth.login",
      productionLogin.status === 200 && Boolean(productionToken),
      productionLogin.status === 200 ? LOGIN_EMAIL : `status=${productionLogin.status ?? "curl-failed"}`,
      productionLogin.json,
      productionLogin.status === 200 ? null : "Production auth login failed"
    );

    const productionSyncStatus = await getJson(`${PRODUCTION_BASE_URL}/api/TerraFusionSync/status`, {
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
      headers: productionToken ? { Authorization: `Bearer ${productionToken}` } : {},
    });
    const productionConfigured =
      productionSyncStatus.status === 200 &&
      Number(productionSyncStatus.json?.metrics?.TotalSystems ?? 0) > 0 &&
      Number(productionSyncStatus.json?.metrics?.ActiveCounties ?? 0) > 0;
    record(
      "production.sync.configured",
      productionConfigured,
      productionConfigured
        ? `systems=${productionSyncStatus.json.metrics.TotalSystems}, counties=${productionSyncStatus.json.metrics.ActiveCounties}`
        : `systems=${productionSyncStatus.json?.metrics?.TotalSystems ?? "n/a"}, counties=${productionSyncStatus.json?.metrics?.ActiveCounties ?? "n/a"}`,
      productionSyncStatus.json,
      productionConfigured ? null : "Production deployed runtime is not configured with the Benton canonical sync/data spine"
    );

    const productionBrowser = await browserSmoke({
      name: "production",
      baseUrl: PRODUCTION_BASE_URL,
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
      screenshotName: "phase6-production-workbench-smoke.png",
    });
    record(
      "production.ui.workbench",
      productionBrowser.ok,
      productionBrowser.ok ? productionBrowser.url : "production workbench route did not render",
      productionBrowser,
      productionBrowser.ok ? null : "Production workbench/operator route failed"
    );

    const packetDocPath = path.resolve(process.cwd(), "docs/recovery/PHASE6_PROMOTION_PACKET.md");
    const packetDocExists = await fileExists(packetDocPath);
    record(
      "phase6.packet.doc",
      packetDocExists,
      packetDocExists ? "present" : "missing",
      { path: packetDocPath },
      packetDocExists ? null : "Phase 6 promotion packet doc missing"
    );

    evidence.summary.ok = evidence.summary.failures === 0;
    evidence.decision = evidence.summary.ok ? "GO" : "NO_GO";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record("phase6.packet", false, message, { error: message }, "Phase 6 promotion packet failed to execute");
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`Evidence written to ${outPath}\n`);
  process.exitCode = evidence.summary.ok ? 0 : 1;
}

await main();

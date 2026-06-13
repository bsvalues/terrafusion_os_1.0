#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runJune10OperatorPostLoginSmoke } from "./june10-operator-post-login-smoke.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-owner-login-ready.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-owner-login-ready.latest.md"
);
const DEFAULT_SCREENSHOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "screenshots",
  "june10-owner-login-ready-shell.latest.png"
);
const DEFAULT_HANDOFF = path.join(repoRoot, ".tmp", "TerraFusion-Owner-Login-Handoff.txt");

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.TF_J10_OWNER_AUTH_BASE_URL ?? process.env.TF_J10_OPERATOR_AUTH_BASE_URL ?? DEFAULT_BASE_URL,
    email: process.env.TF_J10_OWNER_EMAIL ?? process.env.TF_J10_OPERATOR_EMAIL ?? process.env.TF_PROVISIONED_AUTH_EMAIL ?? null,
    password:
      process.env.TF_J10_OWNER_PASSWORD ??
      process.env.TF_J10_OPERATOR_PASSWORD ??
      process.env.TF_PROVISIONED_AUTH_PASSWORD ??
      null,
    passwordEnv: null,
    handoffPath: process.env.TF_J10_OWNER_HANDOFF_PATH ?? DEFAULT_HANDOFF,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    screenshotPath: DEFAULT_SCREENSHOT,
    fixture: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--base-url") options.baseUrl = next();
    else if (arg === "--email") options.email = next();
    else if (arg === "--password-env") options.passwordEnv = next();
    else if (arg === "--handoff-path") options.handoffPath = next();
    else if (arg === "--out-json") options.outJson = next();
    else if (arg === "--out-md") options.outMd = next();
    else if (arg === "--screenshot") options.screenshotPath = next();
    else if (arg === "--fixture") options.fixture = next();
  }

  if (options.passwordEnv) {
    options.password = process.env[options.passwordEnv] ?? null;
  }

  return options;
}

function buildFixtureOperatorReport({ baseUrl, email, screenshotPath }) {
  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    email,
    passwordSupplied: "yes (redacted)",
    login: {
      finalUrl: `${baseUrl.replace(/\/+$/, "")}/`,
      tokenStored: true,
      jwtIdentity: {
        email,
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyName: "Benton",
        countyState: "WA",
        countyFipsCode: "53005"
      }
    },
    shell: {
      osShellHomeLoaded: true,
      canonLoaded: false,
      chromeSignals: {
        terraFusionOsTitle: true,
        shellChrome: true,
        bentonCounty: true
      }
    },
    protectedApis: {
      profile: {
        status: 200,
        operatorIdentityRecognized: true,
        userId: "fixture-owner-user-id",
        email,
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyId: "fixture-county-id",
        county: "Benton",
        countyFipsCode: "53005",
        state: "WA",
        sessionValid: true
      },
      bentonParcels: {
        status: 200,
        county: "Benton",
        rowsReturned: 1,
        bentonContextPresent: true
      }
    },
    consoleAndRuntime: {
      authErrorCount: 0,
      authErrors: [],
      pageErrorCount: 0,
      pageErrors: []
    },
    logout: {
      controlFound: true,
      clicked: true,
      redirectedToLogin: true,
      tokenCleared: true
    },
    invalidToken: {
      redirectedToLogin: true,
      tokenCleared: true,
      protectedApiRejected: true,
      status: 401
    },
    screenshotPath,
    operatorIdentityRecognized: true,
    protectedApiSucceeded: true,
    bentonCountyContextPresent: true,
    warnings: [],
    passed: true,
    blockers: []
  };
}

function writeHandoff({ handoffPath, baseUrl, email, password }) {
  if (!email || !password) return null;

  const fullPath = path.resolve(handoffPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(
    fullPath,
    [
      "TerraFusion Owner Login Handoff",
      "",
      "Purpose: human owner access for the June 10 controlled Benton County Runtime Pilot.",
      `URL: ${baseUrl.replace(/\/+$/, "")}/login`,
      `Email: ${email}`,
      `Password: ${password}`,
      "",
      "Access model: administrator-provisioned TerraFusion DB account.",
      "Do not commit this file. Do not paste this credential into chat.",
      "After owner manual verification, rotate this password through the provisioned auth path."
    ].join("\n")
  );
  return fullPath;
}

function inspectHandoff({ handoffPath, email, password }) {
  const fullPath = path.resolve(handoffPath);
  const exists = fs.existsSync(fullPath);
  const content = exists ? fs.readFileSync(fullPath, "utf8") : "";
  return {
    path: fullPath,
    relativePath: fullPath.startsWith(repoRoot) ? rel(fullPath) : fullPath,
    exists,
    containsEmail: Boolean(email && content.includes(email)),
    containsPassword: Boolean(password && content.includes(password)),
    gitIgnored:
      !fullPath.startsWith(repoRoot) ||
      fullPath.includes(`${path.sep}.tmp${path.sep}`) ||
      fullPath.endsWith(".env"),
    pathIncludesTmpOrUserProfile:
      fullPath.includes(`${path.sep}.tmp${path.sep}`) ||
      fullPath.startsWith(process.env.USERPROFILE ?? "__no_user_profile__")
  };
}

function buildOwnerReport({ baseUrl, email, password, operatorReport, handoff }) {
  const blockers = [...(operatorReport.blockers ?? [])];
  const warnings = [...(operatorReport.warnings ?? [])];

  if (!email) blockers.push("Owner email is not configured.");
  if (!password) blockers.push("Owner password is not configured.");
  if (!handoff.exists) blockers.push("Owner operator credential handoff file does not exist.");
  if (!handoff.containsEmail) blockers.push("Owner operator credential handoff does not include the login email.");
  if (!handoff.containsPassword) blockers.push("Owner operator credential handoff does not include the password.");
  if (!handoff.gitIgnored) blockers.push("Owner operator credential handoff is not in an ignored local-only location.");
  if (!handoff.pathIncludesTmpOrUserProfile) {
    blockers.push("Owner operator credential handoff is not in a local temporary or user-profile path.");
  }

  const ownerAccessReady = blockers.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    ownerEmail: email,
    passwordSupplied: password ? "yes (redacted)" : "no",
    ownerAccessReady,
    operatorSmoke: {
      passed: operatorReport.passed === true,
      finalUrl: operatorReport.login?.finalUrl ?? null,
      profileStatus: operatorReport.protectedApis?.profile?.status ?? null,
      profileUserId: operatorReport.protectedApis?.profile?.userId ?? null,
      profileRoles: operatorReport.protectedApis?.profile?.roles ?? [],
      profilePermissions: operatorReport.protectedApis?.profile?.permissions ?? [],
      profileCountyFips: operatorReport.protectedApis?.profile?.countyFipsCode ?? null,
      profileState: operatorReport.protectedApis?.profile?.state ?? null,
      sessionValid: operatorReport.protectedApis?.profile?.sessionValid === true,
      screenshotPath: operatorReport.screenshotPath ?? null
    },
    handoff,
    warnings,
    passed: ownerAccessReady,
    blockers
  };
}

function renderMarkdown(report) {
  return [
    "# June 10 Owner Login Ready",
    "",
    `Generated: ${report.generatedAt}`,
    `Base URL: ${report.baseUrl}`,
    `Owner operator: ${report.ownerEmail ?? "not configured"}`,
    `Password supplied: ${report.passwordSupplied}`,
    "",
    `Verdict: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Owner operator credential handoff",
    "",
    `- Handoff path: ${report.handoff.relativePath}`,
    `- Handoff exists: ${report.handoff.exists === true}`,
    `- Contains email: ${report.handoff.containsEmail === true}`,
    `- Contains password: ${report.handoff.containsPassword === true}`,
    `- Local ignored path: ${report.handoff.gitIgnored === true}`,
    "",
    "## Runtime smoke",
    "",
    `- Operator smoke passed: ${report.operatorSmoke.passed === true}`,
    `- Final URL: ${report.operatorSmoke.finalUrl ?? "not captured"}`,
    `- Profile API status: ${report.operatorSmoke.profileStatus ?? "not attempted"}`,
    `- Profile user id: ${report.operatorSmoke.profileUserId ?? "none"}`,
    `- Profile county FIPS: ${report.operatorSmoke.profileCountyFips ?? "none"}`,
    `- Profile state: ${report.operatorSmoke.profileState ?? "none"}`,
    `- Session valid: ${report.operatorSmoke.sessionValid === true}`,
    `- Screenshot: ${report.operatorSmoke.screenshotPath ?? "not captured"}`,
    "",
    "## Warnings",
    "",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ["- None"]),
    "",
    "## Blockers",
    "",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- None"])
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const handoffPath = options.password
    ? writeHandoff({
        handoffPath: options.handoffPath,
        baseUrl: options.baseUrl,
        email: options.email,
        password: options.password
      })
    : path.resolve(options.handoffPath);

  const operatorReport = options.fixture
    ? buildFixtureOperatorReport({
        baseUrl: options.baseUrl,
        email: options.email,
        screenshotPath: "fixture"
      })
    : await runJune10OperatorPostLoginSmoke({
        baseUrl: options.baseUrl,
        email: options.email,
        password: options.password,
        screenshotPath: options.screenshotPath
      });

  const report = buildOwnerReport({
    baseUrl: options.baseUrl,
    email: options.email,
    password: options.password,
    operatorReport,
    handoff: inspectHandoff({ handoffPath, email: options.email, password: options.password })
  });

  fs.mkdirSync(path.dirname(options.outJson), { recursive: true });
  fs.mkdirSync(path.dirname(options.outMd), { recursive: true });
  fs.writeFileSync(options.outJson, JSON.stringify(report, null, 2));
  fs.writeFileSync(options.outMd, renderMarkdown(report));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

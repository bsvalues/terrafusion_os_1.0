#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  "june10-operator-auth-smoke.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-operator-auth-smoke.latest.md"
);
const DEFAULT_SCREENSHOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "screenshots",
  "june10-operator-authenticated-shell.latest.png"
);

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function redacted(value) {
  return Boolean(value) ? "yes (redacted)" : "no";
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.TF_J10_OPERATOR_AUTH_BASE_URL ?? DEFAULT_BASE_URL,
    email: process.env.TF_J10_OPERATOR_EMAIL ?? process.env.TF_PROVISIONED_AUTH_EMAIL ?? null,
    password: process.env.TF_J10_OPERATOR_PASSWORD ?? process.env.TF_PROVISIONED_AUTH_PASSWORD ?? null,
    passwordEnv: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    screenshotPath: DEFAULT_SCREENSHOT,
    runBrowser: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--base-url") options.baseUrl = next();
    else if (arg === "--email") options.email = next();
    else if (arg === "--password-env") options.passwordEnv = next();
    else if (arg === "--out-json") options.outJson = next();
    else if (arg === "--out-md") options.outMd = next();
    else if (arg === "--screenshot") options.screenshotPath = next();
    else if (arg === "--skip-browser") options.runBrowser = false;
  }

  if (options.passwordEnv) {
    options.password = process.env[options.passwordEnv] ?? null;
  }

  return options;
}

function decodeJwtPayload(token) {
  const parts = String(token ?? "").split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function extractClaims(token) {
  const payload = decodeJwtPayload(token) ?? {};
  return {
    email: payload.email ?? payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ?? null,
    roles: asArray(payload.role ?? payload.roles ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]),
    permissions: asArray(payload.perm ?? payload.permissions),
    countyId: payload.countyId ?? null,
    countyName: payload.countyName ?? null,
    countyState: payload.countyState ?? null,
    countyFipsCode: payload.countyFipsCode ?? null
  };
}

async function apiLogin(baseUrl, email, password) {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/auth/login`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "TerraFusion-June10-OperatorAuthSmoke/1.0"
    },
    body: JSON.stringify({ email, password })
  });
  const bodyText = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = null;
  }

  const token = payload?.token ?? payload?.Token ?? payload?.accessToken ?? null;
  const refreshToken = payload?.refreshToken ?? payload?.RefreshToken ?? null;

  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    token,
    tokenIssued: typeof token === "string" && token.length > 0,
    tokenLength: typeof token === "string" ? token.length : 0,
    refreshTokenIssued: typeof refreshToken === "string" && refreshToken.length > 0,
    returnedEmail: payload?.email ?? payload?.Email ?? payload?.user?.email ?? null,
    roles: asArray(payload?.roles ?? payload?.Roles ?? payload?.user?.roles),
    bodySnippet: bodyText.replace(/\s+/g, " ").slice(0, 240)
  };
}

async function browserLogin({ baseUrl, email, password, screenshotPath }) {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch (error) {
    return {
      attempted: true,
      required: true,
      passed: false,
      error: `Playwright is unavailable: ${error.message}`
    };
  }

  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true
  });
  const apiResponses = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/auth/login") || url.includes("/api/auth/access-policy")) {
      apiResponses.push({ url, status: response.status() });
    }
  });

  try {
    await page.goto(`${normalizeBaseUrl(baseUrl)}/login?j10=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/auth/login"), { timeout: 45000 }),
      page.getByRole("button", { name: /sign in/i }).click()
    ]);
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 45000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    const tokenInfo = await page.evaluate(() => {
      const token = localStorage.getItem("authToken");
      return {
        tokenStored: Boolean(token),
        tokenLength: token?.length ?? 0,
        localStorageKeys: Object.keys(localStorage).sort()
      };
    });
    const bodyText = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const result = {
      attempted: true,
      required: true,
      currentUrl,
      loginResponseStatus: apiResponses.find((item) => item.url.includes("/api/auth/login"))?.status ?? null,
      accessPolicyStatus: apiResponses.find((item) => item.url.includes("/api/auth/access-policy"))?.status ?? null,
      redirectedOutOfLogin: !new URL(currentUrl).pathname.startsWith("/login"),
      tokenStoredInBrowser: tokenInfo.tokenStored,
      tokenLength: tokenInfo.tokenLength,
      localStorageKeys: tokenInfo.localStorageKeys,
      shellTextSignals: {
        terraFusion: /TerraFusion/i.test(bodyText),
        signInAbsent: !/Sign In/i.test(bodyText),
        loginErrorAbsent: !/Invalid credentials|Account not provisioned|Network error/i.test(bodyText),
        bodyTextLength: bodyText.length
      },
      screenshotPath: rel(screenshotPath),
      passed: false,
      error: null
    };

    result.passed = Boolean(
      result.loginResponseStatus === 200 &&
        result.redirectedOutOfLogin &&
        result.tokenStoredInBrowser &&
        result.shellTextSignals.loginErrorAbsent
    );
    return result;
  } catch (error) {
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    return {
      attempted: true,
      required: true,
      passed: false,
      screenshotPath: rel(screenshotPath),
      error: error.message
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

export function buildJune10OperatorAuthSmokeReport({ baseUrl, email, apiLogin, claims, browser }) {
  const blockers = [];

  if (!email) blockers.push("Operator email is not configured.");
  if (apiLogin.status !== 200) blockers.push(`Login API returned ${apiLogin.status}.`);
  if (!apiLogin.tokenIssued) blockers.push("Login API did not issue a JWT.");
  if (!apiLogin.refreshTokenIssued) blockers.push("Login API did not issue a refresh token.");
  if (apiLogin.returnedEmail && apiLogin.returnedEmail.toLowerCase() !== email.toLowerCase()) {
    blockers.push(`Login API returned unexpected email ${apiLogin.returnedEmail}.`);
  }
  if (claims.email && claims.email.toLowerCase() !== email.toLowerCase()) {
    blockers.push(`JWT email claim does not match operator email: ${claims.email}.`);
  }
  if (!claims.roles.includes("GovernmentUser")) blockers.push("JWT missing GovernmentUser role.");
  if (!claims.roles.includes("Administrator")) blockers.push("JWT missing Administrator role.");
  if (!claims.countyId || !claims.countyName || !claims.countyState || !claims.countyFipsCode) {
    blockers.push("JWT missing required Benton county claim set.");
  }
  for (const permission of ["runtime:read", "county:read", "june10:smoke", "workbench:access"]) {
    if (!claims.permissions.includes(permission)) blockers.push(`JWT missing required permission: ${permission}.`);
  }
  if (browser?.required && !browser.passed) {
    blockers.push(`Browser login proof failed: ${browser.error ?? "authenticated shell proof did not pass"}.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    email,
    passwordSupplied: "yes (redacted)",
    apiLogin: {
      status: apiLogin.status,
      contentType: apiLogin.contentType,
      tokenIssued: apiLogin.tokenIssued,
      tokenLength: apiLogin.tokenLength,
      refreshTokenIssued: apiLogin.refreshTokenIssued,
      returnedEmail: apiLogin.returnedEmail,
      roles: apiLogin.roles
    },
    claims,
    browser,
    passed: blockers.length === 0,
    blockers
  };
}

export async function runJune10OperatorAuthSmoke({
  baseUrl = DEFAULT_BASE_URL,
  email,
  password,
  runBrowser = true,
  screenshotPath = DEFAULT_SCREENSHOT
}) {
  if (!email || !password) {
    return buildJune10OperatorAuthSmokeReport({
      baseUrl,
      email,
      apiLogin: {
        status: null,
        contentType: null,
        tokenIssued: false,
        tokenLength: 0,
        refreshTokenIssued: false,
        returnedEmail: null,
        roles: []
      },
      claims: {
        email: null,
        roles: [],
        permissions: [],
        countyId: null,
        countyName: null,
        countyState: null,
        countyFipsCode: null
      },
      browser: { attempted: false, required: runBrowser, passed: !runBrowser, error: "credentials missing" }
    });
  }

  const login = await apiLogin(baseUrl, email, password);
  const claims = extractClaims(login.token);
  const browser = runBrowser
    ? await browserLogin({ baseUrl, email, password, screenshotPath })
    : { attempted: false, required: false, passed: true };

  return buildJune10OperatorAuthSmokeReport({
    baseUrl,
    email,
    apiLogin: login,
    claims,
    browser
  });
}

function renderMarkdown(report) {
  return [
    "# June 10 Operator Auth Smoke",
    "",
    `Generated: ${report.generatedAt}`,
    `Base URL: ${report.baseUrl}`,
    `Operator: ${report.email ?? "not configured"}`,
    `Password supplied: ${redacted(report.passwordSupplied)}`,
    "",
    `Verdict: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## API Login",
    "",
    `- Status: ${report.apiLogin.status ?? "not attempted"}`,
    `- JWT issued: ${report.apiLogin.tokenIssued}`,
    `- Refresh token issued: ${report.apiLogin.refreshTokenIssued}`,
    `- Returned email: ${report.apiLogin.returnedEmail ?? "none"}`,
    `- Roles: ${report.apiLogin.roles.join(", ") || "none"}`,
    "",
    "## JWT Claims",
    "",
    `- Roles: ${report.claims.roles.join(", ") || "none"}`,
    `- Permissions: ${report.claims.permissions.join(", ") || "none"}`,
    `- County: ${report.claims.countyName ?? "none"} ${report.claims.countyState ?? ""} (${report.claims.countyFipsCode ?? "no FIPS"})`,
    "",
    "## Browser",
    "",
    `- Attempted: ${report.browser?.attempted === true}`,
    `- Passed: ${report.browser?.passed === true}`,
    `- Current URL: ${report.browser?.currentUrl ?? "not captured"}`,
    `- Screenshot: ${report.browser?.screenshotPath ?? "not captured"}`,
    "",
    "## Blockers",
    "",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- None"])
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runJune10OperatorAuthSmoke(options);
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

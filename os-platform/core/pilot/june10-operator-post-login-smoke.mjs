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
  "june10-operator-post-login-smoke.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-operator-post-login-smoke.latest.md"
);
const DEFAULT_SCREENSHOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "screenshots",
  "june10-operator-post-login-shell.latest.png"
);

const REQUIRED_JWT_ROLES = ["GovernmentUser"];
const REQUIRED_JWT_PERMISSIONS = ["runtime:read", "county:read", "workbench:access"];

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
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

function extractJwtIdentity(token) {
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

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.TF_J10_OPERATOR_AUTH_BASE_URL ?? DEFAULT_BASE_URL,
    email: process.env.TF_J10_OPERATOR_EMAIL ?? process.env.TF_PROVISIONED_AUTH_EMAIL ?? null,
    password: process.env.TF_J10_OPERATOR_PASSWORD ?? process.env.TF_PROVISIONED_AUTH_PASSWORD ?? null,
    passwordEnv: null,
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

function hasRequiredIdentity(identity, expectedEmail) {
  const expected = String(expectedEmail ?? "").toLowerCase();
  return Boolean(
    identity?.email &&
      identity.email.toLowerCase() === expected &&
      REQUIRED_JWT_ROLES.every((role) => identity.roles?.includes(role)) &&
      REQUIRED_JWT_PERMISSIONS.every((permission) => identity.permissions?.includes(permission)) &&
      identity.countyName === "Benton" &&
      identity.countyState === "WA" &&
      identity.countyFipsCode === "53005"
  );
}

function isAuthRuntimeSignal(value) {
  return /auth|token|session|login|unauthori[sz]ed|forbidden|jwt|credential/i.test(String(value ?? ""));
}

function profileIdentityFromPayload(payload) {
  const source = payload?.user ?? payload?.User ?? payload ?? {};
  return {
    userId: source.userId ?? source.UserId ?? null,
    email: source.email ?? source.Email ?? null,
    roles: asArray(source.roles ?? source.Roles),
    permissions: asArray(source.permissions ?? source.Permissions),
    countyId: source.countyId ?? source.CountyId ?? null,
    county: source.county ?? source.County ?? source.countyName ?? source.CountyName ?? null,
    countyFipsCode: source.countyFipsCode ?? source.CountyFipsCode ?? null,
    state: source.state ?? source.State ?? source.countyState ?? source.CountyState ?? null,
    sessionValid: source.sessionValid ?? source.SessionValid ?? false
  };
}

function hasRequiredProfileIdentity(identity, expectedEmail) {
  const expected = String(expectedEmail ?? "").toLowerCase();
  return Boolean(
    identity?.userId &&
      identity?.email &&
      identity.email.toLowerCase() === expected &&
      REQUIRED_JWT_ROLES.every((role) => identity.roles?.includes(role)) &&
      REQUIRED_JWT_PERMISSIONS.every((permission) => identity.permissions?.includes(permission)) &&
      identity.countyId &&
      identity.countyFipsCode === "53005" &&
      identity.state === "WA" &&
      identity.sessionValid === true
  );
}

export async function fetchJsonWithBearer(url, token) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "user-agent": "TerraFusion-June10-OperatorPostLoginSmoke/1.0"
    }
  });
  const bodyText = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    payload,
    bodySnippet: bodyText.replace(/\s+/g, " ").slice(0, 400)
  };
}

async function fillLoginForm(page, email, password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

async function clickLogoutIfPresent(page) {
  const result = {
    controlFound: false,
    clicked: false,
    redirectedToLogin: false,
    tokenCleared: false
  };

  const profileButton = page.getByRole("button", { name: /profile/i }).first();
  if ((await profileButton.count().catch(() => 0)) > 0) {
    await profileButton.click().catch(() => {});
    await page.waitForTimeout(600);
  }

  const logoutControl = page
    .locator("button, a, [role='button'], [role='menuitem']")
    .filter({ hasText: /log out|logout|sign out/i })
    .first();
  result.controlFound = (await logoutControl.count().catch(() => 0)) > 0;

  if (!result.controlFound) return result;

  await logoutControl.click();
  result.clicked = true;
  await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  result.redirectedToLogin = new URL(page.url()).pathname.startsWith("/login");
  result.tokenCleared = await page.evaluate(() => !localStorage.getItem("authToken")).catch(() => false);
  return result;
}

async function inspectInvalidTokenBehavior(baseUrl) {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch (error) {
    return {
      redirectedToLogin: false,
      tokenCleared: false,
      protectedApiRejected: false,
      status: null,
      error: `Playwright is unavailable: ${error.message}`
    };
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  try {
    await page.goto(normalizeBaseUrl(baseUrl), { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
    await page.evaluate(() => localStorage.setItem("authToken", "invalid.jwt.token"));
    await page.goto(`${normalizeBaseUrl(baseUrl)}/canon?invalidTokenSmoke=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const invalidApi = await fetchJsonWithBearer(`${normalizeBaseUrl(baseUrl)}/api/auth/profile`, "invalid.jwt.token");
    return {
      finalUrl: page.url(),
      redirectedToLogin: new URL(page.url()).pathname.startsWith("/login"),
      tokenCleared: await page.evaluate(() => !localStorage.getItem("authToken")).catch(() => false),
      protectedApiRejected: invalidApi.status === 401 || invalidApi.status === 403,
      status: invalidApi.status,
      error: null
    };
  } catch (error) {
    return {
      redirectedToLogin: false,
      tokenCleared: false,
      protectedApiRejected: false,
      status: null,
      error: error.message
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function runBrowserSmoke({ baseUrl, email, password, screenshotPath }) {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch (error) {
    return {
      login: { finalUrl: null, tokenStored: false, jwtIdentity: null },
      shell: {
        canonLoaded: false,
        chromeSignals: {
          terraFusionOsTitle: false,
          shellChrome: false,
          bentonCounty: false,
          canonWorkbench: false
        }
      },
      consoleAndRuntime: {
        authErrorCount: 1,
        authErrors: [`Playwright is unavailable: ${error.message}`],
        pageErrorCount: 0,
        pageErrors: []
      },
      logout: {
        controlFound: false,
        clicked: false,
        redirectedToLogin: false,
        tokenCleared: false
      },
      token: null,
      screenshotPath: null
    };
  }

  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

  const authErrors = [];
  const pageErrors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true
  });

  page.on("console", (message) => {
    const text = message.text();
    if (isAuthRuntimeSignal(text) && message.type() !== "debug") {
      authErrors.push(`${message.type()}: ${text}`.slice(0, 500));
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message.slice(0, 500)));
  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && isAuthRuntimeSignal(url)) {
      authErrors.push(`HTTP ${status}: ${url}`);
    }
  });

  try {
    await page.goto(`${normalizeBaseUrl(baseUrl)}/login?postLoginSmoke=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/auth/login"), { timeout: 45000 }),
      fillLoginForm(page, email, password)
    ]);
    await page.waitForURL((url) => url.pathname.startsWith("/canon"), { timeout: 45000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    const bodyText = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
    const token = await page.evaluate(() => localStorage.getItem("authToken")).catch(() => null);
    const jwtIdentity = extractJwtIdentity(token);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const logout = await clickLogoutIfPresent(page);

    return {
      login: {
        finalUrl,
        tokenStored: Boolean(token),
        jwtIdentity
      },
      shell: {
        canonLoaded: new URL(finalUrl).pathname.startsWith("/canon"),
        chromeSignals: {
          terraFusionOsTitle: /TerraFusion OS/i.test(bodyText),
          shellChrome: /TerraFusion OS Desktop|HEALTH|SENTINEL|Assessor/i.test(bodyText),
          bentonCounty: /Benton County/i.test(bodyText),
          canonWorkbench: /TerraCanon|Canon|Workbench/i.test(bodyText)
        },
        bodyTextLength: bodyText.length
      },
      consoleAndRuntime: {
        authErrorCount: authErrors.length,
        authErrors,
        pageErrorCount: pageErrors.length,
        pageErrors
      },
      logout,
      token,
      screenshotPath: rel(screenshotPath)
    };
  } catch (error) {
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    return {
      login: { finalUrl: page.url(), tokenStored: false, jwtIdentity: null },
      shell: {
        canonLoaded: false,
        chromeSignals: {
          terraFusionOsTitle: false,
          shellChrome: false,
          bentonCounty: false,
          canonWorkbench: false
        }
      },
      consoleAndRuntime: {
        authErrorCount: authErrors.length,
        authErrors,
        pageErrorCount: pageErrors.length + 1,
        pageErrors: [...pageErrors, error.message]
      },
      logout: {
        controlFound: false,
        clicked: false,
        redirectedToLogin: false,
        tokenCleared: false
      },
      token: null,
      screenshotPath: rel(screenshotPath)
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

function buildFixtureReport(fixture, email) {
  if (fixture !== "pass") {
    throw new Error(`Unknown fixture: ${fixture}`);
  }

  return buildJune10OperatorPostLoginSmokeReport({
    baseUrl: DEFAULT_BASE_URL,
    email,
    login: {
      finalUrl: `${DEFAULT_BASE_URL}/canon`,
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
      canonLoaded: true,
      chromeSignals: {
        terraFusionOsTitle: true,
        shellChrome: true,
        bentonCounty: true,
        canonWorkbench: true
      }
    },
    protectedApis: {
      profile: {
        status: 200,
        operatorIdentityRecognized: true,
        userId: "fixture-user-id",
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
    screenshotPath: "fixture"
  });
}

export function buildJune10OperatorPostLoginSmokeReport({
  baseUrl,
  email,
  login,
  shell,
  protectedApis,
  consoleAndRuntime,
  logout,
  invalidToken,
  screenshotPath
}) {
  const blockers = [];
  const warnings = [];
  const profile = protectedApis?.profile ?? {};
  const operatorIdentityRecognized = hasRequiredProfileIdentity(profile, email);
  const protectedApiSucceeded = Boolean(
    profile.status === 200 && operatorIdentityRecognized === true
  );
  const bentonCountyContextPresent = Boolean(
    profile.countyFipsCode === "53005" &&
      profile.state === "WA" &&
      shell?.chromeSignals?.bentonCounty === true &&
      protectedApis?.bentonParcels?.bentonContextPresent === true &&
      protectedApis?.bentonParcels?.county === "Benton"
  );

  if (!email) blockers.push("Operator email is not configured.");
  if (!login?.finalUrl || !new URL(login.finalUrl, baseUrl).pathname.startsWith("/canon")) {
    blockers.push("/canon did not load after login.");
  }
  if (!login?.tokenStored) blockers.push("Browser did not store JWT after login.");
  if (!operatorIdentityRecognized) {
    blockers.push("Operator identity is not recognized from /api/auth/profile, including DB-backed user, permissions, active session, and Benton FIPS 53005.");
  }
  if (!hasRequiredIdentity(login?.jwtIdentity, email)) {
    warnings.push("JWT identity claims are incomplete or do not include Benton FIPS 53005.");
  }
  if (!shell?.canonLoaded) blockers.push("/canon route did not load cleanly.");
  for (const [signal, present] of Object.entries(shell?.chromeSignals ?? {})) {
    if (!present) blockers.push(`Shell chrome signal missing: ${signal}.`);
  }

  if (profile.status !== 200) {
    blockers.push(`/api/auth/profile returned ${profile.status ?? "not attempted"}.`);
  } else if (!profile.operatorIdentityRecognized) {
    blockers.push("/api/auth/profile did not recognize the logged-in operator identity.");
  } else if (profile.sessionValid !== true) {
    blockers.push("/api/auth/profile did not confirm a valid persisted user session.");
  }

  if (!protectedApiSucceeded) {
    blockers.push("No protected API call succeeded with the login JWT.");
  }

  const parcels = protectedApis?.bentonParcels ?? {};
  if (parcels.status !== 200) {
    blockers.push(`/api/counties/benton/parcels returned ${parcels.status ?? "not attempted"}.`);
  }
  if (!parcels.bentonContextPresent || parcels.county !== "Benton") {
    blockers.push("Benton county context was not present in protected parcels API response.");
  }
  if (!bentonCountyContextPresent) {
    blockers.push("Benton county context / FIPS 53005 is not present across profile, shell, and protected API evidence.");
  }
  if (!Number.isFinite(parcels.rowsReturned) || parcels.rowsReturned <= 0) {
    blockers.push("Protected Benton parcels API returned zero rows.");
  }

  if ((consoleAndRuntime?.authErrorCount ?? 0) > 0) {
    blockers.push(`Console/runtime auth errors were detected: ${consoleAndRuntime.authErrorCount}.`);
  }
  if ((consoleAndRuntime?.pageErrorCount ?? 0) > 0) {
    blockers.push(`Browser page errors were detected: ${consoleAndRuntime.pageErrorCount}.`);
  }

  if (!logout?.controlFound) blockers.push("No visible logout/sign-out control found after login.");
  else if (!logout.clicked || !logout.redirectedToLogin || !logout.tokenCleared) {
    blockers.push("Logout control did not return to login and clear token cleanly.");
  }

  if (!invalidToken?.protectedApiRejected) {
    blockers.push("Invalid token was not rejected by protected API.");
  }
  if (!invalidToken?.redirectedToLogin || !invalidToken?.tokenCleared) {
    blockers.push("Invalid token did not return to login cleanly and clear browser token state.");
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    email,
    passwordSupplied: "yes (redacted)",
    login,
    shell,
    protectedApis,
    consoleAndRuntime,
    logout,
    invalidToken,
    screenshotPath,
    operatorIdentityRecognized,
    protectedApiSucceeded,
    bentonCountyContextPresent,
    warnings,
    passed: blockers.length === 0,
    blockers
  };
}

export async function runJune10OperatorPostLoginSmoke({
  baseUrl = DEFAULT_BASE_URL,
  email,
  password,
  screenshotPath = DEFAULT_SCREENSHOT
}) {
  if (!email || !password) {
    return buildJune10OperatorPostLoginSmokeReport({
      baseUrl,
      email,
      login: { finalUrl: null, tokenStored: false, jwtIdentity: null },
      shell: {
        canonLoaded: false,
        chromeSignals: {
          terraFusionOsTitle: false,
          shellChrome: false,
          bentonCounty: false,
          canonWorkbench: false
        }
      },
      protectedApis: {
        profile: {
          status: null,
          operatorIdentityRecognized: false,
          userId: null,
          email: null,
          roles: [],
          permissions: [],
          countyId: null,
          county: null,
          countyFipsCode: null,
          state: null,
          sessionValid: false
        },
        bentonParcels: { status: null, county: null, rowsReturned: 0, bentonContextPresent: false }
      },
      consoleAndRuntime: { authErrorCount: 0, authErrors: [], pageErrorCount: 0, pageErrors: [] },
      logout: { controlFound: false, clicked: false, redirectedToLogin: false, tokenCleared: false },
      invalidToken: { redirectedToLogin: false, tokenCleared: false, protectedApiRejected: false, status: null },
      screenshotPath: null
    });
  }

  const browser = await runBrowserSmoke({ baseUrl, email, password, screenshotPath });
  const token = browser.token;
  const profileResponse = token
    ? await fetchJsonWithBearer(`${normalizeBaseUrl(baseUrl)}/api/auth/profile`, token)
    : { status: null, payload: null };
  const profileIdentity = profileIdentityFromPayload(profileResponse.payload);
  const parcelsResponse = token
    ? await fetchJsonWithBearer(`${normalizeBaseUrl(baseUrl)}/api/counties/benton/parcels?limit=1`, token)
    : { status: null, payload: null };
  const parcelRows = Array.isArray(parcelsResponse.payload?.data)
    ? parcelsResponse.payload.data.length
    : Array.isArray(parcelsResponse.payload?.items)
      ? parcelsResponse.payload.items.length
      : Array.isArray(parcelsResponse.payload)
        ? parcelsResponse.payload.length
        : Number.isFinite(parcelsResponse.payload?.count)
          ? Math.min(parcelsResponse.payload.count, 1)
          : 0;
  const invalidToken = await inspectInvalidTokenBehavior(baseUrl);

  return buildJune10OperatorPostLoginSmokeReport({
    baseUrl,
    email,
    login: {
      finalUrl: browser.login.finalUrl,
      tokenStored: browser.login.tokenStored,
      jwtIdentity: browser.login.jwtIdentity
    },
    shell: browser.shell,
    protectedApis: {
      profile: {
        status: profileResponse.status,
        operatorIdentityRecognized: hasRequiredProfileIdentity(profileIdentity, email),
        userId: profileIdentity.userId,
        email: profileIdentity.email,
        roles: profileIdentity.roles,
        permissions: profileIdentity.permissions,
        countyId: profileIdentity.countyId,
        county: profileIdentity.county,
        countyFipsCode: profileIdentity.countyFipsCode,
        state: profileIdentity.state,
        sessionValid: profileIdentity.sessionValid
      },
      bentonParcels: {
        status: parcelsResponse.status,
        county: parcelsResponse.payload?.county ?? parcelsResponse.payload?.County ?? null,
        rowsReturned: parcelRows,
        bentonContextPresent: (parcelsResponse.payload?.county ?? parcelsResponse.payload?.County) === "Benton"
      }
    },
    consoleAndRuntime: browser.consoleAndRuntime,
    logout: browser.logout,
    invalidToken,
    screenshotPath: browser.screenshotPath
  });
}

function renderMarkdown(report) {
  return [
    "# June 10 Operator Post-Login Smoke",
    "",
    `Generated: ${report.generatedAt}`,
    `Base URL: ${report.baseUrl}`,
    `Operator: ${report.email ?? "not configured"}`,
    `Password supplied: ${report.passwordSupplied}`,
    "",
    `Verdict: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Shell",
    "",
    `- Final URL: ${report.login?.finalUrl ?? "not captured"}`,
    `- /canon loaded: ${report.shell?.canonLoaded === true}`,
    `- Shell chrome: ${report.shell?.chromeSignals?.shellChrome === true}`,
    `- Benton county context: ${report.shell?.chromeSignals?.bentonCounty === true}`,
    `- Screenshot: ${report.screenshotPath ?? "not captured"}`,
    "",
    "## Identity And APIs",
    "",
    `- JWT email: ${report.login?.jwtIdentity?.email ?? "none"}`,
    `- JWT roles: ${report.login?.jwtIdentity?.roles?.join(", ") || "none"}`,
    `- JWT permissions: ${report.login?.jwtIdentity?.permissions?.join(", ") || "none"}`,
    `- JWT county FIPS: ${report.login?.jwtIdentity?.countyFipsCode ?? "none"}`,
    `- Operator identity recognized: ${report.operatorIdentityRecognized === true}`,
    `- Protected API succeeded: ${report.protectedApiSucceeded === true}`,
    `- Benton context / FIPS 53005 present: ${report.bentonCountyContextPresent === true}`,
    `- Profile API status: ${report.protectedApis?.profile?.status ?? "not attempted"}`,
    `- Profile identity recognized: ${report.protectedApis?.profile?.operatorIdentityRecognized === true}`,
    `- Profile user id: ${report.protectedApis?.profile?.userId ?? "none"}`,
    `- Profile roles: ${report.protectedApis?.profile?.roles?.join(", ") || "none"}`,
    `- Profile permissions: ${report.protectedApis?.profile?.permissions?.join(", ") || "none"}`,
    `- Profile county FIPS: ${report.protectedApis?.profile?.countyFipsCode ?? "none"}`,
    `- Profile state: ${report.protectedApis?.profile?.state ?? "none"}`,
    `- Profile session valid: ${report.protectedApis?.profile?.sessionValid === true}`,
    `- Benton parcels API status: ${report.protectedApis?.bentonParcels?.status ?? "not attempted"}`,
    `- Benton parcels rows returned: ${report.protectedApis?.bentonParcels?.rowsReturned ?? 0}`,
    "",
    "## Session Controls",
    "",
    `- Auth console/runtime errors: ${report.consoleAndRuntime?.authErrorCount ?? 0}`,
    `- Page errors: ${report.consoleAndRuntime?.pageErrorCount ?? 0}`,
    `- Logout control found: ${report.logout?.controlFound === true}`,
    `- Logout returned to login: ${report.logout?.redirectedToLogin === true}`,
    `- Invalid token returned to login: ${report.invalidToken?.redirectedToLogin === true}`,
    `- Invalid token protected API status: ${report.invalidToken?.status ?? "not attempted"}`,
    "",
    "## Auth Errors",
    "",
    ...((report.consoleAndRuntime?.authErrors ?? []).length
      ? report.consoleAndRuntime.authErrors.map((error) => `- ${error}`)
      : ["- None"]),
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
  const report = options.fixture
    ? buildFixtureReport(options.fixture, options.email ?? "june10-operator@terrafusionmarket.com")
    : await runJune10OperatorPostLoginSmoke(options);

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

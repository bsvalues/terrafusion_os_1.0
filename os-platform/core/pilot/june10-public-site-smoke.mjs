#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  "june10-public-site-smoke.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-site-smoke.latest.md"
);

const ROUTES = ["/", "/login", "/signup", "/marketplace"];
const API_PROBES = ["/api/health", "/api/auth/access-policy"];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function snippet(text, limit = 4000) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function hasAccessRequestLanguage(route) {
  return /request\s+(provisioned\s+)?access|access\s+request|contact\s+.*administrator|invite|issued\s+by\s+.*administrator/i.test(
    route?.bodyText ?? ""
  );
}

function hasDisabledSignupLanguage(route) {
  return /self-signup\s+is\s+disabled|public\s+self-signup\s+is\s+disabled|signup\s+disabled/i.test(route?.bodyText ?? "");
}

function hasLoginShellLanguage(route) {
  return /your\s+session\s+has\s+expired|provisioned\s+access\s+only|sign\s+in/i.test(route?.bodyText ?? "");
}

function hasMarketplaceLanguage(route) {
  return /marketplace\s+registry|governed\s+module|browse\s+.*module|module\s+catalog|marketplace/i.test(route?.bodyText ?? "");
}

function parseJsonProbe(probe) {
  if (!probe?.bodyText) return null;
  try {
    return JSON.parse(probe.bodyText);
  } catch {
    return null;
  }
}

function hasAccessRequestChannel(policy) {
  return Boolean(
    policy?.accessRequestUrl ||
      policy?.requestAccessUrl ||
      policy?.contactUrl ||
      policy?.supportEmail ||
      policy?.administratorEmail ||
      policy?.inviteUrl
  );
}

function addBlocker(blockers, source, message, evidence = null) {
  blockers.push({ source, message, evidence });
}

function addWarning(warnings, source, message, evidence = null) {
  warnings.push({ source, message, evidence });
}

async function fetchProbe(baseUrl, pathname, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${normalizeBaseUrl(baseUrl)}${pathname}`;

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "TerraFusion-June10-PublicSiteSmoke/1.0",
        connection: "close"
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bodyText = snippet(await response.text());

    return {
      path: pathname,
      url,
      status: response.status,
      contentType,
      bodyText,
      bodySnippet: bodyText.slice(0, 240),
      ok: response.status >= 200 && response.status < 400,
      error: null
    };
  } catch (error) {
    return {
      path: pathname,
      url,
      status: null,
      contentType: null,
      bodyText: "",
      bodySnippet: "",
      ok: false,
      error: error.name === "AbortError" ? `Timed out after ${timeoutMs}ms` : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function findPath(items, pathname) {
  return items.find((item) => item.path === pathname) ?? null;
}

export function buildJune10PublicSiteSmokeReport({ baseUrl, routes, apiProbes }) {
  const blockers = [];
  const warnings = [];
  const reachableRoutes = routes.filter((route) => route.ok).length;
  const apiAuthGated = apiProbes.filter((probe) => probe.status === 401 || probe.status === 403).length;

  for (const route of routes) {
    if (!route.ok) {
      addBlocker(blockers, "route_reachability", `${route.path} did not return a successful page response.`, route.error ?? `status=${route.status}`);
    }
  }

  const signup = findPath(routes, "/signup");
  const accessPolicyProbe = findPath(apiProbes, "/api/auth/access-policy");
  const accessPolicy = parseJsonProbe(accessPolicyProbe);

  if (
    accessPolicyProbe?.status === 200 &&
    accessPolicy?.publicSignupEnabled === false &&
    !hasAccessRequestChannel(accessPolicy)
  ) {
    addBlocker(
      blockers,
      "access_policy",
      "Public signup is disabled and no access-request channel is exposed by /api/auth/access-policy.",
      accessPolicyProbe.bodySnippet
    );
  }

  if (!signup) {
    addBlocker(blockers, "signup", "/signup was not probed.");
  } else if (!signup.ok) {
    addBlocker(blockers, "signup", "/signup is not reachable.", signup.error ?? `status=${signup.status}`);
  } else if (hasDisabledSignupLanguage(signup) && !hasAccessRequestLanguage(signup)) {
    addBlocker(
      blockers,
      "signup",
      "/signup is a disabled self-signup dead end with no usable access-request path.",
      signup.bodySnippet
    );
  } else if (hasLoginShellLanguage(signup) && !hasAccessRequestLanguage(signup)) {
    addBlocker(blockers, "signup", "/signup renders a login/session shell instead of signup or access request.", signup.bodySnippet);
  }

  const marketplace = findPath(routes, "/marketplace");
  if (!marketplace) {
    addBlocker(blockers, "marketplace", "/marketplace was not probed.");
  } else if (!marketplace.ok) {
    addBlocker(blockers, "marketplace", "/marketplace is not reachable.", marketplace.error ?? `status=${marketplace.status}`);
  } else if (hasLoginShellLanguage(marketplace) && !hasMarketplaceLanguage(marketplace)) {
    addBlocker(blockers, "marketplace", "/marketplace renders login/session shell instead of public marketplace content.", marketplace.bodySnippet);
  }

  for (const probe of apiProbes) {
    if (probe.status === null || probe.status >= 500) {
      addBlocker(blockers, "api_probe", `${probe.path} failed public smoke probing.`, probe.error ?? `status=${probe.status}`);
    } else if (probe.status === 401 || probe.status === 403) {
      addWarning(warnings, "api_auth", `${probe.path} is auth-gated on the public site.`, `status=${probe.status}`);
    }
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    baseUrl,
    passed: blockers.length === 0,
    summary: {
      routesChecked: routes.length,
      reachableRoutes,
      apiProbesChecked: apiProbes.length,
      apiAuthGated,
      blockers: blockers.length,
      warnings: warnings.length
    },
    routes,
    apiProbes,
    blockers,
    warnings,
    interpretation:
      blockers.length === 0
        ? "Public site smoke passed for launch-control evidence."
        : "Public site is not production-usable as a public entry point until blockers clear."
  };
}

export async function probeJune10PublicSite({ baseUrl = DEFAULT_BASE_URL, timeoutMs = 10000 } = {}) {
  const routes = [];
  for (const route of ROUTES) {
    routes.push(await fetchProbe(baseUrl, route, timeoutMs));
  }

  const apiProbes = [];
  for (const probe of API_PROBES) {
    apiProbes.push(await fetchProbe(baseUrl, probe, timeoutMs));
  }

  return buildJune10PublicSiteSmokeReport({ baseUrl: normalizeBaseUrl(baseUrl), routes, apiProbes });
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Public Site Smoke",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Base URL: ${report.baseUrl}`,
    `Passed: ${report.passed}`,
    "",
    "## Summary",
    "",
    `- Routes checked: ${report.summary.routesChecked}`,
    `- Reachable routes: ${report.summary.reachableRoutes}`,
    `- API probes checked: ${report.summary.apiProbesChecked}`,
    `- Auth-gated API probes: ${report.summary.apiAuthGated}`,
    `- Blockers: ${report.summary.blockers}`,
    `- Warnings: ${report.summary.warnings}`,
    "",
    "## Route Probes",
    "",
    "| Path | Status | OK | Evidence |",
    "|---|---:|---:|---|"
  ];

  for (const route of report.routes) {
    lines.push([route.path, route.status ?? "error", route.ok, (route.error ?? route.bodySnippet) || "-"].join(" | "));
  }

  lines.push("", "## API Probes", "", "| Path | Status | OK | Evidence |", "|---|---:|---:|---|");
  for (const probe of report.apiProbes) {
    lines.push([probe.path, probe.status ?? "error", probe.ok, (probe.error ?? probe.bodySnippet) || "-"].join(" | "));
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((blocker) => lines.push(`- **${blocker.source}**: ${blocker.message}${blocker.evidence ? ` (${blocker.evidence})` : ""}`));

  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) lines.push("- None");
  else report.warnings.forEach((warning) => lines.push(`- **${warning.source}**: ${warning.message}${warning.evidence ? ` (${warning.evidence})` : ""}`));

  lines.push("", "## Interpretation", "", report.interpretation);

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.TF_PUBLIC_SITE_BASE_URL ?? DEFAULT_BASE_URL,
    timeoutMs: Number.parseInt(process.env.TF_PUBLIC_SITE_TIMEOUT_MS ?? "10000", 10),
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") args.baseUrl = argv[++i];
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++i], 10);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = await probeJune10PublicSite({ baseUrl: args.baseUrl, timeoutMs: args.timeoutMs });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        blockers: report.summary.blockers,
        warnings: report.summary.warnings,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main()
    .then(() => {})
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

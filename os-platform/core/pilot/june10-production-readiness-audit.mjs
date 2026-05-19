#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_READINESS = path.join(repoRoot, "generated", "truth", "june10-readiness-packet.json");
const DEFAULT_RED_TEAM = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-red-team.latest.json");
const DEFAULT_PRODUCT_LOAD_LEDGER = path.join(repoRoot, "generated", "truth", "terrafusion-db-product-load-ledger.json");
const DEFAULT_RUNTIME_DB_IDENTITY = path.join(repoRoot, "generated", "truth", "runtime-db-identity.json");
const DEFAULT_PUBLIC_SITE = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-public-site-smoke.latest.json");
const DEFAULT_ENDPOINT_CONTRACT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-endpoint-contract-smoke.latest.json"
);
const DEFAULT_RUST = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-rust-runtime-usage.latest.json");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-readiness-audit.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-readiness-audit.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!filePath || !fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function addBlocker(blockers, source, severity, message, evidence = null) {
  blockers.push({ source, severity, message, evidence });
}

function addWarning(warnings, source, message, evidence = null) {
  warnings.push({ source, message, evidence });
}

function routeByPath(publicSite, routePath) {
  return (publicSite?.routes ?? []).find((route) => route.path === routePath) ?? null;
}

function hasAccessRequestLanguage(route) {
  return /request\s+(provisioned\s+)?access|contact\s+.*administrator|invite/i.test(route?.bodyText ?? "");
}

function hasSignupDeadEndLanguage(route) {
  return /self-signup\s+is\s+disabled|session\s+has\s+expired|sign\s+in/i.test(route?.bodyText ?? "");
}

function failedRuntimeProbes(endpointContract) {
  return (endpointContract?.localRuntimeProbes ?? []).filter((probe) => probe.status !== 200);
}

function runtimeIdentityDetails(runtimeDbIdentity) {
  return runtimeDbIdentity?.identity ?? runtimeDbIdentity ?? {};
}

function rustDeploymentUnproven(rust) {
  if (!rust) return true;
  const crates = rust.crates ?? [];
  const integrations = rust.runtimeIntegrations ?? [];
  if (crates.length === 0) return false;
  if (integrations.length === 0) return true;
  return integrations.some((integration) => integration.liveProven !== true);
}

function verdictFor(blockers, warnings) {
  if (blockers.length > 0) return "not_ready";
  if (warnings.length > 0) return "partially_ready";
  return "fully_ready";
}

export function buildJune10ProductionReadinessAudit({
  readiness,
  redTeam,
  productLoadLedger,
  runtimeDbIdentity,
  publicSite,
  endpointContract,
  rust
}) {
  const blockers = [];
  const warnings = [];

  if (!readiness) {
    addBlocker(blockers, "readiness", "CRITICAL", "June 10 readiness packet is missing.");
  } else if (readiness.status !== "PASS") {
    addBlocker(
      blockers,
      "readiness",
      "CRITICAL",
      "June 10 readiness packet is not passing.",
      `status=${readiness.status}; shipBlockers=${readiness.shipBlockers?.length ?? 0}; warnings=${readiness.warnings?.length ?? 0}`
    );
  }

  if (!redTeam) {
    addBlocker(blockers, "red_team", "CRITICAL", "June 10 red-team report is missing.");
  } else if (redTeam.verdict === "RED") {
    addBlocker(
      blockers,
      "red_team",
      "CRITICAL",
      "June 10 red-team verdict is RED.",
      `criticalAttacks=${redTeam.summary?.criticalAttacks ?? "unknown"}; shipBlockers=${redTeam.summary?.shipBlockers ?? "unknown"}`
    );
  } else if (redTeam.verdict !== "GREEN") {
    addWarning(warnings, "red_team", "June 10 red-team verdict is not green.", `verdict=${redTeam.verdict}`);
  }

  if (!productLoadLedger) {
    addBlocker(blockers, "product_load_lineage", "CRITICAL", "TerraFusion DB product-load ledger is missing.");
  } else if (productLoadLedger.passed !== true || productLoadLedger.summary?.lineageProven === 0) {
    addBlocker(
      blockers,
      "product_load_lineage",
      "CRITICAL",
      "TerraFusion DB product-load lineage is not proven.",
      `passed=${productLoadLedger.passed}; lineageProven=${productLoadLedger.summary?.lineageProven ?? "unknown"}; rowsExistLineageUnproven=${productLoadLedger.summary?.rowsExistLineageUnproven ?? "unknown"}`
    );
  }

  if (!runtimeDbIdentity) {
    addBlocker(blockers, "runtime_db_identity", "CRITICAL", "Runtime TerraFusion DB identity evidence is missing.");
  } else if (runtimeDbIdentity.passed !== true) {
    const identity = runtimeIdentityDetails(runtimeDbIdentity);
    addBlocker(
      blockers,
      "runtime_db_identity",
      "CRITICAL",
      "Runtime TerraFusion DB identity did not pass.",
      `apiBaseUrl=${identity.apiBaseUrl ?? runtimeDbIdentity.runtimeBaseUrl ?? "unknown"}; database=${identity.database ?? "unknown"}`
    );
  }

  if (!publicSite) {
    addBlocker(blockers, "public_site", "HIGH", "terrafusionmarket.com public-site smoke evidence is missing.");
  } else if (typeof publicSite.passed === "boolean") {
    if (publicSite.passed !== true) {
      addBlocker(
        blockers,
        "public_site",
        "HIGH",
        "terrafusionmarket.com public-site smoke is not passing.",
        (publicSite.blockers ?? []).map((blocker) => `${blocker.source}: ${blocker.message}`).join("; ") ||
          `blockers=${publicSite.summary?.blockers ?? "unknown"}`
      );
    }

    if ((publicSite.warnings ?? []).length > 0) {
      addWarning(
        warnings,
        "public_site",
        "terrafusionmarket.com public-site smoke has warnings.",
        `${publicSite.warnings.length} warning(s)`
      );
    }
  } else {
    const signup = routeByPath(publicSite, "/signup");
    if (!signup || signup.status !== 200 || (hasSignupDeadEndLanguage(signup) && !hasAccessRequestLanguage(signup))) {
      addBlocker(
        blockers,
        "public_site_signup",
        "HIGH",
        "terrafusionmarket.com signup is not a usable signup or access-request flow.",
        `status=${signup?.status ?? "missing"}; screenshot=${signup?.screenshotPath ?? "missing"}`
      );
    }
  }

  if (!endpointContract) {
    addBlocker(blockers, "endpoint_contract", "HIGH", "Endpoint contract smoke evidence is missing.");
  } else {
    const failedProbes = failedRuntimeProbes(endpointContract);
    if (failedProbes.length > 0) {
      addBlocker(
        blockers,
        "runtime_endpoint",
        "HIGH",
        "One or more runtime endpoint probes failed.",
        failedProbes.map((probe) => `${probe.url}:${probe.status ?? probe.error ?? "failed"}`).join("; ")
      );
    }

    if ((endpointContract.contractMismatches ?? []).length > 0) {
      addBlocker(
        blockers,
        "contract_mismatch",
        "HIGH",
        "Frontend/backend endpoint contracts are not fully proven.",
        `${endpointContract.contractMismatches.length} contract mismatch(es)`
      );
    }
  }

  if (!rust) {
    addWarning(warnings, "rust_runtime", "Rust runtime usage evidence is missing.");
  } else {
    if ((rust.normalWorkflowStubs ?? []).length > 0) {
      addBlocker(
        blockers,
        "rust_runtime",
        "HIGH",
        "Normal valuation workflow still contains pending or stubbed Rust-adjacent paths.",
        `${rust.normalWorkflowStubs.length} stubbed workflow endpoint(s)`
      );
    }

    if (rustDeploymentUnproven(rust)) {
      addWarning(
        warnings,
        "rust_runtime",
        "Rust engines exist, but live production runtime use is not proven.",
        `crates=${rust.crates?.length ?? 0}; integrations=${rust.runtimeIntegrations?.length ?? 0}`
      );
    }
  }

  const verdict = verdictFor(blockers, warnings);
  const identity = runtimeIdentityDetails(runtimeDbIdentity);

  return {
    generatedAtUtc: new Date().toISOString(),
    verdict,
    summary: {
      shipBlockers: blockers.length,
      warnings: warnings.length,
      readinessStatus: readiness?.status ?? "missing",
      redTeamVerdict: redTeam?.verdict ?? "missing",
      productLoadLedgerPassed: productLoadLedger?.passed ?? null,
      lineageProven: productLoadLedger?.summary?.lineageProven ?? null,
      runtimeDbIdentityPassed: runtimeDbIdentity?.passed ?? null,
      runtimeApiBaseUrl: identity.apiBaseUrl ?? runtimeDbIdentity?.runtimeBaseUrl ?? null,
      runtimeDatabase: identity.database ?? null,
      publicSiteBaseUrl: publicSite?.baseUrl ?? null,
      failedRuntimeProbes: endpointContract ? failedRuntimeProbes(endpointContract).length : null,
      contractMismatches: endpointContract?.contractMismatches?.length ?? null,
      rustCrates: rust?.crates?.length ?? null,
      rustRuntimeIntegrations: rust?.runtimeIntegrations?.length ?? null
    },
    blockers,
    warnings,
    requiredFixOrder: [
      "Make readiness:june10 and truth:june10-readiness-packet pass with zero ship blockers.",
      "Emit TerraFusion DB product-load receipts and prove lineage for runtime truth tables.",
      "Restore live runtime endpoint probes for the expected API base URLs.",
      "Fix terrafusionmarket.com public access posture: usable signup/access request or remove misleading signup route.",
      "Resolve frontend/backend endpoint contract mismatches.",
      "Prove Rust engine deployment in the live runtime path or remove Rust from launch claims.",
      "Re-run this production readiness audit and keep the verdict below full readiness until all blockers clear."
    ],
    bannedProductionClaimsWhileBlocked: [
      "fully production ready",
      "all endpoints are live",
      "all data flows end to end",
      "terrafusionmarket.com is publicly usable",
      "39 counties are runtime-ready",
      "Rust engines are in production use",
      "TerraFusion DB rows are lineage-proven"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Production Readiness Audit",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: ${report.verdict}`,
    "",
    "## Summary",
    "",
    `- Ship blockers: ${report.summary.shipBlockers}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Readiness status: ${report.summary.readinessStatus}`,
    `- Red-team verdict: ${report.summary.redTeamVerdict}`,
    `- Product-load ledger passed: ${report.summary.productLoadLedgerPassed ?? "missing"}`,
    `- Lineage-proven tables: ${report.summary.lineageProven ?? "missing"}`,
    `- Runtime DB identity passed: ${report.summary.runtimeDbIdentityPassed ?? "missing"}`,
    `- Runtime API base URL: ${report.summary.runtimeApiBaseUrl ?? "missing"}`,
    `- Runtime database: ${report.summary.runtimeDatabase ?? "missing"}`,
    `- Public site: ${report.summary.publicSiteBaseUrl ?? "missing"}`,
    `- Failed runtime probes: ${report.summary.failedRuntimeProbes ?? "missing"}`,
    `- Contract mismatches: ${report.summary.contractMismatches ?? "missing"}`,
    `- Rust crates: ${report.summary.rustCrates ?? "missing"}`,
    `- Rust runtime integrations: ${report.summary.rustRuntimeIntegrations ?? "missing"}`,
    "",
    "## Ship Blockers",
    ""
  ];

  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    for (const blocker of report.blockers) {
      lines.push(`- **${blocker.severity} ${blocker.source}**: ${blocker.message}${blocker.evidence ? ` (${blocker.evidence})` : ""}`);
    }
  }

  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) {
    lines.push("- None");
  } else {
    for (const warning of report.warnings) {
      lines.push(`- **${warning.source}**: ${warning.message}${warning.evidence ? ` (${warning.evidence})` : ""}`);
    }
  }

  lines.push("", "## Required Fix Order", "");
  report.requiredFixOrder.forEach((item, index) => lines.push(`${index + 1}. ${item}`));

  lines.push("", "## Banned Production Claims While Blocked", "");
  report.bannedProductionClaimsWhileBlocked.forEach((claim) => lines.push(`- ${claim}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readinessPath: DEFAULT_READINESS,
    redTeamPath: DEFAULT_RED_TEAM,
    productLoadLedgerPath: DEFAULT_PRODUCT_LOAD_LEDGER,
    runtimeDbIdentityPath: DEFAULT_RUNTIME_DB_IDENTITY,
    publicSitePath: DEFAULT_PUBLIC_SITE,
    endpointContractPath: DEFAULT_ENDPOINT_CONTRACT,
    rustPath: DEFAULT_RUST,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readinessPath = path.resolve(argv[++i]);
    else if (arg === "--red-team") args.redTeamPath = path.resolve(argv[++i]);
    else if (arg === "--product-load-ledger") args.productLoadLedgerPath = path.resolve(argv[++i]);
    else if (arg === "--runtime-db-identity") args.runtimeDbIdentityPath = path.resolve(argv[++i]);
    else if (arg === "--public-site") args.publicSitePath = path.resolve(argv[++i]);
    else if (arg === "--endpoint-contract") args.endpointContractPath = path.resolve(argv[++i]);
    else if (arg === "--rust") args.rustPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10ProductionReadinessAudit({
    readiness: readJson(args.readinessPath, null),
    redTeam: readJson(args.redTeamPath, null),
    productLoadLedger: readJson(args.productLoadLedgerPath, null),
    runtimeDbIdentity: readJson(args.runtimeDbIdentityPath, null),
    publicSite: readJson(args.publicSitePath, null),
    endpointContract: readJson(args.endpointContractPath, null),
    rust: readJson(args.rustPath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        shipBlockers: report.summary.shipBlockers,
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
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

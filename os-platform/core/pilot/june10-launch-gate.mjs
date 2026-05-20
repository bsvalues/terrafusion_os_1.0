#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { probeJune10EndpointContracts } from "./june10-endpoint-contract-smoke.mjs";
import { probeJune10PublicSite } from "./june10-public-site-smoke.mjs";
import { inspectJune10RustRuntimeUsage } from "./june10-rust-runtime-usage.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_API_BASE_URL = "http://localhost:5046";
const DEFAULT_PUBLIC_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_PRODUCT_LOAD_LEDGER = path.join(
  repoRoot,
  "generated",
  "truth",
  "terrafusion-db-product-load-ledger.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-gate.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-gate.latest.md"
);

const ACTIVE_RUNTIME_ROOTS = [
  "backend/src/TerraFusion.API/Program.cs",
  "backend/src/TerraFusion.API/Controllers",
  "backend/src/TerraFusion.API/Services",
  "frontend/apps/os-shell/src"
];

const ALLOWED_LEGACY_PATH_RE =
  /(^|\/)(Sync|Admin|Proof|HealthProof|RuntimeTruth|SourceLineage|PacsOps|FullCorpus|OwnerWsdor|LegacySource)[^/]*\.(cs|ts|tsx|js|jsx)$|(^|\/)(tests?|__tests__|evidence|docs|ARCHIVE|archive|QUARANTINE)(\/|$)/i;
const ACTIVE_LEGACY_TERM_RE = /\b(PACS|Harris|pacs_oltp|PACS_Training|Pacmls|tf-mssql|SqlConnection|OdbcConnection)\b/i;
const TEXT_FILE_RE = /\.(cs|ts|tsx|js|jsx|mjs|json)$/i;

function normalizePath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function rel(root, filePath) {
  return normalizePath(path.relative(root, filePath));
}

function relDefault(filePath) {
  return rel(repoRoot, filePath);
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function readJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function walk(target, results = []) {
  if (!fs.existsSync(target)) return results;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    results.push(target);
    return results;
  }
  if (!stat.isDirectory()) return results;

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if ([".git", "node_modules", "bin", "obj", "dist", "build", "target"].includes(entry.name)) continue;
    walk(path.join(target, entry.name), results);
  }
  return results;
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

function warning(source, message, evidence = null) {
  return { source, message, evidence };
}

function findHealthProbe(endpointSmoke) {
  return endpointSmoke?.localRuntimeProbes?.find((probe) => probe.id === "health" || probe.path === "/health") ?? null;
}

function isProductLoadLedgerPassing(productLoadLedger) {
  if (!productLoadLedger) return false;
  if (productLoadLedger.passed === false) return false;
  if (productLoadLedger.receiptEvidence?.exists !== true) return false;
  return Number(productLoadLedger.summary?.lineageProven ?? 0) > 0 && Number(productLoadLedger.summary?.blockers ?? 0) === 0;
}

function rustRuntimeProven(rustRuntimeUsage) {
  return Boolean(
    rustRuntimeUsage?.passed === true &&
      Number(rustRuntimeUsage?.summary?.runtimeIntegrations ?? 0) > 0 &&
      Number(rustRuntimeUsage?.summary?.liveProvenRuntimeIntegrations ?? 0) === Number(rustRuntimeUsage?.summary?.runtimeIntegrations ?? -1) &&
      Number(rustRuntimeUsage?.summary?.missingBinaries ?? 0) === 0
  );
}

function allowedLegacyPath(relativePath) {
  return ALLOWED_LEGACY_PATH_RE.test(relativePath);
}

function activeRuntimeFiles(root) {
  const files = [];
  for (const relativeRoot of ACTIVE_RUNTIME_ROOTS) {
    const fullPath = path.join(root, ...relativeRoot.split("/"));
    files.push(...walk(fullPath));
  }

  return [...new Set(files)].filter((filePath) => TEXT_FILE_RE.test(filePath));
}

export function inspectActiveRuntimeLegacyLeaks({ repoRoot: root = repoRoot } = {}) {
  const absoluteRoot = path.resolve(root);
  const leaks = [];

  for (const filePath of activeRuntimeFiles(absoluteRoot)) {
    const relativePath = rel(absoluteRoot, filePath);
    const allowed = allowedLegacyPath(relativePath);
    const lines = safeRead(filePath).split(/\r?\n/);

    lines.forEach((line, index) => {
      const match = line.match(ACTIVE_LEGACY_TERM_RE);
      if (!match || allowed) return;
      leaks.push({
        filePath: relativePath,
        lineNumber: index + 1,
        term: match[1],
        allowed,
        line: line.trim().slice(0, 240),
        classification: "active_product_runtime_legacy_reference"
      });
    });
  }

  return leaks;
}

export function buildJune10LaunchGateReport({
  apiBaseUrl,
  publicBaseUrl,
  endpointSmoke,
  publicSiteSmoke,
  productLoadLedger,
  productLoadLedgerPath = DEFAULT_PRODUCT_LOAD_LEDGER,
  rustRuntimeUsage,
  rustClaimsSuppressed = false,
  activeRuntimeLegacyLeaks = []
}) {
  const blockers = [];
  const warnings = [];
  const healthProbe = findHealthProbe(endpointSmoke);
  const apiHealthLive = Boolean(healthProbe?.status === 200 && healthProbe?.ok !== false && !healthProbe?.error);
  const endpointSmokePassed = endpointSmoke?.passed === true;
  const publicAccessPostureExplicit = publicSiteSmoke?.passed === true;
  const productLoadLedgerPassed = isProductLoadLedgerPassing(productLoadLedger);
  const rustProven = rustRuntimeProven(rustRuntimeUsage);
  const rustPostureAccepted = rustProven || rustClaimsSuppressed;
  const activeRuntimeLegacyLeakCount = activeRuntimeLegacyLeaks.length;

  if (!apiHealthLive) {
    blockers.push(
      blocker(
        "api_health",
        "API health is not live now. Stale readiness evidence is not accepted.",
        healthProbe?.error ?? `status=${healthProbe?.status ?? "missing"}`
      )
    );
  }

  if (!endpointSmokePassed) {
    blockers.push(
      blocker(
        "endpoint_smoke",
        "Endpoint contract smoke did not pass from live probes.",
        `${endpointSmoke?.summary?.failedRuntimeProbes ?? "unknown"} failed probe(s), ${endpointSmoke?.summary?.contractMismatches ?? "unknown"} contract mismatch(es)`
      )
    );
  }

  if (!publicAccessPostureExplicit) {
    blockers.push(
      blocker(
        "public_access_posture",
        "Public access posture is not explicit and usable for launch-control evidence.",
        `${publicSiteSmoke?.summary?.blockers ?? "unknown"} blocker(s)`
      )
    );
  }

  if (!productLoadLedger) {
    blockers.push(
      blocker(
        "product_load_ledger",
        "TerraFusion DB product-load ledger artifact is missing or unreadable.",
        productLoadLedgerPath
      )
    );
  } else if (!productLoadLedgerPassed) {
    blockers.push(
      blocker(
        "product_load_ledger",
        "Product-load lineage is not proven by the TerraFusion DB ledger.",
        `${productLoadLedger.summary?.lineageProven ?? 0} lineage-proven table(s), ${productLoadLedger.summary?.blockers ?? "unknown"} blocker(s)`
      )
    );
  }

  if (!rustPostureAccepted) {
    blockers.push(
      blocker(
        "rust_runtime",
        "Rust runtime execution is not proven and Rust launch claims are not explicitly suppressed.",
        `${rustRuntimeUsage?.summary?.liveProvenRuntimeIntegrations ?? 0}/${rustRuntimeUsage?.summary?.runtimeIntegrations ?? 0} runtime integration(s) live-proven`
      )
    );
  } else if (!rustProven && rustClaimsSuppressed) {
    warnings.push(
      warning(
        "rust_runtime",
        "Rust integration seams exist but launch claims are suppressed because live runtime execution is not proven."
      )
    );
  }

  if (activeRuntimeLegacyLeakCount > 0) {
    blockers.push(
      blocker(
        "legacy_runtime_boundary",
        "Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes.",
        `${activeRuntimeLegacyLeakCount} leak(s)`
      )
    );
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    gate: "june10_launch_gate",
    apiBaseUrl,
    publicBaseUrl,
    passed: blockers.length === 0,
    summary: {
      apiHealthLive,
      endpointSmokePassed,
      publicAccessPostureExplicit,
      productLoadLedgerPassed,
      rustRuntimeProven: rustProven,
      rustClaimsSuppressed,
      activeRuntimeLegacyLeaks: activeRuntimeLegacyLeakCount,
      blockers: blockers.length,
      warnings: warnings.length
    },
    checks: {
      endpointSmoke: {
        passed: endpointSmoke?.passed === true,
        failedRuntimeProbes: endpointSmoke?.summary?.failedRuntimeProbes ?? null,
        contractMismatches: endpointSmoke?.summary?.contractMismatches ?? null,
        blockers: endpointSmoke?.summary?.blockers ?? null
      },
      publicSiteSmoke: {
        passed: publicSiteSmoke?.passed === true,
        blockers: publicSiteSmoke?.summary?.blockers ?? null,
        warnings: publicSiteSmoke?.summary?.warnings ?? null
      },
      productLoadLedger: {
        path: productLoadLedgerPath,
        passed: productLoadLedgerPassed,
        receiptTableExists: productLoadLedger?.receiptEvidence?.exists ?? null,
        lineageProven: productLoadLedger?.summary?.lineageProven ?? null,
        blockers: productLoadLedger?.summary?.blockers ?? null
      },
      rustRuntimeUsage: {
        passed: rustRuntimeUsage?.passed === true,
        runtimeIntegrations: rustRuntimeUsage?.summary?.runtimeIntegrations ?? null,
        liveProvenRuntimeIntegrations: rustRuntimeUsage?.summary?.liveProvenRuntimeIntegrations ?? null,
        missingBinaries: rustRuntimeUsage?.summary?.missingBinaries ?? null,
        claimsSuppressed: rustClaimsSuppressed
      },
      legacyRuntimeBoundary: {
        allowedLanePolicy: "Sync/admin/proof lanes may retain legacy-source terms; active product runtime may not.",
        leaks: activeRuntimeLegacyLeaks
      }
    },
    blockers,
    warnings,
    requiredFixes: blockers.map((item) => item.message),
    interpretation:
      blockers.length === 0
        ? "June 10 launch gate passed from live runtime evidence and explicit containment posture."
        : "June 10 launch gate is red. Production approval must not rely on stale evidence, unproven lineage, unsuppressed Rust claims, or active runtime legacy leaks."
  };
}

export async function probeJune10LaunchGate({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publicBaseUrl = DEFAULT_PUBLIC_BASE_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  repoRoot: root = repoRoot,
  productLoadLedgerPath = DEFAULT_PRODUCT_LOAD_LEDGER,
  rustClaimsSuppressed = process.env.TF_JUNE10_SUPPRESS_RUST_RUNTIME_CLAIMS === "1"
} = {}) {
  const endpointSmoke = await probeJune10EndpointContracts({ apiBaseUrl, timeoutMs });
  const publicSiteSmoke = await probeJune10PublicSite({ baseUrl: publicBaseUrl, timeoutMs });
  const productLoadLedger = readJson(productLoadLedgerPath);
  const rustRuntimeUsage = inspectJune10RustRuntimeUsage({ repoRoot: root });
  const activeRuntimeLegacyLeaks = inspectActiveRuntimeLegacyLeaks({ repoRoot: root });

  return buildJune10LaunchGateReport({
    apiBaseUrl,
    publicBaseUrl,
    endpointSmoke,
    publicSiteSmoke,
    productLoadLedger,
    productLoadLedgerPath,
    rustRuntimeUsage,
    rustClaimsSuppressed,
    activeRuntimeLegacyLeaks
  });
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Launch Gate",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Passed: ${report.passed}`,
    `API base URL: ${report.apiBaseUrl}`,
    `Public base URL: ${report.publicBaseUrl}`,
    "",
    "## Summary",
    "",
    `- API health live now: ${report.summary.apiHealthLive}`,
    `- Endpoint smoke passed live now: ${report.summary.endpointSmokePassed}`,
    `- Public access posture explicit: ${report.summary.publicAccessPostureExplicit}`,
    `- Product-load ledger passed: ${report.summary.productLoadLedgerPassed}`,
    `- Rust runtime proven: ${report.summary.rustRuntimeProven}`,
    `- Rust claims suppressed: ${report.summary.rustClaimsSuppressed}`,
    `- Active runtime legacy leaks: ${report.summary.activeRuntimeLegacyLeaks}`,
    `- Blockers: ${report.summary.blockers}`,
    `- Warnings: ${report.summary.warnings}`,
    "",
    "## Blockers",
    ""
  ];

  if (report.blockers.length === 0) lines.push("- None");
  else {
    report.blockers.forEach((item) => {
      lines.push(`- **${item.source}**: ${item.message}${item.evidence ? ` (${item.evidence})` : ""}`);
    });
  }

  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) lines.push("- None");
  else {
    report.warnings.forEach((item) => {
      lines.push(`- **${item.source}**: ${item.message}${item.evidence ? ` (${item.evidence})` : ""}`);
    });
  }

  lines.push("", "## Active Runtime Legacy Leaks", "");
  if (report.checks.legacyRuntimeBoundary.leaks.length === 0) lines.push("- None");
  else {
    lines.push("| File | Line | Term | Evidence |", "|---|---:|---|---|");
    for (const leak of report.checks.legacyRuntimeBoundary.leaks) {
      lines.push(`| \`${leak.filePath}\` | ${leak.lineNumber} | ${leak.term} | ${leak.line.replaceAll("|", "\\|")} |`);
    }
  }

  lines.push("", "## Required Fixes", "");
  if (report.requiredFixes.length === 0) lines.push("- None");
  else report.requiredFixes.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Interpretation", "", report.interpretation);

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    apiBaseUrl: process.env.TF_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    publicBaseUrl: process.env.TF_PUBLIC_SITE_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL,
    timeoutMs: Number.parseInt(process.env.TF_JUNE10_LAUNCH_GATE_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS), 10),
    repoRoot: process.env.TF_REPO_ROOT ?? repoRoot,
    productLoadLedgerPath: process.env.TF_PRODUCT_LOAD_LEDGER_PATH ?? DEFAULT_PRODUCT_LOAD_LEDGER,
    rustClaimsSuppressed: process.env.TF_JUNE10_SUPPRESS_RUST_RUNTIME_CLAIMS === "1",
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--api-base-url") args.apiBaseUrl = argv[++i];
    else if (arg === "--public-base-url") args.publicBaseUrl = argv[++i];
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++i], 10);
    else if (arg === "--repo-root") args.repoRoot = path.resolve(argv[++i]);
    else if (arg === "--product-load-ledger") args.productLoadLedgerPath = path.resolve(argv[++i]);
    else if (arg === "--suppress-rust-claims") args.rustClaimsSuppressed = true;
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = await probeJune10LaunchGate({
    apiBaseUrl: args.apiBaseUrl,
    publicBaseUrl: args.publicBaseUrl,
    timeoutMs: args.timeoutMs,
    repoRoot: args.repoRoot,
    productLoadLedgerPath: args.productLoadLedgerPath,
    rustClaimsSuppressed: args.rustClaimsSuppressed
  });

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
        apiHealthLive: report.summary.apiHealthLive,
        endpointSmokePassed: report.summary.endpointSmokePassed,
        publicAccessPostureExplicit: report.summary.publicAccessPostureExplicit,
        productLoadLedgerPassed: report.summary.productLoadLedgerPassed,
        rustRuntimeProven: report.summary.rustRuntimeProven,
        rustClaimsSuppressed: report.summary.rustClaimsSuppressed,
        activeRuntimeLegacyLeaks: report.summary.activeRuntimeLegacyLeaks,
        output: relDefault(args.outJson)
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main()
    .then((report) => {
      if (!report.passed) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

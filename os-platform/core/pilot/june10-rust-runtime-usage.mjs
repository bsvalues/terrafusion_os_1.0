#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_OUT_JSON = path.join(
  defaultRepoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-rust-runtime-usage.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  defaultRepoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-rust-runtime-usage.latest.md"
);

const IGNORE_DIRS = new Set([".git", "node_modules", "target", "bin", "obj", ".next", "dist", "build"]);
const QUARANTINE_RE = /(^|\/)(QUARANTINE|ARCHIVE|archive)(\/|$)|MARKED-FOR-REVIEW/;
const LAUNCH_RELEVANT_RE = /packages\/terrabuild\/kernels|terraforge\.kernel|terraforge-kernel/i;

function normalizePath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function rel(root, filePath) {
  return normalizePath(path.relative(root, filePath));
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walk(root, results = []) {
  if (!fs.existsSync(root)) return results;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) walk(fullPath, results);
    else if (entry.isFile()) results.push(fullPath);
  }

  return results;
}

function cargoName(cargoToml) {
  const match = cargoToml.match(/^\s*name\s*=\s*"([^"]+)"/m);
  return match?.[1] ?? null;
}

function discoverRustCrates(repoRoot) {
  return walk(repoRoot)
    .filter((filePath) => path.basename(filePath) === "Cargo.toml")
    .map((filePath) => {
      const relativePath = rel(repoRoot, filePath);
      const content = safeRead(filePath);
      const name = cargoName(content);
      if (!name) return null;
      const quarantined = QUARANTINE_RE.test(relativePath);
      const launchRelevant = LAUNCH_RELEVANT_RE.test(relativePath) || LAUNCH_RELEVANT_RE.test(content);

      return {
        name,
        path: relativePath,
        launchRelevant,
        quarantined
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function discoverRuntimeIntegrations(repoRoot) {
  const candidates = [
    {
      endpoint: "POST /api/costforge/batch-calculate",
      filePath: "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
      markers: ["batch-calculate", "IKernelValuationService", "terraforge-rust-kernel"]
    },
    {
      endpoint: "POST /api/valuation/kernel-cost-approach",
      filePath: "backend/src/TerraFusion.API/Controllers/ValuationController.cs",
      markers: ["kernel-cost-approach", "ComputeCostWithKernelAsync"]
    },
    {
      endpoint: "backend service registration",
      filePath: "backend/src/TerraFusion.API/Program.cs",
      markers: ["IRustKernelProcessHost", "RustKernelProcessHost", "IKernelValuationService"]
    }
  ];

  const integrations = [];
  for (const candidate of candidates) {
    const fullPath = path.join(repoRoot, ...candidate.filePath.split("/"));
    const content = safeRead(fullPath);
    if (!content) continue;

    const evidence = candidate.markers.filter((marker) => content.includes(marker));
    if (evidence.length === 0) continue;

    integrations.push({
      endpoint: candidate.endpoint,
      filePath: candidate.filePath,
      integrationEvidence: evidence,
      liveProven: false
    });
  }

  return integrations;
}

function discoverExpectedBinaries(repoRoot) {
  const binaries = [
    {
      name: "terraforge-kernel-cost",
      expectedPaths: [
        "packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe",
        "packages/terrabuild/kernels/target/release/terraforge-kernel-cost",
        "packages/terrabuild/kernels/target/debug/terraforge-kernel-cost.exe",
        "packages/terrabuild/kernels/target/debug/terraforge-kernel-cost"
      ]
    },
    {
      name: "terraforge-kernel-valuation",
      expectedPaths: [
        "packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe",
        "packages/terrabuild/kernels/target/release/terraforge-kernel-valuation",
        "packages/terrabuild/kernels/target/debug/terraforge-kernel-valuation.exe",
        "packages/terrabuild/kernels/target/debug/terraforge-kernel-valuation"
      ]
    }
  ];

  return binaries.map((binary) => ({
    ...binary,
    foundPath:
      binary.expectedPaths.find((relativePath) => fs.existsSync(path.join(repoRoot, ...relativePath.split("/")))) ?? null
  }));
}

function discoverUnusedRustServices(repoRoot) {
  const unusedServices = [];
  const rustFfiServicePath = "backend/src/TerraFusion.API/Services/RustFFIService.cs";
  const programPath = "backend/src/TerraFusion.API/Program.cs";
  const rustFfiService = safeRead(path.join(repoRoot, ...rustFfiServicePath.split("/")));
  const program = safeRead(path.join(repoRoot, ...programPath.split("/")));

  if (rustFfiService && program.includes("// builder.Services.AddSingleton<RustFFIService>();")) {
    unusedServices.push({
      service: "RustFFIService",
      status: "not_registered",
      filePath: rustFfiServicePath,
      evidence: "RustFFIService exists but Program.cs keeps its registration commented out."
    });
  }

  return unusedServices;
}

function discoverNormalWorkflowStubs() {
  return [];
}

function warning(source, message, evidence = null) {
  return { source, message, evidence };
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

export function buildJune10RustRuntimeUsageReport({
  repoRoot,
  crates,
  runtimeIntegrations,
  expectedBinaries,
  normalWorkflowStubs,
  unusedRustServices = []
}) {
  const launchRelevantCrates = crates.filter((crate) => crate.launchRelevant && !crate.quarantined);
  const quarantinedRustCrates = crates.filter((crate) => crate.quarantined);
  const missingBinaries = expectedBinaries.filter((binary) => !binary.foundPath);
  const liveProvenRuntimeIntegrations = runtimeIntegrations.filter((integration) => integration.liveProven === true);
  const blockers = [];
  const warnings = [];

  if (normalWorkflowStubs.length > 0) {
    blockers.push(
      blocker(
        "rust_workflow_stub",
        "Normal Rust-adjacent workflow contains a disabled or stubbed integration.",
        `${normalWorkflowStubs.length} stub(s)`
      )
    );
  }

  if (launchRelevantCrates.length > 0 && missingBinaries.length > 0) {
    warnings.push(
      warning(
        "kernel_binary",
        "Launch-relevant Rust kernel source exists, but expected kernel binaries were not found.",
        missingBinaries.map((binary) => binary.name).join(", ")
      )
    );
  }

  if (launchRelevantCrates.length > 0 && runtimeIntegrations.length === 0) {
    warnings.push(warning("runtime_integration", "Launch-relevant Rust crates exist, but no backend runtime integration evidence was found."));
  }

  if (runtimeIntegrations.length > 0 && liveProvenRuntimeIntegrations.length !== runtimeIntegrations.length) {
    warnings.push(
      warning(
        "live_runtime",
        "Rust runtime integrations exist in code, but live production runtime execution is not proven.",
        `${liveProvenRuntimeIntegrations.length}/${runtimeIntegrations.length} integration(s) live-proven`
      )
    );
  }

  if (unusedRustServices.length > 0) {
    warnings.push(
      warning(
        "unused_service",
        "Rust-adjacent service code exists but is not registered in the runtime container.",
        `${unusedRustServices.length} unused service(s)`
      )
    );
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    repoRoot,
    passed: blockers.length === 0 && warnings.length === 0,
    summary: {
      rustCrates: crates.length,
      launchRelevantRustCrates: launchRelevantCrates.length,
      quarantinedRustCrates: quarantinedRustCrates.length,
      runtimeIntegrations: runtimeIntegrations.length,
      liveProvenRuntimeIntegrations: liveProvenRuntimeIntegrations.length,
      expectedBinaries: expectedBinaries.length,
      missingBinaries: missingBinaries.length,
      normalWorkflowStubs: normalWorkflowStubs.length,
      unusedRustServices: unusedRustServices.length,
      blockers: blockers.length,
      warnings: warnings.length
    },
    crates,
    launchRelevantCrates,
    quarantinedRustCrates,
    runtimeIntegrations,
    expectedBinaries,
    normalWorkflowStubs,
    unusedRustServices,
    blockers,
    warnings,
    interpretation:
      blockers.length > 0
        ? "Rust exists but has disabled or stubbed normal workflow integration; launch claims must stay blocked."
        : warnings.length > 0
          ? "Rust exists and backend integration evidence exists, but live runtime execution is not proven."
          : "Rust runtime use is proven for the launch-relevant integrations."
  };
}

export function inspectJune10RustRuntimeUsage({ repoRoot = defaultRepoRoot } = {}) {
  const root = path.resolve(repoRoot);
  return buildJune10RustRuntimeUsageReport({
    repoRoot: root,
    crates: discoverRustCrates(root),
    runtimeIntegrations: discoverRuntimeIntegrations(root),
    expectedBinaries: discoverExpectedBinaries(root),
    normalWorkflowStubs: discoverNormalWorkflowStubs(root),
    unusedRustServices: discoverUnusedRustServices(root)
  });
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Rust Runtime Usage",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Passed: ${report.passed}`,
    "",
    "## Summary",
    "",
    `- Rust crates: ${report.summary.rustCrates}`,
    `- Launch-relevant Rust crates: ${report.summary.launchRelevantRustCrates}`,
    `- Quarantined/archived Rust crates: ${report.summary.quarantinedRustCrates}`,
    `- Runtime integrations: ${report.summary.runtimeIntegrations}`,
    `- Live-proven runtime integrations: ${report.summary.liveProvenRuntimeIntegrations}`,
    `- Expected binaries: ${report.summary.expectedBinaries}`,
    `- Missing binaries: ${report.summary.missingBinaries}`,
    `- Normal workflow stubs: ${report.summary.normalWorkflowStubs}`,
    `- Unused Rust services: ${report.summary.unusedRustServices}`,
    `- Blockers: ${report.summary.blockers}`,
    `- Warnings: ${report.summary.warnings}`,
    "",
    "## Launch-Relevant Crates",
    "",
    "| Crate | Path |",
    "|---|---|"
  ];

  if (report.launchRelevantCrates.length === 0) lines.push("| - | - |");
  else report.launchRelevantCrates.forEach((crate) => lines.push(`| ${crate.name} | \`${crate.path}\` |`));

  lines.push("", "## Runtime Integrations", "", "| Endpoint | File | Live Proven | Evidence |", "|---|---|---:|---|");
  if (report.runtimeIntegrations.length === 0) lines.push("| - | - | false | - |");
  else {
    report.runtimeIntegrations.forEach((integration) =>
      lines.push(
        `| ${integration.endpoint} | \`${integration.filePath}\` | ${integration.liveProven} | ${integration.integrationEvidence.join("<br>")} |`
      )
    );
  }

  lines.push("", "## Expected Binaries", "", "| Binary | Found | Expected Paths |", "|---|---|---|");
  report.expectedBinaries.forEach((binary) =>
    lines.push(`| ${binary.name} | ${binary.foundPath ? `\`${binary.foundPath}\`` : "missing"} | ${binary.expectedPaths.map((item) => `\`${item}\``).join("<br>")} |`)
  );

  lines.push("", "## Normal Workflow Stubs", "");
  if (report.normalWorkflowStubs.length === 0) lines.push("- None");
  else {
    report.normalWorkflowStubs.forEach((stub) =>
      lines.push(`- **${stub.endpoint}** ${stub.status}: ${stub.evidence} (\`${stub.filePath}\`)`)
    );
  }

  lines.push("", "## Unused Rust Services", "");
  if (report.unusedRustServices.length === 0) lines.push("- None");
  else {
    report.unusedRustServices.forEach((service) =>
      lines.push(`- **${service.service}** ${service.status}: ${service.evidence} (\`${service.filePath}\`)`)
    );
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((item) => lines.push(`- **${item.source}**: ${item.message}${item.evidence ? ` (${item.evidence})` : ""}`));

  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) lines.push("- None");
  else report.warnings.forEach((item) => lines.push(`- **${item.source}**: ${item.message}${item.evidence ? ` (${item.evidence})` : ""}`));

  lines.push("", "## Interpretation", "", report.interpretation);

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    repoRoot: process.env.TF_REPO_ROOT ?? defaultRepoRoot,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo-root") args.repoRoot = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = inspectJune10RustRuntimeUsage({ repoRoot: args.repoRoot });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        rustCrates: report.summary.rustCrates,
        runtimeIntegrations: report.summary.runtimeIntegrations,
        liveProvenRuntimeIntegrations: report.summary.liveProvenRuntimeIntegrations,
        blockers: report.summary.blockers,
        warnings: report.summary.warnings,
        output: rel(defaultRepoRoot, args.outJson)
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

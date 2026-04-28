#!/usr/bin/env node

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  LocalAgentCommandRegistryBuilder,
  LocalAgentControlCenterStateBuilder,
  LocalAgentDocsIndexBuilder,
  LocalAgentProductManifestBuilder,
  LocalAgentReleaseApprovalRunner,
  LocalAgentReleaseCheckRunner,
  LocalAgentReleaseFreezeBuilder,
  LocalAgentReleaseNotesBuilder,
  LocalAgentReleaseRunbookBuilder,
  LocalAgentShipMvpRunner,
  LocalAgentTagCommandRunner,
  LocalAgentTagGateRunner,
} from "./local-agent/index.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_OUT_PATH = path.resolve(
  WORKSPACE_ROOT,
  "os-platform/core/pilot/evidence/local-agent-release-proof.latest.json"
);
const DEFAULT_MD_PATH = path.resolve(
  WORKSPACE_ROOT,
  "os-platform/core/pilot/evidence/local-agent-release-proof.latest.md"
);
const RELEASE_VERSION = "0.1.0";

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    outPath: path.resolve(WORKSPACE_ROOT, readValue("--out", DEFAULT_OUT_PATH)),
    mdPath: path.resolve(WORKSPACE_ROOT, readValue("--md", DEFAULT_MD_PATH)),
    keepTemp: args.includes("--keep-temp"),
  };
}

function runStep(label, action) {
  try {
    const value = action();
    return {
      label,
      ok: true,
      result: summarizeValue(value),
      error: null,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "object") {
    return value;
  }

  if ("version" in value || "ok" in value || "releaseStatus" in value) {
    return value;
  }

  return { type: value.constructor?.name || typeof value };
}

function collectArtifacts(root) {
  const interestingPaths = [".terrafusion", "release", "CHANGELOG.md"];
  const artifacts = [];

  for (const relativePath of interestingPaths) {
    const fullPath = path.resolve(root, relativePath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkDir(root, fullPath, artifacts);
      continue;
    }

    artifacts.push({
      path: relativeToRoot(root, fullPath),
      size: stats.size,
    });
  }

  return artifacts.sort((left, right) => left.path.localeCompare(right.path));
}

function walkDir(root, directory, artifacts) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      walkDir(root, fullPath, artifacts);
      continue;
    }

    artifacts.push({
      path: relativeToRoot(root, fullPath),
      size: statSync(fullPath).size,
    });
  }
}

function relativeToRoot(root, fullPath) {
  return path.relative(root, fullPath).replaceAll("\\", "/");
}

function readJsonIfExists(root, relativePath) {
  const fullPath = path.resolve(root, relativePath);
  if (!existsSync(fullPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

function summarizeArtifacts(root) {
  const releaseCheck = readJsonIfExists(root, ".terrafusion/release-check-report.json");
  const freezeCard = readJsonIfExists(root, ".terrafusion/release-freeze-card.json");
  const shipReport = readJsonIfExists(root, ".terrafusion/ship-report.json");
  const tagGate = readJsonIfExists(root, ".terrafusion/tag-gate-report.json");
  const approval = readJsonIfExists(root, ".terrafusion/release-approval.json");
  const runbook = readJsonIfExists(root, ".terrafusion/release-runbook-0.1.0.json");

  return {
    releaseCheck: releaseCheck
      ? {
          ok: releaseCheck.ok,
          releaseStatus: releaseCheck.releaseStatus,
          criticalFailures: releaseCheck.criticalFailures,
          warnings: releaseCheck.warnings,
        }
      : null,
    releaseFreeze: freezeCard
      ? {
          freezeStatus: freezeCard.freezeStatus,
          launchVerdict: freezeCard.launchVerdict,
        }
      : null,
    shipReport: shipReport
      ? {
          ok: shipReport.ok,
          outputDir: shipReport.outputDir,
          steps: Array.isArray(shipReport.steps) ? shipReport.steps.length : 0,
        }
      : null,
    tagGate: tagGate
      ? {
          ok: tagGate.ok,
          criticalFailures: tagGate.criticalFailures,
          warnings: tagGate.warnings,
          version: tagGate.version,
        }
      : null,
    releaseApproval: approval
      ? {
          version: approval.version,
          approverName: approval.approverName,
        }
      : null,
    releaseRunbook: runbook
      ? {
          releaseStatus: runbook.releaseStatus,
          version: runbook.version,
          finalManualSteps: Array.isArray(runbook.finalManualSteps) ? runbook.finalManualSteps.length : 0,
        }
      : null,
  };
}

function buildReleaseProof(root) {
  const steps = [];

  steps.push(runStep("command-registry", () => new LocalAgentCommandRegistryBuilder(root).build()));
  steps.push(runStep("control-center-state", () => new LocalAgentControlCenterStateBuilder(root).build()));
  steps.push(runStep("release-notes", () => new LocalAgentReleaseNotesBuilder(root).build()));
  steps.push(runStep("product-manifest", () => new LocalAgentProductManifestBuilder(root).build()));
  steps.push(runStep("release-check", () => new LocalAgentReleaseCheckRunner(root).run()));
  steps.push(runStep("docs-index", () => new LocalAgentDocsIndexBuilder(root).build()));
  steps.push(runStep("release-freeze", () => new LocalAgentReleaseFreezeBuilder(root).build()));
  steps.push(runStep("ship-mvp", () => new LocalAgentShipMvpRunner(root).run("release", true)));
  steps.push(runStep("tag-gate", () => new LocalAgentTagGateRunner(root).run(RELEASE_VERSION)));
  steps.push(runStep("release-approve", () => new LocalAgentReleaseApprovalRunner(root).approve(RELEASE_VERSION, "Founder")));
  steps.push(runStep("tag-command", () => new LocalAgentTagCommandRunner(root).build(RELEASE_VERSION)));
  steps.push(runStep("release-runbook", () => new LocalAgentReleaseRunbookBuilder(root).build(RELEASE_VERSION)));

  return steps;
}

function renderMarkdown(report) {
  const lines = [
    "# Local Agent Release Proof",
    "",
    `- Generated At: ${report.generatedAt}`,
    `- Overall: ${report.summary.ok ? "PASS" : "FAIL"}`,
    `- Temp Repo Cleaned Up: ${report.cleanedUp}`,
    `- Temp Repo Root: ${report.tempRepoRoot}`,
    "",
    "## Commands",
    "",
  ];

  for (const command of report.commands) {
    lines.push(`### ${command.ok ? "PASS" : "FAIL"} ${command.label}`);
    lines.push("");
    lines.push(`- Step: ${command.label}`);
    lines.push(`- OK: ${command.ok}`);
    if (command.error) {
      lines.push(`- Error: ${command.error}`);
    }
    if (command.result != null) {
      lines.push("- Result:");
      lines.push("```json");
      lines.push(JSON.stringify(command.result, null, 2));
      lines.push("```");
    }
    lines.push("");
  }

  lines.push("## Artifact Summary");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(report.artifactSummary, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Artifacts");
  lines.push("");
  for (const artifact of report.artifacts) {
    lines.push(`- ${artifact.path} (${artifact.size} bytes)`);
  }
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const { outPath, mdPath, keepTemp } = parseArgs(process.argv);
  const tempRepoRoot = mkdtempSync(path.resolve(os.tmpdir(), "tf-local-agent-release-proof-"));
  writeFileSync(path.resolve(tempRepoRoot, "package.json"), "{}\n", "utf8");

  const report = {
    generatedAt: new Date().toISOString(),
    workspaceRoot: WORKSPACE_ROOT,
    tempRepoRoot,
    commands: [],
    artifacts: [],
    artifactSummary: {},
    cleanedUp: false,
    summary: {
      ok: true,
      failureCommand: null,
    },
    note: "This proof validates the local-agent founder release evidence flow in a temp repo root via the supported tf:local-agent CLI alias.",
  };

  try {
    for (const result of buildReleaseProof(tempRepoRoot)) {
      report.commands.push(result);
      if (!result.ok) {
        report.summary.ok = false;
        report.summary.failureCommand = result.label;
        break;
      }
    }

    report.artifacts = collectArtifacts(tempRepoRoot);
    report.artifactSummary = summarizeArtifacts(tempRepoRoot);
  } finally {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(mdPath, `${renderMarkdown(report)}\n`, "utf8");

    if (!keepTemp) {
      rmSync(tempRepoRoot, { recursive: true, force: true });
      report.cleanedUp = true;
      writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      writeFileSync(mdPath, `${renderMarkdown(report)}\n`, "utf8");
    }
  }

  process.stdout.write(`Evidence written to ${outPath}\n`);
  process.stdout.write(`Summary written to ${mdPath}\n`);
  process.exitCode = report.summary.ok ? 0 : 1;
}

await main();
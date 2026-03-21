import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const snykCommand = process.env.SNYK_CLI_PATH || "snyk";
const scanMode = (process.env.SNYK_SCAN_MODE || "code").toLowerCase();
const reportFileName =
  process.env.SNYK_REPORT_PATH ||
  process.env.SNYK_CODE_REPORT_PATH ||
  (scanMode === "iac" ? "snyk-iac-report.json" : "snyk-code-report.json");
const reportPath = path.resolve(
  repoRoot,
  reportFileName,
);
const failOnFindings = process.env.SNYK_FAIL_ON_FINDINGS === "1";
const scanTimeoutMs = Number.parseInt(
  process.env.SNYK_SCAN_TIMEOUT_MS || "300000",
  10,
);
const defaultCodeTargets = [
  "tools/registry",
  "os-platform/core/pilot",
  "os-platform/core/types",
];
const defaultIacTargets = ["charts"];

function writeStatusReport(status, details = {}) {
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        mode: scanMode,
        status,
        details,
      },
      null,
      2,
    ),
  );
}

function removeExistingReport() {
  if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath);
  }
}

function runSnyk(args) {
  return spawnSync(snykCommand, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    timeout: scanTimeoutMs,
  });
}

function resolveTargets() {
  const configuredTargets = (
    process.env.SNYK_TARGETS ||
    (scanMode === "iac" ? process.env.SNYK_IAC_TARGETS : process.env.SNYK_CODE_TARGETS) ||
    ""
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const defaultTargets = scanMode === "iac" ? defaultIacTargets : defaultCodeTargets;

  const targets = (configuredTargets.length > 0 ? configuredTargets : defaultTargets)
    .map((target) => path.resolve(repoRoot, target))
    .filter((targetPath) => fs.existsSync(targetPath));

  return [...new Set(targets)];
}

function formatOutput(result) {
  return [result.stdout, result.stderr]
    .filter(Boolean)
    .join("\n")
    .trim();
}

function isCapabilityUnavailable(output) {
  const normalized = output.toLowerCase();
  return (
    normalized.includes("not recognized") ||
    normalized.includes("not found") ||
    normalized.includes("command not found") ||
    normalized.includes("authentication required") ||
    normalized.includes("please run 'snyk auth'") ||
    normalized.includes('please run "snyk auth"') ||
    normalized.includes("missing api token") ||
    normalized.includes("not authenticated")
  );
}

function readFindingCount() {
  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(reportPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.runs?.[0]?.results?.length ?? null;
  } catch {
    return null;
  }
}

function isTimedOut(result) {
  return result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM";
}

function loadReport(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function countResults(report) {
  if (!report?.runs) {
    if (Array.isArray(report?.infrastructureAsCodeIssues)) {
      return report.infrastructureAsCodeIssues.length;
    }

    return 0;
  }

  return report.runs.reduce(
    (total, run) => total + (Array.isArray(run.results) ? run.results.length : 0),
    0,
  );
}

function writeCombinedReport(reports) {
  if (scanMode === "iac") {
    fs.writeFileSync(
      reportPath,
      JSON.stringify({ mode: scanMode, reports }, null, 2),
    );
    return;
  }

  const runs = reports.flatMap((report) => report?.runs || []);
  fs.writeFileSync(reportPath, JSON.stringify({ runs }, null, 2));
}

function buildScanArgs(targetPath, targetReportPath) {
  if (scanMode === "iac") {
    return [
      "iac",
      "test",
      targetPath,
      "--severity-threshold=high",
      `--json-file-output=${targetReportPath}`,
    ];
  }

  return [
    "code",
    "test",
    targetPath,
    `--json-file-output=${targetReportPath}`,
  ];
}

function isNoSupportedProjectResult(result, output) {
  return result.status === 3 || output.toLowerCase().includes("no supported projects detected");
}

removeExistingReport();

const versionResult = runSnyk(["--version"]);
const versionOutput = formatOutput(versionResult);

if (versionResult.error || versionResult.status !== 0) {
  console.log(
    "CAPABILITY UNAVAILABLE: snyk CLI is not available on PATH. Install it per-user or machine-wide before relying on local security scans.",
  );
  if (versionOutput) {
    console.log(versionOutput);
  }
  process.exit(0);
}

console.log(`Snyk CLI version: ${versionOutput}`);

const targets = resolveTargets();

if (targets.length === 0) {
  if (scanMode === "iac") {
    writeStatusReport("skipped", {
      reason: "configured_iac_target_missing",
      configuredTargets:
        process.env.SNYK_IAC_TARGETS || process.env.SNYK_TARGETS || defaultIacTargets.join(","),
    });
    console.log("SKIP: configured IaC target missing in this workspace.");
  } else {
    console.log(`SKIP: no configured Snyk ${scanMode} targets exist in this workspace.`);
  }
  process.exit(0);
}

console.log(
  `Scanning governed ${scanMode} targets: ${targets
    .map((target) => path.relative(repoRoot, target))
    .join(", ")}`,
);

const reports = [];
let totalFindings = 0;
let targetsWithFindings = 0;

for (const targetPath of targets) {
  const targetLabel = path.relative(repoRoot, targetPath) || ".";
  const targetReportPath = path.resolve(
    repoRoot,
    `.tmp/snyk-${scanMode}-${targetLabel.replace(/[\\/:]+/g, "-")}.json`,
  );

  fs.mkdirSync(path.dirname(targetReportPath), { recursive: true });
  if (fs.existsSync(targetReportPath)) {
    fs.unlinkSync(targetReportPath);
  }

  console.log(`Running Snyk ${scanMode.toUpperCase()} scan for ${targetLabel}`);

  const scanResult = runSnyk(buildScanArgs(targetPath, targetReportPath));
  const scanOutput = formatOutput(scanResult);

  if (isTimedOut(scanResult)) {
    console.error(
      `ERROR: Snyk code scan timed out for ${targetLabel} after ${scanTimeoutMs}ms.`,
    );
    process.exit(1);
  }

  if (scanResult.status === 0 || scanResult.status === 1) {
    const report = loadReport(targetReportPath);
    if (report) {
      reports.push(report);
      totalFindings += countResults(report);
    }

    if (scanResult.status === 1) {
      targetsWithFindings += 1;
      console.log(`Snyk ${scanMode} scan completed with findings for ${targetLabel}.`);
    }

    continue;
  }

  if (scanMode === "iac" && isNoSupportedProjectResult(scanResult, scanOutput)) {
    writeStatusReport("skipped", {
      reason: "no_supported_iac_files",
      target: targetLabel,
    });
    console.log(
      `SKIP: configured IaC target missing in this workspace or has no supported IaC files: ${targetLabel}.`,
    );
    continue;
  }

  if (isCapabilityUnavailable(scanOutput)) {
    console.log(
      "CAPABILITY UNAVAILABLE: snyk CLI is installed but not authenticated for this session. Run `snyk auth` or set `SNYK_TOKEN` before relying on local security scans.",
    );
    if (scanOutput) {
      console.log(scanOutput);
    }
    process.exit(0);
  }

  console.error(`ERROR: snyk CLI failed while scanning ${targetLabel} in ${scanMode} mode.`);
  if (scanOutput) {
    console.error(scanOutput);
  }
  process.exit(scanResult.status ?? 1);
}

writeCombinedReport(reports);

if (totalFindings === 0) {
  if (scanMode === "iac") {
    writeStatusReport("clean", { findings: 0, targets });
  }
  console.log(`Snyk ${scanMode} scan clean (0 findings).`);
  process.exit(0);
}

if (scanMode === "iac") {
  console.log(
    `Snyk iac scan completed with findings in ${targetsWithFindings} target(s) (${totalFindings} findings).`,
  );
} else {
  console.log(`Snyk code scan completed with findings (${totalFindings} findings).`);
}
process.exit(failOnFindings ? 1 : 0);

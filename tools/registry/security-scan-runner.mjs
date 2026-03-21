import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const snykCommand = process.env.SNYK_CLI_PATH || "snyk";
const reportPath = path.resolve(
  repoRoot,
  process.env.SNYK_CODE_REPORT_PATH || "snyk-code-report.json",
);
const failOnFindings = process.env.SNYK_FAIL_ON_FINDINGS === "1";

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
  });
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

const scanResult = runSnyk([
  "code",
  "test",
  `--json-file-output=${reportPath}`,
]);
const scanOutput = formatOutput(scanResult);
const findingCount = readFindingCount();

if (scanResult.status === 0) {
  console.log(
    `Snyk code scan clean${findingCount === null ? "" : ` (${findingCount} findings)`}.`,
  );
  process.exit(0);
}

if (scanResult.status === 1) {
  console.log(
    `Snyk code scan completed with findings${findingCount === null ? "." : ` (${findingCount} findings).`}`,
  );
  process.exit(failOnFindings ? 1 : 0);
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

console.error("ERROR: snyk CLI failed to execute the code scan.");
if (scanOutput) {
  console.error(scanOutput);
}
process.exit(scanResult.status ?? 1);

#!/usr/bin/env node

import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-port-preflight.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-port-preflight.md"
);

export const DEFAULT_REQUIRED_PORTS = [
  {
    serviceName: "governed pilot runtime",
    port: Number(process.env.TF_PILOT_PORT || process.env.PILOT_PORT || "4317"),
    envVar: "TF_PILOT_PORT",
    requiredForDev: true,
    purpose: "Local governed pilot runtime used by dev:pilot:governed."
  },
  {
    serviceName: "TerraFusion API runtime",
    port: Number(process.env.TF_API_PORT || "5046"),
    envVar: "TF_API_PORT",
    requiredForDev: true,
    purpose: "Local .NET API runtime used by backend:launch and Vite API proxy."
  }
];

function normalizePort(value, fallback) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535) return parsed;
  return fallback;
}

function remediationFor(check) {
  const envVar =
    check.envVar
    ?? (check.serviceName === "governed pilot runtime" ? "TF_PILOT_PORT" : "TF_API_PORT");
  const alternate = envVar
    ? `Alternatively configure an unused ${envVar} before launching if the service supports that port.`
    : "Alternatively configure an unused service port before launching if supported.";
  return `Stop the conflicting process using port ${check.port}, or run the existing cleanup command if it owns this repo. ${alternate}`;
}

export function buildCountyStudioRealDevPortPreflightReport({
  portChecks,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const requiredPorts = portChecks.map((check) => ({
    serviceName: check.serviceName,
    port: check.port,
    envVar:
      check.envVar
      ?? (check.serviceName === "governed pilot runtime" ? "TF_PILOT_PORT" : "TF_API_PORT"),
    requiredForDev: check.requiredForDev === true,
    purpose: check.purpose ?? null
  }));
  const occupiedPorts = portChecks
    .filter((check) => check.requiredForDev === true && check.occupied === true)
    .map((check) => ({
      serviceName: check.serviceName,
      port: check.port,
      envVar:
        check.envVar
        ?? (check.serviceName === "governed pilot runtime" ? "TF_PILOT_PORT" : "TF_API_PORT"),
      requiredForDev: true,
      owningProcess: check.owningProcess ?? null,
      remediation: check.remediation ?? remediationFor(check)
    }));
  const portPreflightPassed = occupiedPorts.length === 0;

  return {
    generatedAtUtc,
    gate: "county-studio-real-dev-port-preflight",
    status: portPreflightPassed ? "REAL_DEV_PORT_PREFLIGHT_PASS" : "REAL_DEV_PORT_PREFLIGHT_BLOCKED",
    requiredPorts,
    occupiedPorts,
    portPreflightPassed,
    productionProofAllowed: false,
    operationalProofAllowed: false,
    alternatePortSupport: [
      {
        serviceName: "governed pilot runtime",
        envVar: "TF_PILOT_PORT",
        supported: true
      },
      {
        serviceName: "TerraFusion API runtime",
        envVar: "TF_API_PORT",
        supported: true
      }
    ],
    reuseExistingHealthyServices: {
      supportedByDevCommand: false,
      reason:
        "pnpm run dev:county-studio:real-benton launches fresh governed pilot/API processes, so occupied required ports must be cleared or moved before this command can cleanly launch."
    },
    boundaries: [
      "This preflight does not touch County Studio UI.",
      "This preflight does not mutate TerraFusion Sync.",
      "This preflight does not change DB seeding.",
      "This preflight does not weaken gates.",
      "This preflight does not set productionProofAllowed=true.",
      "This preflight does not set operationalProofAllowed=true.",
      "This preflight does not hide DATA_TRUTH_FAIL."
    ]
  };
}

export function renderCountyStudioRealDevPortPreflightMarkdown(report) {
  const lines = [];
  lines.push("# County Studio Real Dev Port Preflight");
  lines.push("");
  lines.push(`Generated: ${report.generatedAtUtc}`);
  lines.push("");
  lines.push(`Status: \`${report.status}\``);
  lines.push("");
  lines.push("## Required Ports");
  lines.push("");
  for (const port of report.requiredPorts) {
    lines.push(
      `- ${port.serviceName}: ${port.port} (${port.envVar}) — requiredForDev=${port.requiredForDev}`
    );
  }
  lines.push("");
  lines.push("## Occupied Ports");
  lines.push("");
  if (report.occupiedPorts.length === 0) {
    lines.push("- None");
  } else {
    for (const port of report.occupiedPorts) {
      const owner = port.owningProcess
        ? `${port.owningProcess.processName ?? "unknown"} pid=${port.owningProcess.processId ?? "unknown"}`
        : "unknown";
      lines.push(`- ${port.serviceName}: ${port.port} (${port.envVar})`);
      lines.push(`  - owner: ${owner}`);
      lines.push(`  - remediation: ${port.remediation}`);
    }
  }
  lines.push("");
  lines.push("## Reuse Existing Services");
  lines.push("");
  lines.push(`Supported by this command: ${report.reuseExistingHealthyServices.supportedByDevCommand}`);
  lines.push("");
  lines.push(report.reuseExistingHealthyServices.reason);
  lines.push("");
  lines.push("## Decisions");
  lines.push("");
  lines.push(`- portPreflightPassed=${report.portPreflightPassed}`);
  lines.push(`- productionProofAllowed=${report.productionProofAllowed}`);
  lines.push(`- operationalProofAllowed=${report.operationalProofAllowed}`);
  lines.push("");
  lines.push("## Boundaries");
  lines.push("");
  for (const boundary of report.boundaries) lines.push(`- ${boundary}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function ownerFromPowerShell(port) {
  if (process.platform !== "win32" || port <= 0) return null;
  const script = [
    `$conn = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1`,
    "if ($conn) {",
    "  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue",
    "  [pscustomobject]@{ processId = $conn.OwningProcess; processName = $proc.ProcessName; path = $proc.Path } | ConvertTo-Json -Compress",
    "}"
  ].join("; ");
  const result = spawnSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
    timeout: 5000
  });
  const stdout = result.stdout?.trim();
  if (!stdout) return null;
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

export function probePort(port) {
  return new Promise((resolve) => {
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      resolve({ occupied: true, error: "invalid port" });
      return;
    }
    if (port === 0) {
      resolve({ occupied: false });
      return;
    }
    const server = net.createServer();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      server.removeAllListeners();
      if (server.listening) {
        server.close(() => resolve(result));
      } else {
        resolve(result);
      }
    };
    server.once("error", (err) => {
      if (err?.code === "EADDRINUSE") {
        done({ occupied: true, owningProcess: ownerFromPowerShell(port) });
      } else {
        done({ occupied: true, error: err?.message ?? String(err) });
      }
    });
    server.listen(port, "127.0.0.1", () => done({ occupied: false }));
  });
}

async function collectPortChecks(requiredPorts) {
  const checks = [];
  for (const required of requiredPorts) {
    const probe = await probePort(required.port);
    checks.push({
      ...required,
      occupied: probe.occupied === true,
      owningProcess: probe.owningProcess ?? null,
      error: probe.error ?? null
    });
  }
  return checks;
}

function parseArgs(argv) {
  const args = {
    pilotPort: DEFAULT_REQUIRED_PORTS[0].port,
    apiPort: DEFAULT_REQUIRED_PORTS[1].port,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--pilot-port") args.pilotPort = normalizePort(argv[++i], args.pilotPort);
    else if (arg === "--api-port") args.apiPort = normalizePort(argv[++i], args.apiPort);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const requiredPorts = [
    { ...DEFAULT_REQUIRED_PORTS[0], port: args.pilotPort },
    { ...DEFAULT_REQUIRED_PORTS[1], port: args.apiPort }
  ];
  const portChecks = await collectPortChecks(requiredPorts);
  const report = buildCountyStudioRealDevPortPreflightReport({ portChecks });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioRealDevPortPreflightMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        portPreflightPassed: report.portPreflightPassed,
        occupiedPorts: report.occupiedPorts.map((item) => ({
          serviceName: item.serviceName,
          port: item.port,
          owningProcess: item.owningProcess
        })),
        productionProofAllowed: report.productionProofAllowed,
        operationalProofAllowed: report.operationalProofAllowed,
        output: path.relative(repoRoot, args.outJson).replaceAll("\\", "/")
      },
      null,
      2
    )
  );

  return report.portPreflightPassed ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((err) => {
      console.error(err?.message ?? String(err));
      process.exitCode = 1;
    });
}

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SOURCE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-real-dev-server-source.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-real-dev-server-readiness.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-real-dev-server-readiness.md"
);

export const DEV_READINESS_CLASSIFICATIONS = [
  "AUTHORITATIVE",
  "SYNC_DERIVED",
  "SEEDED",
  "PARTIAL_SEEDED",
  "MOCK",
  "FIXTURE",
  "GENERATED",
  "FALLBACK",
  "UNKNOWN"
];

export const REQUIRED_READINESS_CHECKS = [
  "backend health",
  "active drain process state",
  "load_batch current stage",
  "landing table counts",
  "truth table counts",
  "canonical parcel counts",
  "owner truth count",
  "account count",
  "supp association count",
  "property landing count",
  "WPOV status",
  "WSDOR status",
  "map data dependency status",
  "ledger data dependency status",
  "inspector data dependency status"
];

const REAL_DEV_ALLOWED_CLASSIFICATIONS = new Set([
  "AUTHORITATIVE",
  "SYNC_DERIVED",
  "SEEDED",
  "PARTIAL_SEEDED"
]);
const DEV_BLOCKING_CLASSIFICATIONS = new Set(["MOCK", "FIXTURE", "GENERATED", "FALLBACK", "UNKNOWN"]);

function readJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeClassification(value, fallback = "UNKNOWN") {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  return DEV_READINESS_CLASSIFICATIONS.includes(normalized) ? normalized : fallback;
}

function healthOk(backendHealth) {
  const status = String(backendHealth?.status ?? "").toLowerCase();
  return ["healthy", "ok", "pass", "up", "200"].includes(status) || backendHealth?.ok === true;
}

function processAlive(pid) {
  if (!pid) return null;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

async function probeBackendHealth(apiBases) {
  for (const apiBase of apiBases) {
    const base = String(apiBase ?? "").replace(/\/$/, "");
    if (!base) continue;
    for (const route of ["/health", "/api/health"]) {
      const url = `${base}${route}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (response.ok) {
          return { status: "healthy", ok: true, statusCode: response.status, url };
        }
        return { status: "unhealthy", ok: false, statusCode: response.status, url };
      } catch {
        // Try the next health route/base before declaring unavailable.
      }
    }
  }
  return { status: "unknown", ok: false, reason: "No backend health endpoint responded." };
}

async function collectRuntimeProbeEvidence(args) {
  const backendHealth = await probeBackendHealth(args.apiBases);
  const drainPid = args.drainPid;
  const alive = processAlive(drainPid);
  return {
    backendHealth,
    activeDrain: {
      pid: drainPid ? Number(drainPid) : null,
      alive,
      status: alive === true ? "IN_PROGRESS" : alive === false ? "NOT_RUNNING" : "UNKNOWN"
    },
    loadBatch: { status: "UNKNOWN" },
    counts: {
      landingTables: {},
      truthTables: {},
      canonical: {}
    },
    countyStudioDependencies: {
      map: "UNKNOWN",
      ledger: "UNKNOWN",
      inspector: "UNKNOWN"
    }
  };
}

function countRows(evidence) {
  return {
    propertyLanding: asNumber(evidence?.counts?.landingTables?.property),
    ownerLanding: asNumber(evidence?.counts?.landingTables?.owner),
    suppAssociation: asNumber(evidence?.counts?.landingTables?.propSuppAssoc),
    wpov: asNumber(evidence?.counts?.landingTables?.washPropOwnerVal),
    truthParcel: asNumber(evidence?.counts?.truthTables?.parcel),
    truthOwner: asNumber(evidence?.counts?.truthTables?.owner),
    truthWsdor: asNumber(evidence?.counts?.truthTables?.wsdor),
    canonicalParcel: asNumber(evidence?.counts?.canonical?.parcel),
    account: asNumber(evidence?.counts?.canonical?.account)
  };
}

function classifyCounts(counts) {
  const hasPropertySpine = counts.propertyLanding > 0 || counts.truthParcel > 0 || counts.canonicalParcel > 0;
  const hasOwner = counts.ownerLanding > 0 || counts.truthOwner > 0;
  const hasWsdor = counts.wpov > 0 || counts.truthWsdor > 0;
  const hasAccount = counts.account > 0;
  const hasSuppAssoc = counts.suppAssociation > 0;

  return {
    property: hasPropertySpine ? "PARTIAL_SEEDED" : "UNKNOWN",
    owner: hasOwner ? "PARTIAL_SEEDED" : "UNKNOWN",
    wsdor: hasWsdor ? "PARTIAL_SEEDED" : "UNKNOWN",
    account: hasAccount ? "SEEDED" : "UNKNOWN",
    suppAssociation: hasSuppAssoc ? "PARTIAL_SEEDED" : "UNKNOWN"
  };
}

function makeCheck(name, classification, passed, reason, evidence = {}) {
  return {
    name,
    classification: normalizeClassification(classification),
    passed,
    reason,
    evidence
  };
}

function buildChecks(evidence) {
  const counts = countRows(evidence);
  const countClass = classifyCounts(counts);
  const backendHealthy = healthOk(evidence?.backendHealth);
  const loadBatchStatus = String(evidence?.loadBatch?.status ?? "UNKNOWN").toUpperCase();
  const drainAlive = evidence?.activeDrain?.alive === true;
  const drainKnownDead = evidence?.activeDrain?.alive === false;
  const mapClassification = normalizeClassification(evidence?.countyStudioDependencies?.map);
  const ledgerClassification = normalizeClassification(evidence?.countyStudioDependencies?.ledger);
  const inspectorClassification = normalizeClassification(evidence?.countyStudioDependencies?.inspector);

  return [
    makeCheck(
      "backend health",
      backendHealthy ? "SYNC_DERIVED" : "UNKNOWN",
      backendHealthy,
      backendHealthy ? "Backend health is reported usable for dev reads." : "Backend health is not proven.",
      evidence?.backendHealth ?? {}
    ),
    makeCheck(
      "active drain process state",
      drainAlive ? "SYNC_DERIVED" : "UNKNOWN",
      drainAlive,
      drainAlive
        ? `Drain process ${evidence.activeDrain?.pid ?? "unknown"} is still alive.`
        : drainKnownDead
          ? "Drain process is not alive; confirm whether client timeout or backend failure occurred."
          : "Drain process state is unknown.",
      evidence?.activeDrain ?? {}
    ),
    makeCheck(
      "load_batch current stage",
      loadBatchStatus === "IN_PROGRESS" || loadBatchStatus === "COMPLETED" ? "SYNC_DERIVED" : "UNKNOWN",
      loadBatchStatus === "IN_PROGRESS" || loadBatchStatus === "COMPLETED",
      evidence?.loadBatch?.stage
        ? `load_batch stage is ${evidence.loadBatch.stage} (${loadBatchStatus}).`
        : "load_batch stage is not proven.",
      evidence?.loadBatch ?? {}
    ),
    makeCheck(
      "landing table counts",
      countClass.property,
      counts.propertyLanding > 0,
      counts.propertyLanding > 0 ? "Property landing rows exist." : "Property landing rows are missing or unknown.",
      counts
    ),
    makeCheck(
      "truth table counts",
      counts.truthParcel > 0 || counts.truthOwner > 0 || counts.truthWsdor > 0 ? "PARTIAL_SEEDED" : "UNKNOWN",
      counts.truthParcel > 0 || counts.truthOwner > 0 || counts.truthWsdor > 0,
      "Truth table counts are evaluated as partial until all expected Benton counts are reconciled.",
      counts
    ),
    makeCheck(
      "canonical parcel counts",
      counts.canonicalParcel > 0 ? "SEEDED" : "UNKNOWN",
      counts.canonicalParcel > 0,
      counts.canonicalParcel > 0 ? "Canonical parcel rows exist." : "Canonical parcel count is missing.",
      { canonicalParcel: counts.canonicalParcel }
    ),
    makeCheck(
      "owner truth count",
      countClass.owner,
      counts.truthOwner > 0,
      counts.truthOwner > 0 ? "Owner truth rows exist." : "Owner truth count is missing.",
      { truthOwner: counts.truthOwner, ownerLanding: counts.ownerLanding }
    ),
    makeCheck(
      "account count",
      countClass.account,
      counts.account > 0,
      counts.account > 0 ? "Account rows exist." : "Account count is missing.",
      { account: counts.account }
    ),
    makeCheck(
      "supp association count",
      countClass.suppAssociation,
      counts.suppAssociation > 0,
      counts.suppAssociation > 0 ? "Supplement association landing rows exist." : "Supplement association count is missing.",
      { suppAssociation: counts.suppAssociation }
    ),
    makeCheck(
      "property landing count",
      countClass.property,
      counts.propertyLanding > 0,
      counts.propertyLanding > 0 ? "Property landing count is present." : "Property landing count is missing.",
      { propertyLanding: counts.propertyLanding }
    ),
    makeCheck(
      "WPOV status",
      countClass.wsdor,
      counts.wpov > 0,
      counts.wpov > 0 ? "WPOV landing rows exist." : "WPOV landing status is missing.",
      { wpov: counts.wpov }
    ),
    makeCheck(
      "WSDOR status",
      counts.truthWsdor > 0 ? "PARTIAL_SEEDED" : "UNKNOWN",
      counts.truthWsdor > 0,
      counts.truthWsdor > 0 ? "WSDOR truth rows exist." : "WSDOR truth status is missing.",
      { truthWsdor: counts.truthWsdor }
    ),
    makeCheck(
      "map data dependency status",
      mapClassification,
      REAL_DEV_ALLOWED_CLASSIFICATIONS.has(mapClassification),
      `Map dependency is classified ${mapClassification}.`,
      { classification: mapClassification }
    ),
    makeCheck(
      "ledger data dependency status",
      ledgerClassification,
      REAL_DEV_ALLOWED_CLASSIFICATIONS.has(ledgerClassification),
      `Ledger dependency is classified ${ledgerClassification}.`,
      { classification: ledgerClassification }
    ),
    makeCheck(
      "inspector data dependency status",
      inspectorClassification,
      REAL_DEV_ALLOWED_CLASSIFICATIONS.has(inspectorClassification),
      `Inspector dependency is classified ${inspectorClassification}.`,
      { classification: inspectorClassification }
    )
  ];
}

function blockerFor(check) {
  if (check.passed) return null;
  if (DEV_BLOCKING_CLASSIFICATIONS.has(check.classification)) {
    return `${check.name}: ${check.reason}`;
  }
  return `${check.name}: required readiness check did not pass.`;
}

function buildMaturity(checks) {
  const dataChecks = checks.filter((check) =>
    [
      "landing table counts",
      "truth table counts",
      "canonical parcel counts",
      "owner truth count",
      "account count",
      "supp association count",
      "property landing count",
      "WPOV status",
      "WSDOR status",
      "map data dependency status",
      "ledger data dependency status",
      "inspector data dependency status"
    ].includes(check.name)
  );
  const classifications = dataChecks.map((check) => check.classification);
  const hasRealSeed = classifications.some((value) =>
    ["SYNC_DERIVED", "SEEDED", "PARTIAL_SEEDED"].includes(value)
  );
  const allCoreDevChecksPassed = checks
    .filter((check) =>
      [
        "backend health",
        "canonical parcel counts",
        "map data dependency status",
        "ledger data dependency status",
        "inspector data dependency status"
      ].includes(check.name)
    )
    .every((check) => check.passed);

  return {
    DATA_TRUTH_FAIL: true,
    REAL_DEV_DATA_AVAILABLE: hasRealSeed && allCoreDevChecksPassed,
    SYNC_DERIVED_PARTIAL: hasRealSeed,
    SYNC_DERIVED_COMPLETE: false,
    AUTHORITATIVE_RECONCILED: false,
    PRODUCTION_PROOF_ALLOWED: false
  };
}

export function buildBentonRealDevServerReadinessReport({
  evidence = null,
  generatedAtUtc = new Date().toISOString(),
  sourcePath = null
} = {}) {
  const checks = buildChecks(evidence ?? {});
  const blockers = checks.map(blockerFor).filter(Boolean);
  const maturity = buildMaturity(checks);
  const realDevServerAllowed = maturity.REAL_DEV_DATA_AVAILABLE && blockers.length === 0;
  const status = realDevServerAllowed ? "REAL_DEV_DATA_AVAILABLE" : "REAL_DEV_SERVER_BLOCKED";

  return {
    generatedAtUtc,
    gate: "benton-real-dev-server-readiness",
    status,
    sourcePath,
    decisions: {
      realDevServerAllowed,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    maturity,
    requiredChecks: REQUIRED_READINESS_CHECKS,
    checks,
    blockers,
    classifications: DEV_READINESS_CLASSIFICATIONS,
    rules: [
      "Client timeout is not data failure.",
      "Backend death is data failure.",
      "Stage stagnation without inserts is investigation.",
      "Partial landing is usable for dev evidence, not production proof.",
      "Do not relabel partial seed as authoritative."
    ],
    boundaries: [
      "This gate does not start or stop drains.",
      "This gate does not touch TerraFusion Sync.",
      "This gate does not touch DB seeding.",
      "This gate does not weaken production proof gates."
    ]
  };
}

export function renderBentonRealDevServerReadinessMarkdown(report) {
  const lines = [
    "# Benton Real Dev Server Readiness",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "## Decision",
    "",
    `- Real Dev Server: ${report.decisions.realDevServerAllowed ? "ALLOWED" : "BLOCKED"}`,
    `- Production Proof: ${report.decisions.productionProofAllowed ? "ALLOWED" : "BLOCKED"}`,
    `- Operational Proof: ${report.decisions.operationalProofAllowed ? "ALLOWED" : "BLOCKED"}`,
    "",
    "## Maturity",
    "",
    ...Object.entries(report.maturity).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Checks",
    "",
    "| Check | Classification | Passed | Reason |",
    "| --- | --- | --- | --- |"
  ];

  report.checks.forEach((check) => {
    lines.push(
      `| ${check.name} | ${check.classification} | ${check.passed} | ${String(check.reason).replaceAll("\n", " ")} |`
    );
  });

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((boundary) => lines.push(`- ${boundary}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    source: process.env.TF_BENTON_REAL_DEV_READINESS_SOURCE
      ? path.resolve(process.env.TF_BENTON_REAL_DEV_READINESS_SOURCE)
      : DEFAULT_SOURCE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    drainPid: process.env.TF_BENTON_DRAIN_PID ?? null,
    apiBases: [
      process.env.TF_BENTON_DEV_API_BASE,
      process.env.TF_RUNTIME_BASE_URL,
      process.env.VITE_API_URL,
      "http://localhost:5000",
      "http://localhost:5046"
    ],
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") args.source = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--drain-pid") args.drainPid = argv[++i];
    else if (arg === "--api-base") args.apiBases.unshift(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const sourceEvidence = readJson(args.source);
  const evidence = sourceEvidence ?? await collectRuntimeProbeEvidence(args);
  const report = buildBentonRealDevServerReadinessReport({
    evidence,
    sourcePath: fs.existsSync(args.source) ? rel(args.source) : null
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderBentonRealDevServerReadinessMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        realDevServerAllowed: report.decisions.realDevServerAllowed,
        productionProofAllowed: report.decisions.productionProofAllowed,
        operationalProofAllowed: report.decisions.operationalProofAllowed,
        blockers: report.blockers.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (!report.decisions.realDevServerAllowed) {
    process.exitCode = 1;
  }

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

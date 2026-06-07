#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBentonSyncDrainStateEvidence,
  evidenceToReadinessSource
} from "./benton-sync-drain-state-evidence-adapter.mjs";

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
  "owner-supnum backfill dependency classification",
  "exemption fact seal dependency classification",
  "map data dependency status",
  "ledger data dependency status",
  "inspector data dependency status"
];

export const OWNER_SUPNUM_DEPENDENCY_CLASSIFICATIONS = [
  "REQUIRED_FOR_FORGE_DEV",
  "NOT_REQUIRED_FOR_FORGE_DEV",
  "REQUIRED_FOR_PACKET_PROOF",
  "REQUIRED_FOR_PRODUCTION_PROOF",
  "REQUIRED_FOR_OPERATIONAL_PROOF",
  "UNKNOWN"
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

function normalizeOwnerSupnumDependencyClassification(value, fallback = "UNKNOWN") {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  return OWNER_SUPNUM_DEPENDENCY_CLASSIFICATIONS.includes(normalized) ? normalized : fallback;
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
  const adapterEvidence = await buildBentonSyncDrainStateEvidence({
    drainPid: args.drainPid,
    dbRuntime: args.dbRuntime,
    pgContainer: args.pgContainer,
    pgDatabase: args.pgDatabase,
    pgUser: args.pgUser,
    probeBackendHealth: () => probeBackendHealth(args.apiBases)
  });
  return evidenceToReadinessSource(adapterEvidence);
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

function makeCheck(name, classification, passed, reason, evidence = {}, extra = {}) {
  return {
    name,
    classification: normalizeClassification(classification),
    passed,
    reason,
    evidence,
    ...extra
  };
}

function forgeDevParcelIdentityReady(counts) {
  return counts.propertyLanding > 0 || counts.truthParcel > 0 || counts.canonicalParcel > 0;
}

function isOwnerSupnumBackfillStage(stage) {
  return String(stage ?? "").trim().toLowerCase().startsWith("owner-supnum");
}

function isExemptionFactSealStage(stage) {
  return String(stage ?? "").trim().toLowerCase().startsWith("exemption-fact");
}

function isFailed(status) {
  return String(status ?? "").trim().toUpperCase() === "FAILED";
}

function buildOwnerSupnumDependency(evidence) {
  const source = evidence?.countyStudioDependencies?.ownerSupnumBackfill ?? {};
  const currentLoadBatchIsOwnerSupnum = isOwnerSupnumBackfillStage(evidence?.loadBatch?.stage);
  const stage = source.stage
    ?? source.latestFailed?.stage
    ?? (currentLoadBatchIsOwnerSupnum ? evidence?.loadBatch?.stage : null)
    ?? "UNKNOWN";
  const status = source.status
    ?? source.latestFailed?.status
    ?? (currentLoadBatchIsOwnerSupnum ? evidence?.loadBatch?.status : null)
    ?? "UNKNOWN";
  const consumedByForge = source.ownerIdentityConsumedByForgeSurfaces === true;
  const requiredForForgeDev = source.requiredForCountyStudioForgeDev === true || consumedByForge;
  const classification = normalizeOwnerSupnumDependencyClassification(
    source.classification,
    requiredForForgeDev
      ? "REQUIRED_FOR_FORGE_DEV"
      : isOwnerSupnumBackfillStage(stage)
        ? "NOT_REQUIRED_FOR_FORGE_DEV"
        : "UNKNOWN"
  );

  return {
    stage,
    status,
    classification,
    requiredForCountyStudioForgeDev: classification === "REQUIRED_FOR_FORGE_DEV" || requiredForForgeDev,
    requiredForPacketProof: source.requiredForPacketProof !== false,
    requiredForOperationalProof: source.requiredForOperationalProof !== false,
    ownerIdentityConsumedByForgeSurfaces: consumedByForge,
    consumedSurfaces: Array.isArray(source.consumedSurfaces) ? source.consumedSurfaces : [],
    latestFailed: source.latestFailed ?? null,
    audit: source.audit ?? {
      forgeValuationSurfaces: [
        "parcel/property identity",
        "property characteristics",
        "valuation metrics",
        "ratio-study context",
        "risk objects",
        "geometry/map context",
        "countyId",
        "taxYear",
        "studyId"
      ],
      packetOperationalSurfaces: [
        "owner truth",
        "notice recipient identity",
        "appeal taxpayer identity",
        "Dossier packet owner identity",
        "operational ledger owner references"
      ]
    }
  };
}

function buildExemptionFactDependency(evidence) {
  const source = evidence?.countyStudioDependencies?.exemptionFactSeal ?? {};
  const stage = source.stage ?? evidence?.loadBatch?.stage ?? "UNKNOWN";
  const status = source.status ?? evidence?.loadBatch?.status ?? "UNKNOWN";
  const consumedByForge = source.exemptionFactsConsumedByForgeSurfaces === true;
  const requiredForForgeDev = source.requiredForCountyStudioForgeDev === true || consumedByForge;
  const classification = normalizeOwnerSupnumDependencyClassification(
    source.classification,
    requiredForForgeDev
      ? "REQUIRED_FOR_FORGE_DEV"
      : isExemptionFactSealStage(stage)
        ? "NOT_REQUIRED_FOR_FORGE_DEV"
        : "UNKNOWN"
  );

  return {
    stage,
    status,
    classification,
    requiredForCountyStudioForgeDev: classification === "REQUIRED_FOR_FORGE_DEV" || requiredForForgeDev,
    requiredForPacketProof: source.requiredForPacketProof !== false,
    requiredForProductionProof: source.requiredForProductionProof !== false,
    requiredForOperationalProof: source.requiredForOperationalProof !== false,
    exemptionFactsConsumedByForgeSurfaces: consumedByForge,
    consumedSurfaces: Array.isArray(source.consumedSurfaces) ? source.consumedSurfaces : [],
    audit: source.audit ?? {
      finding: "County Studio is a TerraForge valuation surface; current Forge valuation paths do not consume exemption facts.",
      forgeValuationSources: [
        "parcel/property identity",
        "property characteristics",
        "valuation metrics",
        "ratio-study context",
        "risk objects",
        "geometry/map context"
      ],
      packetOperationalSurfaces: [
        "tax relief workflow",
        "notice/tax liability context",
        "Dais exemption administration",
        "Dossier packet exemption proof",
        "operational roll packet references"
      ]
    }
  };
}

function buildChecks(evidence) {
  const counts = countRows(evidence);
  const countClass = classifyCounts(counts);
  const backendHealthy = healthOk(evidence?.backendHealth);
  const loadBatchStatus = String(evidence?.loadBatch?.status ?? "UNKNOWN").toUpperCase();
  const ownerSupnumDependency = buildOwnerSupnumDependency(evidence);
  const exemptionFactDependency = buildExemptionFactDependency(evidence);
  const ownerSupnumFailedButNotForgeDevRequired =
    isOwnerSupnumBackfillStage(ownerSupnumDependency.stage)
    && isFailed(ownerSupnumDependency.status)
    && ownerSupnumDependency.requiredForCountyStudioForgeDev !== true;
  const exemptionFactFailedButNotForgeDevRequired =
    isExemptionFactSealStage(exemptionFactDependency.stage)
    && isFailed(exemptionFactDependency.status)
    && exemptionFactDependency.requiredForCountyStudioForgeDev !== true;
  const drainAlive = evidence?.activeDrain?.alive === true;
  const drainKnownDead = evidence?.activeDrain?.alive === false;
  const dbBackedDrainStateKnown =
    loadBatchStatus === "IN_PROGRESS"
    || loadBatchStatus === "COMPLETED"
    || ownerSupnumFailedButNotForgeDevRequired
    || exemptionFactFailedButNotForgeDevRequired;
  const mapClassification = normalizeClassification(evidence?.countyStudioDependencies?.map);
  const ledgerClassification = normalizeClassification(evidence?.countyStudioDependencies?.ledger);
  const inspectorClassification = normalizeClassification(evidence?.countyStudioDependencies?.inspector);
  const parcelIdentityReadyForForgeDev = forgeDevParcelIdentityReady(counts);

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
      drainAlive || dbBackedDrainStateKnown ? "SYNC_DERIVED" : "UNKNOWN",
      drainAlive || dbBackedDrainStateKnown,
      drainAlive
        ? `Drain process ${evidence.activeDrain?.pid ?? "unknown"} is still alive.`
        : dbBackedDrainStateKnown
          ? ownerSupnumFailedButNotForgeDevRequired
            ? "Client drain process is not alive/known, but the failed owner-supnum stage is not required for County Studio Forge valuation dev."
            : exemptionFactFailedButNotForgeDevRequired
              ? "Client drain process is not alive/known, but the failed exemption-fact stage is not required for County Studio Forge valuation dev."
            : `Client drain process is not alive, but DB load_batch proves server-side state ${loadBatchStatus}.`
        : drainKnownDead
          ? "Drain process is not alive; confirm whether client timeout or backend failure occurred."
          : "Drain process state is unknown.",
      evidence?.activeDrain ?? {}
    ),
    makeCheck(
      "load_batch current stage",
      loadBatchStatus === "IN_PROGRESS" || loadBatchStatus === "COMPLETED" || ownerSupnumFailedButNotForgeDevRequired || exemptionFactFailedButNotForgeDevRequired ? "SYNC_DERIVED" : "UNKNOWN",
      loadBatchStatus === "IN_PROGRESS" || loadBatchStatus === "COMPLETED" || ownerSupnumFailedButNotForgeDevRequired || exemptionFactFailedButNotForgeDevRequired,
      evidence?.loadBatch?.stage
        ? ownerSupnumFailedButNotForgeDevRequired
          ? "load_batch stage is owner-supnum-backfill (FAILED), retained as packet/ops blocker but not a County Studio Forge dev blocker."
          : exemptionFactFailedButNotForgeDevRequired
            ? "load_batch stage is exemption-fact-seal (FAILED), retained as production/ops blocker but not a County Studio Forge dev blocker."
          : `load_batch stage is ${evidence.loadBatch.stage} (${loadBatchStatus}).`
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
      counts.canonicalParcel > 0
        ? "Canonical parcel rows exist."
        : parcelIdentityReadyForForgeDev
          ? "Canonical parcel count is missing; production proof remains blocked, but Forge dev has real parcel identity via landing/truth paths."
          : "Canonical parcel count is missing and no alternate real Forge parcel identity path is proven.",
      {
        canonicalParcel: counts.canonicalParcel,
        propertyLanding: counts.propertyLanding,
        truthParcel: counts.truthParcel,
        forgeDevRequiresCanonicalParcel: !parcelIdentityReadyForForgeDev,
        productionProofRequiresCanonicalParcel: true
      },
      {
        blockingForForgeDev: !parcelIdentityReadyForForgeDev,
        productionProofRequiresCanonicalParcel: true
      }
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
      "owner-supnum backfill dependency classification",
      ownerSupnumDependency.requiredForCountyStudioForgeDev ? "UNKNOWN" : "PARTIAL_SEEDED",
      ownerSupnumDependency.requiredForCountyStudioForgeDev !== true || !isFailed(ownerSupnumDependency.status),
      ownerSupnumDependency.requiredForCountyStudioForgeDev
        ? "owner-supnum backfill is required for a consumed County Studio Forge owner-identity surface."
        : "owner-supnum backfill is not required for County Studio Forge valuation dev; packet and operational proof remain blocked.",
      ownerSupnumDependency
    ),
    makeCheck(
      "exemption fact seal dependency classification",
      exemptionFactDependency.requiredForCountyStudioForgeDev ? "UNKNOWN" : "PARTIAL_SEEDED",
      exemptionFactDependency.requiredForCountyStudioForgeDev !== true || !isFailed(exemptionFactDependency.status),
      exemptionFactDependency.requiredForCountyStudioForgeDev
        ? "exemption-fact-seal is required for a consumed County Studio Forge exemption surface."
        : "exemption-fact-seal is not required for County Studio Forge valuation dev; production, packet, and operational proof remain blocked.",
      exemptionFactDependency
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
  if (check.blockingForForgeDev === false) return null;
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
  const forgeDevDependency = {
    ownerSupnumBackfill: buildOwnerSupnumDependency(evidence ?? {}),
    exemptionFactSeal: buildExemptionFactDependency(evidence ?? {})
  };
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
    forgeDevDependency,
    blockers,
    classifications: DEV_READINESS_CLASSIFICATIONS,
    rules: [
      "Client timeout is not data failure.",
      "Backend death is data failure.",
      "Stage stagnation without inserts is investigation.",
      "Partial landing is usable for dev evidence, not production proof.",
      "Owner-supnum backfill failure blocks packet and operational proof, but only blocks County Studio Forge dev when a Forge surface consumes owner identity.",
      "Exemption fact seal failure blocks production, packet, and operational proof, but only blocks County Studio Forge dev when a Forge surface consumes exemption facts.",
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

  lines.push(
    "",
    "## Forge Dev Dependency Reclassification",
    "",
    `- ownerSupnumBackfillStatus: ${report.forgeDevDependency.ownerSupnumBackfill.status}`,
    `- ownerSupnumBackfillStage: ${report.forgeDevDependency.ownerSupnumBackfill.stage}`,
    `- ownerSupnumBackfillLatestFailedStage: ${report.forgeDevDependency.ownerSupnumBackfill.latestFailed?.stage ?? "none"}`,
    `- ownerSupnumBackfillLatestFailedStatus: ${report.forgeDevDependency.ownerSupnumBackfill.latestFailed?.status ?? "none"}`,
    `- ownerSupnumBackfillClassification: ${report.forgeDevDependency.ownerSupnumBackfill.classification}`,
    `- ownerSupnumBackfillRequiredForForgeDev: ${report.forgeDevDependency.ownerSupnumBackfill.requiredForCountyStudioForgeDev}`,
    `- ownerSupnumBackfillRequiredForPacketProof: ${report.forgeDevDependency.ownerSupnumBackfill.requiredForPacketProof}`,
    `- ownerSupnumBackfillRequiredForOperationalProof: ${report.forgeDevDependency.ownerSupnumBackfill.requiredForOperationalProof}`,
    `- exemptionFactSealStatus: ${report.forgeDevDependency.exemptionFactSeal.status}`,
    `- exemptionFactSealStage: ${report.forgeDevDependency.exemptionFactSeal.stage}`,
    `- exemptionFactSealClassification: ${report.forgeDevDependency.exemptionFactSeal.classification}`,
    `- exemptionFactSealRequiredForForgeDev: ${report.forgeDevDependency.exemptionFactSeal.requiredForCountyStudioForgeDev}`,
    `- exemptionFactSealRequiredForProductionProof: ${report.forgeDevDependency.exemptionFactSeal.requiredForProductionProof}`,
    `- exemptionFactSealRequiredForPacketProof: ${report.forgeDevDependency.exemptionFactSeal.requiredForPacketProof}`,
    `- exemptionFactSealRequiredForOperationalProof: ${report.forgeDevDependency.exemptionFactSeal.requiredForOperationalProof}`
  );

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
    dbRuntime: process.env.TF_BENTON_SYNC_DB_RUNTIME ?? process.env.TF_DB_EVIDENCE_RUNTIME ?? "auto",
    pgContainer: process.env.TF_PG_CONTAINER ?? "terrafusion-postgres-dev",
    pgDatabase: process.env.TF_PG_DATABASE ?? process.env.TF_PG_DB ?? "terrafusion",
    pgUser: process.env.TF_PG_USER ?? "postgres",
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
    else if (arg === "--db-runtime") args.dbRuntime = argv[++i];
    else if (arg === "--pg-container") args.pgContainer = argv[++i];
    else if (arg === "--pg-database") args.pgDatabase = argv[++i];
    else if (arg === "--pg-user") args.pgUser = argv[++i];
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

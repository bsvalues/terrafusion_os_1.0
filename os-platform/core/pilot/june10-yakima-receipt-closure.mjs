#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const YAKIMA_COUNTY_ID = "760e72c5-5244-5052-29e3-eb19011b3bc1";
const YAKIMA_FIPS = "53077";
const IDENTITY_REPAIR_RECEIPT_ID = "wa_initial_seed_identity_repair_2026_05_26_pilot4";

const DEFAULT_POST_REPAIR_CLOSURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-post-repair-certification-closure.latest.json"
);
const DEFAULT_REPAIR_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-pilot-repair-execution",
  "repair-receipt.after-execution.json"
);
const DEFAULT_CANONICAL_EXPORT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "yakima",
  "yakima-canonical-parcelnumbers.csv"
);
const DEFAULT_EXPECTED_SOURCE_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed",
  "yakima",
  "source-snapshot-receipt.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-receipt-closure"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-receipt-closure.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-receipt-closure.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function artifact(filePath) {
  return {
    path: relativePath(filePath),
    exists: fs.existsSync(filePath),
    sha256: fs.existsSync(filePath) ? sha256File(filePath) : null
  };
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--") continue;
    if (!argv[index]?.startsWith("--")) continue;
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
      continue;
    }
    args.set(key, next);
    index += 1;
  }
  return args;
}

function findCounty(postRepairClosure) {
  return postRepairClosure.counties?.find((county) => county.fips === YAKIMA_FIPS);
}

function runPsql({ sql, dockerContainer, database, user }) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", dockerContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", user, "-d", database, "-At"],
    { input: sql, encoding: "utf8", maxBuffer: 1024 * 1024 * 32 }
  );
  if (result.status !== 0) {
    const error = new Error(result.stderr || result.stdout || "psql failed");
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function buildYakimaDbSnapshot({ dockerContainer, database, user }) {
  const sql = `with duplicate_groups as (
  select p."ParcelNumber"
  from canonical_tf.tf_parcel p
  where p."CountyId"='${YAKIMA_COUNTY_ID}'::uuid
    and p."ParcelStatus"='ACTIVE'
    and nullif(p."ParcelNumber",'') is not null
  group by p."ParcelNumber"
  having count(*) > 1
)
select jsonb_build_object(
  'activeRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${YAKIMA_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE'),
  'activeDistinct', (select count(distinct "ParcelNumber") from canonical_tf.tf_parcel where "CountyId"='${YAKIMA_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE'),
  'activeDuplicateGroups', (select count(*) from duplicate_groups),
  'identityRepairReceiptRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${YAKIMA_COUNTY_ID}'::uuid and "IdentityRepairReceiptId"='${IDENTITY_REPAIR_RECEIPT_ID}'),
  'supersededRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${YAKIMA_COUNTY_ID}'::uuid and "ParcelStatus"='SUPERSEDED')
);`;
  return JSON.parse(runPsql({ sql, dockerContainer, database, user }));
}

export function buildYakimaReceiptClosure({
  postRepairCounty,
  repairReceipt,
  dbSnapshot,
  sourceReceiptExists,
  sourceArtifactExists,
  supportingArtifacts
}) {
  const blockers = [];
  const repairCounty = repairReceipt.counties?.find((county) => county.fips === YAKIMA_FIPS);
  const sourceOnlyCount = Number(postRepairCounty.sourceOnlyCount ?? 0);
  const canonicalOnlyCount = Number(postRepairCounty.canonicalOnlyCount ?? 0);
  const sourceDistinct = Number(postRepairCounty.sourceDistinct ?? 0);
  const canonicalDistinct = Number(postRepairCounty.canonicalDistinct ?? 0);
  const exactOverlap = Number(postRepairCounty.exactOverlap ?? 0);

  if (repairReceipt.committed !== true) blockers.push("4-county identity repair receipt is not committed.");
  if (repairCounty?.repairedRows !== 102238) blockers.push("Expected 102,238 repaired Yakima rows in repair receipt.");
  if (postRepairCounty.legacyImportedParcelKeyPreserved !== true) {
    blockers.push("LegacyImportedParcelKey preservation is not proven for Yakima.");
  }
  if (postRepairCounty.terraFusionParcelKeyPopulated !== true) {
    blockers.push("TerraFusionParcelKey population is not proven for Yakima.");
  }
  if (dbSnapshot.activeDuplicateGroups !== 0) {
    blockers.push(`${dbSnapshot.activeDuplicateGroups} active Yakima duplicate parcel groups remain.`);
  }
  if (dbSnapshot.activeRows !== canonicalDistinct || dbSnapshot.activeDistinct !== canonicalDistinct) {
    blockers.push("Live canonical Yakima row/distinct counts do not match post-repair closure evidence.");
  }
  if (!sourceReceiptExists) blockers.push("Yakima source snapshot receipt is missing.");
  if (!sourceArtifactExists) blockers.push("Yakima raw source artifact is missing; duplicate/null/source semantics cannot be independently rerun.");
  if (sourceOnlyCount > 0) blockers.push(`${sourceOnlyCount} source parcel identifiers are not present in canonical after repair.`);
  if (canonicalOnlyCount > 0) blockers.push(`${canonicalOnlyCount} canonical parcel identifiers are not present in source evidence after repair.`);

  const fullIdentityClosed =
    blockers.length === 0 &&
    sourceOnlyCount === 0 &&
    canonicalOnlyCount === 0 &&
    sourceDistinct === canonicalDistinct &&
    exactOverlap === sourceDistinct;

  const status = fullIdentityClosed ? "receipt_backed_full_identity" : "blocked_source_canonical_delta";
  const sourceCoverageRatio = sourceDistinct > 0 ? exactOverlap / sourceDistinct : 0;
  const canonicalCoverageRatio = canonicalDistinct > 0 ? exactOverlap / canonicalDistinct : 0;

  const deltaClassification = {
    sourceOnly: {
      count: sourceOnlyCount,
      classification:
        sourceOnlyCount === 0
          ? "none"
          : sourceArtifactExists
            ? "requires_source_only_loadability_adjudication"
            : "cannot_adjudicate_without_raw_source_artifact",
      sample: postRepairCounty.sourceOnlySample ?? []
    },
    canonicalOnly: {
      count: canonicalOnlyCount,
      classification:
        canonicalOnlyCount === 0
          ? "none"
          : sourceArtifactExists
            ? "requires_stale_or_filter_gap_adjudication"
            : "cannot_adjudicate_without_raw_source_artifact",
      sample: postRepairCounty.canonicalOnlySample ?? []
    },
    duplicateNullSemantics: {
      status: sourceArtifactExists ? "requires_source_artifact_parser" : "not_rerunnable_without_raw_source_artifact",
      liveCanonicalDuplicateGroups: dbSnapshot.activeDuplicateGroups,
      sourceNullOrBlank: null,
      sourceDuplicateGroups: null
    }
  };

  const boundedCorrectionPlan = fullIdentityClosed
    ? null
    : {
        planStatus: "required_before_receipt_conversion",
        allowedMutation: false,
        productionBindingAllowed: false,
        steps: [
          "Recover or recapture Yakima source-native parcel identifier artifact and receipt.",
          "Recompute source duplicate/null semantics from raw artifact.",
          "Probe/classify the 3,360 canonical-only identifiers as stale, source-filtered, or import artifacts.",
          "Classify the 100 source-only identifiers as loadable identity rows, source drift, or capture artifacts.",
          "Only after classification, create a bounded no-delete correction dry-run if needed.",
          "Do not convert Yakima to WA_INITIAL_SEED receipt posture until source/canonical parity is proven."
        ],
        proposedCorrectionClasses: {
          sourceOnly: sourceOnlyCount,
          canonicalOnly: canonicalOnlyCount,
          canonicalDuplicateGroups: dbSnapshot.activeDuplicateGroups
        }
      };

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Yakima County",
    fips: YAKIMA_FIPS,
    status,
    receiptConverted: fullIdentityClosed,
    productionBindingAllowed: false,
    certificationAllowed: false,
    sourceParcelIdField: repairCounty?.sourceParcelIdField ?? "AssessorNumber",
    liveDbSnapshot: dbSnapshot,
    postRepairIdentityOverlap: {
      sourceDistinct,
      canonicalDistinct,
      exactOverlap,
      sourceCoverageRatio,
      canonicalCoverageRatio,
      sourceOnlyCount,
      canonicalOnlyCount,
      rowCountMatches: postRepairCounty.rowCountMatches === true,
      sourceCountSemanticsAccepted: postRepairCounty.sourceCountSemanticsAccepted === true
    },
    repairProof: {
      repairCommitted: repairReceipt.committed === true,
      repairedRows: repairCounty?.repairedRows ?? null,
      repairedRowsMatch: postRepairCounty.repairedRowsMatch === true,
      legacyImportedParcelKeyPreserved: postRepairCounty.legacyImportedParcelKeyPreserved === true,
      terraFusionParcelKeyPopulated: postRepairCounty.terraFusionParcelKeyPopulated === true
    },
    deltaClassification,
    boundedCorrectionPlan,
    receipt: fullIdentityClosed
      ? {
          receiptVersion: "wa_initial_seed_post_repair_v1",
          countyName: "Yakima County",
          fips: YAKIMA_FIPS,
          sourceClass: "WA_INITIAL_SEED",
          sourceParcelIdField: repairCounty?.sourceParcelIdField ?? "AssessorNumber",
          receiptStatus: "receipt_backed_full_identity",
          productionBindingAllowed: false,
          certificationAllowed: false
        }
      : null,
    supportingArtifacts,
    blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const steps = report.boundedCorrectionPlan
    ? report.boundedCorrectionPlan.steps.map((step) => `- ${step}`).join("\n")
    : "- none";

  return `# Yakima Receipt Closure

Generated: ${report.generatedAt}

## Verdict

- Status: ${report.status}
- Receipt converted: ${report.receiptConverted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Live Canonical Snapshot

| Metric | Value |
| --- | ---: |
| Active rows | ${report.liveDbSnapshot.activeRows} |
| Active distinct parcel numbers | ${report.liveDbSnapshot.activeDistinct} |
| Identity repair receipt rows | ${report.liveDbSnapshot.identityRepairReceiptRows} |
| Superseded rows | ${report.liveDbSnapshot.supersededRows} |
| Active duplicate groups | ${report.liveDbSnapshot.activeDuplicateGroups} |

## Post-Repair Identity Overlap

| Metric | Value |
| --- | ---: |
| Source distinct | ${report.postRepairIdentityOverlap.sourceDistinct} |
| Canonical distinct | ${report.postRepairIdentityOverlap.canonicalDistinct} |
| Exact overlap | ${report.postRepairIdentityOverlap.exactOverlap} |
| Source-only | ${report.postRepairIdentityOverlap.sourceOnlyCount} |
| Canonical-only | ${report.postRepairIdentityOverlap.canonicalOnlyCount} |

## Delta Classification

- Source-only classification: ${report.deltaClassification.sourceOnly.classification}
- Canonical-only classification: ${report.deltaClassification.canonicalOnly.classification}
- Duplicate/null semantics: ${report.deltaClassification.duplicateNullSemantics.status}

## Required Plan

${steps}

## Blockers

${blockers}
`;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    postRepairClosure: args.get("post-repair-closure") ?? DEFAULT_POST_REPAIR_CLOSURE,
    repairReceipt: args.get("repair-receipt") ?? DEFAULT_REPAIR_RECEIPT,
    canonicalExport: args.get("canonical-export") ?? DEFAULT_CANONICAL_EXPORT,
    sourceReceipt: args.get("source-receipt") ?? DEFAULT_EXPECTED_SOURCE_RECEIPT,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const dockerContainer = args.get("docker-container") ?? "terrafusion-postgres-dev";
  const database = args.get("database") ?? "terrafusion";
  const user = args.get("user") ?? "postgres";

  const postRepairClosure = readJson(paths.postRepairClosure);
  const postRepairCounty = findCounty(postRepairClosure);
  if (!postRepairCounty) throw new Error("Yakima County 53077 not found in post-repair closure evidence.");

  const supportingArtifacts = [
    artifact(paths.postRepairClosure),
    artifact(paths.repairReceipt),
    artifact(paths.canonicalExport),
    artifact(paths.sourceReceipt)
  ];
  const report = buildYakimaReceiptClosure({
    postRepairCounty,
    repairReceipt: readJson(paths.repairReceipt),
    dbSnapshot: buildYakimaDbSnapshot({ dockerContainer, database, user }),
    sourceReceiptExists: fs.existsSync(paths.sourceReceipt),
    sourceArtifactExists: fs.existsSync(paths.sourceReceipt),
    supportingArtifacts
  });

  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  writeJson(path.join(paths.outRoot, "bounded-correction-plan.json"), report.boundedCorrectionPlan ?? {});

  console.log(`Yakima receipt closure written: ${relativePath(paths.outJson)}`);
  console.log(`Status: ${report.status}`);
  console.log(`Receipt converted: ${report.receiptConverted ? "yes" : "no"}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.error(error.stdout);
    process.exit(1);
  });
}

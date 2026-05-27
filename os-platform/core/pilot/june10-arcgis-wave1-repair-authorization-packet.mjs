#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-dry-run.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-authorization-packet.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-authorization-packet.latest.md"
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

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
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

export function forbiddenClaims() {
  return [
    "no_production_binding",
    "no_certification_claim",
    "no_runtime_promotion",
    "no_workflow_complete_claims",
    "no_garfield_repair",
    "no_deletes"
  ];
}

export function requiredCountyArtifacts(row) {
  return {
    sourceArtifact: {
      path: row.receiptCandidate?.sourceArtifact?.path ?? null,
      sha256: row.receiptCandidate?.sourceArtifact?.sha256 ?? null
    },
    dryRun: {
      sha256: row.validation?.proposedRowsSha256 ?? null
    },
    proposedRows: {
      path: row.artifacts?.proposedRowsPath ?? null,
      sha256: row.artifacts?.proposedRowsSha256 ?? null
    },
    repairReceiptCandidate: {
      path: row.artifacts?.repairReceiptCandidatePath ?? null,
      sha256: row.artifacts?.repairReceiptCandidateSha256 ?? null
    },
    rollbackPlan: {
      path: row.artifacts?.rollbackPlanPath ?? null,
      sha256: row.artifacts?.rollbackPlanSha256 ?? null
    }
  };
}

function artifactHashesPresent(artifacts) {
  return Object.values(artifacts).every((artifact) => artifact?.sha256 && (artifact.path || artifact === artifacts.dryRun));
}

export function evaluateAuthorizationState({ repairDryRuns, garfieldAdjudication }) {
  const blockers = [];
  if (!Array.isArray(repairDryRuns) || repairDryRuns.length === 0) blockers.push("No repair dry-run counties supplied.");
  for (const row of repairDryRuns ?? []) {
    if (row.classification !== "repair_dry_run_ready_for_authorization") {
      blockers.push(`${row.county} classification is ${row.classification}.`);
    }
    if ((row.validation?.duplicateCountyIdParcelNumberAfter ?? 1) !== 0) {
      blockers.push(`${row.county} has duplicate target ParcelNumber groups.`);
    }
    if ((row.validation?.missingSourceMappings ?? 1) !== 0) {
      blockers.push(`${row.county} has missing PARCEL_ID_NR source mappings.`);
    }
    if ((row.validation?.blankProposedParcelNumbers ?? 1) !== 0) {
      blockers.push(`${row.county} has blank proposed ParcelNumber values.`);
    }
    if (row.doctrine?.databaseMutationAttempted !== false) blockers.push(`${row.county} dry-run doctrine does not prove no mutation.`);
    if (row.blockers?.length) blockers.push(`${row.county} still has blockers: ${row.blockers.join("; ")}`);
    if (!artifactHashesPresent(requiredCountyArtifacts(row))) blockers.push(`${row.county} is missing required artifact hashes.`);
  }
  if (garfieldAdjudication && garfieldAdjudication.repairAllowed !== false) {
    blockers.push("Garfield repair is not explicitly excluded.");
  }

  return {
    state: blockers.length === 0 ? "READY_FOR_HUMAN_DECISION" : "BLOCKED",
    executionEnabled: false,
    blockers
  };
}

function countyPacket(row) {
  return {
    county: row.county,
    fips: row.fips,
    proposedRows: row.validation.proposedRows,
    duplicateCountyIdParcelNumberAfter: row.validation.duplicateCountyIdParcelNumberAfter,
    missingSourceMappings: row.validation.missingSourceMappings,
    blankProposedParcelNumbers: row.validation.blankProposedParcelNumbers,
    sourceNativeField: "ORIG_PARCEL_ID",
    preservedPrefixedField: "PARCEL_ID_NR",
    repairSemantics: {
      setParcelNumberFrom: "ORIG_PARCEL_ID",
      preserveCurrentCanonicalValueAs: "LegacyImportedParcelKey",
      generateTerraFusionParcelKey: `${row.fips}:{ORIG_PARCEL_ID}`,
      deleteRows: false
    },
    artifacts: requiredCountyArtifacts(row)
  };
}

export function buildAuthorizationPacket({ dryRun }) {
  const includedRows = dryRun.repairDryRuns ?? [];
  const state = evaluateAuthorizationState({
    repairDryRuns: includedRows,
    garfieldAdjudication: dryRun.garfieldAdjudication
  });
  const countiesIncluded = includedRows.map(countyPacket);
  const excludedCounties = dryRun.garfieldAdjudication
    ? [
        {
          county: "Garfield",
          fips: "53023",
          reason:
            dryRun.garfieldAdjudication?.classification ??
            "excluded_until_blank_source_native_parcel_policy_is_decided"
        }
      ]
    : [];
  const waveLabel = dryRun.waveLabel ?? "Wave 1";
  return {
    generatedAt: new Date().toISOString(),
    sourceDryRunGeneratedAt: dryRun.generatedAt ?? null,
    waveLabel,
    waveId: dryRun.waveId ?? "wave1",
    scope: {
      name: `ArcGIS ${waveLabel} source-native identity repair authorization packet.`,
      countiesIncluded: countiesIncluded.map((row) => ({ county: row.county, fips: row.fips })),
      countiesExcluded: excludedCounties
    },
    state: state.state,
    executionEnabled: false,
    approvalRequired: true,
    summary: {
      countiesIncluded: countiesIncluded.length,
      proposedRows: includedRows.reduce((sum, row) => sum + (row.validation?.proposedRows ?? 0), 0),
      duplicateCountyIdParcelNumberAfter: includedRows.reduce(
        (sum, row) => sum + (row.validation?.duplicateCountyIdParcelNumberAfter ?? 0),
        0
      ),
      dryRunHash:
        dryRun.repairDryRuns
          ?.map((row) => row.validation?.proposedRowsSha256)
          .filter(Boolean)
          .join(":") ?? null
    },
    counties: countiesIncluded,
    receiptFormat: {
      receiptVersion: "arcgis_wave1_source_native_identity_repair_authorization_v1",
      requiredFields: [
        "county",
        "fips",
        "sourceArtifact.sha256",
        "proposedRows.sha256",
        "repairReceiptCandidate.sha256",
        "rollbackPlan.sha256",
        "postRepairAudit"
      ]
    },
    postRepairAuditCommands: [
      "verify CountyId + ParcelNumber duplicate groups = 0 for each repaired county",
      "verify LegacyImportedParcelKey preserves previous PARCEL_ID_NR values",
      "verify TerraFusionParcelKey is populated as FIPS:ORIG_PARCEL_ID",
      `rerun ArcGIS ${waveLabel} source capture comparison`,
      "rerun WA_INITIAL_SEED receipt reconciliation",
      "rerun production DB binding plan; production binding must remain blocked until all required receipt posture is acceptable"
    ],
    stopConditions: [
      "Stop if any artifact hash differs from this packet.",
      "Stop if source capture evidence is regenerated before execution.",
      "Stop if dry-run evidence is regenerated before execution.",
      "Stop if worktree contains unrelated changes.",
      "Stop if tests or type-check fail.",
      "Stop if backup snapshot cannot be created.",
      "Stop if transaction cannot run as one bounded unit.",
      "Stop if post-repair duplicate groups are not zero.",
      "Stop if Garfield is accidentally included."
    ],
    forbiddenClaims: forbiddenClaims(),
    blockers: state.blockers,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function renderMarkdown(packet) {
  const rows = packet.counties
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.proposedRows} | ${row.duplicateCountyIdParcelNumberAfter} | ${row.artifacts.sourceArtifact.sha256 ?? "-"} | ${row.artifacts.proposedRows.sha256 ?? "-"} |`
    )
    .join("\n");
  return `# ArcGIS ${packet.waveLabel} Repair Authorization Packet

Generated: ${packet.generatedAt}

## Decision State

- State: ${packet.state}
- Execution enabled: ${packet.executionEnabled ? "yes" : "no"}
- Approval required: ${packet.approvalRequired ? "yes" : "no"}
- Database mutation attempted: ${packet.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${packet.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${packet.certificationAllowed ? "yes" : "no"}

## Scope

- Included counties: ${packet.scope.countiesIncluded.map((county) => `${county.county} ${county.fips}`).join(", ")}
- Excluded counties: ${packet.scope.countiesExcluded.map((county) => `${county.county} ${county.fips}: ${county.reason}`).join(", ")}

## Summary

- Proposed rows: ${packet.summary.proposedRows}
- Duplicate groups after projected repair: ${packet.summary.duplicateCountyIdParcelNumberAfter}
- Dry-run hash: ${packet.summary.dryRunHash}

## County Matrix

| County | FIPS | Proposed rows | Duplicate groups after | Source hash | Proposed rows hash |
| --- | --- | ---: | ---: | --- | --- |
${rows}

## Post-Repair Audit Commands

${packet.postRepairAuditCommands.map((command) => `- ${command}`).join("\n")}

## Stop Conditions

${packet.stopConditions.map((condition) => `- ${condition}`).join("\n")}

## Forbidden Claims

${packet.forbiddenClaims.map((claim) => `- ${claim}`).join("\n")}

## Blockers

${packet.blockers.length ? packet.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None"}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    dryRun: args.get("dry-run") ?? DEFAULT_DRY_RUN,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    waveLabel: args.get("wave-label") ?? null
  };
  const dryRun = readJson(paths.dryRun);
  if (paths.waveLabel) dryRun.waveLabel = paths.waveLabel;
  const packet = buildAuthorizationPacket({ dryRun });
  writeJson(paths.outJson, packet);
  writeText(paths.outMd, renderMarkdown(packet));
  console.log(`ArcGIS ${packet.waveLabel} repair authorization packet written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`State: ${packet.state}`);
  console.log(`Execution enabled: ${packet.executionEnabled ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_EVIDENCE_DIR = path.resolve(
  'os-platform',
  'core',
  'pilot',
  'evidence'
);

const ACCEPTED_SOURCE_PACKAGE_TYPES = [
  'csv',
  'txt',
  'xlsx',
  'fgdb_directory',
  'zipped_fgdb',
  'zip_generic',
];

const STAGING_STATES = [
  'UPLOADED',
  'VALIDATING',
  'VALIDATED',
  'PENDING_APPROVAL',
  'APPROVED_FOR_IMPORT',
  'REJECTED',
];

const WORKFLOW = [
  'county/FIPS binding',
  'SHA-256 receipt',
  'file safety screening',
  'no-secret scan',
  'schema validation',
  'rejected-row report',
  'dry-run import report',
  'reviewer approval stub',
];

const FORBIDDEN_CLAIMS = [
  'County Data Intake is production import.',
  'Uploaded files become live immediately.',
  'The intake lane mutates TerraFusion DB.',
  'All counties can upload and operate live on June 10.',
];

export function buildCountyDataIntakePosture(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const packet = {
    generatedAt,
    verdict: 'J10_COUNTY_DATA_INTAKE_MVP_POSTURE_LOCKED',
    status: 'DESIGN_MVP_GOVERNED_INTAKE_MODEL',
    june10Role:
      'Governed onboarding lane for counties that begin with assessor exports, GIS packages, spreadsheets, or source packets instead of direct legacy database connectivity.',
    canonicalImportAllowed: false,
    productionMutationAllowed: false,
    productionDbBindingChangeAllowed: false,
    syncProductClaimAllowed: false,
    runtimeClaimAllowed: false,
    runtimePromotionRule:
      'validated_data_must_be_promoted_into_terrafusion_db_and_pass_api_proof_gates',
    june10OperatingModel: [
      {
        id: 'runtime_lane',
        name: 'Runtime Lane',
        scope: 'Benton County runtime pilot',
        claim: 'TerraFusion DB/API-backed operational snapshot',
        status: 'Runtime proof lane',
      },
      {
        id: 'sovereignty_lane',
        name: 'Sovereignty Lane',
        scope: 'All 39 Washington counties',
        claim: 'County identity, role context, source posture, and readiness state',
        status: 'Launch posture lane',
      },
      {
        id: 'provenance_onboarding_lane',
        name: 'Provenance / Onboarding Lane',
        scope: '38 non-Benton counties',
        claim: 'Source discovery, public/ArcGIS posture, and readiness inventory',
        status: 'No runtime claim without county-specific DB/API proof',
      },
      {
        id: 'county_data_intake_lane',
        name: 'County Data Intake Lane',
        scope: 'Assessor-provided exports and governed upload packages',
        claim: 'Receipt, validation, rejected rows, dry-run report, and approval boundary',
        status: 'Design/MVP lane only',
      },
    ],
    acceptedSourcePackageTypes: ACCEPTED_SOURCE_PACKAGE_TYPES,
    requiredWorkflow: WORKFLOW,
    stagingStates: STAGING_STATES,
    evidencePathTemplate: 'os-platform/core/pilot/evidence/county-data-intake/<intakeId>/',
    visibleLabels: [
      'Intake MVP',
      'Dry Run Only',
      'Not Runtime Enabled',
      'Future Canonical Import Required',
    ],
    proofRequirements: [
      'receipt schema exists',
      'dry-run report declares canonicalImportAllowed: false',
      'secret-like files rejected by spec',
      'county/FIPS conflict rejects intake',
      'approval does not imply DB mutation',
    ],
    forbiddenClaims: FORBIDDEN_CLAIMS,
    finalClaimSheetAddition:
      'For counties without direct legacy DB access, TerraFusion defines a governed County Data Intake Lane for assessor-provided exports, GIS packages, spreadsheets, and source packets. The MVP creates receipts, validates county/FIPS binding, screens unsafe material, produces rejected-row and dry-run reports, and requires human approval. It does not write to canonical production tables.',
  };

  packet.packetHash = hashPacket(packet);
  return packet;
}

export function writeCountyDataIntakePosture(options = {}) {
  const outDir = options.outDir ?? DEFAULT_EVIDENCE_DIR;
  const packet = buildCountyDataIntakePosture(options);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'j10-county-data-intake-posture.latest.json');
  const mdPath = path.join(outDir, 'j10-county-data-intake-posture.latest.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(packet));

  return {
    packet,
    packetHash: packet.packetHash,
    jsonPath,
    mdPath,
  };
}

function hashPacket(packet) {
  const hashable = { ...packet };
  delete hashable.packetHash;
  return crypto.createHash('sha256').update(JSON.stringify(hashable)).digest('hex');
}

function renderMarkdown(packet) {
  const laneRows = packet.june10OperatingModel
    .map(lane => `| ${lane.name} | ${lane.scope} | ${lane.status} |`)
    .join('\n');
  const formats = packet.acceptedSourcePackageTypes.map(format => `- ${format}`).join('\n');
  const forbidden = packet.forbiddenClaims.map(claim => `- ${claim}`).join('\n');

  return `# County Data Intake MVP Posture

- Generated: ${packet.generatedAt}
- Verdict: ${packet.verdict}
- Status: ${packet.status}
- Packet hash: ${packet.packetHash}

## Boundary

- canonicalImportAllowed: ${packet.canonicalImportAllowed}
- Production mutation allowed: ${packet.productionMutationAllowed}
- Production DB binding change allowed: ${packet.productionDbBindingChangeAllowed}
- Sync product claim allowed: ${packet.syncProductClaimAllowed}
- Runtime claim allowed: ${packet.runtimeClaimAllowed}
- No production DB mutation.

Proof command:

\`\`\`bash
node os-platform/core/pilot/j10-county-data-intake-posture.mjs
\`\`\`

## June 10 Role

${packet.june10Role}

## Four-Lane Model

| Lane | Scope | Status |
| --- | --- | --- |
${laneRows}

## Accepted Source Package Types

${formats}

## Runtime Promotion Rule

${packet.runtimePromotionRule}

## Forbidden Claims

${forbidden}

## Final Claim Sheet Addition

${packet.finalClaimSheetAddition}
`;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const result = writeCountyDataIntakePosture();
  console.log(
    JSON.stringify(
      {
        verdict: result.packet.verdict,
        status: result.packet.status,
        canonicalImportAllowed: result.packet.canonicalImportAllowed,
        packetHash: result.packetHash,
        jsonPath: path.relative(process.cwd(), result.jsonPath).replaceAll('\\', '/'),
        mdPath: path.relative(process.cwd(), result.mdPath).replaceAll('\\', '/'),
      },
      null,
      2
    )
  );
}

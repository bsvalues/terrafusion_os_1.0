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

const ROLES = [
  'Assessor',
  'Appraiser',
  'GIS Tech',
  'Admin',
  'Auditor Read-Only',
  'Treasurer Read-Only',
  'Clerk Read-Only',
];

const FORBIDDEN_CLAIMS = [
  'All counties are live.',
  'All counties are certified.',
  'Hostinger is connected to PACS.',
  'TerraFusion Sync is fully productized.',
  'AI valuations are official.',
  'Unfinished modules are production-ready.',
];

const COUNTY_NAMES = [
  ['001', 'Adams County'],
  ['003', 'Asotin County'],
  ['005', 'Benton County'],
  ['007', 'Chelan County'],
  ['009', 'Clallam County'],
  ['011', 'Clark County'],
  ['013', 'Columbia County'],
  ['015', 'Cowlitz County'],
  ['017', 'Douglas County'],
  ['019', 'Ferry County'],
  ['021', 'Franklin County'],
  ['023', 'Garfield County'],
  ['025', 'Grant County'],
  ['027', 'Grays Harbor County'],
  ['029', 'Island County'],
  ['031', 'Jefferson County'],
  ['033', 'King County'],
  ['035', 'Kitsap County'],
  ['037', 'Kittitas County'],
  ['039', 'Klickitat County'],
  ['041', 'Lewis County'],
  ['043', 'Lincoln County'],
  ['045', 'Mason County'],
  ['047', 'Okanogan County'],
  ['049', 'Pacific County'],
  ['051', 'Pend Oreille County'],
  ['053', 'Pierce County'],
  ['055', 'San Juan County'],
  ['057', 'Skagit County'],
  ['059', 'Skamania County'],
  ['061', 'Snohomish County'],
  ['063', 'Spokane County'],
  ['065', 'Stevens County'],
  ['067', 'Thurston County'],
  ['069', 'Wahkiakum County'],
  ['071', 'Walla Walla County'],
  ['073', 'Whatcom County'],
  ['075', 'Whitman County'],
  ['077', 'Yakima County'],
];

const PROVENANCE_INVENTORY_COUNTIES = new Set([
  '011',
  '015',
  '033',
  '035',
  '061',
  '063',
  '067',
  '073',
]);

const SOURCE_POSTURE_BY_FIPS = new Map([
  ['005', 'PACS-derived'],
  ['011', 'ArcGIS/public'],
  ['015', 'ArcGIS/public'],
  ['033', 'ArcGIS/public'],
  ['035', 'ArcGIS/public'],
  ['061', 'ArcGIS/public'],
  ['063', 'ArcGIS/public'],
  ['067', 'ArcGIS/public'],
  ['073', 'ArcGIS/public'],
  ['077', 'assessor export pending'],
]);

export function buildCountySovereigntyShellPosture(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const countyRegistry = COUNTY_NAMES.map(([fips, name]) => buildCountyRecord(fips, name));

  const packet = {
    generatedAt,
    verdict: 'J10_COUNTY_SOVEREIGNTY_SHELL_POSTURE_LOCKED',
    status: 'LAUNCH_POSTURE_MODEL',
    june10Claim:
      'TerraFusion launches the Washington county operating model: sovereign county workspaces, Benton runtime proof, and non-Benton onboarding/provenance posture.',
    runtimeTruth: 'TerraFusion DB -> TerraFusion API -> TerraFusion apps',
    sourceTruth:
      'PACS / Proval / Ascend / ArcGIS / public sources -> constrained ingestion / validation -> TerraFusion DB',
    productionReadiness: false,
    statewideCertificationReady: false,
    runtimeCountyCount: countyRegistry.filter(county => county.mode === 'runtime_pilot').length,
    onboardingOrProvenanceCountyCount: countyRegistry.filter(
      county => county.mode !== 'runtime_pilot'
    ).length,
    roles: ROLES,
    topBarContract: {
      requiredFields: ['countyName', 'role', 'departmentContext', 'readinessStatus'],
      exampleRuntime: 'Benton County | Assessment | Assessor | Runtime Pilot',
      exampleOnboarding: 'Yakima County | Assessment | Assessor | Onboarding',
    },
    routeGateRules: [
      {
        scope: 'Benton County',
        rule: 'runtime pilot operations allowed only where TerraFusion DB/API proof exists',
      },
      {
        scope: 'Non-Benton counties',
        rule: 'runtime operations blocked and routed to onboarding/provenance surfaces',
      },
      {
        scope: 'All counties',
        rule: 'county context must come from active session/context, not hardcoded Benton values',
      },
    ],
    visibleLabels: [
      'Runtime Pilot',
      'Onboarding',
      'Provenance Inventory',
      'Not Runtime Enabled',
      'Snapshot Runtime Only',
    ],
    countyRegistry,
    forbiddenClaims: FORBIDDEN_CLAIMS,
    finalClaimSheet:
      'TerraFusion launches the Washington county operating model. Each county is represented as a sovereign jurisdictional workspace with its own identity, role context, source posture, and readiness state. Benton County is the first runtime-proven county, backed by TerraFusion DB/API and PACS-derived source provenance. The other Washington counties are represented in onboarding/provenance mode until promoted by county-specific TerraFusion DB/API runtime proof. The runtime path is TerraFusion DB -> TerraFusion API -> TerraFusion apps.',
  };

  packet.packetHash = hashPacket(packet);
  return packet;
}

export function writeCountySovereigntyShellPosture(options = {}) {
  const outDir = options.outDir ?? DEFAULT_EVIDENCE_DIR;
  const packet = buildCountySovereigntyShellPosture(options);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'j10-county-sovereignty-shell-posture.latest.json');
  const mdPath = path.join(outDir, 'j10-county-sovereignty-shell-posture.latest.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(packet));

  return {
    packet,
    packetHash: packet.packetHash,
    jsonPath,
    mdPath,
  };
}

function buildCountyRecord(fips, name) {
  const slug = name
    .replace(' County', '')
    .toLowerCase()
    .replaceAll(' ', '-');

  if (fips === '005') {
    return {
      fips,
      slug,
      name,
      mode: 'runtime_pilot',
      readinessStatus: 'Runtime Pilot',
      sourcePosture: 'PACS-derived',
      runtimeOperationsAllowed: true,
      runtimeGate: 'allowed_where_terrafusion_db_api_proof_exists',
      runtimePath: 'TerraFusion DB -> TerraFusion API -> TerraFusion apps',
      sourceSystemRuntimeDependencyAllowed: false,
      landingSurface: 'Property Workbench',
    };
  }

  const mode = PROVENANCE_INVENTORY_COUNTIES.has(fips)
    ? 'provenance_inventory'
    : 'onboarding';

  return {
    fips,
    slug,
    name,
    mode,
    readinessStatus: mode === 'provenance_inventory' ? 'Provenance Inventory' : 'Onboarding',
    sourcePosture: SOURCE_POSTURE_BY_FIPS.get(fips) ?? 'unknown',
    runtimeOperationsAllowed: false,
    runtimeGate: 'blocked_until_county_specific_db_api_proof',
    runtimePath: null,
    sourceSystemRuntimeDependencyAllowed: false,
    landingSurface: 'County onboarding/provenance workspace',
  };
}

function hashPacket(packet) {
  const hashable = { ...packet };
  delete hashable.packetHash;
  return crypto.createHash('sha256').update(JSON.stringify(hashable)).digest('hex');
}

function renderMarkdown(packet) {
  const countyRows = packet.countyRegistry
    .map(
      county =>
        `| ${county.fips} | ${county.name} | ${county.readinessStatus} | ${county.sourcePosture} | ${county.runtimeGate} |`
    )
    .join('\n');
  const labels = packet.visibleLabels.map(label => `- ${label}`).join('\n');
  const forbidden = packet.forbiddenClaims.map(claim => `- ${claim}`).join('\n');

  return `# County Sovereignty Shell Posture

- Generated: ${packet.generatedAt}
- Verdict: ${packet.verdict}
- Status: ${packet.status}
- Packet hash: ${packet.packetHash}

## June 10 Claim

${packet.june10Claim}

## Runtime Truth

${packet.runtimeTruth}

## Source Truth

${packet.sourceTruth}

PACS is provenance for Benton. PACS is not a Hostinger runtime dependency and not the June 10 product story.

Proof command:

\`\`\`bash
node os-platform/core/pilot/j10-county-sovereignty-shell-posture.mjs
\`\`\`

## Top Bar Contract

- Runtime example: ${packet.topBarContract.exampleRuntime}
- Onboarding example: ${packet.topBarContract.exampleOnboarding}

## County Registry

| FIPS | County | Status | Source posture | Runtime gate |
| --- | --- | --- | --- | --- |
${countyRows}

## Visible Labels

${labels}

## Forbidden Claims

${forbidden}

## Final Claim Sheet

${packet.finalClaimSheet}
`;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const result = writeCountySovereigntyShellPosture();
  console.log(
    JSON.stringify(
      {
        verdict: result.packet.verdict,
        status: result.packet.status,
        runtimeCountyCount: result.packet.runtimeCountyCount,
        onboardingOrProvenanceCountyCount:
          result.packet.onboardingOrProvenanceCountyCount,
        packetHash: result.packetHash,
        jsonPath: path.relative(process.cwd(), result.jsonPath).replaceAll('\\', '/'),
        mdPath: path.relative(process.cwd(), result.mdPath).replaceAll('\\', '/'),
      },
      null,
      2
    )
  );
}

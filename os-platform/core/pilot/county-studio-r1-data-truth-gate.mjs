#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_OUT_JSON = path.join(
  DEFAULT_REPO_ROOT,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-truth-gate.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  DEFAULT_REPO_ROOT,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-truth-gate.md"
);
const DEFAULT_AUTHORITATIVE_MANIFEST = path.join(
  DEFAULT_REPO_ROOT,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-authoritative-data-manifest.json"
);

export const REQUIRED_PROOF_AREAS = [
  "study list",
  "selected study",
  "countyId",
  "taxYear",
  "parcel/property source",
  "parcel geometry source",
  "neighborhoods",
  "market areas",
  "model groups",
  "value tiers",
  "county segments",
  "taxing districts",
  "comparable sales",
  "CAMA characteristics",
  "PACS valuation",
  "ratio study population",
  "risk objects",
  "ledger rows",
  "inspector details",
  "map overlays",
  "Atlas layers",
  "TerraForge statistics API",
  "SignalR payloads"
];

const PRIMARY_BLOCKING_CLASSIFICATIONS = new Set([
  "SYNC_DERIVED",
  "SEEDED",
  "FIXTURE",
  "MOCK",
  "GENERATED",
  "FALLBACK",
  "UNKNOWN"
]);

function readText(repoRoot, relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch {
    return "";
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function rel(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function walkFiles(root, predicate, limit = 400) {
  const files = [];
  if (!fs.existsSync(root)) return files;

  const stack = [root];
  while (stack.length > 0 && files.length < limit) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!["bin", "obj", "node_modules", ".git", "__tests__", "publish", "Seeds"].includes(entry.name)) {
          stack.push(fullPath);
        }
      } else if (predicate(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function readMatchedFiles(repoRoot, roots) {
  const parts = [];
  for (const { root, predicate } of roots) {
    const absRoot = path.join(repoRoot, root);
    for (const file of walkFiles(absRoot, predicate)) {
      parts.push(`\n/* ${rel(repoRoot, file)} */\n${fs.readFileSync(file, "utf8")}`);
    }
  }
  return parts.join("\n");
}

function buildSourceContext(repoRoot, authoritativeManifestPath) {
  const atlasLiveApi = readText(
    repoRoot,
    "frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts"
  );
  const atlasHook = readText(
    repoRoot,
    "frontend/apps/os-shell/src/pages/forge/atlas-live/hooks/useAtlasMapData.ts"
  );
  const countyStudioFrontend = readMatchedFiles(repoRoot, [
    {
      root: "frontend/apps/os-shell/src/pages/forge/county-studio",
      predicate: (file) => /\.(ts|tsx)$/.test(file)
    }
  ]);
  const backendCountyStudy = readMatchedFiles(repoRoot, [
    {
      root: "backend/src/TerraFusion.API",
      predicate: (file) => /CountyStudy|CountyStudio|TerraForge|CountyStudyHub/i.test(path.basename(file))
        && /\.(cs|ts|js)$/.test(file)
    }
  ]);
  const productionProofPath = path.join(
    repoRoot,
    "os-platform/core/pilot/evidence/county-studio-r1-production-proof.latest.json"
  );
  const productionProof = readJson(productionProofPath);
  const authoritativeManifest = readJson(authoritativeManifestPath);

  return {
    atlasLiveApi,
    atlasHook,
    countyStudioFrontend,
    backendCountyStudy,
    productionProof,
    productionProofPath,
    authoritativeManifest,
    authoritativeManifestPath,
    allText: [
      atlasLiveApi,
      atlasHook,
      countyStudioFrontend,
      backendCountyStudy,
      JSON.stringify(productionProof ?? {}, null, 2),
      JSON.stringify(authoritativeManifest ?? {}, null, 2)
    ].join("\n")
  };
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function manifestArea(authoritativeManifest, area) {
  return authoritativeManifest?.proofAreas?.find?.((entry) => entry.area === area) ?? null;
}

function authoritativeAreaFromManifest(authoritativeManifest, area) {
  const entry = manifestArea(authoritativeManifest, area);
  if (!entry) return null;
  if (entry.classification !== "AUTHORITATIVE") return null;
  if (entry.operationalProofApproved !== true) return null;
  return {
    area,
    classification: "AUTHORITATIVE",
    productionProofAllowed: true,
    reason: entry.reason ?? "Authoritative manifest approved this proof area for operational use.",
    evidence: {
      manifestContract: authoritativeManifest.contractId ?? null,
      sourceSystem: entry.sourceSystem ?? null,
      expectedCount: entry.expectedCount ?? null,
      observedCount: entry.observedCount ?? null
    }
  };
}

function classifyArea(area, context) {
  const authoritative = authoritativeAreaFromManifest(context.authoritativeManifest, area);
  if (authoritative) return authoritative;

  const text = context.allText;
  const compatibilityGeometry = hasAny(text, [
    /fetchAtlasCompatibilityMapData/,
    /fetchGeoForgeCompatibilityOutlines/,
    /fetchGeoForgeCompatibilityParcels/,
    /geometryAvailability['":\s]+compatibility/i,
    /compatibility geometry/i,
    /compatibility map feed/i
  ]);
  const syncDerived = hasAny(text, [
    /sync-derived/i,
    /production_provisional/i,
    /Converted Legacy Sensitive/i,
    /TerraFusion\.Benton\.LegacyBridge/i,
    /local_pacs_mirror/i
  ]);
  const canonicalTables = hasAny(text, [
    /Properties/i,
    /CamaCharacteristics/i,
    /ComparableSales/i,
    /PacsValuation/i,
    /CountySegments/i
  ]);
  const generatedRisk = hasAny(text, [
    /riskObjectCount/i,
    /risk ledger/i,
    /Unified Risk Ledger/i,
    /generate.*risk/i,
    /derive.*risk/i
  ]);

  if (["parcel geometry source", "Atlas layers", "map overlays"].includes(area) && compatibilityGeometry) {
    const source = area === "parcel geometry source" ? "GeoForge compatibility geometry" : "Atlas compatibility geometry";
    return {
      area,
      classification: "FALLBACK",
      productionProofAllowed: false,
      reason: `${area} is served through ${source}; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.`,
      evidence: {
        tokens: [
          "fetchAtlasCompatibilityMapData",
          "fetchGeoForgeCompatibilityOutlines",
          "fetchGeoForgeCompatibilityParcels"
        ]
      }
    };
  }

  if (["neighborhoods", "taxing districts", "county segments"].includes(area) && compatibilityGeometry) {
    return {
      area,
      classification: "FALLBACK",
      productionProofAllowed: false,
      reason: `${area} are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry.`,
      evidence: { geometryAvailability: "compatibility" }
    };
  }

  if (["risk objects", "ledger rows", "inspector details"].includes(area)) {
    return {
      area,
      classification: generatedRisk ? "GENERATED" : "UNKNOWN",
      productionProofAllowed: false,
      reason: generatedRisk
        ? `${area} are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.`
        : `${area} provenance is unknown.`,
      evidence: { generatedRiskSignalsPresent: generatedRisk }
    };
  }

  if (["parcel/property source", "comparable sales", "CAMA characteristics", "PACS valuation", "ratio study population", "TerraForge statistics API"].includes(area)) {
    return {
      area,
      classification: syncDerived || canonicalTables ? "SYNC_DERIVED" : "UNKNOWN",
      productionProofAllowed: false,
      reason: canonicalTables
        ? `${area} uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.`
        : `${area} does not have authoritative source/count proof.`,
      evidence: {
        canonicalTablesReferenced: canonicalTables,
        syncDerivedSignalsPresent: syncDerived
      }
    };
  }

  if (["study list", "selected study"].includes(area)) {
    return {
      area,
      classification: syncDerived ? "SYNC_DERIVED" : "UNKNOWN",
      productionProofAllowed: false,
      reason: `${area} can load through County Study services, but the selected study's authoritative source package is not proven.`,
      evidence: { productionProofDecision: context.productionProof?.decision ?? null }
    };
  }

  if (area === "countyId") {
    return {
      area,
      classification: "UNKNOWN",
      productionProofAllowed: false,
      reason: "Benton countyId label is present, but identity is not proven against an authoritative Benton source manifest.",
      evidence: {
        bentonCountyIdTokenPresent: /19190019-1919-1919-1919-191919191919/.test(text)
      }
    };
  }

  if (area === "taxYear") {
    return {
      area,
      classification: "UNKNOWN",
      productionProofAllowed: false,
      reason: "Tax year appears in launch/runtime context, but no authoritative study source manifest proves the year-aligned population.",
      evidence: { taxYear2026TokenPresent: /2026/.test(text) }
    };
  }

  if (["market areas", "model groups", "value tiers"].includes(area)) {
    return {
      area,
      classification: "UNKNOWN",
      productionProofAllowed: false,
      reason: `${area} are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present.`,
      evidence: {}
    };
  }

  if (area === "SignalR payloads") {
    return {
      area,
      classification: "UNKNOWN",
      productionProofAllowed: false,
      reason: "County Studio live SignalR payload provenance is not proven for the selected Benton study context.",
      evidence: {
        countyStudyHubPathPresent: /\/hubs\/county-study/i.test(text),
        countyStudyHubRegistrationPresent: /MapHub<CountyStudyHub>/i.test(text)
      }
    };
  }

  return {
    area,
    classification: "UNKNOWN",
    productionProofAllowed: false,
    reason: `${area} is required but has no authoritative proof.`,
    evidence: {}
  };
}

function productionProofClaimFindings(context) {
  const proof = context.productionProof;
  const findings = [];
  if (!proof) {
    findings.push({
      severity: "BLOCKER",
      finding: "County Studio R1 runtime proof artifact is missing.",
      reason: "Surface runtime proof cannot be used as data truth proof."
    });
    return findings;
  }

  if (proof.status === "PASS" || /PRODUCTION_PROOF_READY/i.test(String(proof.decision ?? ""))) {
    findings.push({
      severity: "BLOCKER",
      finding: "Prior runtime proof uses production-proof language without data-truth proof.",
      reason: "The artifact proves route/render/runtime signals; it does not prove authoritative Benton data lineage."
    });
  }

  const proofText = JSON.stringify(proof);
  if (/fetchAtlasCompatibilityMapData|fetchGeoForgeCompatibility/i.test(proofText)) {
    findings.push({
      severity: "BLOCKER",
      finding: "Prior proof accepts compatibility Atlas/GeoForge geometry contracts.",
      reason: "ATLAS LIVE cannot pass a production GIS proof through compatibility geometry."
    });
  }

  return findings;
}

export function buildCountyStudioR1DataTruthReport({
  repoRoot = DEFAULT_REPO_ROOT,
  generatedAtUtc = new Date().toISOString(),
  authoritativeManifestPath = process.env.TF_COUNTY_STUDIO_DATA_TRUTH_MANIFEST
    ? path.resolve(process.env.TF_COUNTY_STUDIO_DATA_TRUTH_MANIFEST)
    : DEFAULT_AUTHORITATIVE_MANIFEST
} = {}) {
  const context = buildSourceContext(repoRoot, authoritativeManifestPath);
  const proofAreas = REQUIRED_PROOF_AREAS.map((area) => classifyArea(area, context));
  const blockedAreas = proofAreas.filter((area) =>
    PRIMARY_BLOCKING_CLASSIFICATIONS.has(area.classification)
    || area.productionProofAllowed !== true
  );
  const claimFindings = productionProofClaimFindings(context);
  const failures = [
    ...blockedAreas.map((area) => `${area.area}: ${area.reason}`),
    ...claimFindings.map((finding) => `${finding.finding}: ${finding.reason}`)
  ];
  const status = failures.length === 0 ? "DATA_TRUTH_PASS" : "DATA_TRUTH_FAIL";

  return {
    generatedAtUtc,
    gate: "county-studio-r1-data-truth",
    status,
    claims: {
      surfaceRuntimeProofOnly: true,
      productionProofAllowed: status === "DATA_TRUTH_PASS",
      operationalProofAllowed: status === "DATA_TRUTH_PASS",
      rule: "No data lineage, no production proof. No provenance, no operational claim."
    },
    requiredProofAreas: REQUIRED_PROOF_AREAS,
    proofAreas,
    claimFindings,
    failures,
    sourceArtifacts: {
      productionProof: context.productionProof ? rel(repoRoot, context.productionProofPath) : null,
      authoritativeManifest: context.authoritativeManifest
        ? rel(repoRoot, authoritativeManifestPath)
        : null
    },
    nextRequiredUnblock: [
      "Replace compatibility/provisional Atlas geometry with TerraAtlas-owned Benton geometry/layer contracts.",
      "Provide authoritative Benton source/count manifest for every primary proof area.",
      "Prove map, ledger, inspector, and statistics rows share the same countyId, taxYear, and studyId context.",
      "Rename surface runtime proof so it cannot imply data truth or operational proof."
    ],
    boundaries: [
      "This gate does not touch TerraFusion Sync.",
      "This gate does not touch DB seeding.",
      "This gate does not restart Docker/Postgres.",
      "This gate does not rewrite TerraAtlas."
    ]
  };
}

export function renderCountyStudioR1DataTruthMarkdown(report) {
  const lines = [
    "# County Studio R1 Data Truth Gate",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "No data lineage, no production proof. No provenance, no operational claim. No canonical count comparison, no Benton truth. No geometry source, no GIS proof.",
    "",
    "## Claim Boundary",
    "",
    `- Surface runtime proof only: ${report.claims.surfaceRuntimeProofOnly}`,
    `- Production proof allowed: ${report.claims.productionProofAllowed}`,
    `- Operational proof allowed: ${report.claims.operationalProofAllowed}`,
    "",
    "## Required Proof Areas",
    "",
    "| Area | Classification | Production proof allowed | Reason |",
    "| --- | --- | --- | --- |"
  ];

  report.proofAreas.forEach((area) => {
    lines.push(
      `| ${area.area} | ${area.classification} | ${area.productionProofAllowed} | ${String(area.reason).replaceAll("\n", " ")} |`
    );
  });

  lines.push("", "## Claim Findings", "");
  if (report.claimFindings.length === 0) {
    lines.push("- None");
  } else {
    report.claimFindings.forEach((finding) => {
      lines.push(`- ${finding.severity}: ${finding.finding} - ${finding.reason}`);
    });
  }

  lines.push("", "## Failures", "");
  if (report.failures.length === 0) {
    lines.push("- None");
  } else {
    report.failures.forEach((failure) => lines.push(`- ${failure}`));
  }

  lines.push("", "## Next Required Unblock", "");
  report.nextRequiredUnblock.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((item) => lines.push(`- ${item}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    repoRoot: DEFAULT_REPO_ROOT,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    authoritativeManifestPath: process.env.TF_COUNTY_STUDIO_DATA_TRUTH_MANIFEST
      ? path.resolve(process.env.TF_COUNTY_STUDIO_DATA_TRUTH_MANIFEST)
      : DEFAULT_AUTHORITATIVE_MANIFEST,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo-root") args.repoRoot = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--manifest") args.authoritativeManifestPath = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioR1DataTruthReport({
    repoRoot: args.repoRoot,
    authoritativeManifestPath: args.authoritativeManifestPath
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioR1DataTruthMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        productionProofAllowed: report.claims.productionProofAllowed,
        failures: report.failures.length,
        output: rel(args.repoRoot, args.outJson)
      },
      null,
      2
    )
  );

  if (report.status !== "DATA_TRUTH_PASS") {
    process.exitCode = 1;
  }

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

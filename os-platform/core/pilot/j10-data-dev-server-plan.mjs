#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "j10-data-dev-server-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "j10-data-dev-server-plan.latest.md"
);

const REQUIRED_TRUTH_GATES = [
  "GET /health",
  "GET /api/runtime/truth/db-identity",
  "GET /api/runtime/truth/db-content",
  "GET /api/counties/benton/parcels",
  "GET /api/counties/king/parcels",
  "GET /api/counties/spokane/parcels",
  "pnpm run truth:runtime-db-identity",
  "pnpm run truth:runtime-db-content",
  "pnpm run truth:county-runtime-registration-ledger",
  "pnpm run truth:benton-parcel-count-sanity",
  "pnpm run truth:june10-wa-initial-seed-receipt-reconciliation",
  "pnpm run truth:runtime-row-path-proof",
  "pnpm run truth:june10-readiness-packet"
];

const FORBIDDEN_DB_MARKERS = [
  "sqlite",
  "terrafusion-postgres-dev",
  "sync",
  "pacs",
  "production",
  "prod"
];

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
    const token = argv[index];
    if (!token?.startsWith("--")) continue;
    args.set(token.slice(2), argv[index + 1]);
    index += 1;
  }
  return args;
}

function normalizeUrl(url) {
  return String(url ?? "").trim().replace(/\/+$/, "");
}

function hasForbiddenDbMarker(value) {
  const normalized = String(value ?? "").toLowerCase();
  return FORBIDDEN_DB_MARKERS.find((marker) => normalized.includes(marker));
}

export function defaultDataDevConfig() {
  return {
    environmentName: "june10-data-dev",
    publicUrl: "https://dev39.terrafusionmarket.com",
    alternatePublicUrl: "https://june10-dev.terrafusionmarket.com",
    appRoot: "/opt/terrafusion/june10-data-dev",
    databaseProvider: "Postgres",
    connectionStringSource: "vps-local app.env",
    connectionStringName: "ConnectionStrings__DefaultConnection",
    databaseName: "terrafusion_j10_data_dev",
    databaseHostLabel: "j10-data-dev-postgres",
    restoreMode: "logical_snapshot_restore",
    restoreSource: "canonical 39-county Postgres snapshot/export",
    runtimeComposeRole: "separate data-dev stack behind edge proxy hostname route",
    syncDbMutationAllowed: false,
    productionBindingAllowed: false,
    sharesDatabaseWithSync: false,
    sharesDatabaseWithProduction: false,
    usesSqliteFallback: false,
    requiredTruthGates: REQUIRED_TRUTH_GATES
  };
}

export function evaluateDataDevServerPlan(config = defaultDataDevConfig()) {
  const blockers = [];
  const warnings = [];
  const publicUrl = normalizeUrl(config.publicUrl);
  const provider = String(config.databaseProvider ?? "");
  const dbName = String(config.databaseName ?? "");
  const dbHost = String(config.databaseHostLabel ?? "");
  const appRoot = String(config.appRoot ?? "");

  if (config.environmentName !== "june10-data-dev") {
    blockers.push("Environment name must be june10-data-dev.");
  }
  if (!["https://dev39.terrafusionmarket.com", "https://june10-dev.terrafusionmarket.com"].includes(publicUrl)) {
    blockers.push("Public URL must be dev39.terrafusionmarket.com or june10-dev.terrafusionmarket.com.");
  }
  if (appRoot === "/opt/terrafusion/production" || appRoot === "/opt/terrafusion/staging") {
    blockers.push("APP_ROOT must not reuse staging or production app roots.");
  }
  if (provider !== "Postgres") {
    blockers.push("DatabaseProvider must be Postgres.");
  }
  if (config.usesSqliteFallback === true) {
    blockers.push("SQLite fallback is forbidden for the June 10 data-dev runtime.");
  }
  if (config.connectionStringName !== "ConnectionStrings__DefaultConnection") {
    blockers.push("Connection string must bind through ConnectionStrings__DefaultConnection.");
  }
  if (!String(config.connectionStringSource ?? "").includes("app.env")) {
    blockers.push("Connection string must come from VPS-local non-git app.env.");
  }
  if (config.sharesDatabaseWithSync !== false) {
    blockers.push("Data-dev DB must not share the TerraFusion Sync Postgres database.");
  }
  if (config.sharesDatabaseWithProduction !== false) {
    blockers.push("Data-dev DB must not share the production DB.");
  }
  if (config.syncDbMutationAllowed !== false) {
    blockers.push("Data-dev plan must not allow Sync DB mutation.");
  }
  if (config.productionBindingAllowed !== false) {
    blockers.push("Production binding must remain false until data-dev truth gates pass.");
  }
  const forbiddenName = hasForbiddenDbMarker(dbName);
  if (forbiddenName) {
    blockers.push(`Database name contains forbidden marker "${forbiddenName}".`);
  }
  const forbiddenHost = hasForbiddenDbMarker(dbHost);
  if (forbiddenHost) {
    blockers.push(`Database host label contains forbidden marker "${forbiddenHost}".`);
  }
  if (config.restoreMode !== "logical_snapshot_restore") {
    blockers.push("Restore mode must be logical_snapshot_restore, not live attachment to Sync DB.");
  }

  const gates = new Set(config.requiredTruthGates ?? []);
  for (const gate of REQUIRED_TRUTH_GATES) {
    if (!gates.has(gate)) blockers.push(`Missing required truth gate: ${gate}`);
  }

  if (config.dnsRecordStatus !== "verified") {
    warnings.push("DNS is not verified yet for the data-dev hostname.");
  }
  if (config.dbRestoreStatus !== "verified") {
    warnings.push("Canonical Postgres snapshot has not been restored to data-dev yet.");
  }
  if (config.liveRuntimeSmokeStatus !== "verified") {
    warnings.push("Live data-dev API smoke has not been verified yet.");
  }

  const readyToProvision = blockers.length === 0;
  return {
    generatedAt: new Date().toISOString(),
    planType: "june10_data_dev_server_plan",
    environmentName: config.environmentName,
    publicUrl,
    alternatePublicUrl: config.alternatePublicUrl,
    appRoot: config.appRoot,
    runtimeRole: "39-county canonical Postgres proving ground",
    decision: readyToProvision ? "READY_TO_PROVISION_DATA_DEV" : "BLOCKED",
    dataDevBindingAllowed: readyToProvision,
    productionBindingAllowed: false,
    syncDbMutationAllowed: false,
    database: {
      provider: provider,
      name: dbName,
      hostLabel: dbHost,
      connectionStringName: config.connectionStringName,
      connectionStringSource: config.connectionStringSource,
      restoreMode: config.restoreMode,
      restoreSource: config.restoreSource,
      sharesDatabaseWithSync: config.sharesDatabaseWithSync,
      sharesDatabaseWithProduction: config.sharesDatabaseWithProduction,
      usesSqliteFallback: config.usesSqliteFallback
    },
    requiredTruthGates: REQUIRED_TRUTH_GATES,
    blockers,
    warnings,
    nextActions: [
      "Create DNS A record for dev39.terrafusionmarket.com or june10-dev.terrafusionmarket.com.",
      "Provision a separate Postgres database named terrafusion_j10_data_dev.",
      "Restore a logical snapshot/export of the canonical 39-county DB into the data-dev database.",
      "Deploy API/frontend with DatabaseProvider=Postgres and app.env-bound ConnectionStrings__DefaultConnection.",
      "Run all required truth gates against the data-dev hostname.",
      "Keep terrafusionmarket.com production binding blocked until data-dev truth gates pass."
    ],
    forbiddenActions: [
      "Do not use terrafusion-postgres-dev.",
      "Do not attach the app runtime directly to the active Sync database.",
      "Do not use SQLite fallback.",
      "Do not mutate production data.",
      "Do not call this production.",
      "Do not claim 39-county production certification from this plan alone."
    ]
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((item) => `- ${item}`).join("\n") : "- none";
  const warnings = report.warnings.length ? report.warnings.map((item) => `- ${item}`).join("\n") : "- none";
  const gates = report.requiredTruthGates.map((gate) => `- ${gate}`).join("\n");
  const nextActions = report.nextActions.map((item) => `- ${item}`).join("\n");
  const forbiddenActions = report.forbiddenActions.map((item) => `- ${item}`).join("\n");

  return `# June 10 Data Dev Server Plan

Generated: ${report.generatedAt}

## Verdict

- Decision: ${report.decision}
- Data-dev binding allowed: ${report.dataDevBindingAllowed ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Sync DB mutation allowed: ${report.syncDbMutationAllowed ? "yes" : "no"}
- Runtime role: ${report.runtimeRole}
- Public URL: ${report.publicUrl}
- APP_ROOT: ${report.appRoot}

## Database Boundary

- Provider: ${report.database.provider}
- Database: ${report.database.name}
- Host label: ${report.database.hostLabel}
- Connection string: ${report.database.connectionStringName}
- Source: ${report.database.connectionStringSource}
- Restore mode: ${report.database.restoreMode}
- Restore source: ${report.database.restoreSource}
- Shares database with Sync: ${report.database.sharesDatabaseWithSync ? "yes" : "no"}
- Shares database with production: ${report.database.sharesDatabaseWithProduction ? "yes" : "no"}
- SQLite fallback: ${report.database.usesSqliteFallback ? "yes" : "no"}

## Blockers

${blockers}

## Warnings

${warnings}

## Required Truth Gates

${gates}

## Next Actions

${nextActions}

## Forbidden Actions

${forbiddenActions}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = evaluateDataDevServerPlan(defaultDataDevConfig());
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`June 10 data-dev server plan written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Decision: ${report.decision}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
  console.log(`Sync DB mutation allowed: ${report.syncDbMutationAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

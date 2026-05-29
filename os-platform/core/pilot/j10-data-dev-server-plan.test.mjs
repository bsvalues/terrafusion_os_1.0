import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultDataDevConfig,
  evaluateDataDevServerPlan
} from "./j10-data-dev-server-plan.mjs";

test("default data-dev plan is isolated from Sync and production", () => {
  const report = evaluateDataDevServerPlan(defaultDataDevConfig());

  assert.equal(report.decision, "READY_TO_PROVISION_DATA_DEV");
  assert.equal(report.dataDevBindingAllowed, true);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.syncDbMutationAllowed, false);
  assert.equal(report.database.provider, "Postgres");
  assert.equal(report.database.sharesDatabaseWithSync, false);
  assert.equal(report.database.sharesDatabaseWithProduction, false);
  assert.equal(report.database.usesSqliteFallback, false);
  assert.deepEqual(report.blockers, []);
  assert.ok(report.requiredTruthGates.includes("pnpm run truth:runtime-db-identity"));
  assert.ok(report.requiredTruthGates.includes("pnpm run truth:june10-readiness-packet"));
});

test("plan rejects accidental Sync DB reuse", () => {
  const report = evaluateDataDevServerPlan({
    ...defaultDataDevConfig(),
    databaseName: "terrafusion-postgres-dev",
    databaseHostLabel: "terrafusion-postgres-dev",
    sharesDatabaseWithSync: true
  });

  assert.equal(report.decision, "BLOCKED");
  assert.equal(report.dataDevBindingAllowed, false);
  assert.match(report.blockers.join("\n"), /must not share the TerraFusion Sync Postgres/);
  assert.match(report.blockers.join("\n"), /Database name contains forbidden marker "terrafusion-postgres-dev"/);
});

test("plan rejects SQLite and production-like targets", () => {
  const report = evaluateDataDevServerPlan({
    ...defaultDataDevConfig(),
    publicUrl: "https://terrafusionmarket.com",
    appRoot: "/opt/terrafusion/production",
    databaseProvider: "Sqlite",
    usesSqliteFallback: true,
    databaseName: "terrafusion_prod"
  });

  assert.equal(report.decision, "BLOCKED");
  assert.match(report.blockers.join("\n"), /Public URL/);
  assert.match(report.blockers.join("\n"), /APP_ROOT/);
  assert.match(report.blockers.join("\n"), /DatabaseProvider must be Postgres/);
  assert.match(report.blockers.join("\n"), /SQLite fallback is forbidden/);
  assert.match(report.blockers.join("\n"), /Database name contains forbidden marker "prod"/);
});

test("plan requires all runtime truth gates before data-dev binding", () => {
  const config = defaultDataDevConfig();
  const report = evaluateDataDevServerPlan({
    ...config,
    requiredTruthGates: config.requiredTruthGates.filter((gate) => gate !== "pnpm run truth:runtime-db-content")
  });

  assert.equal(report.decision, "BLOCKED");
  assert.match(report.blockers.join("\n"), /Missing required truth gate: pnpm run truth:runtime-db-content/);
});

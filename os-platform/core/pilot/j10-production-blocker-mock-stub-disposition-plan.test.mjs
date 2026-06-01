import test from "node:test";
import assert from "node:assert/strict";

import {
  blocksJune10Preview,
  buildDisposition,
  buildPacket,
  extractRoutes,
  fixType,
  owningModule,
  priority,
  runtimeSurface
} from "./j10-production-blocker-mock-stub-disposition-plan.mjs";

test("maps owning modules and runtime surfaces", () => {
  assert.equal(owningModule("backend/src/TerraFusion.API/Controllers/PilotController.cs"), "API/Pilot");
  assert.equal(owningModule("backend/src/TerraFusion.AI/Services/CostForgeAIService.cs"), "AI Service/CostForgeAI");
  assert.equal(runtimeSurface("backend/src/TerraFusion.API/Controllers/PilotController.cs"), "HTTP controller");
  assert.equal(runtimeSurface("backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs"), "data seed/import path");
});

test("chooses fix types without mutating code", () => {
  assert.equal(
    fixType({ path: "backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs", signalKinds: ["mock"], staticReferenceCount: 99 }),
    "mark dev-only"
  );
  assert.equal(
    fixType({ path: "backend/src/TerraFusion.API/Controllers/PilotController.cs", signalKinds: ["stub"], staticReferenceCount: 10 }),
    "replace with honest unavailable state"
  );
  assert.equal(
    fixType({ path: "backend/src/TerraFusion.AI/Services/CostForgeAIService.cs", signalKinds: ["stub"], staticReferenceCount: 10 }),
    "implement real service"
  );
});

test("prioritizes user-facing controller blockers", () => {
  assert.equal(priority({ path: "backend/src/TerraFusion.API/Controllers/GPTController.cs" }), "P0");
  assert.equal(priority({ path: "backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs" }), "P1");
  assert.equal(priority({ path: "backend/src/TerraFusion.AI/Narratives/DefenseNarrativeService.cs" }), "P2");
});

test("extracts controller routes when available", () => {
  const routes = extractRoutes("backend/src/TerraFusion.API/Controllers/PilotController.cs");
  assert.ok(Array.isArray(routes));
  assert.ok(routes.length > 0);
  assert.ok(routes.every((route) => route.route.startsWith("/")));
});

test("does not mark Wave 1 backend blockers as June 10 preview blockers by default", () => {
  const preview = blocksJune10Preview({ path: "backend/src/TerraFusion.API/Controllers/PilotController.cs" });
  assert.equal(preview.blocks, false);
});

test("buildDisposition includes required plan fields", () => {
  const row = buildDisposition({
    rank: 3,
    path: "backend/src/TerraFusion.API/Controllers/PilotController.cs",
    signalKinds: ["stub"],
    disposition: "production_blocker",
    confidence: "high",
    staticReferenceCount: 182
  });
  assert.equal(row.blocksProduction, true);
  assert.equal(row.currentDecision, "requires_owner_disposition");
  assert.equal(row.allowedBeforeDisposition, "Do not claim full production capability for this surface.");
});

test("builds disposition packet from Wave 1 without production or DB mutation", () => {
  const packet = buildPacket();
  assert.equal(packet.productionTouched, false);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.featureWork, false);
  assert.equal(packet.summary.wave1ProductionBlockers, 39);
  assert.equal(packet.summary.dispositionRows, 39);
  assert.equal(packet.verdict.productionReadiness, "no_go");
  assert.equal(packet.countReconciliation.earlierAuditProductionRiskFiles, 724);
});

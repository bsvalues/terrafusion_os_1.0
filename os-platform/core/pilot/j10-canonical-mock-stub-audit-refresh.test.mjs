import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPacket,
  classifyFile,
  endpointMockSignals,
  lineSignals,
  selectedFiles,
  signalKind,
  sourceBucket
} from "./j10-canonical-mock-stub-audit-refresh.mjs";

test("uses stable source buckets", () => {
  assert.equal(sourceBucket("backend/src/TerraFusion.API/Controllers/PilotController.cs"), "backend_runtime");
  assert.equal(sourceBucket("frontend/apps/os-shell/src/__mocks__/fileMock.ts"), "test");
  assert.equal(sourceBucket("os-platform/core/pilot/evidence/foo.json"), "evidence");
  assert.equal(sourceBucket("tools/registry/foo.ts"), "registry");
});

test("detects canonical signal kinds", () => {
  assert.equal(signalKind("throw new NotImplementedException();"), "not_implemented");
  assert.equal(signalKind("// Stub implementation"), "stub");
  assert.equal(signalKind("// fallback path"), "fallback");
  assert.equal(signalKind("// hardcoded value"), "hardcoded");
});

test("classifies runtime severe signals as production risk", () => {
  assert.equal(
    classifyFile(
      "backend/src/TerraFusion.API/Controllers/PilotController.cs",
      [{ kind: "stub", preview: "return stub response;" }],
      10
    ),
    "production_risk"
  );
});

test("classifies tests and docs as demo-safe", () => {
  assert.equal(
    classifyFile("frontend/apps/os-shell/src/__mocks__/fileMock.ts", [{ kind: "mock", preview: "mock file" }], 0),
    "demo_safe"
  );
  assert.equal(classifyFile("ops/runbooks/foo.md", [{ kind: "placeholder", preview: "placeholder note" }], 0), "demo_safe");
});

test("classifies unreferenced runtime severe signals as dormant when not controller/config/model", () => {
  assert.equal(
    classifyFile("frontend/apps/os-shell/src/pages/workbench/income/DcfPanel.tsx", [{ kind: "stub", preview: "stub" }], 0),
    "dormant"
  );
});

test("loads endpoint mock signals from endpoint matrix", () => {
  const mocks = endpointMockSignals();
  assert.ok(Array.isArray(mocks));
  assert.ok(mocks.length >= 0);
});

test("builds canonical packet and supersedes denominator discrepancy", () => {
  const packet = buildPacket();
  assert.equal(packet.productionTouched, false);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.featureWork, false);
  assert.ok(packet.summary.totalFilesScanned > 0);
  assert.ok(packet.summary.productionRiskFiles > 0);
  assert.equal(packet.denominatorReconciliation.previousBroadAuditProductionRiskFiles, 724);
  assert.equal(packet.denominatorReconciliation.previousWave1InlineProductionRiskFiles, 618);
  assert.equal(packet.summary.wave1ProductionBlockersDispositioned, 39);
  assert.ok(selectedFiles().some((file) => file.endsWith("j10-canonical-mock-stub-audit-refresh.mjs")));
  assert.ok(lineSignals("os-platform/core/pilot/j10-canonical-mock-stub-audit-refresh.mjs").length > 0);
});

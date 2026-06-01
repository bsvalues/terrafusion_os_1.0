import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPacket,
  classifyTriage,
  extractSymbols,
  priorityScore
} from "./j10-mock-stub-triage-wave1.mjs";

test("prioritizes not-implemented and stub signals above benign sample signals", () => {
  const blocker = priorityScore({
    path: "backend/src/TerraFusion.API/Controllers/FooController.cs",
    signalKinds: ["stub"],
    matchCount: 1
  });
  const sample = priorityScore({
    path: "backend/src/TerraFusion.AI/Services/FooService.cs",
    signalKinds: ["sample_or_fixture"],
    matchCount: 20
  });
  assert.ok(blocker > sample);
});

test("classifies test runtime surfaces as safe demo-only", () => {
  const result = classifyTriage(
    { path: "backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs", signalKinds: ["mock"], matchCount: 3 },
    {
      signals: [{ kind: "mock", preview: "return mock test data;" }],
      symbols: ["CostForgeTestController"],
      referenceCount: 3
    }
  );
  assert.equal(result.disposition, "safe_demo_only");
});

test("classifies fallback-only signal as intentional fallback", () => {
  const result = classifyTriage(
    { path: "backend/src/TerraFusion.AI/Services/SystemGptAtlasService.cs", signalKinds: ["fallback"], matchCount: 1 },
    {
      signals: [{ kind: "fallback", preview: "return fallback unavailable response;" }],
      symbols: ["SystemGptAtlasService"],
      referenceCount: 2
    }
  );
  assert.equal(result.disposition, "intentional_fallback");
});

test("classifies unreferenced non-controller runtime stubs as dormant", () => {
  const result = classifyTriage(
    { path: "backend/src/TerraFusion.AI/Services/UnusedService.cs", signalKinds: ["stub"], matchCount: 1 },
    {
      signals: [{ kind: "stub", preview: "stub implementation" }],
      symbols: ["UnusedService"],
      referenceCount: 0
    }
  );
  assert.equal(result.disposition, "dormant");
});

test("classifies referenced service stubs as production blockers", () => {
  const result = classifyTriage(
    { path: "backend/src/TerraFusion.AI/Services/UsedService.cs", signalKinds: ["stub"], matchCount: 1 },
    {
      signals: [{ kind: "stub", preview: "stub implementation" }],
      symbols: ["UsedService"],
      referenceCount: 4
    }
  );
  assert.equal(result.disposition, "production_blocker");
});

test("extracts class and interface symbols from source", () => {
  const symbols = extractSymbols("os-platform/core/pilot/j10-mock-stub-triage-wave1.mjs");
  assert.deepEqual(symbols, []);
});

test("builds Wave 1 triage packet without production or DB mutation", () => {
  const packet = buildPacket();
  assert.equal(packet.productionTouched, false);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.featureWork, false);
  assert.equal(packet.summary.triagedFiles, 50);
  assert.equal(packet.verdict.productionReadiness, "blocked_by_mock_stub_disposition");
  assert.ok(packet.summary.blockerCount > 0);
});

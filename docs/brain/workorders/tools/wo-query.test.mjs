import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hardExclusions, scoreRecord, summarize, verdictFor } from "./wo-query.mjs";

const rules = {
  policyId: "test-policy",
  schemaVersion: "1.0.0",
  factors: [
    { id: "dependency-readiness", weight: 25 },
    { id: "risk-authority-fit", weight: 20 },
    { id: "evidence-readiness", weight: 15 },
    { id: "operational-value", weight: 15 },
    { id: "scope-reversibility", weight: 10 },
    { id: "safety-margin", weight: 10 },
    { id: "blocker-pressure", weight: 5 },
  ],
  decisionBands: [
    { verdict: "recommend", minimumScore: 85, maximumScore: 100, minimumInclusive: true, maximumInclusive: true },
    { verdict: "eligible", minimumScore: 70, maximumScore: 85, minimumInclusive: true, maximumInclusive: false },
    { verdict: "defer", minimumScore: 50, maximumScore: 70, minimumInclusive: true, maximumInclusive: false },
    { verdict: "weak", minimumScore: 0, maximumScore: 50, minimumInclusive: true, maximumInclusive: false },
  ],
};

describe("wo-query scoring", () => {
  it("maps decimal score boundaries deterministically", () => {
    assert.equal(verdictFor(84.9995, rules.decisionBands), "eligible");
    assert.equal(verdictFor(85, rules.decisionBands), "recommend");
    assert.equal(verdictFor(49.9999, rules.decisionBands), "weak");
    assert.equal(verdictFor(50, rules.decisionBands), "defer");
  });

  it("blocks terminal records", () => {
    const record = { id: "WO-1", status: "merged", riskClass: "R1", dependencies: [] };
    assert.deepEqual(hardExclusions(record, "R2"), ["terminal-status"]);
  });

  it("does not select active PR work as the next recommendation", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-ACTIVE",
          title: "Active",
          program: "Test",
          status: "pr_open",
          riskClass: "R1",
          dependencies: [],
        },
        {
          id: "WO-READY",
          title: "Ready",
          program: "Test",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
          evidenceProduced: [{ location: "evidence.md" }],
          evidenceRequired: [{ kind: "doc" }],
          allowedFiles: ["docs/**"],
          blockedSystems: [{ name: "Runtime" }],
          stopConditions: [{ type: "scope_boundary" }],
        },
      ],
    };

    const summary = summarize(registry, rules, "R2");
    assert.equal(summary.activeLane, "Test");
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-READY");
  });

  it("produces an advisory next recommendation without mutating registry data", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-A",
          title: "Done",
          program: "Test",
          status: "complete",
          riskClass: "R1",
          dependencies: [],
        },
        {
          id: "WO-B",
          title: "Ready",
          program: "Test",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
          evidenceProduced: [{ location: "evidence.md" }],
          evidenceRequired: [{ kind: "doc" }],
          allowedFiles: ["docs/**"],
          blockedSystems: [{ name: "Runtime" }],
          stopConditions: [{ type: "scope_boundary" }],
        },
      ],
    };

    const summary = summarize(registry, rules, "R2");
    assert.equal(summary.mode, "read-only");
    assert.deepEqual(summary.completedWorkOrders, ["WO-A"]);
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-B");
    assert.notEqual(summary.nextRecommendedWorkOrder.verdict, "blocked");
  });

  it("treats required future evidence as a score input, not a hard preselection blocker", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-EVIDENCE",
          title: "Needs Evidence",
          program: "Test",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
          evidenceRequired: [{ kind: "file" }],
        },
      ],
    };

    const summary = summarize(registry, rules, "R2");
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-EVIDENCE");
    assert.equal(summary.nextRecommendedWorkOrder.hardExclusions.length, 0);
  });

  it("returns blocked verdict when risk exceeds authority", () => {
    const record = {
      id: "WO-R3",
      title: "Governance",
      program: "Test",
      status: "ready",
      riskClass: "R3",
      dependencies: [],
    };
    const result = scoreRecord(record, rules, "R1");
    assert.equal(result.verdict, "blocked");
    assert.ok(result.hardExclusions.includes("risk-exceeds-authority"));
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hardExclusions, parseArgs, scoreRecord, summarize, verdictFor } from "./wo-query.mjs";

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
  tieBreakers: [
    { order: 1, id: "lower-risk-class" },
    { order: 2, id: "fewer-unresolved-blockers" },
    { order: 3, id: "newer-dependency-evidence" },
    { order: 4, id: "active-lane-closure" },
    { order: 5, id: "lexicographic-work-order-id" },
  ],
};

describe("wo-query scoring", () => {
  it("rejects options with missing values", () => {
    assert.throws(() => parseArgs(["--registry"]), /Missing value for --registry/);
    assert.throws(() => parseArgs(["--rules", "--json"]), /Missing value for --rules/);
    assert.throws(() => parseArgs(["--authority", "--registry"]), /Missing value for --authority/);
  });

  it("maps decimal score boundaries deterministically", () => {
    assert.equal(verdictFor(84.9995, rules.decisionBands), "eligible");
    assert.equal(verdictFor(85, rules.decisionBands), "recommend");
    assert.equal(verdictFor(49.9999, rules.decisionBands), "weak");
    assert.equal(verdictFor(50, rules.decisionBands), "defer");
  });

  it("blocks terminal records", () => {
    const record = { id: "WO-TEST-001", status: "merged", riskClass: "R1", dependencies: [] };
    assert.deepEqual(hardExclusions(record, "R2"), ["terminal-status"]);
  });

  it("supports canonical blocked and review statuses without unsupported-status", () => {
    const blocked = { id: "WO-TEST-002-BLOCKED", status: "blocked", riskClass: "R1", dependencies: [] };
    const review = { id: "WO-TEST-003-REVIEW", status: "review", riskClass: "R1", dependencies: [] };

    assert.deepEqual(hardExclusions(blocked, "R2"), ["blocked-status"]);
    assert.deepEqual(hardExclusions(review, "R2"), ["active-work-order"]);
  });

  it("does not select active PR work as the next recommendation", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-TEST-004-ACTIVE",
          title: "Active",
          program: "Test",
          status: "pr_open",
          riskClass: "R1",
          dependencies: [],
        },
        {
          id: "WO-TEST-005-READY",
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
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-TEST-005-READY");
  });

  it("produces an advisory next recommendation without mutating registry data", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-TEST-006-DONE",
          title: "Done",
          program: "Test",
          status: "complete",
          riskClass: "R1",
          dependencies: [],
        },
        {
          id: "WO-TEST-007-READY",
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
    assert.deepEqual(summary.completedWorkOrders, ["WO-TEST-006-DONE"]);
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-TEST-007-READY");
    assert.notEqual(summary.nextRecommendedWorkOrder.verdict, "blocked");
    assert.match(summary.nextRecommendedWorkOrder.nextRecommendedAction, /Rank 1:/);
  });

  it("treats required future evidence as a score input, not a hard preselection blocker", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-TEST-008-EVIDENCE",
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
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-TEST-008-EVIDENCE");
    assert.equal(summary.nextRecommendedWorkOrder.hardExclusions.length, 0);
  });

  it("returns blocked verdict when risk exceeds authority", () => {
    const record = {
      id: "WO-TEST-009-R3",
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

  it("blocks protected allowed systems even when the record understates risk", () => {
    const record = {
      id: "WO-TEST-009-PROTECTED",
      title: "Underclassified production work",
      program: "Test",
      status: "ready",
      riskClass: "R1",
      dependencies: [],
      allowedSystems: [{ name: "Production deployment" }],
    };
    const result = scoreRecord(record, rules, "R3");
    assert.equal(result.verdict, "blocked");
    assert.ok(result.hardExclusions.includes("protected-system-required"));
  });

  it("reports blocked work orders without counting terminal or active records", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        { id: "WO-TEST-010-COMPLETE", title: "Complete", program: "Test", status: "complete", riskClass: "R1", dependencies: [] },
        { id: "WO-TEST-011-CANCELLED", title: "Cancelled", program: "Test", status: "cancelled", riskClass: "R1", dependencies: [] },
        { id: "WO-TEST-012-REVIEW", title: "Review", program: "Test", status: "review", riskClass: "R1", dependencies: [] },
        { id: "WO-TEST-013-BLOCKED", title: "Blocked", program: "Test", status: "blocked", riskClass: "R1", dependencies: [] },
      ],
    };

    const summary = summarize(registry, rules, "R2");
    assert.deepEqual(summary.completedWorkOrders, ["WO-TEST-010-COMPLETE"]);
    assert.deepEqual(summary.blockedWorkOrders, [{ id: "WO-TEST-013-BLOCKED", reasons: ["blocked-status"] }]);
    assert.equal(summary.activeLane, "Test");
  });

  it("uses configured tie-breakers before lexicographic fallback", () => {
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-TEST-014-A",
          title: "Higher blocker pressure",
          program: "Other",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
          blockers: [{ id: "B1", status: "open" }],
          evidenceProduced: [{ location: "old.md", freshness: { observedAt: "2026-01-01T00:00:00Z" } }],
        },
        {
          id: "WO-TEST-015-B",
          title: "Fewer blockers",
          program: "Other",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
          evidenceProduced: [{ location: "new.md", freshness: { observedAt: "2026-02-01T00:00:00Z" } }],
        },
        {
          id: "WO-TEST-016-ACTIVE",
          title: "Active lane",
          program: "Active",
          status: "review",
          riskClass: "R1",
          dependencies: [],
        },
      ],
    };

    const summary = summarize(registry, rules, "R2");
    assert.equal(summary.activeLane, "Active");
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-TEST-015-B");
  });

  it("uses tie-breaker order fields instead of input array order", () => {
    const reversedRules = { ...rules, tieBreakers: [...rules.tieBreakers].reverse() };
    const registry = {
      schemaVersion: "0.1.0",
      generatedBy: "test",
      records: [
        {
          id: "WO-TEST-017-B",
          title: "B",
          program: "Test",
          status: "ready",
          riskClass: "R2",
          dependencies: [],
        },
        {
          id: "WO-TEST-018-A",
          title: "A",
          program: "Test",
          status: "ready",
          riskClass: "R1",
          dependencies: [],
        },
      ],
    };
    const summary = summarize(registry, reversedRules, "R2");
    assert.equal(summary.nextRecommendedWorkOrder.workOrderId, "WO-TEST-018-A");
  });
});

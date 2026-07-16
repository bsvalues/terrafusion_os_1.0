import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseReportArgs, renderMarkdownReport } from './wo-report.mjs';

function summary(overrides = {}) {
  return {
    mode: 'read-only',
    authority: 'R2',
    registry: { schemaVersion: '0.1.0', recordCount: 3 },
    scoringPolicy: { policyId: 'test-policy' },
    activeLane: 'Work Order Engine',
    completedWorkOrders: ['WO-TEST-001'],
    blockedWorkOrders: [{ id: 'WO-TEST-002', reasons: ['blocked-status'] }],
    nextRecommendedWorkOrder: {
      workOrderId: 'WO-TEST-003',
      program: 'Test | Program',
      riskClass: 'R1',
      score: 91,
      verdict: 'recommend',
      nextRecommendedAction: 'Rank 1: recommend.',
    },
    rankedCandidates: [
      {
        workOrderId: 'WO-TEST-003',
        program: 'Test | Program',
        riskClass: 'R1',
        score: 91,
        verdict: 'recommend',
      },
    ],
    ...overrides,
  };
}

describe('wo-report arguments', () => {
  it('parses bounded query options', () => {
    assert.deepEqual(parseReportArgs(['--authority', 'R1', '--registry', 'custom.json']), {
      registry: 'custom.json',
      rules: 'docs/brain/workorders/scoring/next-work-order-scoring.rules.json',
      authority: 'R1',
    });
  });

  it('rejects missing, unknown, and invalid options', () => {
    assert.throws(() => parseReportArgs(['--registry']), /Missing value/);
    assert.throws(() => parseReportArgs(['--output', 'report.md']), /Unknown argument/);
    assert.throws(() => parseReportArgs(['--authority', 'R9']), /Unsupported authority/);
  });
});

describe('wo-report markdown', () => {
  it('renders provenance, candidates, blockers, and non-authority language', () => {
    const report = renderMarkdownReport(summary(), {
      registry: 'registry.json',
      rules: 'rules.json',
    });

    assert.match(report, /Read-only advisory projection/);
    assert.match(report, /does not authorize execution/);
    assert.match(report, /WORK_ORDER_PROGRAM_QUEUE\.md/);
    assert.match(report, /CONTINUATION_RULEBOOK\.md/);
    assert.match(report, /`WO-TEST-003`/);
    assert.match(report, /Test \\| Program/);
    assert.match(report, /blocked-status/);
    assert.match(report, /registry\.json/);
  });

  it('renders empty sections without inventing a candidate', () => {
    const report = renderMarkdownReport(
      summary({
        activeLane: null,
        completedWorkOrders: [],
        blockedWorkOrders: [],
        nextRecommendedWorkOrder: null,
        rankedCandidates: [],
      })
    );

    assert.match(report, /None in the registry projection/);
    assert.match(report, /\| - \| None \|/);
    assert.match(report, /\| None \| - \|/);
  });

  it('does not mutate the query summary', () => {
    const input = summary();
    const before = structuredClone(input);
    renderMarkdownReport(input);
    assert.deepEqual(input, before);
  });
});

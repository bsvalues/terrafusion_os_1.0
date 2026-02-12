/**
 * Workflow Inventory — unit tests (pure, no I/O).
 *
 * Validates classification logic, snapshot extraction, comparison,
 * and deterministic snapshot formatting.
 *
 * Zero dependencies — Node built-in test runner.
 */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

// Module under test — will be created next
import {
  classifyWorkflow,
  compareSnapshots,
  extractSnapshotBlock,
  formatSnapshotBlock,
  REQUIRED_WORKFLOW_FILES,
} from '../workflow-inventory-core.mjs';

// ────────────────────────────────────────────────────────────────────────────
// Suite 1: Classification logic
// ────────────────────────────────────────────────────────────────────────────

describe('classifyWorkflow', () => {
  it('classifies_required_workflow', () => {
    // seal-gate-fast.yml has push + pr + dispatch and is in the required list
    const result = classifyWorkflow('seal-gate-fast.yml', {
      push: true,
      pull_request: true,
      schedule: false,
      workflow_dispatch: true,
    });
    assert.equal(result, 'REQUIRED');
  });

  it('classifies_required_workflow_core_governance', () => {
    // core-governance-gates.yml has push + pr — required
    const result = classifyWorkflow('core-governance-gates.yml', {
      push: true,
      pull_request: true,
      schedule: false,
      workflow_dispatch: false,
    });
    assert.equal(result, 'REQUIRED');
  });

  it('classifies_required_workflow_tier1_ui', () => {
    // tier1-ui-harness.yml has push + pr + sched + dispatch — required
    const result = classifyWorkflow('tier1-ui-harness.yml', {
      push: true,
      pull_request: true,
      schedule: true,
      workflow_dispatch: true,
    });
    assert.equal(result, 'REQUIRED');
  });

  it('classifies_scheduled_workflow', () => {
    // Has schedule + dispatch but NOT in required list
    const result = classifyWorkflow('nightly.yml', {
      push: false,
      pull_request: false,
      schedule: true,
      workflow_dispatch: true,
    });
    assert.equal(result, 'SCHEDULED');
  });

  it('classifies_manual_only_workflow', () => {
    // Only workflow_dispatch
    const result = classifyWorkflow('deployment.yml', {
      push: false,
      pull_request: false,
      schedule: false,
      workflow_dispatch: true,
    });
    assert.equal(result, 'MANUAL');
  });

  it('classifies_deprecated_workflow_no_triggers', () => {
    // No triggers at all
    const result = classifyWorkflow('dotnet-test.yml', {
      push: false,
      pull_request: false,
      schedule: false,
      workflow_dispatch: false,
    });
    assert.equal(result, 'DEPRECATED');
  });

  it('push_optional_when_push_present_but_not_required', () => {
    // Has push but not in the required list
    const result = classifyWorkflow('accessibility.yml', {
      push: true,
      pull_request: false,
      schedule: false,
      workflow_dispatch: true,
    });
    assert.equal(result, 'PUSH-OPTIONAL');
  });

  it('push_optional_when_push_and_pr_but_not_required', () => {
    // Has push+pr but not a required workflow
    const result = classifyWorkflow('some-random-ci.yml', {
      push: true,
      pull_request: true,
      schedule: false,
      workflow_dispatch: false,
    });
    assert.equal(result, 'PUSH-OPTIONAL');
  });

  it('scheduled_takes_priority_over_push_for_non_required', () => {
    // Has push + schedule but not required → SCHEDULED (schedule takes priority)
    const result = classifyWorkflow('ci-cd-pipeline.yml', {
      push: true,
      pull_request: false,
      schedule: true,
      workflow_dispatch: true,
    });
    assert.equal(result, 'SCHEDULED');
  });

  it('required_list_contains_expected_files', () => {
    assert.ok(REQUIRED_WORKFLOW_FILES.has('seal-gate-fast.yml'));
    assert.ok(REQUIRED_WORKFLOW_FILES.has('core-governance-gates.yml'));
    assert.ok(REQUIRED_WORKFLOW_FILES.has('tier1-ui-harness.yml'));
    assert.equal(REQUIRED_WORKFLOW_FILES.size, 3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Suite 2: Snapshot extraction
// ────────────────────────────────────────────────────────────────────────────

describe('extractSnapshotBlock', () => {
  it('extracts_snapshot_block', () => {
    const doc = [
      '# Some heading',
      '',
      '<!-- INVENTORY-SNAPSHOT-BEGIN -->',
      '| Class | Count |',
      '|-------|-------|',
      '| REQUIRED | 3 |',
      '<!-- INVENTORY-SNAPSHOT-END -->',
      '',
      '## Other section',
    ].join('\n');

    const block = extractSnapshotBlock(doc);
    assert.ok(block !== null);
    assert.ok(block.includes('REQUIRED'));
    assert.ok(block.includes('| Class | Count |'));
  });

  it('returns_null_when_no_snapshot_markers', () => {
    const doc = '# Just a doc\n\nNo snapshot here.\n';
    const block = extractSnapshotBlock(doc);
    assert.equal(block, null);
  });

  it('returns_null_when_markers_incomplete', () => {
    const doc = '<!-- INVENTORY-SNAPSHOT-BEGIN -->\nsome content\n# No end marker';
    const block = extractSnapshotBlock(doc);
    assert.equal(block, null);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Suite 3: Snapshot comparison
// ────────────────────────────────────────────────────────────────────────────

describe('compareSnapshots', () => {
  it('detects_snapshot_match', () => {
    const a = '| REQUIRED | 3 |\n| MANUAL | 10 |';
    const b = '| REQUIRED | 3 |\n| MANUAL | 10 |';
    const result = compareSnapshots(a, b);
    assert.equal(result.match, true);
  });

  it('detects_snapshot_mismatch', () => {
    const a = '| REQUIRED | 3 |\n| MANUAL | 10 |';
    const b = '| REQUIRED | 3 |\n| MANUAL | 12 |';
    const result = compareSnapshots(a, b);
    assert.equal(result.match, false);
  });

  it('ignores_trailing_whitespace_differences', () => {
    const a = '| REQUIRED | 3 |  \n| MANUAL | 10 |';
    const b = '| REQUIRED | 3 |\n| MANUAL | 10 |';
    const result = compareSnapshots(a, b);
    assert.equal(result.match, true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Suite 4: Deterministic snapshot formatting
// ────────────────────────────────────────────────────────────────────────────

describe('formatSnapshotBlock', () => {
  it('writes_snapshot_deterministically', () => {
    const inventory = {
      total: 5,
      classes: {
        REQUIRED: ['seal-gate-fast.yml', 'core-governance-gates.yml'],
        'PUSH-OPTIONAL': ['deps-fast-lane.yml'],
        SCHEDULED: ['nightly.yml'],
        MANUAL: ['deployment.yml'],
        DEPRECATED: [],
      },
    };

    const output1 = formatSnapshotBlock(inventory);
    const output2 = formatSnapshotBlock(inventory);

    // Deterministic — same input always produces same output
    assert.equal(output1, output2);

    // Contains class rows
    assert.ok(output1.includes('| REQUIRED | 2 |'));
    assert.ok(output1.includes('| PUSH-OPTIONAL | 1 |'));
    assert.ok(output1.includes('| SCHEDULED | 1 |'));
    assert.ok(output1.includes('| MANUAL | 1 |'));
    assert.ok(output1.includes('| DEPRECATED | 0 |'));
    assert.ok(output1.includes('| **Total** | 5 |'));

    // Contains file lists
    assert.ok(output1.includes('seal-gate-fast.yml'));
    assert.ok(output1.includes('core-governance-gates.yml'));
    assert.ok(output1.includes('deps-fast-lane.yml'));
    assert.ok(output1.includes('nightly.yml'));
    assert.ok(output1.includes('deployment.yml'));

    // No timestamp or date noise
    assert.ok(!output1.includes(new Date().toISOString().slice(0, 10)));
  });

  it('sorts_files_within_each_class', () => {
    const inventory = {
      total: 3,
      classes: {
        REQUIRED: ['tier1-ui-harness.yml', 'core-governance-gates.yml', 'seal-gate-fast.yml'],
        'PUSH-OPTIONAL': [],
        SCHEDULED: [],
        MANUAL: [],
        DEPRECATED: [],
      },
    };

    const output = formatSnapshotBlock(inventory);
    const coreIdx = output.indexOf('core-governance-gates.yml');
    const sealIdx = output.indexOf('seal-gate-fast.yml');
    const tierIdx = output.indexOf('tier1-ui-harness.yml');

    // Alphabetical within REQUIRED
    assert.ok(coreIdx < sealIdx, 'core before seal');
    assert.ok(sealIdx < tierIdx, 'seal before tier1');
  });
});

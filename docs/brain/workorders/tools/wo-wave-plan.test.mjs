import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseArgs, planWaves, reservationsOverlap } from './wo-wave-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const rules = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/brain/workorders/scoring/next-work-order-scoring.rules.json'),
    'utf8'
  )
);

function record(id, overrides = {}) {
  return {
    id,
    title: id,
    program: 'Test',
    goal: 'test',
    riskClass: 'R1',
    status: 'ready',
    dependencies: [],
    allowedSystems: [],
    blockedSystems: [{ name: 'Runtime' }],
    allowedFiles: [`docs/${id.toLowerCase()}/**`],
    evidenceRequired: [],
    evidenceProduced: [],
    validationGates: [],
    stopConditions: [{ type: 'scope_boundary' }],
    nextCandidates: [],
    ...overrides,
  };
}

function registry(records) {
  return { schemaVersion: 'test', generatedBy: 'test', records };
}

function optionsFor(records, overrides = {}) {
  const candidateReservations = Object.fromEntries(
    records
      .filter(item => item.status === 'ready')
      .map(item => [
        item.id,
        [
          {
            id: `${item.id}-PATH`,
            kind: 'path',
            value: item.allowedFiles[0],
            status: 'active',
          },
        ],
      ])
  );
  return {
    ...overrides,
    reservations: {
      repository: 'bsvalues/terrafusion_os_1.0',
      candidateReservations,
      ...(overrides.reservations ?? {}),
    },
  };
}

describe('wo-wave-plan', () => {
  it('validates numeric CLI options', () => {
    assert.throws(() => parseArgs(['--max-workers', '0']), /positive integer/);
    assert.throws(() => parseArgs(['--search-node-limit']), /Missing value/);
    assert.equal(parseArgs(['--max-workers', '3']).maxWorkers, 3);
    assert.throws(() => parseArgs(['--authority', 'NOT-A-RISK']), /authority must be one of/);
    assert.throws(
      () => planWaves(registry([record('WO-TEST-AUTH')]), rules, { authority: 'NOT-A-RISK' }),
      /authority must be one of/
    );
  });

  it('never returns a completed predecessor as executable', () => {
    const records = [
      record('WO-MAO-003', { status: 'complete' }),
      record('WO-MAO-004', { dependencies: [{ id: 'WO-MAO-003', status: 'satisfied' }] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.deepEqual(plan.initialExecutableSet, ['WO-MAO-004']);
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'WO-MAO-003')
        .reasons.includes('terminal-status')
    );
  });

  it('projects dependency unlocks into later waves', () => {
    const records = [
      record('WO-TEST-001'),
      record('WO-TEST-002', { dependencies: [{ id: 'WO-TEST-001', status: 'required' }] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records, { maxWorkers: 2 }));
    assert.deepEqual(plan.initialExecutableSet, ['WO-TEST-001']);
    assert.deepEqual(
      plan.waves.map(wave => wave.workOrders.map(item => item.workOrderId)),
      [['WO-TEST-001'], ['WO-TEST-002']]
    );
  });

  it('does not treat a cancelled dependency as completed', () => {
    const records = [
      record('WO-TEST-003', { status: 'cancelled' }),
      record('WO-TEST-004', { dependencies: [{ id: 'WO-TEST-003', status: 'required' }] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.equal(plan.waves.length, 0);
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'WO-TEST-004')
        .reasons.includes('dependency-not-cleared:WO-TEST-003')
    );
  });

  it('bypasses a blocked lane while scheduling unrelated work', () => {
    const records = [
      record('WO-BLOCKED-001', { status: 'blocked', blockers: [{ id: 'wall', status: 'open' }] }),
      record('WO-READY-001'),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.deepEqual(plan.initialExecutableSet, ['WO-READY-001']);
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'WO-BLOCKED-001')
        .reasons.includes('blocked-status')
    );
  });

  it('aligns path exact/subtree and contract/environment conflicts with MAO-003', () => {
    assert.equal(
      reservationsOverlap(
        { kind: 'path', value: 'docs/a', scope: 'subtree' },
        { kind: 'path', value: 'docs/a/file.md', scope: 'exact' }
      ),
      true
    );
    assert.equal(
      reservationsOverlap(
        { kind: 'path', value: 'docs/a', scope: 'exact' },
        { kind: 'path', value: 'docs/a/file.md', scope: 'exact' }
      ),
      false
    );
    assert.equal(
      reservationsOverlap(
        { kind: 'contract', value: 'release-contract', scope: 'exact' },
        { kind: 'contract', value: 'release-contract', scope: 'exact' }
      ),
      true
    );
    assert.equal(
      reservationsOverlap(
        { kind: 'environment', value: 'shared-dev', scope: 'exact' },
        { kind: 'contract', value: 'shared-dev', scope: 'exact' }
      ),
      false
    );
  });

  it('separates candidate conflicts into different waves', () => {
    const records = [
      record('WO-TEST-010', { allowedFiles: ['docs/shared/**'] }),
      record('WO-TEST-011', { allowedFiles: ['docs/shared/file.md'] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records, { maxWorkers: 2 }));
    assert.equal(plan.waves.length, 2);
    assert.equal(plan.waves[0].workOrders.length, 1);
    assert.equal(plan.waves[1].workOrders.length, 1);
  });

  it('blocks active and stale active reservations but ignores released reservations', () => {
    const base = registry([record('WO-TEST-020', { allowedFiles: ['docs/shared/**'] })]);
    const active = {
      activeReservations: [
        {
          id: 'EXISTING',
          kind: 'path',
          value: 'docs/shared/file.md',
          scope: 'exact',
          status: 'active',
          stale: true,
          workOrderId: 'WO-OTHER-001',
        },
      ],
    };
    const records = base.records;
    const blocked = planWaves(
      base,
      rules,
      optionsFor(records, {
        reservations: {
          repository: 'bsvalues/terrafusion_os_1.0',
          ...active,
        },
      })
    );
    assert.equal(blocked.waves.length, 0);
    assert.deepEqual(blocked.excludedWorkOrders[0].reasons, ['stale-active-reservation-conflict']);

    active.activeReservations[0].status = 'released';
    const released = planWaves(
      base,
      rules,
      optionsFor(records, {
        reservations: {
          repository: 'bsvalues/terrafusion_os_1.0',
          ...active,
        },
      })
    );
    assert.deepEqual(released.initialExecutableSet, ['WO-TEST-020']);
  });

  it('requires verified handoff state and active candidate claims', () => {
    const records = [record('WO-TEST-021')];
    const invalidHandoff = optionsFor(records, {
      reservations: {
        activeReservations: [
          {
            id: 'HANDOFF',
            kind: 'path',
            value: 'docs/other/**',
            status: 'handed_off',
            workOrderId: 'WO-OTHER-002',
          },
        ],
      },
    });
    assert.throws(() => planWaves(registry(records), rules, invalidHandoff), /unverified handoff/);

    invalidHandoff.reservations.activeReservations[0].handoffValid = true;
    assert.deepEqual(planWaves(registry(records), rules, invalidHandoff).initialExecutableSet, [
      'WO-TEST-021',
    ]);

    const releasedCandidate = optionsFor(records);
    releasedCandidate.reservations.candidateReservations[records[0].id][0].status = 'released';
    const plan = planWaves(registry(records), rules, releasedCandidate);
    assert.match(plan.excludedWorkOrders[0].reasons[0], /must be active/);
  });

  it('binds planning to the canonical repository and candidate identity', () => {
    const records = [record('WO-TEST-022')];
    const foreign = optionsFor(records);
    foreign.reservations.repository = 'other/repository';
    assert.throws(
      () => planWaves(registry(records), rules, foreign),
      /cross-repository planning is blocked/
    );

    const misbound = optionsFor(records);
    misbound.reservations.candidateReservations[records[0].id][0].workOrderId = 'WO-OTHER-001';
    const misboundPlan = planWaves(registry(records), rules, misbound);
    assert.match(misboundPlan.excludedWorkOrders[0].reasons[0], /is bound to WO-OTHER-001/);

    const invalidPullRequest = optionsFor(records);
    invalidPullRequest.reservations.candidateReservations[records[0].id][0].pullRequest = -1;
    const invalidPullRequestPlan = planWaves(registry(records), rules, invalidPullRequest);
    assert.match(invalidPullRequestPlan.excludedWorkOrders[0].reasons[0], /positive integer/);
  });

  it('rejects protected path and environment reservations regardless of declared risk', () => {
    const records = [
      record('WO-TEST-023', { riskClass: 'R1', allowedFiles: ['backend/**'] }),
      record('WO-TEST-024', { riskClass: 'R1' }),
    ];
    const options = optionsFor(records);
    options.reservations.candidateReservations['WO-TEST-024'] = [
      { id: 'PROD', kind: 'environment', value: 'production', scope: 'exact' },
    ];
    const plan = planWaves(registry(records), rules, options);
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-023').reasons[0],
      /protected-allowed-file:backend/
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-024').reasons[0],
      /protected-resource-reservation:environment:production/
    );
  });

  it('reconciles path claims with declared scope and blocks denied CI/deployment declarations', () => {
    const records = [
      record('WO-TEST-025', { allowedFiles: ['docs/safe/**'] }),
      record('WO-TEST-026', { allowedFiles: ['.github/actions/**'] }),
      record('WO-TEST-027', { allowedFiles: ['scripts/deploy/**'] }),
    ];
    const options = optionsFor(records);
    options.reservations.candidateReservations['WO-TEST-025'][0].value = 'docs/outside/**';
    const plan = planWaves(registry(records), rules, options);

    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-025').reasons[0],
      /outside declared allowedFiles/
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-026').reasons[0],
      /protected-allowed-file:\.github\/actions/
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-027').reasons[0],
      /protected-allowed-file:scripts\/deploy/
    );
  });

  it('fails closed on stale candidate reservations', () => {
    const records = [record('WO-TEST-028')];
    const options = optionsFor(records);
    options.reservations.candidateReservations['WO-TEST-028'][0].stale = true;
    const plan = planWaves(registry(records), rules, options);

    assert.equal(plan.waves.length, 0);
    assert.match(plan.excludedWorkOrders[0].reasons[0], /candidate reservation.*is stale/);
  });

  it('chooses a maximum-cardinality set instead of a priority-only greedy set', () => {
    const records = [record('WO-TEST-030'), record('WO-TEST-031'), record('WO-TEST-032')];
    const reservations = {
      repository: 'bsvalues/terrafusion_os_1.0',
      candidateReservations: {
        'WO-TEST-030': [
          { id: 'A-X', kind: 'contract', value: 'x', scope: 'exact' },
          { id: 'A-Y', kind: 'contract', value: 'y', scope: 'exact' },
        ],
        'WO-TEST-031': [{ id: 'B-X', kind: 'contract', value: 'x', scope: 'exact' }],
        'WO-TEST-032': [{ id: 'C-Y', kind: 'contract', value: 'y', scope: 'exact' }],
      },
    };
    const plan = planWaves(registry(records), rules, { maxWorkers: 2, reservations });
    assert.deepEqual(
      plan.waves[0].workOrders.map(item => item.workOrderId),
      ['WO-TEST-031', 'WO-TEST-032']
    );
  });

  it('is byte-stable and does not mutate its inputs', () => {
    const input = registry([record('WO-TEST-040'), record('WO-TEST-041')]);
    const before = JSON.stringify(input);
    const options = optionsFor(input.records, { maxWorkers: 1 });
    const first = JSON.stringify(planWaves(input, rules, options));
    const second = JSON.stringify(planWaves(input, rules, options));
    assert.equal(first, second);
    assert.equal(JSON.stringify(input), before);
  });

  it('fails closed on unsupported path globs', () => {
    const records = [record('WO-TEST-050', { allowedFiles: ['docs/*/file.md'] })];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.equal(plan.waves.length, 0);
    assert.match(plan.excludedWorkOrders[0].reasons[0], /^invalid-reservation:/);

    const contradictory = record('WO-TEST-051');
    const contradictoryOptions = optionsFor([contradictory]);
    contradictoryOptions.reservations.candidateReservations[contradictory.id][0].scope = 'exact';
    const contradictoryPlan = planWaves(registry([contradictory]), rules, contradictoryOptions);
    assert.match(contradictoryPlan.excludedWorkOrders[0].reasons[0], /contradicts.*subtree/);
  });

  it('does not dispatch proposed work and fails closed on missing reservation claims', () => {
    const proposed = record('WO-TEST-060', { status: 'proposed' });
    const missing = record('WO-TEST-061');
    const plan = planWaves(registry([proposed, missing]), rules, {
      reservations: { repository: 'bsvalues/terrafusion_os_1.0', candidateReservations: {} },
    });
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === proposed.id)
        .reasons.includes('not-ready-status:proposed')
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === missing.id).reasons[0],
      /^invalid-reservation:/
    );
  });

  it('fails closed on duplicate IDs and dependency contradictions', () => {
    assert.throws(
      () => planWaves(registry([record('WO-TEST-070'), record('WO-TEST-070')]), rules),
      /duplicate/
    );
    const records = [
      record('WO-TEST-071'),
      record('WO-TEST-072', { dependencies: [{ id: 'WO-TEST-071', status: 'satisfied' }] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'WO-TEST-072')
        .reasons.includes('dependency-state-contradiction:WO-TEST-071')
    );

    const orphan = record('WO-TEST-073', {
      dependencies: [{ id: 'WO-MISSING-001', status: 'satisfied' }],
    });
    const orphanPlan = planWaves(registry([orphan]), rules, optionsFor([orphan]));
    assert.ok(
      orphanPlan.excludedWorkOrders[0].reasons.includes('missing-dependency:WO-MISSING-001')
    );
  });

  it('treats an explicit waiver as cleared without requiring predecessor completion', () => {
    const records = [
      record('WO-TEST-078', { status: 'blocked' }),
      record('WO-TEST-079', { dependencies: [{ id: 'WO-TEST-078', status: 'waived' }] }),
      record('WO-TEST-079A', { dependencies: [{ id: 'WO-MISSING-079', status: 'waived' }] }),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.deepEqual(plan.initialExecutableSet, ['WO-TEST-079', 'WO-TEST-079A']);
  });

  it('excludes malformed Work Order IDs without freezing valid work', () => {
    const records = [record('BAD'), record('WO-TEST-079B')];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'BAD')
        .reasons.includes('invalid-work-order-id')
    );
    assert.deepEqual(plan.initialExecutableSet, ['WO-TEST-079B']);

    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/schema/parallel-wave-plan.schema.json'),
        'utf8'
      )
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    assert.equal(validate(plan), true, JSON.stringify(validate.errors));
  });

  it('enforces one global search-node limit across projected waves', () => {
    const records = [
      record('WO-TEST-074'),
      record('WO-TEST-075', { dependencies: [{ id: 'WO-TEST-074', status: 'required' }] }),
      record('WO-TEST-076', { dependencies: [{ id: 'WO-TEST-075', status: 'required' }] }),
    ];
    assert.throws(
      () =>
        planWaves(
          registry(records),
          rules,
          optionsFor(records, { maxWorkers: 1, searchNodeLimit: 2 })
        ),
      /search node limit exceeded.*across projected waves/
    );
  });

  it('schema rejects subtree scope for contract and environment reservations', () => {
    const records = [record('WO-TEST-077')];
    const reservations = {
      repository: 'bsvalues/terrafusion_os_1.0',
      candidateReservations: {
        'WO-TEST-077': [
          { id: 'CONTRACT', kind: 'contract', value: 'release-contract', scope: 'exact' },
        ],
      },
    };
    const plan = planWaves(registry(records), rules, { reservations });
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/schema/parallel-wave-plan.schema.json'),
        'utf8'
      )
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    assert.equal(validate(plan), true);
    const planned = plan.waves[0].workOrders[0];
    planned.reservations[0].scope = 'subtree';
    assert.equal(validate(plan), false);
    planned.reservations[0].scope = 'exact';
    planned.reservations = [];
    assert.equal(validate(plan), false);
    planned.reservations = [
      {
        id: 'contract',
        kind: 'contract',
        value: 'release-contract',
        scope: 'exact',
        status: 'released',
        stale: false,
        handoffValid: false,
        workOrderId: null,
        pullRequest: null,
        repository: null,
      },
    ];
    assert.equal(validate(plan), false);
  });

  it('labels dependency cycles without freezing independent work', () => {
    const records = [
      record('WO-TEST-080', { dependencies: [{ id: 'WO-TEST-081', status: 'required' }] }),
      record('WO-TEST-081', { dependencies: [{ id: 'WO-TEST-080', status: 'required' }] }),
      record('WO-TEST-082'),
    ];
    const plan = planWaves(registry(records), rules, optionsFor(records));
    assert.deepEqual(
      plan.waves[0].workOrders.map(item => item.workOrderId),
      ['WO-TEST-082']
    );
    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === 'WO-TEST-080')
        .reasons.includes('dependency-cycle')
    );
  });

  it('is invariant to registry input order', () => {
    const records = [record('WO-TEST-090'), record('WO-TEST-091'), record('WO-TEST-092')];
    const options = optionsFor(records, { maxWorkers: 2 });
    const forward = JSON.stringify(planWaves(registry(records), rules, options));
    const reverse = JSON.stringify(planWaves(registry([...records].reverse()), rules, options));
    assert.equal(forward, reverse);
  });

  it('records MAO program closeout and consumes the continuation authority', () => {
    const decisions = JSON.parse(
      fs.readFileSync(path.join(root, '.governance/owner-decisions.json'), 'utf8')
    );
    const activeAuthorities = decisions.decisions.filter(
      decision => decision.program === 'PROGRAM-MAO-001' && decision.status === 'active'
    );
    assert.deepEqual(activeAuthorities, []);

    const envelope = decisions.decisions.find(
      decision => decision.id === 'OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE'
    );
    assert.equal(envelope.status, 'completed');
    assert.equal(envelope.completion.terminal_work_order, 'WO-MAO-007');
    assert.equal(envelope.completion.merged_pr, 1289);
    assert.equal(envelope.completion.authority_consumed, true);
    assert.match(envelope.completion.evidence, /WO-MAO-007-EVIDENCE-ROLLUP-CANON-CLOSEOUT/);

    const queue = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md'),
      'utf8'
    );
    assert.match(queue, /WO-MAO-005[^\n]*DONE/);
    assert.match(queue, /WO-MAO-006[^\n]*DONE/);
    assert.match(queue, /WO-MAO-007[^\n]*DONE/);

    const commandMap = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md'),
      'utf8'
    );
    assert.match(commandMap, /PROGRAM-MAO-001 is closed at `WO-MAO-007`/);
    assert.match(commandMap, /WO-MAO-005[^\n]*COMPLETE/);
    assert.match(commandMap, /WO-MAO-006[^\n]*COMPLETE/);
    assert.match(commandMap, /WO-MAO-007[^\n]*COMPLETE - PASS_WITH_GAPS/);

    const register = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md'),
      'utf8'
    );
    const canonIndex = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/CANON_INDEX.md'),
      'utf8'
    );
    const activePlaybook = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md'),
      'utf8'
    );
    const program = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/programs/governed-multi-agent-operator-activation.md'),
      'utf8'
    );
    const goalCommands = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/goal-loop/GOAL_COMMANDS.md'),
      'utf8'
    );
    const maoGoal = goalCommands.match(
      /### \/goal governed-multi-agent-operator([\s\S]*?)(?:\n---|$)/
    )?.[1];
    assert.ok(maoGoal);
    assert.match(register, /Closed - PASS_WITH_GAPS/);
    assert.match(canonIndex, /Completed and closed at WO-MAO-007 with PASS_WITH_GAPS/);
    assert.doesNotMatch(canonIndex, /MAO program[^\n]*Active program graph/);
    assert.match(activePlaybook, /\| Status \| CLOSED - PASS_WITH_GAPS \|/);
    assert.match(program, /\*\*Status:\*\* Closed - PASS_WITH_GAPS/);
    assert.match(maoGoal, /Use `\/goal portfolio-operator`/);
    assert.match(maoGoal, /\*\*Allowed loop modes:\*\* `once`, `evidence`, `discovery`/);
    assert.doesNotMatch(maoGoal, /\*\*Allowed loop modes:\*\*[^\n]*`program`/);

    const closeoutPacket = fs.readFileSync(
      path.join(root, 'docs/brain/workorders/active/WO-MAO-007-evidence-rollup-canon-closeout.md'),
      'utf8'
    );
    const closeoutEvidence = fs.readFileSync(
      path.join(
        root,
        'docs/brain/workorders/evidence/WO-MAO-007-EVIDENCE-ROLLUP-CANON-CLOSEOUT.md'
      ),
      'utf8'
    );
    assert.match(closeoutPacket, /CLOSED - PASS_WITH_GAPS/);
    assert.match(closeoutPacket, /No MAO-008 exists, no MAO authority survives/);
    assert.match(closeoutEvidence, /Founder touches per merged Work Order/);
    assert.match(closeoutEvidence, /Sustained concurrent mutable lanes/);
    assert.match(closeoutEvidence, /Median Work Order cycle time before \/ after/);
    assert.match(closeoutEvidence, /Reservation violations reaching `main`/);
    assert.match(closeoutEvidence, /Unauthorized-scope merges/);
    assert.match(closeoutEvidence, /Operator-merge suspension \/ restoration/);
    assert.match(closeoutEvidence, /Automatic next-wave selection/);

    const playbooks = [
      'CODEX_MULTI_AGENT_ORCHESTRATOR_PLAYBOOK.md',
      'CLAUDE_CROSS_REPO_SUITE_WORKER_PLAYBOOK.md',
      'INDEPENDENT_ASSURANCE_AGENT_PLAYBOOK.md',
      'PR_CHECK_MONITOR_PLAYBOOK.md',
      'AGENT_FAILURE_RETRY_REASSIGNMENT_PLAYBOOK.md',
      'MULTI_AGENT_OPERATOR_BRIEF.md',
    ];
    for (const playbook of playbooks) {
      const content = fs.readFileSync(path.join(root, 'docs/agents', playbook), 'utf8');
      assert.match(content, /completed reusable baseline/);
      assert.match(content, /BASELINE_COMPLETE/);
    }

    const closeoutSurfaces = [
      queue,
      commandMap,
      canonIndex,
      register,
      activePlaybook,
      program,
      maoGoal,
    ].join('\n');
    assert.doesNotMatch(closeoutSurfaces, /WO-MAO-008/);
    assert.doesNotMatch(closeoutSurfaces, /WO-MAO-006[^\n]*(?:ACTIVE|NEXT)/);
    assert.doesNotMatch(closeoutSurfaces, /WO-MAO-007[^\n]*(?:ACTIVE|NEXT)/);
  });
});

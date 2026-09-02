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
    goalId: 'GOAL-TEST',
    loopId: 'LOOP-TEST',
    riskClass: 'R1',
    status: 'ready',
    dependencies: [],
    allowedSystems: [],
    blockedSystems: [{ name: 'Runtime' }],
    allowedFiles: [`docs/${id.toLowerCase()}/**`],
    evidenceRequired: [],
    evidenceProduced: [],
    validationGates: [],
    stopConditions: [{ type: 'scope_boundary', description: 'Stay inside the test scope.' }],
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
          ...item.allowedFiles.map((value, index) => ({
            id: `${item.id}-PATH-${index + 1}`,
            kind: 'path',
            value,
            status: 'active',
          })),
          ...(item.contractReservations ?? []).map((value, index) => ({
            id: `${item.id}-CONTRACT-${index + 1}`,
            kind: 'contract',
            value,
            status: 'active',
          })),
          ...(item.environmentReservations ?? []).map((value, index) => ({
            id: `${item.id}-ENVIRONMENT-${index + 1}`,
            kind: 'environment',
            value,
            status: 'active',
          })),
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

function protectedPathDecision(workOrderId, authorizedFiles, overrides = {}) {
  return {
    id: `OWNER-${workOrderId}-R3-TEST`,
    work_order: workOrderId,
    status: 'active',
    authority_class: 'R3-bounded-protected-path',
    authorized_files: authorizedFiles,
    effective_base_sha: 'a'.repeat(40),
    expires_at: '2026-08-17T23:59:59Z',
    ...overrides,
  };
}

function missionDecision(rootRecord, overrides = {}) {
  return {
    id: `OWNER-${rootRecord.id}-MISSION-TEST`,
    work_order: rootRecord.id,
    program: rootRecord.program,
    goal: rootRecord.goalId,
    loop: rootRecord.loopId,
    status: 'active',
    authority_class: 'R5-bounded-mission',
    authorized_repositories: ['bsvalues/terrafusion_os_1.0'],
    child_work_order_policy: { fresh_owner_decision_required: false },
    expires_at: '2026-08-17T23:59:59Z',
    ...overrides,
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
    assert.equal(
      parseArgs(['--owner-decisions', 'fixtures/owner-decisions.json']).ownerDecisions,
      'fixtures/owner-decisions.json'
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
      /missing-protected-path-authority:WO-TEST-023/
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-024').reasons[0],
      /protected-resource-reservation:environment:production/
    );
  });

  it('accepts exact protected files under one active matching owner decision', () => {
    const records = [
      record('WO-TEST-023A', {
        riskClass: 'R3',
        allowedFiles: ['packages/gis-pro/README.md', 'packages/gis-pro/metadata.json'],
      }),
    ];
    const options = optionsFor(records, {
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: {
        decisions: [
          protectedPathDecision(records[0].id, [
            'packages/gis-pro/README.md',
            'packages/gis-pro/metadata.json',
          ]),
        ],
      },
    });

    const plan = planWaves(registry(records), rules, options);

    assert.deepEqual(plan.initialExecutableSet, ['WO-TEST-023A']);
    assert.deepEqual(
      plan.waves[0].workOrders.map(item => item.workOrderId),
      ['WO-TEST-023A']
    );
    assert.match(
      plan.waves[0].workOrders[0].explanation,
      /protected paths authorized by OWNER-WO-TEST-023A-R3-TEST/
    );
  });

  it('rejects wildcard and partial protected-path grants', () => {
    const records = [
      record('WO-TEST-023B', {
        riskClass: 'R3',
        allowedFiles: ['packages/gis-pro/README.md', 'packages/gis-pro/metadata.json'],
      }),
    ];
    const wildcard = optionsFor(records, {
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: {
        decisions: [protectedPathDecision(records[0].id, ['packages/gis-pro/**'])],
      },
    });
    assert.match(
      planWaves(registry(records), rules, wildcard).excludedWorkOrders[0].reasons[0],
      /non-exact-protected-path-authority:packages\/gis-pro/
    );

    const partial = optionsFor(records, {
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: {
        decisions: [protectedPathDecision(records[0].id, ['packages/gis-pro/README.md'])],
      },
    });
    assert.match(
      planWaves(registry(records), rules, partial).excludedWorkOrders[0].reasons[0],
      /incomplete-protected-path-authority:packages\/gis-pro\/metadata.json/
    );

    const mixedWildcardAndExact = optionsFor(records, {
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: {
        decisions: [
          protectedPathDecision(records[0].id, [
            'packages/gis-pro/**',
            'packages/gis-pro/README.md',
            'packages/gis-pro/metadata.json',
          ]),
        ],
      },
    });
    assert.match(
      planWaves(registry(records), rules, mixedWildcardAndExact).excludedWorkOrders[0].reasons[0],
      /non-exact-protected-path-authority:packages\/gis-pro/
    );
  });

  it('rejects inactive, expired, conflicting, and insufficient protected-path decisions', () => {
    const records = [
      record('WO-TEST-023C', {
        riskClass: 'R3',
        allowedFiles: ['packages/gis-pro/README.md'],
      }),
    ];
    const decision = protectedPathDecision(records[0].id, records[0].allowedFiles);
    const cases = [
      {
        decisions: [{ ...decision, status: 'completed' }],
        expected: /missing-protected-path-authority:WO-TEST-023C/,
      },
      {
        decisions: [{ ...decision, expires_at: '2026-07-17T11:59:59Z' }],
        expected: /expired-protected-path-authority/,
      },
      {
        decisions: [decision, { ...decision, id: `${decision.id}-SECOND` }],
        expected: /conflicting-protected-path-authority/,
      },
      {
        decisions: [{ ...decision, authority_class: 'R2-bounded-protected-path' }],
        expected: /insufficient-protected-path-authority/,
      },
    ];

    for (const testCase of cases) {
      const options = optionsFor(records, {
        now: '2026-07-17T12:00:00Z',
        ownerDecisions: { decisions: testCase.decisions },
      });
      assert.match(
        planWaves(registry(records), rules, options).excludedWorkOrders[0].reasons[0],
        testCase.expected
      );
    }
  });

  it('does not let protected-path authority authorize a protected environment', () => {
    const records = [
      record('WO-TEST-023D', {
        riskClass: 'R3',
        allowedFiles: ['packages/gis-pro/README.md'],
      }),
    ];
    const options = optionsFor(records, {
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: {
        decisions: [protectedPathDecision(records[0].id, records[0].allowedFiles)],
      },
      reservations: {
        repository: 'bsvalues/terrafusion_os_1.0',
        candidateReservations: {
          [records[0].id]: [
            { id: 'PROD', kind: 'environment', value: 'production', scope: 'exact' },
          ],
        },
      },
    });

    assert.match(
      planWaves(registry(records), rules, options).excludedWorkOrders[0].reasons[0],
      /protected-resource-reservation:environment:production/
    );
  });

  it('inherits exact protected child authority from one registered terminal mission root', () => {
    const mission = record('WO-MISSION-000', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const child = record('WO-MISSION-001', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const grandchild = record('WO-MISSION-002', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: child.id, status: 'required' }],
      allowedFiles: ['frontend/src/mission.ts'],
    });
    const records = [mission, child, grandchild];
    const decision = missionDecision(mission);
    const options = optionsFor(records, {
      authority: 'R5',
      maxWorkers: 2,
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: { decisions: [decision] },
    });

    const plan = planWaves(registry(records), rules, options);

    assert.deepEqual(plan.initialExecutableSet, [child.id]);
    assert.deepEqual(
      plan.waves.map(wave => wave.workOrders.map(item => item.workOrderId)),
      [[child.id], [grandchild.id]]
    );
    assert.match(plan.waves[0].workOrders[0].explanation, new RegExp(decision.id));
    assert.match(plan.waves[1].workOrders[0].explanation, new RegExp(decision.id));
  });

  it('dispatches a WAL-like R5 protected-system child only after exact mission reservations pass', () => {
    const mission = record('WO-WAL-000', {
      program: 'Washington Assessor Launch V1',
      goalId: 'GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1',
      loopId: 'LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1',
      status: 'complete',
    });
    const child = record('WO-WAL-002', {
      program: mission.program,
      goalId: mission.goalId,
      loopId: mission.loopId,
      riskClass: 'R5',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedSystems: [
        {
          name: 'Authenticated county-bound backend runtime and frontend upload quarantine',
        },
      ],
      blockedSystems: [
        {
          name: 'External county writes, production deployment, and secrets mutation',
        },
      ],
      allowedFiles: [
        'backend/src/TerraFusion.API/Services/UploadService.cs',
        'frontend/src/services/upload.ts',
      ],
      contractReservations: [
        'wal.county-upload.csv-parser.v1',
        'wal.sql-source-profile.v1',
      ],
      environmentReservations: ['local-memory-stream-only'],
    });
    const decision = missionDecision(mission);
    const baseOptions = {
      authority: 'R5',
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: { decisions: [decision] },
    };
    const admitted = optionsFor([mission, child], baseOptions);

    const plan = planWaves(
      registry([mission, child]),
      rules,
      admitted
    );
    assert.deepEqual(plan.initialExecutableSet, [child.id]);
    assert.deepEqual(plan.excludedWorkOrders, [
      {
        workOrderId: mission.id,
        reasons: ['terminal-status'],
        explanation: 'Excluded: terminal-status.',
      },
    ]);
    assert.match(plan.waves[0].workOrders[0].explanation, new RegExp(decision.id));
    assert.deepEqual(
      plan.waves[0].workOrders[0].reservations
        .filter(reservation => reservation.kind === 'contract')
        .map(reservation => reservation.value),
      ['wal.county-upload.csv-parser.v1', 'wal.sql-source-profile.v1']
    );

    const noAuthority = optionsFor([mission, child], {
      authority: 'R5',
      now: baseOptions.now,
      ownerDecisions: { decisions: [] },
    });
    assert.match(
      planWaves(registry([mission, child]), rules, noAuthority).excludedWorkOrders.find(
        item => item.workOrderId === child.id
      ).reasons[0],
      /missing-protected-path-authority/
    );

    for (const environment of [
      'production',
      'live-county-db',
      'county-sql-credential',
      'secret-store',
    ]) {
      const deniedEnvironment = optionsFor([mission, child], baseOptions);
      deniedEnvironment.reservations.candidateReservations[child.id].push({
        id: `WO-WAL-002-${environment}`,
        kind: 'environment',
        value: environment,
        scope: 'exact',
        status: 'active',
      });
      assert.match(
        planWaves(registry([mission, child]), rules, deniedEnvironment).excludedWorkOrders.find(
          item => item.workOrderId === child.id
        ).reasons[0],
        new RegExp(`protected-resource-reservation:environment:${environment}`)
      );
    }
  });

  it('retains the bounded WAL E-reservation planner mechanics after protected completion', () => {
    const protectedRegistry = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/registry/work-order-registry.seed.json'),
        'utf8'
      )
    );
    const actualRegistry = structuredClone(protectedRegistry);
    const actualOwnerDecisions = JSON.parse(
      fs.readFileSync(path.join(root, '.governance/owner-decisions.json'), 'utf8')
    );
    const predecessorIds = ['WO-WAL-001D', 'WO-WAL-002D', 'WO-WAL-003D', 'WO-WAL-004D'];
    const childIds = ['WO-WAL-001E', 'WO-WAL-002E', 'WO-WAL-004E'];
    for (const childId of childIds) {
      actualRegistry.records.find(item => item.id === childId).status = 'ready';
    }
    actualRegistry.records.find(item => item.id === 'WO-WAL-000').nextCandidates = childIds.map(
      (id, index) => ({
        id,
        reason: 'Historical protected E-wave reservation planner fixture.',
        riskClass: index === 2 ? 'R5' : 'R3',
        blocked: false,
      })
    );
    for (const parentId of ['WO-WAL-001', 'WO-WAL-002', 'WO-WAL-004']) {
      const parent = actualRegistry.records.find(item => item.id === parentId);
      parent.nextCandidates.unshift({
        id: `${parentId}E`,
        reason: 'Historical protected E-wave reservation planner fixture.',
        riskClass: parentId === 'WO-WAL-004' ? 'R5' : 'R3',
        blocked: false,
      });
    }
    const selectedIds = new Set([
      'WO-WAL-000',
      'WO-WAL-000A',
      'WO-WAL-000B',
      'WO-WAL-000C',
      'WO-WAL-000D',
      'WO-WAL-000E',
      'WO-WAL-001A',
      'WO-WAL-002A',
      'WO-WAL-003A',
      'WO-WAL-004A',
      'WO-WAL-001B',
      'WO-WAL-002B',
      'WO-WAL-003B',
      'WO-WAL-004B',
      'WO-WAL-001C',
      'WO-WAL-002C',
      'WO-WAL-003C',
      'WO-WAL-004C',
      ...predecessorIds,
      ...childIds,
      'WO-WAL-005',
      'WO-WAL-006',
    ]);
    const actualRecords = actualRegistry.records.filter(item => selectedIds.has(item.id));
    const children = childIds.map(id => actualRecords.find(item => item.id === id));
    assert.ok(children.every(Boolean));
    assert.equal(
      children.find(item => item.id === 'WO-WAL-004E').validationGates[0].command,
      'dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter FullyQualifiedName~AuthenticatedCanonicalCountyContextTests && git diff --check && exact changed-path audit'
    );

    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/schema/work-order.schema.json'),
        'utf8'
      )
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    for (const item of [
      actualRecords.find(record => record.id === 'WO-WAL-000E'),
      ...predecessorIds.map(id => actualRecords.find(record => record.id === id)),
      ...children,
    ]) {
      assert.equal(validate(item), true, `${item.id}: ${JSON.stringify(validate.errors)}`);
    }
    assert.equal(validate({ ...children[0], contractReservations: ['production'] }), false);
    assert.equal(validate({ ...children[0], contractReservations: null }), false);
    assert.equal(validate({ ...children[0], environmentReservations: null }), false);
    assert.equal(
      validate({
        ...children[0],
        contractReservations: [
          children[0].contractReservations[0],
          children[0].contractReservations[0],
        ],
      }),
      false
    );
    assert.equal(
      validate({
        ...children[0],
        environmentReservations: [
          children[0].environmentReservations[0],
          children[0].environmentReservations[0],
        ],
      }),
      false
    );

    const baseOptions = optionsFor(actualRecords, {
      authority: 'R5',
      maxWorkers: 3,
      now: '2026-08-28T20:00:00Z',
      ownerDecisions: actualOwnerDecisions,
      verifiedDispatchRefs: ['refs/remotes/origin/main'],
    });
    const unverifiedPlan = planWaves(registry(actualRecords), rules, {
      ...baseOptions,
      verifiedDispatchRefs: [],
    });
    assert.deepEqual(unverifiedPlan.initialExecutableSet, []);
    for (const childId of childIds) {
      assert.ok(
        unverifiedPlan.excludedWorkOrders
          .find(item => item.workOrderId === childId)
          ?.reasons.includes('dispatch-source-unverified:refs/remotes/origin/main')
      );
    }
    const exactPlan = planWaves(registry(actualRecords), rules, baseOptions);
    assert.deepEqual(
      [...exactPlan.initialExecutableSet].sort(),
      [...childIds].sort(),
      JSON.stringify(
        exactPlan.excludedWorkOrders.filter(item => childIds.includes(item.workOrderId))
      )
    );
    for (const predecessorId of predecessorIds) {
      assert.equal(actualRecords.find(item => item.id === predecessorId).status, 'complete');
      assert.ok(
        exactPlan.excludedWorkOrders
          .find(item => item.workOrderId === predecessorId)
          .reasons.includes('terminal-status')
      );
    }
    for (const field of ['allowedFiles', 'contractReservations', 'environmentReservations']) {
      const reservations = [...predecessorIds.map(id => actualRecords.find(item => item.id === id)), ...children]
        .flatMap(item => item[field]);
      assert.equal(new Set(reservations).size, reservations.length, `${field} must not collide`);
    }
    assert.deepEqual(
      actualRegistry.records.find(item => item.id === 'WO-WAL-000').nextCandidates.map(item => item.id),
      childIds
    );
    for (const parentId of ['WO-WAL-001', 'WO-WAL-002', 'WO-WAL-004']) {
      assert.equal(actualRegistry.records.find(item => item.id === parentId).status, 'ready');
      assert.equal(
        actualRegistry.records.find(item => item.id === parentId).nextCandidates[0].id,
        `${parentId}E`
      );
    }
    const syncParent = actualRegistry.records.find(item => item.id === 'WO-WAL-003');
    assert.equal(syncParent.status, 'ready');
    assert.ok(syncParent.nextCandidates.every(item => item.id !== 'WO-WAL-003E'));
    assert.equal(actualRegistry.records.some(item => item.id === 'WO-WAL-003E'), false);
    assert.deepEqual(
      actualRecords.find(item => item.id === 'WO-WAL-003D').nextCandidates,
      []
    );
    assert.match(
      actualRecords
        .find(item => item.id === 'WO-WAL-000E')
        .stopConditions.find(item => item.type === 'authority_wall').description,
      /named county\/source\/system.*read-only credential or role.*secret-store reference.*execution\/network environment.*data classification\/handling.*source-side no-DML evidence method/
    );
    assert.match(
      actualRecords.find(item => item.id === 'WO-WAL-001D').validationGates[0].evidence[0],
      /9b1379a5dc1112bba3d836fd4f38dcba254c132b.*07d5737cf49be7010d8a94e31a20572987c2ffa3.*d1dcc7f2c1ed8bd0104890d2081b550b040c34b1/
    );
    assert.match(
      actualRecords.find(item => item.id === 'WO-WAL-002D').validationGates[0].evidence[0],
      /f4480bdb5213a406a77bc40b3f1c3d2be799e6e3.*6cb27bb3d202cc1ab8a334694ee7410826a18da0.*ea45e5b03135252e34cfc2cf5ec705b3f331951e/
    );
    assert.match(
      actualRecords.find(item => item.id === 'WO-WAL-003D').validationGates[0].evidence[0],
      /9155856c2d970f3d772c3f7790f91e017fb47dd8.*d006d3567a4a7e9da43e014e021b5cf81f976e39.*cc8a3fd1a9c648b07a0f7516df1f51b398433c10/
    );
    assert.match(
      actualRecords.find(item => item.id === 'WO-WAL-004D').validationGates[0].evidence[0],
      /d7f22442e95d91effea79c14667a9b2b00094f8d.*a4fd7d86594bd597f9839fe108051bbdabb09e3c/
    );
    for (const blockedId of ['WO-WAL-005', 'WO-WAL-006']) {
      assert.equal(actualRecords.find(item => item.id === blockedId).status, 'blocked');
      assert.ok(
        exactPlan.excludedWorkOrders
          .find(item => item.workOrderId === blockedId)
          .reasons.includes('blocked-status')
      );
    }

    function assertDenied(child, mutate, pattern) {
      const denied = structuredClone(baseOptions);
      mutate(denied.reservations.candidateReservations[child.id]);
      const exclusion = planWaves(registry(actualRecords), rules, denied).excludedWorkOrders.find(
        item => item.workOrderId === child.id
      );
      assert.ok(exclusion, `${child.id} should be excluded`);
      assert.match(exclusion.reasons.join('\n'), pattern);
    }

    for (const child of children) {
      for (const allowedFile of child.allowedFiles) {
        assertDenied(
          child,
          claims =>
            claims.splice(
              claims.findIndex(claim => claim.kind === 'path' && claim.value === allowedFile),
              1
            ),
          /missing path reservation/
        );
      }
      assertDenied(
        child,
        claims => {
          const pathClaim = claims.find(claim => claim.kind === 'path');
          claims.push({ ...pathClaim, id: `${child.id}-DUPLICATE-PATH` });
        },
        /duplicate path reservation/
      );
      assertDenied(
        child,
        claims => {
          claims.find(claim => claim.kind === 'path').scope = 'subtree';
        },
        /path scope mismatch/
      );
      assertDenied(
        child,
        claims =>
          claims.push({
            id: `${child.id}-EXTRA-PATH`,
            kind: 'path',
            value: 'docs/brain/workorders/active/WO-WAL-EXTRA.md',
          }),
        /extra path reservation/
      );
      assertDenied(
        child,
        claims =>
          claims.splice(
            claims.findIndex(claim => claim.kind === 'contract'),
            1
          ),
        /missing contract reservation/
      );
      assertDenied(
        child,
        claims =>
          claims.splice(
            claims.findIndex(claim => claim.kind === 'environment'),
            1
          ),
        /missing environment reservation/
      );
      assertDenied(
        child,
        claims =>
          claims.push({
            id: `${child.id}-EXTRA-CONTRACT`,
            kind: 'contract',
            value: 'wal.extra-reservation.v1',
          }),
        /extra contract reservation wal\.extra-reservation\.v1/
      );
      assertDenied(
        child,
        claims =>
          claims.push({
            id: `${child.id}-EXTRA-ENVIRONMENT`,
            kind: 'environment',
            value: 'local-extra-only',
          }),
        /extra environment reservation local-extra-only/
      );
      assertDenied(
        child,
        claims => {
          claims.find(claim => claim.kind === 'environment').kind = 'contract';
        },
        /cross-kind reservation/
      );
      assertDenied(
        child,
        claims => {
          claims.find(claim => claim.kind === 'contract').kind = 'environment';
        },
        /cross-kind reservation/
      );
      assertDenied(
        child,
        claims =>
          claims.push({
            id: `${child.id}-PRODUCTION-AS-CONTRACT`,
            kind: 'contract',
            value: 'production',
          }),
        /protected-resource-reservation:contract:production/
      );
      assertDenied(
        child,
        claims =>
          claims.push({
            id: `${child.id}-LIVE-COUNTY`,
            kind: 'environment',
            value: 'live-county-db',
          }),
        /protected-resource-reservation:environment:live-county-db/
      );
    }

    const registryRelabel = actualRecords.map(item =>
      item.id === children[0].id ? { ...item, contractReservations: ['production'] } : item
    );
    const registryRelabelOptions = optionsFor(registryRelabel, {
      authority: 'R5',
      maxWorkers: 3,
      now: '2026-08-28T20:00:00Z',
      ownerDecisions: actualOwnerDecisions,
      verifiedDispatchRefs: ['refs/remotes/origin/main'],
    });
    assert.match(
      planWaves(registry(registryRelabel), rules, registryRelabelOptions).excludedWorkOrders.find(
        item => item.workOrderId === children[0].id
      ).reasons[0],
      /must be a versioned contract identifier/
    );

    for (const field of ['contractReservations', 'environmentReservations']) {
      const nullTypedRecords = actualRecords.map(item =>
        item.id === children[0].id ? { ...item, [field]: null } : item
      );
      const nullTypedOptions = optionsFor(nullTypedRecords, {
        authority: 'R5',
        maxWorkers: 3,
        now: '2026-08-28T20:00:00Z',
        ownerDecisions: actualOwnerDecisions,
        verifiedDispatchRefs: ['refs/remotes/origin/main'],
      });
      assert.match(
        planWaves(registry(nullTypedRecords), rules, nullTypedOptions).excludedWorkOrders.find(
          item => item.workOrderId === children[0].id
        ).reasons[0],
        new RegExp(`${field} must be an array`)
      );
    }
  });

  it('reconciles protected WAL upload admission and releases only the durable ledger child', () => {
    const actualRegistry = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/registry/work-order-registry.seed.json'),
        'utf8'
      )
    );
    const actualOwnerDecisions = JSON.parse(
      fs.readFileSync(path.join(root, '.governance/owner-decisions.json'), 'utf8')
    );
    const reconciliation = actualRegistry.records.find(item => item.id === 'WO-WAL-000G');
    const releaseReconciliation = actualRegistry.records.find(item => item.id === 'WO-WAL-000H');
    const durableReconciliation = actualRegistry.records.find(item => item.id === 'WO-WAL-000I');
    const identityChild = actualRegistry.records.find(item => item.id === 'WO-WAL-004F');
    const uploadChild = actualRegistry.records.find(item => item.id === 'WO-WAL-002F');
    const durableChild = actualRegistry.records.find(item => item.id === 'WO-WAL-002G');
    const forbiddenIds = ['WO-WAL-001F', 'WO-WAL-003E', 'WO-WAL-003F'];
    const selectedIds = new Set([
      'WO-WAL-000',
      'WO-WAL-000F',
      'WO-WAL-000G',
      'WO-WAL-000H',
      'WO-WAL-000I',
      'WO-WAL-002E',
      'WO-WAL-004D',
      'WO-WAL-004E',
      'WO-WAL-004F',
      'WO-WAL-002F',
      'WO-WAL-002G',
      'WO-WAL-005',
      'WO-WAL-006',
    ]);
    const recordById = new Map(actualRegistry.records.map(item => [item.id, item]));
    const dependencyQueue = [durableChild.id];
    const traversedDependencies = new Set();
    while (dependencyQueue.length > 0) {
      const id = dependencyQueue.shift();
      if (traversedDependencies.has(id)) continue;
      traversedDependencies.add(id);
      selectedIds.add(id);
      for (const dependency of recordById.get(id)?.dependencies ?? []) {
        dependencyQueue.push(dependency.id);
      }
    }
    const selectedRecords = actualRegistry.records.filter(item => selectedIds.has(item.id));
    const preDurableRecords = selectedRecords.filter(
      item => ![durableReconciliation.id, durableChild.id].includes(item.id)
    );
    const preReleaseRecords = structuredClone(preDurableRecords);
    const preReleaseReconciliation = preReleaseRecords.find(
      item => item.id === releaseReconciliation.id
    );
    const preReleaseUpload = preReleaseRecords.find(item => item.id === uploadChild.id);
    preReleaseReconciliation.status = 'ready';
    preReleaseUpload.status = 'blocked';
    preReleaseUpload.dependencies.find(item => item.id === releaseReconciliation.id).status =
      'required';

    assert.ok(reconciliation);
    assert.equal(reconciliation.status, 'complete');
    assert.deepEqual(reconciliation.contractReservations, []);
    assert.deepEqual(reconciliation.environmentReservations, []);
    assert.deepEqual(
      reconciliation.nextCandidates.map(item => [item.id, item.blocked]),
      [
        ['WO-WAL-004F', false],
        ['WO-WAL-000H', true],
      ]
    );
    assert.equal(reconciliation.allowedFiles.length, 8);
    assert.equal(new Set(reconciliation.allowedFiles).size, 8);
    assert.deepEqual(
      reconciliation.allowedFiles,
      [
        'docs/brain/workorders/active/WO-WAL-000G-runtime-integration-reservations.md',
        'docs/brain/workorders/active/WO-WAL-000H-upload-admission-release-reconciliation.md',
        'docs/brain/workorders/active/WO-WAL-002F-authenticated-county-csv-api-admission.md',
        'docs/brain/workorders/active/WO-WAL-004F-authenticated-canonical-context-runtime-integration.md',
        'docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md',
        'docs/brain/workorders/programs/washington-assessor-launch-v1.md',
        'docs/brain/workorders/registry/work-order-registry.seed.json',
        'docs/brain/workorders/tools/wo-wave-plan.test.mjs',
      ]
    );

    assert.equal(identityChild.status, 'complete');
    assert.deepEqual(identityChild.contractReservations, [
      'wal.authenticated-canonical-county-runtime-context.v1',
    ]);
    assert.deepEqual(identityChild.environmentReservations, [
      'local-api-auth-context-persisted-guid-fixture-only',
    ]);
    assert.equal(identityChild.allowedFiles.length, 6);
    assert.equal(releaseReconciliation.status, 'complete');
    assert.deepEqual(releaseReconciliation.contractReservations, []);
    assert.deepEqual(releaseReconciliation.environmentReservations, []);
    assert.equal(releaseReconciliation.allowedFiles.length, 6);
    assert.ok(
      releaseReconciliation.dependencies.some(
        item => item.id === identityChild.id && item.status === 'satisfied'
      )
    );
    assert.deepEqual(
      identityChild.nextCandidates.map(item => item.id),
      [releaseReconciliation.id]
    );
    assert.equal(uploadChild.status, 'complete');
    assert.deepEqual(uploadChild.contractReservations, [
      'wal.county-upload.authenticated-csv-api-admission.v1',
    ]);
    assert.deepEqual(uploadChild.environmentReservations, [
      'local-api-synthetic-csv-intake-only',
    ]);
    assert.equal(uploadChild.allowedFiles.length, 3);
    assert.ok(
      uploadChild.dependencies.some(
        item => item.id === identityChild.id && item.status === 'satisfied'
      )
    );
    assert.ok(
      uploadChild.dependencies.some(
        item => item.id === releaseReconciliation.id && item.status === 'satisfied'
      )
    );
    assert.deepEqual(
      uploadChild.nextCandidates.map(item => item.id),
      [durableReconciliation.id]
    );
    assert.equal(durableReconciliation.status, 'complete');
    assert.deepEqual(durableReconciliation.contractReservations, []);
    assert.deepEqual(durableReconciliation.environmentReservations, []);
    assert.equal(durableReconciliation.allowedFiles.length, 7);
    assert.ok(
      durableReconciliation.dependencies.some(
        item => item.id === uploadChild.id && item.status === 'satisfied'
      )
    );
    assert.deepEqual(
      durableReconciliation.nextCandidates.map(item => item.id),
      [durableChild.id]
    );
    assert.equal(durableChild.status, 'ready');
    assert.deepEqual(durableChild.contractReservations, [
      'wal.county-upload.durable-admission-ledger.v1',
    ]);
    assert.deepEqual(durableChild.environmentReservations, [
      'local-efcore-synthetic-csv-ledger-only',
    ]);
    assert.equal(durableChild.allowedFiles.length, 9);
    assert.equal(new Set(durableChild.allowedFiles).size, 9);
    assert.ok(
      durableChild.dependencies.some(
        item => item.id === durableReconciliation.id && item.status === 'satisfied'
      )
    );
    assert.equal(
      identityChild.validationGates[0].evidence.some(item =>
        item.includes('54e0df259c1712b156260b1b5d24444611906e2b')
      ),
      true
    );
    assert.equal(identityChild.validationGates[0].result, 'pass');
    assert.equal(releaseReconciliation.validationGates[0].result, 'pass');

    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/schema/work-order.schema.json'),
        'utf8'
      )
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    for (const id of [
      'WO-WAL-000G',
      'WO-WAL-000H',
      'WO-WAL-000I',
      'WO-WAL-004F',
      'WO-WAL-002F',
      'WO-WAL-002G',
    ]) {
      const item = actualRegistry.records.find(record => record.id === id);
      assert.equal(validate(item), true, `${id}: ${JSON.stringify(validate.errors)}`);
    }

    for (const id of ['WO-WAL-001', 'WO-WAL-002', 'WO-WAL-003', 'WO-WAL-004']) {
      assert.equal(actualRegistry.records.find(item => item.id === id).status, 'ready');
    }
    for (const id of ['WO-WAL-005', 'WO-WAL-006']) {
      assert.equal(actualRegistry.records.find(item => item.id === id).status, 'blocked');
    }
    for (const id of forbiddenIds) {
      assert.equal(actualRegistry.records.some(item => item.id === id), false);
    }
    assert.deepEqual(actualRegistry.records.find(item => item.id === 'WO-WAL-000').nextCandidates, []);

    const syncAuthorityWall = reconciliation.stopConditions.find(
      item => item.type === 'authority_wall'
    ).description;
    assert.match(
      syncAuthorityWall,
      /named county\/source\/system.*read-only credential or role.*secret-store reference.*execution\/network environment.*data classification\/handling.*source-side no-DML evidence method/
    );

    const durableOptions = optionsFor(selectedRecords, {
      authority: 'R5',
      maxWorkers: 2,
      now: '2026-09-01T23:43:00Z',
      ownerDecisions: actualOwnerDecisions,
      verifiedDispatchRefs: ['refs/remotes/origin/main'],
    });
    const preDurableOptions = optionsFor(preDurableRecords, {
      authority: 'R5',
      maxWorkers: 2,
      now: '2026-09-01T23:42:25Z',
      ownerDecisions: actualOwnerDecisions,
      verifiedDispatchRefs: ['refs/remotes/origin/main'],
    });
    const preReleaseOptions = optionsFor(preReleaseRecords, {
      authority: 'R5',
      maxWorkers: 2,
      now: '2026-09-01T22:09:37Z',
      ownerDecisions: actualOwnerDecisions,
      verifiedDispatchRefs: ['refs/remotes/origin/main'],
    });
    const durablePlan = planWaves(registry(selectedRecords), rules, durableOptions);
    const preDurablePlan = planWaves(
      registry(preDurableRecords),
      rules,
      preDurableOptions
    );
    const preReleasePlan = planWaves(
      registry(preReleaseRecords),
      rules,
      preReleaseOptions
    );
    const unverifiedPlan = planWaves(registry(selectedRecords), rules, {
      ...durableOptions,
      verifiedDispatchRefs: [],
    });
    assert.deepEqual(
      preReleasePlan.initialExecutableSet,
      [releaseReconciliation.id],
      JSON.stringify(
        preReleasePlan.excludedWorkOrders.find(
          item => item.workOrderId === releaseReconciliation.id
        )
      )
    );
    assert.deepEqual(preDurablePlan.initialExecutableSet, []);
    assert.equal(preDurableRecords.some(item => item.id === durableChild.id), false);
    assert.equal(preDurableRecords.some(item => item.id === durableReconciliation.id), false);
    assert.deepEqual(
      durablePlan.initialExecutableSet,
      [durableChild.id],
      JSON.stringify(durablePlan.excludedWorkOrders.find(item => item.workOrderId === durableChild.id))
    );
    assert.deepEqual(
      durablePlan.waves[0].workOrders.map(item => item.workOrderId),
      [durableChild.id]
    );
    assert.equal(
      preReleasePlan.waves
        .flatMap(wave => wave.workOrders)
        .some(item => item.workOrderId === uploadChild.id),
      false
    );
    assert.deepEqual(unverifiedPlan.initialExecutableSet, []);
    for (const id of [
      'WO-WAL-000F',
      'WO-WAL-000G',
      'WO-WAL-000H',
      'WO-WAL-000I',
      'WO-WAL-002E',
      'WO-WAL-002F',
      'WO-WAL-004D',
      'WO-WAL-004E',
      'WO-WAL-004F',
    ]) {
      assert.ok(
        durablePlan.excludedWorkOrders
          .find(item => item.workOrderId === id)
          .reasons.includes('terminal-status')
      );
    }
    const blockedUpload = preReleasePlan.excludedWorkOrders.find(
      item => item.workOrderId === uploadChild.id
    );
    assert.ok(blockedUpload.reasons.includes('blocked-status'), JSON.stringify(blockedUpload));

    const missingPath = structuredClone(durableOptions);
    missingPath.reservations.candidateReservations[durableChild.id].shift();
    assert.match(
      planWaves(registry(selectedRecords), rules, missingPath).excludedWorkOrders.find(
        item => item.workOrderId === durableChild.id
      ).reasons.join('\n'),
      /missing path reservation/
    );

    for (const extra of [
      { id: 'DRIFT-CONTRACT', kind: 'contract', value: 'wal.unregistered-f-child.v1' },
      { id: 'DRIFT-ENVIRONMENT', kind: 'environment', value: 'local-unregistered-f-child' },
    ]) {
      const drifted = structuredClone(durableOptions);
      drifted.reservations.candidateReservations[durableChild.id].push(extra);
      assert.match(
        planWaves(registry(selectedRecords), rules, drifted).excludedWorkOrders.find(
          item => item.workOrderId === durableChild.id
        ).reasons.join('\n'),
        /extra (contract|environment) reservation/
      );
    }
  });

  it('preserves non-protected legacy contract and environment claims without typed fields', () => {
    const legacy = record('WO-LEGACY-001', {
      allowedFiles: ['docs/legacy/**', 'scripts/legacy/**'],
    });
    const admitted = optionsFor([legacy]);
    admitted.reservations.candidateReservations[legacy.id].pop();
    admitted.reservations.candidateReservations[legacy.id][0].value = 'docs/legacy/file.md';
    admitted.reservations.candidateReservations[legacy.id].push(
      { id: 'LEGACY-CONTRACT', kind: 'contract', value: 'wal.safe-parser.v1' },
      { id: 'LEGACY-ENVIRONMENT', kind: 'environment', value: 'local-only' }
    );
    assert.deepEqual(planWaves(registry([legacy]), rules, admitted).initialExecutableSet, [
      legacy.id,
    ]);

    const relabeled = structuredClone(admitted);
    relabeled.reservations.candidateReservations[legacy.id].push({
      id: 'LEGACY-PRODUCTION-AS-CONTRACT',
      kind: 'contract',
      value: 'production',
    });
    assert.match(
      planWaves(registry([legacy]), rules, relabeled).excludedWorkOrders.find(
        item => item.workOrderId === legacy.id
      ).reasons[0],
      /protected-resource-reservation:contract:production/
    );
  });

  it('fails closed when mission-child identity or ancestry is not exact', () => {
    const mission = record('WO-MISSION-010', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const baseChild = record('WO-MISSION-011', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const cases = [
      {
        name: 'policy true',
        decision: { child_work_order_policy: { fresh_owner_decision_required: true } },
      },
      { name: 'policy absent', decision: { child_work_order_policy: undefined } },
      { name: 'repository absent', decision: { authorized_repositories: [] } },
      { name: 'program mismatch', child: { program: 'Other' } },
      { name: 'goal mismatch', child: { goalId: 'GOAL-OTHER' } },
      { name: 'goal missing', child: { goalId: undefined } },
      { name: 'loop mismatch', child: { loopId: 'LOOP-OTHER' } },
      { name: 'loop missing', child: { loopId: undefined } },
      { name: 'not a descendant', child: { dependencies: [] } },
      {
        name: 'root nonterminal',
        root: { status: 'in_progress' },
        child: { dependencies: [{ id: mission.id, status: 'required' }] },
      },
      { name: 'root missing', decision: { work_order: 'WO-MISSION-099' } },
      { name: 'inactive', decision: { status: 'completed' } },
    ];

    for (const testCase of cases) {
      const root = { ...mission, ...(testCase.root ?? {}) };
      const child = { ...baseChild, ...(testCase.child ?? {}) };
      const decision = missionDecision(root, testCase.decision ?? {});
      const records = [root, child];
      const options = optionsFor(records, {
        authority: 'R5',
        now: '2026-07-17T12:00:00Z',
        ownerDecisions: { decisions: [decision] },
      });
      const plan = planWaves(registry(records), rules, options);
      const excluded = plan.excludedWorkOrders.find(item => item.workOrderId === child.id);
      assert.ok(excluded, testCase.name);
      assert.ok(
        excluded.reasons.includes(`missing-protected-path-authority:${child.id}`),
        `${testCase.name}: ${excluded.reasons.join(', ')}`
      );
    }
  });

  it('rejects a transitive dependency path that crosses another mission identity', () => {
    const mission = record('WO-MISSION-015', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const foreignBridge = record('WO-MISSION-016', {
      program: 'Other',
      goalId: 'GOAL-OTHER',
      loopId: 'LOOP-OTHER',
      status: 'complete',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
    });
    const child = record('WO-MISSION-017', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: foreignBridge.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const records = [mission, foreignBridge, child];
    const options = optionsFor(records, {
      authority: 'R5',
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: { decisions: [missionDecision(mission)] },
    });

    const plan = planWaves(registry(records), rules, options);

    assert.ok(
      plan.excludedWorkOrders
        .find(item => item.workOrderId === child.id)
        .reasons.includes(`missing-protected-path-authority:${child.id}`)
    );
  });

  it('fails closed on expired, insufficient, or conflicting mission authority', () => {
    const mission = record('WO-MISSION-020', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const child = record('WO-MISSION-021', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const cases = [
      {
        decisions: [missionDecision(mission, { expires_at: '2026-07-17T11:59:59Z' })],
        expected: /expired-protected-path-authority/,
      },
      {
        decisions: [missionDecision(mission, { authority_class: 'R3-bounded-mission' })],
        expected: /insufficient-protected-path-authority/,
      },
      {
        decisions: [
          missionDecision(mission),
          missionDecision(mission, { id: 'OWNER-WO-MISSION-020-MISSION-SECOND' }),
        ],
        expected: /conflicting-protected-path-authority/,
      },
    ];

    for (const testCase of cases) {
      const records = [mission, child];
      const options = optionsFor(records, {
        authority: 'R5',
        now: '2026-07-17T12:00:00Z',
        ownerDecisions: { decisions: testCase.decisions },
      });
      assert.match(
        planWaves(registry(records), rules, options).excludedWorkOrders.find(
          item => item.workOrderId === child.id
        ).reasons[0],
        testCase.expected
      );
    }
  });

  it('prefers an exact child decision over inherited mission authority', () => {
    const mission = record('WO-MISSION-030', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const child = record('WO-MISSION-031', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R3',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const exact = protectedPathDecision(child.id, child.allowedFiles);
    const records = [mission, child];
    const options = optionsFor(records, {
      authority: 'R5',
      now: '2026-07-17T12:00:00Z',
      ownerDecisions: { decisions: [missionDecision(mission), exact] },
    });

    const plan = planWaves(registry(records), rules, options);

    assert.deepEqual(plan.initialExecutableSet, [child.id]);
    assert.match(plan.waves[0].workOrders[0].explanation, new RegExp(exact.id));
  });

  it('keeps mission child paths and reservations exact and protected environments denied', () => {
    const mission = record('WO-MISSION-040', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      status: 'complete',
    });
    const child = record('WO-MISSION-041', {
      program: 'Mission',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      riskClass: 'R4',
      dependencies: [{ id: mission.id, status: 'satisfied' }],
      allowedFiles: ['backend/src/Mission.cs'],
    });
    const ownerDecisions = { decisions: [missionDecision(mission)] };
    const baseOptions = {
      authority: 'R5',
      now: '2026-07-17T12:00:00Z',
      ownerDecisions,
    };

    const subtree = { ...child, allowedFiles: ['backend/src/**'] };
    assert.match(
      planWaves(
        registry([mission, subtree]),
        rules,
        optionsFor([mission, subtree], baseOptions)
      ).excludedWorkOrders.find(item => item.workOrderId === child.id).reasons[0],
      /non-exact-protected-path-scope/
    );

    const outside = optionsFor([mission, child], baseOptions);
    outside.reservations.candidateReservations[child.id][0].value = 'backend/src/Other.cs';
    assert.match(
      planWaves(registry([mission, child]), rules, outside).excludedWorkOrders.find(
        item => item.workOrderId === child.id
      ).reasons[0],
      /outside declared allowedFiles/
    );

    const secondProtectedFile = {
      ...child,
      allowedFiles: [...child.allowedFiles, 'frontend/src/Mission.ts'],
    };
    const missingExactReservation = optionsFor([mission, secondProtectedFile], baseOptions);
    missingExactReservation.reservations.candidateReservations[child.id].pop();
    assert.match(
      planWaves(
        registry([mission, secondProtectedFile]),
        rules,
        missingExactReservation
      ).excludedWorkOrders.find(item => item.workOrderId === child.id).reasons[0],
      /missing-exact-protected-path-reservation:frontend\/src\/mission\.ts/
    );

    const environment = optionsFor([mission, child], baseOptions);
    environment.reservations.candidateReservations[child.id] = [
      { id: 'PROD', kind: 'environment', value: 'production', scope: 'exact' },
    ];
    assert.match(
      planWaves(registry([mission, child]), rules, environment).excludedWorkOrders.find(
        item => item.workOrderId === child.id
      ).reasons[0],
      /protected-resource-reservation:environment:production/
    );
  });

  it('validates optional mission routing identities against the Work Order schema', () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'docs/brain/workorders/schema/work-order.schema.json'),
        'utf8'
      )
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    const missionChild = record('WO-MISSION-050', {
      program: 'Mission',
      goal: 'Execute the exact mission child.',
      goalId: 'GOAL-MISSION',
      loopId: 'LOOP-MISSION',
      allowedFiles: ['backend/src/Mission.cs'],
    });

    assert.equal(validate(missionChild), true, JSON.stringify(validate.errors));
    assert.equal(validate({ ...missionChild, goalId: 'mission' }), false);
    assert.equal(validate({ ...missionChild, loopId: 'mission' }), false);
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
      /missing-protected-path-authority:WO-TEST-026/
    );
    assert.match(
      plan.excludedWorkOrders.find(item => item.workOrderId === 'WO-TEST-027').reasons[0],
      /missing-protected-path-authority:WO-TEST-027/
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

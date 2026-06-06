/**
 * Canon agent task state machine — self-test.
 *
 * ADR-005: every agent task is an explicit Draft -> ... -> TraceSealed/Closed
 * state machine. Invalid transitions and governance-guard violations are hard
 * errors. Deterministic, read-only (caller supplies actor + timestamps).
 * Run: node --test os-platform/core/tests/canon-task.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTask,
  transition,
  canTransition,
  isTerminal,
  STATES,
  INITIAL_STATE,
} from '../canon/canon-task.mjs';

function newTask(overrides = {}) {
  return createTask({
    taskId: 'canon-task-1',
    intent: 'fix os-canon shell launch drift',
    surface: 'os-canon',
    risk: 'high',
    scope: { allowedPaths: ['frontend/apps/os-shell/src/**'], forbiddenPaths: ['ARCHIVE/**'] },
    actor: 'agent:planner',
    at: '2026-06-06T00:00:00Z',
    ...overrides,
  });
}

const step = (t, to, opts = {}) => transition(t, to, { actor: 'agent:x', at: '2026-06-06T00:00:01Z', ...opts });

test('TS.1 createTask starts in Draft with a creation history entry', () => {
  const t = newTask();
  assert.equal(t.state, INITIAL_STATE);
  assert.equal(t.state, 'Draft');
  assert.equal(t.history.length, 1);
  assert.equal(t.history[0].from, null);
  assert.equal(t.history[0].to, 'Draft');
  assert.ok(Object.isFrozen(t));
});

test('TS.2 createTask with invalid surface fails loudly', () => {
  assert.throws(() => newTask({ surface: 'mainframe' }), /surface/i);
});

test('TS.3 createTask missing scope.allowedPaths fails loudly', () => {
  assert.throws(() => newTask({ scope: { forbiddenPaths: [] } }), /allowedPaths/i);
});

test('TS.4 valid transition advances state and appends immutable history', () => {
  const t = newTask();
  const t2 = step(t, 'CanonContextLoaded');
  assert.equal(t2.state, 'CanonContextLoaded');
  assert.equal(t2.history.length, 2);
  assert.equal(t.state, 'Draft'); // original untouched
  assert.ok(Object.isFrozen(t2));
});

test('TS.5 invalid (skipping) transition fails loudly', () => {
  assert.throws(() => step(newTask(), 'Executing'), /invalid transition/i);
});

test('TS.6 cannot transition out of a terminal state', () => {
  const failed = step(newTask(), 'Failed');
  assert.equal(isTerminal('Failed'), true);
  assert.throws(() => step(failed, 'CanonContextLoaded'), /terminal/i);
});

test('TS.7 AwaitingApproval -> WorktreeCreated requires approved=true', () => {
  let t = newTask();
  for (const s of ['CanonContextLoaded', 'ScopeProposed', 'PlanProposed', 'RiskScored', 'AwaitingApproval']) t = step(t, s);
  assert.throws(() => step(t, 'WorktreeCreated'), /approv/i);
  assert.doesNotThrow(() => step(t, 'WorktreeCreated', { approved: true }));
});

test('TS.8 AwaitingApproval -> Failed (rejection) is allowed', () => {
  let t = newTask();
  for (const s of ['CanonContextLoaded', 'ScopeProposed', 'PlanProposed', 'RiskScored', 'AwaitingApproval']) t = step(t, s);
  assert.doesNotThrow(() => step(t, 'Failed', { reason: 'approval denied' }));
});

test('TS.9 GatesRunning -> ReviewRequired requires gatesPassed=true', () => {
  let t = newTask();
  for (const s of [
    'CanonContextLoaded', 'ScopeProposed', 'PlanProposed', 'RiskScored', 'AwaitingApproval',
  ]) t = step(t, s);
  t = step(t, 'WorktreeCreated', { approved: true });
  for (const s of ['Executing', 'DiffReady', 'GatesRunning']) t = step(t, s);
  assert.throws(() => step(t, 'ReviewRequired'), /gate/i);
  assert.doesNotThrow(() => step(t, 'ReviewRequired', { gatesPassed: true }));
});

test('TS.10 GatesRunning -> Failed (gate failure) is allowed', () => {
  let t = newTask();
  for (const s of ['CanonContextLoaded', 'ScopeProposed', 'PlanProposed', 'RiskScored', 'AwaitingApproval']) t = step(t, s);
  t = step(t, 'WorktreeCreated', { approved: true });
  for (const s of ['Executing', 'DiffReady', 'GatesRunning']) t = step(t, s);
  assert.doesNotThrow(() => step(t, 'Failed', { reason: 'typecheck failed' }));
});

test('TS.11 transition requires actor and at (fail-loud)', () => {
  const t = newTask();
  assert.throws(() => transition(t, 'CanonContextLoaded', { at: '2026-06-06T00:00:01Z' }), /actor/i);
  assert.throws(() => transition(t, 'CanonContextLoaded', { actor: 'a' }), /at/i);
});

test('TS.12 full happy path Draft -> Closed walks every state', () => {
  let t = newTask();
  const path = [
    'CanonContextLoaded', 'ScopeProposed', 'PlanProposed', 'RiskScored', 'AwaitingApproval',
  ];
  for (const s of path) t = step(t, s);
  t = step(t, 'WorktreeCreated', { approved: true });
  for (const s of ['Executing', 'DiffReady', 'GatesRunning']) t = step(t, s);
  t = step(t, 'ReviewRequired', { gatesPassed: true });
  for (const s of ['CommitReady', 'TraceSealed', 'PRReady', 'Closed']) t = step(t, s);
  assert.equal(t.state, 'Closed');
  assert.equal(isTerminal('Closed'), true);
  // Happy path visits 15 states (all except the off-path terminal 'Failed'):
  // 1 creation entry (Draft) + 14 transitions.
  assert.equal(t.history.length, 15);
  assert.equal(STATES.length, 16); // includes off-path terminal 'Failed'
});

test('TS.13 canTransition reflects structural legality', () => {
  assert.equal(canTransition('Draft', 'CanonContextLoaded'), true);
  assert.equal(canTransition('Draft', 'Failed'), true);
  assert.equal(canTransition('Draft', 'Closed'), false);
  assert.equal(canTransition('Closed', 'Failed'), false);
});

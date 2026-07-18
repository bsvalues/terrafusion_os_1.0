#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_STATUSES,
  BLOCKED_STATUSES,
  RISK_ORDER,
  SELECTABLE_STATUSES,
  TERMINAL_STATUSES,
  compareCandidates,
  scoreRecord,
} from './wo-query.mjs';

const DEFAULT_REGISTRY = 'docs/brain/workorders/registry/work-order-registry.seed.json';
const DEFAULT_RULES = 'docs/brain/workorders/scoring/next-work-order-scoring.rules.json';
const DEFAULT_OWNER_DECISIONS = '.governance/owner-decisions.json';
const DEFAULT_MAX_WORKERS = 2;
const DEFAULT_SEARCH_NODE_LIMIT = 100000;
const CANONICAL_REPOSITORY = 'bsvalues/terrafusion_os_1.0';
const SATISFIED_DEPENDENCY_STATUSES = new Set([
  'satisfied',
  'complete',
  'merged',
  'waived',
  'superseded',
]);
const PROJECTED_COMPLETION_STATUSES = new Set(['complete', 'merged', 'superseded']);
const BLOCKING_RESERVATION_STATUSES = new Set(['active']);
const NONBLOCKING_RESERVATION_STATUSES = new Set(['released', 'handed_off']);
const PATH_META = /[*?[\]]/;
const WORK_ORDER_ID = /^WO-[A-Z0-9]+-[A-Z0-9-]+$/;
const PROTECTED_PATH_RESERVATIONS = [
  { kind: 'path', value: '.github', scope: 'subtree' },
  { kind: 'path', value: 'applications', scope: 'subtree' },
  { kind: 'path', value: 'backend', scope: 'subtree' },
  { kind: 'path', value: 'deploy', scope: 'subtree' },
  { kind: 'path', value: 'deployment', scope: 'subtree' },
  { kind: 'path', value: 'docker', scope: 'subtree' },
  { kind: 'path', value: 'frontend', scope: 'subtree' },
  { kind: 'path', value: 'infra', scope: 'subtree' },
  { kind: 'path', value: 'infrastructure', scope: 'subtree' },
  { kind: 'path', value: 'os-platform/core/pilot', scope: 'subtree' },
  { kind: 'path', value: 'packages', scope: 'subtree' },
  { kind: 'path', value: 'scripts/deploy', scope: 'subtree' },
  { kind: 'path', value: 'tools/sync', scope: 'subtree' },
  { kind: 'path', value: 'package.json', scope: 'exact' },
  { kind: 'path', value: 'pnpm-lock.yaml', scope: 'exact' },
  { kind: 'path', value: 'package-lock.json', scope: 'exact' },
  { kind: 'path', value: 'yarn.lock', scope: 'exact' },
];
const PROTECTED_RESOURCE = /production|prod|county|pacs|secret|credential|live|sql|database|deploy/;

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${optionName}`);
  return value;
}

function parsePositiveInteger(value, optionName) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return number;
}

function validateAuthority(value) {
  if (!RISK_ORDER.includes(value))
    throw new Error(`authority must be one of ${RISK_ORDER.join(', ')}`);
  return value;
}

function parseArgs(argv) {
  const args = {
    registry: DEFAULT_REGISTRY,
    rules: DEFAULT_RULES,
    reservations: null,
    ownerDecisions: DEFAULT_OWNER_DECISIONS,
    authority: 'R3',
    maxWorkers: DEFAULT_MAX_WORKERS,
    searchNodeLimit: DEFAULT_SEARCH_NODE_LIMIT,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      args.json = true;
    } else if (
      ['--registry', '--rules', '--reservations', '--owner-decisions', '--authority'].includes(arg)
    ) {
      const key = arg === '--owner-decisions' ? 'ownerDecisions' : arg.slice(2);
      args[key] = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === '--max-workers') {
      args.maxWorkers = parsePositiveInteger(readOptionValue(argv, index, arg), arg);
      index += 1;
    } else if (arg === '--search-node-limit') {
      args.searchNodeLimit = parsePositiveInteger(readOptionValue(argv, index, arg), arg);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  args.authority = validateAuthority(args.authority);
  return args;
}

function usage() {
  return [
    'Usage: node docs/brain/workorders/tools/wo-wave-plan.mjs [options]',
    '',
    'Options:',
    '  --json                       Print machine-readable JSON.',
    `  --registry <path>            Registry JSON path. Default: ${DEFAULT_REGISTRY}`,
    `  --rules <path>               Scoring rules JSON path. Default: ${DEFAULT_RULES}`,
    '  --reservations <path>        Optional active/candidate reservation input JSON.',
    `  --owner-decisions <path>     Owner decision register. Default: ${DEFAULT_OWNER_DECISIONS}`,
    '  --authority <R0-R5>          Current authority boundary. Default: R3',
    `  --max-workers <count>        Maximum workers per wave. Default: ${DEFAULT_MAX_WORKERS}`,
    `  --search-node-limit <count>  Fail-closed search bound. Default: ${DEFAULT_SEARCH_NODE_LIMIT}`,
    '  --help                       Show this help.',
  ].join('\n');
}

function repoRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not locate repo root from wo-wave-plan.mjs');
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function normalizeIdentifier(value, source) {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${source} must be a non-empty string`);
  const normalized = value.trim().toLowerCase();
  if (/\s/.test(normalized)) throw new Error(`${source} cannot contain whitespace`);
  return normalized;
}

function normalizePath(value, source, scope = null) {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${source} must be a non-empty path`);
  let normalized = value.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  let inferredScope = scope;
  if (normalized.endsWith('/**')) {
    if (scope && scope !== 'subtree') {
      throw new Error(`${source}.scope contradicts the trailing /** subtree marker`);
    }
    normalized = normalized.slice(0, -3);
    inferredScope = 'subtree';
  }
  inferredScope ??= 'exact';
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || PATH_META.test(normalized)) {
    throw new Error(
      `${source} must be a normalized repository-relative exact path or trailing /** subtree`
    );
  }
  const parts = normalized.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) {
    throw new Error(`${source} contains an unsafe path segment`);
  }
  if (!new Set(['exact', 'subtree']).has(inferredScope))
    throw new Error(`${source}.scope is invalid`);
  return { value: normalized.toLowerCase(), scope: inferredScope };
}

function normalizeReservation(raw, source, defaults = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`${source} must be an object`);
  const kind = raw.kind ?? 'path';
  if (!new Set(['path', 'contract', 'environment']).has(kind))
    throw new Error(`${source}.kind is invalid`);
  const status = raw.status ?? defaults.status ?? 'active';
  if (!BLOCKING_RESERVATION_STATUSES.has(status) && !NONBLOCKING_RESERVATION_STATUSES.has(status)) {
    throw new Error(`${source}.status is invalid`);
  }
  if (raw.pullRequest != null && (!Number.isSafeInteger(raw.pullRequest) || raw.pullRequest < 1)) {
    throw new Error(`${source}.pullRequest must be a positive integer when present`);
  }
  let value;
  let scope = raw.scope ?? 'exact';
  if (kind === 'path') {
    ({ value, scope } = normalizePath(raw.value, `${source}.value`, raw.scope ?? null));
  } else {
    value = normalizeIdentifier(raw.value, `${source}.value`);
    if (scope !== 'exact') throw new Error(`${source} contract/environment scope must be exact`);
  }
  return {
    id: normalizeIdentifier(
      raw.id ?? `${defaults.workOrderId ?? 'reservation'}-${kind}-${value}`,
      `${source}.id`
    ),
    kind,
    value,
    scope,
    status,
    stale: raw.stale === true,
    handoffValid: raw.handoffValid === true,
    workOrderId: raw.workOrderId ?? defaults.workOrderId ?? null,
    pullRequest: raw.pullRequest ?? null,
    repository: raw.repository ?? defaults.repository ?? null,
  };
}

function reservationCovers(reservation, candidateValue) {
  return (
    reservation.value === candidateValue ||
    (reservation.scope === 'subtree' && candidateValue.startsWith(`${reservation.value}/`))
  );
}

function reservationsOverlap(left, right) {
  if (left.kind !== right.kind) return false;
  if (left.kind !== 'path') return left.value === right.value;
  return reservationCovers(left, right.value) || reservationCovers(right, left.value);
}

function protectedReservationReason(reservation) {
  if (
    reservation.kind === 'path' &&
    PROTECTED_PATH_RESERVATIONS.some(protectedPath =>
      reservationsOverlap(reservation, protectedPath)
    )
  ) {
    return `protected-path-reservation:${reservation.value}`;
  }
  if (reservation.kind !== 'path' && PROTECTED_RESOURCE.test(reservation.value)) {
    return `protected-resource-reservation:${reservation.kind}:${reservation.value}`;
  }
  return null;
}

function protectedPathAuthority(record, protectedPaths, ownerDecisions, authority, now) {
  if (protectedPaths.length === 0) return { decisionId: null, exactFiles: new Set() };
  if (!ownerDecisions || !Array.isArray(ownerDecisions.decisions)) {
    return { reason: 'invalid-protected-path-authority-register' };
  }

  const matching = ownerDecisions.decisions.filter(
    decision => decision?.work_order === record.id && decision?.status === 'active'
  );
  if (matching.length === 0) return { reason: `missing-protected-path-authority:${record.id}` };
  if (matching.length > 1) {
    return {
      reason: `conflicting-protected-path-authority:${matching
        .map(decision => decision.id ?? 'unknown')
        .sort()
        .join(',')}`,
    };
  }

  const decision = matching[0];
  const authorityMatch = /^R([0-5])(?:-|$)/i.exec(decision.authority_class ?? '');
  if (!authorityMatch) return { reason: `invalid-protected-path-authority-class:${decision.id}` };
  const decisionRisk = `R${authorityMatch[1]}`;
  if (
    RISK_ORDER.indexOf(decisionRisk) < RISK_ORDER.indexOf(record.riskClass) ||
    RISK_ORDER.indexOf(decisionRisk) > RISK_ORDER.indexOf(authority)
  ) {
    return { reason: `insufficient-protected-path-authority:${decision.id}` };
  }

  if (decision.expires_at != null) {
    const expiresAt = Date.parse(decision.expires_at);
    if (!Number.isFinite(expiresAt)) {
      return { reason: `invalid-protected-path-authority-expiry:${decision.id}` };
    }
    if (expiresAt <= now) return { reason: `expired-protected-path-authority:${decision.id}` };
  }

  if (!Array.isArray(decision.authorized_files)) {
    return { reason: `invalid-protected-path-authority-files:${decision.id}` };
  }
  const exactFiles = new Set();
  try {
    for (const [index, value] of decision.authorized_files.entries()) {
      const normalized = normalizePath(value, `${decision.id}.authorized_files[${index}]`);
      if (normalized.scope === 'exact') exactFiles.add(normalized.value);
    }
  } catch {
    return { reason: `invalid-protected-path-authority-files:${decision.id}` };
  }

  for (const protectedPath of protectedPaths) {
    if (protectedPath.scope !== 'exact') {
      return { reason: `non-exact-protected-path-scope:${protectedPath.value}` };
    }
    if (!exactFiles.has(protectedPath.value)) {
      return { reason: `incomplete-protected-path-authority:${protectedPath.value}` };
    }
  }
  return { decisionId: decision.id, exactFiles };
}

function allowedPathReservations(record) {
  if (!Array.isArray(record.allowedFiles)) {
    throw new Error(`${record.id}.allowedFiles must be an array`);
  }
  return record.allowedFiles.map((value, index) => {
    const normalized = normalizePath(value, `${record.id}.allowedFiles[${index}]`);
    return { kind: 'path', ...normalized };
  });
}

function reservationWithinAllowedPath(reservation, allowedPath) {
  if (reservation.kind !== 'path') return true;
  if (allowedPath.scope === 'exact') {
    return reservation.scope === 'exact' && reservation.value === allowedPath.value;
  }
  return (
    reservation.value === allowedPath.value || reservation.value.startsWith(`${allowedPath.value}/`)
  );
}

function blockingReservation(reservation) {
  return BLOCKING_RESERVATION_STATUSES.has(reservation.status);
}

function reservationKey(reservation) {
  return [reservation.kind, reservation.value, reservation.scope, reservation.status].join(':');
}

function candidateReservations(record, reservationInput, allowedPaths) {
  const repository = normalizeIdentifier(reservationInput?.repository, 'reservations.repository');
  const declared = reservationInput?.candidateReservations?.[record.id] ?? [];
  if (!Array.isArray(declared) || declared.length === 0) {
    throw new Error(
      `${record.id} requires explicit path, contract, or environment reservation claims`
    );
  }
  const normalized = declared.map((value, index) =>
    normalizeReservation(value, `candidateReservations.${record.id}[${index}]`, {
      workOrderId: record.id,
      repository,
    })
  );
  for (const reservation of normalized) {
    if (reservation.status !== 'active') {
      throw new Error(`${record.id} candidate reservation ${reservation.id} must be active`);
    }
    if (reservation.stale) {
      throw new Error(`${record.id} candidate reservation ${reservation.id} is stale`);
    }
    if (reservation.repository !== repository) {
      throw new Error(
        `${record.id} candidate reservation ${reservation.id} repository does not match ${repository}`
      );
    }
    if (reservation.workOrderId !== record.id) {
      throw new Error(
        `${record.id} candidate reservation ${reservation.id} is bound to ${reservation.workOrderId}`
      );
    }
    if (
      reservation.kind === 'path' &&
      !allowedPaths.some(allowedPath => reservationWithinAllowedPath(reservation, allowedPath))
    ) {
      throw new Error(
        `${record.id} candidate reservation ${reservation.id} is outside declared allowedFiles`
      );
    }
  }
  const unique = new Map(normalized.map(reservation => [reservationKey(reservation), reservation]));
  return [...unique.values()].sort((a, b) => reservationKey(a).localeCompare(reservationKey(b)));
}

function activeReservations(reservationInput) {
  const repository =
    reservationInput?.repository == null
      ? null
      : normalizeIdentifier(reservationInput.repository, 'reservations.repository');
  return (reservationInput?.activeReservations ?? [])
    .map((value, index) =>
      normalizeReservation(value, `activeReservations[${index}]`, { repository })
    )
    .map(reservation => {
      if (!reservation.repository)
        throw new Error(`active reservation ${reservation.id} requires repository identity`);
      if (reservation.status === 'handed_off' && !reservation.handoffValid) {
        throw new Error(`active reservation ${reservation.id} has unverified handoff state`);
      }
      if (repository && reservation.repository !== repository) {
        throw new Error(
          `cross-repository planning is blocked without canonical path identity: ${reservation.repository} != ${repository}`
        );
      }
      return reservation;
    })
    .filter(blockingReservation)
    .sort(
      (a, b) =>
        reservationKey(a).localeCompare(reservationKey(b)) ||
        (a.workOrderId ?? '').localeCompare(b.workOrderId ?? '')
    );
}

function conflictDetails(left, right) {
  const conflicts = [];
  for (const leftReservation of left.reservations) {
    for (const rightReservation of right.reservations) {
      if (reservationsOverlap(leftReservation, rightReservation)) {
        conflicts.push({
          kind: leftReservation.kind,
          left: reservationKey(leftReservation),
          right: reservationKey(rightReservation),
          leftWorkOrder: left.workOrderId,
          rightWorkOrder: right.workOrderId,
        });
      }
    }
  }
  return conflicts.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function dependenciesReady(record, virtuallyCompleted) {
  return (record.dependencies ?? []).every(
    dependency =>
      SATISFIED_DEPENDENCY_STATUSES.has(dependency.status) || virtuallyCompleted.has(dependency.id)
  );
}

function dependencyReasons(record, virtuallyCompleted) {
  return (record.dependencies ?? [])
    .filter(
      dependency =>
        !SATISFIED_DEPENDENCY_STATUSES.has(dependency.status) &&
        !virtuallyCompleted.has(dependency.id)
    )
    .map(dependency => `dependency-not-cleared:${dependency.id}`)
    .sort();
}

function comparePlannable(left, right, rules, recordById, activeLane) {
  return compareCandidates(left.score, right.score, rules, recordById, activeLane);
}

function chooseMaximumConflictFree(candidates, maxWorkers, searchNodeLimit) {
  let visited = 0;
  let best = [];

  function search(index, selected) {
    visited += 1;
    if (visited > searchNodeLimit) {
      throw new Error(
        `planner search node limit exceeded (${searchNodeLimit}); reduce candidate set or raise the explicit bound`
      );
    }
    if (selected.length > best.length) best = [...selected];
    if (best.length === maxWorkers || index >= candidates.length) return;
    if (selected.length + (candidates.length - index) <= best.length) return;

    const candidate = candidates[index];
    if (selected.every(member => conflictDetails(candidate, member).length === 0)) {
      search(index + 1, [...selected, candidate]);
      if (best.length === maxWorkers) return;
    }
    search(index + 1, selected);
  }

  search(0, []);
  return { selected: best, searchNodes: visited };
}

function staticExclusions(record, rules, authority) {
  return scoreRecord(record, rules, authority).hardExclusions.filter(
    reason => reason !== 'dependency-not-cleared'
  );
}

function dependencyContradictions(record, recordById) {
  const reasons = [];
  for (const dependency of record.dependencies ?? []) {
    if (dependency.id === record.id) reasons.push(`self-dependency:${dependency.id}`);
    const referenced = recordById.get(dependency.id);
    if (!referenced) {
      if (dependency.status !== 'waived') reasons.push(`missing-dependency:${dependency.id}`);
      continue;
    }
    if (
      SATISFIED_DEPENDENCY_STATUSES.has(dependency.status) &&
      dependency.status !== 'waived' &&
      !PROJECTED_COMPLETION_STATUSES.has(referenced.status)
    ) {
      reasons.push(`dependency-state-contradiction:${dependency.id}`);
    }
  }
  return reasons.sort();
}

function participatesInDependencyCycle(startId, remainingIds, recordById) {
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return id === startId;
    if (visited.has(id) || !remainingIds.has(id)) return false;
    visiting.add(id);
    const record = recordById.get(id);
    for (const dependency of record?.dependencies ?? []) {
      if (!SATISFIED_DEPENDENCY_STATUSES.has(dependency.status) && visit(dependency.id))
        return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  return visit(startId);
}

function planWaves(registry, rules, options = {}) {
  const authority = validateAuthority(options.authority ?? 'R3');
  const maxWorkers = parsePositiveInteger(options.maxWorkers ?? DEFAULT_MAX_WORKERS, 'maxWorkers');
  const searchNodeLimit = parsePositiveInteger(
    options.searchNodeLimit ?? DEFAULT_SEARCH_NODE_LIMIT,
    'searchNodeLimit'
  );
  const reservationInput = options.reservations ?? {};
  const now = Date.parse(options.now ?? new Date().toISOString());
  if (!Number.isFinite(now)) throw new Error('now must be a valid ISO-8601 timestamp');
  const ownerDecisions = options.ownerDecisions ?? { decisions: [] };
  if (reservationInput.repository != null) {
    const requestedRepository = normalizeIdentifier(
      reservationInput.repository,
      'reservations.repository'
    );
    if (requestedRepository !== CANONICAL_REPOSITORY) {
      throw new Error(
        `cross-repository planning is blocked without canonical path identity: ${requestedRepository} != ${CANONICAL_REPOSITORY}`
      );
    }
  }
  const records = registry.records ?? [];
  if (!Array.isArray(records)) throw new Error('registry.records must be an array');
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`registry record ${index} must be an object`);
    }
    if (typeof record.id !== 'string' || !record.id.trim()) {
      throw new Error(`registry record ${index} requires a non-empty string Work Order ID`);
    }
  }
  const ids = records.map(record => record.id);
  if (new Set(ids).size !== ids.length)
    throw new Error('registry contains duplicate Work Order IDs');
  const recordById = new Map(records.map(record => [record.id, record]));
  const activeLane =
    records
      .filter(record => ACTIVE_STATUSES.has(record.status))
      .sort((left, right) => left.id.localeCompare(right.id))[0]?.program ?? null;
  const active = activeReservations(reservationInput);
  const virtuallyCompleted = new Set(
    records
      .filter(record => PROJECTED_COMPLETION_STATUSES.has(record.status))
      .map(record => record.id)
  );
  const excluded = [];
  const plannable = [];

  for (const record of records) {
    const reasons = [
      ...staticExclusions(record, rules, authority),
      ...dependencyContradictions(record, recordById),
    ];
    if (!WORK_ORDER_ID.test(record.id)) reasons.push('invalid-work-order-id');
    if (record.status !== 'ready' || reasons.length > 0) {
      const normalizedReasons =
        reasons.length > 0
          ? reasons
          : [
              TERMINAL_STATUSES.has(record.status)
                ? 'terminal-status'
                : ACTIVE_STATUSES.has(record.status)
                  ? 'active-work-order'
                  : BLOCKED_STATUSES.has(record.status)
                    ? 'blocked-status'
                    : record.status === 'proposed'
                      ? 'not-ready-status:proposed'
                      : 'unsupported-status',
            ];
      excluded.push({
        workOrderId: record.id,
        reasons: [...new Set(normalizedReasons)].sort(),
        explanation: `Excluded: ${[...new Set(normalizedReasons)].sort().join(', ')}.`,
      });
      continue;
    }

    let reservations;
    let protectedAuthority;
    try {
      const allowedPaths = allowedPathReservations(record);
      const protectedAllowedPaths = allowedPaths.filter(protectedReservationReason);
      protectedAuthority = protectedPathAuthority(
        record,
        protectedAllowedPaths,
        ownerDecisions,
        authority,
        now
      );
      if (protectedAuthority.reason) {
        const reason = protectedAuthority.reason;
        excluded.push({
          workOrderId: record.id,
          reasons: [reason],
          explanation: `Excluded: ${reason}.`,
        });
        continue;
      }
      reservations = candidateReservations(record, reservationInput, allowedPaths);
    } catch (error) {
      const reason = `invalid-reservation:${error instanceof Error ? error.message : String(error)}`;
      excluded.push({
        workOrderId: record.id,
        reasons: [reason],
        explanation: `Excluded: ${reason}.`,
      });
      continue;
    }
    const protectedReason = reservations
      .map(reservation => {
        const reason = protectedReservationReason(reservation);
        if (!reason) return null;
        if (
          reservation.kind === 'path' &&
          reservation.scope === 'exact' &&
          protectedAuthority.exactFiles.has(reservation.value)
        ) {
          return null;
        }
        return reason;
      })
      .find(Boolean);
    if (protectedReason) {
      excluded.push({
        workOrderId: record.id,
        reasons: [protectedReason],
        explanation: `Excluded: ${protectedReason}.`,
      });
      continue;
    }
    const candidate = {
      workOrderId: record.id,
      record,
      score: scoreRecord(record, rules, authority),
      reservations,
      authorityDecisionId: protectedAuthority.decisionId,
    };
    const conflicts = active.flatMap(reservation =>
      conflictDetails(candidate, {
        workOrderId: reservation.workOrderId ?? 'ACTIVE-RESERVATION',
        reservations: [reservation],
      })
    );
    if (conflicts.length > 0) {
      const stale = conflicts.some(conflict =>
        active.some(
          reservation => reservationKey(reservation) === conflict.right && reservation.stale
        )
      );
      const reason = stale ? 'stale-active-reservation-conflict' : 'active-reservation-conflict';
      excluded.push({
        workOrderId: record.id,
        reasons: [reason],
        conflicts,
        explanation: `Excluded: ${reason}.`,
      });
      continue;
    }
    plannable.push(candidate);
  }

  plannable.sort((a, b) => comparePlannable(a, b, rules, recordById, activeLane));
  const initiallyExecutable = plannable.filter(candidate =>
    dependenciesReady(candidate.record, virtuallyCompleted)
  );
  const remaining = [...plannable];
  const waves = [];
  let totalSearchNodes = 0;

  while (remaining.length > 0) {
    const ready = remaining.filter(candidate =>
      dependenciesReady(candidate.record, virtuallyCompleted)
    );
    if (ready.length === 0) break;
    const remainingSearchNodes = searchNodeLimit - totalSearchNodes;
    if (remainingSearchNodes < 1) {
      throw new Error(
        `planner search node limit exceeded (${searchNodeLimit}) across projected waves`
      );
    }
    const { selected, searchNodes } = chooseMaximumConflictFree(
      ready,
      maxWorkers,
      remainingSearchNodes
    );
    totalSearchNodes += searchNodes;
    if (selected.length === 0)
      throw new Error('planner failed to select from a non-empty executable set');
    const selectedIds = new Set(selected.map(candidate => candidate.workOrderId));
    const priorCompletions = [...virtuallyCompleted].sort();
    waves.push({
      wave: waves.length + 1,
      workOrders: selected.map(candidate => ({
        workOrderId: candidate.workOrderId,
        score: candidate.score.score,
        riskClass: candidate.score.riskClass,
        reservations: candidate.reservations,
        explanation: candidate.authorityDecisionId
          ? `Selected in priority order within a maximum-cardinality conflict-free set of ${selected.length}/${maxWorkers}; protected paths authorized by ${candidate.authorityDecisionId}.`
          : `Selected in priority order within a maximum-cardinality conflict-free set of ${selected.length}/${maxWorkers}.`,
      })),
      workerBudget: maxWorkers,
      utilization: selected.length,
      dependencyAssumption: priorCompletions,
    });
    for (const candidate of selected) virtuallyCompleted.add(candidate.workOrderId);
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (selectedIds.has(remaining[index].workOrderId)) remaining.splice(index, 1);
    }
  }

  for (const candidate of remaining) {
    const reasons = dependencyReasons(candidate.record, virtuallyCompleted);
    const remainingIds = new Set(remaining.map(item => item.workOrderId));
    if (participatesInDependencyCycle(candidate.workOrderId, remainingIds, recordById))
      reasons.push('dependency-cycle');
    reasons.sort();
    excluded.push({
      workOrderId: candidate.workOrderId,
      reasons: reasons.length > 0 ? reasons : ['dependency-cycle-or-missing-node'],
      explanation: `Excluded: ${(reasons.length > 0 ? reasons : ['dependency-cycle-or-missing-node']).join(', ')}.`,
    });
  }

  excluded.sort((a, b) => a.workOrderId.localeCompare(b.workOrderId));
  return {
    schemaVersion: '1.0.0',
    mode: 'read-only',
    authority,
    registry: {
      schemaVersion: registry.schemaVersion ?? null,
      generatedBy: registry.generatedBy ?? null,
      recordCount: records.length,
    },
    budget: { maxWorkers, searchNodeLimit, searchNodesVisited: totalSearchNodes },
    semantics: {
      dependencyProjection: 'a later wave assumes earlier projected waves completed successfully',
      reservationConflict:
        'MAO-003 exact/subtree path overlap and exact contract/environment equality',
      staleReservationBehavior: 'stale active reservations remain blocking',
      sideEffects: 'none',
    },
    initialExecutableSet: initiallyExecutable.map(candidate => candidate.workOrderId),
    waves,
    excludedWorkOrders: excluded,
  };
}

function printText(plan) {
  const lines = [
    'WORK ORDER PARALLEL WAVE PLAN',
    `Mode: ${plan.mode}`,
    `Authority: ${plan.authority}`,
    `Initial executable set: ${plan.initialExecutableSet.join(', ') || 'none'}`,
    `Worker budget: ${plan.budget.maxWorkers}`,
    `Projected waves: ${plan.waves.length}`,
  ];
  for (const wave of plan.waves)
    lines.push(`- Wave ${wave.wave}: ${wave.workOrders.map(item => item.workOrderId).join(', ')}`);
  lines.push(`Excluded: ${plan.excludedWorkOrders.length}`);
  return lines.join('\n');
}

export { parseArgs, planWaves, reservationsOverlap };

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      process.exit(0);
    }
    const root = repoRoot();
    const registry = readJson(root, args.registry);
    const rules = readJson(root, args.rules);
    const reservations = args.reservations ? readJson(root, args.reservations) : {};
    const ownerDecisions = args.ownerDecisions
      ? readJson(root, args.ownerDecisions)
      : { decisions: [] };
    const plan = planWaves(registry, rules, {
      authority: args.authority,
      maxWorkers: args.maxWorkers,
      searchNodeLimit: args.searchNodeLimit,
      reservations,
      ownerDecisions,
    });
    console.log(args.json ? JSON.stringify(plan, null, 2) : printText(plan));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

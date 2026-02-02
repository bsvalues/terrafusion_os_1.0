/**
 * Phase 4N29 – Autonomy State Loader + TTL Enforcement
 * =====================================================
 * Canonical state management for autonomy pause/resume.
 *
 * Design principles:
 * - Fail-closed on missing/invalid state (operator must explicitly enable)
 * - TTL enforcement (pauses expire)
 * - Deterministic decision output
 * - Ledger-visible proof of pause state
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema Version
// ─────────────────────────────────────────────────────────────────────────────

export const AUTONOMY_STATE_SCHEMA_VERSION = '1.1.0'; // 1.1.0: Added freeze capability

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AutonomyStateValue = 'active' | 'paused';

/**
 * Freeze reason categories – determines authorization requirements.
 * - audit: Annual/quarterly audit (CIO or Security approval)
 * - election: Election period moratorium (CIO approval)
 * - incident: Major incident response (Security or Engineering approval)
 * - compliance: Regulatory hold (CIO or Security approval)
 */
export type FreezeReasonCategory = 'audit' | 'election' | 'incident' | 'compliance';

/**
 * Approver roles from autonomy-approvers.json
 */
export type ApproverRole = 'cio' | 'security' | 'engineering';

/**
 * Freeze state – a governance lever HARDER than pause.
 * Unlike pause, freeze blocks ALL actors including incident-publisher.
 */
export interface FreezeState {
  /** Whether freeze is currently active */
  active: boolean;
  /** Reason category for authorization checking */
  category: FreezeReasonCategory | null;
  /** Human-readable reason text */
  reason: string | null;
  /** Who set the freeze (must be in authorized role) */
  setBy: string | null;
  /** Role of the person who set freeze */
  setByRole: ApproverRole | null;
  /** When freeze was activated (ISO timestamp) */
  setAt: string | null;
  /** When freeze expires (ISO timestamp, null = no auto-expire) */
  expiresAt: string | null;
  /** Related ticket ID for tracking (e.g., INC-123, AUDIT-2026-Q2) */
  ticketId: string | null;
}

/**
 * Freeze policy configuration
 */
export interface FreezePolicyConfig {
  /** If true, missing freeze state means frozen (fail-closed) */
  failClosedOnInvalidFreeze: boolean;
  /** Role requirements by reason category */
  categoryRoles: Record<FreezeReasonCategory, ApproverRole[]>;
  /** Maximum freeze duration in hours (null = no limit) */
  maxDurationHours: number | null;
  /** Default freeze duration in hours if not specified */
  defaultDurationHours: number;
}

/**
 * Freeze history entry for audit trail
 */
export interface FreezeHistoryEntry {
  action: 'freeze' | 'unfreeze';
  category: FreezeReasonCategory | null;
  reason: string | null;
  actor: string;
  actorRole: ApproverRole | null;
  timestamp: string;
  ticketId: string | null;
  expiresAt: string | null;
}

export interface AutonomyStatePolicy {
  /** If true, missing state file means paused (fail-closed) */
  failClosedOnMissing: boolean;
  /** If true, invalid state file means paused (fail-closed) */
  failClosedOnInvalid: boolean;
  /** If true, incident publisher can proceed even when paused */
  allowIncidentPublisherWhenPaused: boolean;
}

export interface AutonomyStateHistoryEntry {
  state: AutonomyStateValue;
  updatedAt: string;
  updatedBy: string;
  reason: string | null;
  expiresAt: string | null;
}

export interface AutonomyState {
  schemaVersion: string;
  state: AutonomyStateValue;
  updatedAt: string;
  updatedBy: string;
  reason: string | null;
  expiresAt: string | null;
  policy: AutonomyStatePolicy;
  history: AutonomyStateHistoryEntry[];
  /** Freeze state – HARDER than pause, blocks ALL actors */
  freeze?: FreezeState;
  /** Freeze history for audit trail */
  freezeHistory?: FreezeHistoryEntry[];
}

export interface AutonomyDecision {
  allowed: boolean;
  state: AutonomyStateValue;
  reason: string | null;
  expiresAt: string | null;
  expired: boolean;
  source: 'file' | 'fail-closed-missing' | 'fail-closed-invalid' | 'fail-closed-expired' | 'frozen';
  timestamp: string;
  filePath: string;
  /** If blocked by freeze, freeze details */
  freeze?: {
    active: boolean;
    category: FreezeReasonCategory | null;
    reason: string | null;
    setBy: string | null;
    expiresAt: string | null;
    ticketId: string | null;
  };
}

export interface AutonomyContext {
  actor: 'pr-lane' | 'evidence-publisher' | 'incident-publisher';
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STATE_FILENAME = 'AUTONOMY_STATE.json';

const DEFAULT_POLICY: AutonomyStatePolicy = {
  failClosedOnMissing: true,
  failClosedOnInvalid: true,
  allowIncidentPublisherWhenPaused: true,
};

/**
 * Default freeze policy – role requirements by category.
 */
export const DEFAULT_FREEZE_POLICY: FreezePolicyConfig = {
  failClosedOnInvalidFreeze: true,
  categoryRoles: {
    audit: ['cio', 'security'],
    election: ['cio'],
    incident: ['security', 'engineering'],
    compliance: ['cio', 'security'],
  },
  maxDurationHours: 168, // 7 days max
  defaultDurationHours: 72, // 3 days default
};

/**
 * Default (inactive) freeze state
 */
export const DEFAULT_FREEZE_STATE: FreezeState = {
  active: false,
  category: null,
  reason: null,
  setBy: null,
  setByRole: null,
  setAt: null,
  expiresAt: null,
  ticketId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// State File Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the canonical path to the autonomy state file.
 * Priority: ENV override > default location relative to this file.
 */
export function resolveStatePath(): string {
  const envPath = process.env.TERRAFUSION_AUTONOMY_STATE_PATH;
  if (envPath) {
    return path.resolve(envPath);
  }
  // Default: relative to autonomy-viewer package root
  return path.resolve(__dirname, '..', DEFAULT_STATE_FILENAME);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function isValidState(obj: unknown): obj is AutonomyState {
  if (typeof obj !== 'object' || obj === null) return false;
  const state = obj as Record<string, unknown>;

  if (typeof state.schemaVersion !== 'string') return false;
  if (state.state !== 'active' && state.state !== 'paused') return false;
  if (typeof state.updatedAt !== 'string') return false;
  if (typeof state.updatedBy !== 'string') return false;
  if (typeof state.policy !== 'object' || state.policy === null) return false;

  const policy = state.policy as Record<string, unknown>;
  if (typeof policy.failClosedOnMissing !== 'boolean') return false;
  if (typeof policy.failClosedOnInvalid !== 'boolean') return false;
  if (typeof policy.allowIncidentPublisherWhenPaused !== 'boolean') return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TTL Enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a pause has expired based on expiresAt timestamp.
 * Returns true if expired (should resume).
 */
export function isPauseExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  return now >= expiry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load the autonomy state from the canonical file.
 * Returns null if file missing or invalid (caller decides fail-closed behavior).
 */
export function loadAutonomyState(filePath?: string): AutonomyState | null {
  const resolvedPath = filePath ?? resolveStatePath();

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(content);

    if (!isValidState(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save the autonomy state to the canonical file.
 */
export function saveAutonomyState(state: AutonomyState, filePath?: string): void {
  const resolvedPath = filePath ?? resolveStatePath();
  fs.writeFileSync(resolvedPath, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if freeze has expired based on expiresAt timestamp.
 * Returns true if expired (should auto-unfreeze).
 */
export function isFreezeExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false; // No expiry = indefinite freeze
  const expiry = new Date(expiresAt);
  return now >= expiry;
}

/**
 * Determine if autonomy is allowed to proceed.
 * This is the core decision function used by PR lane and publishers.
 *
 * Decision logic (priority order):
 * 1. If FROZEN (and not expired) → BLOCKED (no exceptions, not even incident-publisher)
 * 2. Load state file
 * 3. If missing and failClosedOnMissing → paused
 * 4. If invalid and failClosedOnInvalid → paused
 * 5. If paused but expired → allowed (auto-resume)
 * 6. If paused and not expired → paused
 * 7. If active → allowed
 */
export function checkAutonomyAllowed(
  context: AutonomyContext,
  filePath?: string,
  now: Date = new Date()
): AutonomyDecision {
  const resolvedPath = filePath ?? resolveStatePath();
  const timestamp = now.toISOString();

  const state = loadAutonomyState(resolvedPath);

  // Handle missing file
  if (state === null) {
    // Check if file exists but is invalid vs truly missing
    const exists = fs.existsSync(resolvedPath);
    const source = exists ? 'fail-closed-invalid' : 'fail-closed-missing';

    return {
      allowed: false,
      state: 'paused',
      reason: exists ? 'State file invalid' : 'State file missing',
      expiresAt: null,
      expired: false,
      source,
      timestamp,
      filePath: resolvedPath,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FREEZE CHECK – takes precedence over pause, blocks ALL actors
  // ─────────────────────────────────────────────────────────────────────────
  const freeze = state.freeze ?? DEFAULT_FREEZE_STATE;
  if (freeze.active) {
    const freezeExpired = isFreezeExpired(freeze.expiresAt, now);

    if (!freezeExpired) {
      // FROZEN – no exceptions, even incident-publisher is blocked
      return {
        allowed: false,
        state: state.state, // Keep underlying state
        reason: freeze.reason ?? 'Autonomy frozen by leadership',
        expiresAt: freeze.expiresAt,
        expired: false,
        source: 'frozen',
        timestamp,
        filePath: resolvedPath,
        freeze: {
          active: true,
          category: freeze.category,
          reason: freeze.reason,
          setBy: freeze.setBy,
          expiresAt: freeze.expiresAt,
          ticketId: freeze.ticketId,
        },
      };
    }
    // Freeze expired – continue to normal pause/active logic
  }

  // Handle paused state
  if (state.state === 'paused') {
    const expired = isPauseExpired(state.expiresAt, now);

    // Special case: incident publisher allowed even when paused
    if (context.actor === 'incident-publisher' && state.policy.allowIncidentPublisherWhenPaused) {
      return {
        allowed: true,
        state: 'paused',
        reason: state.reason,
        expiresAt: state.expiresAt,
        expired,
        source: 'file',
        timestamp,
        filePath: resolvedPath,
      };
    }

    // Auto-resume if expired
    if (expired) {
      return {
        allowed: true,
        state: 'active',
        reason: `Pause expired at ${state.expiresAt}`,
        expiresAt: state.expiresAt,
        expired: true,
        source: 'fail-closed-expired',
        timestamp,
        filePath: resolvedPath,
      };
    }

    return {
      allowed: false,
      state: 'paused',
      reason: state.reason,
      expiresAt: state.expiresAt,
      expired: false,
      source: 'file',
      timestamp,
      filePath: resolvedPath,
    };
  }

  // Handle active state
  return {
    allowed: true,
    state: 'active',
    reason: null,
    expiresAt: null,
    expired: false,
    source: 'file',
    timestamp,
    filePath: resolvedPath,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// State Mutation (for CLI)
// ─────────────────────────────────────────────────────────────────────────────

export interface PauseOptions {
  reason: string;
  expiresAt?: string; // ISO timestamp
  duration?: string; // e.g., "1h", "30m", "1d"
  updatedBy: string;
}

/**
 * Parse duration string to milliseconds.
 * Supports: 30m, 1h, 24h, 1d, 7d
 */
export function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Pause autonomy with reason and optional TTL.
 */
export function pauseAutonomy(options: PauseOptions, filePath?: string): AutonomyState {
  const resolvedPath = filePath ?? resolveStatePath();
  const now = new Date();

  // Load existing state or create default
  let state = loadAutonomyState(resolvedPath);
  if (!state) {
    state = {
      schemaVersion: AUTONOMY_STATE_SCHEMA_VERSION,
      state: 'active',
      updatedAt: now.toISOString(),
      updatedBy: 'system',
      reason: null,
      expiresAt: null,
      policy: { ...DEFAULT_POLICY },
      history: [],
    };
  }

  // Calculate expiry
  let expiresAt: string | null = null;
  if (options.expiresAt) {
    expiresAt = options.expiresAt;
  } else if (options.duration) {
    const ms = parseDuration(options.duration);
    if (ms) {
      expiresAt = new Date(now.getTime() + ms).toISOString();
    }
  }

  // Add current state to history
  state.history.push({
    state: state.state,
    updatedAt: state.updatedAt,
    updatedBy: state.updatedBy,
    reason: state.reason,
    expiresAt: state.expiresAt,
  });

  // Keep history bounded (last 100 entries)
  if (state.history.length > 100) {
    state.history = state.history.slice(-100);
  }

  // Update state
  state.state = 'paused';
  state.updatedAt = now.toISOString();
  state.updatedBy = options.updatedBy;
  state.reason = options.reason;
  state.expiresAt = expiresAt;

  saveAutonomyState(state, resolvedPath);
  return state;
}

/**
 * Resume autonomy.
 */
export function resumeAutonomy(updatedBy: string, filePath?: string): AutonomyState {
  const resolvedPath = filePath ?? resolveStatePath();
  const now = new Date();

  let state = loadAutonomyState(resolvedPath);
  if (!state) {
    state = {
      schemaVersion: AUTONOMY_STATE_SCHEMA_VERSION,
      state: 'active',
      updatedAt: now.toISOString(),
      updatedBy,
      reason: null,
      expiresAt: null,
      policy: { ...DEFAULT_POLICY },
      history: [],
    };
    saveAutonomyState(state, resolvedPath);
    return state;
  }

  // Add current state to history
  state.history.push({
    state: state.state,
    updatedAt: state.updatedAt,
    updatedBy: state.updatedBy,
    reason: state.reason,
    expiresAt: state.expiresAt,
  });

  // Keep history bounded
  if (state.history.length > 100) {
    state.history = state.history.slice(-100);
  }

  // Update state
  state.state = 'active';
  state.updatedAt = now.toISOString();
  state.updatedBy = updatedBy;
  state.reason = null;
  state.expiresAt = null;

  saveAutonomyState(state, resolvedPath);
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// Freeze/Unfreeze Operations (for CLI) – Phase 4N39
// ─────────────────────────────────────────────────────────────────────────────

export interface FreezeOptions {
  category: FreezeReasonCategory;
  reason: string;
  actor: string;
  actorRole: ApproverRole;
  ticketId?: string;
  duration?: string; // e.g., "72h", "7d"
  expiresAt?: string; // ISO timestamp
}

export interface UnfreezeOptions {
  actor: string;
  actorRole: ApproverRole;
  reason?: string;
}

export interface FreezeAuthorizationResult {
  authorized: boolean;
  error?: string;
  requiredRoles: ApproverRole[];
}

/**
 * Check if actor is authorized to freeze for a given category.
 */
export function checkFreezeAuthorization(
  category: FreezeReasonCategory,
  actorRole: ApproverRole,
  policy: FreezePolicyConfig = DEFAULT_FREEZE_POLICY
): FreezeAuthorizationResult {
  const requiredRoles = policy.categoryRoles[category];

  if (!requiredRoles || requiredRoles.length === 0) {
    return {
      authorized: false,
      error: `No roles configured for freeze category: ${category}`,
      requiredRoles: [],
    };
  }

  const authorized = requiredRoles.includes(actorRole);

  return {
    authorized,
    error: authorized
      ? undefined
      : `Role '${actorRole}' not authorized for '${category}' freeze. Required: ${requiredRoles.join(', ')}`,
    requiredRoles,
  };
}

/**
 * Freeze autonomy – blocks ALL actors, including incident-publisher.
 * Requires role authorization based on freeze category.
 */
export function freezeAutonomy(
  options: FreezeOptions,
  filePath?: string,
  policy: FreezePolicyConfig = DEFAULT_FREEZE_POLICY
): { state: AutonomyState; authorized: boolean; error?: string } {
  // Check authorization first
  const authResult = checkFreezeAuthorization(options.category, options.actorRole, policy);
  if (!authResult.authorized) {
    // Load state but don't modify it
    const resolvedPath = filePath ?? resolveStatePath();
    const state = loadAutonomyState(resolvedPath);
    return {
      state: state ?? createDefaultState(new Date(), options.actor),
      authorized: false,
      error: authResult.error,
    };
  }

  const resolvedPath = filePath ?? resolveStatePath();
  const now = new Date();

  // Load existing state or create default
  let state = loadAutonomyState(resolvedPath);
  if (!state) {
    state = createDefaultState(now, options.actor);
  }

  // Calculate expiry
  let expiresAt: string | null = null;
  if (options.expiresAt) {
    expiresAt = options.expiresAt;
  } else if (options.duration) {
    const ms = parseDuration(options.duration);
    if (ms) {
      expiresAt = new Date(now.getTime() + ms).toISOString();
    }
  } else {
    // Default duration
    expiresAt = new Date(
      now.getTime() + policy.defaultDurationHours * 60 * 60 * 1000
    ).toISOString();
  }

  // Enforce max duration
  if (policy.maxDurationHours !== null && expiresAt) {
    const maxExpiry = new Date(now.getTime() + policy.maxDurationHours * 60 * 60 * 1000);
    const parsedExpiry = new Date(expiresAt);
    if (parsedExpiry > maxExpiry) {
      expiresAt = maxExpiry.toISOString();
    }
  }

  // Initialize freeze history if needed
  if (!state.freezeHistory) {
    state.freezeHistory = [];
  }

  // Add freeze to history
  state.freezeHistory.push({
    action: 'freeze',
    category: options.category,
    reason: options.reason,
    actor: options.actor,
    actorRole: options.actorRole,
    timestamp: now.toISOString(),
    ticketId: options.ticketId ?? null,
    expiresAt,
  });

  // Keep history bounded (last 100 entries)
  if (state.freezeHistory.length > 100) {
    state.freezeHistory = state.freezeHistory.slice(-100);
  }

  // Set freeze state
  state.freeze = {
    active: true,
    category: options.category,
    reason: options.reason,
    setBy: options.actor,
    setByRole: options.actorRole,
    setAt: now.toISOString(),
    expiresAt,
    ticketId: options.ticketId ?? null,
  };

  saveAutonomyState(state, resolvedPath);
  return { state, authorized: true };
}

/**
 * Unfreeze autonomy – requires same role authorization as freeze.
 */
export function unfreezeAutonomy(
  options: UnfreezeOptions,
  filePath?: string,
  policy: FreezePolicyConfig = DEFAULT_FREEZE_POLICY
): { state: AutonomyState; authorized: boolean; error?: string } {
  const resolvedPath = filePath ?? resolveStatePath();
  const now = new Date();

  let state = loadAutonomyState(resolvedPath);
  if (!state) {
    state = createDefaultState(now, options.actor);
    saveAutonomyState(state, resolvedPath);
    return { state, authorized: true };
  }

  const freeze = state.freeze ?? DEFAULT_FREEZE_STATE;

  // If not frozen, nothing to do
  if (!freeze.active) {
    return { state, authorized: true };
  }

  // Check authorization – must have role authorized for the freeze category
  if (freeze.category) {
    const authResult = checkFreezeAuthorization(freeze.category, options.actorRole, policy);
    if (!authResult.authorized) {
      return {
        state,
        authorized: false,
        error: authResult.error,
      };
    }
  }

  // Initialize freeze history if needed
  if (!state.freezeHistory) {
    state.freezeHistory = [];
  }

  // Add unfreeze to history
  state.freezeHistory.push({
    action: 'unfreeze',
    category: freeze.category,
    reason: options.reason ?? 'Manual unfreeze',
    actor: options.actor,
    actorRole: options.actorRole,
    timestamp: now.toISOString(),
    ticketId: freeze.ticketId,
    expiresAt: null,
  });

  // Keep history bounded
  if (state.freezeHistory.length > 100) {
    state.freezeHistory = state.freezeHistory.slice(-100);
  }

  // Clear freeze state
  state.freeze = { ...DEFAULT_FREEZE_STATE };

  saveAutonomyState(state, resolvedPath);
  return { state, authorized: true };
}

/**
 * Helper to create a default autonomy state
 */
function createDefaultState(now: Date, updatedBy: string): AutonomyState {
  return {
    schemaVersion: AUTONOMY_STATE_SCHEMA_VERSION,
    state: 'active',
    updatedAt: now.toISOString(),
    updatedBy,
    reason: null,
    expiresAt: null,
    policy: { ...DEFAULT_POLICY },
    history: [],
    freeze: { ...DEFAULT_FREEZE_STATE },
    freezeHistory: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Output
// ─────────────────────────────────────────────────────────────────────────────

export interface AutonomyStateEvidence {
  schema: 'terrafusion.autonomy.state.v1';
  toolVersion: '4N39.1'; // Updated for freeze capability
  decision: AutonomyDecision;
  generatedAt: string;
}

/**
 * Freeze evidence for audit trail
 */
export interface FreezeEvidence {
  schema: 'terrafusion.autonomy.freeze.v1';
  toolVersion: '4N39.1';
  action: 'freeze' | 'unfreeze';
  actor: string;
  actorRole: ApproverRole | null;
  category: FreezeReasonCategory | null;
  reason: string | null;
  ticketId: string | null;
  expiresAt: string | null;
  authorized: boolean;
  timestamp: string;
}

/**
 * Generate evidence record for inclusion in apply-proofs.json and evidence index.
 */
export function generateStateEvidence(
  decision: AutonomyDecision,
  now: Date = new Date()
): AutonomyStateEvidence {
  return {
    schema: 'terrafusion.autonomy.state.v1',
    toolVersion: '4N39.1',
    decision,
    generatedAt: now.toISOString(),
  };
}

/**
 * Generate freeze evidence for audit trail
 */
export function generateFreezeEvidence(
  action: 'freeze' | 'unfreeze',
  options: {
    actor: string;
    actorRole: ApproverRole | null;
    category: FreezeReasonCategory | null;
    reason: string | null;
    ticketId: string | null;
    expiresAt: string | null;
    authorized: boolean;
  },
  now: Date = new Date()
): FreezeEvidence {
  return {
    schema: 'terrafusion.autonomy.freeze.v1',
    toolVersion: '4N39.1',
    action,
    actor: options.actor,
    actorRole: options.actorRole,
    category: options.category,
    reason: options.reason,
    ticketId: options.ticketId,
    expiresAt: options.expiresAt,
    authorized: options.authorized,
    timestamp: now.toISOString(),
  };
}

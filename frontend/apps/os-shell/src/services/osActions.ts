/**
 * TerraFusion OS Action Dispatcher
 *
 * Central dispatcher for all OS-level actions. Every action execution:
 * 1. Validates action structure
 * 2. Checks disabled state and policy gate
 * 3. Emits TerraTrace event for audit trail (invoked or blocked)
 * 4. Routes to navigation or handler registry
 *
 * @module services/osActions
 * @see Slice 15: Module Action Wiring + Telemetry Truth
 * @see Slice 16: Cross-Surface Action Parity + Disabled/Policy Enforcement
 */

import { createLogger } from '@/hooks/useLogger';
import type { OsActor } from '@/auth/useAuthContext';

const logger = createLogger('osActions');

// ============================================================================
// Types
// ============================================================================

/**
 * Action intent describes the type of surface the action targets
 */
export type OsActionIntent = 'standalone' | 'workbench' | 'system';

/**
 * Base action structure shared by all OS actions
 */
export interface OsActionBase {
  id: string;
  label: string;
  intent: OsActionIntent;
  icon?: string;
  disabled?: boolean;
  /** Reason why action is disabled (for a11y and trace) */
  disabledReason?: string;
  description?: string;
}

/**
 * Navigation action - routes to a URL path
 */
export interface OsNavigationAction extends OsActionBase {
  href: string;
  handlerKey?: never;
}

/**
 * Handler action - invokes a registered handler by key
 */
export interface OsHandlerAction extends OsActionBase {
  handlerKey: string;
  href?: never;
}

/**
 * Union type for all valid OS action shapes
 */
export type OsAction = OsNavigationAction | OsHandlerAction;

/**
 * Action execution context provided by calling component
 */
export interface OsActionContext {
  /** Router navigation function */
  navigate: (path: string) => void;
  /** Current suite ID (e.g., 'pilot', 'trace') */
  suiteId: string;
  /** Surface type where action was invoked */
  surface: 'launcher' | 'standalone_home' | 'shellhome' | 'module' | 'workbench' | 'trace';
  /** Optional module ID if action is from a module */
  moduleId?: string;
  /** Hash of parcel ID if parcel context exists (PII-safe) */
  parcelIdHash?: string;
  /** Optional tab ID for workbench tab interactions */
  tabId?: string;
  /** Wave 1: authenticated actor. null = unauthenticated; omitted = pre-Wave-1 caller. */
  actor?: OsActor | null;
}

// ============================================================================
// Policy Types
// ============================================================================

/**
 * Policy decision result
 */
export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Policy gate for action execution
 */
export interface OsActionPolicy {
  /**
   * Check if action can be executed in given context
   * @returns PolicyDecision with allowed status and optional reason
   */
  canExecute: (action: OsAction, context: OsActionContext) => PolicyDecision;
}

// ============================================================================
// Trace Event Types
// ============================================================================

export const OS_ACTION_EVENT_NAME = 'terratrace:os_action';
export const OS_ACTION_BLOCKED_EVENT_NAME = 'terratrace:os_action_blocked';
export const OS_TRACE_EVENT_NAME = 'terratrace:custom';

// ============================================================================
// Clock Injection (for deterministic testing)
// ============================================================================

/**
 * Internal clock function - defaults to Date.now()
 * Can be overridden for deterministic testing via setTraceClock()
 */
let traceClock: () => number = () => Date.now();

/**
 * Set a custom clock function for trace timestamps
 * Used for deterministic testing - replaces Date.now() in trace emission
 * @returns Cleanup function to restore default clock
 */
export function setTraceClock(clockFn: () => number): () => void {
  const previous = traceClock;
  traceClock = clockFn;
  return () => {
    traceClock = previous;
  };
}

/**
 * Reset trace clock to default (Date.now())
 */
export function resetTraceClock(): void {
  traceClock = () => Date.now();
}

// ============================================================================
// Trace Payload Types
// ============================================================================

export interface OsActionTracePayload {
  actionId: string;
  actionType: 'navigation' | 'handler';
  intent: OsActionIntent;
  surface: OsActionContext['surface'];
  suiteId: string;
  moduleId?: string;
  parcelIdHash?: string;
  href?: string;
  handlerKey?: string;
  /** Optional additional metadata (e.g., tabId for workbench tabs) */
  tabId?: string;
  /** Wave 1: resolved actor identity for audit trail. Empty string = unauthenticated. */
  actor?: string;
  /** Wave 1: county scope for audit trail. Empty string = unknown. */
  countyId?: string;
}

export interface OsActionTraceEvent {
  type: 'os_action_invoked';
  timestamp: number;
  payload: OsActionTracePayload;
}

/**
 * Blocked action trace event payload
 */
export interface OsActionBlockedPayload {
  actionId: string;
  actionType: 'navigation' | 'handler';
  intent: OsActionIntent;
  surface: OsActionContext['surface'];
  suiteId: string;
  /** Reason for blocking: 'disabled' or 'policy' */
  blockReason: 'disabled' | 'policy';
  /** User-facing reason if action was disabled */
  disabledReason?: string;
  /** Policy-provided reason if blocked by policy */
  policyReason?: string;
}

export interface OsActionBlockedEvent {
  type: 'os_action_blocked';
  timestamp: number;
  payload: OsActionBlockedPayload;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an action is a navigation action
 */
export function isNavigationAction(action: OsAction): action is OsNavigationAction {
  return 'href' in action && typeof action.href === 'string' && !('handlerKey' in action);
}

/**
 * Type guard to check if an action is a handler key action
 */
export function isHandlerKeyAction(action: OsAction): action is OsHandlerAction {
  return 'handlerKey' in action && typeof action.handlerKey === 'string' && !('href' in action);
}

/**
 * Type guard to validate action structure
 */
export function isValidOsAction(action: unknown): action is OsAction {
  if (!action || typeof action !== 'object') return false;

  const a = action as Record<string, unknown>;

  // Required fields
  if (typeof a.id !== 'string' || !a.id) return false;
  if (typeof a.label !== 'string' || !a.label) return false;
  if (!['standalone', 'workbench', 'system'].includes(a.intent as string)) return false;

  // Must have exactly one of href or handlerKey
  const hasHref = 'href' in a && typeof a.href === 'string';
  const hasHandlerKey = 'handlerKey' in a && typeof a.handlerKey === 'string';

  if (hasHref && hasHandlerKey) return false;
  if (!hasHref && !hasHandlerKey) return false;

  // No inline handler functions allowed
  if ('handler' in a && typeof a.handler === 'function') return false;

  return true;
}

// ============================================================================
// Trace Emission
// ============================================================================

function emitActionTrace(action: OsAction, context: OsActionContext, effectiveActor: OsActor | null): void {
  const payload: OsActionTracePayload = {
    actionId: action.id,
    actionType: isNavigationAction(action) ? 'navigation' : 'handler',
    intent: action.intent,
    surface: context.surface,
    suiteId: context.suiteId,
    // Wave 1: single resolved identity — never split actor across two sources.
    actor: effectiveActor?.userId ?? '',
    countyId: effectiveActor?.countyId ?? '',
  };

  if (context.moduleId) {
    payload.moduleId = context.moduleId;
  }

  if (context.parcelIdHash) {
    payload.parcelIdHash = context.parcelIdHash;
  }

  if (context.tabId) {
    payload.tabId = context.tabId;
  }

  if (isNavigationAction(action)) {
    payload.href = action.href;
  } else if (isHandlerKeyAction(action)) {
    payload.handlerKey = action.handlerKey;
  }

  const event: OsActionTraceEvent = {
    type: 'os_action_invoked',
    timestamp: traceClock(),
    payload,
  };

  window.dispatchEvent(new CustomEvent(OS_ACTION_EVENT_NAME, { detail: event }));
}

/**
 * Emit blocked action trace event
 */
function emitBlockedTrace(
  action: OsAction,
  context: OsActionContext,
  blockReason: 'disabled' | 'policy',
  reasonDetail?: string
): void {
  const payload: OsActionBlockedPayload = {
    actionId: action.id,
    actionType: isNavigationAction(action) ? 'navigation' : 'handler',
    intent: action.intent,
    surface: context.surface,
    suiteId: context.suiteId,
    blockReason,
  };

  if (blockReason === 'disabled') {
    payload.disabledReason = reasonDetail ?? action.disabledReason;
  } else if (blockReason === 'policy') {
    payload.policyReason = reasonDetail;
  }

  const event: OsActionBlockedEvent = {
    type: 'os_action_blocked',
    timestamp: traceClock(),
    payload,
  };

  window.dispatchEvent(new CustomEvent(OS_ACTION_BLOCKED_EVENT_NAME, { detail: event }));
}

// ============================================================================
// Public Generic Trace Emission
// ============================================================================

/**
 * Generic trace event structure for non-action traces (e.g., policy changes)
 */
export interface OsTraceEvent {
  type: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

/**
 * Emit a generic TerraTrace custom event for audit purposes.
 * Used by PolicyPanel and other non-action-dispatch components.
 */
export function emitTrace(event: OsTraceEvent): void {
  window.dispatchEvent(new CustomEvent(OS_TRACE_EVENT_NAME, { detail: event }));
}

// ============================================================================
// Policy Registry
// ============================================================================

/** Default permissive policy */
const DEFAULT_POLICY: OsActionPolicy = {
  canExecute: () => ({ allowed: true }),
};

/** Current active policy */
let currentPolicy: OsActionPolicy = DEFAULT_POLICY;

/**
 * Set custom action policy gate
 */
export function setActionPolicy(policy: OsActionPolicy): void {
  currentPolicy = policy;
}

/**
 * Reset to default permissive policy
 */
export function resetActionPolicy(): void {
  currentPolicy = DEFAULT_POLICY;
}

// ============================================================================
// Handler Registry (placeholder until osActionRegistry is implemented)
// ============================================================================

const handlerRegistry: Map<string, (context: OsActionContext) => void> = new Map();

/**
 * Register a handler implementation for a handler key
 */
export function registerActionHandler(
  key: string,
  handler: (context: OsActionContext) => void
): void {
  handlerRegistry.set(key, handler);
}

/**
 * Execute a registered handler by key
 */
function executeHandler(handlerKey: string, context: OsActionContext): void {
  const handler = handlerRegistry.get(handlerKey);
  if (handler) {
    handler(context);
  } else {
    logger.warn(`No handler registered for key: ${handlerKey}`);
  }
}

// ============================================================================
// Action Dispatcher
// ============================================================================

/**
 * Execute an OS action with full trace emission
 *
 * @param action - The action to execute
 * @param context - Execution context including navigate function and metadata
 */
export function executeOsAction(action: OsAction, context: OsActionContext): void {
  // Check 1: Disabled actions emit blocked trace and return
  if (action.disabled) {
    emitBlockedTrace(action, context, 'disabled', action.disabledReason);
    return;
  }

  // Check 2: Policy gate can block action
  const policyDecision = currentPolicy.canExecute(action, context);
  if (!policyDecision.allowed) {
    emitBlockedTrace(action, context, 'policy', policyDecision.reason);
    return;
  }

  // Resolve effective actor once — prefer explicit context.actor (Wave 1 callers),
  // fall back to null for pre-Wave-1 legacy callers.
  // Never split identity across two sources in the same emit.
  // TODO Wave1: add getTraceContext() fallback after Task 2A commits
  const effectiveActor: OsActor | null =
    context.actor !== undefined
      ? context.actor   // Wave 1: explicitly threaded
      : null;           // Legacy: no actor context available yet

  // Emit trace event for audit trail
  emitActionTrace(action, context, effectiveActor);

  // Route to appropriate executor
  if (isNavigationAction(action)) {
    context.navigate(action.href);
  } else if (isHandlerKeyAction(action)) {
    executeHandler(action.handlerKey, context);
  }
}

/**
 * Subscribe to OS action trace events (invoked)
 */
export function subscribeToActionTrace(callback: (event: OsActionTraceEvent) => void): () => void {
  const handler = (e: CustomEvent<OsActionTraceEvent>) => callback(e.detail);

  window.addEventListener(OS_ACTION_EVENT_NAME, handler as EventListener);

  return () => window.removeEventListener(OS_ACTION_EVENT_NAME, handler as EventListener);
}

/**
 * Subscribe to OS action blocked trace events
 */
export function subscribeToBlockedTrace(
  callback: (event: OsActionBlockedEvent) => void
): () => void {
  const handler = (e: CustomEvent<OsActionBlockedEvent>) => callback(e.detail);

  window.addEventListener(OS_ACTION_BLOCKED_EVENT_NAME, handler as EventListener);

  return () => window.removeEventListener(OS_ACTION_BLOCKED_EVENT_NAME, handler as EventListener);
}

/**
 * Union type for all trace events
 */
export type OsActionAnyTraceEvent = OsActionTraceEvent | OsActionBlockedEvent;

/**
 * Subscribe to all OS action trace events (invoked and blocked)
 */
export function subscribeToAllTraces(callback: (event: OsActionAnyTraceEvent) => void): () => void {
  const invokedHandler = (e: CustomEvent<OsActionTraceEvent>) => callback(e.detail);
  const blockedHandler = (e: CustomEvent<OsActionBlockedEvent>) => callback(e.detail);

  window.addEventListener(OS_ACTION_EVENT_NAME, invokedHandler as EventListener);
  window.addEventListener(OS_ACTION_BLOCKED_EVENT_NAME, blockedHandler as EventListener);

  return () => {
    window.removeEventListener(OS_ACTION_EVENT_NAME, invokedHandler as EventListener);
    window.removeEventListener(OS_ACTION_BLOCKED_EVENT_NAME, blockedHandler as EventListener);
  };
}

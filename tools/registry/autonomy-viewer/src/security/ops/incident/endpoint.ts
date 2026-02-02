/**
 * TerraFusion Incident Bundle Retrieval Endpoint
 * ================================================
 *
 * Phase IIIi: Least-privilege incident bundle retrieval.
 *
 * Design Principles:
 * - Operator authz scope required (security:operator)
 * - PII-clean responses only (SHA-256 hashed identifiers)
 * - Fail-silent: endpoint failures don't affect auth path
 * - Bounded and deterministic bundle sizes
 * - Rate limiting
 */

import {
    DEFAULT_MAX_EVENTS,
    generateIncidentBundle,
    isBundlePiiClean,
    type IncidentBundle,
    type RawSecurityEvent,
} from './bundle.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Operator context for authorization.
 */
export interface OperatorContext {
  /** Whether the caller is authenticated */
  readonly authenticated: boolean;
  /** Scopes/permissions granted to caller */
  readonly scopes: readonly string[];
  /** Hashed user ID (should already be sha256: prefixed) */
  readonly userId?: string;
}

/**
 * Retrieval request parameters.
 */
export interface RetrievalRequest {
  /** Time range for events */
  readonly timeRange?: {
    readonly start: string;
    readonly end: string;
  };
  /** Maximum number of events */
  readonly maxEvents?: number;
  /** Event type filter */
  readonly eventTypes?: readonly string[];
}

/**
 * Retrieval response.
 */
export interface RetrievalResponse {
  /** Whether retrieval succeeded */
  readonly success: boolean;
  /** Whether caller was authorized */
  readonly authorized: boolean;
  /** Error message if failed */
  readonly error?: string;
  /** The incident bundle (only if success && authorized) */
  readonly bundle?: IncidentBundle;
  /** Whether request was rate limited */
  readonly rateLimited?: boolean;
}

/**
 * Event source interface.
 */
export interface EventSource {
  /** Get raw events (will be cleaned before returning) */
  getEvents(
    timeRange?: { start: string; end: string },
    eventTypes?: readonly string[]
  ): Promise<RawSecurityEvent[]>;
}

/**
 * Rate limit configuration.
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  readonly maxRequests: number;
  /** Window duration in seconds */
  readonly windowSeconds: number;
}

/**
 * Endpoint options.
 */
export interface EndpointOptions {
  /** Required scope for access */
  requiredScope?: string;
  /** Maximum events to return */
  maxEvents?: number;
  /** Event source */
  eventSource?: EventSource;
  /** Audit logging function */
  audit?: (entry: string) => void;
  /** Rate limit configuration */
  rateLimit?: RateLimitConfig;
}

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * Simple in-memory rate limiter.
 */
class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly requests: Map<string, number[]> = new Map();

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowSeconds * 1000;
  }

  /**
   * Check if request should be rate limited.
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) ?? [];

    // Filter to only requests within window
    requests = requests.filter(t => t > windowStart);

    // Check if over limit
    if (requests.length >= this.maxRequests) {
      return true;
    }

    // Record this request
    requests.push(now);
    this.requests.set(key, requests);

    return false;
  }

  /**
   * Clear rate limit state.
   */
  clear(): void {
    this.requests.clear();
  }
}

// ============================================================================
// Incident Bundle Endpoint
// ============================================================================

/**
 * Endpoint for incident bundle retrieval.
 */
export class IncidentBundleEndpoint {
  private readonly requiredScope: string;
  private readonly maxEvents: number;
  private readonly eventSource: EventSource;
  private readonly audit: (entry: string) => void;
  private readonly rateLimiter: RateLimiter | undefined;

  constructor(options: EndpointOptions = {}) {
    this.requiredScope = options.requiredScope ?? 'security:operator';
    this.maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    this.eventSource = options.eventSource ?? {
      getEvents: async () => [],
    };
    this.audit = options.audit ?? (() => {});
    this.rateLimiter = options.rateLimit ? new RateLimiter(options.rateLimit) : undefined;
  }

  /**
   * Get maximum events configuration.
   */
  getMaxEvents(): number {
    return this.maxEvents;
  }

  /**
   * Retrieve incident bundle. Fail-silent.
   */
  async retrieve(request: RetrievalRequest, context: OperatorContext): Promise<RetrievalResponse> {
    try {
      // Check authentication
      if (!context.authenticated) {
        this.audit(`[DENIED] unauthenticated request for incident bundle`);
        return {
          success: false,
          authorized: false,
          error: 'Not authenticated - unauthorized access',
        };
      }

      // Check authorization
      if (!context.scopes.includes(this.requiredScope)) {
        this.audit(
          `[DENIED] user ${context.userId ?? 'unknown'} missing scope ${this.requiredScope} for incident bundle`
        );
        return {
          success: false,
          authorized: false,
          error: `Missing required scope: ${this.requiredScope} - unauthorized`,
        };
      }

      // Check rate limit
      if (this.rateLimiter) {
        const rateLimitKey = context.userId ?? 'anonymous';
        if (this.rateLimiter.isLimited(rateLimitKey)) {
          this.audit(
            `[RATE_LIMITED] user ${context.userId ?? 'unknown'} exceeded rate limit for incident bundle`
          );
          return {
            success: false,
            authorized: true,
            rateLimited: true,
            error: 'Rate limit exceeded',
          };
        }
      }

      // Get events from source
      const rawEvents = await this.eventSource.getEvents(request.timeRange, request.eventTypes);

      // Generate PII-clean bundle
      const bundle = generateIncidentBundle(rawEvents, {
        maxEvents: request.maxEvents ?? this.maxEvents,
      });

      // Verify bundle is PII-clean (should always be true)
      if (!isBundlePiiClean(bundle)) {
        this.audit(
          `[ERROR] generated bundle failed PII-clean check for user ${context.userId ?? 'unknown'}`
        );
        return {
          success: false,
          authorized: true,
          error: 'Internal error: bundle failed PII validation',
        };
      }

      this.audit(
        `[SUCCESS] incident bundle retrieved by ${context.userId ?? 'unknown'} - ${bundle.summary.totalEvents} events`
      );

      return {
        success: true,
        authorized: true,
        bundle,
      };
    } catch (err) {
      this.audit(
        `[ERROR] incident bundle retrieval failed: ${err instanceof Error ? err.message : 'unknown'}`
      );
      return {
        success: false,
        authorized: true,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an incident bundle endpoint.
 */
export function createIncidentEndpoint(options: EndpointOptions = {}): IncidentBundleEndpoint {
  return new IncidentBundleEndpoint(options);
}

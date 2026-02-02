/**
 * TerraFusion Alerts Publisher
 * =============================
 *
 * Phase IIIi: Alert rules publishing pipeline.
 *
 * Design Principles:
 * - Dry-run validation in CI mode
 * - Fail-silent relative to auth path
 * - Idempotent publishing
 * - Strict validation before push
 */

import { type AlertRuleCatalog } from '../alerts/rules.js';
import { ALLOWED_SLO_DIMENSIONS } from '../slo/catalog.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Publish result.
 */
export interface PublishResult {
  /** Whether publish succeeded */
  readonly success: boolean;
  /** Whether this was a dry-run */
  readonly dryRun: boolean;
  /** Whether validation passed */
  readonly validated: boolean;
  /** Published version */
  readonly publishedVersion?: string;
  /** Error message if failed */
  readonly error?: string;
  /** Validation errors */
  readonly validationErrors?: readonly string[];
  /** Whether publish was skipped (version unchanged) */
  readonly skipped?: boolean;
}

/**
 * Publisher statistics.
 */
export interface PublisherStats {
  /** Total publish attempts */
  readonly attempts: number;
  /** Successful publishes */
  readonly successes: number;
  /** Failed publishes */
  readonly failures: number;
  /** Skipped (version unchanged) */
  readonly skipped: number;
}

/**
 * Backend interface for alert publishing.
 */
export interface AlertsBackend {
  /** Push alert catalog to backend */
  push(catalog: AlertRuleCatalog): Promise<void>;
  /** Get current published version (optional) */
  getCurrentVersion?(): Promise<string | undefined>;
}

/**
 * Publisher options.
 */
export interface PublishOptions {
  /** Publish mode */
  mode?: 'live' | 'dry-run';
  /** CI mode (implies dry-run by default) */
  ciMode?: boolean;
  /** Skip publish if version unchanged */
  skipIfUnchanged?: boolean;
  /** Backend for publishing */
  backend?: AlertsBackend;
}

// ============================================================================
// Validation
// ============================================================================

const VALID_SEVERITIES = ['critical', 'warning', 'info'];

/**
 * Validate alert rules catalog.
 */
export function validateAlertRules(catalog: AlertRuleCatalog): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!catalog.version) {
    errors.push('Catalog version is required');
  }
  if (!catalog.schemaVersion) {
    errors.push('Schema version is required');
  }
  if (!catalog.rules || catalog.rules.length === 0) {
    errors.push('At least one alert rule is required');
  }

  const ids = new Set<string>();
  for (const rule of catalog.rules ?? []) {
    if (!rule.id) {
      errors.push('Alert rule id is required');
    } else if (ids.has(rule.id)) {
      errors.push(`Duplicate alert rule id: ${rule.id}`);
    } else {
      ids.add(rule.id);
    }

    if (!rule.name) {
      errors.push(`Alert ${rule.id ?? 'unknown'} missing name`);
    }
    if (!rule.sloId) {
      errors.push(`Alert ${rule.id ?? 'unknown'} missing sloId`);
    }

    if (rule.severity && !VALID_SEVERITIES.includes(rule.severity)) {
      errors.push(`Alert ${rule.id} has invalid severity: ${rule.severity}`);
    }

    // Validate labels are from allowlist
    if (rule.labels) {
      for (const label of rule.labels) {
        if (!ALLOWED_SLO_DIMENSIONS.includes(label as never)) {
          errors.push(`Alert ${rule.id} uses non-allowlisted label/dimension: ${label}`);
        }
      }
    }

    if (rule.suppressionWindowSeconds !== undefined && rule.suppressionWindowSeconds <= 0) {
      errors.push(`Alert ${rule.id} must have positive suppression window`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Alerts Publisher
// ============================================================================

/**
 * Publisher for alert rules.
 */
export class AlertsPublisher {
  private readonly mode: 'live' | 'dry-run';
  private readonly ciMode: boolean;
  private readonly skipIfUnchanged: boolean;
  private readonly backend: AlertsBackend | undefined;
  private stats: {
    attempts: number;
    successes: number;
    failures: number;
    skipped: number;
  };

  constructor(options: PublishOptions = {}) {
    this.ciMode = options.ciMode ?? false;
    this.mode = options.mode ?? (this.ciMode ? 'dry-run' : 'live');
    this.skipIfUnchanged = options.skipIfUnchanged ?? false;
    this.backend = options.backend;
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      skipped: 0,
    };
  }

  /**
   * Check if running in CI mode.
   */
  isCiMode(): boolean {
    return this.ciMode;
  }

  /**
   * Publish alert catalog. Fail-silent.
   */
  async publish(catalog: AlertRuleCatalog): Promise<PublishResult> {
    this.stats.attempts++;

    try {
      // Validate first
      const validation = validateAlertRules(catalog);
      if (!validation.valid) {
        this.stats.failures++;
        return {
          success: false,
          dryRun: this.mode === 'dry-run',
          validated: false,
          validationErrors: validation.errors,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Dry-run mode: validate only
      if (this.mode === 'dry-run') {
        this.stats.successes++;
        return {
          success: true,
          dryRun: true,
          validated: true,
          publishedVersion: catalog.version,
        };
      }

      // Check if version changed (if skipIfUnchanged)
      if (this.skipIfUnchanged && this.backend?.getCurrentVersion) {
        try {
          const currentVersion = await this.backend.getCurrentVersion();
          if (currentVersion === catalog.version) {
            this.stats.skipped++;
            return {
              success: true,
              dryRun: false,
              validated: true,
              skipped: true,
              publishedVersion: catalog.version,
            };
          }
        } catch {
          // Ignore version check failure, proceed with publish
        }
      }

      // Publish to backend
      if (this.backend) {
        await this.backend.push(catalog);
      }

      this.stats.successes++;
      return {
        success: true,
        dryRun: false,
        validated: true,
        publishedVersion: catalog.version,
      };
    } catch (err) {
      this.stats.failures++;
      return {
        success: false,
        dryRun: this.mode === 'dry-run',
        validated: true,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Get publisher statistics.
   */
  getStats(): PublisherStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      skipped: 0,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an alerts publisher.
 */
export function createAlertsPublisher(options: PublishOptions = {}): AlertsPublisher {
  return new AlertsPublisher(options);
}

// ============================================================================
// Noop Backend
// ============================================================================

/**
 * No-op backend for testing.
 */
export const NoopAlertsBackend: AlertsBackend = {
  push: async () => {
    // Intentionally empty
  },
};

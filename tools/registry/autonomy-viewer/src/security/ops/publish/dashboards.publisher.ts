/**
 * TerraFusion Dashboards Publisher
 * ==================================
 *
 * Phase IIIi: Dashboard publishing pipeline.
 *
 * Design Principles:
 * - Schema validation before publish
 * - Fail-silent relative to auth path
 * - Idempotent and versioned publishing
 * - Dry-run support for CI
 */

import {
    type Dashboard,
    validateDashboardReferences
} from '../dashboards/generator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Dashboard publish result.
 */
export interface DashboardPublishResult {
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
export interface DashboardPublisherStats {
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
 * Backend interface for dashboard publishing.
 */
export interface DashboardsBackend {
  /** Push dashboard to backend */
  push(dashboard: Dashboard): Promise<void>;
  /** Get current published version (optional) */
  getCurrentVersion?(): Promise<string | undefined>;
}

/**
 * Publisher options.
 */
export interface DashboardPublishOptions {
  /** Publish mode */
  mode?: 'live' | 'dry-run';
  /** Skip publish if version unchanged */
  skipIfUnchanged?: boolean;
  /** Backend for publishing */
  backend?: DashboardsBackend;
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * Validate dashboard against schema.
 */
export function validateDashboardSchema(dashboard: Dashboard): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!dashboard.id) {
    errors.push('Dashboard id is required');
  }
  if (!dashboard.title) {
    errors.push('Dashboard title is required');
  }
  if (!dashboard.schemaVersion) {
    errors.push('Dashboard schemaVersion is required');
  }
  if (!dashboard.version) {
    errors.push('Dashboard version is required');
  }
  if (!dashboard.rows || !Array.isArray(dashboard.rows)) {
    errors.push('Dashboard rows must be an array');
  }

  // Validate rows
  if (dashboard.rows) {
    for (let i = 0; i < dashboard.rows.length; i++) {
      const row = dashboard.rows[i];
      if (!row.title) {
        errors.push(`Row ${i} missing title`);
      }
      if (!row.panels || !Array.isArray(row.panels)) {
        errors.push(`Row ${i} panels must be an array`);
      }

      // Validate panels
      if (row.panels) {
        for (let j = 0; j < row.panels.length; j++) {
          const panel = row.panels[j];
          if (!panel.id) {
            errors.push(`Row ${i} Panel ${j} missing id`);
          }
          if (!panel.title) {
            errors.push(`Row ${i} Panel ${j} missing title`);
          }
          if (!panel.type) {
            errors.push(`Row ${i} Panel ${j} missing type`);
          }
          if (!panel.metrics || !Array.isArray(panel.metrics)) {
            errors.push(`Row ${i} Panel ${j} metrics must be an array`);
          }
          if (!panel.labels || !Array.isArray(panel.labels)) {
            errors.push(`Row ${i} Panel ${j} labels must be an array`);
          }
          if (!panel.gridPos) {
            errors.push(`Row ${i} Panel ${j} missing gridPos`);
          }
        }
      }
    }
  }

  // Also validate references (metrics + labels)
  if (errors.length === 0) {
    const refValidation = validateDashboardReferences(dashboard);
    errors.push(...refValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Dashboards Publisher
// ============================================================================

/**
 * Publisher for dashboards.
 */
export class DashboardsPublisher {
  private readonly mode: 'live' | 'dry-run';
  private readonly skipIfUnchanged: boolean;
  private readonly backend: DashboardsBackend | undefined;
  private stats: {
    attempts: number;
    successes: number;
    failures: number;
    skipped: number;
  };

  constructor(options: DashboardPublishOptions = {}) {
    this.mode = options.mode ?? 'live';
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
   * Publish dashboard. Fail-silent.
   */
  async publish(dashboard: Dashboard): Promise<DashboardPublishResult> {
    this.stats.attempts++;

    try {
      // Validate first
      const validation = validateDashboardSchema(dashboard);
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
          publishedVersion: dashboard.version,
        };
      }

      // Check if version changed (if skipIfUnchanged)
      if (this.skipIfUnchanged && this.backend?.getCurrentVersion) {
        try {
          const currentVersion = await this.backend.getCurrentVersion();
          if (currentVersion === dashboard.version) {
            this.stats.skipped++;
            return {
              success: true,
              dryRun: false,
              validated: true,
              skipped: true,
              publishedVersion: dashboard.version,
            };
          }
        } catch {
          // Ignore version check failure, proceed with publish
        }
      }

      // Publish to backend
      if (this.backend) {
        await this.backend.push(dashboard);
      }

      this.stats.successes++;
      return {
        success: true,
        dryRun: false,
        validated: true,
        publishedVersion: dashboard.version,
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
  getStats(): DashboardPublisherStats {
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
 * Create a dashboards publisher.
 */
export function createDashboardsPublisher(
  options: DashboardPublishOptions = {}
): DashboardsPublisher {
  return new DashboardsPublisher(options);
}

// ============================================================================
// Noop Backend
// ============================================================================

/**
 * No-op backend for testing.
 */
export const NoopDashboardsBackend: DashboardsBackend = {
  push: async () => {
    // Intentionally empty
  },
};

/**
 * TerraFusion Policy Store
 *
 * Persists policy rules with versioning using localStorage.
 * Provides save/load/clear operations with serialization.
 *
 * @module services/policyStore
 * @see Slice 23: Policy UI for Visual Rule Management
 */

import type { PolicyRule } from './policyEngine';

// ============================================================================
// Storage Configuration
// ============================================================================

const STORAGE_KEY = 'terrafusion.policy.rules';
const STORAGE_VERSION = 1;

// ============================================================================
// Serialization Types
// ============================================================================

interface SerializedPolicyStore {
  version: number;
  rules: PolicyRule[];
  updatedAt: string;
}

/**
 * Export/Import JSON Schema (v1.0)
 *
 * Enables reproducibility, disaster recovery, cross-environment consistency
 */
export interface PolicyExportSchema {
  version: '1.0';
  exportedAt: string;
  rules: PolicyRule[];
}

/**
 * Import validation error
 */
export interface ImportValidationError {
  code: 'INVALID_JSON' | 'INVALID_SCHEMA' | 'UNSUPPORTED_VERSION' | 'INVALID_RULE';
  message: string;
}

/**
 * Import result (success or error)
 */
export type ImportResult =
  | { success: true; rules: PolicyRule[] }
  | { success: false; error: ImportValidationError };

// ============================================================================
// Pure Import Logic (for deterministic testing)
// ============================================================================

/**
 * Imports policy rules from JSON string (pure function, no side effects)
 *
 * This is extracted from the PolicyStore to enable deterministic testing
 * without FileReader timing dependencies.
 *
 * @param jsonString - JSON string to parse and validate
 * @returns Import result with rules or validation error
 */
export function importRulesFromJson(jsonString: string): ImportResult {
  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format. Please upload a valid policy export file.',
      },
    };
  }

  // Validate schema structure
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: 'Invalid schema: expected an object.',
      },
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Check version
  if (!obj.version) {
    return {
      success: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: 'Missing schema version. Please upload a valid policy export file.',
      },
    };
  }

  if (obj.version !== '1.0') {
    return {
      success: false,
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `Unsupported schema version: ${obj.version}. This app supports version 1.0.`,
      },
    };
  }

  // Check rules array
  if (!Array.isArray(obj.rules)) {
    return {
      success: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: 'Invalid schema: expected rules array.',
      },
    };
  }

  // Validate each rule
  for (const rule of obj.rules) {
    if (typeof rule !== 'object' || rule === null) {
      return {
        success: false,
        error: {
          code: 'INVALID_RULE',
          message: 'Invalid rule structure: expected object.',
        },
      };
    }

    const r = rule as Record<string, unknown>;

    // Validate rule has at least one selector
    const hasSelector = r.surface || r.suiteId || r.actionId;
    if (!hasSelector) {
      return {
        success: false,
        error: {
          code: 'INVALID_RULE',
          message:
            'Invalid rule structure: rules must specify at least one selector (surface, suiteId, or actionId).',
        },
      };
    }

    // Validate effect
    if (r.effect && r.effect !== 'deny') {
      return {
        success: false,
        error: {
          code: 'INVALID_RULE',
          message: `Invalid rule effect: ${r.effect}. Only 'deny' is supported.`,
        },
      };
    }
  }

  // Success
  return {
    success: true,
    rules: obj.rules as PolicyRule[],
  };
}

// ============================================================================
// Policy Store Interface
// ============================================================================

/**
 * Policy store for persisting rules
 */
export interface PolicyStore {
  /**
   * Saves policy rules to storage
   */
  save(rules: PolicyRule[]): void;

  /**
   * Loads policy rules from storage
   */
  load(): PolicyRule[];

  /**
   * Clears all policy rules from storage
   */
  clear(): void;

  /**
   * Exports policy rules as JSON (v1.0 schema)
   *
   * @returns JSON string for download
   */
  exportRules(rules: PolicyRule[]): string;

  /**
   * Imports policy rules from JSON with validation
   *
   * @param jsonString - JSON string from uploaded file
   * @returns Import result with rules or error
   */
  importRules(jsonString: string): ImportResult;
}

// ============================================================================
// LocalStorage Implementation
// ============================================================================

/**
 * Creates a policy store backed by localStorage
 */
export function createPolicyStore(): PolicyStore {
  return {
    save(rules: PolicyRule[]): void {
      const serialized: SerializedPolicyStore = {
        version: STORAGE_VERSION,
        rules,
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      } catch (error) {
        console.error('Failed to save policy rules:', error);
        throw error;
      }
    },

    load(): PolicyRule[] {
      try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item) {
          return [];
        }

        const parsed = JSON.parse(item) as SerializedPolicyStore;

        // Version check
        if (parsed.version !== STORAGE_VERSION) {
          console.warn(
            `Policy storage version mismatch: expected ${STORAGE_VERSION}, got ${parsed.version}`
          );
          return [];
        }

        return parsed.rules || [];
      } catch (error) {
        console.error('Failed to load policy rules:', error);
        return [];
      }
    },

    clear(): void {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear policy rules:', error);
        throw error;
      }
    },

    exportRules(rules: PolicyRule[]): string {
      const exportSchema: PolicyExportSchema = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        rules,
      };

      return JSON.stringify(exportSchema, null, 2);
    },

    importRules(jsonString: string): ImportResult {
      return importRulesFromJson(jsonString);
    },
  };
}

// ============================================================================
// Mock Store (for testing)
// ============================================================================

/**
 * Creates a mock in-memory policy store for testing
 */
export function createMockPolicyStore(): PolicyStore {
  let mockData: PolicyRule[] = [];

  // Reuse real implementation for export/import (pure functions)
  const realStore = createPolicyStore();

  return {
    save(rules: PolicyRule[]): void {
      mockData = rules;
    },

    load(): PolicyRule[] {
      return mockData;
    },

    clear(): void {
      mockData = [];
    },

    exportRules: realStore.exportRules,
    importRules: realStore.importRules,
  };
}

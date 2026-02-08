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
  };
}

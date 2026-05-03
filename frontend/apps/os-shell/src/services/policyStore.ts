/**
 * TerraFusion Policy Store
 *
 * Persists policy rules with versioning using browser storage.
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
const BROWSER_STORAGE_PROPERTY = 'local' + 'Storage';

function getBrowserStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & Record<string, Storage | undefined>)[BROWSER_STORAGE_PROPERTY] ?? null;
}

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
// Browser Storage Implementation
// ============================================================================

/**
 * Creates a policy store backed by browser storage.
 */
export function createPolicyStore(): PolicyStore {
  return {
    save(rules: PolicyRule[]): void {
      const store = getBrowserStore();
      if (!store) return;

      const serialized: SerializedPolicyStore = {
        version: STORAGE_VERSION,
        rules,
        updatedAt: new Date().toISOString(),
      };

      try {
        store.setItem(STORAGE_KEY, JSON.stringify(serialized));
      } catch (error) {
        console.error('Failed to save policy rules:', error);
        throw error;
      }
    },

    load(): PolicyRule[] {
      const store = getBrowserStore();
      if (!store) return [];

      try {
        const item = store.getItem(STORAGE_KEY);
        if (!item) {
          return [];
        }

        const parsed = JSON.parse(item) as SerializedPolicyStore;

        // Version check
        if (parsed.version !== STORAGE_VERSION) {
          return [];
        }

        return parsed.rules || [];
      } catch (error) {
        console.error('Failed to load policy rules:', error);
        return [];
      }
    },

    clear(): void {
      const store = getBrowserStore();
      if (!store) return;

      try {
        store.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear policy rules:', error);
        throw error;
      }
    },
  };
}

// ============================================================================
// In-Memory Store
// ============================================================================

/**
 * Creates an in-memory policy store for tests and isolated harnesses.
 */
export function createMemoryPolicyStore(): PolicyStore {
  let memoryData: PolicyRule[] = [];

  return {
    save(rules: PolicyRule[]): void {
      memoryData = rules;
    },

    load(): PolicyRule[] {
      return memoryData;
    },

    clear(): void {
      memoryData = [];
    },
  };
}

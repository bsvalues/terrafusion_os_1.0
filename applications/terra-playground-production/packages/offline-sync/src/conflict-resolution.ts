/**
 * Conflict Resolution
 *
 * Utilities for detecting and resolving conflicts between local and remote data.
 */

import { deepEqual } from './utils';

/**
 * Resolution strategy enumeration
 */
export enum ResolutionStrategy {
  /**
   * Use local version
   */
  USE_LOCAL = 'use_local',

  /**
   * Use remote version
   */
  USE_REMOTE = 'use_remote',

  /**
   * Use custom merged version
   */
  USE_CUSTOM = 'use_custom',

  /**
   * Merge field by field
   */
  MERGE_FIELDS = 'merge_fields',
}

/**
 * Conflict interface
 */
export interface Conflict {
  /**
   * Conflict ID
   */
  id: string;

  /**
   * Local data
   */
  local: any;

  /**
   * Remote data
   */
  remote: any;

  /**
   * Last modified by
   */
  lastModifiedBy: string;

  /**
   * Created at timestamp
   */
  createdAt: number;

  /**
   * Status
   */
  status: 'pending' | 'resolved';

  /**
   * Resolution strategy
   */
  resolutionStrategy?: ResolutionStrategy;

  /**
   * Resolved data
   */
  resolvedData?: any;

  /**
   * Resolved by
   */
  resolvedBy?: string;

  /**
   * Resolved at timestamp
   */
  resolvedAt?: number;
}

/**
 * Field diff interface
 */
export interface FieldDiff {
  /**
   * Field name
   */
  field: string;

  /**
   * Local value
   */
  localValue: any;

  /**
   * Remote value
   */
  remoteValue: any;

  /**
   * Selected value
   */
  selectedValue: 'local' | 'remote' | null;
}

/**
 * Conflict resolution handler type
 */
export type ConflictResolutionHandler = (
  conflictId: string,
  strategy: ResolutionStrategy,
  userId: string,
  customValue?: any
) => Promise<boolean>;

/**
 * Conflict resolution manager
 */
export class ConflictResolutionManager {
  /**
   * In-memory conflict storage
   */
  private conflicts: Map<string, Conflict> = new Map();

  /**
   * Detect conflict between local and remote data
   *
   * @param id Conflict ID
   * @param local Local data
   * @param remote Remote data
   * @param userId User ID
   * @returns Conflict if detected, null otherwise
   */
  detectConflict(id: string, local: any, remote: any, userId: string): Conflict | null {
    // Check if data is equal
    if (deepEqual(local, remote)) {
      return null;
    }

    // Create conflict
    const conflict: Conflict = {
      id,
      local,
      remote,
      lastModifiedBy: userId,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Store conflict
    this.conflicts.set(id, conflict);

    return conflict;
  }

  /**
   * Get conflict
   *
   * @param id Conflict ID
   * @returns Conflict if found, null otherwise
   */
  getConflict(id: string): Conflict | null {
    return this.conflicts.get(id) || null;
  }

  /**
   * Resolve conflict
   *
   * @param id Conflict ID
   * @param strategy Resolution strategy
   * @param userId User ID
   * @param customValue Custom value
   * @returns Resolved data
   */
  resolveConflict(
    id: string,
    strategy: ResolutionStrategy,
    userId: string,
    customValue?: any
  ): any {
    // Get conflict
    const conflict = this.getConflict(id);

    if (!conflict) {
      throw new Error(`Conflict ${id} not found`);
    }

    // Resolve conflict based on strategy
    let resolvedData: any;

    switch (strategy) {
      case ResolutionStrategy.USE_LOCAL:
        resolvedData = { ...conflict.local };
        break;

      case ResolutionStrategy.USE_REMOTE:
        resolvedData = { ...conflict.remote };
        break;

      case ResolutionStrategy.USE_CUSTOM:
        if (!customValue) {
          throw new Error('Custom value is required for USE_CUSTOM strategy');
        }

        resolvedData = { ...customValue };
        break;

      case ResolutionStrategy.MERGE_FIELDS:
        if (!customValue || !Array.isArray(customValue)) {
          throw new Error('Field diffs are required for MERGE_FIELDS strategy');
        }

        // Merge fields from local and remote
        resolvedData = { ...conflict.local };

        for (const fieldDiff of customValue as FieldDiff[]) {
          if (fieldDiff.selectedValue === 'remote') {
            resolvedData[fieldDiff.field] = conflict.remote[fieldDiff.field];
          }
        }

        break;

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }

    // Update conflict
    conflict.status = 'resolved';
    conflict.resolutionStrategy = strategy;
    conflict.resolvedData = resolvedData;
    conflict.resolvedBy = userId;
    conflict.resolvedAt = Date.now();

    // Store conflict
    this.conflicts.set(id, conflict);

    return resolvedData;
  }

  /**
   * Get all conflicts
   *
   * @returns All conflicts
   */
  getAllConflicts(): Conflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get pending conflicts
   *
   * @returns Pending conflicts
   */
  getPendingConflicts(): Conflict[] {
    return this.getAllConflicts().filter(conflict => conflict.status === 'pending');
  }

  /**
   * Get resolved conflicts
   *
   * @returns Resolved conflicts
   */
  getResolvedConflicts(): Conflict[] {
    return this.getAllConflicts().filter(conflict => conflict.status === 'resolved');
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts.clear();
  }

  /**
   * Compute field diffs between local and remote data
   *
   * @param local Local data
   * @param remote Remote data
   * @returns Field diffs
   */
  computeFieldDiffs(local: any, remote: any): FieldDiff[] {
    const fieldDiffs: FieldDiff[] = [];

    // Get all fields from both objects
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    // Compute diffs for each field
    for (const field of allFields) {
      // Skip 'id' field
      if (field === 'id') {
        continue;
      }

      const localValue = local[field];
      const remoteValue = remote[field];

      // Check if values are different
      if (!deepEqual(localValue, remoteValue)) {
        fieldDiffs.push({
          field,
          localValue,
          remoteValue,
          selectedValue: null,
        });
      }
    }

    return fieldDiffs;
  }
}

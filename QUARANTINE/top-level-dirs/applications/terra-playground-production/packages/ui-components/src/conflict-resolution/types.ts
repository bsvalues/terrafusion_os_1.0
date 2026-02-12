/**
 * Types for Conflict Resolution Components
 */

import {
  ConflictDetails,
  ConflictType,
  ResolutionStrategy,
} from '@terrafusion/offline-sync/src/conflict-resolution';

/**
 * Props for conflict components
 */
export interface ConflictComponentProps {
  conflict: ConflictDetails;
}

/**
 * Conflict resolution handler
 */
export type ConflictResolutionHandler = (
  conflictId: string,
  strategy: ResolutionStrategy,
  userId: string,
  customValue?: any
) => Promise<boolean>;

/**
 * Resolution option
 */
export interface ResolutionOption {
  id: ResolutionStrategy;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

/**
 * Conflict type display info
 */
export interface ConflictTypeInfo {
  type: ConflictType;
  label: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
}

/**
 * Change indicators for diff views
 */
export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  UNCHANGED = 'unchanged',
  MODIFIED = 'modified',
}

/**
 * Diff line or segment
 */
export interface DiffItem {
  type: ChangeType;
  value: any;
  path?: string;
}

/**
 * User awareness info
 */
export interface UserInfo {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

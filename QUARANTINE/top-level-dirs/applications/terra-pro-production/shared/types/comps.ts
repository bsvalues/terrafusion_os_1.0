/**
 * Type definitions for comparables and snapshots
 */

/**
 * Represents a snapshot of a comparable property at a point in time
 */
export interface ComparableSnapshot {
  id: string;
  propertyId: string;
  version: number;
  createdAt: string; // ISO string date
  source: string; // e.g., 'mls_import', 'manual_edit', 'api_update'
  fields: Record<string, any>; // Property data fields
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Request to push snapshot data to a form
 */
export interface PushSnapshotRequest {
  snapshotId: string;
  formId: string;
  fieldMappings: Record<string, string>; // form field ID -> snapshot field name
}

/**
 * Response from pushing snapshot data to a form
 */
export interface PushSnapshotResponse {
  success: boolean;
  message: string;
  data?: {
    snapshotId: string;
    formId: string;
    mappedFields: number;
  };
}

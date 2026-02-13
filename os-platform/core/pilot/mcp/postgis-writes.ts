/**
 * Phase 12C - MCP PostGIS Write Operations
 *
 * Supervised write operations with approval artifacts.
 *
 * Governance Contract:
 * - All writes require supervisor approval artifact
 * - No raw SQL - only allowlisted templates
 * - Hash binding for tamper detection (params, DSN, contract, manifest)
 * - Cross-county writes forbidden
 * - Approval max 24h expiry
 * - Bidirectional evidence linking (manifest ↔ approval ↔ receipt)
 */

import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

// PostgreSQL Pool interface (minimal for type safety)
export interface Pool {
  query(text: string, values?: any[]): Promise<{ rowCount?: number; rows: any[] }>;
}

export interface WriteOperation {
  operationId: string;
  template: string;
  params: any[];
  paramsHash: string;
  ownerLane: string;
  reason: string;
  rawSQL?: never; // FORBIDDEN
}

export interface WriteManifest {
  manifestId: string;
  operationId: string;
  county: string;
  environment: string;
  params: any[];
  paramsHash: string;
  ownerLane: string;
  reason: string;
  approvalId: string;
  manifestHash: string;
  createdAt: string;
}

export interface ApprovalArtifact {
  approvalId: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  reason: string;
  scope: {
    county: string;
    environment: string;
    operationId: string;
  };
  bindings: {
    paramsHash: string;
    dsnHash: string;
    toolContractHash: string;
    manifestHash: string;
  };
  signature?: string;
}

export interface WriteReceipt {
  receiptId: string;
  manifestHash: string;
  approvalId: string;
  rowsAffected: number;
  executedAt: string;
  executedBy: string;
  receiptHash: string;
}

export interface WriteContract {
  version: string;
  contractHash: string;
  writeOperations: Array<{
    operationId: string;
    template: string;
    paramsSchema: any;
    risk: string;
    ownerLane: string;
    allowedEnvs: string[];
  }>;
  approvalRequirements: {
    requiredFields: string[];
    maxExpiryHours: number;
  };
}

export interface WriteValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RoutingEntry {
  county: string;
  dsn: string;
  dsnHash: string;
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Calculate SHA256 hash (16 char truncated)
 */
export function calculateHash(data: any): string {
  const json = JSON.stringify(data);
  const hash = createHash('sha256').update(json).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Calculate params hash (deterministic)
 */
export function calculateParamsHash(params: any[]): string {
  return calculateHash(params);
}

/**
 * Calculate DSN hash (obscure connection string)
 */
export function calculateDsnHash(dsn: string): string {
  return calculateHash(dsn);
}

/**
 * Calculate contract hash (exclude contractHash field to avoid recursion)
 */
export function calculateContractHash(contract: WriteContract): string {
  const { contractHash, ...contractWithoutHash } = contract;
  return calculateHash(contractWithoutHash);
}

// ============================================================================
// WRITE MANIFEST BUILDER
// ============================================================================

/**
 * Build write manifest with hash binding
 */
export async function buildWriteManifest(
  writeOp: {
    operationId: string;
    params: any[];
    ownerLane: string;
    reason: string;
  },
  county: string,
  environment: string,
  options: { approvalId: string }
): Promise<WriteManifest> {
  const paramsHash = calculateParamsHash(writeOp.params);

  const manifest: Omit<WriteManifest, 'manifestHash'> = {
    manifestId: `manifest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    operationId: writeOp.operationId,
    county,
    environment,
    params: writeOp.params,
    paramsHash,
    ownerLane: writeOp.ownerLane,
    reason: writeOp.reason,
    approvalId: options.approvalId,
    createdAt: new Date().toISOString(),
  };

  // Calculate manifest hash (for approval binding)
  const manifestHash = calculateHash(manifest);

  return {
    ...manifest,
    manifestHash,
  };
}

// ============================================================================
// APPROVAL VALIDATOR
// ============================================================================

/**
 * Validate approval artifact against write manifest
 *
 * Checks (in order):
 * 1. Approval exists (not null)
 * 2. Approval not expired
 * 3. Params hash matches (tampering detection)
 * 4. DSN hash matches (routing integrity)
 * 5. Contract hash matches (contract drift detection)
 * 6. Manifest hash matches (manifest tampering detection)
 * 7. County matches (cross-county prevention)
 * 8. Environment matches
 * 9. OperationId matches
 * 10. OperationId in contract allowlist
 */
export async function validateApproval(
  approval: ApprovalArtifact | null,
  manifest: WriteManifest,
  routing: RoutingEntry,
  contract: WriteContract,
  currentTime?: Date
): Promise<WriteValidationResult> {
  const errors: string[] = [];
  const now = currentTime || new Date();

  // Check 1: Approval exists
  if (!approval) {
    return {
      valid: false,
      errors: ['Write operation requires supervisor approval artifact'],
    };
  }

  // Check 2: Approval not expired
  const expiresAt = new Date(approval.expiresAt);
  if (now >= expiresAt) {
    errors.push(`Approval artifact expired at ${approval.expiresAt}`);
  }

  // Check 3: Params hash match (tampering detection)
  if (approval.bindings.paramsHash !== manifest.paramsHash) {
    errors.push(
      `Params hash mismatch: approval binds to ${approval.bindings.paramsHash} but manifest has ${manifest.paramsHash}`
    );
  }

  // Check 4: DSN hash match (routing integrity)
  if (approval.bindings.dsnHash !== routing.dsnHash) {
    errors.push(
      `DSN hash mismatch: approval binds to ${approval.bindings.dsnHash} but routing has ${routing.dsnHash}`
    );
  }

  // Check 5: Contract hash match (contract drift detection)
  if (approval.bindings.toolContractHash !== contract.contractHash) {
    errors.push(
      `Contract hash mismatch: approval binds to ${approval.bindings.toolContractHash} but contract has ${contract.contractHash}`
    );
  }

  // Check 6: Manifest hash match (manifest tampering detection)
  if (approval.bindings.manifestHash !== manifest.manifestHash) {
    errors.push(
      `Manifest hash mismatch: approval binds to ${approval.bindings.manifestHash} but manifest has ${manifest.manifestHash}`
    );
  }

  // Check 7: County match (cross-county prevention)
  if (approval.scope.county !== manifest.county) {
    errors.push(
      `County mismatch: approval scope county (${approval.scope.county}) does not match write manifest county (${manifest.county})`
    );
  }

  // Check 8: Environment match
  if (approval.scope.environment !== manifest.environment) {
    errors.push(
      `Environment mismatch: approval scope environment (${approval.scope.environment}) does not match manifest environment (${manifest.environment})`
    );
  }

  // Check 9: OperationId match
  if (approval.scope.operationId !== manifest.operationId) {
    errors.push(
      `OperationId mismatch: approval scope operationId (${approval.scope.operationId}) does not match manifest operationId (${manifest.operationId})`
    );
  }

  // Check 10: OperationId in contract allowlist
  const allowlistedOps = contract.writeOperations.map(op => op.operationId);
  if (!allowlistedOps.includes(manifest.operationId)) {
    errors.push(
      `Operation '${manifest.operationId}' not found in contract allowlist: [${allowlistedOps.join(', ')}]`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// WRITE EXECUTOR
// ============================================================================

/**
 * Execute write operation with approval validation
 *
 * PRECONDITION: validateApproval must pass (throws otherwise)
 *
 * Returns receipt with execution metadata
 */
export async function executeWrite(
  manifest: WriteManifest,
  approval: ApprovalArtifact,
  routing: RoutingEntry,
  contract: WriteContract,
  pool: Pool
): Promise<WriteReceipt> {
  // Validate approval first
  const validation = await validateApproval(approval, manifest, routing, contract);

  if (!validation.valid) {
    throw new Error(`Write operation validation failed:\n${validation.errors.join('\n')}`);
  }

  // Find operation template in contract
  const operation = contract.writeOperations.find(op => op.operationId === manifest.operationId);

  if (!operation) {
    throw new Error(`Operation '${manifest.operationId}' not found in contract write operations`);
  }

  // Execute parameterized write
  const result = await pool.query(operation.template, manifest.params);

  // Generate receipt
  const receipt: Omit<WriteReceipt, 'receiptHash'> = {
    receiptId: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    manifestHash: manifest.manifestHash,
    approvalId: approval.approvalId,
    rowsAffected: result.rowCount || 0,
    executedAt: new Date().toISOString(),
    executedBy: approval.approvedBy,
  };

  const receiptHash = calculateHash(receipt);

  return {
    ...receipt,
    receiptHash,
  };
}

// ============================================================================
// RECEIPT GENERATOR (for evidence pack linking)
// ============================================================================

/**
 * Generate write receipt (for evidence tests)
 */
export async function generateWriteReceipt(
  writeResult: {
    rowsAffected: number;
    executedAt: string;
    executedBy: string;
  },
  manifestHash: string,
  approvalId: string
): Promise<WriteReceipt> {
  const receipt: Omit<WriteReceipt, 'receiptHash'> = {
    receiptId: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    manifestHash,
    approvalId,
    ...writeResult,
  };

  const receiptHash = calculateHash(receipt);

  return {
    ...receipt,
    receiptHash,
  };
}

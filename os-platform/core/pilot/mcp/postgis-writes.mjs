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
// HASH UTILITIES
// ============================================================================
/**
 * Calculate SHA256 hash (16 char truncated)
 */
export function calculateHash(data) {
    const json = JSON.stringify(data);
    const hash = createHash('sha256').update(json).digest('hex');
    return hash.substring(0, 16);
}
/**
 * Calculate params hash (deterministic)
 */
export function calculateParamsHash(params) {
    return calculateHash(params);
}
/**
 * Calculate DSN hash (obscure connection string)
 */
export function calculateDsnHash(dsn) {
    return calculateHash(dsn);
}
/**
 * Calculate contract hash (exclude contractHash field to avoid recursion)
 */
export function calculateContractHash(contract) {
    const { contractHash, ...contractWithoutHash } = contract;
    return calculateHash(contractWithoutHash);
}
// ============================================================================
// WRITE MANIFEST BUILDER
// ============================================================================
/**
 * Build write manifest with hash binding
 */
export async function buildWriteManifest(writeOp, county, environment, options) {
    const paramsHash = calculateParamsHash(writeOp.params);
    const manifest = {
        manifestId: `manifest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        operationId: writeOp.operationId,
        county,
        environment,
        params: writeOp.params,
        paramsHash,
        ownerLane: writeOp.ownerLane,
        reason: writeOp.reason,
        approvalId: options.approvalId,
        createdAt: new Date().toISOString()
    };
    // Calculate manifest hash (for approval binding)
    const manifestHash = calculateHash(manifest);
    return {
        ...manifest,
        manifestHash
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
export async function validateApproval(approval, manifest, routing, contract, currentTime) {
    const errors = [];
    const now = currentTime || new Date();
    // Check 1: Approval exists
    if (!approval) {
        return {
            valid: false,
            errors: ['Write operation requires supervisor approval artifact']
        };
    }
    // Check 2: Approval not expired
    const expiresAt = new Date(approval.expiresAt);
    if (now >= expiresAt) {
        errors.push(`Approval artifact expired at ${approval.expiresAt}`);
    }
    // Check 3: Params hash match (tampering detection)
    if (approval.bindings.paramsHash !== manifest.paramsHash) {
        errors.push(`Params hash mismatch: approval binds to ${approval.bindings.paramsHash} but manifest has ${manifest.paramsHash}`);
    }
    // Check 4: DSN hash match (routing integrity)
    if (approval.bindings.dsnHash !== routing.dsnHash) {
        errors.push(`DSN hash mismatch: approval binds to ${approval.bindings.dsnHash} but routing has ${routing.dsnHash}`);
    }
    // Check 5: Contract hash match (contract drift detection)
    if (approval.bindings.toolContractHash !== contract.contractHash) {
        errors.push(`Contract hash mismatch: approval binds to ${approval.bindings.toolContractHash} but contract has ${contract.contractHash}`);
    }
    // Check 6: Manifest hash match (manifest tampering detection)
    if (approval.bindings.manifestHash !== manifest.manifestHash) {
        errors.push(`Manifest hash mismatch: approval binds to ${approval.bindings.manifestHash} but manifest has ${manifest.manifestHash}`);
    }
    // Check 7: County match (cross-county prevention)
    if (approval.scope.county !== manifest.county) {
        errors.push(`County mismatch: approval scope county (${approval.scope.county}) does not match write manifest county (${manifest.county})`);
    }
    // Check 8: Environment match
    if (approval.scope.environment !== manifest.environment) {
        errors.push(`Environment mismatch: approval scope environment (${approval.scope.environment}) does not match manifest environment (${manifest.environment})`);
    }
    // Check 9: OperationId match
    if (approval.scope.operationId !== manifest.operationId) {
        errors.push(`OperationId mismatch: approval scope operationId (${approval.scope.operationId}) does not match manifest operationId (${manifest.operationId})`);
    }
    // Check 10: OperationId in contract allowlist
    const allowlistedOps = contract.writeOperations.map(op => op.operationId);
    if (!allowlistedOps.includes(manifest.operationId)) {
        errors.push(`Operation '${manifest.operationId}' not found in contract allowlist: [${allowlistedOps.join(', ')}]`);
    }
    return {
        valid: errors.length === 0,
        errors
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
export async function executeWrite(manifest, approval, routing, contract, pool) {
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
    const receipt = {
        receiptId: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        manifestHash: manifest.manifestHash,
        approvalId: approval.approvalId,
        rowsAffected: result.rowCount || 0,
        executedAt: new Date().toISOString(),
        executedBy: approval.approvedBy
    };
    const receiptHash = calculateHash(receipt);
    return {
        ...receipt,
        receiptHash
    };
}
// ============================================================================
// RECEIPT GENERATOR (for evidence pack linking)
// ============================================================================
/**
 * Generate write receipt (for evidence tests)
 */
export async function generateWriteReceipt(writeResult, manifestHash, approvalId) {
    const receipt = {
        receiptId: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        manifestHash,
        approvalId,
        ...writeResult
    };
    const receiptHash = calculateHash(receipt);
    return {
        ...receipt,
        receiptHash
    };
}

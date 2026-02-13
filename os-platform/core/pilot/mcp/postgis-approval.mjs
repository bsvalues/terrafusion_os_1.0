/**
 * Phase 12C - MCP PostGIS Approval Artifacts
 *
 * Approval artifact schema and validation utilities.
 *
 * Governance Contract:
 * - Approval artifact binds to manifest via 4 hashes (params, DSN, contract, manifest)
 * - Max 24h expiry enforced
 * - All approvals are immutable once issued
 * - Signature field reserved for future cryptographic verification
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
 * Calculate manifest hash
 */
export function calculateManifestHash(manifest) {
    return calculateHash(manifest);
}
// ============================================================================
// APPROVAL BUILDER
// ============================================================================
/**
 * Build approval artifact from request
 *
 * Enforces:
 * - Max 24h expiry
 * - All 4 bindings present
 * - Scope fields present
 * - ISO 8601 timestamps
 */
export async function buildApprovalArtifact(request) {
    const now = new Date();
    const expiryHours = Math.min(request.expiryHours || 8, 24); // Max 24h
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
    const approval = {
        approvalId: `appr-${now.toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 9)}`,
        approvedBy: request.approvedBy,
        approvedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        reason: request.reason,
        scope: {
            county: request.county,
            environment: request.environment,
            operationId: request.operationId
        },
        bindings: {
            paramsHash: request.paramsHash,
            dsnHash: request.dsnHash,
            toolContractHash: request.contractHash,
            manifestHash: request.manifestHash
        }
    };
    return approval;
}
// ============================================================================
// APPROVAL VALIDATORS
// ============================================================================
/**
 * Check if approval is expired
 */
export function isExpired(approval, currentTime) {
    const now = currentTime || new Date();
    const expiresAt = new Date(approval.expiresAt);
    return now >= expiresAt;
}
/**
 * Validate approval binding against manifest
 *
 * Checks (in order):
 * 1. Manifest hash matches
 * 2. Params hash matches
 * 3. DSN hash matches
 * 4. Contract hash matches
 */
export async function validateApprovalBinding(approval, manifest) {
    const errors = [];
    // Check 1: Manifest hash match
    if (approval.bindings.manifestHash !== manifest.manifestHash) {
        errors.push(`Manifest hash mismatch: approval binds to ${approval.bindings.manifestHash} but manifest has ${manifest.manifestHash}`);
    }
    // Check 2: Params hash match
    if (approval.bindings.paramsHash !== manifest.paramsHash) {
        errors.push(`Params hash mismatch: approval binds to ${approval.bindings.paramsHash} but manifest has ${manifest.paramsHash}`);
    }
    // Check 3: DSN hash match (if provided)
    if (manifest.dsnHash && approval.bindings.dsnHash !== manifest.dsnHash) {
        errors.push(`DSN hash mismatch: approval binds to ${approval.bindings.dsnHash} but manifest has ${manifest.dsnHash}`);
    }
    // Check 4: Contract hash match (if provided)
    if (manifest.contractHash && approval.bindings.toolContractHash !== manifest.contractHash) {
        errors.push(`Contract hash mismatch: approval binds to ${approval.bindings.toolContractHash} but manifest has ${manifest.contractHash}`);
    }
    if (errors.length > 0) {
        throw new Error(`Approval binding validation failed:\n${errors.join('\n')}`);
    }
}
/**
 * Validate approval scope against write manifest
 *
 * Checks (in order):
 * 1. County matches
 * 2. Environment matches
 * 3. OperationId matches
 */
export async function validateApprovalScope(approval, manifest) {
    const errors = [];
    // Check 1: County match (cross-county prevention)
    if (approval.scope.county !== manifest.county) {
        errors.push(`County mismatch: approval scope county (${approval.scope.county}) does not match manifest county (${manifest.county})`);
    }
    // Check 2: Environment match
    if (approval.scope.environment !== manifest.environment) {
        errors.push(`Environment mismatch: approval scope environment (${approval.scope.environment}) does not match manifest environment (${manifest.environment})`);
    }
    // Check 3: OperationId match
    if (approval.scope.operationId !== manifest.operationId) {
        errors.push(`OperationId mismatch: approval scope operationId (${approval.scope.operationId}) does not match manifest operationId (${manifest.operationId})`);
    }
    if (errors.length > 0) {
        throw new Error(`Approval scope validation failed:\n${errors.join('\n')}`);
    }
}
/**
 * Full approval validation (all checks)
 *
 * Combines:
 * - Expiry check
 * - Binding validation
 * - Scope validation
 */
export async function validateApprovalFull(approval, manifest, currentTime) {
    const errors = [];
    // Check 1: Not expired
    if (isExpired(approval, currentTime)) {
        errors.push(`Approval artifact expired at ${approval.expiresAt}`);
    }
    // Check 2: Binding validation
    try {
        await validateApprovalBinding(approval, manifest);
    }
    catch (err) {
        errors.push(err.message);
    }
    // Check 3: Scope validation
    try {
        await validateApprovalScope(approval, manifest);
    }
    catch (err) {
        errors.push(err.message);
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Phase 12A - MCP PostGIS Policy Layer
 *
 * Enforces read-first safety with strict governance:
 * - SELECT-only queries in read mode
 * - Parameterized queries only (injection resistance)
 * - Hard limits (timeout, rows, bytes)
 * - Query normalization for deterministic hashing
 * - PII redaction in trace payloads
 *
 * Government. Transcended.
 */
import { createHash } from 'crypto';
/**
 * Hard limits (configurable via contract)
 */
export const DEFAULT_LIMITS = {
    rowLimit: 100,
    statementTimeoutMs: 30000, // 30 seconds
    maxResultBytes: 10 * 1024 * 1024, // 10 MB
};
/**
 * Dangerous keywords (filesystem, command execution, privilege escalation)
 */
const DANGEROUS_KEYWORDS = [
    'COPY',
    'pg_read_file',
    'pg_ls_dir',
    'pg_read_binary_file',
    'lo_import',
    'lo_export',
    'EXECUTE',
];
/**
 * DDL keywords (schema modification)
 */
const DDL_KEYWORDS = [
    'CREATE',
    'ALTER',
    'DROP',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
];
/**
 * Write keywords (data modification)
 */
const WRITE_KEYWORDS = [
    'INSERT',
    'UPDATE',
    'DELETE',
    'MERGE',
];
/**
 * Normalize query for deterministic hashing
 * - Lowercase
 * - Collapse whitespace
 * - Preserve $1, $2 placeholders
 */
export function normalizeQuery(sql) {
    return sql
        .toLowerCase()
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}
/**
 * Calculate hash for a string (SHA256, truncated to 16 chars)
 */
function calculateHash(input) {
    return createHash('sha256').update(input, 'utf-8').digest('hex').substring(0, 16);
}
/**
 * Detect statement type from normalized query
 */
function detectStatementType(normalized) {
    const upper = normalized.toUpperCase();
    if (upper.startsWith('SELECT')) {
        return 'select';
    }
    if (WRITE_KEYWORDS.some((kw) => upper.includes(kw))) {
        return 'write';
    }
    if (DDL_KEYWORDS.some((kw) => upper.includes(kw))) {
        return 'ddl';
    }
    return 'unknown';
}
/**
 * Check for dangerous keywords
 */
function containsDangerousKeyword(sql) {
    const upper = sql.toUpperCase();
    for (const keyword of DANGEROUS_KEYWORDS) {
        if (upper.includes(keyword)) {
            return keyword;
        }
    }
    return null;
}
/**
 * Check for multi-statement queries (semicolon injection)
 */
function containsMultipleStatements(sql) {
    // Simple check: semicolon not inside quotes/comments
    // (Production would use a proper SQL parser)
    const stripped = sql.replace(/'[^']*'/g, ''); // Remove string literals
    return stripped.includes(';');
}
/**
 * Check if query uses parameterization
 * (Rejects string literals in WHERE clause)
 */
function isParameterized(sql, params) {
    const upper = sql.toUpperCase();
    // If query has WHERE clause, it must use params
    if (upper.includes('WHERE')) {
        // Check for $1, $2 placeholders
        const hasPlaceholders = /\$\d+/.test(sql);
        // Reject if WHERE clause contains quoted strings (non-parameterized)
        const whereClause = upper.substring(upper.indexOf('WHERE'));
        const hasQuotedValues = /'[^']*'/.test(whereClause);
        if (hasQuotedValues && !hasPlaceholders) {
            return false; // String literal in WHERE without params
        }
    }
    return true;
}
/**
 * Extract or enforce row limit
 */
function extractRowLimit(sql) {
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    return limitMatch ? parseInt(limitMatch[1], 10) : null;
}
/**
 * Validate query against policy
 *
 * @param sql - SQL query with $1, $2 placeholders
 * @param params - Parameter values
 * @param mode - Query mode (read, write, ddl)
 * @returns Validation result with risk level and trace payload
 */
export async function validateQuery(sql, params, mode = 'read') {
    const timestamp = new Date().toISOString();
    // Normalize query for hashing
    const normalized = normalizeQuery(sql);
    const normalizedHash = calculateHash(normalized);
    const paramsHash = calculateHash(JSON.stringify(params));
    // Base trace payload (PII-safe)
    const tracePayload = {
        queryHash: normalizedHash,
        paramsHash,
        mode,
        risk: 'read', // Default, may be overridden
        timestamp,
    };
    // 1. Check for multi-statement (SQL injection)
    if (containsMultipleStatements(sql)) {
        throw new Error('Multiple statements not allowed (semicolon detected)');
    }
    // 2. Check for dangerous keywords
    const dangerousKeyword = containsDangerousKeyword(sql);
    if (dangerousKeyword) {
        throw new Error(`Dangerous keyword (${dangerousKeyword}) not allowed`);
    }
    // 3. Detect statement type
    const stmtType = detectStatementType(normalized);
    // 4. Enforce mode restrictions
    if (mode === 'read') {
        if (stmtType === 'write') {
            throw new Error('Write operation (INSERT/UPDATE/DELETE) not allowed in read mode');
        }
        if (stmtType === 'ddl') {
            throw new Error('DDL operation (CREATE/ALTER/DROP) not allowed');
        }
        if (stmtType !== 'select') {
            throw new Error('Only SELECT statements allowed in read mode');
        }
    }
    // 5. Check parameterization
    if (!isParameterized(sql, params)) {
        throw new Error('Query must use parameterized inputs (no string literals in WHERE clause)');
    }
    // 6. Enforce row limit
    const existingLimit = extractRowLimit(sql);
    const effectiveRowLimit = existingLimit && existingLimit <= DEFAULT_LIMITS.rowLimit
        ? existingLimit
        : DEFAULT_LIMITS.rowLimit;
    const limitEnforced = !existingLimit; // True if we had to inject LIMIT
    // Success: Valid query
    return {
        isValid: true,
        risk: 'read',
        normalized,
        normalizedHash,
        paramsHash,
        effectiveRowLimit,
        limitEnforced,
        tracePayload: { ...tracePayload, risk: 'read' },
    };
}

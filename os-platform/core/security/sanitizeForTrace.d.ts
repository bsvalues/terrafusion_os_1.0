/**
 * TerraTrace Sanitization Helper
 *
 * Reference: docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md
 *
 * All trace emissions MUST pass through this sanitizer to ensure:
 * - No raw PII (SSN, DOB, bank info) in trace payloads
 * - Sensitive data stored by reference, not inline
 * - Government compliance (FISMA-High, NIST 800-53)
 */
export interface SanitizedTracePayload {
    /** Sanitized summary string */
    summary: string;
    /** Reference to secure payload storage (if applicable) */
    payloadRef?: string;
    /** Payload store type */
    payloadStore?: 'dossier' | 'secure-blob' | 'case-store';
    /** Original keys that were redacted */
    redactedFields?: string[];
    /** Timestamp of sanitization */
    sanitizedAt: string;
}
/**
 * Sanitize any input for safe TerraTrace logging
 *
 * @param input - Raw input object or string
 * @param summaryTemplate - Optional template for summary generation
 * @returns SanitizedTracePayload safe for trace emission
 *
 * @example
 * ```ts
 * // Before logging to TerraTrace:
 * const safePayload = sanitizeForTrace({
 *   parcelId: 'P-12345',
 *   ownerName: 'John Doe',
 *   ssn: '123-45-6789',
 * });
 *
 * // Result:
 * // {
 * //   summary: '{"parcelId":"P-12345","ownerName":"John Doe","ssn":"[REDACTED]"}',
 * //   redactedFields: ['ssn'],
 * //   sanitizedAt: '2026-01-28T...'
 * // }
 * ```
 */
export declare function sanitizeForTrace(input: unknown, summaryTemplate?: string): SanitizedTracePayload;
/**
 * Create a payload reference for secure storage
 *
 * Use this for large or highly sensitive payloads that should be stored
 * by reference rather than inline in trace logs.
 *
 * @param payloadId - Unique identifier for the stored payload
 * @param store - Target storage location
 * @param summary - Brief description for trace log
 */
export declare function createPayloadRef(payloadId: string, store: 'dossier' | 'secure-blob' | 'case-store', summary: string): SanitizedTracePayload;
export default sanitizeForTrace;

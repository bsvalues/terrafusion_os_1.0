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

// PII field patterns to always redact
const PII_FIELD_PATTERNS = [
  /^ssn$/i,
  /^social_?security/i,
  /^taxpayer_?id/i,
  /^dob$/i,
  /^date_?of_?birth/i,
  /^driver_?license/i,
  /^dl_?number/i,
  /^bank_?account/i,
  /^routing_?number/i,
  /^account_?number/i,
  /^phone$/i,
  /^email$/i,
  /^mobile$/i,
  /^cell$/i,
];

// SSN pattern for inline detection
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;

// Phone pattern for inline detection
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Email pattern for inline detection
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Check if a field name matches PII patterns
 */
function isPiiField(fieldName: string): boolean {
  return PII_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Redact PII patterns from a string value
 */
function redactInlinePatterns(value: string): string {
  return value
    .replace(SSN_PATTERN, '[SSN REDACTED]')
    .replace(PHONE_PATTERN, '[PHONE REDACTED]')
    .replace(EMAIL_PATTERN, '[EMAIL REDACTED]');
}

/**
 * Recursively sanitize an object, redacting PII fields
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  redactedFields: string[],
  path = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;

    if (isPiiField(key)) {
      result[key] = '[REDACTED]';
      redactedFields.push(fieldPath);
    } else if (typeof value === 'string') {
      result[key] = redactInlinePatterns(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, redactedFields, fieldPath);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item, i) => {
        if (typeof item === 'string') {
          return redactInlinePatterns(item);
        } else if (item && typeof item === 'object') {
          return sanitizeObject(
            item as Record<string, unknown>,
            redactedFields,
            `${fieldPath}[${i}]`
          );
        }
        return item;
      });
    } else {
      result[key] = value;
    }
  }

  return result;
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
export function sanitizeForTrace(input: unknown, summaryTemplate?: string): SanitizedTracePayload {
  const redactedFields: string[] = [];
  let sanitizedData: unknown;

  if (typeof input === 'string') {
    sanitizedData = redactInlinePatterns(input);
  } else if (input && typeof input === 'object') {
    sanitizedData = sanitizeObject(input as Record<string, unknown>, redactedFields, '');
  } else {
    sanitizedData = input;
  }

  const summary = summaryTemplate
    ? summaryTemplate
    : typeof sanitizedData === 'string'
      ? sanitizedData
      : JSON.stringify(sanitizedData);

  return {
    summary,
    redactedFields: redactedFields.length > 0 ? redactedFields : undefined,
    sanitizedAt: new Date().toISOString(),
  };
}

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
export function createPayloadRef(
  payloadId: string,
  store: 'dossier' | 'secure-blob' | 'case-store',
  summary: string
): SanitizedTracePayload {
  return {
    summary,
    payloadRef: payloadId,
    payloadStore: store,
    sanitizedAt: new Date().toISOString(),
  };
}

export default sanitizeForTrace;

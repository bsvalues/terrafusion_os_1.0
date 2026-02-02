/**
 * Phase 4N42c – Redaction Mode with Proof
 * ========================================
 *
 * Deterministic PII detection and redaction with fail-closed semantics.
 * Generates redaction-proof.json bound into casefile and verification.
 *
 * Invariants:
 *   - PII detected + not redacted → hard fail
 *   - Redaction is deterministic (same input → same output)
 *   - Redaction proof is auditable and bound to casefile
 *   - Original vs redacted digest comparison (where permissible)
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { SensitivityLevel } from './audience-policy.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const REDACTION_PROOF_SCHEMA = 'terrafusion.autonomy.redaction-proof.v1';
export const REDACTION_TOOL_VERSION = '4N42.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PII category classification.
 */
export type PiiCategory =
  | 'SSN' // Social Security Number
  | 'TAX_ID' // Tax identification number
  | 'EMAIL' // Email address
  | 'PHONE' // Phone number
  | 'ADDRESS' // Physical address
  | 'NAME' // Personal name
  | 'PARCEL_OWNER' // Property owner name
  | 'FINANCIAL' // Financial information
  | 'CREDENTIAL' // API keys, passwords, tokens
  | 'OTHER'; // Other sensitive data

/**
 * Redaction reason code for audit trail.
 */
export type RedactionReasonCode =
  | 'PII_DETECTED'
  | 'SENSITIVITY_THRESHOLD'
  | 'POLICY_REQUIRED'
  | 'MANUAL_FLAGGED';

/**
 * Single redaction entry (what was removed/masked).
 */
export interface RedactionEntry {
  /** Artifact path where redaction occurred */
  artifactPath: string;
  /** JSON path or line reference within artifact */
  location: string;
  /** PII category detected */
  piiCategory: PiiCategory;
  /** Sensitivity level */
  sensitivity: SensitivityLevel;
  /** Reason for redaction */
  reason: RedactionReasonCode;
  /** Original value length (not the value itself!) */
  originalLength: number;
  /** Redacted placeholder used */
  placeholder: string;
  /** Hash of original value (for audit, not reversible) */
  originalValueHash: string;
}

/**
 * Redaction proof for a casefile.
 */
export interface RedactionProof {
  /** Schema identifier */
  $schema: typeof REDACTION_PROOF_SCHEMA;
  /** Tool version */
  toolVersion: typeof REDACTION_TOOL_VERSION;
  /** Generation timestamp */
  generatedAt: string;
  /** Record/run identifier */
  recordId: string;
  /** Whether redaction was performed */
  redactionPerformed: boolean;
  /** Number of redactions applied */
  redactionCount: number;
  /** Per-artifact redaction entries */
  entries: RedactionEntry[];
  /** Artifacts with no PII detected */
  cleanArtifacts: string[];
  /** SHA256 of original casefile (before redaction) */
  originalCasefileSha256: string;
  /** SHA256 of redacted casefile (after redaction) */
  redactedCasefileSha256: string;
  /** Deterministic proof: hash of sorted entries for reproducibility */
  entriesDigest: string;
  /** Errors encountered during redaction */
  errors: RedactionError[];
}

/**
 * Redaction error (fail-closed).
 */
export interface RedactionError {
  code: RedactionErrorCode;
  message: string;
  artifact?: string;
  details?: Record<string, unknown>;
}

export type RedactionErrorCode =
  | 'PII_DETECTED_REDACTION_FAILED'
  | 'PATTERN_MATCH_ERROR'
  | 'ARTIFACT_READ_FAILED'
  | 'ARTIFACT_WRITE_FAILED'
  | 'PROOF_GENERATION_FAILED';

// ─────────────────────────────────────────────────────────────────────────────
// PII Detection Patterns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PII pattern definition for detection.
 */
export interface PiiPattern {
  /** Pattern name */
  name: string;
  /** Regular expression for detection */
  regex: RegExp;
  /** PII category */
  category: PiiCategory;
  /** Sensitivity level */
  sensitivity: SensitivityLevel;
  /** Placeholder to use for redaction */
  placeholder: string;
  /** Whether to capture context (for JSON path) */
  captureContext: boolean;
}

/**
 * Default PII patterns for detection.
 */
export const DEFAULT_PII_PATTERNS: PiiPattern[] = [
  // SSN patterns
  {
    name: 'ssn_dashed',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    category: 'SSN',
    sensitivity: 'CRITICAL',
    placeholder: '[REDACTED-SSN]',
    captureContext: true,
  },
  {
    name: 'ssn_plain',
    regex: /\b\d{9}\b/g,
    category: 'SSN',
    sensitivity: 'HIGH',
    placeholder: '[REDACTED-SSN]',
    captureContext: true,
  },
  // Email patterns
  {
    name: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    category: 'EMAIL',
    sensitivity: 'HIGH',
    placeholder: '[REDACTED-EMAIL]',
    captureContext: true,
  },
  // Phone patterns
  {
    name: 'phone_us',
    regex: /\b(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    category: 'PHONE',
    sensitivity: 'MEDIUM',
    placeholder: '[REDACTED-PHONE]',
    captureContext: true,
  },
  // Tax ID patterns
  {
    name: 'ein',
    regex: /\b\d{2}-\d{7}\b/g,
    category: 'TAX_ID',
    sensitivity: 'HIGH',
    placeholder: '[REDACTED-TAX-ID]',
    captureContext: true,
  },
  // Credential patterns
  {
    name: 'api_key',
    regex:
      /\b(?:api[_-]?key|apikey|api_token|auth_token|bearer)\s*[=:]\s*["']?[A-Za-z0-9_\-]{20,}["']?/gi,
    category: 'CREDENTIAL',
    sensitivity: 'CRITICAL',
    placeholder: '[REDACTED-CREDENTIAL]',
    captureContext: true,
  },
  // GitHub token pattern
  {
    name: 'github_token',
    regex: /\bgh[ps]_[A-Za-z0-9]{36,}\b/g,
    category: 'CREDENTIAL',
    sensitivity: 'CRITICAL',
    placeholder: '[REDACTED-GITHUB-TOKEN]',
    captureContext: true,
  },
  // AWS patterns
  {
    name: 'aws_key',
    regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    category: 'CREDENTIAL',
    sensitivity: 'CRITICAL',
    placeholder: '[REDACTED-AWS-KEY]',
    captureContext: true,
  },
];

/**
 * JSON field patterns that indicate PII (by key name).
 */
export const PII_FIELD_PATTERNS: Array<{
  pattern: RegExp;
  category: PiiCategory;
  sensitivity: SensitivityLevel;
}> = [
  {
    pattern: /^(?:ssn|social_security|socialSecurityNumber)$/i,
    category: 'SSN',
    sensitivity: 'CRITICAL',
  },
  { pattern: /^(?:tax_id|taxId|ein|employerId)$/i, category: 'TAX_ID', sensitivity: 'HIGH' },
  { pattern: /^(?:email|emailAddress|e_mail)$/i, category: 'EMAIL', sensitivity: 'HIGH' },
  {
    pattern: /^(?:phone|phoneNumber|telephone|mobile)$/i,
    category: 'PHONE',
    sensitivity: 'MEDIUM',
  },
  {
    pattern: /^(?:address|streetAddress|homeAddress|mailingAddress)$/i,
    category: 'ADDRESS',
    sensitivity: 'MEDIUM',
  },
  {
    pattern: /^(?:name|fullName|firstName|lastName|ownerName|parcelOwner)$/i,
    category: 'NAME',
    sensitivity: 'MEDIUM',
  },
  {
    pattern: /^(?:apiKey|api_key|authToken|auth_token|password|secret)$/i,
    category: 'CREDENTIAL',
    sensitivity: 'CRITICAL',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hash Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SHA256 hash of a value (one-way, for audit).
 */
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Compute deterministic digest of redaction entries.
 * Used to verify reproducibility.
 */
function computeEntriesDigest(entries: RedactionEntry[]): string {
  // Sort entries for determinism
  const sorted = [...entries].sort((a, b) => {
    const pathCmp = a.artifactPath.localeCompare(b.artifactPath);
    if (pathCmp !== 0) return pathCmp;
    return a.location.localeCompare(b.location);
  });

  // Create canonical representation
  const canonical = sorted
    .map(e => `${e.artifactPath}|${e.location}|${e.piiCategory}|${e.originalValueHash}`)
    .join('\n');

  return hashValue(canonical);
}

// ─────────────────────────────────────────────────────────────────────────────
// Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PII detection result.
 */
export interface PiiDetection {
  /** Match start position */
  start: number;
  /** Match end position */
  end: number;
  /** Matched value */
  value: string;
  /** Pattern that matched */
  pattern: PiiPattern;
  /** Location context (line number or JSON path) */
  location: string;
}

/**
 * Detect PII in text content using default patterns.
 */
export function detectPii(
  content: string,
  artifactPath: string,
  patterns: PiiPattern[] = DEFAULT_PII_PATTERNS
): PiiDetection[] {
  const detections: PiiDetection[] = [];

  for (const pattern of patterns) {
    // Reset regex state
    pattern.regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Calculate line number for location
      const lineNumber = content.substring(0, match.index).split('\n').length;

      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        pattern,
        location: `line:${lineNumber}`,
      });
    }
  }

  // Sort by position
  detections.sort((a, b) => a.start - b.start);

  return detections;
}

/**
 * Detect PII in JSON content with field-level detection.
 */
export function detectPiiInJson(
  content: string,
  artifactPath: string,
  patterns: PiiPattern[] = DEFAULT_PII_PATTERNS
): PiiDetection[] {
  const detections: PiiDetection[] = [];

  // First, run text-based detection
  detections.push(...detectPii(content, artifactPath, patterns));

  // Then, parse JSON and check field names
  try {
    const json = JSON.parse(content);
    detectPiiInObject(json, '', detections, artifactPath);
  } catch {
    // Not valid JSON, skip field detection
  }

  return detections;
}

/**
 * Recursively detect PII in JSON object fields.
 */
function detectPiiInObject(
  obj: unknown,
  pathPrefix: string,
  detections: PiiDetection[],
  artifactPath: string
): void {
  if (obj === null || obj === undefined) return;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      detectPiiInObject(item, `${pathPrefix}[${index}]`, detections, artifactPath);
    });
    return;
  }

  if (typeof obj !== 'object') return;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    // Check if field name indicates PII
    for (const fieldPattern of PII_FIELD_PATTERNS) {
      if (fieldPattern.pattern.test(key) && value !== null && value !== undefined) {
        const stringValue = String(value);
        if (stringValue.length > 0 && !stringValue.startsWith('[REDACTED')) {
          detections.push({
            start: -1, // Position not applicable for JSON path detection
            end: -1,
            value: stringValue,
            pattern: {
              name: `field:${key}`,
              regex: fieldPattern.pattern,
              category: fieldPattern.category,
              sensitivity: fieldPattern.sensitivity,
              placeholder: `[REDACTED-${fieldPattern.category}]`,
              captureContext: true,
            },
            location: `json:${currentPath}`,
          });
        }
      }
    }

    // Recurse into nested objects
    if (typeof value === 'object') {
      detectPiiInObject(value, currentPath, detections, artifactPath);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Redaction Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redaction options.
 */
export interface RedactOptions {
  /** Artifact path */
  artifactPath: string;
  /** Original content */
  content: string;
  /** PII patterns to use */
  patterns?: PiiPattern[];
  /** Whether to fail if PII detected but redaction disabled */
  failOnPii?: boolean;
  /** Whether to actually perform redaction (vs dry-run) */
  performRedaction?: boolean;
}

/**
 * Redaction result for a single artifact.
 */
export interface RedactResult {
  /** Whether redaction succeeded */
  ok: boolean;
  /** Redacted content (if performRedaction=true) */
  redactedContent: string;
  /** Detections found */
  detections: PiiDetection[];
  /** Redaction entries (for proof) */
  entries: RedactionEntry[];
  /** Errors encountered */
  errors: RedactionError[];
}

/**
 * Redact PII from content.
 */
export function redactContent(options: RedactOptions): RedactResult {
  const {
    artifactPath,
    content,
    patterns = DEFAULT_PII_PATTERNS,
    failOnPii = true,
    performRedaction = true,
  } = options;

  const errors: RedactionError[] = [];
  const entries: RedactionEntry[] = [];

  // Detect PII
  const isJson = artifactPath.endsWith('.json');
  const detections = isJson
    ? detectPiiInJson(content, artifactPath, patterns)
    : detectPii(content, artifactPath, patterns);

  // If PII detected and redaction disabled, fail
  if (detections.length > 0 && !performRedaction && failOnPii) {
    return {
      ok: false,
      redactedContent: content,
      detections,
      entries: [],
      errors: [
        {
          code: 'PII_DETECTED_REDACTION_FAILED',
          message: `PII detected in ${artifactPath} but redaction not enabled`,
          artifact: artifactPath,
          details: { detectionCount: detections.length },
        },
      ],
    };
  }

  if (!performRedaction || detections.length === 0) {
    return {
      ok: true,
      redactedContent: content,
      detections,
      entries: [],
      errors: [],
    };
  }

  // Perform redaction
  let redactedContent = content;

  // For text-based redaction, replace in reverse order to maintain positions
  const textDetections = detections.filter(d => d.start >= 0).sort((a, b) => b.start - a.start);

  for (const detection of textDetections) {
    const before = redactedContent.substring(0, detection.start);
    const after = redactedContent.substring(detection.end);
    redactedContent = before + detection.pattern.placeholder + after;

    entries.push({
      artifactPath,
      location: detection.location,
      piiCategory: detection.pattern.category,
      sensitivity: detection.pattern.sensitivity,
      reason: 'PII_DETECTED',
      originalLength: detection.value.length,
      placeholder: detection.pattern.placeholder,
      originalValueHash: hashValue(detection.value),
    });
  }

  // For JSON-based redaction, parse and modify
  if (isJson) {
    const jsonDetections = detections.filter(d => d.location.startsWith('json:'));
    if (jsonDetections.length > 0) {
      try {
        const jsonObj = JSON.parse(redactedContent);

        for (const detection of jsonDetections) {
          const jsonPath = detection.location.replace('json:', '');
          redactJsonPath(jsonObj, jsonPath, detection.pattern.placeholder);

          entries.push({
            artifactPath,
            location: detection.location,
            piiCategory: detection.pattern.category,
            sensitivity: detection.pattern.sensitivity,
            reason: 'PII_DETECTED',
            originalLength: detection.value.length,
            placeholder: detection.pattern.placeholder,
            originalValueHash: hashValue(detection.value),
          });
        }

        redactedContent = JSON.stringify(jsonObj, null, 2);
      } catch (e) {
        errors.push({
          code: 'PATTERN_MATCH_ERROR',
          message: `Failed to redact JSON: ${e}`,
          artifact: artifactPath,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    redactedContent,
    detections,
    entries,
    errors,
  };
}

/**
 * Set a value at a JSON path to a placeholder.
 */
function redactJsonPath(obj: Record<string, unknown>, jsonPath: string, placeholder: string): void {
  const parts = jsonPath.split('.').flatMap(p => {
    // Handle array notation
    const arrayMatch = p.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      return [arrayMatch[1], parseInt(arrayMatch[2], 10)];
    }
    return p;
  });

  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current === null || current === undefined) return;
    if (typeof current === 'object') {
      current = (current as Record<string | number, unknown>)[part as string | number];
    }
  }

  if (current !== null && current !== undefined && typeof current === 'object') {
    const lastPart = parts[parts.length - 1];
    (current as Record<string | number, unknown>)[lastPart as string | number] = placeholder;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for generating redaction proof.
 */
export interface GenerateProofOptions {
  /** Record/run identifier */
  recordId: string;
  /** Artifacts to process */
  artifacts: Array<{ path: string; content: string }>;
  /** Original casefile SHA256 (before redaction) */
  originalCasefileSha256: string;
  /** PII patterns to use */
  patterns?: PiiPattern[];
  /** Whether to perform redaction (vs dry-run) */
  performRedaction?: boolean;
}

/**
 * Result of proof generation.
 */
export interface GenerateProofResult {
  /** Whether generation succeeded */
  ok: boolean;
  /** Redaction proof */
  proof: RedactionProof;
  /** Redacted artifacts */
  redactedArtifacts: Array<{ path: string; content: string }>;
  /** SHA256 of redacted casefile */
  redactedCasefileSha256: string;
}

/**
 * Generate redaction proof for a set of artifacts.
 */
export function generateRedactionProof(options: GenerateProofOptions): GenerateProofResult {
  const {
    recordId,
    artifacts,
    originalCasefileSha256,
    patterns = DEFAULT_PII_PATTERNS,
    performRedaction = true,
  } = options;

  const allEntries: RedactionEntry[] = [];
  const allErrors: RedactionError[] = [];
  const cleanArtifacts: string[] = [];
  const redactedArtifacts: Array<{ path: string; content: string }> = [];

  for (const artifact of artifacts) {
    const result = redactContent({
      artifactPath: artifact.path,
      content: artifact.content,
      patterns,
      performRedaction,
      failOnPii: true,
    });

    allEntries.push(...result.entries);
    allErrors.push(...result.errors);

    if (result.detections.length === 0) {
      cleanArtifacts.push(artifact.path);
    }

    redactedArtifacts.push({
      path: artifact.path,
      content: result.redactedContent,
    });
  }

  // Compute redacted casefile SHA256
  const redactedConcatenated = redactedArtifacts
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(a => a.content)
    .join('\n');
  const redactedCasefileSha256 = hashValue(redactedConcatenated);

  const proof: RedactionProof = {
    $schema: REDACTION_PROOF_SCHEMA,
    toolVersion: REDACTION_TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    recordId,
    redactionPerformed: allEntries.length > 0,
    redactionCount: allEntries.length,
    entries: allEntries,
    cleanArtifacts,
    originalCasefileSha256,
    redactedCasefileSha256,
    entriesDigest: computeEntriesDigest(allEntries),
    errors: allErrors,
  };

  return {
    ok: allErrors.length === 0,
    proof,
    redactedArtifacts,
    redactedCasefileSha256,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a redaction proof is valid and deterministic.
 */
export function verifyRedactionProof(proof: RedactionProof): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify schema
  if (proof.$schema !== REDACTION_PROOF_SCHEMA) {
    errors.push(`Schema mismatch: expected ${REDACTION_PROOF_SCHEMA}, got ${proof.$schema}`);
  }

  // Verify entries digest
  const expectedDigest = computeEntriesDigest(proof.entries);
  if (proof.entriesDigest !== expectedDigest) {
    errors.push(`Entries digest mismatch: expected ${expectedDigest}, got ${proof.entriesDigest}`);
  }

  // Verify count consistency
  if (proof.redactionCount !== proof.entries.length) {
    errors.push(
      `Redaction count mismatch: count=${proof.redactionCount}, entries=${proof.entries.length}`
    );
  }

  // Verify redactionPerformed flag
  if (proof.redactionPerformed !== proof.entries.length > 0) {
    errors.push(`redactionPerformed flag inconsistent with entry count`);
  }

  // Verify no proof errors
  if (proof.errors.length > 0) {
    errors.push(`Proof contains ${proof.errors.length} error(s)`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Check if redaction is deterministic by comparing two proofs.
 */
export function isRedactionDeterministic(proof1: RedactionProof, proof2: RedactionProof): boolean {
  // Compare entries digest (should be identical for same inputs)
  return proof1.entriesDigest === proof2.entriesDigest;
}

// ─────────────────────────────────────────────────────────────────────────────
// File Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save redaction proof to file.
 */
export function saveRedactionProof(proof: RedactionProof, proofPath: string): void {
  const dir = path.dirname(proofPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
}

/**
 * Load redaction proof from file.
 */
export function loadRedactionProof(proofPath: string): RedactionProof | null {
  if (!fs.existsSync(proofPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(proofPath, 'utf-8');
    return JSON.parse(content) as RedactionProof;
  } catch {
    return null;
  }
}

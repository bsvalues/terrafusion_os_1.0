/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.pii-protection.contract.test.ts
 *
 * Tests PII protection enforcement for the executive oversight portal,
 * ensuring no personally identifiable information is exposed through
 * portal views, exports, or drilldown paths.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - No raw names, emails, SSNs, or other PII in outputs
 * - All user references use opaque identifiers
 * - Audit trails are anonymized for export
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type OpaqueId = `sha256:${string}`;
type SanitizedField = string & { readonly __brand: 'sanitized' };

type PiiType = 'name' | 'email' | 'phone' | 'ssn' | 'address' | 'dob' | 'ip_address' | 'credential';

// PII Detection Patterns
interface PiiPattern {
  readonly type: PiiType;
  readonly pattern: RegExp;
  readonly severity: 'critical' | 'high' | 'medium';
}

interface SanitizationRule {
  readonly type: PiiType;
  readonly replacement: string;
  readonly preserveFormat: boolean;
}

interface PiiScanResult {
  readonly clean: boolean;
  readonly findings: readonly {
    readonly type: PiiType;
    readonly field: string;
    readonly severity: 'critical' | 'high' | 'medium';
  }[];
  readonly scannedFields: number;
}

interface SanitizedRecord {
  readonly id: OpaqueId;
  readonly displayLabel: string;
  readonly metadata: Record<string, SanitizedField>;
  readonly sanitizedAt: string;
}

interface ExportAuditRecord {
  readonly id: OpaqueId;
  readonly exportedBy: OpaqueId;
  readonly exportedAt: string;
  readonly recordCount: number;
  readonly piiScanPassed: boolean;
  readonly sanitizationApplied: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockPiiProtectionService() {
  const piiPatterns: PiiPattern[] = [
    { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, severity: 'high' },
    { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/, severity: 'critical' },
    { type: 'phone', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, severity: 'high' },
    {
      type: 'name',
      pattern: /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/,
      severity: 'medium',
    },
    { type: 'ip_address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, severity: 'medium' },
    { type: 'dob', pattern: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/, severity: 'high' },
    { type: 'credential', pattern: /password\s*[:=]\s*\S+/i, severity: 'critical' },
    {
      type: 'address',
      pattern: /\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/i,
      severity: 'medium',
    },
  ];

  const sanitizationRules: Map<PiiType, SanitizationRule> = new Map([
    ['email', { type: 'email', replacement: '[EMAIL_REDACTED]', preserveFormat: false }],
    ['ssn', { type: 'ssn', replacement: 'XXX-XX-XXXX', preserveFormat: true }],
    ['phone', { type: 'phone', replacement: 'XXX-XXX-XXXX', preserveFormat: true }],
    ['name', { type: 'name', replacement: '[NAME_REDACTED]', preserveFormat: false }],
    ['ip_address', { type: 'ip_address', replacement: 'X.X.X.X', preserveFormat: true }],
    ['dob', { type: 'dob', replacement: 'XX/XX/XXXX', preserveFormat: true }],
    [
      'credential',
      { type: 'credential', replacement: '[CREDENTIAL_REDACTED]', preserveFormat: false },
    ],
    ['address', { type: 'address', replacement: '[ADDRESS_REDACTED]', preserveFormat: false }],
  ]);

  const exportAuditLog: ExportAuditRecord[] = [];

  function generateId(prefix: string): OpaqueId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as OpaqueId;
  }

  function scanValue(value: string): { type: PiiType; severity: 'critical' | 'high' | 'medium' }[] {
    const findings: { type: PiiType; severity: 'critical' | 'high' | 'medium' }[] = [];
    for (const pattern of piiPatterns) {
      if (pattern.pattern.test(value)) {
        findings.push({ type: pattern.type, severity: pattern.severity });
      }
    }
    return findings;
  }

  function sanitizeValue(value: string): string {
    let result = value;
    for (const pattern of piiPatterns) {
      const rule = sanitizationRules.get(pattern.type);
      if (rule) {
        result = result.replace(pattern.pattern, rule.replacement);
      }
    }
    return result;
  }

  return {
    // PII Scanning
    scanForPii(data: Record<string, unknown>): PiiScanResult {
      const findings: { type: PiiType; field: string; severity: 'critical' | 'high' | 'medium' }[] =
        [];
      let scannedFields = 0;

      function scanObject(obj: Record<string, unknown>, prefix: string): void {
        for (const [key, value] of Object.entries(obj)) {
          const fieldPath = prefix ? `${prefix}.${key}` : key;

          if (typeof value === 'string') {
            scannedFields++;
            const fieldFindings = scanValue(value);
            for (const finding of fieldFindings) {
              findings.push({ ...finding, field: fieldPath });
            }
          } else if (typeof value === 'object' && value !== null) {
            scanObject(value as Record<string, unknown>, fieldPath);
          }
        }
      }

      scanObject(data, '');

      return {
        clean: findings.length === 0,
        findings,
        scannedFields,
      };
    },

    // ID Validation
    isOpaqueId(value: string): boolean {
      return /^sha256:[a-zA-Z0-9_]+$/.test(value);
    },

    validateAllIdsOpaque(data: Record<string, unknown>): {
      valid: boolean;
      invalidFields: string[];
    } {
      const invalidFields: string[] = [];

      function checkObject(obj: Record<string, unknown>, prefix: string): void {
        for (const [key, value] of Object.entries(obj)) {
          const fieldPath = prefix ? `${prefix}.${key}` : key;

          if (key.toLowerCase().includes('id') && typeof value === 'string') {
            if (!value.startsWith('sha256:')) {
              invalidFields.push(fieldPath);
            }
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkObject(value as Record<string, unknown>, fieldPath);
          }
        }
      }

      checkObject(data, '');

      return { valid: invalidFields.length === 0, invalidFields };
    },

    // Sanitization
    sanitizeRecord(data: Record<string, unknown>): SanitizedRecord {
      const sanitizedMetadata: Record<string, SanitizedField> = {};

      function processObject(obj: Record<string, unknown>): void {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitizedMetadata[key] = sanitizeValue(value) as SanitizedField;
          } else if (typeof value === 'object' && value !== null) {
            processObject(value as Record<string, unknown>);
          }
        }
      }

      processObject(data);

      return {
        id: generateId('sanitized'),
        displayLabel: 'Sanitized Record',
        metadata: sanitizedMetadata,
        sanitizedAt: new Date().toISOString(),
      };
    },

    // Export with PII Protection
    exportWithProtection(
      exporterId: OpaqueId,
      records: readonly Record<string, unknown>[]
    ): { success: boolean; exportRef: OpaqueId; sanitizedRecords: readonly SanitizedRecord[] } {
      const sanitizedRecords: SanitizedRecord[] = [];
      let allClean = true;

      for (const record of records) {
        const scanResult = this.scanForPii(record);
        if (!scanResult.clean) {
          allClean = false;
        }
        sanitizedRecords.push(this.sanitizeRecord(record));
      }

      const exportRef = generateId('export');
      exportAuditLog.push({
        id: exportRef,
        exportedBy: exporterId,
        exportedAt: new Date().toISOString(),
        recordCount: records.length,
        piiScanPassed: allClean,
        sanitizationApplied: !allClean,
      });

      return { success: true, exportRef, sanitizedRecords };
    },

    // Export Audit
    getExportAuditLog(): readonly ExportAuditRecord[] {
      return [...exportAuditLog];
    },

    // Pattern Management
    addPiiPattern(pattern: PiiPattern): void {
      piiPatterns.push(pattern);
    },

    getPiiPatterns(): readonly PiiPattern[] {
      return [...piiPatterns];
    },

    // Specific Field Checks
    containsEmail(value: string): boolean {
      return piiPatterns.find(p => p.type === 'email')?.pattern.test(value) ?? false;
    },

    containsSsn(value: string): boolean {
      return piiPatterns.find(p => p.type === 'ssn')?.pattern.test(value) ?? false;
    },

    containsPhone(value: string): boolean {
      return piiPatterns.find(p => p.type === 'phone')?.pattern.test(value) ?? false;
    },

    containsCredential(value: string): boolean {
      return piiPatterns.find(p => p.type === 'credential')?.pattern.test(value) ?? false;
    },

    // Anonymization for Aggregate Data
    anonymizeUserId(userId: OpaqueId): OpaqueId {
      // Generate consistent but untraceable ID
      const anonHash = Math.random().toString(36).slice(2);
      return `sha256:anon_${anonHash}` as OpaqueId;
    },

    // Compliance Check
    checkPortalOutputCompliance(output: Record<string, unknown>): {
      compliant: boolean;
      violations: string[];
    } {
      const violations: string[] = [];

      // Check for PII
      const piiResult = this.scanForPii(output);
      if (!piiResult.clean) {
        for (const finding of piiResult.findings) {
          violations.push(`PII detected: ${finding.type} in field ${finding.field}`);
        }
      }

      // Check for opaque IDs
      const idResult = this.validateAllIdsOpaque(output);
      if (!idResult.valid) {
        for (const field of idResult.invalidFields) {
          violations.push(`Non-opaque ID in field: ${field}`);
        }
      }

      return {
        compliant: violations.length === 0,
        violations,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal PII Protection Contracts', () => {
  let piiService: ReturnType<typeof createMockPiiProtectionService>;

  beforeEach(() => {
    piiService = createMockPiiProtectionService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('Opaque ID Invariants', () => {
    it('should validate sha256: prefixed IDs', () => {
      assert.strictEqual(piiService.isOpaqueId('sha256:abc123'), true);
      assert.strictEqual(piiService.isOpaqueId('sha256:user_test_1'), true);
    });

    it('should reject non-opaque IDs', () => {
      assert.strictEqual(piiService.isOpaqueId('user-123'), false);
      assert.strictEqual(piiService.isOpaqueId('12345'), false);
      assert.strictEqual(piiService.isOpaqueId('john.doe@example.com'), false);
    });

    it('should detect non-opaque IDs in objects', () => {
      const data = {
        id: 'sha256:valid_id',
        userId: 'plain-user-id', // Invalid
        nested: {
          agencyId: 'agency-123', // Invalid
        },
      };

      const result = piiService.validateAllIdsOpaque(data);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.invalidFields.length, 2);
    });

    it('should pass for all opaque IDs', () => {
      const data = {
        id: 'sha256:test_1',
        userId: 'sha256:user_1',
        nested: {
          agencyId: 'sha256:agency_1',
        },
      };

      const result = piiService.validateAllIdsOpaque(data);
      assert.strictEqual(result.valid, true);
    });
  });

  // ==========================================================================
  // PII Detection Tests
  // ==========================================================================

  describe('PII Detection', () => {
    it('should detect email addresses', () => {
      const data = { contact: 'john.doe@example.com' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'email'));
    });

    it('should detect SSN patterns', () => {
      const data = { taxpayerId: '123-45-6789' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'ssn'));
    });

    it('should detect phone numbers', () => {
      const data = { phone: '555-123-4567' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'phone'));
    });

    it('should detect credentials', () => {
      const data = { config: 'password: secret123' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'credential'));
    });

    it('should detect IP addresses', () => {
      const data = { sourceIp: '192.168.1.100' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'ip_address'));
    });

    it('should detect date of birth', () => {
      const data = { dob: '12/25/1990' };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.type === 'dob'));
    });

    it('should pass for clean data', () => {
      const data = {
        id: 'sha256:test_1',
        status: 'active',
        count: 42,
      };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, true);
    });

    it('should scan nested objects', () => {
      const data = {
        user: {
          profile: {
            email: 'test@example.com',
          },
        },
      };
      const result = piiService.scanForPii(data);

      assert.strictEqual(result.clean, false);
      assert.ok(result.findings.some(f => f.field === 'user.profile.email'));
    });

    it('should report severity levels', () => {
      const data = { ssn: '123-45-6789' };
      const result = piiService.scanForPii(data);

      assert.ok(result.findings.some(f => f.severity === 'critical'));
    });
  });

  // ==========================================================================
  // Specific Field Check Tests
  // ==========================================================================

  describe('Specific Field Checks', () => {
    it('should detect emails', () => {
      assert.strictEqual(piiService.containsEmail('test@example.com'), true);
      assert.strictEqual(piiService.containsEmail('sha256:user_1'), false);
    });

    it('should detect SSNs', () => {
      assert.strictEqual(piiService.containsSsn('123-45-6789'), true);
      assert.strictEqual(piiService.containsSsn('sha256:ref_1'), false);
    });

    it('should detect phone numbers', () => {
      assert.strictEqual(piiService.containsPhone('555-123-4567'), true);
      assert.strictEqual(piiService.containsPhone('reference-code'), false);
    });

    it('should detect credentials', () => {
      assert.strictEqual(piiService.containsCredential('password=secret'), true);
      assert.strictEqual(piiService.containsCredential('regular text'), false);
    });
  });

  // ==========================================================================
  // Sanitization Tests
  // ==========================================================================

  describe('Sanitization', () => {
    it('should sanitize email addresses', () => {
      const data = { email: 'john@example.com' };
      const sanitized = piiService.sanitizeRecord(data);

      assert.strictEqual(sanitized.metadata.email, '[EMAIL_REDACTED]');
    });

    it('should sanitize SSN', () => {
      const data = { ssn: '123-45-6789' };
      const sanitized = piiService.sanitizeRecord(data);

      assert.strictEqual(sanitized.metadata.ssn, 'XXX-XX-XXXX');
    });

    it('should sanitize phone numbers', () => {
      const data = { phone: '555.123.4567' };
      const sanitized = piiService.sanitizeRecord(data);

      assert.strictEqual(sanitized.metadata.phone, 'XXX-XXX-XXXX');
    });

    it('should generate opaque ID for sanitized record', () => {
      const data = { field: 'value' };
      const sanitized = piiService.sanitizeRecord(data);

      assert.ok(sanitized.id.startsWith('sha256:'));
    });

    it('should record sanitization timestamp', () => {
      const data = { field: 'value' };
      const sanitized = piiService.sanitizeRecord(data);

      assert.ok(sanitized.sanitizedAt);
    });
  });

  // ==========================================================================
  // Export Protection Tests
  // ==========================================================================

  describe('Export Protection', () => {
    it('should sanitize records on export', () => {
      const exporterId = 'sha256:exporter_1' as OpaqueId;
      const records = [{ email: 'test@example.com', name: 'John Doe' }, { phone: '555-123-4567' }];

      const result = piiService.exportWithProtection(exporterId, records);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sanitizedRecords.length, 2);
    });

    it('should generate export reference', () => {
      const exporterId = 'sha256:exporter_1' as OpaqueId;
      const records = [{ data: 'clean' }];

      const result = piiService.exportWithProtection(exporterId, records);

      assert.ok(result.exportRef.startsWith('sha256:'));
    });

    it('should log export audit', () => {
      const exporterId = 'sha256:exporter_1' as OpaqueId;
      const records = [{ email: 'test@test.com' }];

      piiService.exportWithProtection(exporterId, records);
      const auditLog = piiService.getExportAuditLog();

      assert.strictEqual(auditLog.length, 1);
      assert.strictEqual(auditLog[0].exportedBy, exporterId);
    });

    it('should track if sanitization was applied', () => {
      const exporterId = 'sha256:exporter_1' as OpaqueId;
      const dirtyRecords = [{ ssn: '123-45-6789' }];
      const cleanRecords = [{ status: 'active' }];

      const dirtyResult = piiService.exportWithProtection(exporterId, dirtyRecords);
      const cleanResult = piiService.exportWithProtection(exporterId, cleanRecords);

      const auditLog = piiService.getExportAuditLog();
      assert.strictEqual(auditLog[0].sanitizationApplied, true);
      assert.strictEqual(auditLog[1].sanitizationApplied, false);
    });
  });

  // ==========================================================================
  // Anonymization Tests
  // ==========================================================================

  describe('Anonymization', () => {
    it('should anonymize user IDs', () => {
      const userId = 'sha256:user_original_1' as OpaqueId;
      const anonId = piiService.anonymizeUserId(userId);

      assert.ok(anonId.startsWith('sha256:anon_'));
      assert.notStrictEqual(anonId, userId);
    });

    it('should generate different anon IDs each time', () => {
      const userId = 'sha256:user_1' as OpaqueId;
      const anon1 = piiService.anonymizeUserId(userId);
      const anon2 = piiService.anonymizeUserId(userId);

      // Each anonymization should produce different output
      assert.notStrictEqual(anon1, anon2);
    });
  });

  // ==========================================================================
  // Portal Output Compliance Tests
  // ==========================================================================

  describe('Portal Output Compliance', () => {
    it('should pass for compliant output', () => {
      const output = {
        id: 'sha256:service_1',
        userId: 'sha256:user_1',
        status: 'healthy',
        metrics: { uptime: 99.9 },
      };

      const result = piiService.checkPortalOutputCompliance(output);

      assert.strictEqual(result.compliant, true);
      assert.strictEqual(result.violations.length, 0);
    });

    it('should fail for PII in output', () => {
      const output = {
        id: 'sha256:record_1',
        ownerEmail: 'owner@example.com',
      };

      const result = piiService.checkPortalOutputCompliance(output);

      assert.strictEqual(result.compliant, false);
      assert.ok(result.violations.some(v => v.includes('email')));
    });

    it('should fail for non-opaque IDs', () => {
      const output = {
        id: 'sha256:record_1',
        userId: 'plain-user-123',
      };

      const result = piiService.checkPortalOutputCompliance(output);

      assert.strictEqual(result.compliant, false);
      assert.ok(result.violations.some(v => v.includes('Non-opaque ID')));
    });

    it('should report multiple violations', () => {
      const output = {
        id: 'plain-id',
        contact: 'test@test.com',
        ssn: '123-45-6789',
      };

      const result = piiService.checkPortalOutputCompliance(output);

      assert.strictEqual(result.compliant, false);
      assert.ok(result.violations.length >= 3);
    });
  });

  // ==========================================================================
  // Pattern Management Tests
  // ==========================================================================

  describe('Pattern Management', () => {
    it('should list default patterns', () => {
      const patterns = piiService.getPiiPatterns();

      assert.ok(patterns.length > 0);
      assert.ok(patterns.some(p => p.type === 'email'));
      assert.ok(patterns.some(p => p.type === 'ssn'));
    });

    it('should add custom patterns', () => {
      const customPattern = {
        type: 'custom_id' as PiiType,
        pattern: /CUST-\d{6}/,
        severity: 'high' as const,
      };

      piiService.addPiiPattern(customPattern);
      const patterns = piiService.getPiiPatterns();

      assert.ok(patterns.some(p => p.type === 'custom_id'));
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should return copies of patterns', () => {
      const patterns1 = piiService.getPiiPatterns();
      const patterns2 = piiService.getPiiPatterns();

      assert.notStrictEqual(patterns1, patterns2);
    });

    it('should return copies of export audit log', () => {
      const exporterId = 'sha256:exporter_1' as OpaqueId;
      piiService.exportWithProtection(exporterId, [{ data: 'test' }]);

      const log1 = piiService.getExportAuditLog();
      const log2 = piiService.getExportAuditLog();

      assert.notStrictEqual(log1, log2);
    });
  });
});

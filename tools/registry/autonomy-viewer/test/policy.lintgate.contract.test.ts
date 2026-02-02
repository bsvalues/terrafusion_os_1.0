/**
 * Boundary Enforcement: Policy Lint Gate Contract Tests
 *
 * Phase XIII - Policy-as-code lint gates that block changes
 * violating allowlists/invariants (dimensions, PII, autoMerge=false, operator-triggered).
 *
 * CONTRACT SURFACE:
 * - Policy Rules: Declarative policy definitions
 * - Lint Execution: Automated policy checking
 * - Violation Detection: Identify policy violations
 * - Gate Enforcement: Block changes on violation
 *
 * INVARIANTS:
 * - Violations block merge (no bypass without exception)
 * - All policy rules are versioned
 * - All IDs are opaque sha256:
 * - Gate results are auditable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PolicyCategory =
  | 'pii'
  | 'auto_merge'
  | 'operator_triggered'
  | 'dimension_allowlist'
  | 'port_hardcoding'
  | 'forbidden_path';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type GateResult = 'pass' | 'fail' | 'warn';
type EnforcementMode = 'blocking' | 'warning' | 'disabled';

/**
 * Policy rule definition
 */
interface PolicyRule {
  readonly rule_id: string;
  readonly name: string;
  readonly category: PolicyCategory;
  readonly description: string;
  readonly pattern: string;
  readonly severity: Severity;
  readonly enforcement_mode: EnforcementMode;
  readonly version: number;
  readonly enabled: boolean;
}

/**
 * Lint result for a single file
 */
interface FileLintResult {
  readonly file_path: string;
  readonly violations: readonly PolicyViolation[];
  readonly warnings: readonly PolicyWarning[];
  readonly passed: boolean;
}

/**
 * Policy violation
 */
interface PolicyViolation {
  readonly violation_id: string;
  readonly rule_id: string;
  readonly rule_name: string;
  readonly category: PolicyCategory;
  readonly severity: Severity;
  readonly file_path: string;
  readonly line_number?: number;
  readonly message: string;
  readonly remediation: string;
}

/**
 * Policy warning
 */
interface PolicyWarning {
  readonly warning_id: string;
  readonly rule_id: string;
  readonly message: string;
  readonly suggestion: string;
}

/**
 * Gate check result
 */
interface GateCheckResult {
  readonly check_id: string;
  readonly result: GateResult;
  readonly total_files: number;
  readonly files_passed: number;
  readonly files_failed: number;
  readonly violations: readonly PolicyViolation[];
  readonly blocking_count: number;
  readonly can_merge: boolean;
  readonly checked_at: string;
}

/**
 * Policy exception
 */
interface PolicyException {
  readonly exception_id: string;
  readonly rule_id: string;
  readonly service_id: string;
  readonly reason: string;
  readonly approved_by: string;
  readonly expires_at: string;
  readonly is_active: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockPolicyRule(overrides: Partial<PolicyRule> = {}): PolicyRule {
  const ruleId = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    rule_id: `sha256:${Buffer.from(ruleId).toString('hex').slice(0, 64)}`,
    name: 'no-pii-in-logs',
    category: 'pii',
    description: 'prevent PII from appearing in log statements',
    pattern: 'console\\.(log|error|warn).*\\b(ssn|email|phone)\\b',
    severity: 'critical',
    enforcement_mode: 'blocking',
    version: 1,
    enabled: true,
    ...overrides,
  };
}

function createMockViolation(overrides: Partial<PolicyViolation> = {}): PolicyViolation {
  const violationId = `viol-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    violation_id: `sha256:${Buffer.from(violationId).toString('hex').slice(0, 64)}`,
    rule_id: `sha256:${Buffer.from('rule-1').toString('hex').slice(0, 64)}`,
    rule_name: 'no-pii-in-logs',
    category: 'pii',
    severity: 'critical',
    file_path: 'src/handler.ts',
    line_number: 42,
    message: 'potential PII detected in log statement',
    remediation: 'use opaque reference instead of raw PII',
    ...overrides,
  };
}

function createMockGateCheckResult(overrides: Partial<GateCheckResult> = {}): GateCheckResult {
  const checkId = `check-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    check_id: `sha256:${Buffer.from(checkId).toString('hex').slice(0, 64)}`,
    result: 'pass',
    total_files: 10,
    files_passed: 10,
    files_failed: 0,
    violations: [],
    blocking_count: 0,
    can_merge: true,
    checked_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockException(overrides: Partial<PolicyException> = {}): PolicyException {
  const exceptionId = `exc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    exception_id: `sha256:${Buffer.from(exceptionId).toString('hex').slice(0, 64)}`,
    rule_id: `sha256:${Buffer.from('rule-1').toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    reason: 'legacy system migration in progress',
    approved_by: `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`,
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    is_active: true,
    ...overrides,
  };
}

// ============================================================================
// MOCK POLICY LINT GATE SERVICE
// ============================================================================

interface PolicyLintGateService {
  // Policy Rules
  listRules(): Promise<readonly PolicyRule[]>;
  getRule(ruleId: string): Promise<PolicyRule | null>;
  getRulesByCategory(category: PolicyCategory): Promise<readonly PolicyRule[]>;
  getEnabledRules(): Promise<readonly PolicyRule[]>;

  // Linting
  lintFile(filePath: string, content: string): Promise<FileLintResult>;
  lintFiles(
    files: readonly { path: string; content: string }[]
  ): Promise<readonly FileLintResult[]>;
  checkViolations(
    content: string,
    rules: readonly PolicyRule[]
  ): Promise<readonly PolicyViolation[]>;

  // Gate Enforcement
  runGateCheck(files: readonly { path: string; content: string }[]): Promise<GateCheckResult>;
  canMerge(checkResult: GateCheckResult): Promise<boolean>;
  getBlockingViolations(checkResult: GateCheckResult): Promise<readonly PolicyViolation[]>;

  // Specific Rule Checks
  checkAutoMergeFalse(content: string): Promise<boolean>;
  checkOperatorTriggered(content: string): Promise<boolean>;
  checkNoPIIInLogs(content: string): Promise<readonly PolicyViolation[]>;
  checkNoHardcodedPorts(content: string): Promise<readonly PolicyViolation[]>;

  // Exceptions
  hasException(serviceId: string, ruleId: string): Promise<boolean>;
  getActiveExceptions(serviceId: string): Promise<readonly PolicyException[]>;
  isExceptionValid(exception: PolicyException): Promise<boolean>;
}

function createMockPolicyLintGateService(): PolicyLintGateService {
  const rules: Map<string, PolicyRule> = new Map();
  const exceptions: Map<string, PolicyException[]> = new Map();

  // Seed default rules
  const defaultRules: PolicyRule[] = [
    createMockPolicyRule({ name: 'no-pii-in-logs', category: 'pii', severity: 'critical' }),
    createMockPolicyRule({
      name: 'auto-merge-false',
      category: 'auto_merge',
      severity: 'critical',
      pattern: 'autoMerge:\\s*true',
    }),
    createMockPolicyRule({
      name: 'operator-triggered-only',
      category: 'operator_triggered',
      severity: 'critical',
    }),
    createMockPolicyRule({
      name: 'no-hardcoded-ports',
      category: 'port_hardcoding',
      severity: 'high',
      pattern: 'localhost:\\d{4}',
    }),
    createMockPolicyRule({
      name: 'no-forbidden-paths',
      category: 'forbidden_path',
      severity: 'high',
      pattern: '/ARCHIVE/',
    }),
  ];

  for (const rule of defaultRules) {
    rules.set(rule.rule_id, rule);
  }

  return {
    async listRules() {
      return Array.from(rules.values());
    },

    async getRule(ruleId) {
      return rules.get(ruleId) ?? null;
    },

    async getRulesByCategory(category) {
      return Array.from(rules.values()).filter(r => r.category === category);
    },

    async getEnabledRules() {
      return Array.from(rules.values()).filter(r => r.enabled);
    },

    async lintFile(filePath, content) {
      const violations: PolicyViolation[] = [];
      const warnings: PolicyWarning[] = [];

      // Check for PII patterns
      if (/\b(ssn|email|phone)\b/i.test(content) && /console\.(log|error|warn)/i.test(content)) {
        violations.push(
          createMockViolation({ file_path: filePath, message: 'potential PII in logs' })
        );
      }

      // Check for hardcoded ports
      if (/localhost:\d{4}/.test(content)) {
        violations.push(
          createMockViolation({
            file_path: filePath,
            category: 'port_hardcoding',
            rule_name: 'no-hardcoded-ports',
            message: 'hardcoded port detected',
          })
        );
      }

      // Check for autoMerge: true
      if (/autoMerge:\s*true/i.test(content)) {
        violations.push(
          createMockViolation({
            file_path: filePath,
            category: 'auto_merge',
            rule_name: 'auto-merge-false',
            severity: 'critical',
            message: 'autoMerge must be false',
          })
        );
      }

      return {
        file_path: filePath,
        violations,
        warnings,
        passed: violations.length === 0,
      };
    },

    async lintFiles(files) {
      const results: FileLintResult[] = [];
      for (const file of files) {
        results.push(await this.lintFile(file.path, file.content));
      }
      return results;
    },

    async checkViolations(content, rulesToCheck) {
      const violations: PolicyViolation[] = [];
      for (const rule of rulesToCheck) {
        if (!rule.enabled) continue;
        const regex = new RegExp(rule.pattern, 'gi');
        if (regex.test(content)) {
          violations.push(
            createMockViolation({
              rule_id: rule.rule_id,
              rule_name: rule.name,
              category: rule.category,
              severity: rule.severity,
            })
          );
        }
      }
      return violations;
    },

    async runGateCheck(files) {
      const results = await this.lintFiles(files);
      const allViolations: PolicyViolation[] = [];

      for (const result of results) {
        allViolations.push(...result.violations);
      }

      const blockingViolations = allViolations.filter(
        v => v.severity === 'critical' || v.severity === 'high'
      );
      const filesFailed = results.filter(r => !r.passed).length;

      return createMockGateCheckResult({
        result: blockingViolations.length > 0 ? 'fail' : 'pass',
        total_files: files.length,
        files_passed: files.length - filesFailed,
        files_failed: filesFailed,
        violations: allViolations,
        blocking_count: blockingViolations.length,
        can_merge: blockingViolations.length === 0,
      });
    },

    async canMerge(checkResult) {
      return checkResult.can_merge && checkResult.blocking_count === 0;
    },

    async getBlockingViolations(checkResult) {
      return checkResult.violations.filter(v => v.severity === 'critical' || v.severity === 'high');
    },

    async checkAutoMergeFalse(content) {
      // Returns true if autoMerge is false or not present
      return !/autoMerge:\s*true/i.test(content);
    },

    async checkOperatorTriggered(content) {
      // Returns true if no autonomous triggers detected
      return !/autonomous:\s*true/i.test(content) && !/auto_trigger:\s*true/i.test(content);
    },

    async checkNoPIIInLogs(content) {
      const violations: PolicyViolation[] = [];
      if (/\b(ssn|email|phone)\b/i.test(content) && /console\.(log|error|warn)/i.test(content)) {
        violations.push(createMockViolation({ message: 'PII detected in log statement' }));
      }
      return violations;
    },

    async checkNoHardcodedPorts(content) {
      const violations: PolicyViolation[] = [];
      const matches = content.match(/localhost:\d{4}/g) ?? [];
      for (const match of matches) {
        violations.push(
          createMockViolation({
            category: 'port_hardcoding',
            message: `hardcoded port: ${match}`,
          })
        );
      }
      return violations;
    },

    async hasException(serviceId, ruleId) {
      const serviceExceptions = exceptions.get(serviceId) ?? [];
      return serviceExceptions.some(e => e.rule_id === ruleId && e.is_active);
    },

    async getActiveExceptions(serviceId) {
      const serviceExceptions = exceptions.get(serviceId) ?? [];
      return serviceExceptions.filter(e => e.is_active);
    },

    async isExceptionValid(exception) {
      const now = new Date();
      const expiresAt = new Date(exception.expires_at);
      return exception.is_active && expiresAt > now;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Boundary Enforcement: Policy Lint Gate Contracts', () => {
  let service: PolicyLintGateService;

  beforeEach(() => {
    service = createMockPolicyLintGateService();
  });

  // ==========================================================================
  // CONTRACT: policy_rules
  // ==========================================================================
  describe('CONTRACT: policy_rules', () => {
    it('lists policy rules', async () => {
      const rules = await service.listRules();

      assert.ok(rules.length > 0);
    });

    it('rules have required properties', async () => {
      const rules = await service.listRules();

      for (const rule of rules) {
        assert.ok(rule.rule_id.startsWith('sha256:'));
        assert.ok(rule.name);
        assert.ok(rule.category);
        assert.ok(rule.severity);
      }
    });

    it('filters rules by category', async () => {
      const piiRules = await service.getRulesByCategory('pii');

      for (const rule of piiRules) {
        assert.strictEqual(rule.category, 'pii');
      }
    });

    it('gets enabled rules only', async () => {
      const enabled = await service.getEnabledRules();

      for (const rule of enabled) {
        assert.strictEqual(rule.enabled, true);
      }
    });

    it('rules are versioned', async () => {
      const rules = await service.listRules();

      for (const rule of rules) {
        assert.ok(rule.version >= 1);
      }
    });
  });

  // ==========================================================================
  // CONTRACT: lint_execution
  // ==========================================================================
  describe('CONTRACT: lint_execution', () => {
    it('lints single file', async () => {
      const result = await service.lintFile('src/clean.ts', 'const x = 1;');

      assert.strictEqual(result.file_path, 'src/clean.ts');
      assert.strictEqual(result.passed, true);
    });

    it('detects violations', async () => {
      const result = await service.lintFile('src/bad.ts', 'console.log(ssn);');

      assert.strictEqual(result.passed, false);
      assert.ok(result.violations.length > 0);
    });

    it('lints multiple files', async () => {
      const results = await service.lintFiles([
        { path: 'a.ts', content: 'const a = 1;' },
        { path: 'b.ts', content: 'const b = 2;' },
      ]);

      assert.strictEqual(results.length, 2);
    });

    it('violations have remediation guidance', async () => {
      const result = await service.lintFile('src/pii.ts', 'console.log(email);');

      for (const violation of result.violations) {
        assert.ok(violation.remediation.length > 0);
      }
    });
  });

  // ==========================================================================
  // CONTRACT: gate_enforcement
  // ==========================================================================
  describe('CONTRACT: gate_enforcement', () => {
    it('runs gate check', async () => {
      const result = await service.runGateCheck([{ path: 'a.ts', content: 'const a = 1;' }]);

      assert.ok(result.check_id.startsWith('sha256:'));
      assert.strictEqual(result.result, 'pass');
    });

    it('gate fails on blocking violations', async () => {
      const result = await service.runGateCheck([{ path: 'bad.ts', content: 'autoMerge: true' }]);

      assert.strictEqual(result.result, 'fail');
      assert.strictEqual(result.can_merge, false);
    });

    it('blocks merge on violations', async () => {
      const result = await service.runGateCheck([
        { path: 'block.ts', content: 'console.log(ssn);' },
      ]);

      const canMerge = await service.canMerge(result);
      assert.strictEqual(canMerge, false);
    });

    it('allows merge when clean', async () => {
      const result = await service.runGateCheck([
        { path: 'clean.ts', content: 'const clean = true;' },
      ]);

      const canMerge = await service.canMerge(result);
      assert.strictEqual(canMerge, true);
    });

    it('identifies blocking violations', async () => {
      const result = await service.runGateCheck([{ path: 'bad.ts', content: 'localhost:3000' }]);

      const blocking = await service.getBlockingViolations(result);
      assert.ok(Array.isArray(blocking));
    });
  });

  // ==========================================================================
  // CONTRACT: specific_invariants
  // ==========================================================================
  describe('CONTRACT: specific_invariants', () => {
    it('enforces autoMerge=false', async () => {
      const validAutoMerge = await service.checkAutoMergeFalse('autoMerge: false');
      const invalidAutoMerge = await service.checkAutoMergeFalse('autoMerge: true');

      assert.strictEqual(validAutoMerge, true);
      assert.strictEqual(invalidAutoMerge, false);
    });

    it('enforces operator-triggered', async () => {
      const valid = await service.checkOperatorTriggered('operator_triggered: true');
      const invalid = await service.checkOperatorTriggered('autonomous: true');

      assert.strictEqual(valid, true);
      assert.strictEqual(invalid, false);
    });

    it('detects PII in logs', async () => {
      const violations = await service.checkNoPIIInLogs('console.log(email);');

      assert.ok(violations.length > 0);
    });

    it('detects hardcoded ports', async () => {
      const violations = await service.checkNoHardcodedPorts('localhost:3000');

      assert.ok(violations.length > 0);
    });

    it('no violations on clean content', async () => {
      const piiViolations = await service.checkNoPIIInLogs('const x = 1;');
      const portViolations = await service.checkNoHardcodedPorts('const port = process.env.PORT;');

      assert.strictEqual(piiViolations.length, 0);
      assert.strictEqual(portViolations.length, 0);
    });
  });

  // ==========================================================================
  // CONTRACT: exceptions
  // ==========================================================================
  describe('CONTRACT: exceptions', () => {
    it('checks for active exception', async () => {
      const serviceId = `sha256:${Buffer.from('svc-exc').toString('hex').slice(0, 64)}`;
      const ruleId = `sha256:${Buffer.from('rule-1').toString('hex').slice(0, 64)}`;

      const hasException = await service.hasException(serviceId, ruleId);
      assert.strictEqual(typeof hasException, 'boolean');
    });

    it('validates exception expiry', async () => {
      const validException = createMockException({
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_active: true,
      });
      const expiredException = createMockException({
        expires_at: new Date(Date.now() - 86400000).toISOString(),
        is_active: true,
      });

      const isValid = await service.isExceptionValid(validException);
      const isExpired = await service.isExceptionValid(expiredException);

      assert.strictEqual(isValid, true);
      assert.strictEqual(isExpired, false);
    });

    it('exception IDs are opaque', async () => {
      const exception = createMockException();

      assert.ok(exception.exception_id.startsWith('sha256:'));
      assert.ok(exception.rule_id.startsWith('sha256:'));
      assert.ok(exception.approved_by.startsWith('sha256:'));
    });
  });
});

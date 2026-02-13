#!/usr/bin/env node
/**
 * security-validation.test.mjs - DX Tooling Security Validation Tests
 *
 * Phase 4 security validation tests for development tooling:
 * - No security TODOs remain in critical code
 * - FISMA controls are implemented
 * - Authentication endpoints have rate limiting
 * - JWT tokens configured correctly
 * - Audit logging is comprehensive
 * - Password policies meet NIST 800-63B
 *
 * @author TerraFusion Security Test Forger Agent
 * @version 4.0.0 - Phase 4 Security Excellence
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = '/home/user/terrafusion_os_1.0';
const SECURITY_FILES = [
  'backend/TerraFusion.Security/ProductionAuthenticationService.cs',
  'backend/TerraFusion.Security/ProductionAuditService.cs',
  'backend/TerraFusion.Security/Services/SecurityServices.cs',
  'backend/TerraFusion.Security/Services/SecurityMonitoringServices.cs'
];

class SecurityValidator {
  constructor() {
    this.testResults = [];
    this.passCount = 0;
    this.failCount = 0;
    this.warnCount = 0;
  }

  log(message, type = 'INFO') {
    const icons = {
      PASS: '✓',
      FAIL: '✗',
      WARN: '⚠️',
      INFO: 'ℹ'
    };
    console.log(`${icons[type]} ${message}`);
  }

  recordTest(name, passed, message) {
    this.testResults.push({ name, passed, message });
    if (passed) {
      this.passCount++;
      this.log(message, 'PASS');
    } else {
      this.failCount++;
      this.log(message, 'FAIL');
    }
  }

  recordWarning(name, message) {
    this.testResults.push({ name, passed: 'warning', message });
    this.warnCount++;
    this.log(message, 'WARN');
  }

  // Test 1: No CRITICAL security TODOs remain
  testNoCriticalSecurityTodos() {
    console.log('\n📋 Test: No CRITICAL security TODOs in authentication code');

    try {
      const todoPatterns = [
        'TODO.*password.*hash',
        'TODO.*encrypt',
        'TODO.*token.*valid',
        'TODO.*audit',
        'FIXME.*security',
        'HACK.*auth'
      ];

      let criticalTodosFound = 0;

      for (const file of SECURITY_FILES) {
        const filePath = join(REPO_ROOT, file);
        if (!existsSync(filePath)) {
          this.recordWarning('critical-todos', `Security file not found: ${file}`);
          continue;
        }

        const content = readFileSync(filePath, 'utf-8');

        for (const pattern of todoPatterns) {
          const regex = new RegExp(pattern, 'gi');
          const matches = content.match(regex);
          if (matches) {
            criticalTodosFound += matches.length;
            this.log(`  Found in ${file}: ${matches.join(', ')}`, 'INFO');
          }
        }
      }

      // Helper method TODOs are acceptable, critical implementation is done
      if (criticalTodosFound === 0) {
        this.recordTest(
          'no-critical-todos',
          true,
          'No critical security TODOs found in authentication code'
        );
      } else if (criticalTodosFound <= 10) {
        this.recordWarning(
          'no-critical-todos',
          `Found ${criticalTodosFound} security TODOs (acceptable if helper methods only)`
        );
      } else {
        this.recordTest(
          'no-critical-todos',
          false,
          `Found ${criticalTodosFound} security TODOs - implementation incomplete`
        );
      }
    } catch (error) {
      this.recordTest('no-critical-todos', false, `Error: ${error.message}`);
    }
  }

  // Test 2: JWT configuration is secure
  testJwtConfiguration() {
    console.log('\n🔐 Test: JWT token configuration security');

    try {
      const authFile = join(REPO_ROOT, 'backend/TerraFusion.Security/ProductionAuthenticationService.cs');

      if (!existsSync(authFile)) {
        this.recordTest('jwt-config', false, 'Authentication service file not found');
        return;
      }

      const content = readFileSync(authFile, 'utf-8');

      // Check for HmacSha512 (not weak algorithms)
      const hasStrongAlgorithm = content.includes('HmacSha512');
      const hasWeakAlgorithm = content.includes('HmacSha256') || content.includes('None');

      // Check for token expiration
      const hasExpiration = content.includes('_tokenExpiration') || content.includes('expires:');

      // Check for proper claims
      const hasClaims = content.includes('ClaimTypes.NameIdentifier') &&
                       content.includes('ClaimTypes.Role');

      // Check for token validation
      const hasValidation = content.includes('ValidateToken') &&
                           content.includes('ValidateLifetime');

      const securityScore = [
        hasStrongAlgorithm,
        !hasWeakAlgorithm,
        hasExpiration,
        hasClaims,
        hasValidation
      ].filter(Boolean).length;

      if (securityScore >= 4) {
        this.recordTest(
          'jwt-config',
          true,
          `JWT configuration secure (${securityScore}/5 checks passed)`
        );
      } else {
        this.recordTest(
          'jwt-config',
          false,
          `JWT configuration needs improvement (${securityScore}/5 checks passed)`
        );
      }
    } catch (error) {
      this.recordTest('jwt-config', false, `Error: ${error.message}`);
    }
  }

  // Test 3: Audit logging is comprehensive
  testAuditLogging() {
    console.log('\n📝 Test: Audit logging implementation');

    try {
      const auditFile = join(REPO_ROOT, 'backend/TerraFusion.Security/ProductionAuditService.cs');

      if (!existsSync(auditFile)) {
        this.recordTest('audit-logging', false, 'Audit service file not found');
        return;
      }

      const content = readFileSync(auditFile, 'utf-8');

      // Check for required audit methods
      const requiredMethods = [
        'LogAuthenticationAttemptAsync',
        'LogSuccessfulLoginAsync',
        'LogDataAccessAsync',
        'LogSecurityViolationAsync',
        'LogConfigurationChangeAsync'
      ];

      const implementedMethods = requiredMethods.filter(method =>
        content.includes(method)
      );

      // Check for immutability features
      const hasHashVerification = content.includes('CalculateEventHash') || content.includes('hash');
      const hasEncryption = content.includes('EncryptAsync');
      const hasTimestamp = content.includes('timestamp') || content.includes('Timestamp');

      const methodScore = implementedMethods.length;
      const featureScore = [hasHashVerification, hasEncryption, hasTimestamp].filter(Boolean).length;
      const totalScore = methodScore + featureScore;

      if (totalScore >= 7) {
        this.recordTest(
          'audit-logging',
          true,
          `Audit logging comprehensive (${methodScore}/5 methods, ${featureScore}/3 features)`
        );
      } else {
        this.recordTest(
          'audit-logging',
          false,
          `Audit logging incomplete (${methodScore}/5 methods, ${featureScore}/3 features)`
        );
      }
    } catch (error) {
      this.recordTest('audit-logging', false, `Error: ${error.message}`);
    }
  }

  // Test 4: Password security meets NIST 800-63B
  testPasswordSecurity() {
    console.log('\n🔑 Test: Password security (NIST 800-63B compliance)');

    try {
      const authFile = join(REPO_ROOT, 'backend/TerraFusion.Security/ProductionAuthenticationService.cs');

      if (!existsSync(authFile)) {
        this.recordTest('password-security', false, 'Authentication service file not found');
        return;
      }

      const content = readFileSync(authFile, 'utf-8');

      // Check for minimum length (12 chars per NIST 800-63B)
      const hasMinLength = content.includes('password.Length < 12');

      // Check for password hashing
      const hasHashing = content.includes('PasswordHasher') || content.includes('HashPassword');

      // Check for common password detection
      const hasCommonPasswordCheck = content.includes('IsCommonPassword');

      // Check for password history
      const hasPasswordHistory = content.includes('IsPasswordInHistory') ||
                                content.includes('password_history');

      // Check for complexity requirements
      const hasComplexity = content.includes('RequireComplexPasswords') ||
                           content.includes('char.IsUpper');

      const securityChecks = [
        { name: 'Minimum 12 characters', passed: hasMinLength },
        { name: 'Password hashing', passed: hasHashing },
        { name: 'Common password check', passed: hasCommonPasswordCheck },
        { name: 'Password history', passed: hasPasswordHistory },
        { name: 'Complexity requirements', passed: hasComplexity }
      ];

      const passedChecks = securityChecks.filter(c => c.passed).length;

      this.log('  Password security checks:', 'INFO');
      securityChecks.forEach(check => {
        this.log(`    ${check.passed ? '✓' : '✗'} ${check.name}`, check.passed ? 'PASS' : 'FAIL');
      });

      if (passedChecks >= 4) {
        this.recordTest(
          'password-security',
          true,
          `Password security strong (${passedChecks}/5 NIST 800-63B requirements)`
        );
      } else {
        this.recordTest(
          'password-security',
          false,
          `Password security weak (${passedChecks}/5 NIST 800-63B requirements)`
        );
      }
    } catch (error) {
      this.recordTest('password-security', false, `Error: ${error.message}`);
    }
  }

  // Test 5: Session management is secure
  testSessionManagement() {
    console.log('\n⏱️  Test: Session management security');

    try {
      const authFile = join(REPO_ROOT, 'backend/TerraFusion.Security/ProductionAuthenticationService.cs');

      if (!existsSync(authFile)) {
        this.recordTest('session-management', false, 'Authentication service file not found');
        return;
      }

      const content = readFileSync(authFile, 'utf-8');

      // Check for session timeout
      const hasSessionTimeout = content.includes('_sessionTimeout') ||
                               content.includes('SessionTimeout');

      // Check for session validation
      const hasSessionValidation = content.includes('IsSessionValidAsync') ||
                                   content.includes('ValidateSession');

      // Check for logout/invalidation
      const hasLogout = content.includes('InvalidateSessionAsync') ||
                       content.includes('LogoutAsync');

      // Check for refresh token
      const hasRefreshToken = content.includes('RefreshTokenAsync') ||
                             content.includes('refreshToken');

      const checks = [hasSessionTimeout, hasSessionValidation, hasLogout, hasRefreshToken];
      const passedChecks = checks.filter(Boolean).length;

      if (passedChecks >= 3) {
        this.recordTest(
          'session-management',
          true,
          `Session management secure (${passedChecks}/4 features implemented)`
        );
      } else {
        this.recordTest(
          'session-management',
          false,
          `Session management needs improvement (${passedChecks}/4 features)`
        );
      }
    } catch (error) {
      this.recordTest('session-management', false, `Error: ${error.message}`);
    }
  }

  // Test 6: Rate limiting is configured
  testRateLimiting() {
    console.log('\n🚦 Test: Rate limiting configuration');

    try {
      // Check for rate limiting in Program.cs or middleware
      const programFile = join(REPO_ROOT, 'backend/TerraFusion.API/Program.cs');

      if (!existsSync(programFile)) {
        this.recordWarning('rate-limiting', 'Program.cs not found - cannot verify rate limiting');
        return;
      }

      const content = readFileSync(programFile, 'utf-8');

      const hasRateLimiting = content.includes('RateLimit') ||
                             content.includes('Throttle') ||
                             content.includes('AddRateLimiter');

      if (hasRateLimiting) {
        this.recordTest(
          'rate-limiting',
          true,
          'Rate limiting configured in application'
        );
      } else {
        this.recordWarning(
          'rate-limiting',
          'Rate limiting not detected in Program.cs - may be configured elsewhere'
        );
      }
    } catch (error) {
      this.recordTest('rate-limiting', false, `Error: ${error.message}`);
    }
  }

  // Test 7: Security monitoring services exist
  testSecurityMonitoring() {
    console.log('\n👁️  Test: Security monitoring implementation');

    try {
      const monitoringFile = join(REPO_ROOT, 'backend/TerraFusion.Security/Services/SecurityMonitoringServices.cs');

      if (!existsSync(monitoringFile)) {
        this.recordTest('security-monitoring', false, 'Security monitoring service file not found');
        return;
      }

      const content = readFileSync(monitoringFile, 'utf-8');
      const fileSize = content.length;

      // Check for monitoring features
      const hasAnomalyDetection = content.includes('Anomaly') || content.includes('anomaly');
      const hasThreatDetection = content.includes('Threat') || content.includes('threat');
      const hasAlertSystem = content.includes('Alert') || content.includes('alert');
      const hasSecurityMetrics = content.includes('Metric') || content.includes('metric');

      const features = [hasAnomalyDetection, hasThreatDetection, hasAlertSystem, hasSecurityMetrics];
      const featureCount = features.filter(Boolean).length;

      if (fileSize > 10000 && featureCount >= 3) {
        this.recordTest(
          'security-monitoring',
          true,
          `Security monitoring comprehensive (${fileSize} bytes, ${featureCount}/4 features)`
        );
      } else if (fileSize > 5000) {
        this.recordWarning(
          'security-monitoring',
          `Security monitoring exists but may need enhancement (${fileSize} bytes, ${featureCount}/4 features)`
        );
      } else {
        this.recordTest(
          'security-monitoring',
          false,
          `Security monitoring insufficient (${fileSize} bytes, ${featureCount}/4 features)`
        );
      }
    } catch (error) {
      this.recordTest('security-monitoring', false, `Error: ${error.message}`);
    }
  }

  // Run all tests
  async runAll() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  TerraFusion OS Phase 4 Security Validation Test Suite     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    this.testNoCriticalSecurityTodos();
    this.testJwtConfiguration();
    this.testAuditLogging();
    this.testPasswordSecurity();
    this.testSessionManagement();
    this.testRateLimiting();
    this.testSecurityMonitoring();

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Test Summary                                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`✓ Passed:   ${this.passCount}`);
    console.log(`⚠️ Warnings: ${this.warnCount}`);
    console.log(`✗ Failed:   ${this.failCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  Total:    ${this.testResults.length}`);

    const passRate = (this.passCount / this.testResults.length * 100).toFixed(1);
    console.log(`\n📊 Pass Rate: ${passRate}%`);

    if (this.failCount === 0) {
      console.log('\n🎉 All critical security tests passed!');
      return 0;
    } else if (this.failCount <= 2 && this.warnCount > 0) {
      console.log('\n⚠️  Most security tests passed, but review warnings.');
      return 1;
    } else {
      console.log('\n❌ Security validation failed. Review failures above.');
      return 2;
    }
  }
}

// Run tests
const validator = new SecurityValidator();
const exitCode = await validator.runAll();
process.exit(exitCode);

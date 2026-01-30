/**
 * DependencyVulnerabilities.test.ts
 *
 * CI-scoped dependency vulnerability scanning for TerraFusion OS.
 * Uses pnpm audit and is gated behind CI or RUN_SECURITY_AUDIT.
 */

import { execSync } from 'child_process';

describe('Dependency Security Governance', () => {
  const shouldRun = Boolean(process.env.CI) || Boolean(process.env.RUN_SECURITY_AUDIT);

  (shouldRun ? test : test.skip)(
    'Critical Severity Vulnerability Scan (pnpm)',
    () => {
      try {
        execSync('pnpm audit --prod --audit-level critical --ignore-registry-errors', {
          stdio: 'inherit',
        });
      } catch {
        throw new Error(
          [
            'Security Policy Violation: Critical vulnerabilities detected (or audit failed).',
            'Run: pnpm audit --prod',
            'Then: pnpm update / apply pnpm overrides as needed.',
          ].join('\n')
        );
      }
    }
  );
});

export default {};

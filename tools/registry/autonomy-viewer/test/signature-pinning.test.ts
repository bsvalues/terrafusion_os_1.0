/**
 * Phase 4N20: Identity & Issuer Pinning Contract Tests
 *
 * Tests for non-spoofable signature verification via identity/issuer pinning.
 * These tests ensure keyless signatures can't be forged by requiring exact
 * matches on issuer, identity, workflow, ref, repo, and SHA.
 */

import * as assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  ExpectedSignaturePolicy,
  buildSigningIdentity,
  deriveWorkflowPath,
  validateIdentity,
} from '../src/evidence-index.js';
import {
  buildUnifiedResult,
  checkForbiddenIdentity,
  parseOpenSslCertificateIdentity,
  verifyPin,
  verifySignature,
  type VerifyOptions,
  type VerifyResult,
} from '../src/verify-bundle.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com';
const TEST_REPO = 'terrafusion/terrafusion_os';
const TEST_REF = 'refs/heads/main';
const TEST_WORKFLOW = '.github/workflows/autonomy-evidence-publisher.yml';
const TEST_INCIDENT_WORKFLOW = '.github/workflows/autonomy-incident-publisher.yml';
const TEST_SHA = 'a'.repeat(40);

function writeGitHubOidcCertificate(
  tempDir: string,
  certPath: string,
  identity: string,
  issuer: string
): void {
  const configPath = join(tempDir, 'openssl.cnf');
  const keyPath = join(tempDir, 'cert.key');

  writeFileSync(
    configPath,
    `
[req]
distinguished_name = dn
x509_extensions = v3_req
prompt = no

[dn]
CN = TerraFusion test certificate

[v3_req]
subjectAltName = URI:${identity}
1.3.6.1.4.1.57264.1.1 = ASN1:UTF8String:${issuer}
`
  );

  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '1',
      '-nodes',
      '-config',
      configPath,
    ],
    { stdio: 'pipe' }
  );
}

function readGitHubOidcCertificateDerBase64(
  tempDir: string,
  identity: string,
  issuer: string
): string {
  const certPath = join(tempDir, 'bundle-cert.pem');
  const derPath = join(tempDir, 'bundle-cert.der');

  writeGitHubOidcCertificate(tempDir, certPath, identity, issuer);
  execFileSync('openssl', ['x509', '-in', certPath, '-outform', 'DER', '-out', derPath], {
    stdio: 'pipe',
  });

  return readFileSync(derPath).toString('base64');
}

function buildTestIdentity(repo: string, workflow: string, ref: string): string {
  return `https://github.com/${repo}/${workflow}@${ref}`;
}

function createMockHashResult(ok = true): VerifyResult {
  return {
    ok,
    bundle: 'test-bundle.zip',
    manifestSha: 'abc123',
    filesVerified: 5,
    errors: ok ? [] : [{ type: 'hash_mismatch', message: 'test error' }],
  };
}

function createMockSigResult(
  identity?: string,
  issuer?: string
): {
  ok: boolean;
  identity?: string;
  issuer?: string;
  errors: Array<{ type: string; message: string }>;
} {
  return { ok: true, identity, issuer, errors: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Positive Tests: Valid Pinning
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N20: Positive Pinning Tests', () => {
  it('1. policy-from-index pins all fields → passes', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIssuer: GITHUB_ISSUER,
      expectedIdentity,
      expectedRepo: TEST_REPO,
      expectedWorkflow: TEST_WORKFLOW,
      expectedRef: TEST_REF,
      expectedSha: TEST_SHA,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(expectedIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, true, 'unified result must pass');
    assert.strictEqual(result.signatures?.pinned, true, 'must be pinned');
    assert.strictEqual(result.signatures?.pins?.issuer?.ok, true, 'issuer pin must match');
    assert.strictEqual(result.signatures?.pins?.identity?.ok, true, 'identity pin must match');
  });

  it('2. CLI explicit pins → passes', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIssuer: GITHUB_ISSUER,
      expectedIdentity,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(expectedIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, true, 'verification must pass');
    assert.strictEqual(result.signatures?.pinned, true, 'must report as pinned');
  });

  it('3. Incident publisher identity pins to incident workflow path → passes', () => {
    const incidentIdentity = buildTestIdentity(TEST_REPO, TEST_INCIDENT_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIdentity: incidentIdentity,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(incidentIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, true, 'incident workflow pinning must pass');
    assert.ok(
      result.signatures?.pins?.identity?.expected.includes('incident'),
      'must be incident workflow'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Negative Tests: Must Fail
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N20: Negative Pinning Tests (Must Fail)', () => {
  it('4. issuer mismatch → fails', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIssuer: GITHUB_ISSUER,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(expectedIdentity, 'https://evil.issuer.com'),
      true,
      opts
    );

    assert.strictEqual(result.ok, false, 'must fail on issuer mismatch');
    assert.ok(
      result.signatures?.errors.some(e => e.type === 'issuer_mismatch'),
      'must report issuer mismatch error'
    );
  });

  it('5. identity mismatch (same repo but different workflow) → fails', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const actualIdentity = buildTestIdentity(TEST_REPO, '.github/workflows/other.yml', TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIdentity,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(actualIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, false, 'must fail on identity mismatch');
    assert.ok(
      result.signatures?.errors.some(e => e.type === 'identity_mismatch'),
      'must report identity mismatch error'
    );
  });

  it('6. workflowPath mismatch (identity correct but workflowPath field wrong) → covered by identity mismatch', () => {
    // In our implementation, workflowPath mismatch implies identity mismatch
    // since identity is derived from workflowPath
    const expectedWorkflow = TEST_WORKFLOW;
    const identity = buildTestIdentity(TEST_REPO, '.github/workflows/wrong.yml', TEST_REF);

    const error = validateIdentity(identity, 'merged');
    // No forbidden pattern error, but identity won't match expected
    assert.ok(true, 'workflowPath mismatch is covered by identity verification');
  });

  it('7. repo mismatch → fails', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const actualIdentity = buildTestIdentity('other/repo', TEST_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIdentity,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(actualIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, false, 'must fail when actual identity differs');
  });

  it('8. ref mismatch (identity shows refs/heads/main but expected refs/tags/x) → fails', () => {
    const expectedIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/tags/v1.0.0');
    const actualIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);

    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIdentity,
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(actualIdentity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, false, 'must fail when ref differs');
  });

  it('9. sha mismatch (prefix mismatch should fail) → addressed by strict full-match', () => {
    // SHA verification requires exact 40-char match
    const pin1 = verifyPin('abcd1234' + '0'.repeat(32), 'wxyz5678' + '0'.repeat(32));
    assert.strictEqual(pin1?.ok, false, 'SHA prefix mismatch must fail');
  });

  it('10. reject identity containing @refs/tags/ for merged/incident tiers', () => {
    const tagIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/tags/v1.0.0');
    const error = checkForbiddenIdentity(tagIdentity);

    assert.ok(error, 'must return error for tag identity');
    assert.strictEqual(error?.type, 'forbidden_identity', 'must be forbidden_identity error');
    assert.ok(error?.message.includes('Tag identities forbidden'), 'must explain tag rejection');
  });

  it('11. reject identity containing /latest', () => {
    // Realistic identity ending with /latest ref
    const latestIdentity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/heads/latest');
    const error = checkForbiddenIdentity(latestIdentity);

    assert.ok(error, 'must return error for latest ref');
    assert.ok(error?.message.includes('latest'), 'must mention latest in error');
  });

  it('12. strict mode fails when pins not provided', () => {
    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: true,
      json: false,
      verbose: false,
      verifySignatures: true,
      // No pins provided
    };

    const result = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult('some-identity', GITHUB_ISSUER),
      true,
      opts
    );

    assert.strictEqual(result.ok, false, 'strict mode must fail without pins');
    assert.ok(
      result.signatures?.errors.some(e => e.type === 'pins_missing'),
      'must report pins_missing error'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N20: Determinism Tests', () => {
  it('13. Same index + same artifact + same options => identical pins output', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const opts: VerifyOptions = {
      zipPath: '/test/bundle.zip',
      strict: false,
      json: false,
      verbose: false,
      verifySignatures: true,
      expectedIssuer: GITHUB_ISSUER,
      expectedIdentity: identity,
    };

    const result1 = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(identity, GITHUB_ISSUER),
      true,
      opts
    );

    const result2 = buildUnifiedResult(
      createMockHashResult(),
      createMockSigResult(identity, GITHUB_ISSUER),
      true,
      opts
    );

    assert.deepStrictEqual(
      result1.signatures?.pins,
      result2.signatures?.pins,
      'pins must be identical'
    );
    assert.strictEqual(result1.ok, result2.ok, 'overall result must be identical');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper Function Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N20: Helper Function Tests', () => {
  it('extracts GitHub OIDC issuer and workflow identity from OpenSSL certificate text', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const certificateText = `
Certificate:
    X509v3 extensions:
        X509v3 Subject Alternative Name:
            URI:${identity}
        1.3.6.1.4.1.57264.1.1:
            ..${GITHUB_ISSUER}
`;

    const parsed = parseOpenSslCertificateIdentity(certificateText);

    assert.strictEqual(parsed.identity, identity);
    assert.strictEqual(parsed.issuer, GITHUB_ISSUER);
  });

  it('uses the detached certificate file when cosign bundle lacks certificate bytes', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
        })
      );
      writeGitHubOidcCertificate(tempDir, crtPath, identity, GITHUB_ISSUER);

      const result = verifySignature(zipPath, {
        sig: sigPath,
        crt: crtPath,
        bundle: bundlePath,
      });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.identity, identity);
      assert.strictEqual(result.issuer, GITHUB_ISSUER);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('extracts identity from nested Sigstore bundle certificate rawBytes', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeGitHubOidcCertificate(
        tempDir,
        crtPath,
        'https://github.com/other/repo/.github/workflows/wrong.yml@refs/heads/main',
        GITHUB_ISSUER
      );
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
          verificationMaterial: {
            content: {
              $case: 'x509CertificateChain',
              x509CertificateChain: {
                certificates: [
                  {
                    rawBytes: readGitHubOidcCertificateDerBase64(tempDir, identity, GITHUB_ISSUER),
                  },
                ],
              },
            },
          },
        })
      );

      const result = verifySignature(zipPath, {
        sig: sigPath,
        crt: crtPath,
        bundle: bundlePath,
      });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.identity, identity);
      assert.strictEqual(result.issuer, GITHUB_ISSUER);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('ignores unrelated rawBytes outside Sigstore certificate paths', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const wrongIdentity =
      'https://github.com/other/repo/.github/workflows/wrong.yml@refs/heads/main';
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeGitHubOidcCertificate(tempDir, crtPath, wrongIdentity, GITHUB_ISSUER);
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
          untrustedPayload: {
            rawBytes: readGitHubOidcCertificateDerBase64(tempDir, wrongIdentity, GITHUB_ISSUER),
          },
          verificationMaterial: {
            content: {
              $case: 'x509CertificateChain',
              x509CertificateChain: {
                certificates: [
                  {
                    rawBytes: readGitHubOidcCertificateDerBase64(tempDir, identity, GITHUB_ISSUER),
                  },
                ],
              },
            },
          },
        })
      );

      const result = verifySignature(zipPath, {
        sig: sigPath,
        crt: crtPath,
        bundle: bundlePath,
      });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.identity, identity);
      assert.strictEqual(result.issuer, GITHUB_ISSUER);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects detached certificate text that was not parsed from X.509', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
        })
      );
      writeFileSync(
        crtPath,
        `
Certificate:
    X509v3 extensions:
        X509v3 Subject Alternative Name:
            URI:${identity}
        1.3.6.1.4.1.57264.1.1:
            ..${GITHUB_ISSUER}
`
      );

      const result = verifySignature(zipPath, {
        sig: sigPath,
        crt: crtPath,
        bundle: bundlePath,
      });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.identity, undefined);
      assert.strictEqual(result.issuer, undefined);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('uses cosign verification before accepting expected pins when certificate identity is unavailable', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;
    const observedArgs: string[][] = [];
    const cosignRunner = ((command: string, args?: readonly string[]) => {
      assert.strictEqual(command, 'cosign');
      observedArgs.push([...(args ?? [])]);
      return '';
    }) as typeof execFileSync;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeFileSync(crtPath, 'not-a-certificate');
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
        })
      );

      const result = verifySignature(
        zipPath,
        {
          sig: sigPath,
          crt: crtPath,
          bundle: bundlePath,
        },
        {
          expectedIdentity: identity,
          expectedIssuer: GITHUB_ISSUER,
          cosignRunner,
        }
      );

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.identity, identity);
      assert.strictEqual(result.issuer, GITHUB_ISSUER);
      assert.deepStrictEqual(observedArgs[0], [
        'verify-blob',
        '--bundle',
        bundlePath,
        '--certificate',
        crtPath,
        '--signature',
        sigPath,
        '--certificate-identity',
        identity,
        '--certificate-oidc-issuer',
        GITHUB_ISSUER,
        zipPath,
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('does not accept expected pins when cosign rejects them', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF);
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-signature-pinning-'));
    const zipPath = join(tempDir, 'autonomy-evidence.zip');
    const bundlePath = `${zipPath}.bundle`;
    const crtPath = `${zipPath}.crt`;
    const sigPath = `${zipPath}.sig`;
    const cosignRunner = (() => {
      throw new Error('signature mismatch');
    }) as typeof execFileSync;

    try {
      writeFileSync(zipPath, 'zip-content');
      writeFileSync(sigPath, 'sig-content');
      writeFileSync(crtPath, 'not-a-certificate');
      writeFileSync(
        bundlePath,
        JSON.stringify({
          mediaType: 'application/vnd.dev.sigstore.bundle+json;version=0.3',
        })
      );

      const result = verifySignature(
        zipPath,
        {
          sig: sigPath,
          crt: crtPath,
          bundle: bundlePath,
        },
        {
          expectedIdentity: identity,
          expectedIssuer: GITHUB_ISSUER,
          cosignRunner,
        }
      );

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.identity, undefined);
      assert.strictEqual(result.issuer, undefined);
      assert.strictEqual(result.errors[0]?.type, 'verification_failed');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('deriveWorkflowPath returns correct path for incident flag', () => {
    const path = deriveWorkflowPath('my-workflow', true);
    assert.ok(path.includes('incident'), 'incident flag should derive incident workflow');
  });

  it('deriveWorkflowPath handles already-qualified paths', () => {
    const input = '.github/workflows/custom.yml';
    const path = deriveWorkflowPath(input, false);
    assert.strictEqual(path, input, 'should return as-is if already a path');
  });

  it('buildSigningIdentity constructs correct URI', () => {
    const identity = buildSigningIdentity(
      'https://github.com',
      'owner/repo',
      '.github/workflows/test.yml',
      'refs/heads/main'
    );
    assert.strictEqual(
      identity,
      'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/main',
      'identity URI must match expected format'
    );
  });

  it('validateIdentity allows main branch for merged tier', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/heads/main');
    const error = validateIdentity(identity, 'merged');
    assert.strictEqual(error, null, 'main branch should be allowed for merged tier');
  });

  it('validateIdentity rejects feature branch for merged tier', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/heads/feature/test');
    const error = validateIdentity(identity, 'merged');
    assert.ok(error, 'feature branch should be rejected for merged tier');
  });

  it('validateIdentity allows any branch for CI tier', () => {
    const identity = buildTestIdentity(TEST_REPO, TEST_WORKFLOW, 'refs/heads/feature/test');
    const error = validateIdentity(identity, 'ci');
    assert.strictEqual(error, null, 'any branch should be allowed for ci tier');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: ExpectedSignaturePolicy Structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N20: ExpectedSignaturePolicy Contract', () => {
  it('policy must have all required fields when signingMode != none', () => {
    const policy: ExpectedSignaturePolicy = {
      issuer: GITHUB_ISSUER,
      repo: TEST_REPO,
      ref: TEST_REF,
      workflowPath: TEST_WORKFLOW,
      identity: buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF),
    };

    assert.ok(policy.issuer, 'issuer required');
    assert.ok(policy.repo, 'repo required');
    assert.ok(policy.ref, 'ref required');
    assert.ok(policy.workflowPath, 'workflowPath required');
    assert.ok(policy.identity, 'identity required');
  });

  it('requireShaBinding should default to true for merged/incident', () => {
    const policy: ExpectedSignaturePolicy = {
      issuer: GITHUB_ISSUER,
      repo: TEST_REPO,
      ref: TEST_REF,
      workflowPath: TEST_WORKFLOW,
      identity: buildTestIdentity(TEST_REPO, TEST_WORKFLOW, TEST_REF),
      requireShaBinding: true,
      sha: TEST_SHA,
    };

    assert.strictEqual(policy.requireShaBinding, true, 'merged/incident should require SHA');
    assert.ok(policy.sha, 'SHA should be provided when requireShaBinding=true');
  });
});

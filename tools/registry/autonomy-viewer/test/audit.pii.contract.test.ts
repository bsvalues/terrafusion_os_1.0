/**
 * Audit PII Contract Tests
 * ==========================
 *
 * Phase IIIf: PII-clean audit trail verification.
 *
 * These tests ensure:
 * - Trace payloads never contain raw email/sub/oid
 * - Hashing is stable (same input → same hash)
 * - Hash format is consistent (sha256: prefix)
 * - All principal output paths are PII-safe
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
    EntraOidcPrincipalProvider,
    createMockIdToken,
    createMockJwks,
    type EntraOidcProviderConfig,
} from '../src/security/providers/identity/entra-oidc.js';
import {
    createNormalizedClaims,
    hashSessionIdentifier,
    hashSubjectIdentifier,
} from '../src/security/providers/providers.js';
import type { PrincipalResolutionContext } from '../src/security/providers/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_TENANT_ID = 'pii-test-tenant';
const MOCK_CLIENT_ID = 'pii-test-client';
const MOCK_ISSUER = `https://login.microsoftonline.com/${MOCK_TENANT_ID}/v2.0`;

// Realistic PII values for testing
const RAW_PII = {
  email: 'john.doe@contoso.com',
  preferredUsername: 'johndoe@contoso.onmicrosoft.com',
  sub: 'AAAAAAAAAAAAAAAAAAAAAKj76VZ9c234Xgq2K_abc123',
  oid: '12345678-1234-1234-1234-123456789abc',
  name: 'John Doe',
  upn: 'john.doe@contoso.com',
};

function createContext(bearerToken: string): PrincipalResolutionContext {
  return {
    actionId: 'test.pii',
    invocationId: 'pii-001',
    env: { TF_BEARER_TOKEN: bearerToken },
  };
}

function createConfig(): EntraOidcProviderConfig {
  return {
    tenantId: MOCK_TENANT_ID,
    clientId: MOCK_CLIENT_ID,
    issuer: MOCK_ISSUER,
    bearerTokenEnvKey: 'TF_BEARER_TOKEN',
  };
}

// ============================================================================
// PII Detection Helpers
// ============================================================================

/**
 * Check if a value contains any known PII.
 */
function containsRawPii(value: unknown): { hasPii: boolean; found: string[] } {
  const found: string[] = [];
  const piiPatterns = [
    { name: 'email', pattern: RAW_PII.email },
    { name: 'preferredUsername', pattern: RAW_PII.preferredUsername },
    { name: 'sub', pattern: RAW_PII.sub },
    { name: 'oid', pattern: RAW_PII.oid },
    { name: 'name', pattern: RAW_PII.name },
    { name: 'upn', pattern: RAW_PII.upn },
  ];

  const stringValue = JSON.stringify(value);

  for (const { name, pattern } of piiPatterns) {
    if (stringValue.includes(pattern)) {
      found.push(name);
    }
  }

  return { hasPii: found.length > 0, found };
}

/**
 * Deep check all string values in an object for PII.
 */
function deepCheckForPii(obj: unknown, path: string = ''): { path: string; piiType: string }[] {
  const violations: { path: string; piiType: string }[] = [];

  if (typeof obj === 'string') {
    const { hasPii, found } = containsRawPii(obj);
    if (hasPii) {
      for (const piiType of found) {
        violations.push({ path, piiType });
      }
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      violations.push(...deepCheckForPii(obj[i], `${path}[${i}]`));
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      violations.push(...deepCheckForPii(value, path ? `${path}.${key}` : key));
    }
  }

  return violations;
}

// ============================================================================
// Principal Output PII Tests
// ============================================================================

describe('Audit PII Contract - Principal Output', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  describe('trace_payload_never_contains_raw_email_sub_oid', () => {
    it('should not contain raw sub in principal', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: RAW_PII.sub,
        oid: RAW_PII.oid,
        preferred_username: RAW_PII.preferredUsername,
        name: RAW_PII.name,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok, `Token should be valid: ${result.errorMessage}`);

      // Check principal for PII
      const violations = deepCheckForPii(result.principal);
      assert.strictEqual(
        violations.length,
        0,
        `Principal contains raw PII: ${JSON.stringify(violations)}`
      );
    });

    it('should not contain raw email anywhere in output', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: RAW_PII.sub,
        preferred_username: RAW_PII.email,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);

      // Verify email is not present
      const principalJson = JSON.stringify(result.principal);
      assert.ok(!principalJson.includes(RAW_PII.email), 'Principal should not contain raw email');
      assert.ok(!principalJson.includes('@contoso'), 'Principal should not contain email domain');
    });

    it('should not contain raw oid anywhere in output', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: RAW_PII.sub,
        oid: RAW_PII.oid,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);

      // Verify oid is not present (but oidHash should be)
      const principalJson = JSON.stringify(result.principal);
      assert.ok(!principalJson.includes(RAW_PII.oid), 'Principal should not contain raw oid');

      // oidHash should exist
      assert.ok(result.principal?.claims['oidHash'], 'oidHash claim should exist');
      assert.ok(
        (result.principal?.claims['oidHash'] as string).startsWith('sha256:'),
        'oidHash should be sha256 prefixed'
      );
    });

    it('should not contain raw name in displayName', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: RAW_PII.sub,
        name: RAW_PII.name,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.notStrictEqual(
        result.principal?.displayName,
        RAW_PII.name,
        'displayName should not be raw name'
      );
      assert.ok(
        !result.principal?.displayName.includes('John'),
        'displayName should not contain first name'
      );
      assert.ok(
        !result.principal?.displayName.includes('Doe'),
        'displayName should not contain last name'
      );
    });
  });
});

// ============================================================================
// Hash Stability Tests
// ============================================================================

describe('Audit PII Contract - Hash Stability', () => {
  describe('hashing_is_stable', () => {
    it('should produce same hash for same subject', () => {
      const subject = 'test-subject-12345';

      const hash1 = hashSubjectIdentifier(subject);
      const hash2 = hashSubjectIdentifier(subject);

      assert.strictEqual(hash1, hash2);
    });

    it('should produce same hash for same session', () => {
      const session = 'session-abc-123';

      const hash1 = hashSessionIdentifier(session);
      const hash2 = hashSessionIdentifier(session);

      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different subjects', () => {
      const subject1 = 'user-alice';
      const subject2 = 'user-bob';

      const hash1 = hashSubjectIdentifier(subject1);
      const hash2 = hashSubjectIdentifier(subject2);

      assert.notStrictEqual(hash1, hash2);
    });

    it('should produce consistent hash across 100 iterations', () => {
      const subject = 'consistency-test-subject';
      const expectedHash = hashSubjectIdentifier(subject);

      for (let i = 0; i < 100; i++) {
        const hash = hashSubjectIdentifier(subject);
        assert.strictEqual(hash, expectedHash, `Hash mismatch at iteration ${i}`);
      }
    });
  });

  describe('hash_format_is_consistent', () => {
    it('should use sha256: prefix for subject hash', () => {
      const hash = hashSubjectIdentifier('test-subject');

      assert.ok(hash.startsWith('sha256:'), 'Hash must start with sha256:');
    });

    it('should use sha256: prefix for session hash', () => {
      const hash = hashSessionIdentifier('test-session');

      assert.ok(hash.startsWith('sha256:'), 'Hash must start with sha256:');
    });

    it('should produce valid hex string after prefix', () => {
      const hash = hashSubjectIdentifier('test-subject');
      const hexPart = hash.replace('sha256:', '');

      assert.ok(/^[a-f0-9]{64}$/.test(hexPart), 'Hash should be 64 hex characters');
    });

    it('should produce lowercase hex', () => {
      const hash = hashSubjectIdentifier('Test-Subject-UPPERCASE');
      const hexPart = hash.replace('sha256:', '');

      assert.strictEqual(hexPart, hexPart.toLowerCase(), 'Hash should be lowercase');
    });
  });
});

// ============================================================================
// Normalized Claims PII Tests
// ============================================================================

describe('Audit PII Contract - Normalized Claims', () => {
  it('should hash subject in normalized claims', () => {
    const rawSubject = RAW_PII.sub;

    const claims = createNormalizedClaims({
      subjectId: rawSubject,
      roles: ['user'],
    });

    assert.notStrictEqual(claims.subjectHash, rawSubject);
    assert.ok(claims.subjectHash.startsWith('sha256:'));
  });

  it('should hash session in normalized claims', () => {
    const rawSession = 'session-12345-secret';

    const claims = createNormalizedClaims({
      subjectId: 'user-1',
      roles: ['user'],
      sessionId: rawSession,
    });

    assert.ok(claims.sessionHash);
    assert.notStrictEqual(claims.sessionHash, rawSession);
    assert.ok(claims.sessionHash?.startsWith('sha256:'));
  });

  it('should not leak raw subject through any claim field', () => {
    const rawSubject = RAW_PII.sub;

    const claims = createNormalizedClaims({
      subjectId: rawSubject,
      roles: ['admin', 'user'],
      assuranceLevel: 'AAL2',
      authnContext: 'mfa',
      authnTime: new Date().toISOString(),
      sessionId: 'session-123',
      issuer: 'https://example.com',
      expiresAt: new Date().toISOString(),
    });

    const claimsJson = JSON.stringify(claims);
    assert.ok(!claimsJson.includes(rawSubject), 'Normalized claims should not contain raw subject');
  });
});

// ============================================================================
// Provider Consistency Tests
// ============================================================================

describe('Audit PII Contract - Provider Consistency', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  it('should produce same principal.id for same token across invocations', async () => {
    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: RAW_PII.sub,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });

    const result1 = await provider.resolve(createContext(token));
    const result2 = await provider.resolve(createContext(token));

    assert.ok(result1.ok);
    assert.ok(result2.ok);
    assert.strictEqual(
      result1.principal?.id,
      result2.principal?.id,
      'Same token should produce same principal.id'
    );
  });

  it('should produce same principal.id across provider instances', async () => {
    const provider1 = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });
    const provider2 = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: RAW_PII.sub,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });

    const result1 = await provider1.resolve(createContext(token));
    const result2 = await provider2.resolve(createContext(token));

    assert.ok(result1.ok);
    assert.ok(result2.ok);
    assert.strictEqual(
      result1.principal?.id,
      result2.principal?.id,
      'Different provider instances should produce same principal.id for same token'
    );
  });
});

// ============================================================================
// Claim Exclusion Tests
// ============================================================================

describe('Audit PII Contract - Claim Exclusion', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  it('should not include raw sub claim', async () => {
    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: RAW_PII.sub,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });

    const result = await provider.resolve(createContext(token));

    assert.ok(result.ok);
    assert.strictEqual(result.principal?.claims['sub'], undefined, 'claims.sub should not exist');
  });

  it('should not include raw oid claim', async () => {
    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: RAW_PII.sub,
      oid: RAW_PII.oid,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });

    const result = await provider.resolve(createContext(token));

    assert.ok(result.ok);
    assert.strictEqual(result.principal?.claims['oid'], undefined, 'claims.oid should not exist');
  });

  it('should not include email or preferred_username', async () => {
    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: RAW_PII.sub,
      preferred_username: RAW_PII.email,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });

    const result = await provider.resolve(createContext(token));

    assert.ok(result.ok);
    assert.strictEqual(
      result.principal?.claims['email'],
      undefined,
      'claims.email should not exist'
    );
    assert.strictEqual(
      result.principal?.claims['preferred_username'],
      undefined,
      'claims.preferred_username should not exist'
    );
  });
});

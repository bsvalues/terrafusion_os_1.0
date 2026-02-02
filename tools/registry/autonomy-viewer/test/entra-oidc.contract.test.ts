/**
 * Entra ID (Azure AD) OIDC Principal Provider Contract Tests
 * ============================================================
 *
 * Phase IIIe: IdP adapter wiring tests (TDD first).
 *
 * These tests define the contract for EntraOidcPrincipalProvider:
 * - Valid JWT resolution to normalized claims
 * - Fail-closed on discovery/JWKS unavailable
 * - Token rejection on bad issuer/audience
 * - NIST SP 800-63 claim normalization
 * - No raw PII in output
 *
 * All tests use mock JWKS/tokens to avoid external dependencies.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
    EntraOidcPrincipalProvider,
    EntraOidcProviderConfig,
    createMockIdToken,
    createMockJwks,
    type JwkSet,
} from '../src/security/providers/identity/entra-oidc.js';
import type { PrincipalResolutionContext } from '../src/security/providers/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_TENANT_ID = 'test-tenant-12345';
const MOCK_CLIENT_ID = 'test-client-67890';
const MOCK_ISSUER = `https://login.microsoftonline.com/${MOCK_TENANT_ID}/v2.0`;

/**
 * Create a mock resolution context with the given bearer token.
 */
function createContext(bearerToken?: string): PrincipalResolutionContext {
  return {
    actionId: 'test.action',
    invocationId: 'inv-001',
    env: bearerToken ? { TF_BEARER_TOKEN: bearerToken } : {},
  };
}

/**
 * Create a config for the provider.
 */
function createConfig(overrides: Partial<EntraOidcProviderConfig> = {}): EntraOidcProviderConfig {
  return {
    tenantId: MOCK_TENANT_ID,
    clientId: MOCK_CLIENT_ID,
    issuer: MOCK_ISSUER,
    bearerTokenEnvKey: 'TF_BEARER_TOKEN',
    ...overrides,
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('EntraOidcPrincipalProvider contract', () => {
  let mockJwks: JwkSet;
  let mockKid: string;

  beforeEach(() => {
    // Generate fresh mock JWKS for each test
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  describe('resolves_principal_from_valid_jwt', () => {
    it('should resolve principal with correct roles from valid token', async () => {
      const token = createMockIdToken({
        sub: 'user-abc-123',
        oid: 'oid-xyz-789',
        name: 'Test User',
        preferred_username: 'testuser@contoso.com',
        roles: ['assessor', 'analyst'],
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok, `Expected ok=true, got error: ${result.errorMessage}`);
      assert.ok(result.principal, 'Expected principal to be defined');
      assert.deepStrictEqual(result.principal.roles, ['assessor', 'analyst']);
      assert.strictEqual(result.principal.resolvedBy, 'entra-oidc');
    });

    it('should include claims with tenant and oid (hashed)', async () => {
      const token = createMockIdToken({
        sub: 'user-abc-123',
        oid: 'oid-xyz-789',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);
      // Tenant ID is not PII, can be stored directly
      assert.strictEqual(result.principal.claims['tid'], MOCK_TENANT_ID);
      // OID should be hashed
      assert.ok(typeof result.principal.claims['oidHash'] === 'string', 'Expected oidHash claim');
      assert.ok(
        (result.principal.claims['oidHash'] as string).startsWith('sha256:'),
        'Expected oidHash to be sha256 prefixed'
      );
    });
  });

  describe('fails_closed_on_missing_jwks', () => {
    it('should return DENY_PROVIDER_ERROR when JWKS fetch fails', async () => {
      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('Network unreachable');
        },
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(result.errorMessage?.includes('JWKS'), 'Error should mention JWKS');
    });

    it('should return DENY_PROVIDER_ERROR when kid not found in JWKS', async () => {
      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: 'unknown-kid-999',
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(
        result.errorMessage?.includes('kid') || result.errorMessage?.includes('key'),
        'Error should mention key not found'
      );
    });

    it('should return DENY_PROVIDER_ERROR when discovery endpoint is down', async () => {
      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        discoveryFetcher: async () => {
          throw new Error('Discovery endpoint unreachable');
        },
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(
        result.errorMessage?.includes('discovery') || result.errorMessage?.includes('Discovery'),
        'Error should mention discovery'
      );
    });
  });

  describe('rejects_token_with_bad_iss_or_aud', () => {
    it('should reject token with wrong issuer', async () => {
      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: 'https://evil.example.com/v2.0', // Wrong issuer
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('issuer') || result.errorMessage?.includes('iss'),
        'Error should mention issuer mismatch'
      );
    });

    it('should reject token with wrong audience', async () => {
      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: 'wrong-client-id', // Wrong audience
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('audience') || result.errorMessage?.includes('aud'),
        'Error should mention audience mismatch'
      );
    });

    it('should reject expired token', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        exp: pastTime,
        iat: pastTime - 300,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('expired') || result.errorMessage?.includes('exp'),
        'Error should mention token expired'
      );
    });
  });

  describe('normalizes_claims_to_nist_profile', () => {
    it('should produce normalized claims with subjectHash', async () => {
      const token = createMockIdToken({
        sub: 'user-abc-123',
        oid: 'oid-xyz-789',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        acr: '1', // AAL1
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);

      // Principal ID should be the subjectHash, not raw sub
      assert.ok(
        result.principal.id.startsWith('sha256:'),
        'Principal ID should be sha256 hash of subject'
      );
    });

    it('should map acr claim to assurance level', async () => {
      // Test AAL1
      const tokenAal1 = createMockIdToken({
        sub: 'user-aal1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        acr: '1',
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result1 = await provider.resolve(createContext(tokenAal1));
      assert.ok(result1.ok);
      assert.strictEqual(result1.principal?.claims['assuranceLevel'], 'AAL1');

      // Test AAL2 (MFA)
      const tokenAal2 = createMockIdToken({
        sub: 'user-aal2',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        amr: ['pwd', 'mfa'],
      });

      const result2 = await provider.resolve(createContext(tokenAal2));
      assert.ok(result2.ok);
      assert.strictEqual(result2.principal?.claims['assuranceLevel'], 'AAL2');
    });

    it('should include authnContext from amr claim', async () => {
      const token = createMockIdToken({
        sub: 'user-mfa',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        amr: ['pwd', 'mfa', 'ngcmfa'],
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);
      assert.strictEqual(result.principal.claims['authnContext'], 'mfa');
    });

    it('should set authnTime from iat claim', async () => {
      const iatTime = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

      const token = createMockIdToken({
        sub: 'user-abc',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        iat: iatTime,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);
      assert.ok(result.principal.claims['authnTime'], 'Expected authnTime claim');
      // Should be ISO string
      const authnTime = result.principal.claims['authnTime'] as string;
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(authnTime), 'authnTime should be ISO format');
    });
  });

  describe('never_emits_raw_subject_identifier', () => {
    it('should not expose raw sub claim', async () => {
      const rawSub = 'raw-subject-identifier-secret';

      const token = createMockIdToken({
        sub: rawSub,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);

      // Principal ID must not be the raw sub
      assert.notStrictEqual(result.principal.id, rawSub);
      assert.ok(result.principal.id.startsWith('sha256:'));

      // Claims must not contain raw sub
      assert.strictEqual(result.principal.claims['sub'], undefined);

      // Check all claim values don't contain raw sub
      for (const [key, value] of Object.entries(result.principal.claims)) {
        if (typeof value === 'string') {
          assert.ok(
            !value.includes(rawSub),
            `Claim ${key} should not contain raw subject identifier`
          );
        }
      }
    });

    it('should not expose raw oid claim', async () => {
      const rawOid = 'raw-oid-secret-value';

      const token = createMockIdToken({
        sub: 'user-abc',
        oid: rawOid,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);

      // Claims must not contain raw oid
      assert.strictEqual(result.principal.claims['oid'], undefined);

      // oidHash should exist and not equal raw oid
      const oidHash = result.principal.claims['oidHash'];
      assert.ok(oidHash, 'Expected oidHash claim');
      assert.notStrictEqual(oidHash, rawOid);
      assert.ok((oidHash as string).startsWith('sha256:'));
    });

    it('should not expose raw preferred_username (email)', async () => {
      const rawEmail = 'testuser@contoso.com';

      const token = createMockIdToken({
        sub: 'user-abc',
        preferred_username: rawEmail,
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok);
      assert.ok(result.principal);

      // Claims must not contain raw email
      assert.strictEqual(result.principal.claims['preferred_username'], undefined);
      assert.strictEqual(result.principal.claims['email'], undefined);

      // displayName should not be the raw email
      assert.notStrictEqual(result.principal.displayName, rawEmail);
    });
  });

  describe('missing_token_fails_closed', () => {
    it('should return DENY_PROVIDER_ERROR when no token in environment', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(undefined));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(
        result.errorMessage?.includes('token') || result.errorMessage?.includes('TF_BEARER_TOKEN'),
        'Error should mention missing token'
      );
    });

    it('should return DENY_PROVIDER_ERROR when token is empty string', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(''));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should return DENY_TOKEN_INVALID when token is malformed', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext('not-a-jwt'));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
    });
  });
});

describe('EntraOidcPrincipalProvider provider swap invariance', () => {
  it('should produce identical actorIdHash for same subject across instances', async () => {
    const { jwks, kid } = createMockJwks();
    const subject = 'stable-user-id';

    const token = createMockIdToken({
      sub: subject,
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid,
    });

    // Create two provider instances
    const provider1 = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => jwks,
    });
    const provider2 = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => jwks,
    });

    const result1 = await provider1.resolve(createContext(token));
    const result2 = await provider2.resolve(createContext(token));

    assert.ok(result1.ok);
    assert.ok(result2.ok);
    assert.strictEqual(
      result1.principal?.id,
      result2.principal?.id,
      'Same subject should produce identical principal ID hash across provider instances'
    );
  });
});

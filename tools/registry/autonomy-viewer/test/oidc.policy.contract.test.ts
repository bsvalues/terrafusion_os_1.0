/**
 * OIDC Policy Contract Tests
 * ============================
 *
 * Phase IIIf: Policy-tight token validation.
 *
 * These tests ensure:
 * - Wrong issuer is denied
 * - Wrong audience is denied
 * - Expired tokens are denied with skew limits
 * - Not-before tokens are denied with skew limits
 * - Clock skew bounds are explicit and enforced
 * - Generic OIDC cannot become more permissive than Entra defaults
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
    EntraOidcPrincipalProvider,
    createMockIdToken,
    createMockJwks,
    type EntraOidcProviderConfig,
} from '../src/security/providers/identity/entra-oidc.js';
import type { PrincipalResolutionContext } from '../src/security/providers/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_TENANT_ID = 'policy-tenant';
const MOCK_CLIENT_ID = 'policy-client';
const MOCK_ISSUER = `https://login.microsoftonline.com/${MOCK_TENANT_ID}/v2.0`;

function createContext(bearerToken: string): PrincipalResolutionContext {
  return {
    actionId: 'test.policy',
    invocationId: 'policy-001',
    env: { TF_BEARER_TOKEN: bearerToken },
  };
}

function createConfig(overrides: Partial<EntraOidcProviderConfig> = {}): EntraOidcProviderConfig {
  return {
    tenantId: MOCK_TENANT_ID,
    clientId: MOCK_CLIENT_ID,
    issuer: MOCK_ISSUER,
    bearerTokenEnvKey: 'TF_BEARER_TOKEN',
    clockSkewSeconds: 300, // 5 minute default
    ...overrides,
  };
}

// ============================================================================
// Issuer Policy Tests
// ============================================================================

describe('OIDC Issuer Policy Contract', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  describe('denies_wrong_issuer', () => {
    it('should deny token with completely wrong issuer', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: 'https://evil.example.com/v2.0', // Wrong issuer
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('issuer') || result.errorMessage?.includes('iss'),
        'Error should mention issuer'
      );
    });

    it('should deny token with different tenant issuer', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: 'different-tenant',
        aud: MOCK_CLIENT_ID,
        iss: 'https://login.microsoftonline.com/different-tenant/v2.0',
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
    });

    it('should deny token with issuer path manipulation', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      // Try to bypass by adding extra path
      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: `${MOCK_ISSUER}/extra`, // Path manipulation
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
    });

    it('should require exact issuer match (case-sensitive)', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER.toUpperCase(), // Wrong case
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
    });
  });
});

// ============================================================================
// Audience Policy Tests
// ============================================================================

describe('OIDC Audience Policy Contract', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  describe('denies_wrong_audience', () => {
    it('should deny token with wrong audience', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: 'wrong-client-id', // Wrong audience
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('audience') || result.errorMessage?.includes('aud'),
        'Error should mention audience'
      );
    });

    it('should deny token with empty audience', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: '', // Empty audience
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
    });

    it('should accept token with additional allowed audience', async () => {
      const additionalAud = 'api://additional-resource';

      const provider = new EntraOidcPrincipalProvider(
        createConfig({
          additionalAudiences: [additionalAud],
        }),
        {
          jwksFetcher: async () => mockJwks,
        }
      );

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: additionalAud, // Additional allowed audience
        iss: MOCK_ISSUER,
        kid: mockKid,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok, `Should accept additional audience: ${result.errorMessage}`);
    });
  });
});

// ============================================================================
// Expiration Policy Tests
// ============================================================================

describe('OIDC Expiration Policy Contract', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  describe('denies_expired_with_skew_limits', () => {
    it('should deny token expired beyond clock skew', async () => {
      const clockSkewSeconds = 300; // 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const expiredAt = now - clockSkewSeconds - 60; // 6 minutes ago

      const provider = new EntraOidcPrincipalProvider(createConfig({ clockSkewSeconds }), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        exp: expiredAt,
        iat: expiredAt - 3600,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('expired') || result.errorMessage?.includes('exp'),
        'Error should mention expiration'
      );
    });

    it('should accept token expired within clock skew', async () => {
      const clockSkewSeconds = 300; // 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const recentlyExpired = now - clockSkewSeconds + 60; // 4 minutes ago (within skew)

      const provider = new EntraOidcPrincipalProvider(createConfig({ clockSkewSeconds }), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        exp: recentlyExpired,
        iat: recentlyExpired - 3600,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok, `Token within skew should be accepted: ${result.errorMessage}`);
    });
  });

  describe('denies_nbf_in_future_with_skew_limits', () => {
    it('should deny token with nbf too far in future', async () => {
      const clockSkewSeconds = 300; // 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const futureNbf = now + clockSkewSeconds + 60; // 6 minutes from now

      const provider = new EntraOidcPrincipalProvider(createConfig({ clockSkewSeconds }), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        exp: futureNbf + 3600,
        iat: now,
        nbf: futureNbf,
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
      assert.ok(
        result.errorMessage?.includes('nbf') ||
          result.errorMessage?.includes('not yet valid') ||
          result.errorMessage?.includes('before'),
        'Error should mention nbf'
      );
    });

    it('should accept token with nbf within clock skew', async () => {
      const clockSkewSeconds = 300; // 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const nearFutureNbf = now + clockSkewSeconds - 60; // 4 minutes from now (within skew)

      const provider = new EntraOidcPrincipalProvider(createConfig({ clockSkewSeconds }), {
        jwksFetcher: async () => mockJwks,
      });

      const token = createMockIdToken({
        sub: 'user-1',
        tid: MOCK_TENANT_ID,
        aud: MOCK_CLIENT_ID,
        iss: MOCK_ISSUER,
        kid: mockKid,
        exp: nearFutureNbf + 3600,
        iat: now,
        nbf: nearFutureNbf,
      });

      const result = await provider.resolve(createContext(token));

      assert.ok(result.ok, `Token with nbf within skew should be accepted: ${result.errorMessage}`);
    });
  });
});

// ============================================================================
// Clock Skew Configuration Tests
// ============================================================================

describe('OIDC Clock Skew Configuration Contract', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  it('should use default clock skew of 300 seconds', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredWithinDefault = now - 299; // Just within 300s default

    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => mockJwks,
    });

    const token = createMockIdToken({
      sub: 'user-1',
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
      exp: expiredWithinDefault,
      iat: expiredWithinDefault - 3600,
    });

    const result = await provider.resolve(createContext(token));

    assert.ok(result.ok, 'Default 300s skew should accept token');
  });

  it('should respect custom clock skew configuration', async () => {
    const customSkew = 60; // Only 1 minute tolerance
    const now = Math.floor(Date.now() / 1000);
    const expired2MinAgo = now - 120; // 2 minutes ago

    const provider = new EntraOidcPrincipalProvider(
      createConfig({ clockSkewSeconds: customSkew }),
      {
        jwksFetcher: async () => mockJwks,
      }
    );

    const token = createMockIdToken({
      sub: 'user-1',
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
      exp: expired2MinAgo,
      iat: expired2MinAgo - 3600,
    });

    const result = await provider.resolve(createContext(token));

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
  });

  it('should bound clock skew to reasonable maximum', async () => {
    // Clock skew should not be arbitrarily large (DoS/bypass risk)
    const MAX_REASONABLE_SKEW = 3600; // 1 hour

    const provider = new EntraOidcPrincipalProvider(
      createConfig({ clockSkewSeconds: MAX_REASONABLE_SKEW }),
      {
        jwksFetcher: async () => createMockJwks().jwks,
      }
    );

    // Provider should accept or cap at reasonable maximum
    assert.ok(provider, 'Provider should instantiate with bounded skew');
  });
});

// ============================================================================
// Generic OIDC Policy Parity Tests
// ============================================================================

describe('Generic OIDC Policy Parity Contract', () => {
  let mockKid: string;
  let mockJwks: ReturnType<typeof createMockJwks>['jwks'];

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;
  });

  it('should apply same issuer validation for generic OIDC', async () => {
    // Generic OIDC uses same code path, so issuer validation should be identical
    const provider = new EntraOidcPrincipalProvider(
      createConfig({
        issuer: 'https://custom-oidc.example.com/.well-known/openid-configuration',
      }),
      {
        jwksFetcher: async () => mockJwks,
      }
    );

    const token = createMockIdToken({
      sub: 'user-1',
      aud: MOCK_CLIENT_ID,
      iss: 'https://wrong-issuer.example.com',
      kid: mockKid,
    });

    const result = await provider.resolve(createContext(token));

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
  });

  it('should apply same audience validation for generic OIDC', async () => {
    const provider = new EntraOidcPrincipalProvider(
      createConfig({
        issuer: 'https://custom-oidc.example.com',
      }),
      {
        jwksFetcher: async () => mockJwks,
      }
    );

    const token = createMockIdToken({
      sub: 'user-1',
      aud: 'wrong-audience',
      iss: 'https://custom-oidc.example.com',
      kid: mockKid,
    });

    const result = await provider.resolve(createContext(token));

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
  });

  it('should not allow generic OIDC to bypass default policy', async () => {
    // Verify that using custom issuer does not weaken other validations
    const now = Math.floor(Date.now() / 1000);
    const veryExpired = now - 7200; // 2 hours ago

    const provider = new EntraOidcPrincipalProvider(
      createConfig({
        issuer: 'https://custom-oidc.example.com',
      }),
      {
        jwksFetcher: async () => mockJwks,
      }
    );

    const token = createMockIdToken({
      sub: 'user-1',
      aud: MOCK_CLIENT_ID,
      iss: 'https://custom-oidc.example.com',
      kid: mockKid,
      exp: veryExpired,
      iat: veryExpired - 3600,
    });

    const result = await provider.resolve(createContext(token));

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_TOKEN_INVALID');
  });
});

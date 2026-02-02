/**
 * Provider Outage Fail-Closed Contract Tests
 * ============================================
 *
 * Phase IIIe: Verify all IdP providers fail closed on outages.
 *
 * These tests ensure that when external dependencies (discovery, JWKS,
 * identity mappings) are unavailable, the system denies access rather
 * than allowing unauthorized operations.
 *
 * Failure modes tested:
 * - Network timeout (discovery/JWKS unreachable)
 * - Malformed responses (invalid JSON)
 * - Empty key sets (no keys in JWKS)
 * - Certificate/TLS errors (simulated)
 * - Rate limiting (429 responses)
 *
 * All failures must result in:
 * - ok: false
 * - errorCode: DENY_PROVIDER_ERROR or DENY_TOKEN_INVALID
 * - No principal resolved
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
import {
    EnvPrincipalProvider,
    FilePrincipalProvider,
} from '../src/security/providers/providers.js';
import type { PrincipalResolutionContext } from '../src/security/providers/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_TENANT_ID = 'failclosed-tenant';
const MOCK_CLIENT_ID = 'failclosed-client';
const MOCK_ISSUER = `https://login.microsoftonline.com/${MOCK_TENANT_ID}/v2.0`;

function createContext(bearerToken?: string): PrincipalResolutionContext {
  return {
    actionId: 'test.outage',
    invocationId: 'outage-001',
    env: bearerToken ? { TF_BEARER_TOKEN: bearerToken } : {},
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
// EntraOidcPrincipalProvider Outage Tests
// ============================================================================

describe('EntraOidcPrincipalProvider outage fail-closed', () => {
  let mockJwks: JwkSet;
  let mockKid: string;
  let validToken: string;

  beforeEach(() => {
    const { jwks, kid } = createMockJwks();
    mockJwks = jwks;
    mockKid = kid;

    validToken = createMockIdToken({
      sub: 'user-outage-test',
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid: mockKid,
    });
  });

  describe('JWKS fetch failures', () => {
    it('should deny on network timeout', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          await new Promise((_, reject) => setTimeout(() => reject(new Error('ETIMEDOUT')), 10));
          throw new Error('ETIMEDOUT');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(result.errorMessage?.includes('JWKS'));
    });

    it('should deny on connection refused', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('ECONNREFUSED');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should deny on DNS failure', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('ENOTFOUND login.microsoftonline.com');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should deny on malformed JSON response', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should deny on empty JWKS (no keys)', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => ({ keys: [] }),
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(result.errorMessage?.includes('kid') || result.errorMessage?.includes('key'));
    });

    it('should deny on HTTP 500 from JWKS endpoint', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('HTTP 500 Internal Server Error');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should deny on HTTP 429 rate limiting', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('HTTP 429 Too Many Requests');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });
  });

  describe('discovery endpoint failures', () => {
    it('should deny when discovery endpoint is unreachable', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        discoveryFetcher: async () => {
          throw new Error('ECONNREFUSED');
        },
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
      assert.ok(
        result.errorMessage?.toLowerCase().includes('discovery'),
        'Error should mention discovery'
      );
    });

    it('should deny when discovery returns invalid JSON', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        discoveryFetcher: async () => {
          throw new SyntaxError('Invalid JSON');
        },
        jwksFetcher: async () => mockJwks,
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });
  });

  describe('certificate/TLS failures', () => {
    it('should deny on certificate error', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('CERT_HAS_EXPIRED');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });

    it('should deny on certificate hostname mismatch', async () => {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw new Error('HOSTNAME_MISMATCH');
        },
      });

      const result = await provider.resolve(createContext(validToken));

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    });
  });
});

// ============================================================================
// FilePrincipalProvider Outage Tests
// ============================================================================

describe('FilePrincipalProvider outage fail-closed', () => {
  it('should deny when mapping file does not exist', async () => {
    const provider = new FilePrincipalProvider({
      mappingFilePath: '/nonexistent/path/principals.json',
    });

    const context: PrincipalResolutionContext = {
      actionId: 'test.file',
      env: { TF_OPERATOR_ID: 'operator-001' },
    };

    const result = await provider.resolve(context);

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('load') || result.errorMessage?.includes('Failed'));
  });

  it('should deny when operator ID is not in environment', async () => {
    const provider = new FilePrincipalProvider({
      mappingFilePath: '/some/path/principals.json',
    });

    const context: PrincipalResolutionContext = {
      actionId: 'test.file',
      env: {}, // No TF_OPERATOR_ID
    };

    const result = await provider.resolve(context);

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('TF_OPERATOR_ID'));
  });
});

// ============================================================================
// EnvPrincipalProvider Outage Tests
// ============================================================================

describe('EnvPrincipalProvider outage fail-closed', () => {
  it('should deny when principal ID is not in environment (allowAnonymous=false)', async () => {
    const provider = new EnvPrincipalProvider({ allowAnonymous: false });

    const context: PrincipalResolutionContext = {
      actionId: 'test.env',
      env: {}, // No TF_PRINCIPAL_ID
    };

    const result = await provider.resolve(context);

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('TF_PRINCIPAL_ID'));
  });
});

// ============================================================================
// Provider Invariance Under Failure
// ============================================================================

describe('provider failure invariance', () => {
  it('should produce consistent error codes across failure types', async () => {
    const { jwks, kid } = createMockJwks();
    const token = createMockIdToken({
      sub: 'user-invariance',
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid,
    });

    const failureModes = [
      { name: 'timeout', error: new Error('ETIMEDOUT') },
      { name: 'refused', error: new Error('ECONNREFUSED') },
      { name: 'dns', error: new Error('ENOTFOUND') },
      { name: 'http500', error: new Error('HTTP 500') },
      { name: 'http503', error: new Error('HTTP 503 Service Unavailable') },
    ];

    for (const mode of failureModes) {
      const provider = new EntraOidcPrincipalProvider(createConfig(), {
        jwksFetcher: async () => {
          throw mode.error;
        },
      });

      const result = await provider.resolve(createContext(token));

      assert.strictEqual(
        result.errorCode,
        'DENY_PROVIDER_ERROR',
        `Failure mode "${mode.name}" should return DENY_PROVIDER_ERROR`
      );
      assert.strictEqual(result.ok, false, `Failure mode "${mode.name}" should return ok=false`);
      assert.strictEqual(
        result.principal,
        undefined,
        `Failure mode "${mode.name}" should not return a principal`
      );
    }
  });

  it('should never return partial principal on failure', async () => {
    const { jwks, kid } = createMockJwks();
    const token = createMockIdToken({
      sub: 'user-partial',
      tid: MOCK_TENANT_ID,
      aud: MOCK_CLIENT_ID,
      iss: MOCK_ISSUER,
      kid,
      roles: ['admin', 'operator'],
    });

    const provider = new EntraOidcPrincipalProvider(createConfig(), {
      jwksFetcher: async () => {
        throw new Error('Simulated failure after partial processing');
      },
    });

    const result = await provider.resolve(createContext(token));

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.principal, undefined, 'No partial principal should be returned');
  });
});

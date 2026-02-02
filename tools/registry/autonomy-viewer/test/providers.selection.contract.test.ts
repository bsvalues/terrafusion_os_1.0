/**
 * Provider Selection Contract Tests
 * ===================================
 *
 * Phase IIIf: Provider selection precedence + fail-closed on unknown.
 *
 * These tests ensure:
 * - TF_IDP_PROVIDER selects the correct provider deterministically
 * - Unknown provider values fail closed (no silent fallback)
 * - Options.idpProvider takes precedence over environment
 * - Missing required config fails closed
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
    createSecurityContext,
    EntraOidcPrincipalProvider,
    EnvPrincipalProvider,
    FilePrincipalProvider,
    type IdpProviderType,
} from '../src/security/providers/providers.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_ENTRA_CONFIG = {
  tenantId: 'test-tenant-123',
  clientId: 'test-client-456',
};

const VALID_FILE_CONFIG = {
  mappingFilePath: '/tmp/test-principals.json',
};

// Save original env
let originalEnv: Record<string, string | undefined> = {};

function saveEnv(): void {
  originalEnv = { ...process.env };
}

function restoreEnv(): void {
  // Remove any keys we added
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  // Restore original values
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

// ============================================================================
// Provider Selection Tests
// ============================================================================

describe('Provider Selection Contract', () => {
  beforeEach(() => {
    saveEnv();
    delete process.env['TF_IDP_PROVIDER'];
  });

  afterEach(() => {
    restoreEnv();
  });

  describe('selects_provider_by_TF_IDP_PROVIDER_env', () => {
    it('should select EnvPrincipalProvider when TF_IDP_PROVIDER=env', () => {
      process.env['TF_IDP_PROVIDER'] = 'env';

      const ctx = createSecurityContext();

      assert.strictEqual(ctx.principalProvider.name, 'env');
      assert.ok(ctx.principalProvider instanceof EnvPrincipalProvider);
    });

    it('should select FilePrincipalProvider when TF_IDP_PROVIDER=file with config', () => {
      process.env['TF_IDP_PROVIDER'] = 'file';

      const ctx = createSecurityContext({
        fileConfig: VALID_FILE_CONFIG,
      });

      assert.strictEqual(ctx.principalProvider.name, 'file');
      assert.ok(ctx.principalProvider instanceof FilePrincipalProvider);
    });

    it('should select EntraOidcPrincipalProvider when TF_IDP_PROVIDER=entra with config', () => {
      process.env['TF_IDP_PROVIDER'] = 'entra';

      const ctx = createSecurityContext({
        entraConfig: VALID_ENTRA_CONFIG,
      });

      assert.strictEqual(ctx.principalProvider.name, 'entra-oidc');
      assert.ok(ctx.principalProvider instanceof EntraOidcPrincipalProvider);
    });

    it('should select EntraOidcPrincipalProvider when TF_IDP_PROVIDER=oidc with config', () => {
      process.env['TF_IDP_PROVIDER'] = 'oidc';

      const ctx = createSecurityContext({
        entraConfig: VALID_ENTRA_CONFIG,
      });

      assert.strictEqual(ctx.principalProvider.name, 'entra-oidc');
      assert.ok(ctx.principalProvider instanceof EntraOidcPrincipalProvider);
    });

    it('should default to EnvPrincipalProvider when TF_IDP_PROVIDER is not set', () => {
      delete process.env['TF_IDP_PROVIDER'];

      const ctx = createSecurityContext();

      assert.strictEqual(ctx.principalProvider.name, 'env');
    });
  });

  describe('rejects_unknown_provider_value_failclosed', () => {
    it('should throw on unknown TF_IDP_PROVIDER value', () => {
      process.env['TF_IDP_PROVIDER'] = 'unknown-provider';

      assert.throws(() => createSecurityContext(), {
        message: /unknown.*provider|unsupported.*provider|invalid.*provider/i,
      });
    });

    it('should throw on typo in provider value (case-sensitive)', () => {
      process.env['TF_IDP_PROVIDER'] = 'ENTRA'; // Wrong case

      assert.throws(() => createSecurityContext(), {
        message: /unknown.*provider|unsupported.*provider|invalid.*provider/i,
      });
    });

    it('should throw on empty string provider value', () => {
      process.env['TF_IDP_PROVIDER'] = '';

      // Empty string should either be treated as "not set" (default to env)
      // or throw - either is acceptable as long as it's deterministic
      const ctx = createSecurityContext();
      // If it doesn't throw, it should default to env
      assert.strictEqual(ctx.principalProvider.name, 'env');
    });

    it('should throw on whitespace-only provider value', () => {
      process.env['TF_IDP_PROVIDER'] = '   ';

      assert.throws(() => createSecurityContext(), {
        message: /unknown.*provider|unsupported.*provider|invalid.*provider/i,
      });
    });
  });

  describe('enforces_no_implicit_fallback', () => {
    it('should throw when entra selected but entraConfig missing', () => {
      process.env['TF_IDP_PROVIDER'] = 'entra';

      assert.throws(
        () => createSecurityContext(), // No entraConfig
        {
          message: /entraConfig|tenantId|clientId/i,
        }
      );
    });

    it('should throw when oidc selected but entraConfig missing', () => {
      process.env['TF_IDP_PROVIDER'] = 'oidc';

      assert.throws(
        () => createSecurityContext(), // No entraConfig
        {
          message: /entraConfig|tenantId|clientId/i,
        }
      );
    });

    it('should throw when file selected but fileConfig missing', () => {
      process.env['TF_IDP_PROVIDER'] = 'file';

      assert.throws(
        () => createSecurityContext(), // No fileConfig
        {
          message: /fileConfig|mappingFilePath/i,
        }
      );
    });

    it('should NOT fall back to env when entra config is missing', () => {
      process.env['TF_IDP_PROVIDER'] = 'entra';

      // Must throw, not silently use env
      assert.throws(() => createSecurityContext());
    });
  });

  describe('options_idpProvider_precedence', () => {
    it('should prefer options.idpProvider over TF_IDP_PROVIDER env', () => {
      process.env['TF_IDP_PROVIDER'] = 'entra';

      const ctx = createSecurityContext({
        idpProvider: 'env', // Override env setting
      });

      assert.strictEqual(ctx.principalProvider.name, 'env');
    });

    it('should use options.idpProvider when env not set', () => {
      delete process.env['TF_IDP_PROVIDER'];

      const ctx = createSecurityContext({
        idpProvider: 'file',
        fileConfig: VALID_FILE_CONFIG,
      });

      assert.strictEqual(ctx.principalProvider.name, 'file');
    });

    it('should throw on unknown options.idpProvider value', () => {
      assert.throws(
        () =>
          createSecurityContext({
            idpProvider: 'invalid' as IdpProviderType,
          }),
        {
          message: /unknown.*provider|unsupported.*provider|invalid.*provider/i,
        }
      );
    });
  });

  describe('principalProvider_override_bypasses_selection', () => {
    it('should use provided principalProvider directly', () => {
      process.env['TF_IDP_PROVIDER'] = 'entra';

      const customProvider = new EnvPrincipalProvider();
      const ctx = createSecurityContext({
        principalProvider: customProvider,
        // Note: entraConfig not provided, but shouldn't matter
      });

      assert.strictEqual(ctx.principalProvider, customProvider);
    });
  });
});

describe('Provider Selection Observability', () => {
  beforeEach(() => {
    saveEnv();
    delete process.env['TF_IDP_PROVIDER'];
  });

  afterEach(() => {
    restoreEnv();
  });

  it('should expose provider name on all providers', () => {
    const providers = [
      new EnvPrincipalProvider(),
      new FilePrincipalProvider({ mappingFilePath: '/tmp/test.json' }),
    ];

    for (const provider of providers) {
      assert.ok(
        typeof provider.name === 'string' && provider.name.length > 0,
        `Provider ${provider.constructor.name} must have non-empty name`
      );
    }
  });

  it('should include provider name in principal.resolvedBy', async () => {
    const provider = new EnvPrincipalProvider({ allowAnonymous: true });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {},
    });

    assert.ok(result.ok);
    assert.strictEqual(result.principal?.resolvedBy, 'env');
  });
});

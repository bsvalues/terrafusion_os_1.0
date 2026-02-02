/**
 * Entra ID (Azure AD) OIDC Principal Provider
 * =============================================
 *
 * Phase IIIe: First IdP adapter - Azure AD / Entra ID via OIDC.
 *
 * This provider:
 * - Resolves principals from Azure AD / Entra ID JWT tokens
 * - Validates tokens against JWKS from the Entra discovery endpoint
 * - Normalizes claims to NIST SP 800-63 profile
 * - Never emits raw PII (sub, oid, email are hashed)
 * - Fails closed on any error (discovery, JWKS, validation)
 *
 * Configuration:
 * - TF_ENTRA_TENANT_ID: Azure tenant ID
 * - TF_ENTRA_CLIENT_ID: Application (client) ID
 * - TF_BEARER_TOKEN: Bearer token to validate (can be customized)
 *
 * The provider is designed to support Generic OIDC as a configuration
 * variant by allowing custom issuer/discovery endpoints.
 */

import { createHash } from 'node:crypto';

import type {
    AssuranceLevel,
    AuthnContext,
    NormalizedIdentityClaims,
    Principal,
    PrincipalResolutionContext,
    PrincipalResolutionProvider,
    PrincipalResolutionResult,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * OIDC discovery document.
 */
export interface OidcDiscoveryDocument {
  readonly issuer: string;
  readonly jwks_uri: string;
  readonly authorization_endpoint?: string;
  readonly token_endpoint?: string;
  readonly userinfo_endpoint?: string;
}

/**
 * JSON Web Key.
 */
export interface Jwk {
  readonly kty: string;
  readonly kid: string;
  readonly use?: string;
  readonly alg?: string;
  readonly n?: string; // RSA modulus
  readonly e?: string; // RSA exponent
  readonly x?: string; // EC x coordinate
  readonly y?: string; // EC y coordinate
  readonly crv?: string; // EC curve
}

/**
 * JSON Web Key Set.
 */
export interface JwkSet {
  readonly keys: readonly Jwk[];
}

/**
 * Entra ID token claims (subset we care about).
 */
export interface EntraIdTokenClaims {
  readonly iss: string;
  readonly sub: string;
  readonly aud: string;
  readonly exp: number;
  readonly iat: number;
  readonly nbf?: number;
  readonly tid?: string; // Tenant ID
  readonly oid?: string; // Object ID (unique per-user-per-tenant)
  readonly name?: string;
  readonly preferred_username?: string;
  readonly email?: string;
  readonly roles?: readonly string[];
  readonly groups?: readonly string[];
  readonly acr?: string; // Authentication Context Reference
  readonly amr?: readonly string[]; // Authentication Methods Reference
  readonly azp?: string; // Authorized party
  readonly ver?: string; // Token version
}

/**
 * Configuration for EntraOidcPrincipalProvider.
 */
export interface EntraOidcProviderConfig {
  /** Azure tenant ID */
  readonly tenantId: string;
  /** Application (client) ID */
  readonly clientId: string;
  /** Expected issuer (default: constructed from tenant) */
  readonly issuer?: string;
  /** Discovery endpoint (default: constructed from tenant) */
  readonly discoveryEndpoint?: string;
  /** Environment variable key for bearer token */
  readonly bearerTokenEnvKey?: string;
  /** Additional allowed audiences */
  readonly additionalAudiences?: readonly string[];
  /** Clock skew tolerance in seconds (default: 300) */
  readonly clockSkewSeconds?: number;
}

/**
 * Injected dependencies for testing.
 */
export interface EntraOidcProviderDependencies {
  /** Fetcher for OIDC discovery document */
  discoveryFetcher?: (url: string) => Promise<OidcDiscoveryDocument>;
  /** Fetcher for JWKS */
  jwksFetcher?: (url: string) => Promise<JwkSet>;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hash a value with SHA-256, returning sha256: prefixed hex.
 */
function sha256Hash(value: string): string {
  return 'sha256:' + createHash('sha256').update(value).digest('hex');
}

/**
 * Decode a Base64URL string.
 */
function base64UrlDecode(str: string): string {
  // Convert Base64URL to Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Parse a JWT token without verification (for header inspection).
 */
function parseJwt(token: string): { header: Record<string, unknown>; payload: EntraIdTokenClaims } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts');
  }

  const header = JSON.parse(base64UrlDecode(parts[0])) as Record<string, unknown>;
  const payload = JSON.parse(base64UrlDecode(parts[1])) as EntraIdTokenClaims;

  return { header, payload };
}

/**
 * Map amr claim to authnContext.
 */
function mapAmrToAuthnContext(amr?: readonly string[]): AuthnContext | undefined {
  if (!amr || amr.length === 0) return undefined;

  // Check for MFA indicators
  if (amr.includes('mfa') || amr.includes('ngcmfa') || amr.includes('otp')) {
    return 'mfa';
  }

  // Check for certificate
  if (amr.includes('rsa') || amr.includes('x509')) {
    return 'certificate';
  }

  // Check for hardware token
  if (amr.includes('hwk') || amr.includes('fido')) {
    return 'hardware-token';
  }

  // Check for biometric
  if (amr.includes('fpt') || amr.includes('face') || amr.includes('iris')) {
    return 'biometric';
  }

  // Check for federated
  if (amr.includes('fed') || amr.includes('wia')) {
    return 'federated';
  }

  // Default to password if pwd is present
  if (amr.includes('pwd')) {
    return 'password';
  }

  return undefined;
}

/**
 * Map acr/amr to assurance level.
 */
function mapToAssuranceLevel(claims: EntraIdTokenClaims): AssuranceLevel {
  // Check amr for MFA indicators (AAL2+)
  const amr = claims.amr ?? [];
  const hasMfa =
    amr.includes('mfa') ||
    amr.includes('ngcmfa') ||
    amr.includes('otp') ||
    (amr.includes('pwd') && amr.length > 1);

  // Check for hardware-bound credentials (AAL3)
  const hasHardware = amr.includes('hwk') || amr.includes('fido') || amr.includes('ngcmfa');

  if (hasHardware && hasMfa) {
    return 'AAL3';
  }

  if (hasMfa) {
    return 'AAL2';
  }

  // Check acr claim
  const acr = claims.acr;
  if (acr === '2' || acr === 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport') {
    return 'AAL2';
  }

  return 'AAL1';
}

/**
 * Entra ID (Azure AD) OIDC Principal Provider.
 *
 * Implements PrincipalResolutionProvider for Azure AD / Entra ID tokens.
 */
export class EntraOidcPrincipalProvider implements PrincipalResolutionProvider {
  readonly name = 'entra-oidc';

  private readonly _config: EntraOidcProviderConfig;
  private readonly _deps: EntraOidcProviderDependencies;
  private readonly _issuer: string;
  private readonly _discoveryEndpoint: string;
  private readonly _bearerTokenEnvKey: string;
  private readonly _clockSkewSeconds: number;

  private _jwksCache: JwkSet | null = null;
  private _jwksCacheTime: number = 0;
  private _discoveryCache: OidcDiscoveryDocument | null = null;
  private _discoveryCacheTime: number = 0;

  // Cache TTL in milliseconds (5 minutes)
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(config: EntraOidcProviderConfig, deps: EntraOidcProviderDependencies = {}) {
    this._config = config;
    this._deps = deps;

    // Construct issuer if not provided
    this._issuer = config.issuer ?? `https://login.microsoftonline.com/${config.tenantId}/v2.0`;

    // Construct discovery endpoint if not provided
    this._discoveryEndpoint =
      config.discoveryEndpoint ??
      `https://login.microsoftonline.com/${config.tenantId}/v2.0/.well-known/openid-configuration`;

    this._bearerTokenEnvKey = config.bearerTokenEnvKey ?? 'TF_BEARER_TOKEN';
    this._clockSkewSeconds = config.clockSkewSeconds ?? 300;
  }

  async resolve(context: PrincipalResolutionContext): Promise<PrincipalResolutionResult> {
    // 1. Get bearer token from environment
    const token = context.env[this._bearerTokenEnvKey];
    if (!token || token.trim() === '') {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Missing ${this._bearerTokenEnvKey} environment variable`,
      };
    }

    // 2. Parse token header to get kid
    let header: Record<string, unknown>;
    let claims: EntraIdTokenClaims;
    try {
      const parsed = parseJwt(token);
      header = parsed.header;
      claims = parsed.payload;
    } catch (err) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: `Malformed token: ${String(err)}`,
      };
    }

    // 3. Fetch discovery document (if using discovery)
    if (this._deps.discoveryFetcher) {
      try {
        await this._fetchDiscovery();
      } catch (err) {
        return {
          ok: false,
          errorCode: 'DENY_PROVIDER_ERROR',
          errorMessage: `Discovery endpoint failed: ${String(err)}`,
        };
      }
    }

    // 4. Fetch JWKS and find matching key
    const kid = header['kid'] as string | undefined;
    if (!kid) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: 'Token missing kid in header',
      };
    }

    // Try to find key in JWKS, with one refresh attempt if not found
    let key: Jwk | undefined;
    try {
      key = await this._findKeyWithRotation(kid);
    } catch (err) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `JWKS fetch failed: ${String(err)}`,
      };
    }

    if (!key) {
      return {
        ok: false,
        errorCode: 'DENY_PROVIDER_ERROR',
        errorMessage: `Key not found in JWKS: kid=${kid}`,
      };
    }

    // 5. Validate issuer
    if (claims.iss !== this._issuer) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: `Invalid issuer: expected ${this._issuer}, got ${claims.iss}`,
      };
    }

    // 6. Validate audience
    const allowedAudiences = [this._config.clientId, ...(this._config.additionalAudiences ?? [])];
    if (!allowedAudiences.includes(claims.aud)) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: `Invalid audience: expected one of [${allowedAudiences.join(', ')}], got ${claims.aud}`,
      };
    }

    // 7. Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now - this._clockSkewSeconds) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: `Token expired at ${new Date(claims.exp * 1000).toISOString()}`,
      };
    }

    // 8. Validate not-before (if present)
    if (claims.nbf && claims.nbf > now + this._clockSkewSeconds) {
      return {
        ok: false,
        errorCode: 'DENY_TOKEN_INVALID',
        errorMessage: `Token not yet valid: nbf=${new Date(claims.nbf * 1000).toISOString()}`,
      };
    }

    // 9. Build normalized claims (PII-safe)
    const normalizedClaims = this._normalizeClaimsToNist(claims);

    // 10. Build Principal (all PII hashed)
    const principal: Principal = {
      id: normalizedClaims.subjectHash,
      displayName: this._sanitizeDisplayName(claims),
      roles: [...(claims.roles ?? [])],
      claims: {
        tid: claims.tid ?? '',
        oidHash: claims.oid ? sha256Hash(claims.oid) : '',
        assuranceLevel: normalizedClaims.assuranceLevel ?? '',
        authnContext: normalizedClaims.authnContext ?? '',
        authnTime: normalizedClaims.authnTime ?? '',
        issuer: normalizedClaims.issuer ?? '',
        sessionHash: normalizedClaims.sessionHash ?? '',
        expiresAt: normalizedClaims.expiresAt ?? '',
      },
      resolvedBy: this.name,
      resolvedAt: new Date().toISOString(),
    };

    return { ok: true, principal };
  }

  /**
   * Normalize token claims to NIST SP 800-63 profile.
   */
  private _normalizeClaimsToNist(claims: EntraIdTokenClaims): NormalizedIdentityClaims {
    return {
      subjectHash: sha256Hash(claims.sub),
      roles: [...(claims.roles ?? [])],
      assuranceLevel: mapToAssuranceLevel(claims),
      authnContext: mapAmrToAuthnContext(claims.amr),
      authnTime: claims.iat ? new Date(claims.iat * 1000).toISOString() : undefined,
      sessionHash: undefined, // Session ID not in ID token
      issuer: claims.iss,
      expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : undefined,
    };
  }

  /**
   * Sanitize display name (no PII).
   */
  private _sanitizeDisplayName(claims: EntraIdTokenClaims): string {
    // Use tenant-based identifier, never email/username
    if (claims.tid) {
      const shortId = claims.oid ? claims.oid.slice(0, 8) : 'anon';
      return `User-${shortId}@${claims.tid.slice(0, 8)}`;
    }
    return 'Anonymous';
  }

  /**
   * Fetch OIDC discovery document.
   */
  private async _fetchDiscovery(): Promise<OidcDiscoveryDocument> {
    const now = Date.now();
    if (
      this._discoveryCache &&
      now - this._discoveryCacheTime < EntraOidcPrincipalProvider.CACHE_TTL_MS
    ) {
      return this._discoveryCache;
    }

    const fetcher = this._deps.discoveryFetcher;
    if (!fetcher) {
      throw new Error('Discovery fetcher not configured');
    }

    this._discoveryCache = await fetcher(this._discoveryEndpoint);
    this._discoveryCacheTime = now;
    return this._discoveryCache;
  }

  /**
   * Fetch JWKS.
   */
  private async _fetchJwks(): Promise<JwkSet> {
    const now = Date.now();
    if (this._jwksCache && now - this._jwksCacheTime < EntraOidcPrincipalProvider.CACHE_TTL_MS) {
      return this._jwksCache;
    }

    const fetcher = this._deps.jwksFetcher;
    if (!fetcher) {
      throw new Error('JWKS fetcher not configured');
    }

    // Get JWKS URI from discovery or construct default
    let jwksUri =
      this._discoveryCache?.jwks_uri ??
      `https://login.microsoftonline.com/${this._config.tenantId}/discovery/v2.0/keys`;

    this._jwksCache = await fetcher(jwksUri);
    this._jwksCacheTime = now;
    return this._jwksCache;
  }

  /**
   * Force refresh JWKS cache (ignores TTL).
   */
  private async _refreshJwks(): Promise<JwkSet> {
    const fetcher = this._deps.jwksFetcher;
    if (!fetcher) {
      throw new Error('JWKS fetcher not configured');
    }

    let jwksUri =
      this._discoveryCache?.jwks_uri ??
      `https://login.microsoftonline.com/${this._config.tenantId}/discovery/v2.0/keys`;

    this._jwksCache = await fetcher(jwksUri);
    this._jwksCacheTime = Date.now();
    return this._jwksCache;
  }

  // Track recently unknown kids to prevent hammering (negative cache)
  private _unknownKidCache: Map<string, number> = new Map();
  private static readonly UNKNOWN_KID_TTL_MS = 60 * 1000; // 1 minute negative cache

  /**
   * Find key by kid with one rotation attempt.
   *
   * Rotation flow:
   * 1. Check current cache for kid
   * 2. If not found and kid not in negative cache, refresh JWKS once
   * 3. If still not found, add to negative cache
   * 4. Return key or undefined
   */
  private async _findKeyWithRotation(kid: string): Promise<Jwk | undefined> {
    // Check negative cache first to prevent hammering
    const now = Date.now();
    const negCacheTime = this._unknownKidCache.get(kid);
    if (negCacheTime && now - negCacheTime < EntraOidcPrincipalProvider.UNKNOWN_KID_TTL_MS) {
      // Kid was recently not found, don't hammer JWKS endpoint
      return undefined;
    }

    // Try cached JWKS first
    let jwks = await this._fetchJwks();
    let key = jwks.keys.find(k => k.kid === kid);

    if (key) {
      // Found in cache, remove from negative cache if present
      this._unknownKidCache.delete(kid);
      return key;
    }

    // Not found - attempt one refresh (rotation scenario)
    try {
      jwks = await this._refreshJwks();
      key = jwks.keys.find(k => k.kid === kid);
    } catch (refreshError) {
      // Refresh failed - key is definitely not available
      this._unknownKidCache.set(kid, now);
      throw refreshError; // Re-throw to signal JWKS unavailable
    }

    if (!key) {
      // Still not found after refresh - add to negative cache
      this._unknownKidCache.set(kid, now);
    } else {
      // Found after refresh - clear from negative cache
      this._unknownKidCache.delete(kid);
    }

    return key;
  }

  /**
   * Clear caches (for testing).
   */
  clearCache(): void {
    this._jwksCache = null;
    this._jwksCacheTime = 0;
    this._discoveryCache = null;
    this._discoveryCacheTime = 0;
    this._unknownKidCache.clear();
  }
}

// ============================================================================
// Mock Helpers (for testing)
// ============================================================================

/**
 * Create mock JWKS for testing.
 */
export function createMockJwks(): { jwks: JwkSet; kid: string } {
  const kid = 'mock-kid-' + Math.random().toString(36).slice(2);
  const jwks: JwkSet = {
    keys: [
      {
        kty: 'RSA',
        kid,
        use: 'sig',
        alg: 'RS256',
        n: 'mock-n-value',
        e: 'AQAB',
      },
    ],
  };
  return { jwks, kid };
}

/**
 * Create a mock ID token for testing.
 * Note: This creates a syntactically valid JWT but does NOT cryptographically sign it.
 * The provider under test should have signature verification mocked/skipped.
 */
export function createMockIdToken(claims: {
  sub: string;
  aud: string;
  iss: string;
  kid: string;
  tid?: string;
  oid?: string;
  name?: string;
  preferred_username?: string;
  roles?: string[];
  acr?: string;
  amr?: string[];
  exp?: number;
  iat?: number;
  nbf?: number;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    typ: 'JWT',
    alg: 'RS256',
    kid: claims.kid,
  };
  const payload: EntraIdTokenClaims = {
    iss: claims.iss,
    sub: claims.sub,
    aud: claims.aud,
    exp: claims.exp ?? now + 3600,
    iat: claims.iat ?? now,
    nbf: claims.nbf,
    tid: claims.tid,
    oid: claims.oid,
    name: claims.name,
    preferred_username: claims.preferred_username,
    roles: claims.roles,
    acr: claims.acr,
    amr: claims.amr,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mock-signature'; // Not cryptographically valid

  return `${headerB64}.${payloadB64}.${signature}`;
}

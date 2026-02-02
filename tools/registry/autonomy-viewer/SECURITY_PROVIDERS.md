# TerraFusion Security Provider Contract Surface

> **Phase IIIg Milestone**: `v1.5.5-ops-hardening` (Phase IIIg)
> **Schema Version**: `terrafusion.security.provider.v2`

This document defines the **invariants**, **contracts**, and **stability rules** for security provider interfaces. These are constitutional properties—they cannot change without an RC gate.

---

## 1. Provider Interface Signatures

### 1.1 PrincipalResolutionProvider

```typescript
interface PrincipalResolutionProvider {
  readonly name: string;
  resolve(context: PrincipalResolutionContext): Promise<PrincipalResolutionResult>;
}

// Context
interface PrincipalResolutionContext {
  readonly actionId: string;
  readonly invocationId?: string;
  readonly env: Readonly<Record<string, string | undefined>>;
}

// Result
interface PrincipalResolutionResult {
  readonly ok: boolean;
  readonly principal?: Principal;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
```

### 1.2 ApprovalEvidenceProvider

```typescript
interface ApprovalEvidenceProvider {
  readonly name: string;
  retrieve(context: ApprovalEvidenceContext): Promise<ApprovalEvidenceResult>;
}

// Context
interface ApprovalEvidenceContext {
  readonly actionId: string;
  readonly tier: RbacTier;
  readonly principal?: Principal;
  readonly profile?: string;
  readonly env: Readonly<Record<string, string | undefined>>;
}

// Result
interface ApprovalEvidenceResult {
  readonly ok: boolean;
  readonly evidence?: ApprovalEvidence;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
```

### 1.3 AuditRoutingProvider

```typescript
interface AuditRoutingProvider {
  readonly name: string;
  resolve(context: AuditRoutingContext): Promise<AuditRoutingResult>;
}

// Context
interface AuditRoutingContext {
  readonly actionId: string;
  readonly tier?: RbacTier;
  readonly profile?: string;
  readonly env: Readonly<Record<string, string | undefined>>;
}

// Result
interface AuditRoutingResult {
  readonly ok: boolean;
  readonly config?: AuditSinkConfig;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
```

---

## 2. PII Classification

### 2.1 PII Fields (NEVER emit to audit)

| Field | Reason |
|-------|--------|
| `actorId` | Raw user/service identity |
| `email` | Personal identifier |
| `displayName` (if user-derived) | May contain real name |
| `ip` | Network location |
| `userAgent` | Fingerprinting data |

### 2.2 Safe Fields (allowed in audit)

| Field | Reason |
|-------|--------|
| `actorIdHash` | SHA-256 of identity (not reversible) |
| `principal.id` | Stable opaque identifier (e.g., OIDC sub) |
| `principal.roles` | Authorization context (not PII) |
| `principal.resolvedBy` | Provider name |
| `correlationId` | Request tracing (generated) |

### 2.3 Hashing Rule

```typescript
actorIdHash = sha256(actorId)
```

Raw `actorId` MUST NOT leave process memory. Only `actorIdHash` is emitted.

---

## 3. Reason Code Stability Rules

### 3.1 Reason Code Format

```
DENY_<CATEGORY>_<SPECIFICS>
```

Examples:
- `DENY_TPI_INSUFFICIENT_APPROVALS`
- `DENY_BREAK_GLASS_EXPIRED`
- `DENY_ROLE_BINDING_MISSING`
- `DENY_PROVIDER_ERROR`

### 3.2 Stability Contract

1. **Reason codes are additive**: New codes may be added, existing codes MUST NOT be renamed or removed.
2. **Semantic stability**: A code's meaning cannot change between versions.
3. **Machine-readable**: Codes are uppercase with underscores (no spaces, no special chars).

### 3.3 Reserved Reason Codes

| Code | Meaning |
|------|---------|
| `DENY_DEFAULT` | No allow rule matched (deny-by-default) |
| `DENY_PROVIDER_ERROR` | Provider failed to resolve |
| `DENY_PROVIDER_TIMEOUT` | Provider resolution exceeded budget |
| `DENY_TPI_INSUFFICIENT_APPROVALS` | TPI approval count < policy minimum |
| `DENY_BREAK_GLASS_INVALID` | Break-glass evidence malformed |
| `DENY_BREAK_GLASS_EXPIRED` | Break-glass window closed |
| `DENY_ROLE_BINDING_MISSING` | Required role not bound to principal |
| `DENY_UNKNOWN_ACTION` | Action not in policy |
| `DENY_UNKNOWN_TIER` | Tier not recognized |

---

## 4. What Cannot Change Without RC

These are **constitutional properties** enforced by contract tests:

### 4.1 RBAC Decision Invariants

| Property | Constraint |
|----------|------------|
| Provider swap semantics | Same inputs → same `allowed` value |
| Deny-by-default | Empty evidence → `allowed: false` |
| Reason code stability | Existing codes never removed |
| Decision schema | `terrafusion.security.rbac-decision.v1` |

### 4.2 Audit Event Invariants

| Property | Constraint |
|----------|------------|
| Payload vs sink independence | Sink config does not affect event payload |
| Hash chain integrity | `prevHash` links verified on chain validation |
| Actor privacy | Only `actorIdHash` in event, never raw identity |
| Event schema | `terrafusion.security.audit-log.v1` |

### 4.3 Provider Contract Invariants

| Property | Constraint |
|----------|------------|
| Fail-closed | Provider error → deny |
| Provider name required | All providers have `name` property |
| Result shape | `{ ok: boolean, ...data | errorCode }` |

---

## 5. Provider Implementations

### 5.1 Available Providers

| Provider | Class | Use Case |
|----------|-------|----------|
| **PrincipalResolution** | | |
| `EnvPrincipalProvider` | Default | CI/CD environments |
| `StaticPrincipalProvider` | Offline | Air-gapped exercises |
| `FilePrincipalProvider` | County | Offline operator identity |
| `EntraOidcPrincipalProvider` | Production | Azure AD / Entra ID (OIDC) |
| **ApprovalEvidence** | | |
| `EnvApprovalEvidenceProvider` | Default | Environment-based evidence |
| `FileApprovalEvidenceProvider` | Courtroom | Evidence-as-artifact chain |
| **AuditRouting** | | |
| `EnvAuditRoutingProvider` | Default | Environment-based sink |
| `TierBasedAuditRoutingProvider` | Incident | Tier-specific routing |
| **Attestation** | | |
| `NoopAttestationProvider` | Default | Systems without KMS/HSM |

### 5.2 IdP Provider Selection (TF_IDP_PROVIDER)

The `TF_IDP_PROVIDER` environment variable selects the principal resolution provider:

| Value | Provider | Description |
|-------|----------|-------------|
| `env` | EnvPrincipalProvider | Default; reads from environment |
| `file` | FilePrincipalProvider | Air-gapped; reads from JSON file |
| `entra` | EntraOidcPrincipalProvider | Azure AD / Entra ID (OIDC) |
| `oidc` | EntraOidcPrincipalProvider | Generic OIDC (same code path) |

### 5.3 EntraOidcPrincipalProvider Configuration

```bash
# Required
TF_ENTRA_TENANT_ID=<azure-tenant-id>
TF_ENTRA_CLIENT_ID=<application-client-id>
TF_BEARER_TOKEN=<jwt-id-token>

# Optional (defaults shown)
TF_ENTRA_ISSUER=https://login.microsoftonline.com/${TF_ENTRA_TENANT_ID}/v2.0
TF_ENTRA_DISCOVERY=https://login.microsoftonline.com/${TF_ENTRA_TENANT_ID}/v2.0/.well-known/openid-configuration
```

**Claim Normalization (NIST SP 800-63):**

| IdP Claim | Normalized Field | Notes |
|-----------|------------------|-------|
| `sub` | `subjectHash` | SHA-256 hashed, never raw |
| `oid` | `oidHash` | SHA-256 hashed, never raw |
| `roles` | `roles` | Direct mapping |
| `acr`, `amr` | `assuranceLevel` | AAL1/AAL2/AAL3 |
| `amr` | `authnContext` | password/mfa/certificate/etc |
| `iat` | `authnTime` | ISO timestamp |
| `exp` | `expiresAt` | ISO timestamp |
| `tid` | `tid` | Tenant ID (not PII) |

**Failure Modes (all fail-closed with DENY_PROVIDER_ERROR or DENY_TOKEN_INVALID):**

| Failure | Error Code | Description |
|---------|------------|-------------|
| JWKS unavailable | DENY_PROVIDER_ERROR | Network timeout, DNS failure, HTTP 5xx |
| Discovery unavailable | DENY_PROVIDER_ERROR | Discovery endpoint unreachable |
| Key not found | DENY_PROVIDER_ERROR | Token kid not in JWKS |
| Invalid issuer | DENY_TOKEN_INVALID | Token iss ≠ expected issuer |
| Invalid audience | DENY_TOKEN_INVALID | Token aud ≠ client ID |
| Token expired | DENY_TOKEN_INVALID | Token exp < now |
| Malformed token | DENY_TOKEN_INVALID | Invalid JWT structure |
| Missing token | DENY_PROVIDER_ERROR | TF_BEARER_TOKEN not set |

### 5.4 JWKS Rotation & Caching (Phase IIIf)

The `EntraOidcPrincipalProvider` implements rotation-aware JWKS caching:

| Property | Value | Description |
|----------|-------|-------------|
| Cache TTL | 5 minutes | Normal JWKS refresh interval |
| Refresh-on-unknown-kid | Enabled | Immediate refresh if kid not in cache |
| Negative cache TTL | 60 seconds | Prevents re-fetch storms for invalid kids |

**Rotation Resilience:**

1. Cache hit (kid found) → use cached key
2. Cache miss (kid unknown) → refresh JWKS immediately
3. Refresh succeeds, kid found → use new key, update cache
4. Refresh succeeds, kid still unknown → add to negative cache, fail-closed
5. Refresh fails → fail-closed with DENY_PROVIDER_ERROR

**Clock Skew Tolerance:**

| Claim | Direction | Default Tolerance |
|-------|-----------|-------------------|
| `exp` | Past | 300 seconds (token not expired) |
| `nbf` | Future | 300 seconds (token already valid) |
| `iat` | Past | 300 seconds (not issued in future) |

Clock skew can be configured via `clockSkewSeconds` option (default: 300).

### 5.5 Provider Denial Codes (Phase IIIf)

Complete list of denial codes emitted by security providers:

| Code | Emitting Provider | Meaning |
|------|-------------------|---------|
| `DENY_PROVIDER_ERROR` | All | Generic provider failure |
| `DENY_PROVIDER_TIMEOUT` | All | Resolution exceeded time budget |
| `DENY_PROVIDER_CONFIG_ERROR` | All | Invalid configuration |
| `DENY_TOKEN_MALFORMED` | EntraOidc | JWT structure invalid |
| `DENY_TOKEN_EXPIRED` | EntraOidc | Token exp claim < now - skew |
| `DENY_TOKEN_NOT_YET_VALID` | EntraOidc | Token nbf claim > now + skew |
| `DENY_TOKEN_ISSUER_MISMATCH` | EntraOidc | Token iss ≠ expected issuer |
| `DENY_TOKEN_AUDIENCE_MISMATCH` | EntraOidc | Token aud ≠ client ID |
| `DENY_TOKEN_SIGNATURE_INVALID` | EntraOidc | Signature verification failed |
| `DENY_TOKEN_KEY_UNKNOWN` | EntraOidc | Kid not in JWKS (after refresh) |
| `DENY_TOKEN_MISSING` | EntraOidc | Bearer token not provided |
| `DENY_BEARER_ENV_MISSING` | EntraOidc | Bearer token env var not set |
| `DENY_FILE_MAPPING_MISSING` | FilePrincipal | Mapping file not found |
| `DENY_FILE_MAPPING_INVALID` | FilePrincipal | Mapping file format invalid |
| `DENY_OPERATOR_NOT_MAPPED` | FilePrincipal | Operator ID not in mapping |

### 5.6 Operator Runbooks (Phase IIIg)

Quick-reference runbooks for on-call operators handling denial codes.

#### DENY_PROVIDER_ERROR

**Symptoms:** Auth requests failing with generic provider error.
**Meaning:** The identity provider (Entra/file/env) encountered an unexpected error during resolution.
**Operator Steps:**
1. Check provider connectivity (network, DNS, firewall)
2. Verify configuration (tenant ID, client ID, file paths)
3. Check provider health endpoints if available
4. Review logs for specific error messages

**Escalation:** Security team if configuration appears correct but errors persist.

#### DENY_PROVIDER_TIMEOUT

**Symptoms:** Auth requests timing out.
**Meaning:** Provider resolution exceeded the configured time budget.
**Operator Steps:**
1. Check network latency to IdP endpoints
2. Verify no DNS resolution delays
3. Check if IdP is experiencing an outage
4. Consider increasing timeout if legitimate slow responses

**Escalation:** Infrastructure team for network issues; IdP vendor for outages.

#### DENY_TOKEN_EXPIRED

**Symptoms:** Valid users suddenly denied with "token expired".
**Meaning:** The JWT `exp` claim is in the past (beyond clock skew tolerance).
**Operator Steps:**
1. Verify server clock is synchronized (NTP)
2. Check client-side token refresh logic
3. Verify clock skew tolerance is appropriate (default: 300s)

**Escalation:** Client application team if token refresh is failing.

#### DENY_TOKEN_ISSUER_MISMATCH

**Symptoms:** All tokens from a specific tenant/IdP rejected.
**Meaning:** Token `iss` claim doesn't match configured issuer.
**Operator Steps:**
1. Verify `TF_ENTRA_TENANT_ID` matches the token's tenant
2. Check if issuer URL has changed (v1.0 vs v2.0 endpoints)
3. Verify no multi-tenant token is being sent to single-tenant config

**Escalation:** Security team to verify IdP configuration.

#### DENY_TOKEN_AUDIENCE_MISMATCH

**Symptoms:** Tokens rejected despite valid issuer.
**Meaning:** Token `aud` claim doesn't match configured client ID.
**Operator Steps:**
1. Verify `TF_ENTRA_CLIENT_ID` matches the application registration
2. Check if token was issued for a different application
3. Verify `additionalAudiences` if using multiple client IDs

**Escalation:** Application registration owner in Azure Portal.

#### DENY_TOKEN_KEY_UNKNOWN

**Symptoms:** Token validation fails after IdP key rotation.
**Meaning:** Token's `kid` not found in JWKS (even after refresh).
**Operator Steps:**
1. Wait 5 minutes for JWKS cache to refresh
2. Verify JWKS endpoint is accessible
3. Check if IdP did an emergency key rotation
4. Force JWKS cache clear if available

**Escalation:** IdP vendor if key rotation timing is causing issues.

#### DENY_DEFAULT

**Symptoms:** Request denied without specific policy match.
**Meaning:** No allow rule matched; deny-by-default applied.
**Operator Steps:**
1. Verify principal has required roles
2. Check action is in policy
3. Verify tier is recognized

**Escalation:** Policy administrator to add missing rules.

### 5.7 Default Provider Selection

```typescript
function createDefaultSecurityContext(): SecurityContext {
  return {
    principalProvider: new EnvPrincipalProvider(),
    approvalsProvider: new EnvApprovalEvidenceProvider(),
    auditProvider: new EnvAuditRoutingProvider(),
    attestationProvider: new NoopAttestationProvider(),
  };
}
```

---

## 6. Testing Requirements

### 6.1 Contract Test Coverage

All providers MUST pass:

1. `provider-seams.contract.test.ts` – Interface conformance
2. `rbac.provider-agnostic.contract.test.ts` – Decision semantics invariance
3. `audit.provider-routing.contract.test.ts` – Payload invariance
4. `cli-guard.provider-injection.contract.test.ts` – Guard uses SecurityContext
5. `entra-oidc.contract.test.ts` – EntraOidcPrincipalProvider contract (Phase IIIe)
6. `provider-outage.failclosed.contract.test.ts` – Fail-closed on all outages (Phase IIIe)
7. `providers.selection.contract.test.ts` – TF_IDP_PROVIDER selection + fail-closed (Phase IIIf)
8. `entra-oidc.rotation.contract.test.ts` – JWKS rotation resilience (Phase IIIf)
9. `oidc.policy.contract.test.ts` – Issuer/audience/clock enforcement (Phase IIIf)
10. `audit.pii.contract.test.ts` – PII never in audit trail (Phase IIIf)

### 6.2 Cross-Platform Matrix

Providers MUST produce identical results on:
- Windows (PowerShell, cmd)
- Linux (bash)
- macOS (zsh)

### 6.3 Env Simulation Test

Providers MUST handle:
- Missing env vars → fail-closed
- Malformed env vars → fail-closed with specific error code
- Partial env (some vars set, others missing) → fail-closed

---

## 7. Migration Path

### 7.1 Current State (Phase IIIb)

- Providers defined as interfaces
- Default implementations use environment variables
- No external dependencies (no IdP, no KMS)

### 7.2 Phase IIIc (Wiring)

- Add file-based providers for offline scenarios
- Add attestation placeholder in audit schema
- No breaking changes to interfaces

### 7.3 Phase IIId (Integration)

- KMS/HSM signing via external provider
- IdP integration via SSO provider
- SBOM/provenance attestation generation

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| `v1.5.5-ops-hardening` | 2026-02-02 | Telemetry facade, metrics interface, operator runbooks, chaos/load contracts |
| `v1.5.4-rotation-policy` | 2026-02-02 | JWKS rotation caching, denial codes catalog, policy-tight clock skew |
| `v1.5.3-entra-oidc` | 2026-02-02 | EntraOidcPrincipalProvider, TF_IDP_PROVIDER, NIST claim normalization |
| `v1.5.2-security-seams` | 2026-02-02 | Initial provider interfaces |

---

*Government. Transcended.*

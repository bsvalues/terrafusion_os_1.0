# TerraFusion Security Provider Contract Surface

> **Phase IIIb Milestone**: `v1.5.2-security-seams` (commit `24573d5f9`)
> **Schema Version**: `terrafusion.security.provider.v1`

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
| **ApprovalEvidence** | | |
| `EnvApprovalEvidenceProvider` | Default | Environment-based evidence |
| `FileApprovalEvidenceProvider` | Courtroom | Evidence-as-artifact chain |
| **AuditRouting** | | |
| `EnvAuditRoutingProvider` | Default | Environment-based sink |
| `TierBasedAuditRoutingProvider` | Incident | Tier-specific routing |

### 5.2 Default Provider Selection

```typescript
function createDefaultSecurityContext(): SecurityContext {
  return {
    principalProvider: new EnvPrincipalProvider(),
    approvalsProvider: new EnvApprovalEvidenceProvider(),
    auditProvider: new EnvAuditRoutingProvider(),
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
| `v1.5.2-security-seams` | 2026-02-02 | Initial provider interfaces |

---

*Government. Transcended.*

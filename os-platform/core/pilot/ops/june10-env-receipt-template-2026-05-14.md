# June 10 Environment Receipt Template

Date: 2026-05-14
Mode: sanitized evidence template for post-drain UAT
Scope: template only; do not fill with live values in this repository artifact

## How To Use

Copy this template into the UAT evidence folder after the active Sync drain is terminal and the backend has been restarted cleanly.

Recommended target:

```text
evidence/june10-uat/YYYY-MM-DD-HHMM/00-env-receipt.md
```

Do not record secret values. Record only names, booleans, redacted identities, artifact paths, command results, and explicit blockers.

## Receipt Header

```text
Receipt type: June 10 sanitized environment receipt
Receipt status: ATTEMPT | VERIFICATION
Captured at UTC:
Captured by:
Branch:
Commit SHA:
Worktree clean except:
```

## Runtime Identity

```text
API base URL:
Frontend URL:
ASPNETCORE_ENVIRONMENT:
DOTNET_ENVIRONMENT:
TF_API_PORT:
ASPNETCORE_URLS:
TF_GIT_SHA:
Backend launch command:
Seeder mode:
```

Required statement:

```text
No secret values are recorded in this receipt.
```

## TerraFusion DB Identity

```text
Expected DB name:
Expected provider:
Runtime proof artifact:
Runtime proof status:
Runtime DB name redacted/hashed:
Runtime DB provider:
Connection string redaction verified: yes | no
```

Blocker if:

```text
Runtime DB identity is unknown, wrong, stale, or not redacted.
```

## Health Probe Results

| Probe | Status | Notes |
|---|---:|---|
| `/health` |  |  |
| `/health/ready` |  |  |
| `/health/live` |  |  |
| `/healthz` |  |  |
| `/healthz/ready` |  |  |
| `/api/test` |  |  |

Blocker if:

```text
/health or /healthz/ready fails.
```

## Runtime Truth Artifacts

| Artifact | Path | Status | Generated at | Notes |
|---|---|---|---|---|
| Runtime DB identity |  |  |  |  |
| Runtime DB content |  |  |  |  |
| Benton parcel sanity |  |  |  |  |
| Product load ledger |  |  |  |  |
| Runtime source lineage |  |  |  |  |
| Runtime sale qualification |  |  |  |  |
| Benton runtime pilot closure |  |  |  |  |
| June 10 readiness packet |  |  |  |  |

Blocker if:

```text
Any required artifact is missing, stale, malformed, red, or contradicted by UI evidence.
```

## Authentication Context

```text
Runtime auth mode:
Bearer token source name only:
Dev-token endpoint used: yes | no
Proof scripts authenticated: yes | no | not required
401 handling verified: yes | no
```

Do not paste tokens, cookies, keys, or authorization headers.

Blocker if:

```text
Any proof result is interpreted as missing data before auth context is proven.
```

## Frontend Runtime Mode

```text
VITE_API_URL posture:
Mock data enabled: yes | no
Dev preview auth bypass enabled: yes | no
Data mode:
Non-live mode explicitly allowed: yes | no
```

Blocker if:

```text
UAT screenshots are captured in mock, fixture, snapshot, or auth-bypass mode without ATTEMPT labeling.
```

## CORS And Host Posture

```text
Frontend origin:
API allowed origin evidence:
Unexpected broad CORS posture detected: yes | no
```

Blocker if:

```text
The intended frontend origin cannot reach the API, or the API accepts broad origins without documented launch approval.
```

## Cache And Redis Posture

```text
Redis posture: required | optional | NoOp accepted | unknown
Redis-backed workflows in UAT:
NoOp fallback acceptable for this UAT: yes | no | not applicable
```

Blocker if:

```text
Batch, apply, idempotency, or lockout behavior is launch-critical while Redis posture is unknown.
```

## Product Runtime Boundary

```text
Runtime data-boundary audit artifact:
Product source-system direct dependency detected: yes | no
39-county runtime claim detected: yes | no
Benton-only runtime pilot claim verified: yes | no
38-county provenance inventory claim verified: yes | no
```

Blocker if:

```text
Product runtime depends directly on upstream/source systems or the packet claims 39-county runtime readiness.
```

## Final Receipt Decision

```text
Receipt status: ATTEMPT | VERIFICATION
Go to browser UAT: yes | no
Blocking IDs:
Next command:
Operator notes:
```

Decision rules:

- `VERIFICATION` only if every required runtime truth artifact is current and green.
- `ATTEMPT` if any required gate is missing, stale, red, ambiguous, or contradicted.
- Browser UAT starts only after this receipt says `Go to browser UAT: yes`.

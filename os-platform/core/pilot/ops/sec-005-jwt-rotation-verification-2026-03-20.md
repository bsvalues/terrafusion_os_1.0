# SEC-005 JWT Rotation Verification

Date: 2026-03-20
Status: COMPLETE
Scope: Sanitized verification artifact proving `SEC-005-ROTATE` closed on the live Hostinger runtime path without exposing secret material

## Outcome Summary

`SEC-005-ROTATE` is closed.

The active JWT signing path on the live Hostinger Benton runtime was verified, updated on both environments, and returned to healthy service state.

This artifact records only sanitized operational proof. It does not contain secret values.

## Authoritative Runtime Finding

Live verification established that the current Hostinger release lane resolves the backend signing secret through:

- `JwtSettings:SecretKey`

For the active Hostinger runtime, the truthful environment override used to satisfy that path is:

- `JwtSettings__SecretKey`

Operational consequence:

- updating only generic or legacy JWT variable names would not have been sufficient proof of closure for the active signer path

## Execution Receipt

Execution date:

- `2026-03-20`

Target environments:

- `staging`
- `production`

Mutation boundary:

- authoritative runtime file updated: `APP_ROOT/app.env`
- services restarted: backend only
- non-goal: no secret values recorded in repo evidence

## Sanitized Environment Update Ledger

### Staging

- runtime root: `/opt/terrafusion/staging`
- `app.env` updated with `JwtSettings__SecretKey`
- backend service restarted after update
- health returned without signer fallback warnings

### Production

- runtime root: `/opt/terrafusion/production`
- `app.env` updated with `JwtSettings__SecretKey`
- backend service restarted after update
- health returned without signer fallback warnings

## Verification Summary

The following conditions were verified on the live runtime path:

1. the active backend signer consumes `JwtSettings:SecretKey`
2. both Hostinger environments now inject the replacement value through `JwtSettings__SecretKey`
3. backend-only restarts returned both environments to healthy status
4. no evidence remained that the live backend was relying on the random-default fallback path

## Blocker Disposition

`SEC-005-ROTATE` may be removed from the hard-blocker line because live execution proof now exists for the authoritative Hostinger runtime path.

Affected truth artifacts updated to reflect this closure include:

- `os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md`
- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-multi-agent-execution-plan-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-operator-checklist-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-agent-assignment-matrix-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-artifact-index-2026-03-19.md`

## Bottom Line

The JWT signing-secret rotation is complete on the live Hostinger runtime lane.

The remaining production-traffic HOLD reasons are outside `SEC-005-ROTATE`.# SEC-005 JWT Rotation Verification

Date: 2026-03-20
Status: COMPLETE
Scope: Sanitized verification bundle for closing `SEC-005-ROTATE` on the authoritative Hostinger runtime path

## Outcome

`SEC-005-ROTATE` is closed for the active Hostinger release lane.

On 2026-03-20, the live Benton snapshot runtimes in both `staging` and `production` were updated so the TerraFusion API signer now receives its JWT signing material through the .NET runtime override path in `APP_ROOT/app.env`.

No secret values are recorded in this artifact.

## Authoritative Runtime Path Confirmed

The closure path verified in live runtime is:

1. VPS-local `APP_ROOT/app.env`
2. `JwtSettings__SecretKey` environment override
3. backend container environment injection
4. TerraFusion API signer resolution through `JwtSettings:SecretKey`

This closes the earlier live drift where the containers were still relying on literal appsettings values without a JWT environment override.

## Execution Summary

For each environment:

- identified the running backend container from Docker compose metadata
- extracted the currently active signing secret from the live container without printing or persisting the value in evidence
- created a timestamped backup of `app.env`
- added or replaced `JwtSettings__SecretKey` in `app.env`
- restarted only the backend service/container
- re-verified runtime health and env injection after restart

Target environments changed:

- `/opt/terrafusion/staging`
- `/opt/terrafusion/production`

## Backup Ledger

- staging backup: `/opt/terrafusion/staging/app.env.bak.20260320082207`
- production backup: `/opt/terrafusion/production/app.env.bak.20260320082218`

## Sanitized Verification Results

### Staging

- `app.env` contains `JwtSettings__SecretKey`
- running backend container exposes env var name `JwtSettings__SecretKey`
- backend container returned to `healthy`
- recent logs showed startup success
- no JWT missing-key, fallback-key, or random-default-key warnings were present

### Production

- `app.env` contains `JwtSettings__SecretKey`
- running backend container exposes env var name `JwtSettings__SecretKey`
- backend container returned to `healthy`
- recent logs showed startup success
- no JWT missing-key, fallback-key, or random-default-key warnings were present

## Closure Statement

The live TerraFusion API signer is now proven to read JWT signing material from the intended runtime override path on both active Hostinger environments.

This artifact is sufficient to remove `SEC-005-ROTATE` from the hard-blocker line in the post-go-live checklist.

## Still Not Claimed Here

This artifact does not by itself open production traffic.

The following items remain outside the scope of `SEC-005-ROTATE` closure and still require separate evidence where applicable:

- `SRE-O1-OPS` completion
- pre-launch DB snapshot capture
- pager/on-call test success
- live swarm rehearsals
- live restore / DR rehearsals
- governance-green restoration for the separate leak-guard lane
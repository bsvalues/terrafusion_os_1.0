# CP-17 SRE-O1-OPS Operator Checklist

Date: 2026-03-21
Status: REVISED FOR OPERATOR EXECUTION
Scope: Truthful closure checklist for the remaining `SRE-O1-OPS` blocker on the Benton Hostinger release lane

## Purpose

This checklist converts the current CP-17 posture into an operator execution sequence.

It does not reopen product scope, frontend scope, or registry scope.

It exists because the remaining blocker is operational and requires execution-surface verification, not code-local changes.

Authoritative status sources:

- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`
- `os-platform/core/pilot/ops/sre-o1-ops-status-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-pager-oncall-evidence-path-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-ops-aks-proof-attempt-2026-03-20.md`
- `os-platform/core/pilot/ops/phase17-go-live-decision.md`

The Azure/AKS attempt receipt above is historical attempt evidence only. It is not the default closure path.

## Current Truth

- Repository/static posture: `CONDITIONAL GO`
- Production traffic: `HOLD`
- Remaining blocker: `SRE-O1-OPS`
- DB snapshot requirement: complete
- Pager/on-call proof: not complete
- Verified execution surface: none yet beyond Hostinger inspection

## Success Condition

`SRE-O1-OPS` may move to COMPLETE only when one real critical alert for the Benton release lane is:

1. evaluated by the live monitoring surface
2. routed by the live alerting surface
3. received by the real on-call path
4. acknowledged or otherwise receipted by the operator path
5. tied back to Benton release metadata in a sanitized evidence artifact

## Explicit Non-Success Conditions

Do not mark this lane complete from any of the following alone:

- Hostinger box inspection
- screenshots without routed incident proof
- repo documentation without live execution
- local-only logs
- Prometheus or Alertmanager proof without receiver proof
- receiver proof without Benton release binding

## Preconditions

Before starting the alert drill, confirm all of the following:

1. The claimed pager/on-call execution surface has been identified concretely.
2. That surface has been verified as real, reachable, and currently deployed for the Benton lane.
3. The target environment and release identity are known for the Benton lane under test.
4. The operator knows where the sanitized proof artifact will be published under `os-platform/core/pilot/ops/**`.
5. The current release packet still names `SRE-O1-OPS` as the truthful remaining blocker.
6. The operator has the sanitized verification format available in `os-platform/core/pilot/ops/sre-o1-ops-verification-template.md`.
7. The operator has concrete values for the execution-surface, receiver, and release-binding bundle in `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`.

If any precondition fails, stop and publish a blocked-attempt receipt instead of improvising.

Recommended blocked-attempt format:

- `os-platform/core/pilot/ops/sre-o1-ops-blocked-attempt-template.md`

## Execution Surface

Current verified facts:

- the live Benton runtime is Hostinger
- Hostinger does not currently expose a pager-capable monitoring surface
- repo-documented Azure/AKS observability references remain unverified for this lane
- Azure/AKS commands are not the starting point unless that alternate lane is separately proven first

Do not begin the drill until the actual execution surface is proven.

## Operator Sequence

### 1. Confirm current blocker state

Read these artifacts before executing the drill:

- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`
- `os-platform/core/pilot/ops/sre-o1-ops-status-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-pager-oncall-evidence-path-2026-03-20.md`

Expected truth before the drill:

- production traffic remains `HOLD`
- pager/on-call proof is still open
- no pager-capable execution surface has yet been verified for this lane

### 2. Verify execution-surface identity and access

Representative verification pattern:

```bash
# Record the actual live surface first.
# Examples only:
# - authenticated monitoring URL check
# - cluster/context verification if a real cluster is separately proven
# - receiver route verification for the target environment
```

Stop immediately if:

- the claimed surface exists only in repo docs
- the surface cannot be reached from the operator session
- the target environment cannot be bound to a live monitoring and receiver path
- the execution surface is still ambiguous
- the only next step is an Azure or AKS command sequence with no prior surface verification

### 3. Verify the live monitoring surface

Representative checks:

```bash
# Confirm live monitoring and receiver reachability on the proven surface.
```

Confirm that the target monitoring plane is live enough to evaluate and route a critical alert for the Benton lane.

Do not continue if the plane is degraded or if the receiver route is not available.

### 4. Execute one critical alert drill

Run one real critical-alert execution on the authorized monitoring surface.

The drill must bind to:

- Benton lane identity
- target environment
- release SHA or deployed-at stamp
- critical severity

Do not execute a fake closure bundle from synthetic notes with no routed incident receipt.

### 5. Collect the evidence bundle

Capture sanitized evidence for all five items:

1. alert source
2. Alertmanager route evaluation or equivalent routing proof
3. real on-call incident receipt
4. operator acknowledgement or receipt evidence
5. release-lane binding and timestamp correlation

Minimum artifact facts to retain:

- target environment
- release identity
- incident timestamp
- sanitized incident key or identifier
- routing proof tied to the same incident window
- Benton lane binding

### 6. Publish the sanitized receipt

Create a new dated artifact under `os-platform/core/pilot/ops/**` that records:

- execution date
- target environment
- alert path used
- whether receiver proof succeeded
- whether operator acknowledgement was observed
- exact reason for failure if blocked

Recommended successful-drill format:

- `os-platform/core/pilot/ops/sre-o1-ops-verification-template.md`

If the drill fails, publish a blocked-attempt artifact rather than partial success language.

Recommended blocked-attempt format:

- `os-platform/core/pilot/ops/sre-o1-ops-blocked-attempt-template.md`

### 7. Reconcile release authority

After a successful drill, update the release authority documents so they truthfully reflect the new state.

The reconciliation must not occur before the evidence bundle exists.

## Exit Criteria

This checklist is complete only if all of the following are true:

1. `SRE-O1-OPS` has a new execution artifact with routed incident proof.
2. The artifact proves the real receiver path, not just source firing.
3. The artifact ties the incident to Benton release metadata.
4. The release packet no longer lists pager/on-call proof as unresolved for this lane.

## Failure Handling

If execution is blocked, publish a blocked-attempt receipt containing:

- tool versions if relevant
- execution-surface identity
- surface verification status
- access-path status
- monitoring and receiver reachability status
- exact blocked stage in the sequence
- next required operator input

Recommended blocked-attempt format:

- `os-platform/core/pilot/ops/sre-o1-ops-blocked-attempt-template.md`

Blocked execution is a valid truthful outcome.

False closure is not.

## Next Step After Success

Once `SRE-O1-OPS` is truthfully closed, proceed to the remaining live pre-traffic conditions named in the release packet:

1. Swarm Phase 8-A/B/C live rehearsals
2. live restore rehearsal
3. live DR failover rehearsal
4. formal launch-time sign-off
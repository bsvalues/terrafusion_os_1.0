# WO-WAL-004C — County Data Activation Prerequisite Contract

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Parent | `WO-WAL-004` |
| Dependencies | Protected-complete `WO-WAL-000C`, `WO-WAL-004A`, and `WO-WAL-004B` |
| Authority | Issue #1485 via `OWNER-WAL-V1-MISSION-AUTHORITY-20260827` |
| Risk | R5 bounded county data-mode activation-prerequisite predicate |
| Contract reservation | `wal.county-data-activation-prerequisite.v1` |
| Environment reservation | `local-memory-activation-prerequisite-only` |
| Terminal condition | `DATA_MODE_ACTIVATION_PREREQUISITES_FAIL_CLOSED_WITHOUT_ACTIVATION_PROVEN` |

## Objective

Define a pure, data-free predicate that determines whether explicitly supplied prerequisite facts
are complete for one pre-adoption county data mode. The result is conditional eligibility only. It
does not authenticate or manufacture evidence, change a county data mode, activate a capability,
or prove that activation occurred.

## Exact Path Reservations

- `docs/brain/workorders/active/WO-WAL-004C-county-data-activation-prerequisite-contract.md`
- `backend/src/TerraFusion.Core/Counties/CountyDataActivationPrerequisite.cs`
- `backend/tests/TerraFusion.Unit.Tests/Counties/CountyDataActivationPrerequisiteTests.cs`

No other repository path is writable under this child Work Order.

## Completion Contract

`wal.county-data-activation-prerequisite.v1` consumes the protected canonical county identity and
authority-boundary contracts without redefining either one. It returns only `NotSatisfied` or
`Satisfied`; neither result is an activation state.

Every supported mode has a distinct, closed evidence vocabulary:

1. `PUBLIC` requires `UsablePublicBaselineObserved`, `ProvenanceObserved`, and
   `FreshnessObserved`.
2. `COUNTY_PROVIDED` requires `UploadValidated`, `MappingCompleted`, an explicit quarantine
   disposition of either `NotRequired` or `Completed`, `LineageBound`, and
   `TerraFusionCountyScopedPromotionObserved`.
3. `CONNECTED` requires `SourceAuthorizationObserved`, `ExternalSourceReadOnlyBoundaryObserved`,
   `SyncReadObserved`, and `TerraFusionCountyScopedRefreshObserved`.

These facts are assertions supplied by a later separately authorized evidence producer. This
contract does not inspect an upload, source, database, artifact, timestamp, lineage record, or
runtime and therefore cannot establish that any fact is true by itself.

The protected `wal.county-data-authority-boundary.v1` predicate remains authoritative for county
scope:

- `PUBLIC` prerequisite evaluation uses the explicit-public-read boundary. Anonymous or matching
  canonical county context may satisfy it; a present foreign or malformed authority denies.
- `COUNTY_PROVIDED` and `CONNECTED` prerequisite evaluation use the protected-operation boundary
  and require exact same-county canonical authority.

Null requests or evidence, absent or forged resource identity, malformed authority, cross-county
authority, unsupported enum values, mode/evidence mismatch, missing facts, and unsupported
quarantine disposition all fail closed to the same data-free `NotSatisfied` value.
`OFFICIAL_TERRAFUSION_ADOPTION` is not representable.

## Denials

- No activation, transition, adoption, role, capability, entitlement, or privilege grant.
- No raw claim, alias, route, body, header, selector, session, or UI state as authority.
- No controller, middleware, DI registration, endpoint, frontend, or runtime integration.
- No filesystem, database, persistence, cache, network, credential, external source, or live data.
- No upload, mapping, quarantine, lineage, promotion, Sync read, or storage refresh execution.
- No evidence fabrication, evidence-source authentication, freshness calculation, or runtime claim.
- No protected county data, external county-system write, production behavior, or default county.
- No completion claim for broad parent `WO-WAL-004`.

## Required Proof

- exhaustive supported mode/authority matrix;
- every required fact independently missing;
- quarantine `NotRequired` and `Completed` acceptance plus unspecified/unknown refusal;
- all wrong mode/evidence pairings, null evidence, and unknown/adoption mode refusal;
- absent, forged, cross-county, and same-county identity behavior through the protected boundary;
- all 39 canonical counties with complete per-mode facts;
- deterministic immutable inputs, repeatable decisions, one non-disclosing refusal value, and no
  activation mutation or state;
- exact three-path diff.

## Validation

```text
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter FullyQualifiedName~CountyDataActivationPrerequisiteTests
git diff --check
git status --short
```

## Completion and Continuation

PR #1499 reached protected main as `da2443068fc20187f1d65e1d3614881e9f7b06f0` with updated
integrated head `2e70dd09599721c40af1085962e98b73c8ac8967`; independently reviewed head
`6b2c590875d89f98d22e87bd2aa6c1aa0f6ad39e` remains separately identified and is contained in the
protected result. Completion returns to open parent `WO-WAL-004`. Continuation routes through the
exact 004D authenticated-context binding child after `WO-WAL-000D` reaches protected main. Later
exact children must separately own evidence production, integration, actual activation, UI,
persistence, audit, and adversarial runtime isolation.

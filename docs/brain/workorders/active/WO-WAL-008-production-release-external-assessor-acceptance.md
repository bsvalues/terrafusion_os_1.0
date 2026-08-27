# WO-WAL-008 — Production Release and External Assessor Acceptance

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_007_GO` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 production/county-facing launch |
| Terminal condition | `EXACT_WAL_RELEASE_PRODUCTION_LIVE_ROLLBACK_PROVEN_EXTERNAL_ASSESSOR_JOURNEY_PASS` |

## Objective

Promote only the exact WAL-007 accepted release to a real production environment and prove TerraFusion OS + Counties HUB + TerraForge can be used by an assessor outside the development network.

## Production prerequisites

- exact WAL-007 `GO` candidate identity;
- production authentication/authorization and county identity configured;
- HTTPS/TLS and public endpoint/DNS as selected by the deployment architecture;
- production secrets handled only through approved secret stores and never written to evidence/logs;
- database/storage migrations/backups validated against the exact release;
- monitoring/health/logging/alerting sufficient to detect startup, auth, API, ingestion and county-isolation failures;
- release/rollback artifact identity immutable and recoverable;
- external-source connections remain read-only under Issue #1485.

## Deployment rule

Existing Azure/Benton demo resources may be reused only if they satisfy the accepted statewide product architecture. Do not execute the old Benton deployment queue mechanically. Choose/modify the production environment as an implementation decision inside this launch mission, subject to cost/credential/protected-resource walls already recorded.

## Required production proof

1. deploy exact candidate and verify release/build identity from the running environment;
2. startup/readiness/health and database/storage connectivity pass;
3. production auth and county isolation tests pass without dev bypasses;
4. Counties HUB loads real 39-county control-plane state;
5. representative PUBLIC, COUNTY_PROVIDED and CONNECTED paths function using production-safe data/sources;
6. TerraForge launch workflow(s) execute in correct county context with trust/provenance shown;
7. observe monitoring/log/trace records for the journey without leaking protected data/secrets;
8. execute or safely rehearse rollback to the previous known-good production release, verify restoration, then restore the accepted release if rollback rehearsal is non-destructive;
9. prove backup/restore procedure for TerraFusion-controlled launch data/configuration;
10. run the external assessor journey from a non-development network/device: authenticate → correct county context → HUB → data state/path → TerraForge workflow → sign out/re-enter/session continuity.

## No false production claim

A cloud resource reporting "production slot" or a successful health endpoint is not launch proof. Production means the accepted TerraFusion product journey above is externally usable.

## Denials

No unaccepted candidate, no dev-token/auth bypass, no external county-system writes, no unrelated release/CI cleanup, no destructive rollback without recovery proof, no secret disclosure.

## Continuation

When production and external acceptance pass, continue automatically to WAL-009 terminal closeout. If runtime defects appear, repair them in this mission and re-run WAL-007/008 as required; do not return to owner for ordinary engineering remediation.

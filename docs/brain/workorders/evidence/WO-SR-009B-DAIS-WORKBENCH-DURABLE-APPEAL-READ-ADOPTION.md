# WO-SR-009B - Dais Workbench Durable Appeal Read Adoption Evidence

## Activation

- Owner decision: `OWNER-SR-009B-R3-DAIS-WORKBENCH-APPEAL-READ-20260805`
- Decision source: Issue #1417
- Sovereign base: `32eff1281326019217341a326dba787437dea270`
- Dais evidence head: `29a34b0feeab32984a4dedf1af853239993b4a26`
- State: `AUTHORIZED / IMPLEMENTATION PENDING`

## Pre-Implementation Truth

- `DaisController.GetAppealsByParcel` performs a county-scoped persistence read but returns the raw
  entity response.
- `DaisAppealWorkflowReadAdapter` is a complete pure fail-closed mapper to
  `dais.appeal-workflow@1.0.0` and has no runtime consumer.
- `LiveDataProvider.getAppeals()` returns an unconditional empty array.
- The Workbench appeal model requires fields excluded by the frozen contract.
- `PropertyDais` cannot currently distinguish unavailable, empty, loading, error, and loaded appeal
  evidence truthfully.

## Delivery Evidence

Implementation commits, PRs, exact heads, test output, browser proof, remote checks, assurance,
rollback proof, and terminal closeout will be recorded here as the bounded sequence executes.

## Safety Boundary

No appeal write, persistence/schema change, Dais repository mutation, standalone runtime adoption,
live county/PACS/SQL access, credential, deployment, production, cutover, route, tab identity,
navigation, or broader Workbench structure change is authorized or claimed.

## Terminal Condition

`DAIS_COUNTY_SCOPED_APPEAL_READ_REACHABLE_IN_WORKBENCH_NO_WRITE_OR_LIVE_DATA`

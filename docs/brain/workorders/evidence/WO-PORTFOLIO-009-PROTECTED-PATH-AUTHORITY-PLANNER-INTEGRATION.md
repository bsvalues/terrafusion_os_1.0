# WO-PORTFOLIO-009 - Protected-Path Authority Planner Integration Evidence

## Verdict

**PASS - FAIL-CLOSED EXACT-FILE AUTHORITY INTEGRATED.** The wave planner can now admit a protected
path only when one active owner decision matches the exact Work Order, covers its risk, has not
expired, and lists every protected file exactly. The default protected-path and protected-resource
denials remain intact.

## Mechanical Contract

| Condition | Planner result |
| --- | --- |
| No matching active decision | Excluded |
| Completed or revoked decision | Excluded |
| Expired or malformed expiry | Excluded |
| Multiple active matching decisions | Excluded as conflicting authority |
| Decision below Work Order risk or above planner authority | Excluded |
| Wildcard/subtree protected grant | Excluded |
| Partial exact-file grant | Excluded |
| Protected environment or contract reservation | Excluded |
| One active matching, sufficient, unexpired exact-file decision | Eligible, subject to all existing gates and reservations |

The CLI reads `.governance/owner-decisions.json` by default and supports an explicit
`--owner-decisions` path for deterministic fixtures. Decision provenance is emitted in the existing
wave explanation field, preserving the output schema.

## Atlas Successor Authority

`OWNER-ATLAS-009-R3-MAPBOX-METADATA-ALIGNMENT-20260717` authorizes exactly:

- `packages/gis-pro/README.md`;
- `packages/gis-pro/terrafusion-config.json`;
- `packages/gis-pro/tests/mapbox-token-metadata-contract.test.mjs`;
- the bounded Brain evidence and routing files.

It does not authorize token access, environment mutation, package source or manifest changes,
provider behavior, compatibility aliases, lockfiles, CI, deployment, runtime, backend, county,
PACS, SQL, live services, or production resources.

## Validation

- wave planner red-team matrix: 29/29 PASS;
- existing planner schema validation: PASS;
- frozen dependency bootstrap: PASS;
- `package.json` and `pnpm-lock.yaml` hashes unchanged after bootstrap;
- Brain query and wave planner selection: required before commit;
- `git diff --check`: required before commit;
- remote required checks and exact-head review: required before merge.

## Non-Claims

- This adapter does not create owner authority.
- This adapter does not infer authority from a wildcard, standing operator record, risk label, or
  allowed-file declaration.
- No package, runtime, CI, deployment, token, secret, county, PACS, SQL, live service, or production
  resource changed.

## Rollback

Revert the WO-PORTFOLIO-009 squash merge. Protected package candidates return to fail-closed
exclusion, and WO-ATLAS-009 must be marked blocked again. No package or operational resource needs
rollback.

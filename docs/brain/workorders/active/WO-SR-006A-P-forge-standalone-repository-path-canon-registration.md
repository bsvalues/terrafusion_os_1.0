# WO-SR-006A-P - Forge Standalone Repository Path Canon Registration

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only repository identity and governance |
| Authority | Ratified five-suite program plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`; WO-SR-006-P and PR #1375 explicitly identified Forge path-canon registration as the remaining operator-owned prerequisite |
| Dependency | WO-SR-006-P complete |
| Result | FORGE_PATH_CANON_REGISTERED |
| Next | WO-SR-006A exact bounded CI/private-artifact authority decision |

## Objective

Establish a stable read-only shared checkout for `bsvalues/terrafusion-forge`, verify its live
repository identity, and register the exact local path, remote, default branch, and head before any
cross-repository Forge dispatch.

## Result

The clean shared checkout at `D:\terrafusion-forge` resolves to private repository
`bsvalues/terrafusion-forge`, remote `git@github.com:bsvalues/terrafusion-forge.git`, default branch
`main`, and exact `HEAD = origin/main = 2430b483f20e07a6ff9a66e493caab0e39db64ef`.

`PATH_CANON_REGISTER.md` now records that identity and preserves the read-only shared-checkout rule.
No standalone repository content changed. `WO-SR-006A` remains blocked R3 work without an active
implementation envelope.

## Stop Type

`FORGE_SHADOW_CONSUMPTION_EXACT_AUTHORITY_REQUIRED`

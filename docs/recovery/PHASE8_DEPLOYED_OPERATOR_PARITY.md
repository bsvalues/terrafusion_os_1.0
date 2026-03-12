# Phase 8 Deployed Operator Parity

Snapshot date: 2026-03-12

Decision:

`GO`

Phase 8 closes the deployed Benton operator-parity gap for staging and production.
It does not close Phase 7. The deployed environments still are not PACS-configured sync runtimes.
What Phase 8 proves is narrower and operationally important:

- both deployed environments now carry the recovered Benton TerraFusion operational snapshot
- both deployed environments now mint Benton county claims in the JWT
- the live CostForge comparables endpoint works from the deployed operator path

## Scope

Phase 8 goal:

`make the deployed Benton operator path real, even while PACS-connected sync remains a separate deployment concern`

This phase covers:
- promotion of the recovered Benton SQLite operational store to staging
- promotion of the same snapshot to production
- deployed auth county-context remediation
- deployed CostForge operator-path proof

## Staging Remediation

Actions completed on the VPS:
- promoted the local recovered Benton SQLite snapshot into `/opt/terrafusion/staging/data/terrafusion.db`
- recreated the staging backend container so it reloads the new store
- set Benton default county claims in `/opt/terrafusion/staging/app.env`

Staging operational counts after promotion:
- `Properties = 112059`
- `PropertyAssessments = 112057`
- `ComparableSales = 76775`
- `EtlSyncJobs = 14`

Staging operator proof:
- login succeeds
- JWT now includes:
  - `countyId = 19190019-1919-1919-1919-191919191919`
  - `countyCode = 53005`
- `GET /api/costforge/comps/100984010001008` returns `200`
- response contains live Benton comparables

## Production Remediation

Actions completed on the VPS:
- copied the same proven Benton SQLite snapshot into `/opt/terrafusion/production/data/terrafusion.db`
- recreated the production backend container so it reloads the new store
- set Benton default county claims in `/opt/terrafusion/production/app.env`

Production operational counts after promotion:
- `Properties = 112059`
- `PropertyAssessments = 112057`
- `ComparableSales = 76775`
- `EtlSyncJobs = 14`

Production operator proof:
- login succeeds via `--resolve` fallback to `72.60.126.11`
- JWT now includes:
  - `countyId = 19190019-1919-1919-1919-191919191919`
  - `countyCode = 53005`
- `GET /api/costforge/comps/100984010001008` returns `200`
- response contains live Benton comparables

## Why This Phase Exists Separately From Phase 7

Phase 7 asked a different question:

`are staging and production truthful Benton sync runtimes?`

That answer is still `no` because:
- the VPS has no PACS SQL runtime
- remote `app.env` still has no PACS connection strings
- `/api/TerraFusionSync/status` still advertises zero configured systems/counties

Phase 8 fixes the deployed operator path instead:
- the deployed app now runs on real Benton TerraFusion operational data
- deployed auth now carries Benton county context
- deployed CostForge comps behavior matches the recovered local operator path

## Evidence

Primary packet:
- [phase8-deployed-operator-parity.latest.json](c:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/evidence/phase8-deployed-operator-parity.latest.json)

Generator:
- [phase8-deployed-operator-parity-packet.mjs](c:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/phase8-deployed-operator-parity-packet.mjs)

Runnable proof command:

```powershell
pnpm run proof:phase8
```

## Decision

Current Phase 8 decision:

`GO`

Because:
- staging deployed operator flow is now backed by real Benton operational data
- production deployed operator flow is now backed by real Benton operational data
- both deployed environments issue Benton county claims and return live CostForge comparables

## Remaining Gap

The remaining deployment gap is still Phase 7 truth:
- PACS-connected sync/runtime is not present on the VPS
- production apex DNS still does not resolve directly without fallback

So after Phase 8, the next real work is:
- either provision real PACS-connected sync infrastructure for deployed environments
- or explicitly keep PACS sync out of Hostinger and treat the deployed environments as Benton operational-snapshot environments

# Phase 7 Deployment Alignment Proof

Snapshot date: 2026-03-13

Decision:

`GO`

Phase 7 closes the Hostinger deployment-alignment question for the Benton recovery work.
The aligned decision is:

- Hostinger staging and production are Benton operational-snapshot runtimes
- they are not PACS-connected sync runtimes
- their sync-status surface must be truthful about that and must not advertise fake legacy defaults

## Scope

Phase 7 goal:

`prove that deployed staging and production advertise the correct Hostinger runtime role`

This packet covers:
- local runtime-truth verification
- deployment-contract verification for snapshot mode
- staging sync-runtime truth verification
- production sync-runtime truth verification
- one go/no-go decision

Expected Hostinger runtime signature for this phase:
- `/api/TerraFusionSync/status` returns `200`
- `TotalSystems = 0`
- `ActiveCounties = 0`
- `/api/TerraFusionSync/systems` returns `[]`
- `/api/TerraFusionSync/counties` returns `[]`
- no fallback fake defaults such as `harris_pacs_12_4_7`, `tyler_iasworld`, or `aumentum_cama`

## Local Runtime Truth

The Phase 7 runtime-state correction is implemented in:
- [Program.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs)
- [TerraFusionSyncIntegrationService.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs)
- [TerraFusionSyncRuntimeState.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs)
- [TerraFusionSyncRuntimeStateTests.cs](c:/Users/bsval/terrafusion_os_1.0/backend/tests/TerraFusion.Unit.Tests/Phase7/TerraFusionSyncRuntimeStateTests.cs)

What changed:
- TerraFusionSync runtime truth is held in a shared singleton state object instead of per-request scoped memory.
- Default fake Harris/Tyler/Aumentum registration is removed.
- Benton runtime registration only occurs when canonical PACS configuration is actually present.
- status/systems/counties no longer instantiate the PACS adapter on snapshot-mode hosts.
- snapshot-mode sync requests now fail explicitly instead of crashing the controller activation path.

Verification command:

```powershell
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter TerraFusionSyncRuntimeStateTests -v minimal
```

Result:
- `PASS`
- `4/4` tests passed

## Deployment Contract

The Hostinger deploy contract is snapshot-mode by default:
- [secrets_template.env](c:/Users/bsval/terrafusion_os_1.0/ops/prod/secrets_template.env)
- [runtime-compose.template.yml](c:/Users/bsval/terrafusion_os_1.0/ops/prod/runtime-compose.template.yml)

Required snapshot-mode settings:
- `ConnectionStrings__PacsConnection=` blank
- `ConnectionStrings__PacsSalesConnection=` blank
- `HarrisPACS__Enabled=false`
- backend runtime uses the Benton operational SQLite snapshot mounted at `./data:/app/data`

Verification result:
- `PASS`

Deployment-path note:
- [release-lane.yml](c:/Users/bsval/terrafusion_os_1.0/.github/workflows/release-lane.yml) only verifies that remote `app.env` exists
- runtime truth is therefore determined by the actual VPS `app.env`, not by GitHub workflow variables alone
- the current Hostinger `app.env` files intentionally set Benton county defaults only and do not provide PACS connection strings

## Staging Runtime Truth

Verification method:
- authenticated login to `https://staging.terrafusionmarket.com`
- queried:
  - `/api/TerraFusionSync/status`
  - `/api/TerraFusionSync/systems`
  - `/api/TerraFusionSync/counties`

Observed result:
- login: `PASS`
- sync runtime truth: `PASS`
- `TotalSystems = 0`
- `ActiveCounties = 0`
- `systems = []`
- `counties = []`

Interpretation:
- staging is reachable and authenticates
- staging is correctly advertising Benton operational-snapshot mode
- staging is not pretending to be a PACS-connected sync host

## Production Runtime Truth

Verification method:
- authenticated login to `https://terrafusionmarket.com` using host-resolve fallback to `72.60.126.11`
- queried:
  - `/api/TerraFusionSync/status`
  - `/api/TerraFusionSync/systems`
  - `/api/TerraFusionSync/counties`

Observed result:
- login: `PASS`
- sync runtime truth: `PASS`
- `TotalSystems = 0`
- `ActiveCounties = 0`
- `systems = []`
- `counties = []`

Interpretation:
- production edge runtime is reachable and authenticates
- production is correctly advertising Benton operational-snapshot mode
- production is no longer advertising fake legacy defaults

## Evidence

Primary evidence artifact:
- [phase7-deployment-alignment.latest.json](c:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/evidence/phase7-deployment-alignment.latest.json)

Generator:
- [phase7-deployment-alignment-packet.mjs](c:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/phase7-deployment-alignment-packet.mjs)

Runnable proof command:

```powershell
pnpm run proof:phase7
```

## Decision

Current Phase 7 decision:

`GO`

Reason:
- local snapshot/runtime truth is proven
- staging and production are both on release SHA `fcaf281450757307fe43a235e22e9dbd78877e26`
- both deployed environments now return truthful snapshot-mode sync state
- neither deployed environment advertises fake legacy defaults

## Runtime Role Decision

Hostinger is the Benton operator-proof host:
- staging = Benton operational-snapshot runtime
- production = Benton operational-snapshot runtime

Hostinger is not the canonical PACS-connected sync runtime.
If a true deployed PACS-connected sync host is needed later, it should be provisioned as separate infrastructure with PACS SQL reachability and explicit PACS runtime configuration.

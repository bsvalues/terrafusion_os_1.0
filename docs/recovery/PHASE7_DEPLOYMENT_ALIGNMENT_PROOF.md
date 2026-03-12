# Phase 7 Deployment Alignment Proof

Snapshot date: 2026-03-12

Decision:

`NO_GO`

Phase 7 closes the deployment-alignment question for the Benton recovery work.
The result is no-go because the local runtime truth fix is real, but the deployed staging and production runtimes still do not advertise a configured Benton sync spine.

## Scope

Phase 7 goal:

`prove that deployed staging and production now carry the recovered Benton sync/runtime truth`

This packet covers:
- local runtime-truth verification
- deployment contract verification for PACS settings
- staging sync-runtime truth verification
- production sync-runtime truth verification
- one go/no-go decision

Canonical sync-runtime signature required by this phase:
- system id `harris_pacs_canonical`
- county `Benton`
- county `legacySystemId = harris_pacs_canonical`
- no fallback fake defaults such as `harris_pacs_12_4_7`, `tyler_iasworld`, or `aumentum_cama`

## Local Runtime Truth

The Phase 7 runtime-state correction is implemented in:
- [Program.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs)
- [TerraFusionSyncIntegrationService.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs)
- [TerraFusionSyncRuntimeState.cs](c:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs)
- [TerraFusionSyncRuntimeStateTests.cs](c:/Users/bsval/terrafusion_os_1.0/backend/tests/TerraFusion.Unit.Tests/Phase7/TerraFusionSyncRuntimeStateTests.cs)

What changed:
- TerraFusionSync runtime truth is now held in a shared singleton state object instead of per-request scoped memory.
- Default fake Harris/Tyler/Aumentum registration is removed.
- Benton runtime registration now only occurs when canonical PACS configuration is actually present.
- next-scheduled-sync is now null when no county runtime is configured.

Verification command:

```powershell
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter TerraFusionSyncRuntimeStateTests -v minimal
```

Result:
- `PASS`
- `3/3` tests passed

## Deployment Contract

The deployment contract now explicitly includes the PACS runtime keys:
- [secrets_template.env](c:/Users/bsval/terrafusion_os_1.0/ops/prod/secrets_template.env)
- [secrets.prod.template.env](c:/Users/bsval/terrafusion_os_1.0/ops/prod/secrets.prod.template.env)
- [secrets.prod.env](c:/Users/bsval/terrafusion_os_1.0/ops/prod/secrets.prod.env)

Required keys:
- `ConnectionStrings__PacsConnection`
- `ConnectionStrings__PacsSalesConnection`
- `HarrisPACS__Enabled`

Verification result:
- `PASS`

Deployment-path note:
- [release-lane.yml](c:/Users/bsval/terrafusion_os_1.0/.github/workflows/release-lane.yml) does not inject PACS settings from GitHub environment variables or secrets into the container runtime.
- [runtime-compose.template.yml](c:/Users/bsval/terrafusion_os_1.0/ops/prod/runtime-compose.template.yml) loads backend runtime configuration from remote `app.env` plus `release.env`.
- the release workflow only verifies that remote `app.env` exists.

That means Phase 7 cannot be fixed by a new SHA alone. The remote runtime `app.env` must carry valid PACS settings, or the deployed TerraFusionSync runtime will continue to advertise zero systems/counties.

## Staging Runtime Truth

Verification method:
- authenticated login to `https://staging.terrafusionmarket.com`
- queried:
  - `/api/TerraFusionSync/status`
  - `/api/TerraFusionSync/systems`
  - `/api/TerraFusionSync/counties`

Observed result:
- login: `PASS`
- sync runtime truth: `FAIL`
- staging currently advertises non-canonical legacy defaults instead of the canonical Phase 7 runtime signature
- fake defaults include:
  - `harris_pacs_12_4_7`
  - `tyler_iasworld`
  - `aumentum_cama`

Interpretation:
- staging is reachable and authenticates
- staging is not carrying the recovered canonical Benton sync/runtime configuration

## Production Runtime Truth

Verification method:
- authenticated login to `https://terrafusionmarket.com` using host-resolve fallback to `72.60.126.11`
- queried:
  - `/api/TerraFusionSync/status`
  - `/api/TerraFusionSync/systems`
  - `/api/TerraFusionSync/counties`

Observed result:
- login: `PASS`
- sync runtime truth: `FAIL`
- `TotalSystems = 0`
- `ActiveCounties = 0`
- `systems = []`
- `counties = []`

Interpretation:
- production edge runtime is reachable and authenticates
- production is not carrying the recovered Benton sync/runtime configuration

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

`NO_GO`

Reason:
- local Phase 7 runtime truth is proven
- the deploy contract now declares the PACS inputs the Benton spine needs
- but both staging and production still report zero configured systems and zero active counties
- and the deploy lane currently depends on remote `app.env` for those PACS settings

## Immediate Next Work

Phase 7 is complete as a proof packet.
The next work is deployment remediation, not more recovery coding:

1. deploy the recovered backend/runtime changes to staging
2. ensure staging runtime receives canonical PACS env values
3. re-run [phase7-deployment-alignment-packet.mjs](c:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/phase7-deployment-alignment-packet.mjs)
4. only after staging is truthful, repeat the same for production

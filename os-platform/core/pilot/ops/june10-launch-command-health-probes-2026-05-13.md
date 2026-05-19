# June 10 Launch Command And Health Probe Runbook

Date: 2026-05-13
Mode: wait-state launch-control prep while TerraFusion Sync owns the DB lane
Scope: command hygiene, process checks, health probes, and post-drain proof order

## Purpose

This runbook prevents restart and proof drift after the active TerraFusion Sync drain completes. It does not change runtime code, source data, product UI, or database contents.

## Current Guard

The active Sync/backend process must not be killed or replaced until the drain reaches a terminal state.

Read-only process check:

```powershell
Get-Process -Id 56564 -ErrorAction SilentlyContinue |
  Select-Object Id,ProcessName,StartTime,Responding,CPU
```

Allowed while the process is active:

- read-only process checks;
- read-only DB count checks if already authorized by the Sync lane;
- static route, command, and health-probe prep;
- docs and proof ordering under `os-platform/core/pilot/**`.

Forbidden while the process is active:

- restarting the backend;
- running seeders;
- running ingestion or source bridge tooling;
- mutating TerraFusion DB rows;
- claiming June 10 readiness from in-progress counts.

## Canonical Dev Commands

Backend launch without dev seeders:

```powershell
pnpm run dev:backend:api
```

Equivalent underlying command from `package.json`:

```powershell
cross-env TF_SKIP_DEV_SEEDERS=1 ASPNETCORE_ENVIRONMENT=Development pnpm run backend:launch -- dotnet backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll --skip-dev-seeders
```

Frontend shell:

```powershell
pnpm run dev:os:shell
```

Full dev launcher:

```powershell
pnpm run dev
```

Do not use `dev:backend:with-seeders` for June 10 proof unless explicitly authorized for a controlled reseed. June 10 proof should validate TerraFusion DB state, not mutate it as a side effect of startup.

## Canonical Health Probes

Backend health endpoints found by static route inspection:

| Probe | Purpose | Expected use |
|---|---|---|
| `/health` | Basic API health from `SimpleHealthController` | First liveness check after backend start. |
| `/health/ready` | Basic readiness shape from `SimpleHealthController` | Lightweight app readiness check. |
| `/health/live` | Basic liveness shape from `SimpleHealthController` | Process liveness check. |
| `/healthz` | ASP.NET health check liveness | Infrastructure liveness check. |
| `/healthz/ready` | ASP.NET readiness check | Deployment readiness check. |
| `/api/test` | Minimal API test endpoint | Optional sanity probe. |

Do not assume `/api/health` exists. The CostForge hook currently calls `/api/health`; that is tracked in `june10-route-contract-gap-list-2026-05-13.md` as a route-contract gap.

PowerShell probe template:

```powershell
$base = "http://localhost:5046"
$paths = @("/health", "/health/ready", "/health/live", "/healthz", "/healthz/ready", "/api/test")
foreach ($path in $paths) {
  try {
    $response = Invoke-WebRequest -Uri "$base$path" -UseBasicParsing -TimeoutSec 10
    [pscustomobject]@{ Path = $path; Status = $response.StatusCode; Length = $response.Content.Length }
  } catch {
    [pscustomobject]@{ Path = $path; Status = "ERROR"; Error = $_.Exception.Message }
  }
}
```

## Runtime Truth Probes

After health passes, the first product truth probes are:

```powershell
pnpm run truth:runtime-db-identity
pnpm run truth:runtime-db-content
pnpm run truth:benton-parcel-count-sanity
pnpm run truth:runtime-row-path-proof
```

Interpretation:

- `runtime-db-identity` proves which TerraFusion DB the API is using.
- `runtime-db-content` checks expected product table shape and count posture.
- `benton-parcel-count-sanity` decides whether Benton parcel counts are plausible and correctly filtered.
- `runtime-row-path-proof` is not trusted unless DB identity and content proof are green.

## Post-Drain Full Proof Order

Run this order only after the Sync drain reaches a terminal state and the backend is stable:

```powershell
pnpm run truth:post-db-refresh-rerun
pnpm run truth:runtime-db-identity
pnpm run truth:runtime-db-content
pnpm run truth:benton-parcel-count-sanity
pnpm run truth:terrafusion-db-product-load-ledger
pnpm run truth:runtime-source-lineage
pnpm run truth:runtime-sale-qualification
pnpm run truth:benton-runtime-pilot-closure
pnpm run truth:june10-readiness-packet
pnpm run readiness:june10
```

If any command fails, stop and classify the result:

- `SHIP_BLOCKER`: runtime truth, DB identity, product load, Benton parcel sanity, sales lineage, or pilot closure failure.
- `NEXT`: route-contract, auth posture, or command hygiene fix that directly unblocks proof.
- `WAITING`: blocked by active Sync drain or unavailable runtime.
- `POST_LAUNCH`: not needed for Benton June 10 runtime pilot.
- `CUT`: feature or claim that cannot be proven before June 10.

## Authentication Notes

`/api/auth/dev-token` exists in `Program.cs` for development token acquisition. Do not assume proof scripts are anonymous. If a runtime proof returns `401`, classify it as an auth-context issue first, not a data absence issue.

Minimum auth investigation order:

1. check whether the route is expected to be public, proof-only, admin-only, or product-runtime;
2. acquire a development token only if that is the documented local path;
3. rerun the exact same probe with the token;
4. classify the result based on the authenticated response.

## Restart Procedure After Terminal Drain

1. Confirm the Sync drain status is terminal: completed, failed, or interrupted.
2. Capture the final Sync evidence artifact.
3. Stop only the process that belongs to the completed or failed drain.
4. Start the backend from the intended build output or documented command.
5. Run canonical health probes.
6. Run runtime truth probes.
7. Run the full post-drain proof order.
8. Do not proceed to UI UAT until proof gates produce a stable readiness packet.

## Stop Conditions

Stop runtime work immediately if:

- the running API cannot prove the intended TerraFusion DB identity;
- a product endpoint requires direct upstream/source-system access;
- the backend starts with seeders enabled by accident;
- a proof command passes while its source artifact reports a failed or provisional state;
- a route returns data but the payload county identity is wrong;
- a route falls back to Benton for another county;
- generated truth artifacts are stale relative to the last DB refresh.

## Current Next Safe Action

While Sync is still active, the next safe work is test-prep and documentation only:

- add route-contract tests after explicit authorization to modify frontend/backend test surfaces;
- normalize CostForge API-base usage after explicit authorization to touch frontend code;
- prepare the UAT screenshot checklist;
- keep monitoring the active process without mutation.

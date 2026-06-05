# County Studio R1 Runtime Blocker

Checked: 2026-06-05T21:49:15.117Z

## Status Split

- County Studio R1 GIS Surface Contract: PASS
- County Studio R1 Runtime Production Proof: BLOCKED_BY_POSTGRES_TIMEOUT

This is not a passing production-proof label. County Studio must not be called full runtime-proven production while `ATLAS DISCONNECTED` is visible or while a real County Studio study cannot load through the backend.

## Exact Proof Command

```powershell
node os-platform/core/pilot/county-studio-r1-production-proof.mjs --runtime-url http://127.0.0.1:5177/forge/county-studio
```

## Runtime Failure Signal

The proof gate remained red:

```text
status: FAIL
decision: COUNTY_STUDIO_R1_PRODUCTION_PROOF_BLOCKED
check: runtime.screenshot-contract-ready
```

The runtime screenshot showed the embedded GIS-first workspace, but the application still exposed the disconnected runtime state:

```text
disallowedVisibleHits=ATLAS DISCONNECTED
```

The proof gate must continue to fail until a real County Studio study loads and Atlas reaches a connected/data-ready state.

## UI Surface Signals Present

The GIS surface contract signals were present in the runtime proof:

```text
missingVisibleSignals=0
embeddedCanvasCount=1
mapCanvasCount=1
```

That means the County Studio product surface was materially corrected to show the embedded TerraAtlas/GIS canvas as the primary center surface, with the Risk Ledger and inspector coordinated around it. This does not prove the full runtime dependency chain.

## Postgres Runtime Blocker

The runtime blocker is a local Postgres read timeout from the backend EF/Npgsql path. The failure was observed against both host forms:

```text
localhost:5432
127.0.0.1:5432
```

Observed backend error class:

```text
Npgsql.NpgsqlException: Exception while reading from stream
System.TimeoutException: Timeout during reading attempt
```

The direct study-load path could not complete because backend reads against database `terrafusion` timed out before County Studio could load an active study.

## Ownership Boundary

This blocker is assigned to the DB/runtime lane, not to County Studio UI.

No Docker/Postgres restart was performed. No DB seeding was performed. TerraFusion Sync and DB seeding remain owned by the separate lane and were not touched.

## Acceptance Boundary

Accepted:

- Embedded TerraAtlas/GIS is the dominant first County Studio surface.
- Risk Ledger coordination remains below the map.
- Dashboard/health material is demoted below the GIS-first workspace.
- City-free map/ledger selection and Property Workbench handoff context are covered.
- Focused tests, County Studio tests, type-checks, phase83 tools, and diff hygiene passed.

Not accepted:

- Full runtime production proof.
- Any production-proof label while `ATLAS DISCONNECTED` is visible.
- Any fixture-only substitute for live study loading.

Required unblock:

- DB/runtime owner validates `terrafusion` Postgres health.
- Backend `GET /api/county-study/studies` succeeds through the real EF-backed path.
- A real County Studio study opens in the browser.
- The embedded Atlas surface reaches connected/data-ready state.
- The runtime proof command above passes without suppressing disconnected-state text.

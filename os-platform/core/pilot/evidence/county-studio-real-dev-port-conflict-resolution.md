# County Studio Real Dev Port Conflict Resolution

Generated: 2026-06-07T17:01:28.435Z

Status: `REAL_DEV_PORT_CONFLICT_RESOLVED_DB_READINESS_BLOCKED`

## Starting Block

The real dev port preflight previously blocked on:

```text
4317 occupied by node pid 50784
5046 occupied by dotnet pid 42020
```

## Process Identification

Port `4317`:

```text
"C:\Program Files\nodejs\node.exe" os-platform/core/pilot/dev-pilot-runtime.mjs
```

Classification: `STALE_CONFLICTING_PROCESS`

Reason: `pnpm run dev:county-studio:real-benton` launches a fresh governed pilot runtime and does not reuse an existing `4317` listener.

Port `5046`:

```text
dotnet backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll --urls http://localhost:5046 --skip-dev-seeders
```

Classification: `STALE_CONFLICTING_PROCESS`

Reason: `pnpm run dev:county-studio:real-benton` launches a fresh API runtime and does not reuse an existing `5046` listener.

## Resolution

Stopped only the identified TerraFusion dev runtime processes:

```powershell
Stop-Process -Id 50784
Stop-Process -Id 42020
```

After resolution:

```text
REAL_DEV_PORT_PREFLIGHT_PASS
occupiedPorts=[]
```

## Smoke After Resolution

Command:

```bash
pnpm run dev:county-studio:real-benton
```

Result:

```text
FORGE_DEV_SMOKE_PORT_PREFLIGHT_PASS_DB_READINESS_BLOCKED
```

The command advanced past port preflight, then blocked at DB readiness:

```text
REAL_DEV_SERVER_BLOCKED
canonical parcel counts: Canonical parcel count is missing.
canonicalParcel=0
```

## Decisions

- productionProofAllowed=false
- operationalProofAllowed=false
- cleanFullDevSmokePassed=false

## Boundaries

- No County Studio UI changed.
- No TerraFusion Sync behavior changed.
- No DB seeding changed.
- No proof gate weakened.
- No production proof claimed.
- No operational proof claimed.

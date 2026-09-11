# WO-WAL-001F Evidence — Public-Source Connector Truth

Program: Washington Assessor Launch V1 · Parent: `WO-WAL-001` · Risk: R3

## 1. Observed starting defect on protected main

Protected base for this child: `cdb20e65338aa1d5eacc1da55f63ecf30e620129`.

`backend/src/TerraFusion.Data/Connectors/CensusConnector.cs` on that base:

| Member | Observed behavior | Why it is a truth defect |
| --- | --- | --- |
| `TestConnectionAsync` (line 57-61) | `return Task.FromResult(!string.IsNullOrWhiteSpace(_baseUrl));` | `_baseUrl` is initialized from configuration **with a hardcoded non-empty fallback** (`"https://api.census.gov/data"`), so this expression is `true` for every possible configuration. The health check cannot fail. |
| `ConnectAsync` (line 41-46) | sets `_connected = true` and returns; no round trip | `IsConnected` asserted a connection that was never observed. |
| `FetchAsync` (line 64-72) | logs `"Census fetch: entity={Entity}"` then returns `Array.Empty<...>()` | A caller cannot distinguish "the source has no rows" from "this connector has no acquisition path". |
| `GetSchemaAsync` | advertises two entities and twelve fields | Metadata that no read path could satisfy. |

### Why this matters on the live surface

`backend/src/TerraFusion.API/Services/ConnectorHealthService.cs` calls
`await connector.TestConnectionAsync(ct)` for every injected `IDataConnector` and publishes the
result as health, and `backend/src/TerraFusion.API/Services/SyncOrchestrationService.cs` calls
`ConnectAsync` then `FetchAsync` for every injected connector. Any connector with this shape would
therefore publish `Healthy` and contribute zero rows, indistinguishably from a healthy read.

### Registration state (recorded so no live incident is claimed)

No DI registration of any `IDataConnector` implementation exists on protected main:

```text
rg "Add(Scoped|Singleton|Transient)<(CensusConnector|IDataConnector|MarketDataConnector)|new CensusConnector|AddDataConnectors" backend/**
(no matches)
```

`IEnumerable<IDataConnector>` therefore resolves empty, `GET /api/connectors` returns an empty set,
and `/api/connectors/census-acs/health` is not reachable. The fabricated health is **latent, not
live**: it becomes a published false capability the moment any connector joins DI. That is the
defect this child removes.

## 2. Live public-source probe (2026-09-11, this lane)

The owner-supplied Census credential was probed directly from this machine:

| Request | Observed answer |
| --- | --- |
| `GET https://api.census.gov/data/2023/acs/acs5?...&key=<supplied>` | `302` → `https://api.census.gov/data/invalid_key.html`, header `X-DataWebAPI-KeyError: 1` |
| `GET https://api.census.gov/data/2023/acs/acs5?...` (no key) | `302` → `https://api.census.gov/data/missing_key.html` |
| `GET .../variables/B25077_001E.json` (metadata) | `200` — the host is reachable; only key validation fails |

So the target source currently answers **unavailable** for the supplied credential, and the observed
shape of that unavailability is a redirect to `invalid_key.html` / `missing_key.html` served with a
success status. That is exactly why the probe inspects the final URI and the payload shape rather
than the status code alone.

This evidence establishes source unavailability only. It does not authorize acquisition, a
replacement credential, or any county data access.

## 3. Change made

Single connector file plus one offline test file.

- `TestConnectionAsync` performs one bounded probe (`ProbePath`, 6-second client timeout) and returns
  `false` on: absent key, absent base URL, key-rejection redirect, non-2xx status, non-array payload,
  or transport failure — logging the observed reason in each case.
- `ConnectAsync` awaits that probe and sets `_connected` from it.
- `FetchAsync` returns `Task.FromException(...NotSupportedException...)`.
- `IsSourceRejectionUri` is public, pure and offline-testable.
- No constructor signature, interface, DI registration, schema, or other connector changed.

## 4. Local execution limits, stated plainly

This lane has **no .NET SDK installed** (`dotnet` is absent from PATH and from both
`C:\Program Files\dotnet` and `%USERPROFILE%\.dotnet`), so the focused xunit evidence for the code
change is produced by the protected .NET contexts on this pull request, not locally. No local test
pass is claimed. What was executed locally in this lane:

- `node --version` → `v22.23.2`, used for the Work Order registry/queue validation tools;
- `git diff --check` and the exact-path audit.

## 5. Boundaries held

No acquisition, no DI registration, no credential change, no county or protected data, no PACS, CAMA,
GIS or Sync access, no external write, no other connector touched, no production or deployment
action, and no capability or readiness claim for any county or module.

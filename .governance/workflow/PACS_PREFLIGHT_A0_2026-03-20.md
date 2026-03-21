# Phase 20 — PACS Preflight (A0) Evidence
**Date**: 2026-03-20
**Phase**: 20-A0 (Claude Code) / Sprint 0 (Go-Live Roadmap)
**Status**: ❌ ENVIRONMENT BLOCKED — Phase 20 implementation halted
**Classification**: Environment blocker. Not a code failure. No SQL modified.

---

## A0 Check Results

| Check | Result | Detail |
|---|---|---|
| Connection string present | ✅ PASS | `PacsSalesConnection` in `appsettings.Development.json`: `Server=localhost,1433;Database=pacs_golive;User Id=sa;Password=${TF_DEV_PACS_PASSWORD};TrustServerCertificate=True` |
| `TF_DEV_PACS_PASSWORD` env var | ❌ FAIL | Not set in User or Machine scope. Bash env: unset. PowerShell env query: empty. Connection string is an unresolved template. |
| Port 1433 reachable | ❌ FAIL | `Test-NetConnection localhost 1433` → `TcpTestSucceeded: False`. No SQL Server listening. |
| SQL Server service | ❌ FAIL | No MSSQL service found. Services running: `postgresql-x64-17` (PostgreSQL), `SQLWriter` (VSS writer, not a server). No Docker container for MSSQL/pacs. |
| Auth success | ⛔ NOT ATTEMPTED | Blocked by port unreachable |
| Read-only sanity query | ⛔ NOT ATTEMPTED | Blocked by port unreachable |

---

## What the Code Shows

**Connection string source**: `appsettings.Development.json`
```json
"PacsSalesConnection": "Server=localhost,1433;Database=pacs_golive;User Id=sa;Password=${TF_DEV_PACS_PASSWORD};TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
```

**Adapter**: `TerraFusion.Core/PACS/PacsSqlAdapter.cs` uses `Microsoft.Data.SqlClient` (not ODBC). The 6 required views are already declared as constants in the adapter — the code is ready; the DB is not present.

**`System.Data.Odbc`** confirmed present in `OdbcConnector.cs` (Phase 19 check) — separate from the PACS SQL adapter which uses SqlClient directly.

---

## Environment Gap — What Is Needed to Unblock

To pass A0, the environment needs ALL of the following:

1. **SQL Server instance** running at `localhost:1433` (or an accessible host). Options:
   - Start SQL Server via Docker: `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=<pwd>" -p 1433:1433 mcr.microsoft.com/mssql/server:2019-latest`
   - Or point `PacsSalesConnection` at an accessible remote SQL Server hosting `pacs_golive`

2. **`pacs_golive` database** present on that instance with the Benton County PACS schema.

3. **`TF_DEV_PACS_PASSWORD`** set as an environment variable (or injected into config) with the correct SA/login password.

4. **Network reachability**: port 1433 open between this machine and the SQL Server.

---

## Stop Condition Applied

Per Phase 20 scope lock:
> "If A0 fails: stop Phase 20 implementation — classify as environment blocker, not code failure — do not modify PACS view SQL."

**No SQL written. No view definitions touched. No SpecLock modified.**

Phase 20 is suspended at A0. It resumes when the environment is ready and A0 re-run passes all 5 checks.

---

## What This Does NOT Block

The following phases do not depend on PACS SQL Server:

| Phase | Dependency on PACS |
|---|---|
| Phase 21 — Security & Isolation | None — backend controller hardening only |
| Phase 22 — Shell Contract | None — frontend source inspection |
| Phase 23 — Multi-County Federation | Docker-based; uses own county DBs |
| Phase 24 — PR #656 Integrity | Read-only git/evidence check |
| Phase 25 — Honesty Sweep | Frontend component wiring |

**Recommendation**: Proceed to Phase 21 (Security & Isolation Closure) while the PACS environment is arranged. Phase 20 can be inserted back into the sequence before Phase 30 — it has no dependency that blocks 21–29.

---

*The database was politely poked with a read-only stick. The stick found no door. Phase 20 waits by the entrance.*

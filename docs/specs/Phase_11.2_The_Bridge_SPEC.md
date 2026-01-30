# Phase 11.2: The Bridge (MSSQL Switch) - SPEC

**Feature**: Dynamic Database Provider Switching (Postgres / MSSQL)
**Goal**: Enable TerraFusion Iron (API) to run in "Hybrid Mode"—Postgres for development (Docker), MSSQL for production (Host/Sovereign).

---

## 1. Directives

### A. The Challenge
- **Current State**: Hardcoded dependency on `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Desired State**: Configurable provider selection via `DatabaseProvider` environment variable.
- **Constraint**: Must not break existing development workflow (default to Postgres).

### B. Architecture (The Switch)
- **Configuration Key**: `DatabaseProvider` (Values: `Postgres` | `SqlServer`)
- **Location**: `Program.cs` (Service Registration phase)
- **Safety**: Fail-fast if `SqlServer` is selected but connection string is missing or malformed.

### C. Success Criteria
1.  **Dependency**: `Microsoft.EntityFrameworkCore.SqlServer` is installed.
2.  **Runtime Switch**: Setting `DatabaseProvider=SqlServer` triggers `UseSqlServer()`.
3.  **Logs**: Startup logs clearly indicate which engine is active ("🐘 Using PostgreSQL" vs "🛢️ Switching to MSSQL").
4.  **Dev Compatibility**: Default behavior (no env var) remains Postgres.

## 2. Implementation Plan

### Task 1: Dependencies
- Add `Microsoft.EntityFrameworkCore.SqlServer` via `dotnet add package`.
- Ensure version compatibility with .NET 8 / EF Core 8.

### Task 2: The Switch Logic (Program.cs)
- Replace direct `UseNpgsql` call with a conditional block.
- Inject the "Architect's Aid" snippet for robust retry policies.

### Task 3: Configuration (appsettings.json)
- Add `DatabaseProvider` default value.

### Task 4: Verification
- Dry run with `DatabaseProvider=SqlServer`.
- Validate console output.

## 3. Risks & mitigations
- **Migration Conflicts**: EF Core migrations are provider-specific.
    - *Mitigation*: We will use `EnsureCreated()` or SQL scripts for prod initially; raw migrations for Postgres dev. For Phase 11, we assume the MSSQL DB exists or will be initialized by the DBA/Host capabilities.
- **Data Types**: Geometry/Geography differences.
    - *Mitigation*: If `UseNetTopologySuite` is used, ensure the MSSQL equivalent is configured (commented out for now until strict requirement).


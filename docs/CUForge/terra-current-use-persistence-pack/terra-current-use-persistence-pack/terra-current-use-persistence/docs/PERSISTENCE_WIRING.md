# Current Use Persistence Wiring

## Step 1 — Add DbSets

Add to the TerraFusion application DbContext:

```csharp
public DbSet<CurrentUseClassification> CurrentUseClassifications => Set<CurrentUseClassification>();
public DbSet<CurrentUseRemoval> CurrentUseRemovals => Set<CurrentUseRemoval>();
public DbSet<RollbackCalculation> CurrentUseRollbackCalculations => Set<RollbackCalculation>();
public DbSet<CurrentUseEvidenceItem> CurrentUseEvidenceItems => Set<CurrentUseEvidenceItem>();
public DbSet<CurrentUseTimelineEvent> CurrentUseTimelineEvents => Set<CurrentUseTimelineEvent>();
```

## Step 2 — Configure ModelBuilder

Inside `OnModelCreating`:

```csharp
modelBuilder.ConfigureCurrentUse();
```

## Step 3 — Register Repository

```csharp
services.AddScoped<ICurrentUseRepository, CurrentUseRepository>();
```

## Step 4 — Migration

Preferred:

```bash
dotnet ef migrations add AddCurrentUsePhase1
dotnet ef database update
```

Fallback: use `Migrations/ManualSql/001_create_current_use_tables.sql`.

## Guardrails

- Forge stores calculation facts and classification state.
- Dossier stores document bodies.
- TerraTrace stores immutable audit spine later.
- Timeline events here are Phase 1 local append-only history.
- Do not silently mutate rollback calculations after lock.

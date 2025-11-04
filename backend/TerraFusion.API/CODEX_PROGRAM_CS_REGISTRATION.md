# Codex 3-6-9 Framework - Program.cs Registration Guide

## Add these service registrations to Program.cs

Insert these lines after the existing service registrations (around line 100-280):

```csharp
// ========================================
// CODEX 3-6-9 FRAMEWORK SERVICES
// Championship Excellence Measurement
// ========================================

// Core Codex service
builder.Services.AddScoped<ICodexService, CodexService>();

// Database persistence for Codex metrics
builder.Services.AddScoped<CodexPersistenceService>();

// Codex background monitoring service (optional)
builder.Services.AddHostedService<CodexMonitoringService>();

_logger.LogInformation("✅ Codex 3-6-9 Framework services registered");
```

## Add SignalR Hub Mapping

Add this line to the app configuration section (after `app.MapControllers();`):

```csharp
// Codex 3-6-9 Framework SignalR Hub
app.MapHub<CodexHub>("/hubs/codex");
```

## Add Health Checks

Add these health checks after existing health check registrations:

```csharp
builder.Services.AddHealthChecks()
    // ... existing health checks ...
    .AddCheck<CodexService>("codex-service")
    .AddCheck("codex-database", () =>
    {
        // Check if Codex tables exist
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ITerraFusionDbContext>();
        var hasCodexTables = context.CodexMetrics != null;
        return hasCodexTables
            ? HealthCheckResult.Healthy("Codex database tables accessible")
            : HealthCheckResult.Degraded("Codex database tables not found");
    });
```

## Complete Program.cs Additions

Here's the complete code block to add:

```csharp
// ========================================
// CODEX 3-6-9 FRAMEWORK
// ========================================

using TerraFusion.Core.Services;
using TerraFusion.API.Hubs;
using TerraFusion.Core.Entities;

// Register Codex services
builder.Services.AddScoped<ICodexService, CodexService>();
builder.Services.AddScoped<CodexPersistenceService>();

_logger.LogInformation("✅ Codex 3-6-9 Framework: Services registered");

// Add Codex health checks
builder.Services.AddHealthChecks()
    .AddCheck<CodexService>("codex-service", tags: new[] { "codex", "live" })
    .AddCheck("codex-database", () =>
    {
        try
        {
            using var scope = builder.Services.BuildServiceProvider().CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ITerraFusionDbContext>();
            var canAccess = context.CodexMetrics != null;
            return canAccess
                ? HealthCheckResult.Healthy("Codex database operational")
                : HealthCheckResult.Degraded("Codex database not accessible");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Codex database error", ex);
        }
    }, tags: new[] { "codex", "ready" });

_logger.LogInformation("✅ Codex 3-6-9 Framework: Health checks registered");

// ... rest of Program.cs ...

// After app.MapControllers();
app.MapHub<CodexHub>("/hubs/codex");
_logger.LogInformation("✅ Codex SignalR Hub mapped: /hubs/codex");
```

## Verification

After adding these registrations, verify they're working:

1. Build the solution:
   ```bash
   dotnet build TerraFusion.sln
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:5000/health | jq '.entries."codex-service"'
   ```

3. Test Codex API:
   ```bash
   curl http://localhost:5000/api/codex/ultimate-power
   ```

4. Test SignalR connection:
   Open browser console and connect to `ws://localhost:5000/hubs/codex`

---

**Status**: Ready for integration
**Location**: backend/TerraFusion.API/Program.cs
**Dependencies**: All Codex services and entities created

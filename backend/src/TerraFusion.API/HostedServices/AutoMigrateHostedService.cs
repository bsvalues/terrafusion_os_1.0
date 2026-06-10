using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.HostedServices;

/// <summary>
/// SYNC-INFRA-1: Idempotent EF Core migration runner.
///
/// Applies any pending migrations on the <see cref="TerraFusionDbContext"/>
/// at backend startup, replacing the pre-SYNC-INFRA-1 workflow where the
/// operator had to remember to run
/// <c>dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API</c>
/// before booting.
///
/// Behavior:
/// - Opt-out via <c>TF_SKIP_AUTO_MIGRATE=true</c> (configuration key, env var, or appsettings).
/// - No-op when there are no pending migrations.
/// - Non-fatal on failure: logs an error and lets the host continue, so the
///   operator can fix the DB and restart without losing the backend.
/// </summary>
public sealed class AutoMigrateHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoMigrateHostedService> _logger;

    public AutoMigrateHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<AutoMigrateHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
            if (pending.Count == 0)
            {
                _logger.LogInformation("AutoMigrate: no pending migrations");
                return;
            }
            _logger.LogInformation(
                "AutoMigrate: applying {Count} migrations: {List}",
                pending.Count,
                string.Join(",", pending));
            await db.Database.MigrateAsync(ct);
            _logger.LogInformation("AutoMigrate: complete");
        }
        catch (Exception ex)
        {
            // Non-fatal: log and continue. Operator can fix and restart.
            _logger.LogError(ex, "AutoMigrate failed; backend will continue but DB may be out of sync");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-2 (B2): hosted service that runs the ratio-policy
/// seeder once at backend startup so the doctrine table is populated
/// before the first sale truth-promotion call.
///
/// <para>Idempotent — DoctrineRatioPolicySeeder skips rules whose
/// deterministic RuleIds already exist. The hosted service is safe
/// to leave registered in all environments; in tests with in-memory
/// providers it just inserts the seed and proceeds.</para>
///
/// <para>Failure is non-fatal: if seeding throws (e.g. migration
/// not applied yet), the host logs a warning and proceeds. The
/// promoter will still operate; it'll just see no rules and treat
/// every sale as "not reviewed / not qualified" (the safe default).
/// Operators can re-seed manually via
/// <c>POST /api/sync/doctrine/policy/ratio/seed</c>.</para>
/// </summary>
public sealed class DoctrineRatioPolicySeederHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DoctrineRatioPolicySeederHostedService> _logger;

    public DoctrineRatioPolicySeederHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<DoctrineRatioPolicySeederHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var seeder = scope.ServiceProvider
                .GetRequiredService<DoctrineRatioPolicySeeder>();
            var inserted = await seeder.SeedAsync(cancellationToken)
                .ConfigureAwait(false);

            _logger.LogInformation(
                "DoctrineRatioPolicySeederHostedService: startup seed ran; {Inserted} new rule(s) inserted",
                inserted);
        }
        catch (Exception ex)
        {
            // Non-fatal: doctrine table may not exist yet (migration
            // pending). The promoter will treat sales as not-reviewed
            // until the seeder runs successfully.
            _logger.LogWarning(ex,
                "DoctrineRatioPolicySeederHostedService: startup seed failed; " +
                "operator may need to run POST /api/sync/doctrine/policy/ratio/seed manually");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: hosted service that runs the
/// <see cref="SalesQualificationCodesSeeder"/> once at backend startup
/// so the doctrine table is populated before the first audit call.
///
/// <para>Idempotent — the seeder skips rules whose deterministic
/// RuleIds already exist. Non-fatal: if seeding throws (migration
/// pending, etc.), the host logs a warning and proceeds. Operators
/// can re-seed manually via
/// <c>POST /api/sync/doctrine/policy/sales-qualification/seed</c>.
/// </para>
/// </summary>
public sealed class SalesQualificationCodesSeederHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SalesQualificationCodesSeederHostedService> _logger;

    public SalesQualificationCodesSeederHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<SalesQualificationCodesSeederHostedService> logger)
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
                .GetRequiredService<SalesQualificationCodesSeeder>();
            var inserted = await seeder.SeedAsync(cancellationToken)
                .ConfigureAwait(false);

            _logger.LogInformation(
                "SalesQualificationCodesSeederHostedService: startup seed ran; {Inserted} new rule(s) inserted",
                inserted);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "SalesQualificationCodesSeederHostedService: startup seed failed; " +
                "operator may need to run POST /api/sync/doctrine/policy/sales-qualification/seed manually");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: hosted service that runs the universe seeder
/// (always) and the attribute-dictionary seeder (no-op on initial
/// empty seed) once at backend startup.
///
/// <para>Idempotent. Failure is non-fatal: if seeding throws (e.g.
/// migration not applied yet), the host logs a warning and proceeds.
/// The classifier will still operate; with zero rules it will
/// classify everything as UNKNOWN with reason
/// <c>UNKNOWN_UNIVERSE</c>, which is the correct safe default.</para>
/// </summary>
public sealed class DoctrinePropertyUniverseSeederHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DoctrinePropertyUniverseSeederHostedService> _logger;

    public DoctrinePropertyUniverseSeederHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<DoctrinePropertyUniverseSeederHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();

            var universeSeeder = scope.ServiceProvider
                .GetRequiredService<DoctrinePropertyUniverseSeeder>();
            var universeAdded = await universeSeeder.SeedAsync(cancellationToken)
                .ConfigureAwait(false);

            var dictSeeder = scope.ServiceProvider
                .GetRequiredService<DoctrineAttributeDictionarySeeder>();
            var dictAdded = await dictSeeder.SeedAsync(cancellationToken)
                .ConfigureAwait(false);

            _logger.LogInformation(
                "DoctrinePropertyUniverseSeederHostedService: startup ran; " +
                "universe rules added={Universe} dictionary entries added={Dict}",
                universeAdded, dictAdded);
        }
        catch (Exception ex)
        {
            // Non-fatal: doctrine tables may not exist yet (migration
            // pending). Classifier will treat everything as UNKNOWN
            // until the seeder runs successfully.
            _logger.LogWarning(ex,
                "DoctrinePropertyUniverseSeederHostedService: startup seed failed; " +
                "operator may need to run POST /api/sync/doctrine/policy/universe/seed manually");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

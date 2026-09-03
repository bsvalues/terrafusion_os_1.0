using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Import;
using TerraFusion.Data.Services.Import;

namespace TerraFusion.Data.Extensions;

/// <summary>
/// Connects the protected county-upload ledger to the already configured request-pipeline
/// database options without sharing a caller-owned <see cref="TerraFusionDbContext"/>.
/// </summary>
public static class CountyCsvUploadAdmissionServiceCollectionExtensions
{
    public static IServiceCollection AddCountyCsvUploadAdmission(
        this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IDbContextFactory<TerraFusionDbContext>,
            ScopedTerraFusionDbContextFactory>();
        services.AddScoped<ICountyCsvUploadAdmissionLedger,
            CountyCsvUploadAdmissionLedger>();

        return services;
    }
}

/// <summary>
/// A scope-bound factory over the primary context's reviewed options. Each call constructs a new
/// context so ledger transactions never borrow or dispose the request pipeline's context.
/// </summary>
internal sealed class ScopedTerraFusionDbContextFactory(
    DbContextOptions<TerraFusionDbContext> options,
    IConfiguration configuration) : IDbContextFactory<TerraFusionDbContext>
{
    public TerraFusionDbContext CreateDbContext() =>
        new(options, configuration);

    public Task<TerraFusionDbContext> CreateDbContextAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(CreateDbContext());
    }
}

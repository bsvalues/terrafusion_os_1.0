using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Auth;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using TerraFusion.Data;
using TerraFusion.Data.Extensions;
using TerraFusion.Data.Services.Import;
using Xunit;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;
using CountyEntity = TerraFusion.Core.Entities.County;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvUploadAdmissionServiceRegistrationTests
{
    private const string MigrationId =
        "20260902000000_WAL002GCountyCsvUploadAdmissionLedger";
    private static readonly WashingtonCountyIdentity Benton = ResolveCounty("Benton");
    private static readonly WashingtonCountyIdentity Franklin = ResolveCounty("Franklin");
    private static readonly Guid BentonId =
        Guid.Parse("00000000-0000-0000-0000-000000000005");
    private static readonly Guid FranklinId =
        Guid.Parse("00000000-0000-0000-0000-000000000021");

    [Fact]
    public async Task Registration_is_scoped_and_factory_always_creates_distinct_contexts()
    {
        await using var database = new TemporaryDatabaseFile();
        await using var provider = BuildProvider(database.ConnectionString);
        await using var firstScope = provider.CreateAsyncScope();
        await using var secondScope = provider.CreateAsyncScope();

        var firstLedger = firstScope.ServiceProvider
            .GetRequiredService<ICountyCsvUploadAdmissionLedger>();
        Assert.IsType<CountyCsvUploadAdmissionLedger>(firstLedger);
        Assert.Same(
            firstLedger,
            firstScope.ServiceProvider.GetRequiredService<ICountyCsvUploadAdmissionLedger>());
        Assert.Same(
            firstLedger,
            firstScope.ServiceProvider.GetRequiredService<ICountyCsvUploadHistoryReader>());
        Assert.NotSame(
            firstLedger,
            secondScope.ServiceProvider.GetRequiredService<ICountyCsvUploadAdmissionLedger>());

        var factory = firstScope.ServiceProvider
            .GetRequiredService<IDbContextFactory<TerraFusionDbContext>>();
        await using var first = await factory.CreateDbContextAsync();
        await using var second = await factory.CreateDbContextAsync();
        var requestContext = firstScope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        Assert.NotSame(first, second);
        Assert.NotSame(requestContext, first);
        Assert.NotSame(requestContext, second);
    }

    [Fact]
    public async Task Durable_admission_survives_provider_restart_and_separates_counties()
    {
        await using var database = new TemporaryDatabaseFile();
        var bentonRequest = await CreateRequestAsync(Benton, BentonId, "benton-assessor");
        var franklinRequest = await CreateRequestAsync(Franklin, FranklinId, "franklin-assessor");
        Guid bentonBatchId;

        await using (var firstProvider = BuildProvider(database.ConnectionString))
        {
            await InitializeAsync(firstProvider);
            await using var scope = firstProvider.CreateAsyncScope();
            var ledger = scope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadAdmissionLedger>();
            var first = await ledger.AdmitAsync(bentonRequest);
            var franklin = await ledger.AdmitAsync(franklinRequest);

            Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, first.Disposition);
            Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, franklin.Disposition);
            bentonBatchId = Assert.IsType<TerraFusion.Core.Entities.Import.CountyCsvUploadBatch>(
                first.Batch).BatchId;
            Assert.NotEqual(bentonBatchId, franklin.Batch!.BatchId);
            Assert.NotEqual(first.Batch.CountyId, franklin.Batch.CountyId);
        }

        await using (var restartedProvider = BuildProvider(database.ConnectionString))
        {
            await using var scope = restartedProvider.CreateAsyncScope();
            var restartedLedger = scope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadAdmissionLedger>();
            var duplicate = await restartedLedger.AdmitAsync(bentonRequest);

            Assert.Equal(CountyCsvUploadAdmissionDisposition.Duplicate, duplicate.Disposition);
            Assert.Equal(bentonBatchId, duplicate.Batch!.BatchId);
            Assert.Equal(2, await CountBatchesAsync(scope.ServiceProvider));

            var history = scope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadHistoryReader>();
            var bentonHistory = await history.ListRecentAsync(BentonId, 25);
            var franklinHistory = await history.ListRecentAsync(FranklinId, 25);
            Assert.Equal(bentonBatchId, Assert.Single(bentonHistory).BatchId);
            Assert.Equal(BentonId, Assert.Single(bentonHistory).CountyId);
            Assert.Equal(FranklinId, Assert.Single(franklinHistory).CountyId);
            Assert.DoesNotContain(bentonHistory, batch => batch.CountyId == FranklinId);
            Assert.DoesNotContain(franklinHistory, batch => batch.CountyId == BentonId);
        }
    }

    [Fact]
    public async Task Factory_and_ledger_propagate_cancellation_without_persistence()
    {
        await using var database = new TemporaryDatabaseFile();
        await using var provider = BuildProvider(database.ConnectionString);
        await InitializeAsync(provider);
        await using var scope = provider.CreateAsyncScope();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var factory = scope.ServiceProvider
            .GetRequiredService<IDbContextFactory<TerraFusionDbContext>>();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => factory.CreateDbContextAsync(cancellation.Token));

        var request = await CreateRequestAsync(Benton, BentonId, "benton-assessor");
        var ledger = scope.ServiceProvider
            .GetRequiredService<ICountyCsvUploadAdmissionLedger>();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => ledger.AdmitAsync(request, cancellation.Token));
        Assert.Equal(0, await CountBatchesAsync(scope.ServiceProvider));
    }

    [Fact]
    public void Sql_server_history_query_is_provider_translated_and_composable()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlServer(
                "Server=localhost;Database=TerraFusionHistoryQuery;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        using var context = new TerraFusionDbContext(
            options,
            new ConfigurationBuilder().Build());

        var sql = CountyCsvUploadAdmissionLedger
            .BuildProviderHistoryQuery(context, BentonId, 25)
            .ToQueryString();

        Assert.Contains("TOP", sql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ORDER BY", sql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("[ReceivedAtUtc] DESC", sql, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("FROM (", sql, StringComparison.OrdinalIgnoreCase);
    }

    private static ServiceProvider BuildProvider(string connectionString)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddDbContext<TerraFusionDbContext>(options =>
            options.UseSqlite(connectionString));
        services.AddCountyCsvUploadAdmission();
        return services.BuildServiceProvider(
            new ServiceProviderOptions { ValidateOnBuild = true, ValidateScopes = true });
    }

    private static async Task InitializeAsync(ServiceProvider provider)
    {
        await using var scope = provider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        await context.Database.OpenConnectionAsync();
        await PrepareMigrationBaselineAsync(context);
        await context.GetService<IMigrator>().MigrateAsync(MigrationId);
        if (!await context.Counties.AnyAsync())
        {
            context.Counties.AddRange(
                new CountyEntity
                {
                    Id = BentonId,
                    Name = Benton.Name,
                    State = Benton.State,
                    FipsCode = Benton.FipsCode,
                },
                new CountyEntity
                {
                    Id = FranklinId,
                    Name = Franklin.Name,
                    State = Franklin.State,
                    FipsCode = Franklin.FipsCode,
                });
            await context.SaveChangesAsync();
        }
    }

    private static async Task PrepareMigrationBaselineAsync(TerraFusionDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"Counties\" (\"Id\" TEXT NOT NULL CONSTRAINT \"PK_Counties\" PRIMARY KEY, \"Name\" TEXT NOT NULL, \"State\" TEXT NOT NULL, \"FipsCode\" TEXT NOT NULL, \"Population\" INTEGER NOT NULL, \"Area\" REAL NOT NULL, \"CreatedAt\" TEXT NOT NULL, \"UpdatedAt\" TEXT NOT NULL)");
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"AuditLogs\" (\"Id\" TEXT NOT NULL CONSTRAINT \"PK_AuditLogs\" PRIMARY KEY, \"Type\" TEXT NOT NULL, \"Data\" TEXT NULL, \"Timestamp\" TEXT NOT NULL, \"UserId\" TEXT NULL, \"UserEmail\" TEXT NULL, \"IpAddress\" TEXT NULL, \"UserAgent\" TEXT NULL, \"RequestPath\" TEXT NULL, \"RequestMethod\" TEXT NULL, \"CorrelationId\" TEXT NULL, \"ResponseStatusCode\" INTEGER NULL, \"DurationMs\" INTEGER NULL, \"MachineName\" TEXT NULL, \"ProcessId\" INTEGER NULL, \"Severity\" TEXT NULL, \"Source\" TEXT NULL)");
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"__EFMigrationsHistory\" (\"MigrationId\" TEXT NOT NULL CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY, \"ProductVersion\" TEXT NOT NULL)");

        var migrations = context.Database.GetMigrations().ToArray();
        Assert.Equal(MigrationId, migrations[^1]);
        foreach (var migration in migrations[..^1])
        {
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({migration}, {"8.0.0"})");
        }
    }

    private static async Task<int> CountBatchesAsync(IServiceProvider services)
    {
        var factory = services.GetRequiredService<IDbContextFactory<TerraFusionDbContext>>();
        await using var context = await factory.CreateDbContextAsync();
        return await context.CountyCsvUploadBatches.CountAsync();
    }

    private static async Task<CountyCsvUploadAdmissionRequest> CreateRequestAsync(
        WashingtonCountyIdentity county,
        Guid countyId,
        string actorId)
    {
        var resolver = new StaticCountyResolver(county, countyId);
        var binding = await new AuthenticatedCountyAuthorityBinding(
                new StaticContextAccessor(
                    new RequestUserContext(true, actorId, county.Key, Array.Empty<string>())),
                resolver)
            .BindCurrentAsync();
        var context = await new AuthenticatedCanonicalCountyContext(resolver)
            .EstablishAsync(binding);
        var bytes = Encoding.UTF8.GetBytes("parcel_id,owner\n1,Ada\n2,Grace\n");
        var intake = new CountyCsvCountyBoundIntake(
            new CountyCsvParserOptions
            {
                Delimiter = ',',
                MaxInputBytes = 4096,
                MaxDataRows = 100,
                MaxFieldsPerRow = 20,
                MaxCharactersPerField = 256,
            });
        var receipt = await intake.AdmitAsync(
            new CountyCsvCountyBoundIntakeRequest(
                county,
                county,
                CountyCsvDataset.Parcels,
                new CountyCsvIntakeDeclaration
                {
                    FileName = "parcels.csv",
                    Format = "csv",
                    MediaType = "text/csv",
                },
                bytes));

        return new CountyCsvUploadAdmissionRequest(
            ICountyCsvUploadAdmissionLedger.AuthenticatedCsvApiAdmissionContractId,
            context,
            receipt,
            bytes,
            CountyCsvIntakeIdempotency.Create(receipt));
    }

    private static WashingtonCountyIdentity ResolveCounty(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }

    private sealed class StaticContextAccessor(RequestUserContext current)
        : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; } = current;
    }

    private sealed class StaticCountyResolver(
        WashingtonCountyIdentity county,
        Guid countyId) : ICountyResolver
    {
        public Task<Guid> ResolveAsync(
            string countyIdOrCode,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                    ? countyId
                    : throw new CountyNotFoundException(countyIdOrCode));

        public Task<Guid?> TryResolveAsync(
            string countyIdOrCode,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Guid?>(
                string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                    ? countyId
                    : null);
    }

    private sealed class TemporaryDatabaseFile : IAsyncDisposable
    {
        private readonly string _path = Path.Combine(
            Path.GetTempPath(),
            $"wal-002h-{Guid.NewGuid():N}.db");

        public string ConnectionString =>
            $"Data Source={_path};Cache=Shared;Default Timeout=30;Pooling=False;Foreign Keys=True";

        public ValueTask DisposeAsync()
        {
            foreach (var suffix in new[] { string.Empty, "-shm", "-wal" })
            {
                var candidate = _path + suffix;
                if (File.Exists(candidate))
                {
                    File.Delete(candidate);
                }
            }

            return ValueTask.CompletedTask;
        }
    }
}

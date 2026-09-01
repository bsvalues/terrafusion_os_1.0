using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Phase40;

public sealed class DaisMutationSqliteLifecycleTests
{
    [Fact]
    public async Task SyntheticAppeal_CreateHeardDecided_RoundTripsThroughSqlite()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite(connection)
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();
        await using var db = new TerraFusionDbContext(options, configuration);
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE "Appeals" (
              "Id" TEXT NOT NULL CONSTRAINT "PK_Appeals" PRIMARY KEY,
              "ParcelId" TEXT NOT NULL, "AppealGround" TEXT NOT NULL, "Status" TEXT NOT NULL,
              "PetitionerName" TEXT NULL, "FiledDate" TEXT NOT NULL, "HearingDate" TEXT NULL,
              "DecisionDate" TEXT NULL, "CurrentValue" TEXT NOT NULL, "RequestedValue" TEXT NOT NULL,
              "DecidedValue" TEXT NULL, "DecisionNotes" TEXT NULL, "TaxYear" INTEGER NOT NULL,
              "CountyId" TEXT NOT NULL, "CreatedBy" TEXT NULL, "UpdatedBy" TEXT NULL,
              "CreatedAt" TEXT NOT NULL, "UpdatedAt" TEXT NOT NULL
            );
            CREATE TABLE "AuditLogs" (
              "Id" TEXT NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY,
              "Type" TEXT NOT NULL, "Data" TEXT NULL, "Timestamp" TEXT NOT NULL,
              "UserId" TEXT NULL, "UserEmail" TEXT NULL, "IpAddress" TEXT NULL,
              "UserAgent" TEXT NULL, "RequestPath" TEXT NULL, "RequestMethod" TEXT NULL,
              "CorrelationId" TEXT NULL, "ResponseStatusCode" INTEGER NULL, "DurationMs" INTEGER NULL,
              "MachineName" TEXT NULL, "ProcessId" INTEGER NULL, "Severity" TEXT NULL, "Source" TEXT NULL
            );
            """);
        var countyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var service = new AppealService(
            db,
            NullLogger<AppealService>.Instance,
            new FakeDaisAppealMutationDecisionPort());
        var effectiveAt = new DateTime(2026, 2, 3, 4, 5, 6, DateTimeKind.Utc);

        var created = await service.CreateAsync(
            countyId,
            new CreateAppealCommand(
                "SYNTHETIC-SQLITE", "MARKET_VALUE", "Synthetic Person", 500_000m, 450_000m, 2026),
            "synthetic-user",
            effectiveAt);
        var heard = await service.UpdateStatusAsync(created.Id, "heard", countyId);
        var heardStatus = heard.Status;
        var decided = await service.UpdateStatusAsync(
            created.Id, "decided", countyId, "Synthetic decision", 455_000m);
        db.ChangeTracker.Clear();
        var persisted = await db.Appeals.AsNoTracking().SingleAsync(a => a.Id == created.Id);

        heardStatus.Should().Be("heard");
        decided.Status.Should().Be("decided");
        persisted.Should().BeEquivalentTo(new
        {
            ParcelId = "SYNTHETIC-SQLITE",
            Status = "decided",
            AppealGround = "MARKET_VALUE",
            TaxYear = 2026,
            CountyId = countyId,
            DecidedValue = (decimal?)455_000m,
            DecisionNotes = "Synthetic decision",
        });
        persisted.DecisionDate.Should().NotBeNull();
    }

    [Fact]
    public async Task ConcurrentTransitions_FromSameSnapshot_CommitOnlyFirstDecision()
    {
        var databasePath = Path.Combine(
            Path.GetTempPath(),
            $"tf-dais-mutation-concurrency-{Guid.NewGuid():N}.db");
        var connectionString = $"Data Source={databasePath};Cache=Shared;Default Timeout=5";
        try
        {
            await using (var setup = CreateContext(connectionString))
            {
                await setup.Database.ExecuteSqlRawAsync(AppealsTableSql);
                setup.Appeals.Add(new Appeal
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    ParcelId = "SYNTHETIC-CONCURRENT",
                    AppealGround = "MARKET_VALUE",
                    Status = "filed",
                    FiledDate = new DateTime(2026, 2, 3, 4, 5, 6, DateTimeKind.Utc),
                    CurrentValue = 500_000m,
                    RequestedValue = 450_000m,
                    TaxYear = 2026,
                    CountyId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    CreatedAt = new DateTime(2026, 2, 3, 4, 5, 6, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 2, 3, 4, 5, 6, DateTimeKind.Utc),
                });
                await setup.SaveChangesAsync();
            }

            var coordinator = new CoordinatedTransitionPort();
            await using var firstContext = CreateContext(connectionString);
            await using var secondContext = CreateContext(connectionString);
            var firstService = new AppealService(
                firstContext,
                NullLogger<AppealService>.Instance,
                coordinator);
            var secondService = new AppealService(
                secondContext,
                NullLogger<AppealService>.Instance,
                coordinator);
            var appealId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            var countyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            var decidedTask = firstService.UpdateStatusAsync(
                appealId,
                "decided",
                countyId,
                "First terminal decision",
                455_000m);
            await coordinator.FirstEntered;
            var staleScheduledTask = secondService.UpdateStatusAsync(
                appealId,
                "scheduled",
                countyId);
            await coordinator.BothEntered;

            var decided = await decidedTask;
            coordinator.ReleaseSecond();
            var staleAction = async () => await staleScheduledTask;

            decided.Status.Should().Be("decided");
            var conflict = await staleAction.Should()
                .ThrowAsync<DaisAppealMutationConflictException>();
            conflict.Which.InnerException.Should().BeOfType<DbUpdateConcurrencyException>();

            await using var verification = CreateContext(connectionString);
            var persisted = await verification.Appeals.AsNoTracking().SingleAsync();
            persisted.Status.Should().Be("decided");
            persisted.DecisionNotes.Should().Be("First terminal decision");
            persisted.DecidedValue.Should().Be(455_000m);
            await verification.DisposeAsync();
            await secondContext.DisposeAsync();
            await firstContext.DisposeAsync();
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            if (File.Exists(databasePath))
                File.Delete(databasePath);
        }
    }

    private const string AppealsTableSql = """
        CREATE TABLE "Appeals" (
          "Id" TEXT NOT NULL CONSTRAINT "PK_Appeals" PRIMARY KEY,
          "ParcelId" TEXT NOT NULL, "AppealGround" TEXT NOT NULL, "Status" TEXT NOT NULL,
          "PetitionerName" TEXT NULL, "FiledDate" TEXT NOT NULL, "HearingDate" TEXT NULL,
          "DecisionDate" TEXT NULL, "CurrentValue" TEXT NOT NULL, "RequestedValue" TEXT NOT NULL,
          "DecidedValue" TEXT NULL, "DecisionNotes" TEXT NULL, "TaxYear" INTEGER NOT NULL,
          "CountyId" TEXT NOT NULL, "CreatedBy" TEXT NULL, "UpdatedBy" TEXT NULL,
          "CreatedAt" TEXT NOT NULL, "UpdatedAt" TEXT NOT NULL
        );
        CREATE TABLE "AuditLogs" (
          "Id" TEXT NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY,
          "Type" TEXT NOT NULL, "Data" TEXT NULL, "Timestamp" TEXT NOT NULL,
          "UserId" TEXT NULL, "UserEmail" TEXT NULL, "IpAddress" TEXT NULL,
          "UserAgent" TEXT NULL, "RequestPath" TEXT NULL, "RequestMethod" TEXT NULL,
          "CorrelationId" TEXT NULL, "ResponseStatusCode" INTEGER NULL, "DurationMs" INTEGER NULL,
          "MachineName" TEXT NULL, "ProcessId" INTEGER NULL, "Severity" TEXT NULL, "Source" TEXT NULL
        );
        """;

    private static TerraFusionDbContext CreateContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite(connectionString)
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = connectionString,
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();
        return new TerraFusionDbContext(options, configuration);
    }

    private sealed class CoordinatedTransitionPort : IDaisAppealMutationDecisionPort
    {
        private readonly FakeDaisAppealMutationDecisionPort _inner = new();
        private readonly TaskCompletionSource<bool> _firstEntered = new(
            TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource<bool> _bothEntered = new(
            TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource<bool> _releaseSecond = new(
            TaskCreationOptions.RunContinuationsAsynchronously);
        private int _transitionCalls;

        public Task FirstEntered => _firstEntered.Task;
        public Task BothEntered => _bothEntered.Task;

        public void ReleaseSecond() => _releaseSecond.TrySetResult(true);

        public Task<TerraFusion.Abstractions.DTOs.DaisAppealCreateDecisionResult> DecideCreateAsync(
            TerraFusion.Abstractions.DTOs.DaisAppealCreateDecisionRequest request,
            CancellationToken cancellationToken = default) =>
            _inner.DecideCreateAsync(request, cancellationToken);

        public async Task<TerraFusion.Abstractions.DTOs.DaisAppealTransitionDecisionResult> DecideTransitionAsync(
            TerraFusion.Abstractions.DTOs.DaisAppealTransitionDecisionRequest request,
            CancellationToken cancellationToken = default)
        {
            var order = Interlocked.Increment(ref _transitionCalls);
            if (order == 1)
            {
                _firstEntered.TrySetResult(true);
                await _bothEntered.Task.WaitAsync(cancellationToken);
            }
            else if (order == 2)
            {
                _bothEntered.TrySetResult(true);
                await _releaseSecond.Task.WaitAsync(cancellationToken);
            }
            else
            {
                throw new InvalidOperationException("Concurrency proof expected exactly two transitions.");
            }
            return await _inner.DecideTransitionAsync(request, cancellationToken);
        }
    }
}

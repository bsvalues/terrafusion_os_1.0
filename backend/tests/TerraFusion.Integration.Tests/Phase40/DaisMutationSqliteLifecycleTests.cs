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
}

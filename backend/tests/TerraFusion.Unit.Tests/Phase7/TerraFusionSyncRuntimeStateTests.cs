using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase7;

public class TerraFusionSyncRuntimeStateTests
{
    [Fact]
    public void Constructor_WithoutCanonicalPacsConfig_LeavesRuntimeUnconfigured()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>());

        var state = new TerraFusionSyncRuntimeState(
            configuration,
            NullLogger<TerraFusionSyncRuntimeState>.Instance);

        state.GetRegisteredSystems().Should().BeEmpty();
        state.GetConfiguredCounties().Should().BeEmpty();
        state.GetNextScheduledSync().Should().BeNull();
    }

    [Fact]
    public void Constructor_WithCanonicalPacsConfig_RegistersBentonRuntime()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:PacsConnection"] = "Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;",
            ["ConnectionStrings:PacsSalesConnection"] = "Server=localhost,1433;Database=pacs_golive;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;",
            ["HarrisPACS:Enabled"] = "true",
            ["County:Name"] = "Benton County",
            ["County:State"] = "WA",
            ["County:FipsCode"] = "53005",
            ["County:Code"] = "053",
            ["BentonCounty:SyncIntervalMinutes"] = "15"
        });

        var state = new TerraFusionSyncRuntimeState(
            configuration,
            NullLogger<TerraFusionSyncRuntimeState>.Instance);

        var system = state.GetRegisteredSystems().Should().ContainSingle().Subject;
        system.SystemType.Should().Be("harris_pacs");
        system.IsAvailable.Should().BeTrue();

        var county = state.GetConfiguredCounties().Should().ContainSingle().Subject;
        county.CountyName.Should().Be("Benton");
        county.State.Should().Be("WA");
        county.IsActive.Should().BeTrue();
        county.LegacySystemType.Should().Be("harris_pacs");
        county.Configuration.Should().ContainKey("ConnectionSettings");
    }

    [Fact]
    public void RecordSyncCompletion_UpdatesMetricsAndRecentEvents()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:PacsConnection"] = "Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;",
            ["ConnectionStrings:PacsSalesConnection"] = "Server=localhost,1433;Database=pacs_golive;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;",
            ["County:Name"] = "Benton County",
            ["County:State"] = "WA"
        });

        var state = new TerraFusionSyncRuntimeState(
            configuration,
            NullLogger<TerraFusionSyncRuntimeState>.Instance);

        state.SetOrchestrationActive(true);

        var syncResult = new CountySyncResult
        {
            CountyName = "Benton",
            LegacySystemType = "harris_pacs",
            Success = true,
            Status = "completed",
            Timestamp = DateTime.UtcNow,
            RecordsProcessed = 125,
            RecordsAdded = 100,
            RecordsUpdated = 20,
            RecordsSkipped = 5,
            TotalParcels = 112057
        };

        state.RecordSyncCompletion(syncResult);

        state.LastSyncTime.Should().BeCloseTo(syncResult.Timestamp, TimeSpan.FromSeconds(2));
        state.GetConfiguredCounty("Benton")!.TotalParcels.Should().Be(112057);

        var metrics = state.CreateMetricsSnapshot();
        metrics.TotalSyncOperations.Should().Be(1);
        metrics.SuccessfulSyncs.Should().Be(1);
        metrics.FailedSyncs.Should().Be(0);
        metrics.TotalRecordsProcessed.Should().Be(125);
        metrics.CountyMetrics.Should().ContainKey("Benton");

        var events = state.GetRecentEvents(10).ToList();
        events.Should().Contain(evt => evt.EventType == "Completed" && evt.CountyName == "Benton");
        events.Should().Contain(evt => evt.EventType == "OrchestrationStarted");
    }

    private static IConfiguration BuildConfiguration(Dictionary<string, string?> values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
}

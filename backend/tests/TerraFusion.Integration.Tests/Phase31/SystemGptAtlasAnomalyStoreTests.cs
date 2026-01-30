// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Store Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase31;

/// <summary>
/// Phase 31: Unit tests for the Atlas Anomaly Store.
/// Tests CRUD operations and query filtering for anomaly events.
/// </summary>
public class SystemGptAtlasAnomalyStoreTests
{
    private readonly Mock<ILogger<SystemGptAtlasAnomalyStore>> _loggerMock;

    public SystemGptAtlasAnomalyStoreTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptAtlasAnomalyStore>>();
    }

    private SystemGptAtlasAnomalyStore CreateStore()
    {
        return new SystemGptAtlasAnomalyStore(_loggerMock.Object);
    }

    #region Save Operations

    [Fact]
    public void Save_AddsAnomalyToStore()
    {
        // Arrange
        var store = CreateStore();
        var anomaly = CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike);

        // Act
        store.Save(anomaly);
        var retrieved = store.GetRecent();

        // Assert
        Assert.Single(retrieved);
        Assert.Equal(anomaly.Id, retrieved[0].Id);
    }

    [Fact]
    public void Save_MultipleSameCounty_AllPersisted()
    {
        // Arrange
        var store = CreateStore();
        var anomaly1 = CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike);
        var anomaly2 = CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike);

        // Act
        store.Save(anomaly1);
        store.Save(anomaly2);
        var retrieved = store.GetRecent();

        // Assert
        Assert.Equal(2, retrieved.Count);
    }

    [Fact]
    public void SaveBatch_AddsMultipleAnomalies()
    {
        // Arrange
        var store = CreateStore();
        var anomalies = new[]
        {
            CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike),
            CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike),
            CreateAnomaly("king", AtlasAnomalyKind.OfflinePattern),
        };

        // Act
        store.SaveBatch(anomalies);
        var retrieved = store.GetRecent();

        // Assert
        Assert.Equal(3, retrieved.Count);
    }

    #endregion

    #region Query Operations

    [Fact]
    public void GetRecent_ReturnsAllAnomalies_SortedByTimestampDescending()
    {
        // Arrange
        var store = CreateStore();
        var older = CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            timestamp: DateTimeOffset.UtcNow.AddMinutes(-10));
        var newer = CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            timestamp: DateTimeOffset.UtcNow);

        store.Save(older);
        store.Save(newer);

        // Act
        var retrieved = store.GetRecent();

        // Assert
        Assert.Equal(2, retrieved.Count);
        Assert.Equal(newer.Id, retrieved[0].Id); // Newer first
        Assert.Equal(older.Id, retrieved[1].Id);
    }

    [Fact]
    public void GetRecent_FiltersByCountyId()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike));
        store.Save(CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike));
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.GuardrailBurst));

        // Act
        var bentonOnly = store.GetRecent(countyId: "benton");

        // Assert
        Assert.Equal(2, bentonOnly.Count);
        Assert.All(bentonOnly, a => Assert.Equal("benton", a.CountyId));
    }

    [Fact]
    public void GetRecent_FiltersBySince()
    {
        // Arrange
        var store = CreateStore();
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-5);

        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            timestamp: DateTimeOffset.UtcNow.AddMinutes(-10))); // Before cutoff
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            timestamp: DateTimeOffset.UtcNow)); // After cutoff

        // Act
        var afterCutoff = store.GetRecent(since: cutoff);

        // Assert
        Assert.Single(afterCutoff);
        Assert.Equal(AtlasAnomalyKind.ErrorSpike, afterCutoff[0].Kind);
    }

    [Fact]
    public void GetRecent_FiltersBySeverity()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            severity: AtlasAnomalySeverity.Warning));
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            severity: AtlasAnomalySeverity.Critical));
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.GuardrailBurst,
            severity: AtlasAnomalySeverity.Info));

        // Act
        var critical = store.GetRecent(minSeverity: AtlasAnomalySeverity.Critical);

        // Assert
        Assert.Single(critical);
        Assert.Equal(AtlasAnomalySeverity.Critical, critical[0].Severity);
    }

    [Fact]
    public void GetRecent_LimitsResults()
    {
        // Arrange
        var store = CreateStore();
        for (int i = 0; i < 20; i++)
        {
            store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike));
        }

        // Act
        var limited = store.GetRecent(limit: 5);

        // Assert
        Assert.Equal(5, limited.Count);
    }

    [Fact]
    public void GetRecent_CombinesFilters()
    {
        // Arrange
        var store = CreateStore();
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-5);

        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            severity: AtlasAnomalySeverity.Critical,
            timestamp: DateTimeOffset.UtcNow)); // Match
        store.Save(CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike,
            severity: AtlasAnomalySeverity.Critical,
            timestamp: DateTimeOffset.UtcNow)); // Wrong county
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.GuardrailBurst,
            severity: AtlasAnomalySeverity.Warning,
            timestamp: DateTimeOffset.UtcNow)); // Wrong severity
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.OfflinePattern,
            severity: AtlasAnomalySeverity.Critical,
            timestamp: DateTimeOffset.UtcNow.AddMinutes(-10))); // Before cutoff

        // Act
        var filtered = store.GetRecent(
            countyId: "benton",
            minSeverity: AtlasAnomalySeverity.Critical,
            since: cutoff);

        // Assert
        Assert.Single(filtered);
        Assert.Equal(AtlasAnomalyKind.LatencySpike, filtered[0].Kind);
    }

    #endregion

    #region Summary Operations

    [Fact]
    public void GetSummary_ReturnsCountsPerCounty()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            severity: AtlasAnomalySeverity.Warning));
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            severity: AtlasAnomalySeverity.Critical));
        store.Save(CreateAnomaly("yakima", AtlasAnomalyKind.GuardrailBurst,
            severity: AtlasAnomalySeverity.Info));

        // Act
        var summaries = store.GetSummary();

        // Assert
        Assert.Equal(2, summaries.Count);

        var bentonSummary = summaries.First(s => s.CountyId == "benton");
        Assert.Equal(2, bentonSummary.TotalCount);
        Assert.Equal(1, bentonSummary.WarningCount);
        Assert.Equal(1, bentonSummary.CriticalCount);

        var yakimaSummary = summaries.First(s => s.CountyId == "yakima");
        Assert.Equal(1, yakimaSummary.TotalCount);
        Assert.Equal(1, yakimaSummary.InfoCount);
    }

    [Fact]
    public void GetSummary_FiltersBySince()
    {
        // Arrange
        var store = CreateStore();
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-5);

        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            timestamp: DateTimeOffset.UtcNow.AddMinutes(-10))); // Before
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            timestamp: DateTimeOffset.UtcNow)); // After

        // Act
        var summaries = store.GetSummary(since: cutoff);

        // Assert
        var bentonSummary = summaries.First(s => s.CountyId == "benton");
        Assert.Equal(1, bentonSummary.TotalCount);
    }

    [Fact]
    public void GetSummaryByCounty_ReturnsSingleCountySummary()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike));
        store.Save(CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike));

        // Act
        var summary = store.GetSummaryByCounty("benton");

        // Assert
        Assert.NotNull(summary);
        Assert.Equal("benton", summary.CountyId);
        Assert.Equal(1, summary.TotalCount);
    }

    [Fact]
    public void GetSummaryByCounty_ReturnsEmptySummary_WhenNoAnomalies()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var summary = store.GetSummaryByCounty("nonexistent");

        // Assert
        Assert.NotNull(summary);
        Assert.Equal("nonexistent", summary.CountyId);
        Assert.Equal(0, summary.TotalCount);
    }

    #endregion

    #region Cleanup Operations

    [Fact]
    public void ClearOld_RemovesExpiredAnomalies()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
            timestamp: DateTimeOffset.UtcNow.AddHours(-25))); // Old
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike,
            timestamp: DateTimeOffset.UtcNow)); // Recent

        // Act
        var removed = store.ClearOld(maxAge: TimeSpan.FromHours(24));
        var remaining = store.GetRecent();

        // Assert
        Assert.Equal(1, removed);
        Assert.Single(remaining);
        Assert.Equal(AtlasAnomalyKind.ErrorSpike, remaining[0].Kind);
    }

    [Fact]
    public void Clear_RemovesAllAnomalies()
    {
        // Arrange
        var store = CreateStore();
        store.Save(CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike));
        store.Save(CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike));

        // Act
        store.Clear();
        var remaining = store.GetRecent();

        // Assert
        Assert.Empty(remaining);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void GetRecent_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var result = store.GetRecent();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void GetSummary_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var result = store.GetSummary();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void Save_DuplicateId_UpdatesExisting()
    {
        // Arrange
        var store = CreateStore();
        var id = Guid.NewGuid();
        var original = CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike, id: id);
        var updated = CreateAnomaly("benton", AtlasAnomalyKind.ErrorSpike, id: id);

        // Act
        store.Save(original);
        store.Save(updated);
        var retrieved = store.GetRecent();

        // Assert
        Assert.Single(retrieved);
        Assert.Equal(AtlasAnomalyKind.ErrorSpike, retrieved[0].Kind);
    }

    #endregion

    #region Helper Methods

    private static SystemGptAtlasAnomalyEventDto CreateAnomaly(
        string countyId,
        AtlasAnomalyKind kind,
        AtlasAnomalySeverity severity = AtlasAnomalySeverity.Warning,
        DateTimeOffset? timestamp = null,
        Guid? id = null)
    {
        return new SystemGptAtlasAnomalyEventDto
        {
            Id = id ?? Guid.NewGuid(),
            CountyId = countyId,
            Kind = kind,
            Severity = severity,
            Timestamp = timestamp ?? DateTimeOffset.UtcNow,
            Reason = $"Test anomaly: {kind}",
            MetricValue = 100.0,
            ThresholdValue = 50.0
        };
    }

    #endregion
}

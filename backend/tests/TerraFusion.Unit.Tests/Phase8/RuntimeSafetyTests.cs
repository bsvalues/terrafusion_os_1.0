using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using FluentAssertions;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase8;

/// <summary>
/// Phase 8: Runtime Safety + Architectural Cleanup tests.
/// Validates ICacheStatisticsService implementation, NotImplementedException elimination,
/// and duplicate health check removal.
/// </summary>
[Trait("Phase", "8")]
[Trait("Component", "RuntimeSafety")]
[Trait("Category", "Architecture")]
public sealed class CacheStatisticsServiceTests
{
    private readonly InMemoryCacheStatisticsService _sut = new();

    [Fact]
    public void IncrementCacheHit_IncrementsCounter()
    {
        _sut.IncrementCacheHit();
        _sut.IncrementCacheHit();
        _sut.IncrementCacheHit();

        var stats = _sut.GetStatistics();
        stats.CacheHits.Should().Be(3);
    }

    [Fact]
    public void IncrementCacheMiss_IncrementsCounter()
    {
        _sut.IncrementCacheMiss();
        _sut.IncrementCacheMiss();

        var stats = _sut.GetStatistics();
        stats.CacheMisses.Should().Be(2);
    }

    [Fact]
    public void IncrementNegativeCacheHit_IncrementsCounter()
    {
        _sut.IncrementNegativeCacheHit();

        var stats = _sut.GetStatistics();
        stats.NegativeCacheHits.Should().Be(1);
    }

    [Fact]
    public void GetStatistics_TotalRequests_IsSumOfHitsAndMisses()
    {
        _sut.IncrementCacheHit();
        _sut.IncrementCacheHit();
        _sut.IncrementCacheMiss();

        var stats = _sut.GetStatistics();
        stats.TotalRequests.Should().Be(3);
    }

    [Fact]
    public async Task RecordCacheHitAsync_TracksPerKeyStatistics()
    {
        await _sut.RecordCacheHitAsync("user:123", TimeSpan.FromMilliseconds(5));
        await _sut.RecordCacheHitAsync("user:123", TimeSpan.FromMilliseconds(3));
        await _sut.RecordCacheMissAsync("user:456");

        var keyStats = await _sut.GetStatisticsAsync("user:123");
        keyStats.CacheHits.Should().Be(2);
        keyStats.CacheMisses.Should().Be(0);

        var otherKeyStats = await _sut.GetStatisticsAsync("user:456");
        otherKeyStats.CacheMisses.Should().Be(1);
    }

    [Fact]
    public async Task GetStatisticsAsync_UnknownKey_ReturnsEmptyStats()
    {
        var stats = await _sut.GetStatisticsAsync("nonexistent:key");
        stats.TotalRequests.Should().Be(0);
        stats.CacheHits.Should().Be(0);
    }

    [Fact]
    public async Task RecordCacheErrorAsync_DoesNotThrow()
    {
        // Should handle errors gracefully
        await _sut.RecordCacheErrorAsync(new InvalidOperationException("test"));
        await _sut.RecordCacheErrorAsync("key", "error message");

        // Errors don't affect hit/miss stats
        var stats = await _sut.GetStatisticsAsync();
        stats.CacheHits.Should().Be(0);
    }

    [Fact]
    public async Task RecordNegativeCacheHitAsync_IncrementsBothCounters()
    {
        await _sut.RecordNegativeCacheHitAsync("neg:key", TimeSpan.FromMilliseconds(1));

        var stats = _sut.GetStatistics();
        stats.NegativeCacheHits.Should().Be(1);
        stats.DatabaseQueriesPrevented.Should().Be(1);
    }

    [Fact]
    public void GetStatistics_StartTime_IsReasonable()
    {
        var stats = _sut.GetStatistics();
        stats.StartTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Service_ImplementsInterface()
    {
        // Verify the service properly implements the interface
        _sut.Should().BeAssignableTo<ICacheStatisticsService>();
    }

    [Fact]
    public async Task RecordCacheSetAsync_DoesNotThrow()
    {
        await _sut.RecordCacheSetAsync("set:key");
        await _sut.RecordCacheSetAsync("set:key2", TimeSpan.FromMilliseconds(10));
        // No exception = pass
    }

    [Fact]
    public async Task RecordCacheInvalidationAsync_DoesNotThrow()
    {
        await _sut.RecordCacheInvalidationAsync("inv:key");
        // No exception = pass
    }

    [Fact]
    public async Task RecordMissSentinelSetAsync_IncrementsSentinelCounter()
    {
        await _sut.RecordMissSentinelSetAsync("sentinel:key");
        await _sut.RecordMissSentinelSetAsync("sentinel:key2", TimeSpan.FromMilliseconds(1));

        var stats = _sut.GetStatistics();
        stats.MissSentinelsSet.Should().Be(2);
    }
}

[Trait("Phase", "8")]
[Trait("Component", "RuntimeSafety")]
[Trait("Category", "Architecture")]
public sealed class NotImplementedExceptionEliminationTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "pnpm-workspace.yaml")))
            dir = Directory.GetParent(dir)?.FullName;
        return dir ?? throw new InvalidOperationException("Could not find repo root");
    }

    [Fact]
    public void AIAssistantService_NoNotImplementedException()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.AI", "Services", "AIAssistantService.cs");
        File.Exists(filePath).Should().BeTrue("AIAssistantService.cs must exist");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("throw new NotImplementedException",
            "AIAssistantService should not throw NotImplementedException at runtime");
    }

    [Fact]
    public void CoPilotController_NoNotImplementedException()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Consciousness", "CoPilot", "CoPilotController.cs");
        File.Exists(filePath).Should().BeTrue("CoPilotController.cs must exist");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("throw new NotImplementedException",
            "CoPilotController should not throw NotImplementedException at runtime");
    }

    [Fact]
    public void WorkflowAutomationService_NoNotImplementedException()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.AI", "Services", "WorkflowAutomationService.cs");
        File.Exists(filePath).Should().BeTrue("WorkflowAutomationService.cs must exist");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("throw new NotImplementedException",
            "WorkflowAutomationService should not throw NotImplementedException at runtime");
    }
}

[Trait("Phase", "8")]
[Trait("Component", "RuntimeSafety")]
[Trait("Category", "Architecture")]
public sealed class DuplicateHealthCheckRemovalTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "pnpm-workspace.yaml")))
            dir = Directory.GetParent(dir)?.FullName;
        return dir ?? throw new InvalidOperationException("Could not find repo root");
    }

    [Fact]
    public void CustomHealthChecks_DoesNotContainDatabaseHealthCheck()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "HealthChecks", "CustomHealthChecks.cs");
        File.Exists(filePath).Should().BeTrue("CustomHealthChecks.cs must exist");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("class DatabaseHealthCheck",
            "DatabaseHealthCheck should only exist in Services/Monitoring/HealthChecks/");
    }

    [Fact]
    public void CustomHealthChecks_DoesNotContainRedisHealthCheck()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "HealthChecks", "CustomHealthChecks.cs");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("class RedisHealthCheck",
            "RedisHealthCheck should only exist in Services/Monitoring/HealthChecks/");
    }

    [Fact]
    public void CustomHealthChecks_DoesNotContainExternalApiHealthCheck()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "HealthChecks", "CustomHealthChecks.cs");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("class ExternalApiHealthCheck",
            "ExternalApiHealthCheck should only exist in Services/Monitoring/HealthChecks/");
    }

    [Fact]
    public void CustomHealthChecks_NoPragmaWarningDisable()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "HealthChecks", "CustomHealthChecks.cs");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("#pragma warning disable",
            "CustomHealthChecks should not suppress warnings after Phase 8 cleanup");
    }

    [Fact]
    public void RealHealthChecks_ExistInMonitoringNamespace()
    {
        var monitoringDir = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "Services", "Monitoring", "HealthChecks");
        Directory.Exists(monitoringDir).Should().BeTrue("Monitoring/HealthChecks directory must exist");

        File.Exists(Path.Combine(monitoringDir, "DatabaseHealthCheck.cs")).Should().BeTrue();
        File.Exists(Path.Combine(monitoringDir, "RedisHealthCheck.cs")).Should().BeTrue();
        File.Exists(Path.Combine(monitoringDir, "ExternalApiHealthCheck.cs")).Should().BeTrue();
        File.Exists(Path.Combine(monitoringDir, "ApplicationInsightsHealthCheck.cs")).Should().BeTrue();
    }
}

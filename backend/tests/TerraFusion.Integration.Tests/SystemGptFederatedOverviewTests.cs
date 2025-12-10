// ═══════════════════════════════════════════════════════════════════════════════
// Phase 23: SystemGPT Federated Overview Tests
// Tests for the multi-county dashboard aggregation service.
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 23: Tests for the SystemGPT Federated Overview Service.
/// Validates multi-county aggregation, placeholder data for non-configured counties, and error handling.
/// </summary>
public class SystemGptFederatedOverviewTests
{
    #region Service Instantiation Tests

    [Fact]
    public void FederatedOverviewService_CanBeCreatedWithNoOptionalServices()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;

        // Act
        var service = new SystemGptFederatedOverviewService(logger);

        // Assert
        Assert.NotNull(service);
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsAllCounties()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCounties); // Benton, Yakima, Franklin
        Assert.Equal(3, result.Counties.Count);
    }

    [Fact]
    public async Task GetOverviewAsync_IncludesBentonAsConfigured()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var benton = result.Counties.FirstOrDefault(c => c.CountyId == "benton");
        Assert.NotNull(benton);
        Assert.True(benton.Configured);
        Assert.Equal("Benton County", benton.CountyName);
    }

    [Fact]
    public async Task GetOverviewAsync_MarksYakimaAsNotConfigured()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.False(yakima.Configured);
        Assert.Equal("Yakima County", yakima.CountyName);
        Assert.Equal("Not configured", yakima.Note);
    }

    [Fact]
    public async Task GetOverviewAsync_MarksFranklinAsNotConfigured()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var franklin = result.Counties.FirstOrDefault(c => c.CountyId == "franklin");
        Assert.NotNull(franklin);
        Assert.False(franklin.Configured);
        Assert.Equal("Franklin County", franklin.CountyName);
        Assert.Equal("Not configured", franklin.Note);
    }

    [Fact]
    public async Task GetOverviewAsync_HasCorrectConfiguredCountiesCount()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        Assert.Equal(1, result.ConfiguredCounties); // Only Benton is configured
    }

    #endregion

    #region Non-Configured County Placeholder Tests

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasUnknownHealth()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal("Unknown", yakima.Health);
    }

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasUnknownCapacityRisk()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal("Unknown", yakima.CapacityRisk);
    }

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasNegativeLatency()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal(-1, yakima.P95LatencyMs);
    }

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasNegativeErrorRate()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal(-1, yakima.ErrorRatePercent);
    }

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasUnknownRagStatus()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal("Unknown", yakima.RagStatus);
    }

    [Fact]
    public async Task GetOverviewAsync_NonConfiguredCounty_HasUnknownAiMode()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert
        var yakima = result.Counties.FirstOrDefault(c => c.CountyId == "yakima");
        Assert.NotNull(yakima);
        Assert.Equal("Unknown", yakima.AiMode);
    }

    #endregion

    #region Timestamp Tests

    [Fact]
    public async Task GetOverviewAsync_HasRecentTimestamp()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var result = await service.GetOverviewAsync();
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.True(result.GeneratedAtUtc >= before);
        Assert.True(result.GeneratedAtUtc <= after);
    }

    #endregion

    #region DTO Structure Tests

    [Fact]
    public void SystemGptCountyOverviewDto_HasAllRequiredProperties()
    {
        // Arrange & Act
        var dto = new SystemGptCountyOverviewDto
        {
            CountyId = "test",
            CountyName = "Test County",
            Configured = true,
            Health = "Healthy",
            CapacityRisk = "Low",
            P95LatencyMs = 100,
            ErrorRatePercent = 0.5,
            RagStatus = "Ready",
            AiMode = "Normal",
            Note = "Test note"
        };

        // Assert
        Assert.Equal("test", dto.CountyId);
        Assert.Equal("Test County", dto.CountyName);
        Assert.True(dto.Configured);
        Assert.Equal("Healthy", dto.Health);
        Assert.Equal("Low", dto.CapacityRisk);
        Assert.Equal(100, dto.P95LatencyMs);
        Assert.Equal(0.5, dto.ErrorRatePercent);
        Assert.Equal("Ready", dto.RagStatus);
        Assert.Equal("Normal", dto.AiMode);
        Assert.Equal("Test note", dto.Note);
    }

    [Fact]
    public void SystemGptCountyOverviewDto_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var dto = new SystemGptCountyOverviewDto();

        // Assert
        Assert.Equal(string.Empty, dto.CountyId);
        Assert.Equal(string.Empty, dto.CountyName);
        Assert.False(dto.Configured);
        Assert.Equal("Unknown", dto.Health);
        Assert.Equal("Unknown", dto.CapacityRisk);
        Assert.Equal(-1, dto.P95LatencyMs);
        Assert.Equal(-1, dto.ErrorRatePercent);
        Assert.Equal("Unknown", dto.RagStatus);
        Assert.Equal("Unknown", dto.AiMode);
        Assert.Null(dto.Note);
    }

    [Fact]
    public void SystemGptFederatedOverviewResponse_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var response = new SystemGptFederatedOverviewResponse();

        // Assert
        Assert.Equal(0, response.TotalCounties);
        Assert.Equal(0, response.ConfiguredCounties);
        Assert.Empty(response.Counties);
    }

    #endregion

    #region County Order Tests

    [Fact]
    public async Task GetOverviewAsync_CountiesInExpectedOrder()
    {
        // Arrange
        var logger = NullLogger<SystemGptFederatedOverviewService>.Instance;
        var service = new SystemGptFederatedOverviewService(logger);

        // Act
        var result = await service.GetOverviewAsync();

        // Assert - counties should be in the order defined by CountyHelper.AllCounties
        Assert.Equal("benton", result.Counties[0].CountyId);
        Assert.Equal("yakima", result.Counties[1].CountyId);
        Assert.Equal("franklin", result.Counties[2].CountyId);
    }

    #endregion
}

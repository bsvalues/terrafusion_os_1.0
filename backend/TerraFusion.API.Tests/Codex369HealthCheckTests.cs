/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 HEALTH CHECK TESTS
 * Comprehensive test suite for framework health monitoring
 * Tests both standard and comprehensive health check implementations
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.API.Tests;

/// <summary>
/// Test suite for Codex 3-6-9 health check implementations
/// Tests both Codex369HealthCheck and Codex369ComprehensiveHealthCheck
/// Validates framework health status reporting for ASP.NET Core health endpoints
/// </summary>
public class Codex369HealthCheckTests
{
    private readonly Mock<ICodex369FrameworkService> _mockFrameworkService;
    private readonly Mock<ICodex369AlertService> _mockAlertService;
    private readonly Mock<ILogger<Codex369HealthCheck>> _mockLogger;
    private readonly Mock<ILogger<Codex369ComprehensiveHealthCheck>> _mockComprehensiveLogger;

    public Codex369HealthCheckTests()
    {
        _mockFrameworkService = new Mock<ICodex369FrameworkService>();
        _mockAlertService = new Mock<ICodex369AlertService>();
        _mockLogger = new Mock<ILogger<Codex369HealthCheck>>();
        _mockComprehensiveLogger = new Mock<ILogger<Codex369ComprehensiveHealthCheck>>();
    }

    #region Standard Health Check Tests

    [Fact]
    public async Task Codex369HealthCheck_DivineBalance_ReturnsHealthy()
    {
        // Arrange
        var status = CreateMockFrameworkStatus(powerScore: 11.87, divineBalance: true);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Equal("DIVINE BALANCE - Framework operating at ultimate power (11.87/12)", result.Description);
        Assert.NotNull(result.Data);
        Assert.Equal(11.87, result.Data["currentPowerScore"]);
        Assert.Equal("DIVINE_BALANCE", result.Data["healthStatus"]);
        Assert.True((bool)result.Data["divineBalance"]);
        Assert.True((bool)result.Data["complianceAligned"]);
    }

    [Fact]
    public async Task Codex369HealthCheck_HealthyRange_ReturnsHealthy()
    {
        // Arrange - Score 10.0-11.49 is healthy but not divine balance
        var status = CreateMockFrameworkStatus(powerScore: 10.5, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Equal("Framework operating normally (10.50/12)", result.Description);
        Assert.False((bool)result.Data["divineBalance"]);
    }

    [Fact]
    public async Task Codex369HealthCheck_DegradedRange_ReturnsDegraded()
    {
        // Arrange - Score 7.0-9.99 is degraded
        var status = CreateMockFrameworkStatus(powerScore: 8.3, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Equal("Framework degraded - Balance restoration recommended (8.30/12)", result.Description);
        Assert.Equal(8.3, result.Data["currentPowerScore"]);
        Assert.Equal("DEGRADED", result.Data["healthStatus"]);
    }

    [Fact]
    public async Task Codex369HealthCheck_UnhealthyRange_ReturnsUnhealthy()
    {
        // Arrange - Score below 7.0 is unhealthy
        var status = CreateMockFrameworkStatus(powerScore: 5.2, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Equal("Framework critically degraded - IMMEDIATE ACTION REQUIRED (5.20/12)", result.Description);
        Assert.Equal(5.2, result.Data["currentPowerScore"]);
        Assert.Equal("CRITICAL", result.Data["healthStatus"]);
    }

    [Fact]
    public async Task Codex369HealthCheck_ComplianceNotAligned_ReturnsDegraded()
    {
        // Arrange - Even with good score, compliance issues cause degraded status
        var status = CreateMockFrameworkStatus(powerScore: 11.0, divineBalance: false);
        status.ComplianceAligned = false;

        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Contains("compliance issues detected", result.Description);
        Assert.False((bool)result.Data["complianceAligned"]);
    }

    [Fact]
    public async Task Codex369HealthCheck_666SafeguardViolation_ReturnsUnhealthy()
    {
        // Arrange
        var status = CreateMockFrameworkStatus(powerScore: 10.0, divineBalance: false);
        status.AmplificationMetrics = new List<Codex369AmplificationDto>
        {
            new Codex369AmplificationDto
            {
                Name = "System Efficiency Amplifier",
                RawCombinedValue = 720.0, // Above 666 threshold!
                SafeFromImbalance = false,
                SafetyMargin = -54.0,
                ThresholdWarning = "⚠️ IMBALANCE THRESHOLD EXCEEDED: 720.00 >= 666.00"
            }
        };

        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Contains("666 SAFEGUARD VIOLATION", result.Description);
        Assert.True(result.Data.ContainsKey("safeguardViolations"));
    }

    [Fact]
    public async Task Codex369HealthCheck_ServiceThrowsException_ReturnsUnhealthy()
    {
        // Arrange
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ThrowsAsync(new Exception("Database connection failed"));

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Contains("Health check failed", result.Description);
        Assert.Equal("Database connection failed", result.Exception?.Message);
    }

    #endregion

    #region Comprehensive Health Check Tests

    [Fact]
    public async Task ComprehensiveHealthCheck_AllSystemsHealthy_ReturnsHealthy()
    {
        // Arrange
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 11.87, divineBalance: true);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        var activeAlerts = new List<Codex369Alert>();
        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(activeAlerts);

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Contains("All systems operating optimally", result.Description);
        Assert.Equal(0, result.Data["activeAlerts"]);
        Assert.Equal(0, result.Data["criticalAlerts"]);
        Assert.Equal(0, result.Data["warningAlerts"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_WarningAlerts_ReturnsDegraded()
    {
        // Arrange
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 10.5, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        var activeAlerts = new List<Codex369Alert>
        {
            new Codex369Alert
            {
                Severity = AlertSeverity.Warning,
                Title = "⚠️ SYSTEM NEEDS ATTENTION",
                Message = "System performance degraded"
            }
        };
        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(activeAlerts);

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Contains("1 active warning(s)", result.Description);
        Assert.Equal(1, result.Data["activeAlerts"]);
        Assert.Equal(0, result.Data["criticalAlerts"]);
        Assert.Equal(1, result.Data["warningAlerts"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_CriticalAlerts_ReturnsUnhealthy()
    {
        // Arrange
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 5.0, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        var activeAlerts = new List<Codex369Alert>
        {
            new Codex369Alert
            {
                Severity = AlertSeverity.Critical,
                Title = "🚨 CRITICAL BALANCE DEFICIT",
                Message = "System balance critically low"
            },
            new Codex369Alert
            {
                Severity = AlertSeverity.Critical,
                Title = "🚨 666 SAFEGUARD WARNING",
                Message = "Amplification approaching 666 threshold"
            }
        };
        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(activeAlerts);

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Contains("2 critical alert(s)", result.Description);
        Assert.Equal(2, result.Data["activeAlerts"]);
        Assert.Equal(2, result.Data["criticalAlerts"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_MixedAlerts_ReturnsUnhealthy()
    {
        // Arrange - Critical alerts override warning alerts
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 8.0, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        var activeAlerts = new List<Codex369Alert>
        {
            new Codex369Alert { Severity = AlertSeverity.Critical, Title = "Critical Issue" },
            new Codex369Alert { Severity = AlertSeverity.Warning, Title = "Warning 1" },
            new Codex369Alert { Severity = AlertSeverity.Warning, Title = "Warning 2" },
            new Codex369Alert { Severity = AlertSeverity.Info, Title = "Info" }
        };
        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(activeAlerts);

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Equal(4, result.Data["activeAlerts"]);
        Assert.Equal(1, result.Data["criticalAlerts"]);
        Assert.Equal(2, result.Data["warningAlerts"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_DivineBalanceWithNoAlerts_ReturnsHealthyWithSpecialMessage()
    {
        // Arrange
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 11.87, divineBalance: true);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(new List<Codex369Alert>());

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Contains("DIVINE BALANCE", result.Description);
        Assert.Contains("All systems operating optimally", result.Description);
        Assert.True((bool)result.Data["divineBalance"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_AlertServiceFails_StillReportsFrameworkStatus()
    {
        // Arrange
        var frameworkStatus = CreateMockFrameworkStatus(powerScore: 10.5, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(frameworkStatus);

        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ThrowsAsync(new Exception("Alert service unavailable"));

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        // Should still report framework status even if alert service fails
        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Contains("Alert system unavailable", result.Description);
        Assert.Equal(10.5, result.Data["currentPowerScore"]);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_BothServicesFail_ReturnsUnhealthy()
    {
        // Arrange
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ThrowsAsync(new Exception("Framework service failed"));

        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ThrowsAsync(new Exception("Alert service failed"));

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Contains("Comprehensive health check failed", result.Description);
    }

    #endregion

    #region Health Check Data Validation Tests

    [Fact]
    public async Task Codex369HealthCheck_IncludesAllRequiredData()
    {
        // Arrange
        var status = CreateMockFrameworkStatus(powerScore: 11.5, divineBalance: true);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var healthCheck = new Codex369HealthCheck(_mockFrameworkService.Object, _mockLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert - Verify all required data fields are present
        Assert.Contains("currentPowerScore", result.Data.Keys);
        Assert.Contains("targetScore", result.Data.Keys);
        Assert.Contains("balanceDeficit", result.Data.Keys);
        Assert.Contains("healthStatus", result.Data.Keys);
        Assert.Contains("divineBalance", result.Data.Keys);
        Assert.Contains("complianceAligned", result.Data.Keys);
        Assert.Contains("totalFoundationMetrics", result.Data.Keys);
        Assert.Contains("totalAmplifications", result.Data.Keys);
    }

    [Fact]
    public async Task ComprehensiveHealthCheck_IncludesAllRequiredData()
    {
        // Arrange
        var status = CreateMockFrameworkStatus(powerScore: 10.5, divineBalance: false);
        _mockFrameworkService
            .Setup(s => s.GetRealtimeFrameworkStatusAsync())
            .ReturnsAsync(status);

        var alerts = new List<Codex369Alert>
        {
            new Codex369Alert { Severity = AlertSeverity.Warning, Title = "Test" }
        };
        _mockAlertService
            .Setup(s => s.GetActiveAlertsAsync(It.IsAny<AlertSeverity?>()))
            .ReturnsAsync(alerts);

        var healthCheck = new Codex369ComprehensiveHealthCheck(
            _mockFrameworkService.Object,
            _mockAlertService.Object,
            _mockComprehensiveLogger.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert - Verify all required data fields including alert metrics
        Assert.Contains("activeAlerts", result.Data.Keys);
        Assert.Contains("criticalAlerts", result.Data.Keys);
        Assert.Contains("warningAlerts", result.Data.Keys);
        Assert.Contains("currentPowerScore", result.Data.Keys);
        Assert.Contains("divineBalance", result.Data.Keys);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Create mock framework status for testing
    /// </summary>
    private Codex369StatusDto CreateMockFrameworkStatus(double powerScore, bool divineBalance)
    {
        return new Codex369StatusDto
        {
            CurrentPowerScore = powerScore,
            TargetScore = 12.0,
            BalanceDeficit = 12.0 - powerScore,
            ComplianceAligned = true,
            FoundationMetrics = CreateMockFoundationMetrics(),
            AmplificationMetrics = CreateMockAmplificationMetrics(),
            UltimatePower = new Codex369UltimatePowerDto
            {
                UltimatePowerScore = powerScore,
                InDivineBalance = divineBalance,
                BalanceProximity = divineBalance ? 1.0 : (powerScore / 12.0),
                HealthStatus = divineBalance ? "DIVINE_BALANCE" :
                              powerScore >= 10.0 ? "HEALTHY" :
                              powerScore >= 7.0 ? "DEGRADED" : "CRITICAL"
            },
            TotalFoundationMetrics = 12,
            TotalAmplifications = 5,
            SystemRecommendations = new List<string>
            {
                "Continue monitoring framework balance",
                "Review compliance metrics quarterly"
            },
            StatusTimestamp = DateTime.UtcNow
        };
    }

    private List<Codex369FoundationDto> CreateMockFoundationMetrics()
    {
        return new List<Codex369FoundationDto>
        {
            new Codex369FoundationDto { Category = "System Performance", MetricName = "API Response Time", RawValue = 180.0, NormalizedScore = 9.0 },
            new Codex369FoundationDto { Category = "System Performance", MetricName = "Database Query Efficiency", RawValue = 85.0, NormalizedScore = 10.2 },
            new Codex369FoundationDto { Category = "System Performance", MetricName = "Service Uptime", RawValue = 99.9, NormalizedScore = 12.0 }
        };
    }

    private List<Codex369AmplificationDto> CreateMockAmplificationMetrics()
    {
        return new List<Codex369AmplificationDto>
        {
            new Codex369AmplificationDto
            {
                Name = "System Efficiency Amplifier",
                RawCombinedValue = 274.9,
                ScaledValue = 9.4,
                SafeFromImbalance = true,
                SafetyMargin = 391.1,
                ThresholdWarning = null
            },
            new Codex369AmplificationDto
            {
                Name = "Government Compliance Amplifier",
                RawCombinedValue = 285.0,
                ScaledValue = 9.8,
                SafeFromImbalance = true,
                SafetyMargin = 381.0,
                ThresholdWarning = null
            }
        };
    }

    #endregion
}

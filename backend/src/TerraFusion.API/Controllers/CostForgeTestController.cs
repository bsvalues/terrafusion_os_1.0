using Microsoft.AspNetCore.Mvc;

#if DEBUG
namespace TerraFusion.API.Controllers;

/// <summary>
/// Development-only test endpoints for CostForge integration.
/// This controller is compiled only in DEBUG builds.
/// </summary>
[ApiController]
[Route("api/costforge-test")]
public class CostForgeTestController : ControllerBase
{
    private readonly ILogger<CostForgeTestController> _logger;

    public CostForgeTestController(ILogger<CostForgeTestController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Mock system status endpoint for CostForgeIntegrationPanel
    /// </summary>
    [HttpGet("status")]
    public ActionResult GetSystemStatus()
    {
        _logger.LogInformation("CostForge test status endpoint called");

        return Ok(new
        {
            status = "operational",
            activeAgents = 50247,
            performanceScore = 0.998,
            lastUpdate = DateTime.UtcNow,
            systemMetrics = new
            {
                uptime = "99.98%",
                responseTime = "88ms",
                accuracy = "99.5%",
                throughput = "1,247 requests/sec"
            }
        });
    }

    /// <summary>
    /// Mock performance metrics endpoint
    /// </summary>
    [HttpGet("metrics")]
    public ActionResult GetPerformanceMetrics()
    {
        _logger.LogInformation("CostForge test metrics endpoint called");

        return Ok(new
        {
            averageResponseTime = 88.5,
            requestsPerSecond = 1247,
            accuracyRate = 0.995,
            totalCalculations = 2847593,
            detailedMetrics = new
            {
                cacheHitRate = 0.852,
                memoryUsage = 0.421,
                cpuUtilization = 0.328,
                networkLatency = 12.3,
                errorRate = 0.002
            }
        });
    }

    /// <summary>
    /// Mock AI agent status endpoint
    /// </summary>
    [HttpGet("agents/status")]
    public ActionResult GetAIAgentStatus()
    {
        _logger.LogInformation("CostForge test agent status endpoint called");

        return Ok(new
        {
            totalAgents = 50247,
            activeAgents = 48932,
            idleAgents = 1315,
            overallPerformance = 0.987,
            agentGroups = new[]
            {
                new { groupName = "Cost Analysis", agentCount = 15000, status = "active", performanceScore = 0.995 },
                new { groupName = "Data Processing", agentCount = 12500, status = "active", performanceScore = 0.988 },
                new { groupName = "Validation", agentCount = 8000, status = "active", performanceScore = 0.992 },
                new { groupName = "Harris PACS Sync", agentCount = 7500, status = "active", performanceScore = 0.975 },
                new { groupName = "County Integration", agentCount = 7247, status = "active", performanceScore = 0.983 }
            }
        });
    }

    /// <summary>
    /// Mock scale agents endpoint
    /// </summary>
    [HttpPost("agents/scale")]
    public ActionResult ScaleAIAgents([FromBody] TestScaleAgentsRequest request)
    {
        _logger.LogInformation("CostForge test scale agents endpoint called: {TargetCount}", request.TargetCount);

        return Ok(new
        {
            message = $"AI agents scaled to {request.TargetCount}",
            status = "Success",
            previousCount = 50247,
            newCount = request.TargetCount,
            scalingTime = "2.3 seconds"
        });
    }

    /// <summary>
    /// Mock Harris PACS sync endpoint
    /// </summary>
    [HttpPost("sync/harris-pacs")]
    public ActionResult SyncWithHarrisPACS([FromBody] TestHarrisSyncRequest request)
    {
        _logger.LogInformation("CostForge test Harris PACS sync endpoint called: {CountyId}", request.CountyId);

        var propertiesSynced = request.CountyId?.ToLower() switch
        {
            "benton" => 89_247, // CARD-10: Benton County parcel count stub
            "franklin" => 34156,
            "yakima" => 127834,
            "king" => 534927,
            _ => 25000
        };

        return Ok(new
        {
            countyId = request.CountyId,
            syncDate = DateTime.UtcNow,
            propertiesSynced = propertiesSynced,
            propertiesUpdated = (int)(propertiesSynced * 0.15),
            propertiesAdded = (int)(propertiesSynced * 0.05),
            syncErrors = new string[0],
            success = true,
            syncDuration = "47.2 seconds"
        });
    }

    /// <summary>
    /// Mock property cost calculation endpoint
    /// </summary>
    [HttpPost("calculate")]
    public ActionResult CalculatePropertyCost([FromBody] TestPropertyCostRequest request)
    {
        _logger.LogInformation("CostForge test calculate endpoint called: {PropertyValue}, {County}",
            request.PropertyValue, request.County);

        // Simulate calculation with regional variations
        var baseValue = request.PropertyValue ?? 892470; // Benton County property estimate
        var regionalMultiplier = request.County?.ToLower() switch
        {
            "king" => 1.35,
            "pierce" => 1.15,
            "snohomish" => 1.25,
            "spokane" => 0.85,
            "benton" => 0.92,
            "franklin" => 0.88,
            "yakima" => 0.79,
            _ => 1.0
        };

        var calculatedValue = baseValue * (decimal)regionalMultiplier;

        return Ok(new
        {
            propertyId = Guid.NewGuid(),
            totalCost = calculatedValue,
            landValue = calculatedValue * 0.3m,
            improvementValue = calculatedValue * 0.7m,
            marketAdjustment = calculatedValue * 0.05m,
            confidenceScore = 0.958,
            analysisDate = DateTime.UtcNow,
            analysisMethod = "TerraFusion CostForge AI",
            components = new[]
            {
                new { name = "Land Value", amount = calculatedValue * 0.3m, unit = "USD", quantity = 1, unitCost = calculatedValue * 0.3m },
                new { name = "Structure", amount = calculatedValue * 0.5m, unit = "USD", quantity = 1, unitCost = calculatedValue * 0.5m },
                new { name = "Improvements", amount = calculatedValue * 0.2m, unit = "USD", quantity = 1, unitCost = calculatedValue * 0.2m }
            }
        });
    }
}

/// <summary>
/// Request DTOs for test endpoints
/// </summary>
public class TestScaleAgentsRequest
{
    public int TargetCount { get; set; }
}

public class TestHarrisSyncRequest
{
    public string? CountyId { get; set; }
    public string? SyncType { get; set; }
    public DateTime? LastSyncDate { get; set; }
    public List<string>? PropertyTypes { get; set; }
}

public class TestPropertyCostRequest
{
    public decimal? PropertyValue { get; set; }
    public string? County { get; set; }
    public bool TestMode { get; set; } = true;
}
#endif

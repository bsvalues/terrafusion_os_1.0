using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Government Operations API Controller
/// Provides government excellence endpoints for Benton County operations
/// </summary>
[ApiController]
[Route("api/government")]
public class GovernmentController : ControllerBase
{
    private readonly ILogger<GovernmentController> _logger;
    private readonly ITerrasyncService _terrasyncService;
    private readonly TerraFusionDbContext _db;

    public GovernmentController(
        ILogger<GovernmentController> logger,
        ITerrasyncService terrasyncService,
        TerraFusionDbContext db)
    {
        _logger = logger;
        _terrasyncService = terrasyncService;
        _db = db;
    }

    private static object BentonCountyIdentity(int totalParcels) => new
    {
        name = "Benton County",
        state = "Washington",
        fips = "53005",
        totalParcels,
    };

    /// <summary>
    /// Get live parcel count and basic backend stats for Benton County surfaces.
    /// </summary>
    [HttpGet("stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetGovernmentStats()
    {
        try
        {
            var totalParcels = await _db.Properties.AsNoTracking().CountAsync();

            return Ok(new
            {
                county = new
                {
                    name = "Benton County",
                    state = "Washington",
                    fips = "53005",
                },
                stats = new
                {
                    totalParcels,
                    dataSource = "LIVE_DB",
                    stubbed = false,
                },
                timestamp = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get live government stats");
            return StatusCode(500, new { error = "Failed to retrieve government stats", message = ex.Message });
        }
    }

    /// <summary>
    /// Get government excellence status for Benton County
    /// Returns only evidence-backed local status plus explicit external-system availability.
    /// </summary>
    [HttpGet("excellence")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetGovernmentExcellence()
    {
        try
        {
            var totalParcels = await _db.Properties.AsNoTracking().CountAsync();
            var terrasyncHealthy = await _terrasyncService.IsHealthyAsync();

            return Ok(new
            {
                status = terrasyncHealthy ? "LOCAL_LIVE_WITH_EXTERNAL_SYNC" : "LOCAL_LIVE",
                county = BentonCountyIdentity(totalParcels),
                propertyAssessment = new
                {
                    status = "LIVE_DB",
                    totalParcels,
                    dataSource = "LIVE_DB",
                    note = "Parcel count is backed by the TerraFusion database for Benton County.",
                },
                externalSystems = new
                {
                    terrasync = new
                    {
                        status = terrasyncHealthy ? "AVAILABLE" : "UNAVAILABLE",
                        endpoint = "api/health",
                        note = terrasyncHealthy
                            ? "TerraSync health endpoint responded."
                            : "TerraSync did not respond. This route does not substitute fabricated sync metrics.",
                    },
                    legacyAssessmentSystem = new
                    {
                        status = "REFERENCE_ONLY",
                        system = "Harris PACS",
                        note = "Legacy assessment metadata is not asserted as a live telemetry feed on this route.",
                    },
                },
                operatorPosture = new
                {
                    governedActions = "PILOT_ONLY",
                    aiSwarmStatus = "UNAVAILABLE",
                    complianceStatus = "UNVERIFIED",
                    warnings = new[]
                    {
                        "This surface reports live parcel totals and external system reachability only.",
                        "It does not claim live AI swarm, optimization, satisfaction, or SLA metrics.",
                    },
                },
                timestamp = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get government excellence status");
            return StatusCode(500, new { error = "Failed to retrieve government status", message = ex.Message });
        }
    }

    /// <summary>
    /// Get county configuration and operational details
    /// Returns Benton identity plus explicit availability of supporting systems.
    /// </summary>
    [HttpGet("county-config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetCountyConfig()
    {
        try
        {
            var totalParcels = await _db.Properties.AsNoTracking().CountAsync();
            var terrasyncHealthy = await _terrasyncService.IsHealthyAsync();

            return Ok(new
            {
                county = new
                {
                    id = "benton",
                    name = "Benton County",
                    state = "Washington",
                    fips = "53005",
                    timezone = "America/Los_Angeles",
                    parcelCount = totalParcels,
                },
                legacySystem = new
                {
                    name = "Harris PACS",
                    version = (string?)null,
                    status = "REFERENCE_ONLY",
                    note = "Legacy-system version and sync cadence are not emitted as live telemetry on this route.",
                },
                deployment = new
                {
                    environment = "PRODUCTION",
                    mode = "BENTON_COUNTY",
                    multiCounty = false,
                    governedExecution = "PILOT_ONLY",
                },
                features = new
                {
                    propertyAssessmentData = true,
                    terrasyncHealth = terrasyncHealthy,
                    aiSwarm = false,
                    quantumOptimization = false,
                    advancedAnalytics = false,
                    complianceMonitoring = false,
                },
                evidence = new
                {
                    parcelDataSource = "LIVE_DB",
                    terrasyncReachable = terrasyncHealthy,
                    note = "Only live parcel totals and external-system reachability are asserted here.",
                },
                timestamp = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get county configuration");
            return StatusCode(500, new { error = "Failed to retrieve county config", message = ex.Message });
        }
    }

    /// <summary>
    /// Get system status for monitoring dashboard
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetSystemStatus()
    {
        try
        {
            _logger.LogInformation("📊 Getting government system status");
            var totalParcels = await _db.Properties.AsNoTracking().CountAsync();
            var terrasyncHealthy = await _terrasyncService.IsHealthyAsync();

            return Ok(new
            {
                system = new
                {
                    name = "TerraFusion OS",
                    version = "1.0.0",
                    environment = "PRODUCTION",
                    county = "Benton County, WA",
                },
                services = new
                {
                    api = new { status = "HEALTHY" },
                    database = new { status = "HEALTHY", totalParcels },
                    terrasync = new
                    {
                        status = terrasyncHealthy ? "AVAILABLE" : "UNAVAILABLE",
                        note = terrasyncHealthy
                            ? "TerraSync health endpoint responded."
                            : "TerraSync did not respond during this request.",
                    },
                    agentOperations = new
                    {
                        status = "UNAVAILABLE",
                        note = "No governed agent registry is attached to this route.",
                    },
                },
                evidence = new
                {
                    parcelDataSource = "LIVE_DB",
                    externalSync = terrasyncHealthy ? "REACHABLE" : "UNREACHABLE",
                    claimsLimitedToObservedSystems = true,
                },
                alerts = terrasyncHealthy
                    ? Array.Empty<string>()
                    : new[] { "TerraSync health endpoint is unavailable." },
                lastUpdated = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get system status");
            return StatusCode(500, new { error = "Failed to retrieve system status", message = ex.Message });
        }
    }

    /// <summary>
    /// Health check specifically for government services
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetGovernmentHealth()
    {
        try
        {
            var terrasyncHealthy = await _terrasyncService.IsHealthyAsync();
            return Ok(new
            {
                status = terrasyncHealthy ? "healthy" : "degraded",
                government = new
                {
                    operationalStatus = terrasyncHealthy ? "LOCAL_LIVE_WITH_EXTERNAL_SYNC" : "LOCAL_LIVE",
                    county = "Benton County, WA",
                    parcelData = "LIVE_DB",
                    terrasync = terrasyncHealthy ? "AVAILABLE" : "UNAVAILABLE",
                    governedActions = "PILOT_ONLY",
                },
                warnings = terrasyncHealthy
                    ? Array.Empty<string>()
                    : new[] { "TerraSync health endpoint unavailable. No substitute telemetry is fabricated." },
                timestamp = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Government health check degraded");
            return Ok(new
            {
                status = "degraded",
                government = new
                {
                    operationalStatus = "DEGRADED",
                    county = "Benton County, WA",
                    parcelData = "UNKNOWN",
                    terrasync = "UNAVAILABLE",
                    governedActions = "PILOT_ONLY",
                },
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }
}

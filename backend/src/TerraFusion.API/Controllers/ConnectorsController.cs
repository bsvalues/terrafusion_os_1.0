// TFT-027 — Connectors API Controller
// REST endpoints for connector status and operations.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Data.Connectors;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TFT-027: API controller for data connector status and operations.
/// Provides health checks, status queries, and test-connection triggers.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ConnectorsController : ControllerBase
{
    private readonly ILogger<ConnectorsController> _logger;
    private readonly IEnumerable<IDataConnector> _connectors;

    /// <summary>Initializes a new ConnectorsController.</summary>
    public ConnectorsController(
        ILogger<ConnectorsController> logger,
        IEnumerable<IDataConnector> connectors)
    {
        _logger = logger;
        _connectors = connectors;
    }

    /// <summary>
    /// GET /api/connectors — Returns status of all registered connectors.
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<ConnectorStatusDto>> GetAll()
    {
        _logger.LogInformation("Listing all connector statuses");

        var statuses = _connectors.Select(c => new ConnectorStatusDto
        {
            Name = c.Name,
            DisplayName = c.DisplayName,
            IsConnected = c.IsConnected,
            LastSyncAt = null,
            EntityCount = 0,
        });

        return Ok(statuses);
    }

    /// <summary>
    /// GET /api/connectors/{name}/health — Returns health info for a specific connector.
    /// </summary>
    /// <param name="name">Connector identifier.</param>
    [HttpGet("{name}/health")]
    public async Task<ActionResult<ConnectorHealthDto>> GetHealth(string name)
    {
        var connector = _connectors.FirstOrDefault(
            c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        if (connector is null)
        {
            _logger.LogWarning("Connector not found: {Name}", name);
            return NotFound(new { error = $"Connector '{name}' not found." });
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        bool healthy;
        string? errorDetail = null;

        try
        {
            healthy = await connector.TestConnectionAsync();
        }
        catch (Exception ex)
        {
            healthy = false;
            errorDetail = ex.Message;
            _logger.LogError(ex, "Health check failed for connector {Name}", name);
        }

        sw.Stop();

        var dto = new ConnectorHealthDto
        {
            Name = connector.Name,
            IsHealthy = healthy,
            Latency = sw.Elapsed,
            UptimePercent = healthy ? 100.0 : 0.0,
            CheckedAt = DateTime.UtcNow,
            ErrorDetail = errorDetail,
        };

        return Ok(dto);
    }

    /// <summary>
    /// POST /api/connectors/{name}/test-connection — Triggers a connectivity test.
    /// </summary>
    /// <param name="name">Connector identifier.</param>
    [HttpPost("{name}/test-connection")]
    public async Task<ActionResult<object>> TestConnection(string name)
    {
        var connector = _connectors.FirstOrDefault(
            c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        if (connector is null)
        {
            return NotFound(new { error = $"Connector '{name}' not found." });
        }

        _logger.LogInformation("Testing connection for connector {Name}", name);

        try
        {
            var result = await connector.TestConnectionAsync();
            return Ok(new { connector = name, success = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Connection test failed for {Name}", name);
            return StatusCode(500, new { connector = name, success = false, error = ex.Message });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Contracts.Agents;
using TerraFusion.API.Services.Telemetry;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/agents/telemetry")]
public sealed class AgentTelemetryController : ControllerBase
{
    private readonly IAgentTelemetryService _telemetry;

    public AgentTelemetryController(IAgentTelemetryService telemetry)
    {
        _telemetry = telemetry;
    }

    [HttpGet("status")]
    public ActionResult<AgentSystemStatusResponse> GetStatus()
    {
        return Ok(_telemetry.GetStatus());
    }

    [HttpGet("events")]
    public ActionResult<AgentEventsResponse> GetEvents([FromQuery] int limit = 100, [FromQuery] string? after = null)
    {
        return Ok(_telemetry.GetEvents(limit, after));
    }
}

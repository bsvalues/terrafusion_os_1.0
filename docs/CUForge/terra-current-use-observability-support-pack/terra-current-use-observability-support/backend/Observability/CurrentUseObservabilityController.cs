using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Health;

namespace TerraFusion.Modules.CurrentUse.Observability;

[ApiController]
[Route("api/forge/current-use/observability")]
public sealed class CurrentUseObservabilityController : ControllerBase
{
    private readonly ICurrentUseTelemetryService _telemetry;
    private readonly ICurrentUseHealthService _health;

    public CurrentUseObservabilityController(
        ICurrentUseTelemetryService telemetry,
        ICurrentUseHealthService health)
    {
        _telemetry = telemetry;
        _health = health;
    }

    [HttpGet("health")]
    public async Task<ActionResult<CurrentUseModuleHealthDto>> Health(
        CancellationToken cancellationToken)
    {
        return Ok(await _health.CheckAsync(cancellationToken));
    }

    [HttpGet("metrics/recent")]
    public ActionResult<IReadOnlyList<CurrentUseMetricDto>> Metrics()
    {
        return Ok(_telemetry.GetRecentMetrics());
    }

    [HttpGet("errors/recent")]
    public ActionResult<IReadOnlyList<CurrentUseErrorDto>> Errors()
    {
        return Ok(_telemetry.GetRecentErrors());
    }
}


using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Analytics;

[ApiController]
[Route("api/forge/current-use/analytics")]
public sealed class CurrentUseAnalyticsController : ControllerBase
{
    private readonly ICurrentUseAnalyticsService _service;

    public CurrentUseAnalyticsController(ICurrentUseAnalyticsService service)
    {
        _service = service;
    }

    [HttpGet("{countyId:guid}/summary")]
    public async Task<ActionResult<CurrentUseOperationalSummaryDto>> GetSummary(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetOperationalSummaryAsync(countyId, cancellationToken));
    }
}

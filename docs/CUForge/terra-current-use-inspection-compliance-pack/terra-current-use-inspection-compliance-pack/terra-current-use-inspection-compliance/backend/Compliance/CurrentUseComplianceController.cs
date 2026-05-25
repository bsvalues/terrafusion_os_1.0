using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Compliance;

[ApiController]
[Route("api/forge/current-use/compliance")]
public sealed class CurrentUseComplianceController : ControllerBase
{
    private readonly ICurrentUseComplianceService _service;

    public CurrentUseComplianceController(ICurrentUseComplianceService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/summary")]
    public async Task<ActionResult<CurrentUseComplianceSummaryDto>> GetSummary(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetComplianceSummaryAsync(parcelId, cancellationToken));
    }

    [HttpPost("inspections")]
    public async Task<ActionResult<CurrentUseInspectionDto>> ScheduleInspection(
        [FromBody] ScheduleCurrentUseInspectionDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.ScheduleInspectionAsync(request, cancellationToken));
    }

    [HttpPost("inspections/{inspectionId:guid}/complete")]
    public async Task<ActionResult<CurrentUseInspectionDto>> CompleteInspection(
        Guid inspectionId,
        [FromBody] CompleteCurrentUseInspectionDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CompleteInspectionAsync(inspectionId, request, cancellationToken));
    }
}

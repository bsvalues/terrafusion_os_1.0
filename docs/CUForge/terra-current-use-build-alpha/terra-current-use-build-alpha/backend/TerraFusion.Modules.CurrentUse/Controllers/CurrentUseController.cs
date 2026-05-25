using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse.Controllers;

[ApiController]
[Route("api/forge/current-use")]
public sealed class CurrentUseController : ControllerBase
{
    private readonly ICurrentUseService _service;

    public CurrentUseController(ICurrentUseService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/overview")]
    public async Task<ActionResult<CurrentUseOverviewDto>> GetOverview(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetOverviewAsync(parcelId, cancellationToken));
    }

    [HttpPost("rollback/calculate")]
    public async Task<ActionResult<RollbackCalculationResultDto>> CalculateRollback(
        [FromBody] RollbackCalculationRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CalculateRollbackAsync(request, cancellationToken));
    }
}

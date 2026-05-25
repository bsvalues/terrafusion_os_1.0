using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse.Controllers;

[ApiController]
[Route("api/forge/current-use/alpha")]
public sealed class CurrentUseAlphaController : ControllerBase
{
    private readonly ICurrentUseAlphaService _service;

    public CurrentUseAlphaController(ICurrentUseAlphaService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/overview")]
    public async Task<ActionResult<CurrentUseAlphaOverviewDto>> Overview(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetOverviewAsync(parcelId, cancellationToken));
    }

    [HttpPost("rollback/calculate")]
    public async Task<ActionResult<CurrentUseAlphaRollbackResultDto>> Rollback(
        [FromBody] CurrentUseAlphaRollbackRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CalculateRollbackAsync(request, cancellationToken));
    }
}

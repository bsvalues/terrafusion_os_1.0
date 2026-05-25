using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.CurrentUse.Dto;
using TerraFusion.CurrentUse.Services;

namespace TerraFusion.CurrentUse.Controllers;

/// <summary>
/// Alpha API surface for TerraFusion Current Use (RCW 84.34).
/// Route base: api/forge/current-use/alpha
/// </summary>
[ApiController]
[Route("api/forge/current-use/alpha")]
public sealed class CurrentUseAlphaController : ControllerBase
{
    private readonly ICurrentUseAlphaService _service;

    public CurrentUseAlphaController(ICurrentUseAlphaService service)
        => _service = service;

    /// <summary>Get a parcel's current-use overview.</summary>
    [HttpGet("parcels/{parcelId:guid}/overview")]
    [ProducesResponseType(typeof(CurrentUseAlphaOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOverview(Guid parcelId, CancellationToken ct)
    {
        var result = await _service.GetOverviewAsync(parcelId, ct);
        return Ok(result);
    }

    /// <summary>Calculate rollback tax for a current-use removal event.</summary>
    [HttpPost("rollback/calculate")]
    [ProducesResponseType(typeof(CurrentUseAlphaRollbackResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CalculateRollback(
        [FromBody] CurrentUseAlphaRollbackRequestDto request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _service.CalculateRollbackAsync(request, ct);
        return Ok(result);
    }
}

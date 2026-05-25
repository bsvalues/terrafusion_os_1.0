using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Trace;

[ApiController]
[Route("api/trace/current-use")]
public sealed class CurrentUseTraceController : ControllerBase
{
    private readonly ICurrentUseTraceService _service;

    public CurrentUseTraceController(ICurrentUseTraceService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseTraceEventDto>>> GetParcelTrace(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetParcelTraceAsync(parcelId, cancellationToken));
    }

    [HttpPost("events")]
    public async Task<ActionResult<CurrentUseTraceEventDto>> Append(
        [FromBody] AppendCurrentUseTraceEventDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.AppendAsync(request, cancellationToken));
    }

    [HttpGet("parcels/{parcelId:guid}/verify")]
    public async Task<ActionResult<object>> Verify(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        var valid = await _service.VerifyChainAsync(parcelId, cancellationToken);
        return Ok(new { parcelId, valid });
    }
}

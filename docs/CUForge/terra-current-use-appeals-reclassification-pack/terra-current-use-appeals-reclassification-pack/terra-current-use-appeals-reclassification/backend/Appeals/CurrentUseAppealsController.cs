using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Appeals;

[ApiController]
[Route("api/forge/current-use/appeals")]
public sealed class CurrentUseAppealsController : ControllerBase
{
    private readonly ICurrentUseAppealsService _service;

    public CurrentUseAppealsController(ICurrentUseAppealsService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseAppealDto>>> GetAppeals(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetAppealsForParcelAsync(parcelId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<CurrentUseAppealDto>> CreateAppealWindow(
        [FromBody] CreateCurrentUseAppealDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreateAppealWindowAsync(request, cancellationToken));
    }

    [HttpPost("{appealId:guid}/filed")]
    public async Task<ActionResult<CurrentUseAppealDto>> MarkFiled(
        Guid appealId,
        [FromBody] FileCurrentUseAppealDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.MarkAppealFiledAsync(appealId, request, cancellationToken));
    }

    [HttpGet("parcels/{parcelId:guid}/reclassification-options")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseReclassificationOptionDto>>> GetReclassificationOptions(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetReclassificationOptionsForParcelAsync(parcelId, cancellationToken));
    }

    [HttpPost("reclassification-options")]
    public async Task<ActionResult<CurrentUseReclassificationOptionDto>> CreateReclassificationOption(
        [FromBody] CreateCurrentUseReclassificationOptionDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreateReclassificationOptionAsync(request, cancellationToken));
    }

    [HttpPost("reclassification-options/{reclassificationId:guid}/application-received")]
    public async Task<ActionResult<CurrentUseReclassificationOptionDto>> ReceiveApplication(
        Guid reclassificationId,
        [FromBody] ReceiveCurrentUseReclassificationApplicationDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.ReceiveReclassificationApplicationAsync(reclassificationId, request, cancellationToken));
    }
}

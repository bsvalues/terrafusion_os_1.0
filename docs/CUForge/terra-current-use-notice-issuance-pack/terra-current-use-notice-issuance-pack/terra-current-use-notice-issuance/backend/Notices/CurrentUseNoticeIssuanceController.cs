using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Notices;

[ApiController]
[Route("api/forge/current-use/notices/issuance")]
public sealed class CurrentUseNoticeIssuanceController : ControllerBase
{
    private readonly ICurrentUseNoticeIssuanceService _service;

    public CurrentUseNoticeIssuanceController(ICurrentUseNoticeIssuanceService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseIssuedNoticeDto>>> GetParcelNotices(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetParcelNoticesAsync(parcelId, cancellationToken));
    }

    [HttpPost("pending")]
    public async Task<ActionResult<CurrentUseIssuedNoticeDto>> CreatePending(
        [FromBody] CreatePendingCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreatePendingAsync(request, cancellationToken));
    }

    [HttpPost("{noticeId:guid}/approve")]
    public async Task<ActionResult<CurrentUseIssuedNoticeDto>> Approve(
        Guid noticeId,
        [FromBody] ApproveCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.ApproveAsync(noticeId, request, cancellationToken));
    }

    [HttpPost("{noticeId:guid}/issue")]
    public async Task<ActionResult<CurrentUseIssuedNoticeDto>> Issue(
        Guid noticeId,
        [FromBody] IssueCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.IssueAsync(noticeId, request, cancellationToken));
    }

    [HttpPost("{noticeId:guid}/void")]
    public async Task<ActionResult<CurrentUseIssuedNoticeDto>> Void(
        Guid noticeId,
        [FromBody] VoidCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.VoidAsync(noticeId, request, cancellationToken));
    }
}

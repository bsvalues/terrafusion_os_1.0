using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse.Controllers;

// Add this endpoint to CurrentUseController or keep as a separate partial/controller.
[ApiController]
[Route("api/forge/current-use/notices")]
public sealed class CurrentUseNoticeController : ControllerBase
{
    private readonly ICurrentUseNoticeService _noticeService;

    public CurrentUseNoticeController(ICurrentUseNoticeService noticeService)
    {
        _noticeService = noticeService;
    }

    [HttpPost("preview")]
    public async Task<ActionResult<NoticePreviewResultDto>> Preview(
        [FromBody] NoticePreviewRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _noticeService.PreviewAsync(request, cancellationToken));
    }
}

using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.AI;

[ApiController]
[Route("api/forge/current-use/ai")]
public sealed class CurrentUseAiController : ControllerBase
{
    private readonly ICurrentUseAiAssistService _service;

    public CurrentUseAiController(ICurrentUseAiAssistService service)
    {
        _service = service;
    }

    [HttpPost("assist")]
    public async Task<ActionResult<CurrentUseAiAssistResponseDto>> Assist(
        [FromBody] CurrentUseAiAssistRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.AssistAsync(request, cancellationToken));
    }
}

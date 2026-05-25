
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Communications;

[ApiController]
[Route("api/forge/current-use/communications")]
public sealed class CurrentUseOwnerCommunicationController : ControllerBase
{
    private readonly ICurrentUseOwnerCommunicationService _service;

    public CurrentUseOwnerCommunicationController(ICurrentUseOwnerCommunicationService service)
    {
        _service = service;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<CurrentUseOwnerCommunicationDto>> Generate(
        [FromBody] CreateCurrentUseOwnerCommunicationDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GenerateAsync(request, cancellationToken));
    }
}

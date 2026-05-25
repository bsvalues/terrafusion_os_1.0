
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Policy;

[ApiController]
[Route("api/forge/current-use/policy")]
public sealed class CurrentUsePolicyController : ControllerBase
{
    private readonly ICurrentUsePolicyService _service;

    public CurrentUsePolicyController(ICurrentUsePolicyService service)
    {
        _service = service;
    }

    [HttpGet("{countyId:guid}")]
    public async Task<ActionResult<IReadOnlyList<CurrentUsePolicyPackDto>>> Get(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetPolicyPacksAsync(countyId, cancellationToken));
    }

    [HttpPost("resolve")]
    public async Task<ActionResult<ResolvedCurrentUsePolicyDto>> Resolve(
        [FromBody] ResolveCurrentUsePolicyRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.ResolvePolicyAsync(request, cancellationToken));
    }
}

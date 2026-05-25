
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Statutes;

[ApiController]
[Route("api/forge/current-use/statutes")]
public sealed class CurrentUseStatuteController : ControllerBase
{
    private readonly ICurrentUseStatuteService _service;

    public CurrentUseStatuteController(ICurrentUseStatuteService service)
    {
        _service = service;
    }

    [HttpGet("{stateCode}")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseStatuteReferenceDto>>> Get(
        string stateCode,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetReferencesAsync(stateCode, cancellationToken));
    }

    [HttpGet("rule-provenance")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseRuleProvenanceDto>>> Provenance(
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetRuleProvenanceAsync(cancellationToken));
    }
}

using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Security;

[ApiController]
[Route("api/forge/current-use/security")]
public sealed class CurrentUseAuthorizationController : ControllerBase
{
    private readonly ICurrentUseAuthorizationService _service;

    public CurrentUseAuthorizationController(ICurrentUseAuthorizationService service)
    {
        _service = service;
    }

    [HttpGet("roles")]
    public ActionResult<IReadOnlyList<CurrentUseRoleDto>> GetRoles()
    {
        return Ok(CurrentUseRoleCatalog.GetRoles());
    }

    [HttpPost("authorize")]
    public ActionResult<CurrentUseAuthorizationResultDto> Authorize(
        [FromBody] CurrentUseAuthorizationRequestDto request)
    {
        return Ok(_service.Authorize(request));
    }
}

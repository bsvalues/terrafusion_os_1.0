using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Tenancy;

[ApiController]
[Route("api/forge/current-use/tenancy")]
public sealed class CurrentUseTenantController : ControllerBase
{
    private readonly ICurrentUseTenantService _service;

    public CurrentUseTenantController(ICurrentUseTenantService service)
    {
        _service = service;
    }

    [HttpGet("counties")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseCountyTenantDto>>> GetCounties(
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetTenantsAsync(cancellationToken));
    }

    [HttpGet("counties/{countyId:guid}")]
    public async Task<ActionResult<CurrentUseCountyTenantDto>> GetCounty(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        var tenant = await _service.GetTenantAsync(countyId, cancellationToken);

        return tenant is null ? NotFound() : Ok(tenant);
    }

    [HttpPost("counties")]
    public async Task<ActionResult<CurrentUseCountyTenantDto>> CreateCounty(
        [FromBody] CreateCurrentUseCountyTenantDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreateTenantAsync(request, cancellationToken));
    }
}

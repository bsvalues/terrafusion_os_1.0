
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Reporting;

[ApiController]
[Route("api/forge/current-use/reporting")]
public sealed class CurrentUseStateReportingController : ControllerBase
{
    private readonly ICurrentUseStateReportingService _service;

    public CurrentUseStateReportingController(ICurrentUseStateReportingService service)
    {
        _service = service;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<CurrentUseSubmissionBatchDto>> Generate(
        [FromQuery] Guid countyId,
        [FromQuery] string stateCode,
        [FromQuery] string reportingYear,
        [FromQuery] string generatedBy,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GenerateBatchAsync(
            countyId,
            stateCode,
            reportingYear,
            generatedBy,
            cancellationToken));
    }
}

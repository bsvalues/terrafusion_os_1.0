using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Import;

[ApiController]
[Route("api/forge/current-use/import")]
public sealed class CurrentUseImportController : ControllerBase
{
    private readonly ICurrentUseImportService _service;

    public CurrentUseImportController(ICurrentUseImportService service)
    {
        _service = service;
    }

    [HttpGet("{countyId:guid}/batches")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseImportBatchDto>>> GetBatches(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetBatchesAsync(countyId, cancellationToken));
    }

    [HttpPost("batches")]
    public async Task<ActionResult<CurrentUseImportBatchDto>> CreateBatch(
        [FromBody] CreateCurrentUseImportBatchDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreateBatchAsync(request, cancellationToken));
    }

    [HttpPost("batches/{importBatchId:guid}/validate")]
    public async Task<ActionResult<CurrentUseImportBatchDto>> Validate(
        Guid importBatchId,
        [FromBody] ValidateCurrentUseImportRowsDto request,
        CancellationToken cancellationToken)
    {
        var merged = request with { ImportBatchId = importBatchId };
        return Ok(await _service.ValidateRowsAsync(merged, cancellationToken));
    }

    [HttpPost("batches/{importBatchId:guid}/commit")]
    public async Task<ActionResult<CurrentUseImportBatchDto>> Commit(
        Guid importBatchId,
        [FromBody] CommitCurrentUseImportBatchDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CommitBatchAsync(importBatchId, request, cancellationToken));
    }
}

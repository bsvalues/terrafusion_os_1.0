using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class CalibrationMemoController : ControllerBase
{
    private readonly ICalibrationMemoService _memoService;
    private readonly TerraFusionDbContext _db;

    public CalibrationMemoController(ICalibrationMemoService memoService, TerraFusionDbContext db)
    {
        _memoService = memoService;
        _db = db;
    }

    [HttpPost("auto-draft")]
    public async System.Threading.Tasks.Task<IActionResult> AutoDraft(
        [FromQuery] int matrixVersionId, [FromQuery] Guid countyId)
    {
        var memo = await _memoService.AutoDraftAsync(matrixVersionId, countyId);

        var version = await _db.MatrixVersions.FindAsync(matrixVersionId);
        if (version is not null)
        {
            version.CalibrationMemoId = memo.Id;
            version.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(memo);
    }

    [HttpGet("{id:int}")]
    public async System.Threading.Tasks.Task<IActionResult> Get(int id)
    {
        var memo = await _db.CalibrationMemos.FindAsync(id);
        return memo is null ? NotFound() : Ok(memo);
    }

    [HttpPatch("{id:int}/section")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateSection(
        int id, [FromBody] UpdateSectionRequest req)
    {
        var memo = await _memoService.UpdateSectionAsync(id, req.SectionKey, req.Content);
        return Ok(memo);
    }

    [HttpGet("{id:int}/completeness")]
    public async System.Threading.Tasks.Task<IActionResult> GetCompleteness(int id)
    {
        var score = await _memoService.ComputeCompletenessAsync(id);
        var ready = await _memoService.IsReadyForReviewAsync(id);
        return Ok(new { score, readyForReview = ready });
    }
}

public record UpdateSectionRequest(string SectionKey, string Content);

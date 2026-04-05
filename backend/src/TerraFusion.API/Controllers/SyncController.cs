using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly ISaleQualificationService _qualification;
    private readonly TerraFusion.Data.TerraFusionDbContext _db;

    public SyncController(ISaleQualificationService qualification, TerraFusion.Data.TerraFusionDbContext db)
    {
        _qualification = qualification;
        _db = db;
    }

    /// <summary>
    /// Recompute QualificationRecommendation for all ComparableSales in a county.
    /// Run this after PacsDataSeeder completes. Layer 2 (county_ratio_code) drives results.
    /// </summary>
    [HttpPost("requalify/{countyId:guid}")]
    public async Task<IActionResult> Requalify(Guid countyId, CancellationToken ct)
    {
        var count = await _qualification.ComputeRecommendationsAsync(countyId, ct);
        return Ok(new { requalified = count });
    }
}

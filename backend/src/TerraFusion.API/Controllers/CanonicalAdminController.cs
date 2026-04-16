/*
 * CanonicalAdminController
 *
 * Admin endpoints for running canonicalization jobs that translate Pacs*
 * staging entities to canonical TerraFusion entities.
 *
 * Used by Track 0 of CostForge Benton Method v2 to populate
 * CamaCharacteristic.City and CamaCharacteristic.PropertyUseStratum.
 *
 * @version 1.0.0 - Track 0 (CostForge Benton Method v2)
 */

using Microsoft.AspNetCore.Mvc;
using TerraFusion.Data.Canonicalizers;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/admin/canonical")]
public class CanonicalAdminController : ControllerBase
{
    private readonly IPacsCanonicalizer _canonicalizer;
    private readonly ILogger<CanonicalAdminController> _logger;

    public CanonicalAdminController(
        IPacsCanonicalizer canonicalizer,
        ILogger<CanonicalAdminController> logger)
    {
        _canonicalizer = canonicalizer;
        _logger = logger;
    }

    /// <summary>
    /// Populate CamaCharacteristic.City and PropertyUseStratum for all parcels
    /// in the given county and tax year by running PacsCanonicalizer.
    /// </summary>
    [HttpPost("populate")]
    public async Task<IActionResult> Populate(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        CancellationToken ct)
    {
        if (countyId == Guid.Empty)
            return BadRequest(new { error = "countyId is required" });
        if (taxYear < 2000 || taxYear > 2100)
            return BadRequest(new { error = "taxYear must be between 2000 and 2100" });

        _logger.LogInformation(
            "Canonical populate requested: countyId={CountyId} taxYear={TaxYear}",
            countyId, taxYear);

        var result = await _canonicalizer.PopulateCityAndStratumAsync(countyId, taxYear, ct);

        return Ok(new
        {
            countyId,
            taxYear,
            rowsTouched = result.RowsTouched,
            rowsUpdatedCity = result.RowsUpdatedCity,
            rowsUpdatedStratum = result.RowsUpdatedStratum,
        });
    }
}

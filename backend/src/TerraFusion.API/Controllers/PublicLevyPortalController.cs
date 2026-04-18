using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Public-facing (anonymous) levy information portal for citizens.
/// Exposes non-PII property, district, and tax-estimate endpoints.
///
/// Honesty notes:
/// - No PII is returned. Owner name / mailing / situs are omitted per RCW 42.56.230.
/// - Spanish translation is scaffolded via Accept-Language but the current
///   payload is English-only; see docs/levy/reference/open-tickets/LEV-143.
/// - tax-estimate is single-district. TCA-composite estimates require the
///   tax_area_fund_assoc join; deferred to LEV-144.
/// </summary>
[ApiController]
[Route("api/levy/public")]
[AllowAnonymous]
public class PublicLevyPortalController : ControllerBase
{
    private readonly ILogger<PublicLevyPortalController> _logger;
    private readonly TerraFusionDbContext _db;

    public PublicLevyPortalController(
        ILogger<PublicLevyPortalController> logger,
        TerraFusionDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    public sealed record PublicPropertyDto(
        string ParcelId,
        string? TaxAreaNumber,
        string? TaxAreaDescription,
        decimal? AssessedValue,
        int? TaxYear,
        string PiiSafetyNote);

    [HttpGet("property/{parcelId}")]
    [ProducesResponseType(typeof(PublicPropertyDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetProperty(string parcelId)
    {
        if (string.IsNullOrWhiteSpace(parcelId))
        {
            return BadRequest(new { error = "parcelId is required" });
        }

        var match = await _db.PacsTaxAreas
            .AsNoTracking()
            .Where(t => t.ParcelId.ToString() == parcelId
                || t.PacsPropId.ToString() == parcelId
                || t.TaxAreaNumber == parcelId)
            .OrderByDescending(t => t.TaxYear)
            .Select(t => new
            {
                t.PacsPropId,
                t.TaxAreaNumber,
                t.TaxAreaDescription,
                t.TaxYear,
            })
            .FirstOrDefaultAsync();

        if (match is null)
        {
            return NotFound(new { error = "Parcel not found in public levy index.", parcelId });
        }

        var dto = new PublicPropertyDto(
            ParcelId: match.PacsPropId.ToString(),
            TaxAreaNumber: match.TaxAreaNumber,
            TaxAreaDescription: match.TaxAreaDescription,
            AssessedValue: null, // AV disclosure deferred pending LEV-143 review.
            TaxYear: (int)match.TaxYear,
            PiiSafetyNote: "Owner name, mailing address, and situs are omitted per RCW 42.56.230.");
        return Ok(dto);
    }

    public sealed record PublicDistrictInfoDto(
        string Code,
        string Name,
        string Type,
        decimal StatutoryLimitPerThousandAV,
        string RcwReference,
        bool IsVoted);

    public sealed record PublicDistrictEnvelope(
        string Source,
        int FiscalYear,
        IReadOnlyList<PublicDistrictInfoDto> Districts,
        int Count);

    [HttpGet("district-info")]
    [ProducesResponseType(typeof(PublicDistrictEnvelope), 200)]
    public IActionResult GetDistrictInfo([FromQuery] string? districtId = null)
    {
        var districts = BentonReferenceDistricts();
        if (!string.IsNullOrWhiteSpace(districtId))
        {
            districts = districts
                .Where(d => string.Equals(d.Code, districtId, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(d.Name, districtId, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return Ok(new PublicDistrictEnvelope(
            Source: "Benton County — filed statutory rates",
            FiscalYear: DateTime.UtcNow.Year,
            Districts: districts,
            Count: districts.Count));
    }

    public sealed record PublicTaxEstimateDto(
        decimal AssessedValue,
        string DistrictCode,
        string DistrictName,
        decimal RatePerThousandAV,
        decimal EstimatedAnnualTax,
        string EstimateMethod,
        string Disclaimer);

    [HttpGet("tax-estimate")]
    [ProducesResponseType(typeof(PublicTaxEstimateDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public IActionResult GetTaxEstimate(
        [FromQuery] decimal? assessedValue,
        [FromQuery] string? districtId)
    {
        if (assessedValue is null || assessedValue <= 0)
        {
            return BadRequest(new { error = "assessedValue must be > 0" });
        }

        if (string.IsNullOrWhiteSpace(districtId))
        {
            return BadRequest(new { error = "districtId is required" });
        }

        var district = BentonReferenceDistricts()
            .FirstOrDefault(d =>
                string.Equals(d.Code, districtId, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(d.Name, districtId, StringComparison.OrdinalIgnoreCase));

        if (district is null)
        {
            return NotFound(new { error = "District not found", districtId });
        }

        var rate = district.StatutoryLimitPerThousandAV;
        var annualTax = Math.Round((assessedValue.Value / 1000m) * rate, 2);

        return Ok(new PublicTaxEstimateDto(
            AssessedValue: assessedValue.Value,
            DistrictCode: district.Code,
            DistrictName: district.Name,
            RatePerThousandAV: rate,
            EstimatedAnnualTax: annualTax,
            EstimateMethod: "(assessedValue / 1000) × statutory filed rate. Single-district estimate; not TCA-composite.",
            Disclaimer: "This is a public-estimate tool. Actual taxes depend on all levies applicable to the parcel's Tax Code Area, exemptions, and state school levy parts. Contact the County Assessor for an official figure."));
    }

    private static List<PublicDistrictInfoDto> BentonReferenceDistricts() => new()
    {
        new("BC-REG",  "Benton County Regular",             "County",       1.8000m, "RCW 84.52.043(1)",   false),
        new("BC-ROAD", "Benton County Road",                "County Road",  2.2500m, "RCW 36.82.040",      false),
        new("BC-VET",  "Benton County Veterans Relief",     "County",       0.0112m, "RCW 73.08.080",      false),
        new("KENN",    "City of Kennewick",                 "City",         3.3750m, "RCW 84.52.043(2)",   false),
        new("RICH",    "City of Richland",                  "City",         3.3750m, "RCW 84.52.043(2)",   false),
        new("PROS",    "City of Prosser",                   "City",         3.3750m, "RCW 84.52.043(2)",   false),
        new("WWAL",    "City of West Richland",             "City",         3.3750m, "RCW 84.52.043(2)",   false),
        new("BENT",    "City of Benton City",               "City",         3.3750m, "RCW 84.52.043(2)",   false),
        new("KSD-17",  "Kennewick School District 17",      "School",       5.9000m, "RCW 84.52.0531",     true),
        new("RSD-400", "Richland School District 400",      "School",       5.9000m, "RCW 84.52.0531",     true),
        new("PSD-116", "Prosser School District 116",       "School",       5.9000m, "RCW 84.52.0531",     true),
        new("FSD-53",  "Finley School District 53",         "School",       5.9000m, "RCW 84.52.0531",     true),
        new("KBSD-52", "Kiona-Benton School District 52",   "School",       5.9000m, "RCW 84.52.0531",     true),
        new("FD-1",    "Benton County Fire District 1",     "Fire",         1.5000m, "RCW 52.16.130",      false),
        new("FD-2",    "Benton County Fire District 2",     "Fire",         1.5000m, "RCW 52.16.130",      false),
        new("FD-4",    "Benton County Fire District 4",     "Fire",         1.5000m, "RCW 52.16.130",      false),
        new("FD-5",    "Benton County Fire District 5",     "Fire",         1.5000m, "RCW 52.16.130",      false),
        new("FD-6",    "Benton County Fire District 6",     "Fire",         1.5000m, "RCW 52.16.130",      false),
        new("PORT",    "Port of Benton",                    "Port",         0.4500m, "RCW 53.36.020",      false),
        new("CEMET",   "Benton County Cemetery District",   "Cemetery",     0.1125m, "RCW 68.52.310",      false),
        new("LIBR",    "Mid-Columbia Library District",     "Library",      0.5000m, "RCW 27.12.150",      false),
        new("HOSP",    "Kennewick Hospital District",       "Hospital",     0.7500m, "RCW 70.44.060",      false),
    };
}

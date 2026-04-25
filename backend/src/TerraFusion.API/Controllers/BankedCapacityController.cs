// TerraFusion OS — Banked Capacity Controller (LEV-137)
// Exposes the per-district banked levy capacity ledger under RCW 84.55.092.
//
// Honesty note: In SQLite dev mode, BankedCapacities is always empty unless
// manually seeded. The endpoint returns the correct schema and a disclosed
// empty result rather than fabricated data.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Banked levy capacity ledger.
/// Route: GET /api/levy/v1/banked-capacity
/// </summary>
[ApiController]
[Route("api/levy/v1")]
public class BankedCapacityController : ControllerBase
{
    private readonly ILogger<BankedCapacityController> _logger;
    private readonly LevyDbContext _db;

    public BankedCapacityController(
        ILogger<BankedCapacityController> logger,
        LevyDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────────────────────────────────────

    public sealed record BankedCapacityDto(
        Guid Id,
        string DistrictCode,
        int TaxYear,
        decimal OpeningBalance,
        decimal AccruedThisYear,
        decimal UsedThisYear,
        decimal ClosingBalance,
        bool IsActive,
        Guid? CertificationId,
        string Source,
        string RcwReference);

    public sealed record BankedCapacityResponse(
        string DistrictCode,
        int TaxYear,
        decimal AvailableCapacity,
        BankedCapacityDto? LedgerEntry,
        bool SpecialistGated,
        string? SpecialistGateNote,
        string Source,
        string RcwReference);

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/levy/v1/banked-capacity
    // Returns the current-year ledger entry for the given district.
    // If no entry exists, returns available=0 with specialistGated=true.
    // ─────────────────────────────────────────────────────────────────────────

    [HttpGet("banked-capacity")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BankedCapacityResponse), 200)]
    public async Task<IActionResult> GetBankedCapacity(
        [FromQuery] string? districtCode,
        [FromQuery] int? year)
    {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        if (string.IsNullOrWhiteSpace(districtCode))
        {
            return BadRequest(new { error = "districtCode_required", message = "districtCode query parameter is required." });
        }

        var entry = await _db.BankedCapacities
            .Where(b => b.DistrictCode == districtCode
                     && b.TaxYear == effectiveYear
                     && b.IsActive)
            .OrderByDescending(b => b.ClosingBalance)
            .FirstOrDefaultAsync();

        if (entry is null)
        {
            return Ok(new BankedCapacityResponse(
                DistrictCode: districtCode,
                TaxYear: effectiveYear,
                AvailableCapacity: 0,
                LedgerEntry: null,
                SpecialistGated: true,
                SpecialistGateNote: "No banked capacity ledger entry found for this district/year. " +
                    "A district may bank capacity only after adopting the RCW 84.55.0101 resolution. " +
                    "Ingest via the BankedCapacity import workflow (LEV-137).",
                Source: "TerraFusionDbContext.BankedCapacities",
                RcwReference: "RCW 84.55.092 — banked capacity authorization"));
        }

        var available = entry.ClosingBalance - entry.UsedThisYear;
        if (available < 0) available = 0;

        return Ok(new BankedCapacityResponse(
            DistrictCode: districtCode,
            TaxYear: effectiveYear,
            AvailableCapacity: available,
            LedgerEntry: new BankedCapacityDto(
                Id: entry.Id,
                DistrictCode: entry.DistrictCode,
                TaxYear: entry.TaxYear,
                OpeningBalance: entry.OpeningBalance,
                AccruedThisYear: entry.AccruedThisYear,
                UsedThisYear: entry.UsedThisYear,
                ClosingBalance: entry.ClosingBalance,
                IsActive: entry.IsActive,
                CertificationId: entry.CertificationId,
                Source: "BankedCapacities table",
                RcwReference: "RCW 84.55.092"),
            SpecialistGated: false,
            SpecialistGateNote: null,
            Source: "TerraFusionDbContext.BankedCapacities",
            RcwReference: "RCW 84.55.092 — banked capacity"));
    }
}

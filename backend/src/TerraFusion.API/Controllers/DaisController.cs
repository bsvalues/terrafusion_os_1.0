using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;
using System.Text.RegularExpressions;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraDais — Permit classification and workflow endpoints.
/// Write-lane: dais. County isolation enforced on parcel-specific queries.
/// Real Benton County permit logic extracted from quarantined terra-permit application.
/// </summary>
[ApiController]
[Route("api/dais")]
[Authorize]
public class DaisController : ControllerBase
{
  private readonly TerraFusionDbContext _db;
  private readonly ILogger<DaisController> _logger;

  public DaisController(TerraFusionDbContext db, ILogger<DaisController> logger)
  {
    _db = db;
    _logger = logger;
  }

  // ── County Isolation Helper ──────────────────────────────────────

  private async Task<Guid?> ResolveCountyIdAsync()
  {
    var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
    if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
      return directCountyId;

    var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
    var nameCandidates = BuildCountyNameCandidates(countyIdClaim, countyCodeClaim);
    var fipsCandidates = BuildFipsCandidates(countyIdClaim, countyCodeClaim);

    IQueryable<County> countyQuery = _db.Counties.AsNoTracking();

    if (nameCandidates.Length > 0 && fipsCandidates.Length > 0)
    {
      countyQuery = countyQuery.Where(c =>
          nameCandidates.Contains(c.Name) ||
          (c.FipsCode != null && fipsCandidates.Contains(c.FipsCode)));
    }
    else if (nameCandidates.Length > 0)
    {
      countyQuery = countyQuery.Where(c => nameCandidates.Contains(c.Name));
    }
    else if (fipsCandidates.Length > 0)
    {
      countyQuery = countyQuery.Where(c => c.FipsCode != null && fipsCandidates.Contains(c.FipsCode));
    }
    else
    {
      return null;
    }

    var county = await countyQuery.Select(c => c.Id).FirstOrDefaultAsync();
    return county == Guid.Empty ? null : county;
  }

  private static string[] BuildCountyNameCandidates(params string?[] claims)
  {
    var candidates = new HashSet<string>(StringComparer.Ordinal);
    foreach (var claim in claims)
    {
      if (string.IsNullOrWhiteSpace(claim)) continue;
      var trimmed = claim.Trim();
      candidates.Add(trimmed);
      candidates.Add(trimmed.ToUpperInvariant());
      candidates.Add(trimmed.ToLowerInvariant());
      if (trimmed.Length > 0)
        candidates.Add(char.ToUpperInvariant(trimmed[0]) + trimmed[1..].ToLowerInvariant());
    }
    return candidates.ToArray();
  }

  private static string[] BuildFipsCandidates(params string?[] claims)
  {
    var candidates = new HashSet<string>(StringComparer.Ordinal);
    foreach (var claim in claims)
    {
      if (string.IsNullOrWhiteSpace(claim)) continue;
      var trimmed = claim.Trim();
      if (trimmed.All(char.IsDigit) && trimmed.Length is >= 1 and <= 5)
      {
        candidates.Add(trimmed);
        candidates.Add(trimmed.PadLeft(3, '0'));
      }
    }
    return candidates.ToArray();
  }

  // ── Static Endpoints (catalog data — no county isolation) ────────

  /// <summary>
  /// GET api/dais/permit-types — Real Benton County permit type catalog.
  /// </summary>
  [HttpGet("permit-types")]
  [AllowAnonymous]
  public IActionResult GetPermitTypes()
  {
    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(new
    {
      source = "benton-county-building-department",
      fiscalYear = "2025",
      permitTypes = BentonPermitData.PermitTypes,
      count = BentonPermitData.PermitTypes.Length,
    });
  }

  /// <summary>
  /// GET api/dais/workflow-stages — Assessor permit tracking workflow stages.
  /// </summary>
  [HttpGet("workflow-stages")]
  [AllowAnonymous]
  public IActionResult GetWorkflowStages()
  {
    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(new
    {
      source = "benton-county-assessor",
      stages = BentonPermitData.WorkflowStages,
      count = BentonPermitData.WorkflowStages.Length,
    });
  }

  /// <summary>
  /// GET api/dais/benton/fee-schedule — Real Benton County building permit fee schedule.
  /// </summary>
  [HttpGet("benton/fee-schedule")]
  [AllowAnonymous]
  public IActionResult GetFeeSchedule()
  {
    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(new
    {
      source = "benton-county-building-department",
      fiscalYear = "2025",
      effectiveDate = "2025-01-01",
      fees = BentonPermitData.FeeSchedule,
      count = BentonPermitData.FeeSchedule.Length,
    });
  }

  /// <summary>
  /// GET api/dais/classification-rules — Permit classification rules for assessor intake.
  /// </summary>
  [HttpGet("classification-rules")]
  [AllowAnonymous]
  public IActionResult GetClassificationRules()
  {
    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(new
    {
      source = "benton-county-assessor-permit-classifier",
      description = "Rules to determine whether a building permit affects property value and should be entered in the assessor's system.",
      rules = new object[]
        {
                new { priority = 1, rule = "COMMERCIAL", condition = "Neighborhood code starts with '6'", decision = "ENTER", reason = "Commercial permits always affect value" },
                new { priority = 2, rule = "MAINTENANCE_SKIP", condition = "Description matches maintenance keywords", decision = "SKIP", reason = "Maintenance/like-for-like replacements do not affect value" },
                new { priority = 3, rule = "VALUE_ADD", condition = "Description matches value-adding keywords", decision = "ENTER", reason = "Additions, new construction, and improvements affect value" },
                new { priority = 4, rule = "DEFAULT", condition = "No other rule matched", decision = "ENTER", reason = "Default to enter for assessor review" },
        },
      maintenanceKeywords = BentonPermitData.MaintenanceKeywords,
      valueAddKeywords = BentonPermitData.ValueAddKeywords,
    });
  }

  // ── Permit Classification (logic from quarantined terra-permit) ──

  /// <summary>
  /// POST api/dais/classify — Classify a permit description as ENTER or SKIP.
  /// Uses the real Benton County assessor classification rules.
  /// </summary>
  [HttpPost("classify")]
  [AllowAnonymous]
  public IActionResult ClassifyPermit([FromBody] PermitClassifyRequest request)
  {
    if (request is null || string.IsNullOrWhiteSpace(request.Description))
      return BadRequest(new { error = "Permit description is required." });

    var result = ClassifyPermitDescription(request.Description, request.NeighborhoodCode);

    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(result);
  }

  /// <summary>
  /// GET api/dais/permits/{parcelId}/assessment-impact — Check permit impact for a parcel.
  /// County-isolated: requires countyId/countyCode claim.
  /// </summary>
  [HttpGet("permits/{parcelId}/assessment-impact")]
  public async Task<IActionResult> GetPermitAssessmentImpact(string parcelId)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .Select(p => new
        {
          p.ParcelId,
          p.ParcelNumber,
          p.Address,
          p.PropertyType,
          p.AssessedValue,
          p.ImprovementValue,
          p.LandValue,
          p.MarketValue,
          p.AssessmentDate,
        })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    // Classify the property type as if it were a permit context
    var isCommercial = property.PropertyType?.StartsWith("C", StringComparison.OrdinalIgnoreCase) == true;

    Response.Headers["X-Dais-Source"] = "benton-real-permits-fy2025";
    return Ok(new
    {
      parcel = property,
      assessmentContext = new
      {
        isCommercial,
        permitsAlwaysEnterForCommercial = isCommercial,
        currentAssessedValue = property.AssessedValue,
        currentImprovementValue = property.ImprovementValue,
        lastAssessmentDate = property.AssessmentDate,
      },
      applicableWorkflow = BentonPermitData.WorkflowStages,
    });
  }

  // ── Internal Classification Engine ────────────────────────────────

  internal static PermitClassification ClassifyPermitDescription(
      string description, string? neighborhoodCode)
  {
    // Rule 1: Commercial neighborhood code starts with '6'
    if (!string.IsNullOrWhiteSpace(neighborhoodCode) &&
        neighborhoodCode.TrimStart().StartsWith('6'))
    {
      return new PermitClassification(
          "ENTER", "COMMERCIAL",
          "Commercial permits always affect property value.",
          1);
    }

    var descLower = description.Trim().ToLowerInvariant();

    // Rule 2: Maintenance/like-for-like → SKIP
    foreach (var keyword in BentonPermitData.MaintenanceKeywords)
    {
      if (descLower.Contains(keyword, StringComparison.OrdinalIgnoreCase))
      {
        return new PermitClassification(
            "SKIP", "MAINTENANCE_SKIP",
            $"Matched maintenance keyword: '{keyword}'. Like-for-like replacements do not affect value.",
            2);
      }
    }

    // Rule 3: Value-adding work → ENTER
    foreach (var keyword in BentonPermitData.ValueAddKeywords)
    {
      if (descLower.Contains(keyword, StringComparison.OrdinalIgnoreCase))
      {
        return new PermitClassification(
            "ENTER", "VALUE_ADD",
            $"Matched value-adding keyword: '{keyword}'. This work affects property value.",
            3);
      }
    }

    // Rule 4: Default → ENTER for assessor review
    return new PermitClassification(
        "ENTER", "DEFAULT",
        "No specific rule matched. Default to enter for assessor review.",
        4);
  }

  // ── Records ──────────────────────────────────────────────────────

  public sealed record PermitClassifyRequest(string Description, string? NeighborhoodCode);

  internal sealed record PermitClassification(
      string Decision, string Rule, string Reason, int Priority);

  internal sealed record PermitTypeEntry(
      string Code, string Name, string Category,
      bool AlwaysAffectsValue, string AssessorAction);

  internal sealed record WorkflowStageEntry(
      int Order, string Stage, string Description, string ResponsibleParty);

  internal sealed record FeeEntry(
      string PermitType, decimal BaseFee, string Unit,
      decimal? PerUnitFee, string Notes);

  // ── Static Data: Real Benton County Permit Data ──────────────────

  internal static class BentonPermitData
  {
    /// <summary>
    /// Maintenance keywords — permits matching these are SKIP (no value impact).
    /// Extracted from quarantined terra-permit PermitClassifier.
    /// </summary>
    internal static readonly string[] MaintenanceKeywords =
    [
        "hvac",
        "re-roof",
        "reroof",
        "heat pump",
        "fence",
        "water heater",
        "mini split",
        "like-for-like",
        "maintenance",
        "repair",
        "replacement",
    ];

    /// <summary>
    /// Value-adding keywords — permits matching these are ENTER (affects value).
    /// Extracted from quarantined terra-permit PermitClassifier.
    /// </summary>
    internal static readonly string[] ValueAddKeywords =
    [
        "in-ground pool",
        "swimming pool",
        "addition",
        "new construction",
        "new dwelling",
        "new commercial",
        "garage conversion",
        "adu",
        "accessory dwelling",
        "finished basement",
        "second story",
    ];

    /// <summary>
    /// Real Benton County permit types from the building department.
    /// </summary>
    internal static readonly PermitTypeEntry[] PermitTypes =
    [
        new("RES-NEW", "Residential New Construction", "Residential", true, "ENTER"),
        new("RES-ADD", "Residential Addition/Alteration", "Residential", true, "ENTER"),
        new("RES-ROOF", "Residential Re-Roof", "Residential", false, "SKIP"),
        new("RES-HVAC", "Residential HVAC Replacement", "Residential", false, "SKIP"),
        new("RES-FENCE", "Residential Fence", "Residential", false, "SKIP"),
        new("RES-WH", "Residential Water Heater", "Residential", false, "SKIP"),
        new("RES-POOL", "Residential Swimming Pool (In-Ground)", "Residential", true, "ENTER"),
        new("RES-GAR", "Residential Garage/Carport", "Residential", true, "ENTER"),
        new("RES-SOLAR", "Residential Solar Panel Installation", "Residential", true, "ENTER"),
        new("RES-ADU", "Accessory Dwelling Unit (ADU)", "Residential", true, "ENTER"),
        new("RES-DECK", "Residential Deck/Patio Cover", "Residential", true, "ENTER"),
        new("RES-MH", "Manufactured Home Installation", "Residential", true, "ENTER"),
        new("COM-NEW", "Commercial New Construction", "Commercial", true, "ENTER"),
        new("COM-TI", "Commercial Tenant Improvement", "Commercial", true, "ENTER"),
        new("COM-ADD", "Commercial Addition/Alteration", "Commercial", true, "ENTER"),
        new("COM-ROOF", "Commercial Re-Roof", "Commercial", false, "SKIP"),
        new("COM-SIGN", "Commercial Sign Permit", "Commercial", false, "REVIEW"),
        new("DEMO", "Demolition", "General", true, "ENTER"),
        new("MECH", "Mechanical Permit", "General", false, "SKIP"),
        new("PLMB", "Plumbing Permit", "General", false, "SKIP"),
        new("ELEC", "Electrical Permit", "General", false, "SKIP"),
    ];

    /// <summary>
    /// Assessor permit tracking workflow stages used in Benton County.
    /// </summary>
    internal static readonly WorkflowStageEntry[] WorkflowStages =
    [
        new(1, "INTAKE", "Permit received from building department", "Building Department"),
        new(2, "CLASSIFICATION", "Assessor classifies ENTER/SKIP for value impact", "Assessor Appraiser"),
        new(3, "INSPECTION_REVIEW", "Field inspection if ENTER — review for valuation changes", "Field Appraiser"),
        new(4, "VALUATION_UPDATE", "Update property records with new value if applicable", "Senior Appraiser"),
        new(5, "QA_REVIEW", "Quality assurance review of valuation change", "QA Supervisor"),
        new(6, "COMPLETED", "Record closed, assessment updated", "System"),
    ];

    /// <summary>
    /// Real Benton County building permit fee schedule (FY2025).
    /// </summary>
    internal static readonly FeeEntry[] FeeSchedule =
    [
        new("Residential New Construction", 500.00m, "base + per sqft", 0.25m, "Plus plan review 65% of permit fee"),
        new("Commercial New Construction", 1000.00m, "base + per sqft", 0.50m, "Plus plan review 65% of permit fee"),
        new("Residential Addition/Alteration", 250.00m, "flat", null, "Up to 500 sqft; larger additions use new construction rate"),
        new("Commercial Tenant Improvement", 400.00m, "base + per sqft", 0.30m, "Interior modifications only"),
        new("Residential Re-Roof", 150.00m, "flat", null, "No plan review required"),
        new("HVAC Replacement", 125.00m, "flat", null, "Like-for-like replacement"),
        new("Residential Fence", 75.00m, "flat", null, "Height restrictions apply per municipal code"),
        new("Swimming Pool (In-Ground)", 350.00m, "flat", null, "Requires separate electrical and plumbing permits"),
        new("Demolition", 200.00m, "flat", null, "Requires asbestos survey for pre-1985 structures"),
        new("Manufactured Home", 300.00m, "flat", null, "Setup permit for placement on permanent foundation"),
        new("Solar Panel Installation", 175.00m, "flat", null, "Includes structural and electrical review"),
        new("Accessory Dwelling Unit", 450.00m, "base + per sqft", 0.25m, "Subject to ADU ordinance requirements"),
        new("Mechanical Permit", 100.00m, "flat", null, "New installations; replacements at lower rate"),
        new("Plumbing Permit", 100.00m, "flat", null, "Per fixture rates may apply for large projects"),
        new("Electrical Permit", 100.00m, "flat", null, "Service upgrades may require additional fees"),
    ];
  }
}

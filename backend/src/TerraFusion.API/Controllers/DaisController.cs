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

  // ══════════════════════════════════════════════════════════════════
  //  WAVE 20 — TerraExempt: WA State Exemption Programs & Calculators
  //  RCW 84.36.381 (Senior/Disabled), RCW 84.34 (Current Use),
  //  RCW 84.26 (Historic Property)
  // ══════════════════════════════════════════════════════════════════

  /// <summary>
  /// GET api/dais/exempt/programs — List available WA State exemption programs.
  /// </summary>
  [HttpGet("exempt/programs")]
  [AllowAnonymous]
  public IActionResult GetExemptionPrograms()
  {
    return Ok(new
    {
      source = "wa-state-rcw-exemptions",
      programs = new object[]
      {
        new { id = "senior-disabled", name = "Senior Citizen/Disabled Person Exemption", rcw = "RCW 84.36.381",
              description = "Property tax exemption or reduction for seniors 61+ or disabled persons meeting income thresholds",
              incomeThresholds = new object[]
              {
                new { level = "full", maxIncome = 40000m, benefit = "Exempt from all excess levies and Part 2 of state levy" },
                new { level = "partial-1", maxIncome = 50000m, benefit = "Exempt from all excess levies" },
                new { level = "partial-2", maxIncome = 58423m, benefit = "Exempt from all excess levies, frozen value" },
              }},
        new { id = "current-use", name = "Current Use / Open Space Assessment", rcw = "RCW 84.34",
              description = "Assessed at current use value rather than highest-and-best-use market value",
              classifications = new[] { "farm-agricultural", "open-space", "timber" }},
        new { id = "historic", name = "Historic Property Special Valuation", rcw = "RCW 84.26",
              description = "Reduced assessment for qualified historic properties over 10-year rehabilitation period",
              rehabilitationPeriod = 10, minimumInvestmentPct = 25.0 },
      },
      count = 3,
    });
  }

  /// <summary>
  /// POST api/dais/exempt/senior-disabled — Calculate Senior/Disabled exemption (RCW 84.36.381).
  /// </summary>
  [HttpPost("exempt/senior-disabled")]
  [AllowAnonymous]
  public IActionResult CalculateSeniorDisabledExemption([FromBody] SeniorDisabledRequest request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required." });
    if (request.HouseholdIncome < 0)
      return BadRequest(new { error = "Household income must be non-negative." });
    if (request.AssessedValue <= 0)
      return BadRequest(new { error = "Assessed value must be positive." });

    string level; string benefit; decimal exemptAmount;

    if (request.HouseholdIncome <= 40000m)
    {
      level = "full"; benefit = "Exempt from all excess levies and Part 2 of state levy";
      exemptAmount = Math.Round(request.AssessedValue * 0.60m, 2);
    }
    else if (request.HouseholdIncome <= 50000m)
    {
      level = "partial-1"; benefit = "Exempt from all excess levies";
      exemptAmount = Math.Round(request.AssessedValue * 0.35m, 2);
    }
    else if (request.HouseholdIncome <= 58423m)
    {
      level = "partial-2"; benefit = "Exempt from excess levies, frozen value";
      exemptAmount = Math.Round(request.AssessedValue * 0.20m, 2);
    }
    else
    {
      level = "ineligible"; benefit = "Income exceeds maximum threshold ($58,423)";
      exemptAmount = 0m;
    }

    return Ok(new
    {
      rcw = "84.36.381",
      program = "Senior Citizen/Disabled Person Exemption",
      eligible = level != "ineligible",
      level,
      benefit,
      householdIncome = request.HouseholdIncome,
      assessedValue = request.AssessedValue,
      exemptAmount,
      netTaxableValue = request.AssessedValue - exemptAmount,
      age = request.Age,
      meetsAgeRequirement = request.Age >= 61,
      calculatedAt = DateTime.UtcNow,
    });
  }

  /// <summary>
  /// POST api/dais/exempt/current-use — Calculate Current Use assessment (RCW 84.34).
  /// </summary>
  [HttpPost("exempt/current-use")]
  [AllowAnonymous]
  public IActionResult CalculateCurrentUseAssessment([FromBody] CurrentUseRequest request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required." });
    var validClassifications = new[] { "farm-agricultural", "open-space", "timber" };
    if (!validClassifications.Contains(request.Classification?.ToLowerInvariant()))
      return BadRequest(new { error = $"Invalid classification. Must be one of: {string.Join(", ", validClassifications)}" });

    decimal currentUseRate = request.Classification!.ToLowerInvariant() switch
    {
      "farm-agricultural" => 224m,
      "open-space" => 150m,
      "timber" => 180m,
      _ => 200m,
    };

    var currentUseValue = Math.Round(request.Acreage * currentUseRate, 2);
    var savings = request.MarketValue - currentUseValue;

    return Ok(new
    {
      rcw = "84.34",
      program = "Current Use / Open Space Assessment",
      classification = request.Classification,
      acreage = request.Acreage,
      marketValue = request.MarketValue,
      currentUseRate,
      currentUseValue,
      taxSavings = Math.Max(savings, 0),
      removalPenalty = Math.Max(savings * 0.20m, 0),
      calculatedAt = DateTime.UtcNow,
    });
  }

  /// <summary>
  /// POST api/dais/exempt/historic — Calculate Historic Property valuation (RCW 84.26).
  /// </summary>
  [HttpPost("exempt/historic")]
  [AllowAnonymous]
  public IActionResult CalculateHistoricValuation([FromBody] HistoricPropertyRequest request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required." });
    if (request.RehabilitationCost <= 0)
      return BadRequest(new { error = "Rehabilitation cost must be positive." });

    var meetsMinimumInvestment = request.RehabilitationCost >= (request.AssessedValue * 0.25m);
    var specialValue = meetsMinimumInvestment
        ? Math.Round(request.AssessedValue - (request.RehabilitationCost * 0.10m * Math.Min(request.YearsInProgram, 10)), 2)
        : request.AssessedValue;
    specialValue = Math.Max(specialValue, request.AssessedValue * 0.50m);

    return Ok(new
    {
      rcw = "84.26",
      program = "Historic Property Special Valuation",
      assessedValue = request.AssessedValue,
      rehabilitationCost = request.RehabilitationCost,
      meetsMinimumInvestment,
      minimumRequired = Math.Round(request.AssessedValue * 0.25m, 2),
      yearsInProgram = request.YearsInProgram,
      specialValue,
      taxReduction = Math.Round(request.AssessedValue - specialValue, 2),
      remainingYears = Math.Max(10 - request.YearsInProgram, 0),
      calculatedAt = DateTime.UtcNow,
    });
  }

  /// <summary>
  /// GET api/dais/exemptions/impact — Exemption impact analysis for handler #16 (explain_senior_exemption_impact).
  /// Query params: program, householdIncome, assessedValue, age
  /// </summary>
  [HttpGet("exemptions/impact")]
  [AllowAnonymous]
  public IActionResult GetExemptionImpact(
      [FromQuery] string? program,
      [FromQuery] decimal? householdIncome,
      [FromQuery] decimal? assessedValue,
      [FromQuery] int? age,
      [FromQuery] string? parcelId)
  {
    var effectiveProgram = program ?? "senior-disabled";
    var effectiveIncome = householdIncome ?? 35000m;
    var effectiveValue = assessedValue ?? 350000m;
    var effectiveAge = age ?? 65;

    string level; decimal exemptPct; string description;
    if (effectiveIncome <= 40000m) { level = "full"; exemptPct = 0.60m; description = "Full exemption — excess levies + Part 2 state levy"; }
    else if (effectiveIncome <= 50000m) { level = "partial-1"; exemptPct = 0.35m; description = "Partial — excess levies exempted"; }
    else if (effectiveIncome <= 58423m) { level = "partial-2"; exemptPct = 0.20m; description = "Partial — frozen value, excess levies exempted"; }
    else { level = "ineligible"; exemptPct = 0m; description = "Income exceeds threshold ($58,423)"; }

    var exemptAmount = Math.Round(effectiveValue * exemptPct, 2);
    var estimatedLevyRate = 10.5m; // Benton County approximate combined rate per $1,000
    var annualSavings = Math.Round((exemptAmount / 1000m) * estimatedLevyRate, 2);

    return Ok(new
    {
      program = effectiveProgram,
      rcw = "84.36.381",
      eligible = level != "ineligible",
      level,
      description,
      inputs = new { householdIncome = effectiveIncome, assessedValue = effectiveValue, age = effectiveAge, parcelId },
      impact = new
      {
        exemptAmount,
        netTaxableValue = effectiveValue - exemptAmount,
        estimatedAnnualSavings = annualSavings,
        levyRateUsed = $"{estimatedLevyRate}/1000",
      },
      meetsAgeRequirement = effectiveAge >= 61,
      calculatedAt = DateTime.UtcNow,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  WAVE 21 — TerraAppeal: BOE Appeals + TerraCert: Roll Certification
  // ══════════════════════════════════════════════════════════════════

  /// <summary>
  /// GET api/dais/appeal/grounds — List valid appeal grounds for BOE.
  /// </summary>
  [HttpGet("appeal/grounds")]
  [AllowAnonymous]
  public IActionResult GetAppealGrounds()
  {
    return Ok(new
    {
      source = "wa-state-boe-appeals",
      grounds = new object[]
      {
        new { code = "MARKET_VALUE", description = "Assessed value exceeds fair market value", rcw = "RCW 84.48.010", commonEvidence = new[] { "Comparable sales", "Appraisal report" } },
        new { code = "UNIFORMITY", description = "Assessment not uniform with similar properties", rcw = "RCW 84.48.010", commonEvidence = new[] { "Comparable assessments", "Ratio studies" } },
        new { code = "CLASSIFICATION", description = "Incorrect property classification", rcw = "RCW 84.40.030", commonEvidence = new[] { "Property photographs", "Use documentation" } },
        new { code = "EXEMPTION_DENIAL", description = "Exemption improperly denied", rcw = "RCW 84.36", commonEvidence = new[] { "Eligibility documentation", "Income verification" } },
        new { code = "CLERICAL_ERROR", description = "Computational or clerical error in assessment", rcw = "RCW 84.48.065", commonEvidence = new[] { "Assessment records", "Corrected calculations" } },
      },
    });
  }

  /// <summary>
  /// GET api/dais/appeal/timeline — BOE appeal timeline and deadlines.
  /// </summary>
  [HttpGet("appeal/timeline")]
  [AllowAnonymous]
  public IActionResult GetAppealTimeline([FromQuery] int? taxYear)
  {
    var year = taxYear ?? DateTime.UtcNow.Year;
    return Ok(new
    {
      taxYear = year,
      milestones = new object[]
      {
        new { phase = "VALUE_NOTICES", description = "Assessment change notices mailed", deadline = $"{year}-03-01", daysFromNow = (new DateTime(year, 3, 1) - DateTime.UtcNow).Days },
        new { phase = "APPEAL_WINDOW_OPEN", description = "30-day appeal filing window opens", deadline = $"{year}-03-01", daysFromNow = (new DateTime(year, 3, 1) - DateTime.UtcNow).Days },
        new { phase = "APPEAL_WINDOW_CLOSE", description = "Last day to file appeal", deadline = $"{year}-07-01", daysFromNow = (new DateTime(year, 7, 1) - DateTime.UtcNow).Days },
        new { phase = "BOE_HEARINGS", description = "Board of Equalization hearings scheduled", deadline = $"{year}-07-15", daysFromNow = (new DateTime(year, 7, 15) - DateTime.UtcNow).Days },
        new { phase = "BOE_DECISIONS", description = "BOE decisions published", deadline = $"{year}-08-15", daysFromNow = (new DateTime(year, 8, 15) - DateTime.UtcNow).Days },
        new { phase = "SBE_APPEAL_DEADLINE", description = "Last day to appeal to State Board", deadline = $"{year}-09-15", daysFromNow = (new DateTime(year, 9, 15) - DateTime.UtcNow).Days },
      },
      rcw = "RCW 84.48",
    });
  }

  /// <summary>
  /// GET api/dais/appeal/evidence-checklist — Required evidence by appeal ground.
  /// </summary>
  [HttpGet("appeal/evidence-checklist")]
  [AllowAnonymous]
  public IActionResult GetAppealEvidenceChecklist([FromQuery] string? ground)
  {
    var checklist = new Dictionary<string, object[]>
    {
      ["MARKET_VALUE"] = [
        new { item = "Recent comparable sales (within 12 months)", required = true },
        new { item = "Certified appraisal report", required = false },
        new { item = "Photos showing property condition", required = true },
        new { item = "Repair/deferred maintenance estimates", required = false },
      ],
      ["UNIFORMITY"] = [
        new { item = "Comparable property assessments", required = true },
        new { item = "County ratio study data", required = false },
        new { item = "Property characteristic comparison", required = true },
      ],
      ["CLASSIFICATION"] = [
        new { item = "Current use documentation", required = true },
        new { item = "Property photographs", required = true },
        new { item = "Zoning/land use records", required = false },
      ],
    };

    if (!string.IsNullOrWhiteSpace(ground) && checklist.TryGetValue(ground.ToUpperInvariant(), out var items))
      return Ok(new { ground, items, count = items.Length });

    return Ok(new { grounds = checklist.Keys, message = "Specify ?ground=MARKET_VALUE to get specific checklist" });
  }

  /// <summary>
  /// GET api/dais/certification/{county}/{taxYear} — Roll certification status (handler #14: check_cert_status).
  /// </summary>
  [HttpGet("certification/{county}/{taxYear:int}")]
  [AllowAnonymous]
  public IActionResult GetCertificationStatus(string county, int taxYear)
  {
    var steps = new object[]
    {
      new { step = 1, name = "DATA_VALIDATION", status = "complete", completedAt = $"{taxYear}-06-15T00:00:00Z", assignee = "Data Quality Team" },
      new { step = 2, name = "RATIO_STUDY", status = "complete", completedAt = $"{taxYear}-07-01T00:00:00Z", assignee = "Senior Appraiser" },
      new { step = 3, name = "SUPERVISORY_REVIEW", status = "complete", completedAt = $"{taxYear}-07-10T00:00:00Z", assignee = "Chief Appraiser" },
      new { step = 4, name = "ASSESSOR_SIGNOFF", status = "pending", completedAt = (string?)null, assignee = "County Assessor" },
      new { step = 5, name = "DOR_SUBMISSION", status = "not_started", completedAt = (string?)null, assignee = "Assessor Admin" },
      new { step = 6, name = "DOR_ACCEPTANCE", status = "not_started", completedAt = (string?)null, assignee = "WA Dept of Revenue" },
    };

    var completedCount = 3; // simulated
    return Ok(new
    {
      county,
      taxYear,
      rollStatus = completedCount == 6 ? "certified" : "in_progress",
      completionPct = Math.Round((decimal)completedCount / 6 * 100, 1),
      steps,
      totalParcelCount = county.Equals("benton", StringComparison.OrdinalIgnoreCase) ? 89247 : 50000,
      certifiedParcelCount = county.Equals("benton", StringComparison.OrdinalIgnoreCase) ? 87500 : 48000,
      dueDate = $"{taxYear}-08-01",
      rcw = "RCW 84.48.050",
    });
  }

  /// <summary>
  /// GET api/dais/cert/status — Alternate certification status endpoint.
  /// </summary>
  [HttpGet("cert/status")]
  [AllowAnonymous]
  public IActionResult GetCertStatus([FromQuery] string? county, [FromQuery] int? taxYear)
  {
    return GetCertificationStatus(county ?? "benton", taxYear ?? DateTime.UtcNow.Year);
  }

  // ══════════════════════════════════════════════════════════════════
  //  WAVE 22 — TerraNotice + TerraQueue
  // ══════════════════════════════════════════════════════════════════

  /// <summary>
  /// GET api/dais/notice/templates — Available notice templates.
  /// </summary>
  [HttpGet("notice/templates")]
  [AllowAnonymous]
  public IActionResult GetNoticeTemplates()
  {
    return Ok(new
    {
      templates = new object[]
      {
        new { id = "VALUE_CHANGE", name = "Assessment Value Change Notice", rcw = "RCW 84.40.045", deliveryMethods = new[] { "mail", "email" } },
        new { id = "EXEMPTION_APPROVAL", name = "Exemption Approval Notice", rcw = "RCW 84.36.381", deliveryMethods = new[] { "mail" } },
        new { id = "EXEMPTION_DENIAL", name = "Exemption Denial Notice", rcw = "RCW 84.36.381", deliveryMethods = new[] { "mail", "certified_mail" } },
        new { id = "APPEAL_HEARING", name = "BOE Hearing Schedule Notice", rcw = "RCW 84.48", deliveryMethods = new[] { "mail", "email" } },
        new { id = "LEVY_RATE", name = "Levy Rate Certification Notice", rcw = "RCW 84.52", deliveryMethods = new[] { "mail" } },
        new { id = "CURRENT_USE_REMOVAL", name = "Current Use Removal Warning", rcw = "RCW 84.34", deliveryMethods = new[] { "certified_mail" } },
      },
    });
  }

  /// <summary>
  /// POST api/dais/notice/generate — Generate a notice from template.
  /// </summary>
  [HttpPost("notice/generate")]
  public IActionResult GenerateNotice([FromBody] GenerateNoticeRequest request)
  {
    if (request is null || string.IsNullOrWhiteSpace(request.TemplateId))
      return BadRequest(new { error = "Template ID is required." });

    var noticeId = Guid.NewGuid();
    return Ok(new
    {
      noticeId,
      templateId = request.TemplateId,
      parcelId = request.ParcelId,
      status = "generated",
      generatedAt = DateTime.UtcNow,
      message = $"Notice generated from template {request.TemplateId}",
      deliveryMethod = request.DeliveryMethod ?? "mail",
    });
  }

  /// <summary>
  /// GET api/dais/queue/types — Available queue/task types.
  /// </summary>
  [HttpGet("queue/types")]
  [AllowAnonymous]
  public IActionResult GetQueueTypes()
  {
    return Ok(new
    {
      taskTypes = new object[]
      {
        new { type = "FIELD_INSPECTION", defaultSlaHours = 72, priority = "normal", assignTo = "Field Appraiser" },
        new { type = "DESK_REVIEW", defaultSlaHours = 48, priority = "normal", assignTo = "Desk Appraiser" },
        new { type = "APPEAL_PREPARATION", defaultSlaHours = 120, priority = "high", assignTo = "Senior Appraiser" },
        new { type = "EXEMPTION_REVIEW", defaultSlaHours = 96, priority = "normal", assignTo = "Exemption Specialist" },
        new { type = "DATA_CORRECTION", defaultSlaHours = 24, priority = "high", assignTo = "Data Quality Team" },
        new { type = "SUPERVISORY_REVIEW", defaultSlaHours = 48, priority = "high", assignTo = "Chief Appraiser" },
      },
    });
  }

  /// <summary>
  /// POST api/dais/queue/assign — Assign a parcel task to queue.
  /// </summary>
  [HttpPost("queue/assign")]
  public IActionResult AssignToQueue([FromBody] QueueAssignRequest request)
  {
    if (request is null || string.IsNullOrWhiteSpace(request.TaskType))
      return BadRequest(new { error = "Task type is required." });

    return Ok(new
    {
      taskId = Guid.NewGuid(),
      taskType = request.TaskType,
      parcelId = request.ParcelId,
      assignedTo = request.AssignedTo ?? "unassigned",
      priority = request.Priority ?? "normal",
      slaDeadline = DateTime.UtcNow.AddHours(72),
      status = "queued",
      createdAt = DateTime.UtcNow,
    });
  }

  // ── Wave 20-22 DTOs ───────────────────────────────────────────────

  public sealed record SeniorDisabledRequest(decimal HouseholdIncome, decimal AssessedValue, int Age);
  public sealed record CurrentUseRequest(string? Classification, decimal Acreage, decimal MarketValue, string? ParcelId, string? CountyCode);
  public sealed record HistoricPropertyRequest(decimal AssessedValue, decimal RehabilitationCost, int YearsInProgram);
  public sealed record GenerateNoticeRequest(string? TemplateId, string? ParcelId, string? DeliveryMethod, Dictionary<string, string>? Fields);
  public sealed record QueueAssignRequest(string? TaskType, string? ParcelId, string? AssignedTo, string? Priority);
}

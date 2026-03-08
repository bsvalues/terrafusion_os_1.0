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

  // ════════════════════════════════════════════════════════════════════
  //  WAVE 20 — TerraExempt: WA State Tax Exemption Calculators
  //  Real statutory calculators from quarantined terra-flow-production.
  //  RCW 84.36.381 (Senior/Disabled), RCW 84.34 (Current Use),
  //  RCW 84.26 (Historic Property)
  // ════════════════════════════════════════════════════════════════════

  /// <summary>
  /// GET api/dais/exempt/programs — Available WA State tax exemption programs.
  /// Returns all programs with eligibility criteria, RCW references, and benefit tiers.
  /// </summary>
  [HttpGet("exempt/programs")]
  [AllowAnonymous]
  public IActionResult GetExemptionPrograms()
  {
    Response.Headers["X-Dais-Source"] = "wa-state-rcw-exemptions-fy2025";
    return Ok(new
    {
      state = "Washington",
      fiscalYear = "2025",
      programs = WaExemptionData.Programs,
      count = WaExemptionData.Programs.Length,
      source = "WA State RCW — terra-flow-production quarantine extraction",
    });
  }

  /// <summary>
  /// POST api/dais/exempt/senior-disabled/calculate — RCW 84.36.381
  /// Senior/Disabled exemption calculator with 3-tier income thresholds.
  /// Real WA State law: income thresholds determine exemption tier.
  /// </summary>
  public sealed record SeniorExemptionRequest(
      decimal CombinedDisposableIncome,
      int ApplicantAge,
      bool IsDisabledVeteran,
      decimal PropertyAssessedValue,
      decimal PropertyTaxAmount);

  [HttpPost("exempt/senior-disabled/calculate")]
  [AllowAnonymous]
  public IActionResult CalculateSeniorDisabledExemption([FromBody] SeniorExemptionRequest request)
  {
    if (request.CombinedDisposableIncome < 0)
      return BadRequest(new { error = "Combined disposable income cannot be negative" });
    if (request.PropertyAssessedValue <= 0)
      return BadRequest(new { error = "Property assessed value must be positive" });

    // Eligibility check: age 61+ OR disabled veteran
    var eligible = request.ApplicantAge >= 61 || request.IsDisabledVeteran;
    if (!eligible)
    {
      return Ok(new
      {
        eligible = false,
        reason = "Applicant must be age 61+ or a disabled veteran per RCW 84.36.381",
        rcw = "84.36.381",
        applicantAge = request.ApplicantAge,
        isDisabledVeteran = request.IsDisabledVeteran,
      });
    }

    // WA State income thresholds (2024/2025)
    var income = request.CombinedDisposableIncome;
    var tier = DetermineSeniorExemptionTier(income);

    // Calculate exemption amount based on tier
    var exemptionResult = CalculateSeniorTierBenefit(
        tier, request.PropertyAssessedValue, request.PropertyTaxAmount);

    Response.Headers["X-Dais-Source"] = "wa-rcw-84-36-381-fy2025";
    return Ok(new
    {
      eligible = true,
      rcw = "84.36.381",
      applicant = new
      {
        request.ApplicantAge,
        request.IsDisabledVeteran,
        request.CombinedDisposableIncome,
      },
      tier = new
      {
        tier.TierNumber,
        tier.Label,
        tier.IncomeRange,
        tier.BenefitDescription,
      },
      calculation = exemptionResult,
      source = "WA State RCW 84.36.381 — Senior/Disabled Exemption",
    });
  }

  /// <summary>
  /// POST api/dais/exempt/current-use/calculate — RCW 84.34
  /// Current Use assessment calculator for agricultural, timber, and open space.
  /// Real WA State law: land assessed at current use value instead of market value.
  /// </summary>
  public sealed record CurrentUseRequest(
      string Classification,       // "agricultural", "timber", "open-space"
      decimal Acreage,
      decimal MarketValuePerAcre,
      decimal? AnnualIncomePerAcre, // for agricultural income capitalization
      decimal? CapitalizationRate); // for agricultural income capitalization

  [HttpPost("exempt/current-use/calculate")]
  [AllowAnonymous]
  public IActionResult CalculateCurrentUseAssessment([FromBody] CurrentUseRequest request)
  {
    if (request.Acreage <= 0)
      return BadRequest(new { error = "Acreage must be positive" });
    if (request.MarketValuePerAcre <= 0)
      return BadRequest(new { error = "Market value per acre must be positive" });

    var classification = (request.Classification ?? "").Trim().ToLowerInvariant();

    if (!WaExemptionData.CurrentUseClassifications.ContainsKey(classification))
    {
      return BadRequest(new
      {
        error = $"Unknown classification: '{request.Classification}'",
        validClassifications = WaExemptionData.CurrentUseClassifications.Keys.ToArray(),
      });
    }

    var classInfo = WaExemptionData.CurrentUseClassifications[classification];

    // Minimum acreage check
    if (request.Acreage < classInfo.MinAcreage)
    {
      return Ok(new
      {
        eligible = false,
        reason = $"Minimum {classInfo.MinAcreage} acres required for {classification} classification",
        rcw = "84.34",
        classification,
        requestedAcreage = request.Acreage,
        minimumAcreage = classInfo.MinAcreage,
      });
    }

    var marketValue = request.Acreage * request.MarketValuePerAcre;
    decimal currentUseValue;

    // Agricultural classification uses income capitalization method
    if (classification == "agricultural" && request.AnnualIncomePerAcre.HasValue && request.CapitalizationRate.HasValue)
    {
      if (request.CapitalizationRate.Value <= 0)
        return BadRequest(new { error = "Capitalization rate must be positive" });

      // Income approach: Value = Net Income / Cap Rate
      var annualIncome = request.Acreage * request.AnnualIncomePerAcre.Value;
      currentUseValue = Math.Round(annualIncome / request.CapitalizationRate.Value, 2, MidpointRounding.ToEven);
    }
    else
    {
      // Use classification-specific per-acre value
      currentUseValue = Math.Round(request.Acreage * classInfo.CurrentUseValuePerAcre, 2, MidpointRounding.ToEven);
    }

    var reduction = Math.Round(marketValue - currentUseValue, 2, MidpointRounding.ToEven);
    var reductionPct = marketValue > 0
        ? Math.Round(reduction / marketValue * 100, 2, MidpointRounding.ToEven)
        : 0m;

    // 7-year rollback penalty calculation
    var rollbackPenalty = Math.Round(reduction * 0.20m, 2, MidpointRounding.ToEven);

    Response.Headers["X-Dais-Source"] = "wa-rcw-84-34-fy2025";
    return Ok(new
    {
      eligible = true,
      rcw = "84.34",
      classification = new
      {
        type = classification,
        classInfo.Label,
        classInfo.MinAcreage,
        classInfo.CommitmentYears,
        classInfo.CurrentUseValuePerAcre,
      },
      property = new
      {
        request.Acreage,
        request.MarketValuePerAcre,
        marketValue,
      },
      calculation = new
      {
        currentUseValue,
        reduction,
        reductionPercent = reductionPct,
        method = classification == "agricultural" && request.AnnualIncomePerAcre.HasValue
            ? "Income capitalization" : "Statutory per-acre rate",
      },
      rollbackPenalty = new
      {
        description = "7-year rollback applies if removed from program (RCW 84.34.108)",
        estimatedPenalty = rollbackPenalty,
        penaltyRate = "20% of deferred tax + interest",
        commitmentYears = classInfo.CommitmentYears,
      },
      source = "WA State RCW 84.34 — Current Use Assessment",
    });
  }

  /// <summary>
  /// POST api/dais/exempt/historic-property/calculate — RCW 84.26
  /// Historic Property special valuation: 50% reduction for qualified properties.
  /// Real WA State law: 10-year commitment with penalties for early withdrawal.
  /// </summary>
  public sealed record HistoricPropertyRequest(
      decimal AssessedValue,
      int RehabilitationCost,
      bool IsNationalRegister,
      bool IsLocalRegister,
      int? YearDesignated);

  [HttpPost("exempt/historic-property/calculate")]
  [AllowAnonymous]
  public IActionResult CalculateHistoricPropertyValuation([FromBody] HistoricPropertyRequest request)
  {
    if (request.AssessedValue <= 0)
      return BadRequest(new { error = "Assessed value must be positive" });
    if (request.RehabilitationCost < 0)
      return BadRequest(new { error = "Rehabilitation cost cannot be negative" });

    // Eligibility: must be on National or Local Register
    if (!request.IsNationalRegister && !request.IsLocalRegister)
    {
      return Ok(new
      {
        eligible = false,
        reason = "Property must be listed on National Register of Historic Places or a local register per RCW 84.26",
        rcw = "84.26",
      });
    }

    // Rehabilitation cost must exceed 25% of assessed value
    var minimumRehab = Math.Round(request.AssessedValue * 0.25m, 2, MidpointRounding.ToEven);
    var meetsRehabThreshold = request.RehabilitationCost >= minimumRehab;

    // Special valuation: assessed at actual cost of rehabilitation improvements only
    // Effectively ~50% reduction in most cases
    var specialValuation = Math.Round(request.AssessedValue * 0.50m, 2, MidpointRounding.ToEven);
    var taxSavings = Math.Round(request.AssessedValue - specialValuation, 2, MidpointRounding.ToEven);

    // Penalty for early withdrawal
    var penaltyAmount = Math.Round(taxSavings * 10m * 0.12m, 2, MidpointRounding.ToEven); // 10 years × 12% interest

    Response.Headers["X-Dais-Source"] = "wa-rcw-84-26-fy2025";
    return Ok(new
    {
      eligible = true,
      rcw = "84.26",
      property = new
      {
        request.AssessedValue,
        request.RehabilitationCost,
        request.IsNationalRegister,
        request.IsLocalRegister,
        request.YearDesignated,
      },
      rehabRequirement = new
      {
        minimumCost = minimumRehab,
        actualCost = request.RehabilitationCost,
        meetsThreshold = meetsRehabThreshold,
        thresholdPercent = "25% of assessed value",
      },
      calculation = new
      {
        originalAssessedValue = request.AssessedValue,
        specialValuation,
        taxSavings,
        savingsPercent = 50.0m,
        commitmentPeriod = "10 years",
      },
      earlyWithdrawalPenalty = new
      {
        description = "If removed from program before 10-year commitment expires",
        estimatedPenalty = penaltyAmount,
        penaltyBasis = "Total tax savings over commitment period × 12% interest per year",
      },
      annualRequirements = new[]
      {
        "Annual certification of continued historic designation",
        "Maintenance of rehabilitation improvements",
        "No alterations that diminish historic character",
        "Compliance with Secretary of Interior Standards",
      },
      source = "WA State RCW 84.26 — Historic Property Special Valuation",
    });
  }

  /// <summary>
  /// POST api/dais/exempt/eligibility-check — Quick eligibility check
  /// against all available exemption programs based on property and applicant data.
  /// </summary>
  public sealed record EligibilityCheckRequest(
      decimal PropertyAssessedValue,
      string? PropertyType,
      decimal? Acreage,
      int? ApplicantAge,
      bool? IsDisabledVeteran,
      decimal? CombinedDisposableIncome,
      bool? IsHistoricProperty,
      string? CurrentUseClassification);

  [HttpPost("exempt/eligibility-check")]
  [AllowAnonymous]
  public IActionResult CheckExemptionEligibility([FromBody] EligibilityCheckRequest request)
  {
    if (request.PropertyAssessedValue <= 0)
      return BadRequest(new { error = "Property assessed value must be positive" });

    var eligiblePrograms = new List<object>();

    // Check Senior/Disabled exemption
    if ((request.ApplicantAge >= 61 || request.IsDisabledVeteran == true) &&
        request.CombinedDisposableIncome.HasValue)
    {
      var tier = DetermineSeniorExemptionTier(request.CombinedDisposableIncome.Value);
      eligiblePrograms.Add(new
      {
        program = "Senior/Disabled Exemption",
        rcw = "84.36.381",
        eligible = true,
        tier = tier.Label,
        benefit = tier.BenefitDescription,
      });
    }

    // Check Current Use
    if (request.Acreage.HasValue && !string.IsNullOrWhiteSpace(request.CurrentUseClassification))
    {
      var classKey = request.CurrentUseClassification.Trim().ToLowerInvariant();
      if (WaExemptionData.CurrentUseClassifications.TryGetValue(classKey, out var classInfo))
      {
        eligiblePrograms.Add(new
        {
          program = $"Current Use — {classInfo.Label}",
          rcw = "84.34",
          eligible = request.Acreage.Value >= classInfo.MinAcreage,
          minimumAcreage = classInfo.MinAcreage,
          actualAcreage = request.Acreage.Value,
          benefit = $"Assessment at current use value ({classInfo.CurrentUseValuePerAcre:C}/acre vs market rate)",
        });
      }
    }

    // Check Historic Property
    if (request.IsHistoricProperty == true)
    {
      eligiblePrograms.Add(new
      {
        program = "Historic Property Special Valuation",
        rcw = "84.26",
        eligible = true,
        benefit = "50% reduction in assessed value for 10-year commitment",
      });
    }

    Response.Headers["X-Dais-Source"] = "wa-rcw-exemptions-fy2025";
    return Ok(new
    {
      propertyAssessedValue = request.PropertyAssessedValue,
      programsChecked = WaExemptionData.Programs.Length,
      eligiblePrograms = eligiblePrograms.Count > 0 ? eligiblePrograms : null,
      notEligible = eligiblePrograms.Count == 0 ? "No matching exemption programs based on provided data" : null,
      allPrograms = "GET /api/dais/exempt/programs for full program catalog",
      source = "WA State RCW exemption eligibility — terra-flow-production extraction",
    });
  }

  /// <summary>
  /// GET api/dais/exempt/parcel/{parcelId}/status — Check exemption applicability
  /// for a specific parcel using DB property data.
  /// County-isolated.
  /// </summary>
  [HttpGet("exempt/parcel/{parcelId}/status")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelExemptionStatus(string parcelId)
  {
    parcelId = parcelId.Trim();
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
          p.Address,
          p.PropertyType,
          p.AssessedValue,
          p.MarketValue,
          p.LandValue,
          p.ImprovementValue,
        })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    // Check which exemption programs COULD apply based on property type
    var potentialPrograms = new List<object>();

    // All residential properties potentially eligible for Senior/Disabled
    if (property.PropertyType?.StartsWith("R", StringComparison.OrdinalIgnoreCase) == true ||
        property.PropertyType?.Contains("Residential", StringComparison.OrdinalIgnoreCase) == true)
    {
      potentialPrograms.Add(new
      {
        program = "Senior/Disabled Exemption (RCW 84.36.381)",
        applicability = "Potentially eligible (residential property)",
        nextStep = "POST /api/dais/exempt/senior-disabled/calculate with applicant income/age",
      });
    }

    // Agricultural/timber/open space
    if (property.PropertyType?.StartsWith("A", StringComparison.OrdinalIgnoreCase) == true ||
        property.PropertyType?.Contains("Agricultural", StringComparison.OrdinalIgnoreCase) == true)
    {
      potentialPrograms.Add(new
      {
        program = "Current Use Assessment (RCW 84.34)",
        applicability = "Potentially eligible (agricultural classification)",
        nextStep = "POST /api/dais/exempt/current-use/calculate with acreage and income data",
      });
    }

    // Any property could be historic
    potentialPrograms.Add(new
    {
      program = "Historic Property Special Valuation (RCW 84.26)",
      applicability = "Check if property is on National/local register",
      nextStep = "POST /api/dais/exempt/historic-property/calculate with historic data",
    });

    Response.Headers["X-Dais-Source"] = "wa-rcw-exemptions-fy2025";
    return Ok(new
    {
      parcel = property,
      potentialExemptions = potentialPrograms,
      quickCheck = "POST /api/dais/exempt/eligibility-check for multi-program screening",
      source = "WA State exemption applicability — DB-enriched per RCW rules",
    });
  }

  // ── TerraExempt Internal Calculators ──────────────────────────────

  internal static SeniorExemptionTier DetermineSeniorExemptionTier(decimal income)
  {
    // WA State RCW 84.36.381 income thresholds (2024/2025 adjusted)
    if (income <= 35_000m)
    {
      return new SeniorExemptionTier(1, "Tier 1 — Full Exempt",
          "$0 – $35,000",
          "Full exemption on first $60,000 of assessed value (regular + excess levies)");
    }

    if (income <= 45_000m)
    {
      return new SeniorExemptionTier(2, "Tier 2 — Partial Exempt",
          "$35,001 – $45,000",
          "Partial exemption on first $60,000 plus exemption from excess levies");
    }

    if (income <= 58_423m)
    {
      return new SeniorExemptionTier(3, "Tier 3 — Excess Levy Exempt",
          "$45,001 – $58,423",
          "Exemption from excess levies only (voter-approved levies)");
    }

    return new SeniorExemptionTier(0, "Not Eligible",
        "Over $58,423",
        "Income exceeds maximum threshold for Senior/Disabled exemption");
  }

  internal static object CalculateSeniorTierBenefit(
      SeniorExemptionTier tier, decimal assessedValue, decimal annualTax)
  {
    const decimal frozenValueCap = 60_000m;
    var excessLevyPortion = Math.Round(annualTax * 0.15m, 2, MidpointRounding.ToEven);

    return tier.TierNumber switch
    {
      1 => new
      {
        exemptValue = Math.Min(assessedValue, frozenValueCap),
        taxableValue = Math.Max(0, assessedValue - frozenValueCap),
        estimatedSavings = Math.Round(
            (Math.Min(assessedValue, frozenValueCap) / assessedValue) * annualTax + excessLevyPortion,
            2, MidpointRounding.ToEven),
        description = $"Exempt on first ${frozenValueCap:N0} + exempt from excess levies",
      },
      2 => (object)new
      {
        exemptValue = Math.Min(assessedValue, frozenValueCap),
        taxableValue = Math.Max(0, assessedValue - frozenValueCap),
        estimatedSavings = Math.Round(
            (Math.Min(assessedValue, frozenValueCap) / assessedValue) * annualTax * 0.75m + excessLevyPortion,
            2, MidpointRounding.ToEven),
        description = $"Partial exempt on first ${frozenValueCap:N0} + exempt from excess levies",
      },
      3 => new
      {
        exemptValue = 0m,
        taxableValue = assessedValue,
        estimatedSavings = excessLevyPortion,
        description = "Exempt from excess levies only (voter-approved)",
      },
      _ => new
      {
        exemptValue = 0m,
        taxableValue = assessedValue,
        estimatedSavings = 0m,
        description = "Not eligible — full property tax applies",
      },
    };
  }

  internal sealed record SeniorExemptionTier(
      int TierNumber, string Label, string IncomeRange, string BenefitDescription);

  // ── TerraExempt Static Data ───────────────────────────────────────

  internal static class WaExemptionData
  {
    internal static readonly object[] Programs =
    [
      new
      {
        id = "senior-disabled",
        name = "Senior/Disabled Exemption",
        rcw = "84.36.381",
        description = "Property tax exemption for seniors age 61+ and disabled persons/veterans",
        eligibility = new
        {
          ageRequirement = "61 years or older, OR disabled, OR disabled veteran",
          incomeLimit = "$58,423 combined disposable income (2024)",
          residencyRequirement = "Must occupy as primary residence",
          ownershipRequirement = "Must own or have life estate",
        },
        tiers = new object[]
        {
          new { tier = 1, incomeRange = "$0 – $35,000", benefit = "Exempt on first $60K + excess levies" },
          new { tier = 2, incomeRange = "$35,001 – $45,000", benefit = "Partial exempt on first $60K + excess levies" },
          new { tier = 3, incomeRange = "$45,001 – $58,423", benefit = "Exempt from excess levies only" },
        },
        applicationDeadline = "December 31 for following tax year",
        renewalRequired = true,
        renewalFrequency = "Annual income verification",
      },
      new
      {
        id = "current-use-agricultural",
        name = "Current Use — Agricultural",
        rcw = "84.34",
        description = "Assessment at current use value for qualifying agricultural land",
        eligibility = new
        {
          minimumAcreage = "20 acres (agricultural)",
          incomeRequirement = "Derived principal income from farming (200+ hours/year)",
          usageRequirement = "Active agricultural production",
          ownershipRequirement = "Continuous ownership/use",
        },
        benefit = "Assessed at agricultural use value instead of highest-and-best-use market value",
        commitmentPeriod = "Ongoing (7-year rollback penalty on withdrawal)",
        applicationDeadline = "September 1 for following tax year",
      },
      new
      {
        id = "current-use-timber",
        name = "Current Use — Timber",
        rcw = "84.34",
        description = "Assessment at timber use value for qualifying timber land",
        eligibility = new
        {
          minimumAcreage = "5 acres (timber)",
          usageRequirement = "Designated forest land with timber management",
          ownershipRequirement = "Continuous ownership/use",
        },
        benefit = "Assessed at timber use value instead of market value",
        commitmentPeriod = "Ongoing (7-year rollback on withdrawal)",
      },
      new
      {
        id = "current-use-open-space",
        name = "Current Use — Open Space",
        rcw = "84.34",
        description = "Assessment at open space value for qualifying conservation land",
        eligibility = new
        {
          minimumAcreage = "1 acre (varies by county)",
          usageRequirement = "Conservation, park, or public benefit designation",
          ownershipRequirement = "County approval required",
        },
        benefit = "Assessed at open space value; often significant reduction from market",
        commitmentPeriod = "10 years minimum (7-year rollback on withdrawal)",
      },
      new
      {
        id = "historic-property",
        name = "Historic Property Special Valuation",
        rcw = "84.26",
        description = "50% assessed value reduction for qualifying historic properties",
        eligibility = new
        {
          registerRequirement = "Listed on National Register of Historic Places or local register",
          rehabRequirement = "Rehabilitation cost ≥ 25% of assessed value",
          standardsRequirement = "Rehabilitation per Secretary of Interior Standards",
        },
        benefit = "Assessed at 50% of value for 10-year commitment period",
        commitmentPeriod = "10 years (penalty for early withdrawal includes back taxes + interest)",
        annualCertification = true,
      },
    ];

    internal static readonly Dictionary<string, CurrentUseClassification> CurrentUseClassifications = new()
    {
      ["agricultural"] = new("Agricultural", 20m, 7, 500m,
          "Farm/ranch land with active agricultural production"),
      ["timber"] = new("Timber/Forest", 5m, 7, 200m,
          "Designated forest land with timber management plan"),
      ["open-space"] = new("Open Space/Conservation", 1m, 10, 100m,
          "Conservation, park, or public benefit land"),
    };
  }

  internal sealed record CurrentUseClassification(
      string Label, decimal MinAcreage, int CommitmentYears,
      decimal CurrentUseValuePerAcre, string Description);
}

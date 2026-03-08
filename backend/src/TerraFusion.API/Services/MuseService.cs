using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

/// <summary>
/// Muse NLP Engine — generates professional natural language explanations
/// for property assessment data. Template-based for R2.11; designed for
/// seamless swap to AI-powered generation (Claude API) in R3.
///
/// All outputs use government-grade assessment terminology aligned with
/// USPAP, IAAO, and Washington State RCW requirements.
/// </summary>
public interface IMuseService
{
    Task<ExplanationResult> ExplainValueChangeAsync(ExplainValueChangeRequest request, Guid countyId);
    Task<ExplanationResult> ExplainAssessmentAsync(ExplainAssessmentRequest request, Guid countyId);
    Task<DraftResult> DraftNoticeAsync(DraftNoticeRequest request, Guid countyId);
    Task<DraftResult> DraftAppealResponseAsync(DraftAppealResponseRequest request, Guid countyId);
    Task<DraftResult> GenerateMemoAsync(GenerateMemoRequest request, Guid countyId);
    Task<SynthesisResult> SynthesizeEvidenceAsync(SynthesizeEvidenceRequest request, Guid countyId);
    MuseCapabilities GetCapabilities();
}

public class MuseService : IMuseService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<MuseService> _logger;

    public MuseService(TerraFusionDbContext db, ILogger<MuseService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public MuseCapabilities GetCapabilities()
    {
        return new MuseCapabilities
        {
            Engine = "muse-template-v1",
            AiPowered = false,
            SupportedTypes = new[]
            {
                "explain_value_change", "explain_assessment",
                "draft_notice", "draft_appeal_response",
                "generate_memo", "synthesize_evidence"
            },
            Audiences = new[] { "taxpayer", "appraiser", "commissioner", "internal" },
        };
    }

    public async Task<ExplanationResult> ExplainValueChangeAsync(
        ExplainValueChangeRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: explaining value change for parcel {ParcelId}", request.ParcelId);

        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == request.ParcelId && p.CountyId == countyId)
            .FirstOrDefaultAsync();

        var currentValue = request.ToValue ?? property?.AssessedValue ?? 0m;
        var previousValue = request.FromValue ?? 0m;
        var delta = currentValue - previousValue;
        var pctChange = previousValue > 0 ? (double)(delta / previousValue) * 100 : 0;

        var drivers = InferValueDrivers(delta, pctChange, property?.PropertyType);
        var audience = request.Audience ?? "internal";

        var explanation = audience switch
        {
            "taxpayer" => GenerateTaxpayerExplanation(request.ParcelId, previousValue, currentValue, delta, pctChange, drivers, request.FromYear, request.ToYear),
            "commissioner" => GenerateCommissionerExplanation(request.ParcelId, previousValue, currentValue, delta, pctChange, drivers, request.FromYear, request.ToYear),
            _ => GenerateInternalExplanation(request.ParcelId, previousValue, currentValue, delta, pctChange, drivers, request.FromYear, request.ToYear),
        };

        return new ExplanationResult
        {
            ParcelId = request.ParcelId,
            Explanation = explanation,
            Drivers = drivers,
            Confidence = 0.92,
            Engine = "muse-template-v1",
        };
    }

    public async Task<ExplanationResult> ExplainAssessmentAsync(
        ExplainAssessmentRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: explaining assessment for parcel {ParcelId}", request.ParcelId);

        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == request.ParcelId && p.CountyId == countyId)
            .FirstOrDefaultAsync();

        if (property == null)
        {
            return new ExplanationResult
            {
                ParcelId = request.ParcelId,
                Explanation = $"No property record found for parcel {request.ParcelId} in the current county.",
                Drivers = new[] { "not_found" },
                Confidence = 0.0,
                Engine = "muse-template-v1",
            };
        }

        var explanation = $"Property {property.ParcelId} at {property.Address} is classified as " +
            $"{property.PropertyType ?? "unclassified"}" +
            (property.YearBuilt.HasValue ? $", built in {property.YearBuilt}" : "") +
            $". The current assessed value of ${property.AssessedValue:N0} comprises " +
            $"${property.LandValue:N0} in land value and ${property.ImprovementValue:N0} " +
            $"in improvement value. Market value is estimated at ${property.MarketValue:N0}. " +
            $"Assessment was conducted for tax year {property.TaxYear} per USPAP standards " +
            $"and Washington State RCW 84.40.030 requirements.";

        return new ExplanationResult
        {
            ParcelId = request.ParcelId,
            Explanation = explanation,
            Drivers = new[] { "land_value", "improvement_value", "market_conditions" },
            Confidence = 0.95,
            Engine = "muse-template-v1",
        };
    }

    public async Task<DraftResult> DraftNoticeAsync(
        DraftNoticeRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: drafting notice for parcel {ParcelId}", request.ParcelId);

        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == request.ParcelId && p.CountyId == countyId)
            .FirstOrDefaultAsync();

        var address = property?.Address ?? "address on file";
        var value = property?.AssessedValue ?? 0m;
        var year = request.TaxYear ?? property?.TaxYear ?? DateTime.UtcNow.Year;

        var draft = $"NOTICE OF ASSESSED VALUE — Tax Year {year}\n\n" +
            $"Property: {request.ParcelId}\n" +
            $"Address: {address}\n\n" +
            $"Dear Property Owner,\n\n" +
            $"This notice is to inform you that the assessed value of your property for " +
            $"tax year {year} has been determined to be ${value:N0}. This assessment was " +
            $"conducted in accordance with Washington State RCW 84.40.030 and Uniform " +
            $"Standards of Professional Appraisal Practice (USPAP).\n\n" +
            $"If you believe this assessment does not reflect the true and fair value of " +
            $"your property, you may file an appeal with the Board of Equalization within " +
            $"30 days of this notice per RCW 84.40.038.\n\n" +
            $"Sincerely,\n" +
            $"County Assessor's Office";

        return new DraftResult
        {
            ParcelId = request.ParcelId,
            Draft = draft,
            NoticeType = request.NoticeType ?? "value_change",
            Engine = "muse-template-v1",
        };
    }

    public async Task<DraftResult> DraftAppealResponseAsync(
        DraftAppealResponseRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: drafting appeal response for case {CaseId}", request.CaseId);

        var draft = $"RE: Appeal Case {request.CaseId}\n" +
            $"Parcel: {request.ParcelId}\n\n" +
            $"Dear Board of Equalization Members,\n\n" +
            $"The County Assessor's Office has reviewed the appeal filed for parcel " +
            $"{request.ParcelId}. After thorough analysis using the USPAP three-approach " +
            $"methodology (sales comparison, income capitalization, and cost approach), " +
            $"we present the following findings:\n\n" +
            $"The assessed value of ${request.AssessedValue:N0} was determined through " +
            $"market analysis of comparable sales, income data where applicable, and " +
            $"replacement cost calculations adjusted for depreciation.\n\n" +
            $"Based on our review, the current assessed value accurately reflects the " +
            $"true and fair market value of this property as required by RCW 84.40.030.\n\n" +
            $"Respectfully submitted,\n" +
            $"County Assessor's Office";

        return await Task.FromResult(new DraftResult
        {
            ParcelId = request.ParcelId,
            Draft = draft,
            NoticeType = "appeal_response",
            Engine = "muse-template-v1",
        });
    }

    public async Task<DraftResult> GenerateMemoAsync(
        GenerateMemoRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: generating commissioner memo, topic: {Topic}", request.Topic);

        var county = await _db.Counties
            .AsNoTracking()
            .Where(c => c.Id == countyId)
            .Select(c => new { c.Name })
            .FirstOrDefaultAsync();

        var countyName = county?.Name ?? "the county";
        var date = DateTime.UtcNow.ToString("MMMM d, yyyy");

        var draft = $"MEMORANDUM\n\n" +
            $"TO: Board of County Commissioners\n" +
            $"FROM: County Assessor's Office\n" +
            $"DATE: {date}\n" +
            $"RE: {request.Topic}\n\n" +
            $"Commissioners,\n\n" +
            $"This memo addresses {request.Topic.ToLower()} for {countyName}. " +
            (request.Context != null ? $"{request.Context} " : "") +
            $"The assessor's office has conducted analysis per IAAO standards " +
            $"and Washington State statutory requirements.\n\n" +
            $"Key findings and recommendations are detailed below for your review " +
            $"and consideration.\n\n" +
            $"Please contact the assessor's office with any questions.\n\n" +
            $"Respectfully,\n" +
            $"County Assessor";

        return new DraftResult
        {
            ParcelId = null,
            Draft = draft,
            NoticeType = "commissioner_memo",
            Engine = "muse-template-v1",
        };
    }

    public async Task<SynthesisResult> SynthesizeEvidenceAsync(
        SynthesizeEvidenceRequest request, Guid countyId)
    {
        _logger.LogDebug("Muse: synthesizing evidence for parcel {ParcelId}", request.ParcelId);

        // Gather assessment data
        var assessments = await _db.PropertyAssessments
            .AsNoTracking()
            .Where(a => a.CountyId == countyId)
            .OrderByDescending(a => a.AssessmentYear)
            .Take(5)
            .Select(a => new { a.AssessmentYear, a.AssessedValue, a.MarketValue })
            .ToListAsync();

        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == request.ParcelId && p.CountyId == countyId)
            .FirstOrDefaultAsync();

        var sources = new List<string> { "property_record" };
        if (assessments.Count > 0) sources.Add("assessment_history");

        var synthesis = $"Evidence synthesis for parcel {request.ParcelId}";
        if (property != null)
        {
            synthesis += $" ({property.Address}, {property.PropertyType ?? "unclassified"}):\n\n";
            synthesis += $"Current assessed value: ${property.AssessedValue:N0} " +
                $"(land: ${property.LandValue:N0}, improvements: ${property.ImprovementValue:N0}).\n";
        }
        else
        {
            synthesis += ":\n\nNo property record found in the current county.\n";
        }

        if (assessments.Count > 0)
        {
            synthesis += $"\nAssessment history ({assessments.Count} years):\n";
            foreach (var a in assessments)
            {
                synthesis += $"  - {a.AssessmentYear}: Assessed ${a.AssessedValue:N0}, Market ${a.MarketValue:N0}\n";
            }
        }

        synthesis += "\nThis evidence summary is generated for internal review. " +
            "All values are subject to verification per USPAP and IAAO standards.";

        return new SynthesisResult
        {
            ParcelId = request.ParcelId,
            Synthesis = synthesis,
            Sources = sources.ToArray(),
            Confidence = 0.90,
            Engine = "muse-template-v1",
        };
    }

    // ── Private Helpers ──────────────────────────────────────────────

    private static string[] InferValueDrivers(decimal delta, double pctChange, string? propertyType)
    {
        var drivers = new List<string>();
        if (delta > 0) drivers.Add("market_appreciation");
        if (delta < 0) drivers.Add("market_decline");
        if (Math.Abs(pctChange) > 10) drivers.Add("significant_adjustment");
        if (propertyType?.Contains("Commercial", StringComparison.OrdinalIgnoreCase) == true)
            drivers.Add("commercial_market_factor");
        if (drivers.Count == 0) drivers.Add("stable_market");
        return drivers.ToArray();
    }

    private static string GenerateTaxpayerExplanation(
        string parcelId, decimal fromValue, decimal toValue, decimal delta,
        double pctChange, string[] drivers, int? fromYear, int? toYear)
    {
        var direction = delta >= 0 ? "increased" : "decreased";
        var yr = toYear.HasValue ? $" for tax year {toYear}" : "";
        return $"Your property ({parcelId}) has {direction} in assessed value{yr} " +
            $"from ${fromValue:N0} to ${toValue:N0}, a change of {pctChange:+0.0;-0.0}%. " +
            $"This change reflects current market conditions in your area" +
            (drivers.Contains("significant_adjustment")
                ? " and represents a significant adjustment based on comparable sales data"
                : "") +
            $". The assessment was performed per Washington State law (RCW 84.40.030) " +
            $"using approved appraisal methodology. If you have questions or wish to " +
            $"appeal, please contact the County Assessor's Office.";
    }

    private static string GenerateCommissionerExplanation(
        string parcelId, decimal fromValue, decimal toValue, decimal delta,
        double pctChange, string[] drivers, int? fromYear, int? toYear)
    {
        var period = fromYear.HasValue && toYear.HasValue
            ? $" from {fromYear} to {toYear}" : "";
        return $"Parcel {parcelId}: Value changed{period} from ${fromValue:N0} to " +
            $"${toValue:N0} ({pctChange:+0.0;-0.0}%). " +
            $"Primary drivers: {string.Join(", ", drivers.Select(d => d.Replace('_', ' ')))}. " +
            $"Assessment methodology: USPAP-compliant three-approach valuation with " +
            $"market-adjusted reconciliation per IAAO standards.";
    }

    private static string GenerateInternalExplanation(
        string parcelId, decimal fromValue, decimal toValue, decimal delta,
        double pctChange, string[] drivers, int? fromYear, int? toYear)
    {
        var period = fromYear.HasValue && toYear.HasValue
            ? $"{fromYear}→{toYear}" : "period";
        return $"[{parcelId}] Value: ${fromValue:N0} → ${toValue:N0} " +
            $"(Δ${delta:N0}, {pctChange:+0.0;-0.0}%). " +
            $"Drivers: [{string.Join(", ", drivers)}]. " +
            $"Period: {period}. Engine: muse-template-v1.";
    }
}

// ── Request/Response Models ───────────────────────────────────────

public class ExplainValueChangeRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public int? FromYear { get; set; }
    public int? ToYear { get; set; }
    public decimal? FromValue { get; set; }
    public decimal? ToValue { get; set; }
    public string? Audience { get; set; }
}

public class ExplainAssessmentRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string? Audience { get; set; }
}

public class DraftNoticeRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string? NoticeType { get; set; }
    public int? TaxYear { get; set; }
}

public class DraftAppealResponseRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string CaseId { get; set; } = string.Empty;
    public decimal AssessedValue { get; set; }
}

public class GenerateMemoRequest
{
    public string Topic { get; set; } = string.Empty;
    public string? Context { get; set; }
}

public class SynthesizeEvidenceRequest
{
    public string ParcelId { get; set; } = string.Empty;
}

public class ExplanationResult
{
    public string ParcelId { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string[] Drivers { get; set; } = Array.Empty<string>();
    public double Confidence { get; set; }
    public string Engine { get; set; } = "muse-template-v1";
    /// <summary>True when Claude API failed and response came from template fallback.</summary>
    public bool? Fallback { get; set; }
}

public class DraftResult
{
    public string? ParcelId { get; set; }
    public string Draft { get; set; } = string.Empty;
    public string NoticeType { get; set; } = string.Empty;
    public string Engine { get; set; } = "muse-template-v1";
    /// <summary>True when Claude API failed and response came from template fallback.</summary>
    public bool? Fallback { get; set; }
}

public class SynthesisResult
{
    public string ParcelId { get; set; } = string.Empty;
    public string Synthesis { get; set; } = string.Empty;
    public string[] Sources { get; set; } = Array.Empty<string>();
    public double Confidence { get; set; }
    public string Engine { get; set; } = "muse-template-v1";
    /// <summary>True when Claude API failed and response came from template fallback.</summary>
    public bool? Fallback { get; set; }
}

public class MuseCapabilities
{
    public string Engine { get; set; } = string.Empty;
    public bool AiPowered { get; set; }
    public string[] SupportedTypes { get; set; } = Array.Empty<string>();
    public string[] Audiences { get; set; } = Array.Empty<string>();
}

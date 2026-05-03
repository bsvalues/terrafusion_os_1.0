using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-020: Levy compliance audit and optimization guidance.
/// Provides audit summaries and statutory guidance grounded in the native
/// TerraLevy tables. Write-side optimization remains governed unavailable
/// until an evidence-backed request contract exists.
/// </summary>
[ApiController]
[Route("api/levy/audit")]
[Authorize]
public sealed class LevyAuditController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyAuditController> _logger;

    public LevyAuditController(
        LevyDbContext db,
        ILogger<LevyAuditController> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public sealed record AuditIssueDto(
        string DistrictCode,
        string DistrictName,
        decimal Rate,
        decimal StatutoryLimit,
        decimal UtilizationPct,
        string CertificationStatus,
        IReadOnlyList<string> Reasons);

    public sealed record AuditDashboardEnvelope(
        int TaxYear,
        string Source,
        DateTime GeneratedAt,
        int TotalLevyRows,
        int CompliantRows,
        int OverLimitRows,
        int CertifiedRows,
        int UncertifiedRows,
        int HighUtilizationRows,
        decimal AverageUtilizationPct,
        IReadOnlyList<AuditIssueDto> DistrictsNeedingAttention);

    public sealed record GuidanceEntry(
        string Topic,
        string Title,
        string RcwReference,
        string Summary,
        string OperatorAction,
        string EvidencePath);

    private static decimal ResolveStatutoryLimit(string? districtType)
    {
        var normalized = districtType?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalized switch
        {
            "county" or "county-regular" => 3.60m,
            "county-roads" or "road" or "road district" => 2.25m,
            "city" or "town" => 3.375m,
            "school" or "school district" or "state-school" => 5.90m,
            "fire" or "fire district" => 1.50m,
            "library" or "library district" => 0.50m,
            "hospital" or "hospital district" => 0.75m,
            "port" or "port-district" => 0.45m,
            "cemetery" or "cemetery-district" => 0.1125m,
            _ => 10.00m,
        };
    }

    private async Task<int> ResolveEffectiveTaxYearAsync(int? requestedYear, CancellationToken cancellationToken)
    {
        if (requestedYear.HasValue)
        {
            return requestedYear.Value;
        }

        var latestRateYear = await _db.LevyRates
            .AsNoTracking()
            .Select(rate => (int?)rate.EffectiveDate.Year)
            .MaxAsync(cancellationToken);

        var latestCertificationYear = await _db.LevyCertifications
            .AsNoTracking()
            .Select(certification => (int?)certification.TaxYear)
            .MaxAsync(cancellationToken);

        return new[] { latestRateYear, latestCertificationYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    /// <summary>
    /// Retrieve the levy audit dashboard with compliance status.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AuditDashboardEnvelope), StatusCodes.Status200OK)]
    public async Task<IActionResult> Dashboard(
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, cancellationToken);

        var rateRows = await _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
            .OrderByDescending(rate => rate.LevyAmount)
            .ToListAsync(cancellationToken);

        var certificationByDistrictCode = (await _db.LevyCertifications
                .AsNoTracking()
                .Where(certification => certification.TaxYear == effectiveYear)
                .ToListAsync(cancellationToken))
            .Where(certification => !string.IsNullOrWhiteSpace(certification.DistrictCode))
            .GroupBy(certification => certification.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(certification => certification.CreatedAt).First(),
                StringComparer.OrdinalIgnoreCase);

        var issues = new List<AuditIssueDto>();
        decimal utilizationTotal = 0m;
        var overLimitRows = 0;
        var certifiedRows = 0;
        var uncertifiedRows = 0;
        var highUtilizationRows = 0;

        foreach (var rate in rateRows)
        {
            var districtCode = rate.District?.DistrictCode ?? rate.DistrictId?.ToString() ?? "unassigned";
            var statutoryLimit = ResolveStatutoryLimit(rate.District?.DistrictType);
            var utilizationPct = statutoryLimit > 0m
                ? Math.Round(rate.Rate / statutoryLimit * 100m, 2)
                : 0m;
            utilizationTotal += utilizationPct;

            certificationByDistrictCode.TryGetValue(districtCode, out var certification);
            var certificationStatus = certification?.Status.ToString() ?? "Uncertified";
            var isCertified = certification?.Status == LevyCertificationStatus.Certified;
            var reasons = new List<string>();

            if (rate.Rate > statutoryLimit)
            {
                overLimitRows++;
                reasons.Add("Rate exceeds the district statutory limit.");
            }

            if (!isCertified)
            {
                uncertifiedRows++;
                reasons.Add("No certified levy record is on file for this district and tax year.");
            }
            else
            {
                certifiedRows++;
            }

            if (utilizationPct > 95m)
            {
                highUtilizationRows++;
                reasons.Add("Rate utilization is above 95% of the statutory ceiling.");
            }

            if (reasons.Count == 0)
            {
                continue;
            }

            issues.Add(new AuditIssueDto(
                DistrictCode: districtCode,
                DistrictName: rate.District?.Name ?? districtCode,
                Rate: rate.Rate,
                StatutoryLimit: statutoryLimit,
                UtilizationPct: utilizationPct,
                CertificationStatus: certificationStatus,
                Reasons: reasons));
        }

        _logger.LogInformation(
            "LEV-020: Levy audit dashboard requested for taxYear={TaxYear}, levyRows={LevyRows}, issues={IssueCount}",
            effectiveYear,
            rateRows.Count,
            issues.Count);

        return Ok(new AuditDashboardEnvelope(
            TaxYear: effectiveYear,
            Source: "LevyRates + LevyCertifications",
            GeneratedAt: DateTime.UtcNow,
            TotalLevyRows: rateRows.Count,
            CompliantRows: rateRows.Count - overLimitRows,
            OverLimitRows: overLimitRows,
            CertifiedRows: certifiedRows,
            UncertifiedRows: uncertifiedRows,
            HighUtilizationRows: highUtilizationRows,
            AverageUtilizationPct: rateRows.Count > 0 ? Math.Round(utilizationTotal / rateRows.Count, 2) : 0m,
            DistrictsNeedingAttention: issues.Take(20).ToList()));
    }

    /// <summary>
    /// Retrieve statutory guidance for levy compliance.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("guidance")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Guidance([FromQuery] string? topic)
    {
        var entries = new[]
        {
            new GuidanceEntry(
                Topic: "highest-lawful-levy",
                Title: "Highest Lawful Levy",
                RcwReference: "RCW 84.55.010",
                Summary: "Regular levy growth is limited to the prior year levy times the limit factor, plus new construction, annexation, and approved add-ons.",
                OperatorAction: "Verify prior-year levy, current assessed value, new construction, annexation, and banked capacity inputs before certifying the rate.",
                EvidencePath: "LevyCertifications.CalculationSnapshot + ReferenceSources"),
            new GuidanceEntry(
                Topic: "aggregate-limits",
                Title: "Aggregate Levy Limits",
                RcwReference: "RCW 84.52.043 and Article VII §2",
                Summary: "Junior and senior districts must remain within the statutory $5.90 and constitutional $10.00 regular levy caps.",
                OperatorAction: "Review district stack order, seniority, and proration before certifying overlapping districts.",
                EvidencePath: "LevyRates + Districts + statutory limit reference packet"),
            new GuidanceEntry(
                Topic: "certification",
                Title: "Levy Certification",
                RcwReference: "RCW 84.52.070",
                Summary: "County assessors certify final levy rates and transmit them to the county treasurer for extension.",
                OperatorAction: "Do not mark a district certified until the full attestation and rate evidence path is complete.",
                EvidencePath: "LevyCertifications.AttestationEnvelope + AttestationCorrelationId"),
            new GuidanceEntry(
                Topic: "refund-fund",
                Title: "Refund Fund Outside Cap",
                RcwReference: "RCW 84.69",
                Summary: "Refund fund levies are outside the regular aggregate caps and require separate supporting evidence.",
                OperatorAction: "Maintain treasurer refund documentation separately from the regular levy calculation packet.",
                EvidencePath: "ReferenceSources for refund-fund import packet"),
        };

        var filtered = string.IsNullOrWhiteSpace(topic)
            ? entries
            : entries.Where(entry => entry.Topic.Contains(topic.Trim(), StringComparison.OrdinalIgnoreCase)).ToArray();

        _logger.LogInformation("LEV-020: Levy compliance guidance requested for topic={Topic}", topic ?? "<all>");

        return Ok(new
        {
            count = filtered.Length,
            items = filtered,
        });
    }

    /// <summary>
    /// Submit a levy optimization analysis request.
    /// </summary>
    [HttpPost("optimization")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Optimization([FromBody] object request)
    {
        _logger.LogInformation("LEV-020: Levy optimization analysis requested but no governed write contract exists.");
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            success = false,
            error = "optimization_contract_unavailable",
            message = "Levy optimization write operations are not exposed until a governed request contract, evidence path, and containment flow are implemented.",
            useInstead = new[]
            {
                "GET /api/levy/audit/dashboard",
                "GET /api/levy/forecast/dashboard",
                "GET /api/levy/v1/data-quality/district-risk-summary",
            },
        });
    }
}

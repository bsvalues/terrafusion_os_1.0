using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Services;

// ─── Contract ────────────────────────────────────────────────────────────────

/// <summary>
/// Output for a single district's rules-engine risk classification.
/// </summary>
public sealed class DistrictRiskScore
{
    public Guid? DistrictId { get; init; }
    public string DistrictCode { get; init; } = string.Empty;
    public string DistrictName { get; init; } = string.Empty;

    /// <summary>"ok" | "warn" | "critical" — rules-engine output, NOT ML.</summary>
    public string OverallRisk { get; init; } = "ok";

    /// <summary>Human-readable reasons that triggered the risk level.</summary>
    public IReadOnlyList<string> RiskReasons { get; init; } = Array.Empty<string>();

    /// <summary>
    /// 0–1 confidence based on data completeness (number of non-null fields / total).
    /// Not a trained model score.
    /// </summary>
    public double Confidence { get; init; }

    public DateTime ComputedAt { get; init; } = DateTime.UtcNow;
    public string ComputedFrom { get; init; } = string.Empty;
}

/// <summary>
/// Envelope returned by GET /api/levy/v1/data-quality/district-risk-summary.
/// </summary>
public sealed class DistrictRiskSummaryResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public IReadOnlyList<DistrictRiskScore> Districts { get; init; } = Array.Empty<DistrictRiskScore>();
    public int TaxYear { get; init; }
    public DateTime GeneratedAt { get; init; } = DateTime.UtcNow;
    /// <summary>Explicit provenance note for UI display.</summary>
    public string ProvenanceNote { get; init; } = string.Empty;
}

public interface ILevyRiskScoringService
{
    Task<DistrictRiskSummaryResult> GetDistrictRiskSummaryAsync(int? taxYear, CancellationToken cancellationToken);
}

// ─── Implementation ───────────────────────────────────────────────────────────

/// <summary>
/// Rules-engine district risk classifier.
///
/// IMPORTANT: This is a deterministic rules engine, not a trained ML model.
/// Each rule corresponds to a documented statutory or operational threshold.
/// Rules:
///   - Rate utilization > 95 %  → critical
///   - YoY rate delta > 10 % without new-construction data → warn
///   - AV movement > 2 stddev from county average → warn
///   - Missing certification > 7 days after latest rate record → warn
///   - Data-quality completeness score &lt; 80 % (missing required fields) → critical
/// Confidence = proportion of LevyRate rows with all key fields populated.
/// </summary>
public sealed class LevyRiskScoringService : ILevyRiskScoringService
{
    private const string Source = "canonical-levy-risk-engine-rules-v1";

    private readonly LevyDbContext _db;
    private readonly ILogger<LevyRiskScoringService> _logger;

    // Statutory limits per RCW 84.52.043
    private const decimal RegularLevyLimitPerThousand = 10.00m;

    public LevyRiskScoringService(LevyDbContext db, ILogger<LevyRiskScoringService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<DistrictRiskSummaryResult> GetDistrictRiskSummaryAsync(
        int? taxYear,
        CancellationToken cancellationToken)
    {
        var year = taxYear ?? DateTime.UtcNow.Year;
        var priorYear = year - 1;

        // Pull current-year levy rates joined to district
        var currentRates = await _db.LevyRates
            .AsNoTracking()
            .Include(r => r.District)
            .Where(r => r.EffectiveDate.Year == year && r.ExpirationDate == null)
            .ToListAsync(cancellationToken);

        if (currentRates.Count == 0)
        {
            _logger.LogWarning("[LevyRiskScoring] No LevyRate rows for year={Year}; tables may be unseeded.", year);
            return new DistrictRiskSummaryResult
            {
                Success = false,
                Error = $"No levy rate data found for tax year {year}. Seed the native levy tables to enable risk scoring.",
                TaxYear = year,
                GeneratedAt = DateTime.UtcNow,
            };
        }

        // Pull prior-year rates for YoY delta
        var priorRates = await _db.LevyRates
            .AsNoTracking()
            .Where(r => r.EffectiveDate.Year == priorYear && r.ExpirationDate == null)
            .ToListAsync(cancellationToken);
        var priorByDistrict = priorRates
            .Where(r => r.DistrictId.HasValue)
            .GroupBy(r => r.DistrictId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        // Pull certifications for the year
        var certifications = await _db.LevyCertifications
            .AsNoTracking()
            .Where(c => c.TaxYear == year)
            .ToListAsync(cancellationToken);
        var certByDistrict = certifications
            .Where(c => c.DistrictCode != null)
            .GroupBy(c => c.DistrictCode!)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.CreatedAt).First());

        // County-level AV stats for outlier detection
        var avValues = currentRates
            .Where(r => r.AssessedValue > 0)
            .Select(r => (double)r.AssessedValue)
            .ToList();
        var (avMean, avStdDev) = ComputeMeanStdDev(avValues);

        // Confidence denominator: total key fields per rate row (Rate, AV, LevyAmount)
        int totalKeyFields = currentRates.Count * 3;
        int nonNullFields = currentRates.Count(r => r.Rate > 0) +
                            currentRates.Count(r => r.AssessedValue > 0) +
                            currentRates.Count(r => r.LevyAmount > 0);
        double overallConfidence = totalKeyFields > 0
            ? Math.Round((double)nonNullFields / totalKeyFields, 4)
            : 0.0;

        var scores = new List<DistrictRiskScore>();

        foreach (var rate in currentRates)
        {
            var reasons = new List<string>();
            var riskLevel = "ok";

            // ── Rule 1: Rate utilization > 95 % of statutory limit → critical ──
            // Using the $10/$1,000 aggregate as the ceiling proxy.
            var utilizationPct = RegularLevyLimitPerThousand > 0
                ? (double)rate.Rate / (double)RegularLevyLimitPerThousand * 100.0
                : 0.0;
            if (utilizationPct > 95.0)
            {
                riskLevel = "critical";
                reasons.Add($"Rate utilization {utilizationPct:F1}% — exceeds 95% of ${RegularLevyLimitPerThousand}/$1,000 statutory ceiling (RCW 84.52.043).");
            }

            // ── Rule 2: YoY rate delta > 10 % without new-construction data → warn ──
            if (rate.DistrictId.HasValue && priorByDistrict.TryGetValue(rate.DistrictId.Value, out var prior))
            {
                if (prior.Rate > 0)
                {
                    var delta = Math.Abs((double)(rate.Rate - prior.Rate) / (double)prior.Rate * 100.0);
                    if (delta > 10.0)
                    {
                        if (riskLevel == "ok") riskLevel = "warn";
                        reasons.Add($"Year-over-year rate change {delta:F1}% exceeds 10% threshold. New construction addendum not yet available to explain delta.");
                    }
                }
            }

            // ── Rule 3: AV movement > 2 stddev from county average → warn ──
            if (rate.AssessedValue > 0 && avStdDev > 0)
            {
                var avZ = Math.Abs(((double)rate.AssessedValue - avMean) / avStdDev);
                if (avZ > 2.0)
                {
                    if (riskLevel == "ok") riskLevel = "warn";
                    reasons.Add($"Assessed value ${rate.AssessedValue:N0} is {avZ:F1} standard deviations from county AV mean ${avMean:N0} — verify parcel data.");
                }
            }

            // ── Rule 4: Missing certification > 7 days after rate record → warn ──
            var distCode = rate.District?.DistrictCode ?? string.Empty;
            if (!string.IsNullOrEmpty(distCode))
            {
                bool certified = certByDistrict.TryGetValue(distCode, out var cert) &&
                                 cert.Status == TerraFusion.Levy.Models.LevyCertificationStatus.Certified;
                if (!certified)
                {
                    var daysSinceRate = (DateTime.UtcNow - rate.CreatedAt).TotalDays;
                    if (daysSinceRate > 7.0)
                    {
                        if (riskLevel == "ok") riskLevel = "warn";
                        reasons.Add($"No certified rate on record for district {distCode} — levy was calculated {daysSinceRate:F0} days ago without certification.");
                    }
                }
            }

            // ── Rule 5: Row-level completeness < 80 % → critical ──
            int rowFields = (rate.Rate > 0 ? 1 : 0) + (rate.AssessedValue > 0 ? 1 : 0) + (rate.LevyAmount > 0 ? 1 : 0);
            double rowCompleteness = rowFields / 3.0;
            if (rowCompleteness < 0.80)
            {
                riskLevel = "critical";
                reasons.Add($"Data completeness {rowCompleteness * 100:F0}% — one or more key fields (Rate, AV, LevyAmount) are zero/null.");
            }

            scores.Add(new DistrictRiskScore
            {
                DistrictId = rate.DistrictId,
                DistrictCode = distCode,
                DistrictName = rate.District?.Name ?? distCode,
                OverallRisk = riskLevel,
                RiskReasons = reasons,
                Confidence = overallConfidence,
                ComputedAt = DateTime.UtcNow,
                ComputedFrom = $"{Source}; {currentRates.Count} rate rows; {certifications.Count} certifications; year={year}",
            });
        }

        // Sort: critical → warn → ok; within tier by utilization descending
        var sorted = scores
            .OrderBy(s => s.OverallRisk switch { "critical" => 0, "warn" => 1, _ => 2 })
            .ThenByDescending(s => s.RiskReasons.Count)
            .ToList();

        return new DistrictRiskSummaryResult
        {
            Success = true,
            Districts = sorted,
            TaxYear = year,
            GeneratedAt = DateTime.UtcNow,
            ProvenanceNote = $"Computed from {currentRates.Count} levy rate rows and {certifications.Count} certification records for tax year {year} as of {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC. Rules engine only — not a trained model.",
        };
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static (double mean, double stdDev) ComputeMeanStdDev(IReadOnlyList<double> values)
    {
        if (values.Count == 0) return (0, 0);
        var mean = values.Average();
        var variance = values.Sum(v => (v - mean) * (v - mean)) / values.Count;
        return (mean, Math.Sqrt(variance));
    }
}

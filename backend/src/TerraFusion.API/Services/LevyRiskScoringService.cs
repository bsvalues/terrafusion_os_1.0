using TerraFusion.Core.Entities;

namespace TerraFusion.API.Services;

/// <summary>
/// P6.1 — Prometheus Rules Engine (NOT ML).
///
/// Converts raw district risk records into prioritized, plain-English
/// recommendations for the Daily Digest surface. All logic is
/// deterministic rule-based evaluation — no statistical model involved.
///
/// Honesty note: The word "AI" is not used in outputs from this service.
/// Outputs are labeled "Prometheus Digest" or "risk digest".
/// </summary>
public static class LevyRiskScoringService
{
    /// <summary>
    /// Generate digest recommendations from a list of scored districts.
    /// Returns top <paramref name="topN"/> items, sorted by severity.
    /// </summary>
    public static IReadOnlyList<DigestRecommendation> GenerateRecommendations(
        IEnumerable<LevyCertification> districts,
        int taxYear,
        int topN = 5)
    {
        var recommendations = new List<DigestRecommendation>();

        foreach (var d in districts)
        {
            var constitutionalLimit = d.ConstitutionalLimit > 0 ? d.ConstitutionalLimit : 10.0;
            var utilizationPct = constitutionalLimit > 0
                ? d.LevyRate / constitutionalLimit * 100.0
                : 0.0;

            var isCertified = string.Equals(d.Status, "certified", StringComparison.OrdinalIgnoreCase);
            var severity = ComputeSeverity(utilizationPct, isCertified);

            if (severity == DigestSeverity.Ok) continue;

            recommendations.Add(new DigestRecommendation
            {
                DistrictCode = d.DistrictCode,
                DistrictName = d.DistrictName,
                TaxYear = taxYear,
                Severity = severity,
                SeverityLabel = severity == DigestSeverity.Critical ? "critical" : "warn",
                UtilizationPct = Math.Round(utilizationPct, 2),
                LevyRate = d.LevyRate,
                ConstitutionalLimit = constitutionalLimit,
                CertificationStatus = d.Status,
                Headline = BuildHeadline(d, utilizationPct, isCertified),
                ActionItems = BuildActionItems(d, utilizationPct, isCertified),
            });
        }

        return recommendations
            .OrderBy(r => r.Severity)  // DigestSeverity: Critical=0 < Warn=1 (enum order)
            .ThenByDescending(r => r.UtilizationPct)
            .Take(topN)
            .ToList()
            .AsReadOnly();
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private static DigestSeverity ComputeSeverity(double utilizationPct, bool isCertified)
    {
        if (utilizationPct > 95 || !isCertified) return DigestSeverity.Critical;
        if (utilizationPct > 85) return DigestSeverity.Warn;
        return DigestSeverity.Ok;
    }

    private static string BuildHeadline(LevyCertification d, double utilizationPct, bool isCertified)
    {
        if (!isCertified)
            return $"{d.DistrictName}: Certification required — current status is '{d.Status}'.";
        if (utilizationPct > 95)
            return $"{d.DistrictName}: Levy rate at {utilizationPct:F1}% of constitutional limit — review required.";
        return $"{d.DistrictName}: Levy rate at {utilizationPct:F1}% of constitutional limit — monitor.";
    }

    private static List<string> BuildActionItems(LevyCertification d, double utilizationPct, bool isCertified)
    {
        var items = new List<string>();

        if (!isCertified)
        {
            items.Add("Open Certification tab and set status to 'pending_review'.");
            items.Add("Verify levy amount matches the certified rate calculation.");
        }

        if (utilizationPct > 95)
        {
            items.Add($"Rate ${d.LevyRate:F4} exceeds 95% of ${d.ConstitutionalLimit:F2} constitutional limit — check for reduction requirement.");
            items.Add("Run Rate Calculator in scenario (dry-run) mode to model a compliant rate.");
        }
        else if (utilizationPct > 85)
        {
            items.Add($"Rate utilization at {utilizationPct:F1}% — approaching constitutional ceiling.");
            items.Add("Run Highest Lawful Levy calculator to verify limit factor.");
        }

        if (d.WasReduced)
            items.Add("Note: levy was already reduced this cycle (WasReduced=true). Verify reduction is reflected in cert.");

        return items;
    }
}

// ── Output types ─────────────────────────────────────────────────────────────

public enum DigestSeverity
{
    Critical = 0,
    Warn = 1,
    Ok = 2,
}

public class DigestRecommendation
{
    public string DistrictCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public int TaxYear { get; set; }
    public DigestSeverity Severity { get; set; }
    public string SeverityLabel { get; set; } = string.Empty;
    public double UtilizationPct { get; set; }
    public double LevyRate { get; set; }
    public double ConstitutionalLimit { get; set; }
    public string CertificationStatus { get; set; } = string.Empty;
    public string Headline { get; set; } = string.Empty;
    public List<string> ActionItems { get; set; } = new();
}

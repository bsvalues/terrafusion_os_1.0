namespace TerraFusion.Core.Services.TerraForge;

/// <summary>
/// Subject characteristics for comparable diagnosis. <see cref="Found"/> is false
/// when no county-scoped CamaCharacteristics row exists for the subject parcel,
/// in which case subject-relative rules are skipped (never fabricated).
/// </summary>
public sealed record DiagnosisSubject(
    string ParcelId,
    bool Found,
    decimal? GrossLivingArea,
    decimal? LotSizeSqft,
    string? NeighborhoodCode,
    string? QualityGrade,
    string? ConditionGrade);

/// <summary>
/// A comp-set candidate plus its county-scoped ComparableSales enrichment.
/// <see cref="Enriched"/> is false when no sale row was found for the parcel.
/// </summary>
public sealed record DiagnosisCandidate(
    Guid CompSetCandidateId,
    string ParcelId,
    decimal SalePrice,
    DateTime SaleDate,
    decimal? PricePerSqft,
    string Qualification,
    int Rank,
    bool Enriched,
    decimal? GrossLivingArea,
    decimal? LotSizeSqft,
    string? NeighborhoodCode,
    string? QualityGrade,
    string? Condition);

/// <summary>Per-candidate deterministic diagnosis result.</summary>
public sealed record CandidateDiagnosis(
    Guid CompSetCandidateId,
    string ParcelId,
    int Rank,
    string QualificationStatus,
    bool ReviewRequired,
    IReadOnlyList<string> Flags,
    string SupportSummary);

/// <summary>
/// Deterministic, rule-based comparable diagnosis. Pure: no DB, no clock
/// (caller passes <paramref name="asOf"/>), no randomness. This is a draft
/// review aid — it does NOT score confidence, pick a "best comp", adjust,
/// reconcile, certify, or imply appeal-readiness.
/// </summary>
public static class CompSetDiagnosisEngine
{
    public const string Version = "rules_v1";

    private const int StaleMonths = 60;
    private const decimal GlaMismatchPct = 0.25m;
    private const decimal LotMismatchPct = 0.50m;
    private const decimal PriceOutlierPct = 0.40m;
    private const int QualityConditionGap = 2;

    private static readonly HashSet<string> UnqualifiedTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "", "unverified", "unknown", "review_required", "rejected", "unqualified", "invalid", "excluded",
    };

    public static IReadOnlyList<CandidateDiagnosis> Diagnose(
        DiagnosisSubject subject,
        IReadOnlyList<DiagnosisCandidate> candidates,
        DateTime asOf)
    {
        ArgumentNullException.ThrowIfNull(subject);
        ArgumentNullException.ThrowIfNull(candidates);

        var usablePpsf = candidates
            .Select(c => c.PricePerSqft)
            .Where(v => v is > 0)
            .Select(v => v!.Value)
            .OrderBy(v => v)
            .ToList();
        decimal? medianPpsf = usablePpsf.Count >= 3 ? Median(usablePpsf) : null;

        var staleBefore = asOf.AddMonths(-StaleMonths);
        var results = new List<CandidateDiagnosis>(candidates.Count);

        foreach (var c in candidates)
        {
            var flags = new List<string>();

            var missingCandidate = !c.Enriched || c.GrossLivingArea is null or <= 0 || c.SalePrice <= 0;
            if (missingCandidate) flags.Add("missing_candidate_data");

            if (UnqualifiedTokens.Contains((c.Qualification ?? string.Empty).Trim()))
                flags.Add("sale_validity_unknown");

            if (c.SaleDate < staleBefore)
                flags.Add("stale_sale");

            if (medianPpsf is > 0 && c.PricePerSqft is > 0)
            {
                var dev = Math.Abs(c.PricePerSqft!.Value - medianPpsf.Value) / medianPpsf.Value;
                if (dev > PriceOutlierPct) flags.Add("high_price_per_sqft_outlier");
            }

            if (!subject.Found)
            {
                flags.Add("missing_subject_data");
            }
            else
            {
                if (HasText(subject.NeighborhoodCode) && HasText(c.NeighborhoodCode)
                    && !NormEq(subject.NeighborhoodCode, c.NeighborhoodCode))
                    flags.Add("different_market_area");

                if (subject.GrossLivingArea is > 0 && c.GrossLivingArea is > 0
                    && PctDiff(c.GrossLivingArea!.Value, subject.GrossLivingArea!.Value) > GlaMismatchPct)
                    flags.Add("gla_mismatch");

                if (subject.LotSizeSqft is > 0 && c.LotSizeSqft is > 0
                    && PctDiff(c.LotSizeSqft!.Value, subject.LotSizeSqft!.Value) > LotMismatchPct)
                    flags.Add("site_size_mismatch");

                if (OrdinalGap(QualityRank(subject.QualityGrade), QualityRank(c.QualityGrade)) >= QualityConditionGap)
                    flags.Add("quality_mismatch");

                if (OrdinalGap(ConditionRank(subject.ConditionGrade), ConditionRank(c.Condition)) >= QualityConditionGap)
                    flags.Add("condition_mismatch");
            }

            var significant = flags
                .Where(f => f is not "missing_candidate_data" and not "missing_subject_data")
                .ToList();

            string status = missingCandidate
                ? "needs_review"
                : significant.Count switch
                {
                    0 => "strong",
                    1 or 2 => "usable",
                    _ => "weak",
                };

            var needsAttention = missingCandidate || !subject.Found || significant.Count > 0;
            if (needsAttention) flags.Add("requires_reviewer_attention");

            results.Add(new CandidateDiagnosis(
                c.CompSetCandidateId,
                c.ParcelId,
                c.Rank,
                status,
                needsAttention,
                flags,
                BuildSummary(status, flags, subject.Found, missingCandidate)));
        }

        return results;
    }

    private static string BuildSummary(string status, IReadOnlyList<string> flags, bool subjectFound, bool missingCandidate)
    {
        if (missingCandidate)
            return "Candidate sale data is incomplete; verify the sale record before relying on this comparable.";

        var parts = new List<string>();
        if (flags.Contains("sale_validity_unknown")) parts.Add("sale validity is unverified");
        if (flags.Contains("stale_sale")) parts.Add("sale is older than five years");
        if (flags.Contains("different_market_area")) parts.Add("candidate is in a different market area than the subject");
        if (flags.Contains("gla_mismatch")) parts.Add("living area differs materially from the subject");
        if (flags.Contains("site_size_mismatch")) parts.Add("site size differs materially from the subject");
        if (flags.Contains("quality_mismatch")) parts.Add("quality grade differs from the subject");
        if (flags.Contains("condition_mismatch")) parts.Add("condition differs from the subject");
        if (flags.Contains("high_price_per_sqft_outlier")) parts.Add("price per square foot is an outlier within the set");

        if (!subjectFound)
        {
            var prefix = parts.Count == 0
                ? "No automated candidate-level flags. "
                : "Candidate-level concerns: " + string.Join("; ", parts) + ". ";
            return prefix + "Subject characteristics are unavailable, so comparability to the subject was not assessed; reviewer judgment required.";
        }

        if (parts.Count == 0)
            return "No automated review flags. Confirm before relying on this comparable as primary support.";

        var lead = status switch
        {
            "weak" => "Weak comparable. ",
            "usable" => "Usable with review. ",
            _ => string.Empty,
        };
        return lead + char.ToUpperInvariant(parts[0][0]) + parts[0][1..]
            + (parts.Count > 1 ? "; " + string.Join("; ", parts.Skip(1)) : string.Empty) + ".";
    }

    private static decimal PctDiff(decimal a, decimal b) => Math.Abs(a - b) / b;

    private static bool HasText(string? s) => !string.IsNullOrWhiteSpace(s);

    private static bool NormEq(string? a, string? b) =>
        string.Equals((a ?? string.Empty).Trim(), (b ?? string.Empty).Trim(), StringComparison.OrdinalIgnoreCase);

    private static decimal Median(IReadOnlyList<decimal> sorted)
    {
        var n = sorted.Count;
        var mid = n / 2;
        return n % 2 == 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2m;
    }

    // Ordinal gap between two grades; 0 when either side is unknown (so unknowns never flag).
    private static int OrdinalGap(int a, int b) => a == 0 || b == 0 ? 0 : Math.Abs(a - b);

    // Maps the two distinct quality vocabularies (ComparableSale + CamaCharacteristic) to a 1-5 scale.
    private static int QualityRank(string? grade) => (grade ?? string.Empty).Trim().ToUpperInvariant() switch
    {
        "ECONOMY" => 1,
        "FAIR" => 2,
        "AVERAGE" or "STANDARD" => 3,
        "GOOD" => 4,
        "VERY_GOOD" or "VERYGOOD" => 4,
        "EXCELLENT" or "LUXURY" => 5,
        _ => 0,
    };

    private static int ConditionRank(string? grade) => (grade ?? string.Empty).Trim().ToUpperInvariant() switch
    {
        "POOR" => 1,
        "FAIR" => 2,
        "AVERAGE" => 3,
        "GOOD" => 4,
        "EXCELLENT" => 5,
        _ => 0,
    };
}

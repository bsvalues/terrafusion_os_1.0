// backend/TerraFusion.API.Tests/CountyStudioAiServiceTests.cs
//
// Task E — CountyStudioAiService unit tests.
//
// The service's core is BuildDiagnosis(CountySegmentDetailDto) — a pure
// function of a detail DTO. We test every finding detector with a hand-
// computed fixture, the classification argmax, the action rule table,
// narrative determinism (byte-for-byte identical on re-run), and the
// county-level pattern detectors. Controller-level integration tests
// live in CountyStudioAiControllerTests.
//
// All 15+ tests are pure CPU — no DB, no async.

using System.Collections.Generic;
using System.Linq;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests;

public sealed class CountyStudioAiServiceTests
{
    // ── Fixture helpers ────────────────────────────────────────────────────

    /// <summary>
    /// Build a CountySegmentDetailDto directly so tests don't need a DB. This
    /// mirrors the shape CountyStudyInspectorService produces.
    /// </summary>
    /// <summary>
    /// Default outlier hint parcel IDs used when none are explicitly supplied.
    /// Mirrors what CountyStudyInspectorService would compute from 3 extreme-ratio sales.
    /// </summary>
    private static readonly List<string> DefaultOutlierHints =
        new() { "P-0001", "P-0002", "P-0003" };

    private static CountySegmentDetailDto BuildDetail(
        string name = "NBHD-K1/R1/STANDARD",
        string? city = "Kennewick",
        string? nbhd = "NBHD-K1",
        int parcelCount = 128,
        int ratioCount = 42,
        decimal? median = 0.97m,
        decimal? cod = 14.2m,
        decimal? prd = 1.01m,
        decimal? prb = 0.02m,
        decimal? vei = 88m,
        int exceptionCount = 8,
        List<SegmentYearPoint>? history = null,
        string classification = "Fair",
        List<string>? outlierParcelIds = null)
    {
        return new CountySegmentDetailDto(
            SegmentId:            Guid.NewGuid(),
            SegmentSetId:         Guid.NewGuid(),
            StudyId:              Guid.NewGuid(),
            CountyId:             Guid.NewGuid(),
            TaxYear:              2026,
            Name:                 name,
            SegmentType:          "Residential",
            City:                 city,
            NeighborhoodCode:     nbhd,
            ParcelCount:          parcelCount,
            MedianRatio:          median,
            Cod:                  cod,
            Prd:                  prd,
            StabilityScore:       75m,
            RiskScore:            25m,
            ExceptionCount:       exceptionCount,
            Prb:                  prb,
            Vei:                  vei,
            EquityClassification: classification,
            EquityScore:          80m,
            RatioCount:           ratioCount,
            YearHistory:          history ?? new List<SegmentYearPoint>(),
            ComplianceStatus:     "IaaoCompliant",
            Warnings:             new List<string>(),
            DerivedAt:            new DateTime(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc),
            OutlierParcelIds:     outlierParcelIds ?? DefaultOutlierHints);
    }

    // ── Finding detectors — each detector has an isolated test ─────────────

    [Fact]
    public void DetectZeroSales_FiresWhenRatioCountIsZero()
    {
        var d = BuildDetail(ratioCount: 0, median: null, cod: null, prd: null, prb: null, vei: null);
        var f = CountyStudioAiService.DetectZeroSales(d);
        Assert.NotNull(f);
        Assert.Equal("ZERO_SALES", f!.Code);
        Assert.Equal("Data", f.Category);
        Assert.Contains("No qualified sales", f.Summary);
        Assert.Equal(0, f.Evidence["ratioCount"]);
    }

    [Fact]
    public void DetectLowRatioCount_FiresWhenRatiosBelow15()
    {
        var d = BuildDetail(ratioCount: 7);
        var f = CountyStudioAiService.DetectLowRatioCount(d);
        Assert.NotNull(f);
        Assert.Equal("LOW_SAMPLE_RATIO_COUNT", f!.Code);
        Assert.Equal("Data", f.Category);
        Assert.Contains("Only 7 qualified sales", f.Summary);
    }

    [Fact]
    public void DetectLowRatioCount_DoesNotFireWhenHealthy()
    {
        var d = BuildDetail(ratioCount: 42);
        var f = CountyStudioAiService.DetectLowRatioCount(d);
        Assert.Null(f);
    }

    [Fact]
    public void DetectIaaoCodCeilingBreach_FiresWhenCodAboveCeilingButNotExtreme()
    {
        var d = BuildDetail(cod: 27.4m);
        var f = CountyStudioAiService.DetectIaaoCodCeilingBreach(d);
        Assert.NotNull(f);
        Assert.Equal("IAAO_COD_CEILING_BREACH", f!.Code);
        Assert.Equal("Model", f.Category);
        Assert.Contains("COD 27.4", f.Summary);
    }

    [Fact]
    public void DetectIaaoCodExtreme_FiresWhenCodAbove30()
    {
        var d = BuildDetail(cod: 35m);
        var f = CountyStudioAiService.DetectIaaoCodExtreme(d);
        Assert.NotNull(f);
        Assert.Equal("IAAO_COD_EXTREME", f!.Code);
        Assert.True(f.EvidenceStrength >= 0.9m);
    }

    [Fact]
    public void DetectMedianLowUnfair_FiresWhenMedianBelowFairLow()
    {
        var d = BuildDetail(median: 0.83m);
        var f = CountyStudioAiService.DetectMedianLowUnfair(d);
        Assert.NotNull(f);
        Assert.Equal("MEDIAN_LOW_UNFAIR", f!.Code);
        Assert.Contains("0.83", f.Summary);
    }

    [Fact]
    public void DetectMedianHighUnfair_FiresWhenMedianAboveFairHigh()
    {
        var d = BuildDetail(median: 1.14m);
        var f = CountyStudioAiService.DetectMedianHighUnfair(d);
        Assert.NotNull(f);
        Assert.Equal("MEDIAN_HIGH_UNFAIR", f!.Code);
    }

    [Fact]
    public void DetectPrdRegressive_FiresAbovePrdFairHigh()
    {
        var d = BuildDetail(prd: 1.09m);
        var f = CountyStudioAiService.DetectPrdRegressive(d);
        Assert.NotNull(f);
        Assert.Equal("PRD_VERTICAL_INEQUITY_REGRESSIVE", f!.Code);
        Assert.Contains("1.090", f.Summary);
    }

    [Fact]
    public void DetectPrbRegressive_FiresBelowNegativePrbFairAbs()
    {
        var d = BuildDetail(prb: -0.08m);
        var f = CountyStudioAiService.DetectPrbRegressive(d);
        Assert.NotNull(f);
        Assert.Equal("PRB_REGRESSIVE", f!.Code);
    }

    [Fact]
    public void DetectHighExceptionRate_FiresAbove10Percent()
    {
        var d = BuildDetail(parcelCount: 100, exceptionCount: 15);
        var f = CountyStudioAiService.DetectHighExceptionRate(d);
        Assert.NotNull(f);
        Assert.Equal("HIGH_EXCEPTION_RATE", f!.Code);
        Assert.Equal("Workflow", f.Category);
        Assert.Contains("15 of 100 parcels", f.Summary);
    }

    [Fact]
    public void DetectYoyDriftSignificant_FiresOnThreePointLinearDrift()
    {
        // Median drifts +5% per year: 2024→0.90, 2025→0.95, 2026→1.00. Slope ≈ 0.05 > 0.03.
        var history = new List<SegmentYearPoint>
        {
            new(2024, 100, 0.90m, 12m, 1.00m, 0.02m, 5, false),
            new(2025, 100, 0.95m, 12m, 1.00m, 0.02m, 5, false),
            new(2026, 100, 1.00m, 12m, 1.00m, 0.02m, 5, true),
        };
        var d = BuildDetail(history: history);
        var f = CountyStudioAiService.DetectYoyDriftSignificant(d);
        Assert.NotNull(f);
        Assert.Equal("YOY_DRIFT_SIGNIFICANT", f!.Code);
        Assert.Equal("Market", f.Category);
    }

    [Fact]
    public void DetectHealthySegment_FiresOnlyWhenNoPriorFindings()
    {
        var d = BuildDetail();
        var prior = new List<SegmentDiagnosisFinding>();
        var f = CountyStudioAiService.DetectHealthySegment(d, prior);
        Assert.NotNull(f);
        Assert.Equal("HEALTHY_SEGMENT", f!.Code);

        // With a prior problem finding, Healthy should NOT fire.
        prior.Add(new SegmentDiagnosisFinding("X", "Model", "x", 0.5m, new(), new()));
        var f2 = CountyStudioAiService.DetectHealthySegment(d, prior);
        Assert.Null(f2);
    }

    // ── Classification argmax ──────────────────────────────────────────────

    [Fact]
    public void Classify_DataDominantSegment_BucketsToData()
    {
        var findings = new List<SegmentDiagnosisFinding>
        {
            new("ZERO_SALES", "Data", "no sales", 1.0m, new(), new()),
        };
        var (cls, conf) = CountyStudioAiService.Classify(findings);
        Assert.Equal(ProblemClass.Data, cls);
        Assert.True(conf > 0.5m);
    }

    [Fact]
    public void Classify_ModelHeavyWithMarketTouch_PicksModel()
    {
        var findings = new List<SegmentDiagnosisFinding>
        {
            new("IAAO_COD_EXTREME",                   "Model",  "cod",    0.95m, new(), new()),
            new("MEDIAN_HIGH_UNFAIR",                 "Model",  "median", 0.70m, new(), new()),
            new("PRD_VERTICAL_INEQUITY_REGRESSIVE",   "Model",  "prd",    0.65m, new(), new()),
            new("YOY_DRIFT_SIGNIFICANT",              "Market", "drift",  0.50m, new(), new()),
        };
        var (cls, _) = CountyStudioAiService.Classify(findings);
        Assert.Equal(ProblemClass.Model, cls);
    }

    [Fact]
    public void Classify_EmptyFindings_DefaultsToHealthyHalfConfidence()
    {
        var (cls, conf) = CountyStudioAiService.Classify(new List<SegmentDiagnosisFinding>());
        Assert.Equal(ProblemClass.Healthy, cls);
        Assert.Equal(0.5m, conf);
    }

    // ── Action rule table ──────────────────────────────────────────────────

    [Fact]
    public void RecommendActions_ZeroSales_RecommendsReconcileSalesAsPriority1()
    {
        var d = BuildDetail(ratioCount: 0, median: null, cod: null);
        var findings = CountyStudioAiService.RunFindingDetectors(d);
        var actions = CountyStudioAiService.RecommendActions(findings, d);
        var reconcile = actions.FirstOrDefault(a => a.ActionCode == "RECONCILE_SALES");
        Assert.NotNull(reconcile);
        Assert.Equal("SalesForge", reconcile!.Target);
        Assert.Equal(1, reconcile.Priority);
    }

    [Fact]
    public void RecommendActions_CodBreach_RecommendsRecalibrateCostTableAsPriority2()
    {
        var d = BuildDetail(cod: 27.4m);
        var findings = CountyStudioAiService.RunFindingDetectors(d);
        var actions = CountyStudioAiService.RecommendActions(findings, d);
        var recalibrate = actions.FirstOrDefault(a => a.ActionCode == "RECALIBRATE_COST_TABLE");
        Assert.NotNull(recalibrate);
        Assert.Equal("CostForge", recalibrate!.Target);
    }

    [Fact]
    public void RecommendActions_HealthySegment_ReturnsOnlyMarkHealthy()
    {
        var d = BuildDetail();
        var findings = CountyStudioAiService.RunFindingDetectors(d);
        var actions = CountyStudioAiService.RecommendActions(findings, d);
        Assert.Single(actions);
        Assert.Equal("MARK_HEALTHY", actions[0].ActionCode);
        Assert.Equal("None", actions[0].Target);
    }

    [Fact]
    public void RecommendActions_MedianAndPrdBoth_EmitsTwoActionsNoDuplicate()
    {
        var d = BuildDetail(median: 0.83m, prd: 1.09m);
        var findings = CountyStudioAiService.RunFindingDetectors(d);
        var actions = CountyStudioAiService.RecommendActions(findings, d);
        // RECALIBRATE_COST_TABLE appears once despite being mapped by both findings.
        Assert.Equal(1, actions.Count(a => a.ActionCode == "RECALIBRATE_COST_TABLE"));
        // REVIEW_COMPS also present.
        Assert.Contains(actions, a => a.ActionCode == "REVIEW_COMPS");
    }

    // ── Narrative determinism + real-number citations ──────────────────────

    [Fact]
    public void BuildDiagnosis_ProducesByteIdenticalNarrativeOnRerun()
    {
        var d = BuildDetail(median: 0.83m, cod: 27.4m, prd: 1.09m);
        var a = CountyStudioAiService.BuildDiagnosis(d);
        var b = CountyStudioAiService.BuildDiagnosis(d);
        Assert.Equal(a.Narrative, b.Narrative);
        Assert.Equal(a.InputFingerprint, b.InputFingerprint);
        Assert.Equal(a.PrimaryClass, b.PrimaryClass);
        Assert.Equal(a.PrimaryConfidence, b.PrimaryConfidence);
        Assert.Equal(a.Findings.Count, b.Findings.Count);
    }

    [Fact]
    public void BuildDiagnosis_NarrativeCitesRealNumbersFromFindings()
    {
        var d = BuildDetail(median: 0.83m, cod: 27.4m, prd: 1.09m);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        // Every sentence after the classification header is a finding Summary
        // verbatim — real numbers come for free.
        Assert.Contains("27.4", dx.Narrative);  // COD
        // Narrative is 2-4 sentences.
        var sentences = dx.Narrative.Split(". ", System.StringSplitOptions.RemoveEmptyEntries);
        Assert.InRange(sentences.Length, 2, 4);
    }

    [Fact]
    public void BuildDiagnosis_HealthySegment_NarrativeCitesRealMedianAndCod()
    {
        var d = BuildDetail(median: 0.97m, cod: 14.2m, ratioCount: 42);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        Assert.Equal(ProblemClass.Healthy, dx.PrimaryClass);
        Assert.Contains("0.97", dx.Narrative);
        Assert.Contains("14.2", dx.Narrative);
    }

    [Fact]
    public void FingerprintDetail_DifferentInputs_DifferentHashes()
    {
        var a = BuildDetail(cod: 27.4m);
        var b = BuildDetail(cod: 14.2m);
        var ha = CountyStudioAiService.FingerprintDetail(a);
        var hb = CountyStudioAiService.FingerprintDetail(b);
        Assert.NotEqual(ha, hb);
    }

    // ── County-level patterns ──────────────────────────────────────────────

    [Fact]
    public void DetectCountyPatterns_CityWideRegressivity_FiresAt50Percent()
    {
        // 2 Kennewick segments: both regressive. 2 Richland segments: 0 regressive.
        var kenn1 = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(city: "Kennewick", nbhd: "NBHD-K1", prd: 1.09m, name: "NBHD-K1/R1/STANDARD"));
        var kenn2 = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(city: "Kennewick", nbhd: "NBHD-K2", prd: 1.08m, name: "NBHD-K2/R1/STANDARD"));
        var rich1 = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(city: "Richland", nbhd: "NBHD-R1", prd: 1.01m, name: "NBHD-R1/R1/STANDARD"));
        var rich2 = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(city: "Richland", nbhd: "NBHD-R2", prd: 1.00m, name: "NBHD-R2/R1/STANDARD"));
        var patterns = CountyStudioAiService.DetectCountyPatterns(new[] { kenn1, kenn2, rich1, rich2 });
        var cw = patterns.FirstOrDefault(p => p.PatternCode == "CITY_WIDE_REGRESSIVITY");
        Assert.NotNull(cw);
        Assert.Equal(2, cw!.AffectedSegmentCount);
        Assert.Contains("Kennewick", cw.Summary);
        Assert.True(cw.Severity >= 0.5m);
    }

    [Fact]
    public void DetectCountyPatterns_NeighborhoodSampleScarcity_FiresWhen3PlusLowSamples()
    {
        var a = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(nbhd: "NBHD-Q1", ratioCount: 5, name: "NBHD-Q1/R1/A"));
        var b = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(nbhd: "NBHD-Q1", ratioCount: 3, name: "NBHD-Q1/R1/B"));
        var c = CountyStudioAiService.BuildDiagnosis(
            BuildDetail(nbhd: "NBHD-Q1", ratioCount: 7, name: "NBHD-Q1/R1/C"));
        var patterns = CountyStudioAiService.DetectCountyPatterns(new[] { a, b, c });
        Assert.Contains(patterns, p => p.PatternCode == "NEIGHBORHOOD_SAMPLE_SCARCITY");
    }

    [Fact]
    public void BuildDiagnosis_ZeroSalesAndLowSample_ClassifiesData()
    {
        var d = BuildDetail(
            ratioCount: 0, median: null, cod: null, prd: null, prb: null, vei: null,
            name: "NBHD-K3/R1/STANDARD");
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        Assert.Equal(ProblemClass.Data, dx.PrimaryClass);
        Assert.Contains(dx.Findings, f => f.Code == "ZERO_SALES");
        Assert.Contains("No qualified sales", dx.Narrative);
    }

    [Fact]
    public void BuildDiagnosis_CodPlusPrdBreach_ClassifiesModelWithCodeCited()
    {
        var d = BuildDetail(cod: 27.4m, prd: 1.09m);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        Assert.Equal(ProblemClass.Model, dx.PrimaryClass);
        // Findings ordered by EvidenceStrength desc — COD_CEILING (0.75) comes before PRD_REGRESSIVE (0.65).
        Assert.Equal("IAAO_COD_CEILING_BREACH", dx.Findings[0].Code);
        Assert.Contains("27.4", dx.Narrative);
    }

    // ── ParcelIdHints population ───────────────────────────────────────────

    [Fact]
    public void DetectIaaoCodExtreme_PropagatesOutlierHints()
    {
        var hints = new List<string> { "P-9001", "P-9002" };
        var d = BuildDetail(cod: 35.0m, outlierParcelIds: hints);
        var f = CountyStudioAiService.DetectIaaoCodExtreme(d);
        Assert.NotNull(f);
        Assert.Equal(hints, f!.ParcelIdHints);
    }

    [Fact]
    public void DetectIaaoCodCeilingBreach_PropagatesOutlierHints()
    {
        var hints = new List<string> { "P-8001" };
        var d = BuildDetail(cod: 22.0m, outlierParcelIds: hints);
        var f = CountyStudioAiService.DetectIaaoCodCeilingBreach(d);
        Assert.NotNull(f);
        Assert.Equal(hints, f!.ParcelIdHints);
    }

    [Fact]
    public void DetectMedianLowUnfair_PropagatesOutlierHints()
    {
        var hints = new List<string> { "P-7001", "P-7002", "P-7003" };
        var d = BuildDetail(median: 0.85m, outlierParcelIds: hints);
        var f = CountyStudioAiService.DetectMedianLowUnfair(d);
        Assert.NotNull(f);
        Assert.Equal(hints, f!.ParcelIdHints);
    }

    [Fact]
    public void DetectHighExceptionRate_PropagatesOutlierHints()
    {
        // exceptionRate = 20/100 = 20% > 10% cap
        var hints = new List<string> { "P-6001", "P-6002" };
        var d = BuildDetail(parcelCount: 100, exceptionCount: 20, outlierParcelIds: hints);
        var f = CountyStudioAiService.DetectHighExceptionRate(d);
        Assert.NotNull(f);
        Assert.Equal(hints, f!.ParcelIdHints);
    }

    [Fact]
    public void DetectLowRatioCount_PropagatesOutlierHints()
    {
        var hints = new List<string> { "P-5001", "P-5002", "P-5003", "P-5004" };
        var d = BuildDetail(ratioCount: 8, outlierParcelIds: hints);
        var f = CountyStudioAiService.DetectLowRatioCount(d);
        Assert.NotNull(f);
        Assert.Equal(hints, f!.ParcelIdHints);
    }

    [Fact]
    public void Hints_CappedAtTen_WhenOutlierListIsLarger()
    {
        // Inspector caps at 10 — but detectors also guard with Take(10).
        var bigHints = Enumerable.Range(1, 15).Select(i => $"P-{i:D4}").ToList();
        var d = BuildDetail(cod: 35.0m, outlierParcelIds: bigHints);
        var f = CountyStudioAiService.DetectIaaoCodExtreme(d);
        Assert.NotNull(f);
        Assert.True(f!.ParcelIdHints.Count <= 10, "ParcelIdHints must be capped at 10");
    }

    [Fact]
    public void Hints_EmptyList_WhenNoOutlierParcelIds()
    {
        var d = BuildDetail(cod: 35.0m, outlierParcelIds: new List<string>());
        var f = CountyStudioAiService.DetectIaaoCodExtreme(d);
        Assert.NotNull(f);
        Assert.Empty(f!.ParcelIdHints);
    }
}

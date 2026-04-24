// backend/src/TerraFusion.Core/Services/CountyStudioAiService.cs
//
// Task E — County Studio deterministic diagnosis service (Fix #6).
//
// NO LLM CALLS. NO HAND-WAVED PROSE. NO DECORATIVE LANGUAGE.
//
// Every finding cites a real number from CountySegmentDetailDto. Every
// classification is an argmax over weighted finding categories. Every
// recommended action is mapped from a specific finding code via a fixed
// rule table. Every narrative sentence is built from finding Summary
// strings — no ad-hoc text.
//
// The pipeline:
//   1. Load CountySegmentDetailDto via ICountyStudyInspectorService (reuse —
//      we do not duplicate PRB/VEI/ratio math).
//   2. Run a fixed, ordered list of pure-function finding detectors over the
//      detail. Each detector emits 0 or 1 SegmentDiagnosisFinding.
//   3. Classify via weighted argmax of {Healthy, Data, Model, Workflow,
//      Market} using finding EvidenceStrength sums. Data is biased higher
//      because data problems invalidate downstream model/market judgments.
//   4. Map finding codes → primary SegmentRecommendedAction via a rule table.
//      Deduplicate. Prioritize.
//   5. Template the narrative from the top 1–2 findings' Summary strings +
//      the primary action's rationale. 2–4 sentences, never more.
//   6. Hash (SegmentId, SegmentSetId, DerivedAt, serialized detail) → SHA-256
//      for InputFingerprint. Same inputs → identical output.
//
// Performance: single segment ≤ 200ms (arithmetic over a small DTO). County
// level iterates per-segment — for Benton-scale (hundreds of segments) ≤ 1.5s.

using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class CountyStudioAiService : ICountyStudioAiService
{
    // ── IAAO + Benton thresholds — must match CountyStudyHealthService / BentonEquityMath.
    // If you change a threshold here, change it in lockstep across those services.
    private const decimal MedianFairLow      = 0.90m;
    private const decimal MedianFairHigh     = 1.10m;
    private const decimal CodIaaoCeiling     = 20m;
    private const decimal CodIaaoExtreme     = 30m;
    private const decimal PrdFairLow         = 0.98m;
    private const decimal PrdFairHigh        = 1.03m;
    private const decimal PrbFairAbs         = 0.05m;
    private const decimal ExceptionRateCap   = 0.10m;
    private const int     LowRatioCount      = 15;
    private const decimal YoyDriftThreshold  = 0.03m;
    private const decimal YoyVolatilityCv    = 0.05m;

    // Category-score multiplier — Data findings invalidate downstream model/market
    // judgments, so every Data finding's raw evidence weight is multiplied by this.
    private const decimal DataCategoryBias   = 1.5m;

    private readonly ICountyStudyInspectorService _inspectorSvc;
    private readonly ITerraFusionDbContext _db;

    public CountyStudioAiService(
        ICountyStudyInspectorService inspectorSvc,
        ITerraFusionDbContext db)
    {
        _inspectorSvc = inspectorSvc;
        _db           = db;
    }

    // ── Public API ────────────────────────────────────────────────────────

    public async Task<SegmentDiagnosisDto?> DiagnoseSegmentAsync(
        Guid segmentId, CancellationToken ct = default)
    {
        var detail = await _inspectorSvc.GetSegmentDetailAsync(segmentId, ct);
        // Detail throws InvalidOperationException on missing — bubble up.
        // A segment with zero persisted metrics AND zero ratios means we
        // cannot diagnose it — signal to the controller via 409.
        if (detail.RatioCount == 0 && !detail.MedianRatio.HasValue && !detail.Cod.HasValue)
        {
            throw new InvalidOperationException(
                $"Segment {segmentId} has no derived metrics — derive segment metrics first.");
        }

        return BuildDiagnosis(detail);
    }

    public async Task<CountyDiagnosisDto?> DiagnoseCountyAsync(
        Guid studyId, CancellationToken ct = default)
    {
        var study = await _db.CountyStudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudyId == studyId, ct)
            ?? throw new InvalidOperationException($"Study {studyId} not found");
        if (study.ActiveSegmentSetId is null)
            throw new InvalidOperationException(
                $"Study {studyId} has no active segment set. Derive segments first via LeftRail → Derive Segment Metrics.");

        var countyName = await _db.Counties.AsNoTracking()
            .Where(c => c.Id == study.CountyId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(ct) ?? "Unknown";

        var segments = await _db.CountySegments.AsNoTracking()
            .Where(s => s.SegmentSetId == study.ActiveSegmentSetId.Value)
            .ToListAsync(ct);

        var diagnoses = new List<SegmentDiagnosisDto>(segments.Count);
        foreach (var seg in segments)
        {
            SegmentDiagnosisDto? dx = null;
            try
            {
                var detail = await _inspectorSvc.GetSegmentDetailAsync(seg.SegmentId, ct);
                if (detail.RatioCount == 0 && !detail.MedianRatio.HasValue && !detail.Cod.HasValue)
                    continue;  // un-diagnosable segment — skip rather than fail county
                dx = BuildDiagnosis(detail);
            }
            catch (InvalidOperationException)
            {
                continue;  // skip broken segment
            }
            if (dx is not null) diagnoses.Add(dx);
        }

        var problemDiagnoses = diagnoses.Where(d => d.PrimaryClass != ProblemClass.Healthy).ToList();
        var healthyCount     = diagnoses.Count - problemDiagnoses.Count;

        // Top 5 problems: PrimaryConfidence * max(EvidenceStrength) descending —
        // so the highest-confidence, highest-evidence segments surface first.
        var topProblems = problemDiagnoses
            .OrderByDescending(d => d.PrimaryConfidence *
                (d.Findings.Count > 0 ? d.Findings.Max(f => f.EvidenceStrength) : 0m))
            .ThenByDescending(d => d.ParcelCount)
            .Take(5)
            .ToList();

        var patterns = DetectCountyPatterns(diagnoses);

        // Overall classification: argmax over sums of category scores across ALL
        // diagnoses. Healthy only wins when no problem findings exist anywhere.
        var overall = AggregateClassification(diagnoses);

        var narrative = BuildCountyNarrative(
            countyName, study.TaxYear, diagnoses.Count, problemDiagnoses.Count,
            overall.Class, overall.Confidence, patterns);

        var fingerprint = HashInputs(
            $"county:{studyId}",
            string.Join("|", diagnoses.OrderBy(d => d.SegmentId).Select(d => d.InputFingerprint)));

        return new CountyDiagnosisDto(
            StudyId:             studyId,
            TaxYear:             study.TaxYear,
            CountyName:          countyName,
            OverallClass:        overall.Class,
            OverallConfidence:   overall.Confidence,
            HealthySegmentCount: healthyCount,
            ProblemSegmentCount: problemDiagnoses.Count,
            TopProblems:         topProblems,
            Patterns:            patterns,
            Narrative:           narrative,
            InputFingerprint:    fingerprint,
            GeneratedAt:         DateTime.UtcNow);
    }

    // ── Core diagnosis pipeline ──────────────────────────────────────────

    /// <summary>
    /// Build a deterministic diagnosis from a segment detail DTO.
    /// Pure function of the detail — no DB access — so county-level diagnosis
    /// can call this for every segment without additional round-trips.
    /// </summary>
    public static SegmentDiagnosisDto BuildDiagnosis(CountySegmentDetailDto d)
    {
        var findings = RunFindingDetectors(d);
        var (cls, confidence) = Classify(findings);
        var actions = RecommendActions(findings, d);
        var narrative = BuildNarrative(d, cls, confidence, findings, actions);
        var fingerprint = FingerprintDetail(d);

        return new SegmentDiagnosisDto(
            SegmentId:          d.SegmentId,
            SegmentName:        d.Name,
            City:               d.City,
            NeighborhoodCode:   d.NeighborhoodCode,
            ParcelCount:        d.ParcelCount,
            PrimaryClass:       cls,
            PrimaryConfidence:  confidence,
            Findings:           findings,
            RecommendedActions: actions,
            Narrative:          narrative,
            InputFingerprint:   fingerprint,
            GeneratedAt:        DateTime.UtcNow);
    }

    // ── Finding detectors (pure functions) ────────────────────────────────

    /// <summary>
    /// Run every detector in a fixed order. Each returns 0 or 1 findings.
    /// Findings are returned ordered by EvidenceStrength descending.
    /// </summary>
    public static List<SegmentDiagnosisFinding> RunFindingDetectors(CountySegmentDetailDto d)
    {
        var acc = new List<SegmentDiagnosisFinding>();

        // Detector order is fixed — do not reshuffle without updating tests.
        AddIfPresent(acc, DetectZeroSales(d));
        AddIfPresent(acc, DetectLowRatioCount(d));
        AddIfPresent(acc, DetectIaaoCodExtreme(d));
        AddIfPresent(acc, DetectIaaoCodCeilingBreach(d));
        AddIfPresent(acc, DetectMedianLowUnfair(d));
        AddIfPresent(acc, DetectMedianHighUnfair(d));
        AddIfPresent(acc, DetectPrdRegressive(d));
        AddIfPresent(acc, DetectPrdProgressive(d));
        AddIfPresent(acc, DetectPrbRegressive(d));
        AddIfPresent(acc, DetectPrbProgressive(d));
        AddIfPresent(acc, DetectHighExceptionRate(d));
        AddIfPresent(acc, DetectYoyDriftSignificant(d));
        AddIfPresent(acc, DetectYoyInstability(d));
        AddIfPresent(acc, DetectHealthySegment(d, acc));  // last — needs to see whether any problem findings fired

        return acc.OrderByDescending(f => f.EvidenceStrength).ToList();
    }

    private static void AddIfPresent(List<SegmentDiagnosisFinding> acc, SegmentDiagnosisFinding? f)
    {
        if (f is not null) acc.Add(f);
    }

    // Helper: build an Evidence dictionary from (key, value) pairs.
    private static Dictionary<string, object> Ev(params (string Key, object Value)[] kv)
    {
        var map = new Dictionary<string, object>(kv.Length);
        foreach (var (k, v) in kv) map[k] = v;
        return map;
    }

    // ── Data detectors ────────────────────────────────────────────────────

    public static SegmentDiagnosisFinding? DetectZeroSales(CountySegmentDetailDto d)
    {
        if (d.RatioCount != 0) return null;
        return new SegmentDiagnosisFinding(
            Code:             "ZERO_SALES",
            Category:         "Data",
            Summary:          "No qualified sales in the tax-year ±2 window — IAAO statistics cannot be computed.",
            EvidenceStrength: 1.0m,
            Evidence:         Ev(("ratioCount", 0), ("taxYear", d.TaxYear)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectLowRatioCount(CountySegmentDetailDto d)
    {
        if (d.RatioCount == 0 || d.RatioCount >= LowRatioCount) return null;
        return new SegmentDiagnosisFinding(
            Code:             "LOW_SAMPLE_RATIO_COUNT",
            Category:         "Data",
            Summary:          $"Only {d.RatioCount} qualified sales — insufficient for IAAO statistics (minimum {LowRatioCount}).",
            EvidenceStrength: 0.8m,
            Evidence:         Ev(("ratioCount", d.RatioCount), ("minimumRequired", LowRatioCount), ("parcelCount", d.ParcelCount)),
            ParcelIdHints:    new List<string>());
    }

    // ── Model detectors ───────────────────────────────────────────────────

    public static SegmentDiagnosisFinding? DetectIaaoCodCeilingBreach(CountySegmentDetailDto d)
    {
        if (!d.Cod.HasValue) return null;
        if (d.Cod.Value <= CodIaaoCeiling) return null;
        if (d.Cod.Value > CodIaaoExtreme) return null;  // extreme detector handles this range
        var codF1 = d.Cod.Value.ToString("F1");
        return new SegmentDiagnosisFinding(
            Code:             "IAAO_COD_CEILING_BREACH",
            Category:         "Model",
            Summary:          $"COD {codF1} exceeds IAAO ceiling of {CodIaaoCeiling:F0} — dispersion too high for compliant valuation.",
            EvidenceStrength: 0.75m,
            Evidence:         Ev(("cod", d.Cod.Value), ("iaaoCeiling", CodIaaoCeiling), ("ratioCount", d.RatioCount)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectIaaoCodExtreme(CountySegmentDetailDto d)
    {
        if (!d.Cod.HasValue) return null;
        if (d.Cod.Value <= CodIaaoExtreme) return null;
        var codF1 = d.Cod.Value.ToString("F1");
        return new SegmentDiagnosisFinding(
            Code:             "IAAO_COD_EXTREME",
            Category:         "Model",
            Summary:          $"COD {codF1} is extreme — more than 50% above IAAO ceiling of {CodIaaoCeiling:F0}; valuation dispersion is severe.",
            EvidenceStrength: 0.95m,
            Evidence:         Ev(("cod", d.Cod.Value), ("iaaoCeiling", CodIaaoCeiling), ("extremeThreshold", CodIaaoExtreme)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectMedianLowUnfair(CountySegmentDetailDto d)
    {
        if (!d.MedianRatio.HasValue) return null;
        if (d.MedianRatio.Value >= MedianFairLow) return null;
        var medF2 = d.MedianRatio.Value.ToString("F2");
        return new SegmentDiagnosisFinding(
            Code:             "MEDIAN_LOW_UNFAIR",
            Category:         "Model",
            Summary:          $"Median ratio {medF2} below IAAO fair range {MedianFairLow:F2}–{MedianFairHigh:F2} — parcels may be under-assessed.",
            EvidenceStrength: 0.7m,
            Evidence:         Ev(("median", d.MedianRatio.Value), ("fairLow", MedianFairLow), ("fairHigh", MedianFairHigh)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectMedianHighUnfair(CountySegmentDetailDto d)
    {
        if (!d.MedianRatio.HasValue) return null;
        if (d.MedianRatio.Value <= MedianFairHigh) return null;
        var medF2 = d.MedianRatio.Value.ToString("F2");
        return new SegmentDiagnosisFinding(
            Code:             "MEDIAN_HIGH_UNFAIR",
            Category:         "Model",
            Summary:          $"Median ratio {medF2} above IAAO fair range {MedianFairLow:F2}–{MedianFairHigh:F2} — parcels may be over-assessed.",
            EvidenceStrength: 0.7m,
            Evidence:         Ev(("median", d.MedianRatio.Value), ("fairLow", MedianFairLow), ("fairHigh", MedianFairHigh)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectPrdRegressive(CountySegmentDetailDto d)
    {
        if (!d.Prd.HasValue) return null;
        if (d.Prd.Value <= PrdFairHigh) return null;
        var prdF3 = d.Prd.Value.ToString("F3");
        return new SegmentDiagnosisFinding(
            Code:             "PRD_VERTICAL_INEQUITY_REGRESSIVE",
            Category:         "Model",
            Summary:          $"PRD {prdF3} indicates assessment regressivity — higher-value parcels relatively under-assessed (IAAO fair {PrdFairLow:F2}–{PrdFairHigh:F2}).",
            EvidenceStrength: 0.65m,
            Evidence:         Ev(("prd", d.Prd.Value), ("fairLow", PrdFairLow), ("fairHigh", PrdFairHigh)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectPrdProgressive(CountySegmentDetailDto d)
    {
        if (!d.Prd.HasValue) return null;
        if (d.Prd.Value >= PrdFairLow) return null;
        var prdF3 = d.Prd.Value.ToString("F3");
        return new SegmentDiagnosisFinding(
            Code:             "PRD_VERTICAL_INEQUITY_PROGRESSIVE",
            Category:         "Model",
            Summary:          $"PRD {prdF3} indicates assessment progressivity — lower-value parcels relatively under-assessed (IAAO fair {PrdFairLow:F2}–{PrdFairHigh:F2}).",
            EvidenceStrength: 0.65m,
            Evidence:         Ev(("prd", d.Prd.Value), ("fairLow", PrdFairLow), ("fairHigh", PrdFairHigh)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectPrbRegressive(CountySegmentDetailDto d)
    {
        if (!d.Prb.HasValue) return null;
        if (d.Prb.Value >= -PrbFairAbs) return null;
        var prbF3 = d.Prb.Value.ToString("F3");
        return new SegmentDiagnosisFinding(
            Code:             "PRB_REGRESSIVE",
            Category:         "Model",
            Summary:          $"PRB {prbF3} below fair band (|PRB| ≤ {PrbFairAbs:F2}) — regressivity confirmed by price-related-bias regression.",
            EvidenceStrength: 0.6m,
            Evidence:         Ev(("prb", d.Prb.Value), ("fairAbs", PrbFairAbs)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectPrbProgressive(CountySegmentDetailDto d)
    {
        if (!d.Prb.HasValue) return null;
        if (d.Prb.Value <= PrbFairAbs) return null;
        var prbF3 = d.Prb.Value.ToString("F3");
        return new SegmentDiagnosisFinding(
            Code:             "PRB_PROGRESSIVE",
            Category:         "Model",
            Summary:          $"PRB {prbF3} above fair band (|PRB| ≤ {PrbFairAbs:F2}) — progressivity confirmed by price-related-bias regression.",
            EvidenceStrength: 0.6m,
            Evidence:         Ev(("prb", d.Prb.Value), ("fairAbs", PrbFairAbs)),
            ParcelIdHints:    new List<string>());
    }

    // ── Workflow detectors ────────────────────────────────────────────────

    public static SegmentDiagnosisFinding? DetectHighExceptionRate(CountySegmentDetailDto d)
    {
        if (d.ParcelCount == 0) return null;
        var rate = (decimal)d.ExceptionCount / d.ParcelCount;
        if (rate <= ExceptionRateCap) return null;
        var ratePct = (rate * 100m).ToString("F1");
        return new SegmentDiagnosisFinding(
            Code:             "HIGH_EXCEPTION_RATE",
            Category:         "Workflow",
            Summary:          $"{d.ExceptionCount} of {d.ParcelCount} parcels ({ratePct}%) outside IAAO fence — exception rate exceeds {ExceptionRateCap * 100m:F0}% cap.",
            EvidenceStrength: 0.55m,
            Evidence:         Ev(
                ("exceptionCount", d.ExceptionCount),
                ("parcelCount",    d.ParcelCount),
                ("exceptionRate",  Math.Round(rate, 4)),
                ("capThreshold",   ExceptionRateCap)),
            ParcelIdHints:    new List<string>());
    }

    // ── Market detectors (YoY) ────────────────────────────────────────────

    public static SegmentDiagnosisFinding? DetectYoyDriftSignificant(CountySegmentDetailDto d)
    {
        var points = d.YearHistory.Where(p => p.MedianRatio.HasValue).ToList();
        if (points.Count < 3) return null;

        // Linear regression slope (y = a + b*x) of median ratio vs. tax year.
        var xs = points.Select(p => (decimal)p.TaxYear).ToList();
        var ys = points.Select(p => p.MedianRatio!.Value).ToList();
        var slope = LinearSlope(xs, ys);
        var absSlope = Math.Abs(slope);
        if (absSlope <= YoyDriftThreshold) return null;

        // "+0.5% per year" vs. "-0.5% per year"
        var slopePctPerYear = slope * 100m;
        var sign = slopePctPerYear >= 0 ? "+" : "";
        var slopeStr = $"{sign}{slopePctPerYear:F1}%";
        return new SegmentDiagnosisFinding(
            Code:             "YOY_DRIFT_SIGNIFICANT",
            Category:         "Market",
            Summary:          $"Median ratio has drifted {slopeStr} per year over {points.Count} tax years — market moving faster than reassessment.",
            EvidenceStrength: 0.5m,
            Evidence:         Ev(
                ("slopePerYear",  Math.Round(slope, 4)),
                ("historyPoints", points.Count),
                ("threshold",     YoyDriftThreshold)),
            ParcelIdHints:    new List<string>());
    }

    public static SegmentDiagnosisFinding? DetectYoyInstability(CountySegmentDetailDto d)
    {
        var points = d.YearHistory.Where(p => p.MedianRatio.HasValue).ToList();
        if (points.Count < 3) return null;

        var values = points.Select(p => p.MedianRatio!.Value).ToList();
        var mean = values.Average();
        if (mean <= 0) return null;
        var variance = values.Select(v => (v - mean) * (v - mean)).Average();
        var stddev = (decimal)Math.Sqrt((double)variance);
        var cv = stddev / mean;
        if (cv <= YoyVolatilityCv) return null;

        var cvPct = (cv * 100m).ToString("F1");
        return new SegmentDiagnosisFinding(
            Code:             "YOY_INSTABILITY",
            Category:         "Workflow",
            Summary:          $"Year-over-year median ratio volatility {cvPct}% (coefficient of variation) exceeds {YoyVolatilityCv * 100m:F0}% — reassessment cycle may be missing market signal.",
            EvidenceStrength: 0.45m,
            Evidence:         Ev(
                ("cv",            Math.Round(cv, 4)),
                ("historyPoints", points.Count),
                ("threshold",     YoyVolatilityCv)),
            ParcelIdHints:    new List<string>());
    }

    // ── Healthy "positive" detector ───────────────────────────────────────

    /// <summary>
    /// Emitted only when the segment has real metrics AND no prior detector
    /// found a problem. Serves as the positive class's weight in the argmax —
    /// without this, a perfectly healthy segment would classify as Healthy by
    /// default (no findings) but with 0.5 fallback confidence. This finding
    /// raises that confidence to match the strength of the evidence.
    /// </summary>
    public static SegmentDiagnosisFinding? DetectHealthySegment(
        CountySegmentDetailDto d, IReadOnlyList<SegmentDiagnosisFinding> priorFindings)
    {
        if (priorFindings.Count > 0) return null;
        if (d.RatioCount < LowRatioCount) return null;
        if (!d.MedianRatio.HasValue || !d.Cod.HasValue) return null;
        var medF2 = d.MedianRatio.Value.ToString("F2");
        var codF1 = d.Cod.Value.ToString("F1");
        return new SegmentDiagnosisFinding(
            Code:             "HEALTHY_SEGMENT",
            Category:         "Healthy",
            Summary:          $"Median {medF2} inside IAAO fair range, COD {codF1} inside ceiling, {d.RatioCount} qualified sales — segment is IAAO and Benton compliant.",
            EvidenceStrength: 0.9m,
            Evidence:         Ev(
                ("median",     d.MedianRatio.Value),
                ("cod",        d.Cod.Value),
                ("ratioCount", d.RatioCount)),
            ParcelIdHints:    new List<string>());
    }

    // ── Classification ────────────────────────────────────────────────────

    /// <summary>
    /// Weighted argmax of {Data, Model, Workflow, Market, Healthy} category
    /// scores. Data category scores are multiplied by DataCategoryBias to
    /// reflect that data problems invalidate downstream judgments.
    ///
    /// If no findings: Healthy @ 0.5 confidence (neutral fallback).
    /// Confidence = winnerScore / totalScore, bounded [0, 1].
    /// </summary>
    public static (ProblemClass Class, decimal Confidence) Classify(List<SegmentDiagnosisFinding> findings)
    {
        if (findings.Count == 0) return (ProblemClass.Healthy, 0.5m);

        var sums = new Dictionary<ProblemClass, decimal>
        {
            [ProblemClass.Data]     = 0m,
            [ProblemClass.Model]    = 0m,
            [ProblemClass.Workflow] = 0m,
            [ProblemClass.Market]   = 0m,
            [ProblemClass.Healthy]  = 0m,
        };
        foreach (var f in findings)
        {
            var cls = ToClass(f.Category);
            var weight = cls == ProblemClass.Data
                ? f.EvidenceStrength * DataCategoryBias
                : f.EvidenceStrength;
            sums[cls] += weight;
        }

        var winner = sums.OrderByDescending(kv => kv.Value).First();
        var total = sums.Values.Sum();
        var confidence = total > 0m ? winner.Value / total : 0.5m;
        // Round to 2 decimals for determinism across platforms.
        confidence = Math.Round(Math.Min(1.0m, Math.Max(0m, confidence)), 2);

        return (winner.Key, confidence);
    }

    private static ProblemClass ToClass(string category) => category switch
    {
        "Data"     => ProblemClass.Data,
        "Model"    => ProblemClass.Model,
        "Workflow" => ProblemClass.Workflow,
        "Market"   => ProblemClass.Market,
        "Healthy"  => ProblemClass.Healthy,
        _          => ProblemClass.Model,  // unknown → defensive default to Model
    };

    // ── Action recommendations ────────────────────────────────────────────

    /// <summary>
    /// Rule-based action table. Each finding code can map to 1–2 actions.
    /// Duplicate actions (same ActionCode) are deduplicated, keeping the
    /// highest-priority rationale (lowest Priority value).
    /// </summary>
    public static List<SegmentRecommendedAction> RecommendActions(
        List<SegmentDiagnosisFinding> findings, CountySegmentDetailDto d)
    {
        // If the only finding is HEALTHY_SEGMENT, return a MARK_HEALTHY action.
        if (findings.Count == 1 && findings[0].Code == "HEALTHY_SEGMENT")
        {
            return new List<SegmentRecommendedAction>
            {
                new(
                    ActionCode:      "MARK_HEALTHY",
                    Target:          "None",
                    Summary:         "No action required — segment is IAAO and Benton compliant.",
                    Priority:        1,
                    Rationale:       findings[0].Summary,
                    PrebuiltContext: null),
            };
        }

        var stratumContext = new Dictionary<string, object>
        {
            ["segmentId"] = d.SegmentId,
            ["studyId"]   = d.StudyId,
            ["taxYear"]   = d.TaxYear,
        };

        var emitted = new Dictionary<string, SegmentRecommendedAction>();

        void Emit(SegmentRecommendedAction action)
        {
            if (emitted.TryGetValue(action.ActionCode, out var existing))
            {
                // Keep the higher-priority (lower-number) rationale.
                if (action.Priority < existing.Priority)
                    emitted[action.ActionCode] = action;
                return;
            }
            emitted[action.ActionCode] = action;
        }

        foreach (var f in findings)
        {
            switch (f.Code)
            {
                case "ZERO_SALES":
                case "LOW_SAMPLE_RATIO_COUNT":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "RECONCILE_SALES",
                        Target:          "SalesForge",
                        Summary:         "Reconcile qualified sales in SalesForge — expand search window or review exclusions.",
                        Priority:        1,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;

                case "IAAO_COD_CEILING_BREACH":
                case "IAAO_COD_EXTREME":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "RECALIBRATE_COST_TABLE",
                        Target:          "CostForge",
                        Summary:         "Recalibrate cost tables in CostForge — dispersion is outside IAAO compliance.",
                        Priority:        2,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;

                case "MEDIAN_LOW_UNFAIR":
                case "MEDIAN_HIGH_UNFAIR":
                case "PRD_VERTICAL_INEQUITY_REGRESSIVE":
                case "PRD_VERTICAL_INEQUITY_PROGRESSIVE":
                case "PRB_REGRESSIVE":
                case "PRB_PROGRESSIVE":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "RECALIBRATE_COST_TABLE",
                        Target:          "CostForge",
                        Summary:         "Recalibrate cost tables in CostForge — median or vertical-equity band is breached.",
                        Priority:        2,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "REVIEW_COMPS",
                        Target:          "CompsForge",
                        Summary:         "Review comparable sales in CompsForge — check for sales that may skew the fairness band.",
                        Priority:        3,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;

                case "HIGH_EXCEPTION_RATE":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "DISPATCH_FIELD_REVIEW",
                        Target:          "Dais",
                        Summary:         "Dispatch field review via Dais — many parcels sit outside IAAO fence.",
                        Priority:        3,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;

                case "YOY_DRIFT_SIGNIFICANT":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "RECALIBRATE_COST_TABLE",
                        Target:          "CostForge",
                        Summary:         "Recalibrate cost tables in CostForge — median ratio is drifting year over year.",
                        Priority:        2,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "REVIEW_MARKET",
                        Target:          "SalesForge",
                        Summary:         "Review recent market shifts in SalesForge — reassessment cadence may need adjustment.",
                        Priority:        4,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;

                case "YOY_INSTABILITY":
                    Emit(new SegmentRecommendedAction(
                        ActionCode:      "REVIEW_WORKFLOW",
                        Target:          "Dais",
                        Summary:         "Review reassessment workflow in Dais — year-over-year volatility suggests process drift.",
                        Priority:        4,
                        Rationale:       f.Summary,
                        PrebuiltContext: stratumContext));
                    break;
            }
        }

        return emitted.Values.OrderBy(a => a.Priority).ThenBy(a => a.ActionCode).ToList();
    }

    // ── Narrative generation ──────────────────────────────────────────────

    /// <summary>
    /// 2–4 sentence deterministic narrative. Every sentence comes directly from
    /// a Finding's Summary or the primary action's rationale. No decoration.
    /// </summary>
    public static string BuildNarrative(
        CountySegmentDetailDto d,
        ProblemClass cls,
        decimal confidence,
        List<SegmentDiagnosisFinding> findings,
        List<SegmentRecommendedAction> actions)
    {
        // Use CultureInfo.InvariantCulture — deterministic across locales.
        var conf = Math.Round(confidence * 100m, 0).ToString("F0", System.Globalization.CultureInfo.InvariantCulture);
        var sentences = new List<string>();

        if (cls == ProblemClass.Healthy)
        {
            sentences.Add($"{d.Name} classifies as Healthy (confidence {conf}%).");
            if (findings.Count > 0 && findings[0].Code == "HEALTHY_SEGMENT")
                sentences.Add(findings[0].Summary);
            sentences.Add(actions.Count > 0 ? actions[0].Summary : "No action required.");
            return string.Join(" ", sentences);
        }

        sentences.Add($"{d.Name} classifies as {cls} problem (confidence {conf}%).");

        // Top 1–2 findings verbatim — these cite real numbers by construction.
        var top = findings.Take(2).ToList();
        foreach (var f in top)
        {
            sentences.Add(f.Summary);
        }

        // Primary action — the highest-priority recommendation.
        if (actions.Count > 0)
        {
            var primary = actions[0];
            sentences.Add($"Recommended: {primary.Summary}");
        }

        // Clamp to 4 sentences.
        while (sentences.Count > 4) sentences.RemoveAt(sentences.Count - 1);
        return string.Join(" ", sentences);
    }

    // ── County-level aggregation ──────────────────────────────────────────

    /// <summary>
    /// Aggregate classification = weighted argmax across ALL segment findings.
    /// Confidence is winnerScore / totalScore.
    /// </summary>
    public static (ProblemClass Class, decimal Confidence) AggregateClassification(
        IReadOnlyList<SegmentDiagnosisDto> diagnoses)
    {
        var all = diagnoses.SelectMany(d => d.Findings).ToList();
        return Classify(all);
    }

    /// <summary>
    /// Cross-segment patterns. A pattern requires a minimum count of affected
    /// segments to fire. Severity = (affected / total_possible) ∈ [0, 1].
    /// </summary>
    public static List<CountyPattern> DetectCountyPatterns(IReadOnlyList<SegmentDiagnosisDto> diagnoses)
    {
        var patterns = new List<CountyPattern>();
        if (diagnoses.Count == 0) return patterns;

        // CITY_WIDE_REGRESSIVITY: ≥50% of a city's segments have a regressive finding.
        // Group by city (non-null only); exclude cities with < 2 segments.
        var regressiveCodes = new HashSet<string>
        {
            "PRD_VERTICAL_INEQUITY_REGRESSIVE",
            "PRB_REGRESSIVE",
        };
        var byCity = diagnoses
            .Where(d => !string.IsNullOrWhiteSpace(d.City))
            .GroupBy(d => d.City!)
            .Where(g => g.Count() >= 2)
            .OrderBy(g => g.Key);
        foreach (var group in byCity)
        {
            var affected = group
                .Where(d => d.Findings.Any(f => regressiveCodes.Contains(f.Code)))
                .ToList();
            if (affected.Count == 0) continue;
            var fraction = (decimal)affected.Count / group.Count();
            if (fraction < 0.5m) continue;
            patterns.Add(new CountyPattern(
                PatternCode:          "CITY_WIDE_REGRESSIVITY",
                Summary:              $"{affected.Count} of {group.Count()} segments in {group.Key} ({(fraction * 100m):F0}%) show assessment regressivity — city-wide PRD/PRB breach.",
                AffectedSegmentCount: affected.Count,
                SegmentIds:           affected.Select(d => d.SegmentId).OrderBy(id => id).ToList(),
                Severity:             Math.Round(fraction, 2)));
        }

        // NEIGHBORHOOD_SAMPLE_SCARCITY: ≥3 segments in a neighborhood have LOW_SAMPLE_RATIO_COUNT.
        var byNbhd = diagnoses
            .Where(d => !string.IsNullOrWhiteSpace(d.NeighborhoodCode))
            .GroupBy(d => d.NeighborhoodCode!)
            .OrderBy(g => g.Key);
        foreach (var group in byNbhd)
        {
            var affected = group
                .Where(d => d.Findings.Any(f => f.Code == "LOW_SAMPLE_RATIO_COUNT" || f.Code == "ZERO_SALES"))
                .ToList();
            if (affected.Count < 3) continue;
            var fraction = (decimal)affected.Count / Math.Max(group.Count(), 1);
            patterns.Add(new CountyPattern(
                PatternCode:          "NEIGHBORHOOD_SAMPLE_SCARCITY",
                Summary:              $"{affected.Count} of {group.Count()} segments in neighborhood {group.Key} lack qualified sales — market-data scarcity.",
                AffectedSegmentCount: affected.Count,
                SegmentIds:           affected.Select(d => d.SegmentId).OrderBy(id => id).ToList(),
                Severity:             Math.Round(fraction, 2)));
        }

        // BUILDING_TYPE_MODEL_DRIFT: ≥3 segments with the same SegmentName prefix OR the
        // detail carries SegmentType; we approximate using the segment name's first token.
        // Segments come from derivation with names like "nbhd/bldg/quality" — the bldg token
        // is the model-drift signal. We conservatively use first two chars of SegmentName
        // after the first '/'. If that parse fails we skip.
        var bldgGroups = diagnoses
            .Select(d => new { d, Bldg = ExtractBuildingTypeFromName(d.SegmentName) })
            .Where(x => x.Bldg is not null)
            .GroupBy(x => x.Bldg!)
            .OrderBy(g => g.Key);
        foreach (var group in bldgGroups)
        {
            var affected = group
                .Where(x => x.d.Findings.Any(f => f.Code == "IAAO_COD_CEILING_BREACH" || f.Code == "IAAO_COD_EXTREME"))
                .ToList();
            if (affected.Count < 3) continue;
            patterns.Add(new CountyPattern(
                PatternCode:          "BUILDING_TYPE_MODEL_DRIFT",
                Summary:              $"{affected.Count} segments of building-type {group.Key} exceed IAAO COD ceiling — model calibration has drifted for this property type.",
                AffectedSegmentCount: affected.Count,
                SegmentIds:           affected.Select(x => x.d.SegmentId).OrderBy(id => id).ToList(),
                Severity:             Math.Round((decimal)affected.Count / group.Count(), 2)));
        }

        // Ordered by severity DESC for display; tie-break by PatternCode for determinism.
        return patterns.OrderByDescending(p => p.Severity).ThenBy(p => p.PatternCode).ToList();
    }

    /// <summary>
    /// Segment names from derivation follow "{nbhd}/{bldg}/{quality}" shape. Pull
    /// the bldg token. Returns null when the name doesn't match that shape.
    /// </summary>
    private static string? ExtractBuildingTypeFromName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var parts = name.Split('/');
        if (parts.Length < 2) return null;
        var token = parts[1].Trim();
        return string.IsNullOrWhiteSpace(token) ? null : token;
    }

    private static string BuildCountyNarrative(
        string countyName,
        int taxYear,
        int totalCount,
        int problemCount,
        ProblemClass cls,
        decimal confidence,
        List<CountyPattern> patterns)
    {
        var conf = Math.Round(confidence * 100m, 0).ToString("F0", System.Globalization.CultureInfo.InvariantCulture);
        var sentences = new List<string>();
        sentences.Add($"{countyName} {taxYear} classifies as {cls} problem (confidence {conf}%).");
        sentences.Add($"{problemCount} of {totalCount} segments carry a diagnosed problem.");
        foreach (var p in patterns.Take(2))
        {
            sentences.Add(p.Summary);
        }
        while (sentences.Count > 4) sentences.RemoveAt(sentences.Count - 1);
        return string.Join(" ", sentences);
    }

    // ── Input fingerprint ─────────────────────────────────────────────────

    /// <summary>
    /// SHA-256 hex of (SegmentId, SegmentSetId, DerivedAt, canonical detail JSON).
    /// Identical inputs → identical fingerprint.
    /// </summary>
    public static string FingerprintDetail(CountySegmentDetailDto d)
    {
        // Canonicalize: use a fixed JSON shape so ordering is deterministic.
        var canonical = $"{d.SegmentId}|{d.SegmentSetId}|{(d.DerivedAt?.Ticks.ToString() ?? "null")}|" +
                        $"pc={d.ParcelCount};rc={d.RatioCount};med={d.MedianRatio};cod={d.Cod};" +
                        $"prd={d.Prd};prb={d.Prb};vei={d.Vei};ec={d.ExceptionCount};" +
                        $"cls={d.EquityClassification};yh={string.Join(",", d.YearHistory.Select(p => $"{p.TaxYear}:{p.MedianRatio}:{p.Cod}:{p.ExceptionCount}"))}";
        return HashInputs("segment", canonical);
    }

    public static string HashInputs(params string[] parts)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(string.Join("|", parts)));
        var sb = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }

    // ── Linear regression helper ──────────────────────────────────────────

    private static decimal LinearSlope(List<decimal> xs, List<decimal> ys)
    {
        if (xs.Count != ys.Count || xs.Count < 2) return 0m;
        var meanX = xs.Average();
        var meanY = ys.Average();
        decimal num = 0m, den = 0m;
        for (var i = 0; i < xs.Count; i++)
        {
            var dx = xs[i] - meanX;
            num += dx * (ys[i] - meanY);
            den += dx * dx;
        }
        return den == 0m ? 0m : num / den;
    }
}

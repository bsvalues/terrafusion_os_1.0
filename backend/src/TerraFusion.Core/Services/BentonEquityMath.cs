// backend/src/TerraFusion.Core/Services/BentonEquityMath.cs
//
// Task D — single source of truth for Benton Method equity math.
//
// Why this file exists:
//   EquityMetricService (in TerraFusion.AI) already computes PRB via OLS
//   regression. The new CountyStudyInspectorService lives in TerraFusion.Core
//   and Core cannot reference AI (circular project reference). Rather than
//   fork the math, the primitives live here in Core and EquityMetricService
//   delegates. Health/rollup/derivation services already inline Median + COD
//   — this file picks up the Benton-Method-specific helpers (PRB, VEI,
//   classification, composite equity score) that Task D introduces.
//
// All math is pure, stateless, and allocation-light. Callers supply the
// already-computed median + ratio/value pairs; this file does not touch EF
// Core or any repository.

using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public static class BentonEquityMath
{
    // ── Thresholds (referenced by ClassifyEquity + BentonEquityScore) ────
    /// <summary>IAAO PRD fair band — lower bound (below = progressivity).</summary>
    public const decimal PrdFairLow  = 0.98m;
    /// <summary>IAAO PRD fair band — upper bound (above = regressivity).</summary>
    public const decimal PrdFairHigh = 1.03m;
    /// <summary>|PRB| ≤ this value = fair; positive = progressivity, negative = regressivity.</summary>
    public const decimal PrbFairAbs  = 0.05m;
    /// <summary>COD ceiling for the "Fair" band in Benton equity score (IAAO §7).</summary>
    public const decimal CodIaaoCeiling = 20m;
    /// <summary>Below this ratio count we flag InsufficientData regardless of other metrics.</summary>
    public const int MinRatiosForClassification = 15;

    /// <summary>
    /// Median of a list of values. O(n log n). Returns 0 when empty so callers
    /// can chain without null propagation; check Count &gt; 0 upstream when the
    /// distinction matters (derivation does this already).
    /// </summary>
    public static decimal Median(IList<decimal> values)
    {
        if (values.Count == 0) return 0m;
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2m
            : sorted[mid];
    }

    /// <summary>
    /// Price-Related Bias (PRB) via OLS regression of ln(ratio/median) on
    /// ln(value/median_value), where value = (AV + SalePrice)/2 (IAAO proxy).
    /// Returns the slope (β₁). |PRB| ≤ 0.05 = fair; positive = progressivity
    /// (higher-value parcels over-assessed), negative = regressivity.
    ///
    /// Requires ≥ 10 observations for regression stability; returns null when
    /// below threshold.
    /// </summary>
    public static decimal? ComputePrb(IReadOnlyList<SaleRatio> ratios, decimal median)
    {
        if (ratios.Count < 10 || median <= 0) return null;

        var values = ratios.Select(r => (r.AssessedValue + r.AdjustedSalePrice) / 2m).ToList();
        var medianValue = Median(values);
        if (medianValue <= 0) return null;

        var pairs = ratios
            .Select((r, i) => new
            {
                X = Math.Log((double)(values[i] / medianValue)),
                Y = Math.Log((double)(r.Ratio / median))
            })
            .ToList();

        var meanX = pairs.Average(p => p.X);
        var meanY = pairs.Average(p => p.Y);
        var num   = pairs.Sum(p => (p.X - meanX) * (p.Y - meanY));
        var den   = pairs.Sum(p => (p.X - meanX) * (p.X - meanX));
        return den > 0 ? (decimal)(num / den) : 0m;
    }

    /// <summary>
    /// Vertical Equity Index (VEI) — Benton's composite 0–100 score where 100 =
    /// perfect vertical equity. Blends three vertical-equity signals:
    ///
    ///   PRD deviation   → (1 - clamp(|PRD - 1|, 0, 0.10) / 0.10) × 40
    ///   PRB deviation   → (1 - clamp(|PRB|,     0, 0.10) / 0.10) × 40
    ///   Spearman ρ(ratio, value) → (1 - |ρ|) × 20
    ///
    /// Weights: PRD (40) + PRB (40) + ρ (20) = 100. Spearman is the tie-breaker
    /// — PRD/PRB can mask a monotonic bias when their bands are respected.
    ///
    /// Requires ≥ 10 ratios (Spearman is noisy below that). Returns null when
    /// either PRB or PRD is missing — the index is undefined without both.
    /// </summary>
    public static decimal? ComputeVei(
        IReadOnlyList<SaleRatio> ratios,
        decimal? prd,
        decimal? prb)
    {
        if (ratios.Count < 10 || !prd.HasValue || !prb.HasValue) return null;

        var prdPenalty = Math.Min(Math.Abs(prd.Value - 1m), 0.10m) / 0.10m;
        var prbPenalty = Math.Min(Math.Abs(prb.Value),     0.10m) / 0.10m;

        // Spearman rank correlation between ratios and per-parcel value proxy.
        var values = ratios.Select(r => (double)((r.AssessedValue + r.AdjustedSalePrice) / 2m)).ToList();
        var ratioDoubles = ratios.Select(r => (double)r.Ratio).ToList();
        var rho = SpearmanCorrelation(ratioDoubles, values);
        var rhoPenalty = Math.Min(Math.Abs((decimal)rho), 1m);

        var score = (1m - prdPenalty) * 40m
                  + (1m - prbPenalty) * 40m
                  + (1m - rhoPenalty) * 20m;
        return Math.Round(Math.Max(0m, Math.Min(100m, score)), 2);
    }

    /// <summary>
    /// IAAO + Benton classification for a segment's vertical equity.
    ///
    /// Rules (in order; first match wins):
    ///   InsufficientData — ratioCount &lt; MinRatiosForClassification OR
    ///                      (prd is null AND prb is null).
    ///   Regressive       — prd &gt; PrdFairHigh OR prb &lt; -PrbFairAbs.
    ///                      Higher-value parcels under-assessed relative to
    ///                      lower-value — unfair to lower-value owners.
    ///   Progressive      — prd &lt; PrdFairLow  OR prb &gt;  PrbFairAbs.
    ///                      Higher-value parcels over-assessed.
    ///   Fair             — prd ∈ [PrdFairLow, PrdFairHigh] AND |prb| ≤ PrbFairAbs.
    ///
    /// Ordering note: Regressive is checked before Progressive because when
    /// PRD and PRB disagree (possible with small samples), regressivity is
    /// the more equity-harmful finding and we surface it.
    /// </summary>
    public static string ClassifyEquity(decimal? prd, decimal? prb, int ratioCount)
    {
        if (ratioCount < MinRatiosForClassification) return "InsufficientData";
        if (!prd.HasValue && !prb.HasValue)         return "InsufficientData";

        var prdRegressive  = prd.HasValue && prd.Value > PrdFairHigh;
        var prbRegressive  = prb.HasValue && prb.Value < -PrbFairAbs;
        if (prdRegressive || prbRegressive) return "Regressive";

        var prdProgressive = prd.HasValue && prd.Value < PrdFairLow;
        var prbProgressive = prb.HasValue && prb.Value >  PrbFairAbs;
        if (prdProgressive || prbProgressive) return "Progressive";

        // At this point both signals are either null or inside the fair band.
        // Require at least one present to affirm "Fair" — else fall back to
        // InsufficientData so we don't green-light a segment we can't measure.
        if (prd.HasValue || prb.HasValue) return "Fair";
        return "InsufficientData";
    }

    /// <summary>
    /// Benton Equity Score — 0–100 composite where 100 = perfect fairness.
    /// Deducts weighted penalties from 100 for deviations across the four
    /// Benton-Method equity dimensions (COD, PRD, PRB, VEI):
    ///
    ///   COD penalty  = min(max(0, cod - CodIaaoCeiling) * 1.5, 25)
    ///   PRD penalty  = min(max(0, |prd - 1| - 0.02) * 300,      25)   (fair band = ±0.02 or [0.98,1.03])
    ///   PRB penalty  = min(max(0, |prb| - PrbFairAbs) * 200,    25)
    ///   VEI penalty  = (vei &lt; 100) ? (100 - vei) * 0.25         : 0  (max 25)
    ///
    /// Missing inputs: if COD/PRD/PRB/VEI is null, its penalty is 0 (we do
    /// not guess). The returned score is clamped to [0, 100]. Returns null
    /// only when ratioCount &lt; MinRatiosForClassification (nothing to score).
    /// </summary>
    public static decimal? ComputeBentonEquityScore(
        decimal? cod, decimal? prd, decimal? prb, decimal? vei, int ratioCount)
    {
        if (ratioCount < MinRatiosForClassification) return null;

        decimal codPenalty = 0m;
        if (cod.HasValue && cod.Value > CodIaaoCeiling)
            codPenalty = Math.Min((cod.Value - CodIaaoCeiling) * 1.5m, 25m);

        decimal prdPenalty = 0m;
        if (prd.HasValue)
        {
            var excess = Math.Max(0m, Math.Abs(prd.Value - 1m) - 0.02m);
            prdPenalty = Math.Min(excess * 300m, 25m);
        }

        decimal prbPenalty = 0m;
        if (prb.HasValue)
        {
            var excess = Math.Max(0m, Math.Abs(prb.Value) - PrbFairAbs);
            prbPenalty = Math.Min(excess * 200m, 25m);
        }

        decimal veiPenalty = 0m;
        if (vei.HasValue && vei.Value < 100m)
            veiPenalty = Math.Min((100m - vei.Value) * 0.25m, 25m);

        var score = 100m - codPenalty - prdPenalty - prbPenalty - veiPenalty;
        return Math.Round(Math.Max(0m, Math.Min(100m, score)), 2);
    }

    // ── Internal helpers ──────────────────────────────────────────────────

    /// <summary>
    /// Spearman rank correlation ρ between two equal-length samples. Uses
    /// fractional ranks (ties get the mean of the tied positions) and the
    /// standard Pearson-of-ranks formula. Returns 0 when degenerate.
    /// </summary>
    internal static double SpearmanCorrelation(IList<double> xs, IList<double> ys)
    {
        if (xs.Count != ys.Count || xs.Count < 2) return 0d;
        var rx = FractionalRanks(xs);
        var ry = FractionalRanks(ys);
        var meanX = rx.Average();
        var meanY = ry.Average();
        double num = 0, denX = 0, denY = 0;
        for (var i = 0; i < rx.Length; i++)
        {
            var dx = rx[i] - meanX;
            var dy = ry[i] - meanY;
            num  += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        var den = Math.Sqrt(denX * denY);
        return den > 0 ? num / den : 0d;
    }

    private static double[] FractionalRanks(IList<double> values)
    {
        var indexed = values.Select((v, i) => (Value: v, Index: i))
                            .OrderBy(t => t.Value)
                            .ToList();
        var ranks = new double[values.Count];
        var i2 = 0;
        while (i2 < indexed.Count)
        {
            var j = i2;
            while (j < indexed.Count - 1 && indexed[j + 1].Value == indexed[i2].Value) j++;
            // Positions are 1-based in Spearman; the mean of (i2+1)..(j+1)
            // becomes i2+1 + (j - i2) / 2 = i2 + (j - i2 + 2) / 2 - 1
            var rank = (i2 + 1 + j + 1) / 2.0;
            for (var k = i2; k <= j; k++) ranks[indexed[k].Index] = rank;
            i2 = j + 1;
        }
        return ranks;
    }
}

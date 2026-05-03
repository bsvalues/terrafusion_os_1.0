/*
 * EquityMetricsDto and SaleRatio
 *
 * Canonical data contracts for CostForge Benton Method v2 equity analysis.
 * EquityMetricsDto is computed server-side by EquityMetricService from a
 * SaleRatio[] built from ComparableSales + PropertyAssessments + CamaCharacteristics.
 *
 * @version 1.0.0 - Track 1 (CostForge Benton Method v2)
 */

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Full equity metric suite for a stratum. All metrics are computed from the
/// same SaleRatio[] collection to guarantee numerical consistency across views.
/// </summary>
public record EquityMetricsDto(
    int SaleCount,
    decimal? MedianRatio,
    decimal? WeightedMeanRatio,
    decimal? ArithmeticMeanRatio,
    decimal? Cod,                           // Coefficient of Dispersion, %
    decimal? Prd,                           // Price-Related Differential (mean / weighted mean)
    decimal? Prb,                           // Price-Related Bias (regression slope)
    decimal?[] DecileMedianRatios,          // length 10; null for empty deciles
    bool IaaoCompliant,                     // IAAO standards gate
    bool BentonCompliant,                   // IAAO + decile spread ≤ 0.10
    string Provenance                       // "real" | "insufficient-sales" | "no-data"
);

/// <summary>
/// A single qualified sale-ratio observation used as the input to all
/// equity metric computations. Built by SaleRatioQueryBuilder.
/// </summary>
public record SaleRatio(
    string ParcelId,
    decimal AssessedValue,
    decimal AdjustedSalePrice,
    decimal Ratio,                          // AssessedValue / AdjustedSalePrice
    DateTime SaleDate,
    int? YearBuilt,
    string? NeighborhoodCode,
    string? City,
    string? PropertyUseStratum,
    string? ConditionGrade,
    string? QualityGrade
);

/*
 * StratumRollupDto + RollupResponseDto
 *
 * Output shapes for /api/equity/rollup — returns ordered list of strata
 * (e.g. cities, property types, vintage decades, grades) each with parcel
 * count, sale count, totals, and full EquityMetrics.
 *
 * @version 1.0.0 - Track 2 (CostForge Benton Method v2)
 */

namespace TerraFusion.Core.DTOs;

public record StratumRollupDto(
    string Key,
    string Name,
    int ParcelCount,
    int SaleCount,
    decimal? TotalAv,
    EquityMetricsDto Metrics,
    int? ChildCount
);

public record RollupResponseDto(
    Guid CountyId,
    int TaxYear,
    string Stratum,
    IReadOnlyList<StratumRollupDto> Strata
);

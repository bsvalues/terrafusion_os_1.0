/*
 * Benton Custom Metrics DTOs
 *
 * Output shapes for the 5 Benton-method metrics that go beyond IAAO:
 *   - Decile equity analysis
 *   - Stratified COD (within-stratum)
 *   - WAC condition bias
 *   - Secondary-segment drift (ImprvDetTypeCd-level)
 *   - Quality-grade drift
 *
 * @version 1.0.0 - Track 3 (CostForge Benton Method v2)
 */

namespace TerraFusion.Core.DTOs;

public record DecileAnalysisDto(
    int SaleCount,
    decimal?[] DecileMedianRatios,  // length 10
    decimal? D1D10Spread,            // D1 median − D10 median (positive = regressive)
    string Pattern                   // "regressive" | "progressive" | "uniform" | "insufficient-data"
);

public record StratifiedCodDto(
    string SplitBy,                           // vintage | condition | grade
    Dictionary<string, SegmentCodDto> Segments
);

public record SegmentCodDto(
    int SaleCount,
    decimal? MedianRatio,
    decimal? Cod
);

public record ConditionBiasDto(
    Dictionary<string, SegmentMedianDto> MedianRatioByCondition
);

public record SegmentMedianDto(int SaleCount, decimal? MedianRatio);

public record SegmentDriftDto(
    Dictionary<string, SegmentDriftRowDto> Segments
);

public record SegmentDriftRowDto(
    int SalesWithSegment,
    decimal? MedianWithSegment,
    int SalesWithoutSegment,
    decimal? MedianWithoutSegment,
    decimal? Drift                   // MedianWithSegment − MedianWithoutSegment
);

public record GradeDriftDto(
    Dictionary<string, SegmentMedianDto> MedianRatioByGrade
);

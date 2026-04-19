namespace TerraFusion.Core.DTOs;

public record DiagnosisFinding(
    string Rule,
    string Description,
    List<Guid> AffectedSaleIds);

public record SimulationResultDto(
    decimal Cod,
    decimal MedianRatio,
    decimal Prd,
    int SaleCount);

public record StratumDiagnosisSummaryDto(
    string StratumKey,
    string? PrimaryDiagnosis,
    decimal? Confidence,
    string? RecommendedAction,
    bool IsStale,
    DateTime? DiagnosedAt);

public record StratumSaleDto(
    Guid Id,
    string ParcelId,
    DateTime SaleDate,
    decimal SalePrice,
    decimal? AssessedValue,
    decimal? Ratio,
    string? WacCode,
    string? AiFlag,
    string? AiReason,
    // Layer 1 — raw PACS code
    string? PacsQualification,
    // Layer 2 — TerraFusion recommendation
    string? Recommendation,
    // Layer 3 — appraiser final decision (already exists on ComparableSale.QualificationDecision)
    string? QualificationDecision);

public record BulkDecisionRequest(
    List<Guid> SaleIds,
    string Decision,
    string? Reason);

public record ProposeAdjustmentRequest(
    decimal Factor,
    decimal ProjectedCod,
    decimal ProjectedMedianRatio,
    decimal ProjectedPrd);

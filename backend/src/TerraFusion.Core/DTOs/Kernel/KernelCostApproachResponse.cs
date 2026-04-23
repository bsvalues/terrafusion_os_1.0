namespace TerraFusion.Core.DTOs.Kernel;

public record KernelCostApproachResponse(
    string ParcelId,
    double ReplacementCost,
    double Depreciation,
    double Rcnld,
    double LandValue,
    double BuildingValue,
    double TotalValue,
    KernelProvenance Provenance);

public record KernelProvenance(
    string CostKernelHash,
    string ValuationKernelHash,
    string CostInputHash,
    string ValuationInputHash,
    int CostDurationMs,
    int ValuationDurationMs,
    string CostAuditEventId,
    string ValuationAuditEventId);

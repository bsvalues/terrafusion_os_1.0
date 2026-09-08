using System.Text.Json.Serialization;

namespace TerraFusion.API.Services.Valuation.KernelContracts;

// Transport for the OS EO exchanges. Formula/validation semantics live in protected Forge source.
public sealed record ForgeCostPayload(string SchemaVersion, string ParcelId, decimal? SquareFeet,
    decimal? BaseCostPerSqft, decimal? RevalAreaFactor, decimal? QualityFactor, decimal? ComplexityFactor,
    decimal? DepreciationFactor, decimal? ConditionFactor, decimal? LandValue);

public sealed record ForgeIncomeExpenses(decimal? PropertyTaxes, decimal? Insurance, decimal? Utilities,
    decimal? Maintenance, decimal? ManagementFees, decimal? ReplacementReserves, decimal? OtherExpenses);

public sealed record ForgeIncomePayload(string SchemaVersion, string ParcelId, decimal? AnnualRentalIncome,
    decimal? VacancyRate, decimal? OtherIncome, ForgeIncomeExpenses Expenses, decimal? CapRate, decimal? LocationMultiplier);

public interface IForgeApproachResult { string SchemaVersion { get; } string ParcelId { get; } }

public sealed record ForgeCostResult(
    [property: JsonRequired] string SchemaVersion, [property: JsonRequired] string ParcelId,
    [property: JsonRequired] decimal RcnPerSqft, [property: JsonRequired] decimal RcndPerSqft,
    [property: JsonRequired] decimal AdjustedCostPerSqft, [property: JsonRequired] decimal ReplacementCost,
    [property: JsonRequired] decimal PhysicalDepreciation, [property: JsonRequired] decimal ConditionAdjustment,
    [property: JsonRequired] decimal Rcnld, [property: JsonRequired] decimal LandValue,
    [property: JsonRequired] decimal TotalValue) : IForgeApproachResult;

public sealed record ForgeIncomeResult(
    [property: JsonRequired] string SchemaVersion, [property: JsonRequired] string ParcelId,
    [property: JsonRequired] decimal AnnualRentalIncome, [property: JsonRequired] decimal VacancyLoss,
    [property: JsonRequired] decimal OtherIncome, [property: JsonRequired] decimal EffectiveGrossIncome,
    [property: JsonRequired] decimal TotalExpenses, [property: JsonRequired] decimal ExpenseRatio,
    [property: JsonRequired] decimal NetOperatingIncome,
    [property: JsonRequired] decimal CapRate, [property: JsonRequired] decimal LocationMultiplier,
    [property: JsonRequired] decimal RawValuation, [property: JsonRequired] decimal AdjustedValuation,
    [property: JsonRequired] decimal GrossIncomeMultiplier, [property: JsonRequired] decimal CashOnCashReturn,
    [property: JsonRequired] string RiskClassification) : IForgeApproachResult;

public sealed record ForgeApproachContext(Guid CountyId, string ParcelId, string RequestId);
public sealed record ForgeApproachProvenance(Guid CountyId, string ParcelId, string RequestId,
    string SourceCommit, string ExecutableSha256, string InputHash, string StdoutSha256, string AuditEventId);
public sealed record ForgeApproachInvocation<T>(T Data, ForgeApproachProvenance Provenance);

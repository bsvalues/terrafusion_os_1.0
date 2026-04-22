using System.Text.Json;

namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record ValuationKernelPayload(
    ValuationSubject Subject,
    ValuationCostBreakdown CostBreakdown,
    ValuationModel Model);

public record ValuationSubject(string ParcelId, JsonElement Attributes);

public record ValuationCostBreakdown(double ReplacementCost, double Depreciation, double Rcnld);

public record ValuationModel(double LandValue, AdjustmentFactors? AdjustmentFactors);

public record AdjustmentFactors(double? Neighborhood, double? Location);

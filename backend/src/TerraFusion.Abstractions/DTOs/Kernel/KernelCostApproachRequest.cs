namespace TerraFusion.Abstractions.DTOs.Kernel;

/// <summary>
/// Request to compute cost + valuation via Rust kernels for a parcel not yet
/// represented in canonical ValuationRecord / CamaCharacteristics.
/// </summary>
public record KernelCostApproachRequest(
    string ParcelId,
    double Sqft,
    string? Quality,
    string? Condition,
    double BaseRate,
    IReadOnlyDictionary<string, double> Modifiers,
    double LandValue,
    double? NeighborhoodFactor,
    double? LocationFactor);

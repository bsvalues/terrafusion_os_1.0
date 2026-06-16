namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// Provenance origin for TF-native valuation reference data (D-VAL-1). Only TerraFusion-owned
/// origins are representable — there is deliberately NO vendor/third-party value, so a proprietary
/// cost basis (e.g. a vendor cost manual) cannot be the runtime source of a factor set. Legacy
/// corpora may inform the derivation, but the runtime origin is always TF-owned.
/// </summary>
public enum ReferenceDataOrigin
{
    /// <summary>Authored and owned by TerraFusion.</summary>
    TerraFusionOwned = 1,

    /// <summary>Derived by TerraFusion from a county-published study (the derived output is TF-owned).</summary>
    TerraFusionDerivedFromCountyStudy = 2,
}

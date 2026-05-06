using System;

namespace TerraFusion.Core.Sync.PacsPropertyVal;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: source-shaped PACS <c>property_val</c> row.
/// </summary>
public sealed record PacsSourcePropertyVal(
    short PropValYr,
    short SupNum,
    int PropId,
    string? PropertyUseCd,
    DateTime? PropInactiveDt);

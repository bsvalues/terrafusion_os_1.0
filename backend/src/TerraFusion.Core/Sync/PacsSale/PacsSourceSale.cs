using System;

namespace TerraFusion.Core.Sync.PacsSale;

/// <summary>
/// Slice S1: source-shaped PACS sale row, before landing.
/// All fields preserved verbatim from the PACS source. The landing
/// service records this as a row in
/// <see cref="TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawSale"/>.
/// </summary>
public sealed record PacsSourceSale(
    long ChgOfOwnerId,
    int PropId,
    short PropValYr,
    short SupNum,
    string? SlCountyRatioCd,
    string? WacCd,
    string? SlRatioTypeCd,
    DateTime? SlDt,
    decimal? SlPrice,
    decimal? AdjSlPrice);

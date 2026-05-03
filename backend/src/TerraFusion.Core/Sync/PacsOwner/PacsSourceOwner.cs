using System;

namespace TerraFusion.Core.Sync.PacsOwner;

/// <summary>
/// Slice B1-B: source-shaped PACS owner row. The 4-key composite
/// identity is preserved verbatim.
/// </summary>
public sealed record PacsSourceOwner(
    short OwnerTaxYr,
    short SupNum,
    int PropId,
    long OwnerId,
    decimal? PctOwnership,
    string? TypeOfOwner,
    string? UdiStatus,
    DateTime? BirthDt);

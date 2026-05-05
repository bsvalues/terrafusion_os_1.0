using System;

namespace TerraFusion.Core.Sync.PacsProperty;

/// <summary>
/// Slice S1 (SYNC-POP-4a): source-shaped PACS property/parcel master
/// row, before landing.
///
/// <para>All fields preserved verbatim from the PACS source. The
/// landing service records this as a row in
/// <see cref="TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawProperty"/>.</para>
/// </summary>
public sealed record PacsSourceProperty(
    int PropId,
    string? PropTypeCd,
    string? GeoId,
    string? RefId1,
    string? RefId2,
    string? DbaName,
    string? AltDbaName,
    DateTime? PropCreateDt);

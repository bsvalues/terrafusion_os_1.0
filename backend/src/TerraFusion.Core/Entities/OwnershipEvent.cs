using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Bitemporal Owner ↔ Property association. One row per ownership transition or assertion.
/// "Current owner" is computed via <c>WHERE EffectiveThrough IS NULL OR EffectiveThrough &gt; now()</c> —
/// not stored as a shortcut on Property. No separate PropertyOwnership join table; this IS
/// the association.
/// </summary>
public sealed class OwnershipEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset? EffectiveThrough { get; set; }

    public string SourceSystem { get; set; } = "PACS";
    public string? SourceOwnerId { get; set; }
    public string? SourceChangeOfOwnerId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

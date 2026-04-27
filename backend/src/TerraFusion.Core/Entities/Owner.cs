using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Canonical owner entity. Preserves raw + normalized owner names and mailing addresses
/// for cross-source matching. Identity is per (CountyId, SourceSystem, SourceOwnerId);
/// downstream owner deduplication is a separate concern (post-MVP).
/// </summary>
public sealed class Owner
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string SourceOwnerId { get; set; } = null!;

    public string RawName { get; set; } = null!;
    public string NormalizedName { get; set; } = null!;

    public string? RawMailingAddress { get; set; }
    public string? NormalizedMailingAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

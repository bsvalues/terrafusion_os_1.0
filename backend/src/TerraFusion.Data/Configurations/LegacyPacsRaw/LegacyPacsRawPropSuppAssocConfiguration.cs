using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice S2-A: EF configuration for
/// <see cref="LegacyPacsRawPropSuppAssoc"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>prop_supp_assoc</c>.
///
/// <para>Note: the PACS source enforces UNIQUE(year, prop_id), but
/// THIS landing layer deliberately does NOT enforce that constraint
/// at the database level. The reason: a corrupt or partial PACS
/// extract may carry duplicate (year, prop_id) tuples, and the
/// doctrine wants those rows VISIBLE so the
/// <c>prop-supp-assoc-uniqueness</c> gate can FAIL the batch with
/// the actual duplicate count rather than crashing on insert.</para>
/// </summary>
public sealed class LegacyPacsRawPropSuppAssocConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawPropSuppAssoc>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawPropSuppAssoc> builder)
    {
        builder.ToTable("prop_supp_assoc", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by (PropId, PropValYr) — the supp-aware-join key path.
        builder.HasIndex(x => new { x.PropId, x.PropValYr })
            .HasDatabaseName("ix_legacy_pacs_raw_prop_supp_assoc_propid_year");

        // Read by load batch (re-runs / rollback).
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_prop_supp_assoc_loadbatch");
    }
}

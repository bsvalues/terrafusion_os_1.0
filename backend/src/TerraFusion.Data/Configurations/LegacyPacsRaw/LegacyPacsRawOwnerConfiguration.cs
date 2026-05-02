using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice B1-B: EF configuration for
/// <see cref="LegacyPacsRawOwner"/>. Schema <c>legacy_pacs_raw</c>;
/// table <c>owner</c>.
///
/// <para>Note: PACS enforces UNIQUE(<c>owner_tax_yr, sup_num,
/// prop_id, owner_id</c>). The landing layer deliberately does NOT
/// enforce that constraint at the database level so the
/// <c>owner-key-uniqueness</c> gate can FAIL the batch with the
/// actual duplicate count rather than crashing on insert.</para>
/// </summary>
public sealed class LegacyPacsRawOwnerConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawOwner>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawOwner> builder)
    {
        builder.ToTable("owner", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.OwnerTaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();

        builder.Property(x => x.PctOwnership).HasPrecision(7, 4);
        builder.Property(x => x.TypeOfOwner).HasMaxLength(8);
        builder.Property(x => x.UdiStatus).HasMaxLength(8);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 4-key composite (the supp-aware-join key path).
        builder.HasIndex(x => new { x.PropId, x.OwnerTaxYr, x.SupNum, x.OwnerId })
            .HasDatabaseName("ix_legacy_pacs_raw_owner_4key");

        // Reverse lookup: which parcels does this party own?
        builder.HasIndex(x => x.OwnerId)
            .HasDatabaseName("ix_legacy_pacs_raw_owner_ownerid");

        // Re-runs / rollback by load batch.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_owner_loadbatch");
    }
}

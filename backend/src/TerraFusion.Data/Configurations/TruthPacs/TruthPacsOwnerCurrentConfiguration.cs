using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice B2-A: EF configuration for
/// <see cref="TruthPacsOwnerCurrent"/>. Schema <c>truth_pacs</c>;
/// table <c>owner_current</c>.
/// </summary>
public sealed class TruthPacsOwnerCurrentConfiguration
    : IEntityTypeConfiguration<TruthPacsOwnerCurrent>
{
    public void Configure(EntityTypeBuilder<TruthPacsOwnerCurrent> builder)
    {
        builder.ToTable("owner_current", schema: "truth_pacs");

        builder.HasKey(x => x.TruthOwnerCurrentId);
        builder.Property(x => x.TruthOwnerCurrentId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerTaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.AcctId).IsRequired();

        builder.Property(x => x.FileAsName).HasMaxLength(200);
        builder.Property(x => x.FirstName).HasMaxLength(100);
        builder.Property(x => x.LastName).HasMaxLength(100);

        builder.Property(x => x.PctOwnership).HasPrecision(7, 4);
        builder.Property(x => x.TypeOfOwner).HasMaxLength(8);
        builder.Property(x => x.UdiStatus).HasMaxLength(8);

        builder.Property(x => x.SourceOwnerLandedRowId).IsRequired();
        builder.Property(x => x.SourceAccountLandedRowId).IsRequired();
        builder.Property(x => x.SourceSuppAssocLandedRowId).IsRequired();
        builder.Property(x => x.OwnerLoadBatchId).IsRequired();
        builder.Property(x => x.AccountLoadBatchId).IsRequired();
        builder.Property(x => x.SuppAssocLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Re-promotion key (idempotency by owner batch).
        builder.HasIndex(x => new { x.OwnerLoadBatchId, x.PropId, x.OwnerTaxYr })
            .HasDatabaseName("ix_truth_pacs_owner_current_ownerbatch_propyr");

        // "Who owns parcel X this year" hot path.
        builder.HasIndex(x => new { x.PropId, x.OwnerTaxYr })
            .HasDatabaseName("ix_truth_pacs_owner_current_prop_year");

        // Reverse lookup.
        builder.HasIndex(x => x.OwnerId)
            .HasDatabaseName("ix_truth_pacs_owner_current_owner");

        // Lineage lookup.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_owner_current_promotion_batch");
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice B3: EF configuration for
/// <see cref="TfParcelOwnerLink"/>. Schema <c>canonical_tf</c>;
/// table <c>tf_parcel_owner_link</c>.
/// </summary>
public sealed class TfParcelOwnerLinkConfiguration
    : IEntityTypeConfiguration<TfParcelOwnerLink>
{
    public void Configure(EntityTypeBuilder<TfParcelOwnerLink> builder)
    {
        builder.ToTable("tf_parcel_owner_link", schema: "canonical_tf");

        builder.HasKey(x => x.TfParcelOwnerLinkId);
        builder.Property(x => x.TfParcelOwnerLinkId).IsRequired();

        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.TfOwnerId).IsRequired();
        builder.Property(x => x.OwnerTaxYr).IsRequired();
        builder.Property(x => x.PctOwnership).HasPrecision(7, 4);

        builder.Property(x => x.SourceTruthOwnerCurrentId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Hot path: "who owns parcel X this year?"
        builder.HasIndex(x => new { x.TfParcelId, x.OwnerTaxYr })
            .HasDatabaseName("ix_tf_parcel_owner_link_parcel_year");

        // Reverse: "what parcels does this owner own?"
        builder.HasIndex(x => new { x.TfOwnerId, x.OwnerTaxYr })
            .HasDatabaseName("ix_tf_parcel_owner_link_owner_year");

        // Idempotency: clear by promotion batch.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_parcel_owner_link_promotion_batch");
    }
}

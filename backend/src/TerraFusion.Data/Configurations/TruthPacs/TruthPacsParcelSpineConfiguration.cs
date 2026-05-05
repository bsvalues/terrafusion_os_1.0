using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice S2-B (SYNC-POP-4b): EF configuration for
/// <see cref="TruthPacsParcelSpine"/>. Schema <c>truth_pacs</c>.
/// </summary>
public sealed class TruthPacsParcelSpineConfiguration : IEntityTypeConfiguration<TruthPacsParcelSpine>
{
    public void Configure(EntityTypeBuilder<TruthPacsParcelSpine> builder)
    {
        builder.ToTable("parcel_spine", schema: "truth_pacs");

        builder.HasKey(x => x.TruthParcelId);
        builder.Property(x => x.TruthParcelId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();

        // Always 'R' by construction; widened to 8 to match the raw
        // landing tier's tolerance for county-extended vocabularies.
        builder.Property(x => x.PropTypeCd).HasMaxLength(8).IsRequired();

        builder.Property(x => x.GeoId).HasMaxLength(64);
        builder.Property(x => x.RefId1).HasMaxLength(64);
        builder.Property(x => x.RefId2).HasMaxLength(64);
        builder.Property(x => x.DbaName).HasMaxLength(128);
        builder.Property(x => x.AltDbaName).HasMaxLength(128);

        builder.Property(x => x.SourcePropertyLandedRowId).IsRequired();
        builder.Property(x => x.PropertyLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // The spine's primary read path: by PACS prop_id (sale → parcel
        // resolution in the canonical projector). Doctrine: prop_id is
        // unique within a single promotion batch.
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_truth_pacs_parcel_spine_prop_id");

        // Idempotency-key path: re-promoting a property batch deletes
        // by PropertyLoadBatchId.
        builder.HasIndex(x => x.PropertyLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_parcel_spine_property_batch");

        // Promotion batch lookup for the canonical projector.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_parcel_spine_promotion_batch");

        // Lineage from canonical → truth → raw.
        builder.HasIndex(x => x.SourcePropertyLandedRowId)
            .HasDatabaseName("ix_truth_pacs_parcel_spine_source_landed");
    }
}

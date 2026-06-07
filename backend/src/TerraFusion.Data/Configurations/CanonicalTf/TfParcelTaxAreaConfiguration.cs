using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>JURISDICTION-SPINE: EF config for canonical_tf.tf_parcel_tax_area.</summary>
public sealed class TfParcelTaxAreaConfiguration : IEntityTypeConfiguration<TfParcelTaxArea>
{
    public void Configure(EntityTypeBuilder<TfParcelTaxArea> builder)
    {
        builder.ToTable("tf_parcel_tax_area", schema: "canonical_tf");
        builder.HasKey(x => x.TfParcelTaxAreaId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.SourcePropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.TaxAreaId).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.HasIndex(x => new { x.TfParcelId, x.TaxYr })
            .HasDatabaseName("ix_tf_parcel_tax_area_parcel_year");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.TaxAreaId })
            .HasDatabaseName("ix_tf_parcel_tax_area_county_year_taxarea");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_parcel_tax_area_promotion_batch");
    }
}

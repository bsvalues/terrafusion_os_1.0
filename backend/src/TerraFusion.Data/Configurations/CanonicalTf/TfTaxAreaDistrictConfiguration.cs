using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>JURISDICTION-SPINE: EF config for canonical_tf.tf_tax_area_district.</summary>
public sealed class TfTaxAreaDistrictConfiguration : IEntityTypeConfiguration<TfTaxAreaDistrict>
{
    public void Configure(EntityTypeBuilder<TfTaxAreaDistrict> builder)
    {
        builder.ToTable("tf_tax_area_district", schema: "canonical_tf");
        builder.HasKey(x => x.TfTaxAreaDistrictId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.TaxAreaId).IsRequired();
        builder.Property(x => x.TaxDistrictId).IsRequired();
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.TaxAreaId, x.TaxDistrictId })
            .IsUnique().HasDatabaseName("ux_tf_tax_area_district_key");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.TaxAreaId })
            .HasDatabaseName("ix_tf_tax_area_district_area");
    }
}

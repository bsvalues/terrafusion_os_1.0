using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>JURISDICTION-SPINE: EF config for canonical_tf.tf_tax_district.</summary>
public sealed class TfTaxDistrictConfiguration : IEntityTypeConfiguration<TfTaxDistrict>
{
    public void Configure(EntityTypeBuilder<TfTaxDistrict> builder)
    {
        builder.ToTable("tf_tax_district", schema: "canonical_tf");
        builder.HasKey(x => x.TfTaxDistrictId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TaxDistrictId).IsRequired();
        builder.Property(x => x.TaxDistrictCd).HasMaxLength(32);
        builder.Property(x => x.TaxDistrictDesc).HasMaxLength(256);
        builder.Property(x => x.TaxDistrictTypeCd).HasMaxLength(32);
        builder.Property(x => x.LocationCode).HasMaxLength(32);
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.CountyId, x.TaxDistrictId })
            .IsUnique().HasDatabaseName("ux_tf_tax_district_county_district");
        builder.HasIndex(x => x.TaxDistrictTypeCd)
            .HasDatabaseName("ix_tf_tax_district_type");
    }
}

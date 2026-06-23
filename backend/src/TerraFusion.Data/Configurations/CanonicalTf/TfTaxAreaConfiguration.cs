using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>JURISDICTION-SPINE: EF config for canonical_tf.tf_tax_area.</summary>
public sealed class TfTaxAreaConfiguration : IEntityTypeConfiguration<TfTaxArea>
{
    public void Configure(EntityTypeBuilder<TfTaxArea> builder)
    {
        builder.ToTable("tf_tax_area", schema: "canonical_tf");
        builder.HasKey(x => x.TfTaxAreaId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TaxAreaId).IsRequired();
        builder.Property(x => x.TaxAreaNumber).HasMaxLength(32);
        builder.Property(x => x.TaxAreaState).HasMaxLength(8);
        builder.Property(x => x.TaxAreaDescription).HasMaxLength(256);
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.CountyId, x.TaxAreaId })
            .IsUnique().HasDatabaseName("ux_tf_tax_area_county_taxarea");
    }
}

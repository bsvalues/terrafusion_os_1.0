using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>JURISDICTION-SPINE: EF config for legacy_pacs_raw.property_tax_area.</summary>
public sealed class LegacyPacsRawPropertyTaxAreaConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawPropertyTaxArea>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawPropertyTaxArea> builder)
    {
        builder.ToTable("property_tax_area", schema: "legacy_pacs_raw");
        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.TaxAreaId).IsRequired();
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();
        builder.HasIndex(x => new { x.PropId, x.TaxYr })
            .HasDatabaseName("ix_legacy_pacs_raw_property_tax_area_prop_year");
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_property_tax_area_loadbatch");
    }
}

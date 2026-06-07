using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// EXEMPTION-FACT-SEAL: EF config for
/// <see cref="LegacyPacsRawPropertyExemption"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>property_exemption</c>.
/// </summary>
public sealed class LegacyPacsRawPropertyExemptionConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawPropertyExemption>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawPropertyExemption> builder)
    {
        builder.ToTable("property_exemption", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.ExmptTaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.ExmptTypeCd).HasMaxLength(16).IsRequired();
        builder.Property(x => x.ExmptSubtypeCd).HasMaxLength(16);
        builder.Property(x => x.ExemptionPct).HasPrecision(9, 4);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        builder.HasIndex(x => new { x.PropId, x.ExmptTaxYr })
            .HasDatabaseName("ix_legacy_pacs_raw_property_exemption_prop_year");
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_property_exemption_loadbatch");
    }
}

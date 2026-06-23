using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>REVENUE-SPINE: EF config for canonical_tf.tf_levy_rate.</summary>
public sealed class TfLevyRateConfiguration : IEntityTypeConfiguration<TfLevyRate>
{
    public void Configure(EntityTypeBuilder<TfLevyRate> builder)
    {
        builder.ToTable("tf_levy_rate", schema: "canonical_tf");
        builder.HasKey(x => x.TfLevyRateId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.TaxDistrictId).IsRequired();
        builder.Property(x => x.LevyCd).HasMaxLength(32).IsRequired();
        builder.Property(x => x.LevyRate).HasPrecision(18, 8);
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.TaxDistrictId, x.LevyCd })
            .IsUnique().HasDatabaseName("ux_tf_levy_rate_key");
    }
}

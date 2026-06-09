using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Configurations.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-5: EF configuration for
/// <see cref="TfDoctrineSalesQualificationCode"/>.
/// Schema <c>doctrine_tf</c>; table
/// <c>tf_doctrine_sales_qualification_codes</c>.
/// </summary>
public sealed class TfDoctrineSalesQualificationCodeConfiguration
    : IEntityTypeConfiguration<TfDoctrineSalesQualificationCode>
{
    public void Configure(EntityTypeBuilder<TfDoctrineSalesQualificationCode> builder)
    {
        builder.ToTable("tf_doctrine_sales_qualification_codes", schema: "doctrine_tf");

        builder.HasKey(x => x.RuleId);
        builder.Property(x => x.RuleId).IsRequired();

        // Closed vocab: "DOR_RATIO" | "COUNTY_RATIO".
        builder.Property(x => x.SurfaceCode)
            .IsRequired()
            .HasMaxLength(32);

        // Free-text v1 (e.g. "sl_county_ratio_cd", "sl_ratio_type_cd").
        builder.Property(x => x.SourceField)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.EffectiveStartYear).IsRequired();
        builder.Property(x => x.EffectiveEndYear);

        // JSON array of qualified codes; default empty array.
        builder.Property(x => x.QualifiedCodesJson)
            .IsRequired()
            .HasMaxLength(1024)
            .HasDefaultValue("[]");

        builder.Property(x => x.EvidenceSource)
            .IsRequired()
            .HasMaxLength(1024)
            .HasDefaultValue(string.Empty);

        builder.Property(x => x.Confidence)
            .IsRequired()
            .HasMaxLength(8)
            .HasDefaultValue("MEDIUM");

        builder.Property(x => x.ActiveFlag).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(128);
        builder.Property(x => x.UpdatedBy).HasMaxLength(128);

        // Primary lookup index: (SurfaceCode, EffectiveStartYear).
        // Year-range queries narrow first by surface, then by year.
        builder.HasIndex(x => new { x.SurfaceCode, x.EffectiveStartYear })
            .HasDatabaseName("ix_tf_doctrine_sales_qualification_codes_surface_start");

        // Secondary lookup by underlying PACS column.
        builder.HasIndex(x => x.SourceField)
            .HasDatabaseName("ix_tf_doctrine_sales_qualification_codes_source_field");

        // Active-flag filter.
        builder.HasIndex(x => x.ActiveFlag)
            .HasDatabaseName("ix_tf_doctrine_sales_qualification_codes_active");
    }
}

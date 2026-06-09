using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Configurations.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): EF configuration for
/// <see cref="TfDoctrineRatioPolicy"/>.
/// Schema <c>doctrine_tf</c>; table <c>tf_doctrine_ratio_policy</c>.
/// </summary>
public sealed class TfDoctrineRatioPolicyConfiguration
    : IEntityTypeConfiguration<TfDoctrineRatioPolicy>
{
    public void Configure(EntityTypeBuilder<TfDoctrineRatioPolicy> builder)
    {
        builder.ToTable("tf_doctrine_ratio_policy", schema: "doctrine_tf");

        builder.HasKey(x => x.RuleId);
        builder.Property(x => x.RuleId).IsRequired();

        builder.Property(x => x.County)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.EffectiveStartYear).IsRequired();
        builder.Property(x => x.EffectiveEndYear);

        // Closed vocab — varchar wide enough for "BENTON_INTERNAL" + room.
        builder.Property(x => x.StudyName)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(x => x.SourceField)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.QualifiedCodesCsv)
            .IsRequired()
            .HasMaxLength(512)
            .HasDefaultValue(string.Empty);

        builder.Property(x => x.ExcludedCodesCsv)
            .IsRequired()
            .HasMaxLength(512)
            .HasDefaultValue(string.Empty);

        builder.Property(x => x.SqlFragment).HasMaxLength(1024);
        builder.Property(x => x.Reason).HasMaxLength(1024);
        builder.Property(x => x.EvidenceSource).HasMaxLength(512);

        builder.Property(x => x.Confidence)
            .IsRequired()
            .HasMaxLength(8)
            .HasDefaultValue("MED");

        builder.Property(x => x.ApprovedBy).HasMaxLength(128);
        builder.Property(x => x.ApprovedAt);

        builder.Property(x => x.Notes).HasMaxLength(2048);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(128);
        builder.Property(x => x.UpdatedBy).HasMaxLength(128);

        // Primary lookup index: (County, StudyName, EffectiveStartYear)
        // covers EvaluateAsync's WHERE clause cleanly.
        builder.HasIndex(x => new { x.County, x.StudyName, x.EffectiveStartYear })
            .HasDatabaseName("ix_tf_doctrine_ratio_policy_county_study_start");
    }
}

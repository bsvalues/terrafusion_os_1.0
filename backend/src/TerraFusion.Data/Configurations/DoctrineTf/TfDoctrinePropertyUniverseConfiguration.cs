using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Configurations.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-4: EF configuration for
/// <see cref="TfDoctrinePropertyUniverse"/>.
/// Schema <c>doctrine_tf</c>; table
/// <c>tf_doctrine_property_universe</c>.
/// </summary>
public sealed class TfDoctrinePropertyUniverseConfiguration
    : IEntityTypeConfiguration<TfDoctrinePropertyUniverse>
{
    public void Configure(EntityTypeBuilder<TfDoctrinePropertyUniverse> builder)
    {
        builder.ToTable("tf_doctrine_property_universe", schema: "doctrine_tf");

        builder.HasKey(x => x.RuleId);
        builder.Property(x => x.RuleId).IsRequired();

        builder.Property(x => x.County).IsRequired().HasMaxLength(64);

        builder.Property(x => x.EffectiveStartYear).IsRequired();
        builder.Property(x => x.EffectiveEndYear);

        builder.Property(x => x.Precedence).IsRequired();

        // Closed vocab from UniverseCodes; widest is "PERSONAL_PROPERTY" (17 chars).
        builder.Property(x => x.UniverseCode).IsRequired().HasMaxLength(50);

        builder.Property(x => x.PropTypeCdCsv).HasMaxLength(200);
        // Property-use codes can grow long when tightening commercial/residential
        // boundaries against profiling data. Allow generous room.
        builder.Property(x => x.PropertyUseCdCsv).HasMaxLength(2000);

        builder.Property(x => x.PropertyUseMode)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("ANY");

        builder.Property(x => x.AgApplyValue).HasMaxLength(10);
        builder.Property(x => x.AgUseCdCsv).HasMaxLength(200);

        builder.Property(x => x.RequiresLegacyMarker).IsRequired();
        builder.Property(x => x.LegacyMarkerType).HasMaxLength(50);
        builder.Property(x => x.LegacyMarkerValue).HasMaxLength(200);

        builder.Property(x => x.Reason).IsRequired().HasMaxLength(1024);
        builder.Property(x => x.EvidenceSource).IsRequired().HasMaxLength(1024);

        builder.Property(x => x.Confidence)
            .IsRequired()
            .HasMaxLength(8)
            .HasDefaultValue("MED");

        builder.Property(x => x.Notes).HasMaxLength(2048);

        builder.Property(x => x.ActiveFlag).IsRequired().HasDefaultValue(true);

        builder.Property(x => x.ApprovedBy).HasMaxLength(128);
        builder.Property(x => x.ApprovedAt);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(128);
        builder.Property(x => x.UpdatedBy).HasMaxLength(128);

        // Primary lookup index: classifier walks active rules for a
        // county ordered by precedence ASC.
        builder.HasIndex(x => new { x.County, x.ActiveFlag, x.Precedence })
            .HasDatabaseName("ix_tf_doctrine_property_universe_county_active_prec");

        // Secondary: per-universe effective-window scan for audits and
        // admin endpoints.
        builder.HasIndex(x => new { x.County, x.UniverseCode, x.EffectiveStartYear })
            .HasDatabaseName("ix_tf_doctrine_property_universe_county_universe_start");
    }
}

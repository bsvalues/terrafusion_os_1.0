using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Configurations.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-4: EF configuration for
/// <see cref="TfDoctrineAttributeDictionary"/>.
/// Schema <c>doctrine_tf</c>; table
/// <c>tf_doctrine_attribute_dictionary</c>.
/// </summary>
public sealed class TfDoctrineAttributeDictionaryConfiguration
    : IEntityTypeConfiguration<TfDoctrineAttributeDictionary>
{
    public void Configure(EntityTypeBuilder<TfDoctrineAttributeDictionary> builder)
    {
        builder.ToTable("tf_doctrine_attribute_dictionary", schema: "doctrine_tf");

        builder.HasKey(x => x.DictionaryRowId);
        builder.Property(x => x.DictionaryRowId).IsRequired();

        builder.Property(x => x.County).IsRequired().HasMaxLength(64);

        builder.Property(x => x.EffectiveStartYear).IsRequired();
        builder.Property(x => x.EffectiveEndYear);

        builder.Property(x => x.UniverseCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ImprvAttrId).IsRequired().HasMaxLength(100);
        builder.Property(x => x.IAttrValCd).IsRequired().HasMaxLength(200);

        builder.Property(x => x.AttributeDescription).HasMaxLength(500);
        builder.Property(x => x.AttributeGroup).HasMaxLength(100);
        builder.Property(x => x.SourceTable).HasMaxLength(200);
        builder.Property(x => x.SourceKey).HasMaxLength(200);

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

        // Uniqueness: one entry per (county, universe, code, value, year).
        // Per design doc §"tf_doctrine_attribute_dictionary".
        builder.HasIndex(x => new
            {
                x.County, x.UniverseCode, x.ImprvAttrId, x.IAttrValCd, x.EffectiveStartYear,
            })
            .IsUnique()
            .HasDatabaseName("uq_tf_doctrine_attribute_dictionary");

        // Lookup: per-universe scan for the in-memory cache build.
        builder.HasIndex(x => new { x.County, x.UniverseCode, x.ActiveFlag })
            .HasDatabaseName("ix_tf_doctrine_attribute_dictionary_lookup");
    }
}

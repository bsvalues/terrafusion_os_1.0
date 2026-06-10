using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice S1 (SYNC-POP-4a): EF configuration for
/// <see cref="LegacyPacsRawProperty"/>. Schema <c>legacy_pacs_raw</c>
/// on Postgres; flattened table name on SQLite.
///
/// <para>Column widths sized for real Harris PACS reality, not for
/// the SYNC-POP-2 fixture trap: every text column is given enough
/// headroom that CHAR-padded source values can land without truncation
/// after the source class trims them.</para>
/// </summary>
public sealed class LegacyPacsRawPropertyConfiguration : IEntityTypeConfiguration<LegacyPacsRawProperty>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawProperty> builder)
    {
        builder.ToTable("property", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();

        // Real PACS prop_type_cd is char(5) in modern schema; widen to
        // 8 for headroom (county-extended vocabularies have shown up
        // to 6 chars in practice elsewhere in the corpus).
        builder.Property(x => x.PropTypeCd).HasMaxLength(8);

        // geo_id is nominally varchar(50) in PACS but Benton operator
        // working SQL has shown values padded to 50 chars exactly;
        // 64 gives headroom without bloating row size.
        builder.Property(x => x.GeoId).HasMaxLength(64);
        builder.Property(x => x.RefId1).HasMaxLength(64);
        builder.Property(x => x.RefId2).HasMaxLength(64);

        // dba_name / alt_dba_name are wider in PACS (up to 50 chars
        // each in modern schema). 128 gives headroom for any county
        // that has extended.
        builder.Property(x => x.DbaName).HasMaxLength(128);
        builder.Property(x => x.AltDbaName).HasMaxLength(128);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();

        builder.Property(x => x.LandedAt).IsRequired();

        // Look up parcels by their PACS identity.
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_pacs_raw_property_prop_id");

        // Read parcels by load batch (for re-runs / rollback).
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_property_loadbatch");

        // Distribution queries by type axis.
        builder.HasIndex(x => x.PropTypeCd)
            .HasDatabaseName("ix_legacy_pacs_raw_property_prop_type_cd");

    }
}

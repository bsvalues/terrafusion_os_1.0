using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice L1: EF configuration for
/// <see cref="LegacyPacsRawLandDetail"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>land_detail</c>.
/// </summary>
public sealed class LegacyPacsRawLandDetailConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawLandDetail>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawLandDetail> builder)
    {
        builder.ToTable("land_detail", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.LandSegId).IsRequired();

        builder.Property(x => x.LandSegTypeCd).HasMaxLength(8);
        builder.Property(x => x.LandSegStateCd).HasMaxLength(8);
        builder.Property(x => x.LandSegClassCd).HasMaxLength(8);
        builder.Property(x => x.LandSegUseCd).HasMaxLength(16);
        builder.Property(x => x.SoilCd).HasMaxLength(16);
        builder.Property(x => x.LandSegHomesite).HasMaxLength(2);

        builder.Property(x => x.SizeAcres).HasPrecision(18, 4);
        builder.Property(x => x.SizeSquareFeet).HasPrecision(18, 2);
        builder.Property(x => x.LandSegMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAgValue).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAssessedVal).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 4-key composite — for joining back to the
        // parent property + supp_assoc.
        builder.HasIndex(x => new { x.PropId, x.PropValYr, x.SupNum, x.LandSegId })
            .HasDatabaseName("ix_legacy_pacs_raw_land_detail_4key");

        // Type-cd scans (downstream truth filter / land-schedule reads).
        builder.HasIndex(x => x.LandSegTypeCd)
            .HasDatabaseName("ix_legacy_pacs_raw_land_detail_type");

        // Use-cd scans (ag-vs-residential split).
        builder.HasIndex(x => x.LandSegUseCd)
            .HasDatabaseName("ix_legacy_pacs_raw_land_detail_use");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_land_detail_loadbatch");
    }
}

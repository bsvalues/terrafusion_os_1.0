using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthArcGis;

namespace TerraFusion.Data.Configurations.TruthArcGis;

/// <summary>
/// Slice D2: EF configuration for
/// <see cref="TruthArcGisParcelGeomCurrent"/>.
/// Schema <c>truth_arcgis</c>; table <c>parcel_geom_current</c>.
///
/// <para>Per Block-D execution plan §3.2:
/// <list type="bullet">
///   <item><c>(CountyId, ArcGisObjectId)</c> is unique at the
///   truth layer — only the latest landing wins.</item>
///   <item>Required fields: CountyId, ArcGisObjectId, GeomWkt,
///   SourceServiceUrl, SourceLandedRowId, LandingLoadBatchId,
///   PromotionLoadBatchId.</item>
///   <item>Optional: ArcGisApn (raw layer permits null).</item>
/// </list>
/// </para>
/// </summary>
public sealed class TruthArcGisParcelGeomCurrentConfiguration
    : IEntityTypeConfiguration<TruthArcGisParcelGeomCurrent>
{
    public void Configure(EntityTypeBuilder<TruthArcGisParcelGeomCurrent> builder)
    {
        builder.ToTable("parcel_geom_current", schema: "truth_arcgis");

        builder.HasKey(x => x.TruthParcelGeomId);
        builder.Property(x => x.TruthParcelGeomId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.ArcGisObjectId).IsRequired();

        builder.Property(x => x.ArcGisApn).HasMaxLength(64);

        builder.Property(x => x.GeomWkt).IsRequired();
        builder.Property(x => x.CentroidLat).IsRequired();
        builder.Property(x => x.CentroidLon).IsRequired();
        builder.Property(x => x.AreaSqFt).IsRequired();

        builder.Property(x => x.SourceServiceUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.SourceLandedRowId).IsRequired();
        builder.Property(x => x.LandingLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Latest-per-(CountyId, ArcGisObjectId) is enforced at
        // promotion time; the unique index makes accidental
        // double-inserts a hard failure.
        builder.HasIndex(x => new { x.CountyId, x.ArcGisObjectId })
            .IsUnique()
            .HasDatabaseName("ux_truth_arcgis_parcel_geom_county_objectid");

        // APN crosswalk lookup for D3.
        builder.HasIndex(x => new { x.CountyId, x.ArcGisApn })
            .HasDatabaseName("ix_truth_arcgis_parcel_geom_apn");

        // Idempotency cleanup target: clear by promotion batch.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_arcgis_parcel_geom_promotion_batch");

        // Lineage lookup.
        builder.HasIndex(x => x.LandingLoadBatchId)
            .HasDatabaseName("ix_truth_arcgis_parcel_geom_landing_batch");
    }
}

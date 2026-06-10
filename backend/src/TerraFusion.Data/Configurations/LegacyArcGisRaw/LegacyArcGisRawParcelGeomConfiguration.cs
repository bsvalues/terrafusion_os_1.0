using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyArcGisRaw;

namespace TerraFusion.Data.Configurations.LegacyArcGisRaw;

/// <summary>
/// Slice D1: EF configuration for
/// <see cref="LegacyArcGisRawParcelGeom"/>.
/// Schema <c>legacy_arcgis_raw</c>; table <c>parcel_geom</c>.
///
/// <para>Per Block-D execution plan §3.1
/// (<c>docs/pacs/block-d-execution-plan.md</c>):
/// <list type="bullet">
///   <item><c>(CountyId, ArcGisObjectId, LoadBatchId)</c> is the
///   uniqueness key — same OBJECTID re-landed in a new batch is
///   a distinct row (truth-layer D2 collapses them).</item>
///   <item>Required fields: CountyId, ArcGisObjectId, GeomWkt,
///   SourceServiceUrl, LoadBatchId, SourceQueryHash,
///   SourceRowHash.</item>
///   <item>Optional fields: ArcGisApn (some county services don't
///   expose an APN attribute).</item>
/// </list>
/// </para>
/// </summary>
public sealed class LegacyArcGisRawParcelGeomConfiguration
    : IEntityTypeConfiguration<LegacyArcGisRawParcelGeom>
{
    public void Configure(EntityTypeBuilder<LegacyArcGisRawParcelGeom> builder)
    {
        builder.ToTable("parcel_geom", schema: "legacy_arcgis_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.ArcGisObjectId).IsRequired();

        builder.Property(x => x.ArcGisApn).HasMaxLength(64);

        // GeomWkt is unbounded — polygon WKT can be substantial.
        // Postgres text + SQLite TEXT both handle this.
        builder.Property(x => x.GeomWkt).IsRequired();

        builder.Property(x => x.CentroidLat).IsRequired();
        builder.Property(x => x.CentroidLon).IsRequired();
        builder.Property(x => x.AreaSqFt).IsRequired();

        builder.Property(x => x.SourceServiceUrl)
            .IsRequired()
            .HasMaxLength(500);

        // Provenance.
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash)
            .IsRequired()
            .HasMaxLength(64);
        builder.Property(x => x.SourceRowHash)
            .IsRequired()
            .HasMaxLength(16);

        builder.Property(x => x.LandedAt).IsRequired();

        // ── Indexes per D0 plan §3.1 ──────────────────────────────

        // Per-batch uniqueness on the natural (CountyId, ArcGisObjectId)
        // identity. Same OBJECTID re-landed in a different LoadBatch
        // is allowed (different row); same OBJECTID in same batch is
        // a doctrine violation (the key-uniqueness gate fails).
        builder.HasIndex(x => new
        {
            x.CountyId,
            x.ArcGisObjectId,
            x.LoadBatchId,
        })
            .IsUnique()
            .HasDatabaseName("ux_legacy_arcgis_raw_parcel_geom_county_objectid");

        // Idempotency cleanup target: clear by load batch.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_arcgis_raw_parcel_geom_load_batch");

        // APN crosswalk lookup (used at canonical projection D3).
        builder.HasIndex(x => new { x.CountyId, x.ArcGisApn })
            .HasDatabaseName("ix_legacy_arcgis_raw_parcel_geom_apn");
    }
}

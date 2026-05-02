using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.GisTf;

namespace TerraFusion.Data.Configurations.GisTf;

/// <summary>
/// Slice G1-A: EF configuration for
/// <see cref="TerraFusion.Core.Entities.GisTf.TfParcelGeom"/>.
/// Schema 'gis_tf' on Postgres; flattened table name on SQLite
/// (which doesn't support schemas).
/// </summary>
public sealed class TfParcelGeomConfiguration : IEntityTypeConfiguration<TfParcelGeom>
{
    public void Configure(EntityTypeBuilder<TfParcelGeom> builder)
    {
        builder.ToTable("tf_parcel_geom", schema: "gis_tf");

        builder.HasKey(x => x.TfParcelGeomId);
        builder.Property(x => x.TfParcelGeomId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.ArcGisObjectId).IsRequired();

        builder.Property(x => x.ArcGisApn).HasMaxLength(50);

        // GeomWkt — text/unbounded so polygon WKT of any size lands.
        builder.Property(x => x.GeomWkt).IsRequired();

        builder.Property(x => x.CentroidLat).IsRequired();
        builder.Property(x => x.CentroidLon).IsRequired();
        builder.Property(x => x.AreaSqFt).IsRequired();

        builder.Property(x => x.SourceServiceUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.LastSyncedAt).IsRequired();

        builder.Property(x => x.IsActive).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Natural uniqueness: per county, an ArcGIS feature's OBJECTID is
        // the source-side identity. This index is the hard guard against
        // duplicate ArcGIS rows.
        builder.HasIndex(x => new { x.CountyId, x.ArcGisObjectId })
            .IsUnique()
            .HasDatabaseName("ix_tf_parcel_geom_county_arcgis_objectid_unique");

        // Active-row filter is a hot read path (map + Atlas surface).
        builder.HasIndex(x => new { x.CountyId, x.IsActive })
            .HasDatabaseName("ix_tf_parcel_geom_county_isactive");

        // Crosswalk-key lookup: parcel → geom.
        builder.HasIndex(x => x.TfParcelId)
            .HasDatabaseName("ix_tf_parcel_geom_tf_parcel_id");
    }
}

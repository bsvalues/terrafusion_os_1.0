using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGisTfParcelGeom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "gis_tf");

            migrationBuilder.CreateTable(
                name: "tf_parcel_geom",
                schema: "gis_tf",
                columns: table => new
                {
                    TfParcelGeomId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArcGisObjectId = table.Column<long>(type: "bigint", nullable: false),
                    ArcGisApn = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GeomWkt = table.Column<string>(type: "text", nullable: false),
                    CentroidLat = table.Column<double>(type: "double precision", nullable: false),
                    CentroidLon = table.Column<double>(type: "double precision", nullable: false),
                    AreaSqFt = table.Column<double>(type: "double precision", nullable: false),
                    SourceServiceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_parcel_geom", x => x.TfParcelGeomId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_geom_county_arcgis_objectid_unique",
                schema: "gis_tf",
                table: "tf_parcel_geom",
                columns: new[] { "CountyId", "ArcGisObjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_geom_county_isactive",
                schema: "gis_tf",
                table: "tf_parcel_geom",
                columns: new[] { "CountyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_geom_tf_parcel_id",
                schema: "gis_tf",
                table: "tf_parcel_geom",
                column: "TfParcelId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tf_parcel_geom",
                schema: "gis_tf");
        }
    }
}

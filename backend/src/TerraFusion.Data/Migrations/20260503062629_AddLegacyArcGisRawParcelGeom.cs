using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyArcGisRawParcelGeom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "legacy_arcgis_raw");

            migrationBuilder.CreateTable(
                name: "parcel_geom",
                schema: "legacy_arcgis_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArcGisObjectId = table.Column<long>(type: "bigint", nullable: false),
                    ArcGisApn = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    GeomWkt = table.Column<string>(type: "text", nullable: false),
                    CentroidLat = table.Column<double>(type: "double precision", nullable: false),
                    CentroidLon = table.Column<double>(type: "double precision", nullable: false),
                    AreaSqFt = table.Column<double>(type: "double precision", nullable: false),
                    SourceServiceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parcel_geom", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_arcgis_raw_parcel_geom_apn",
                schema: "legacy_arcgis_raw",
                table: "parcel_geom",
                columns: new[] { "CountyId", "ArcGisApn" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_arcgis_raw_parcel_geom_load_batch",
                schema: "legacy_arcgis_raw",
                table: "parcel_geom",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_legacy_arcgis_raw_parcel_geom_county_objectid",
                schema: "legacy_arcgis_raw",
                table: "parcel_geom",
                columns: new[] { "CountyId", "ArcGisObjectId", "LoadBatchId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parcel_geom",
                schema: "legacy_arcgis_raw");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthArcGisParcelGeomCurrent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "truth_arcgis");

            migrationBuilder.CreateTable(
                name: "parcel_geom_current",
                schema: "truth_arcgis",
                columns: table => new
                {
                    TruthParcelGeomId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArcGisObjectId = table.Column<long>(type: "bigint", nullable: false),
                    ArcGisApn = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    GeomWkt = table.Column<string>(type: "text", nullable: false),
                    CentroidLat = table.Column<double>(type: "double precision", nullable: false),
                    CentroidLon = table.Column<double>(type: "double precision", nullable: false),
                    AreaSqFt = table.Column<double>(type: "double precision", nullable: false),
                    SourceServiceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SourceLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    LandingLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parcel_geom_current", x => x.TruthParcelGeomId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_arcgis_parcel_geom_apn",
                schema: "truth_arcgis",
                table: "parcel_geom_current",
                columns: new[] { "CountyId", "ArcGisApn" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_arcgis_parcel_geom_landing_batch",
                schema: "truth_arcgis",
                table: "parcel_geom_current",
                column: "LandingLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_arcgis_parcel_geom_promotion_batch",
                schema: "truth_arcgis",
                table: "parcel_geom_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_truth_arcgis_parcel_geom_county_objectid",
                schema: "truth_arcgis",
                table: "parcel_geom_current",
                columns: new[] { "CountyId", "ArcGisObjectId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parcel_geom_current",
                schema: "truth_arcgis");
        }
    }
}

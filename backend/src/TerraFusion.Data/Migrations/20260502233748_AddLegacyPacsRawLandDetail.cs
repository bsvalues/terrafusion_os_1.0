using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawLandDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "land_detail",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    LandSegId = table.Column<long>(type: "bigint", nullable: false),
                    LandSegTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegStateCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegClassCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SoilCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    LandSegHomesite = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    SizeAcres = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    SizeSquareFeet = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegAgValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegAssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegEffAge = table.Column<short>(type: "smallint", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_land_detail", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_land_detail_4key",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                columns: new[] { "PropId", "PropValYr", "SupNum", "LandSegId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_land_detail_loadbatch",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_land_detail_type",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                column: "LandSegTypeCd");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_land_detail_use",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                column: "LandSegUseCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "land_detail",
                schema: "legacy_pacs_raw");
        }
    }
}

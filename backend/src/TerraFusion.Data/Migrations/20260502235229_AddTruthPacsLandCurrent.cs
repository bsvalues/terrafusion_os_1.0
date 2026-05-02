using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsLandCurrent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "land_current",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthLandId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    SourceLandLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSuppAssocLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    LandLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuppAssocLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_land_current", x => x.TruthLandId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_landbatch_propseg",
                schema: "truth_pacs",
                table: "land_current",
                columns: new[] { "LandLoadBatchId", "PropId", "LandSegId" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_promotion_batch",
                schema: "truth_pacs",
                table: "land_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_prop_year",
                schema: "truth_pacs",
                table: "land_current",
                columns: new[] { "PropId", "PropValYr" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_type",
                schema: "truth_pacs",
                table: "land_current",
                column: "LandSegTypeCd");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_use",
                schema: "truth_pacs",
                table: "land_current",
                column: "LandSegUseCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "land_current",
                schema: "truth_pacs");
        }
    }
}

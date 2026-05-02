using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsImprvCurrent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "imprv_current",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthImprvId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    ImprvId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvStateCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvClassCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvHomesite = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    ImprvVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvDesc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    YearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    EffectiveYearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    ActualYearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    SourceImprvLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSuppAssocLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprvLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuppAssocLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imprv_current", x => x.TruthImprvId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_imprvbatch_propimprv",
                schema: "truth_pacs",
                table: "imprv_current",
                columns: new[] { "ImprvLoadBatchId", "PropId", "ImprvId" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_promotion_batch",
                schema: "truth_pacs",
                table: "imprv_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_prop_year",
                schema: "truth_pacs",
                table: "imprv_current",
                columns: new[] { "PropId", "PropValYr" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_type",
                schema: "truth_pacs",
                table: "imprv_current",
                column: "ImprvTypeCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imprv_current",
                schema: "truth_pacs");
        }
    }
}

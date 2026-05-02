using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "truth_pacs");

            migrationBuilder.CreateTable(
                name: "sale",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthSaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChgOfOwnerId = table.Column<long>(type: "bigint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    SlCountyRatioCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    SlDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AdjSlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceSaleLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSuppAssocLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuppAssocLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sale", x => x.TruthSaleId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_chgofowner",
                schema: "truth_pacs",
                table: "sale",
                column: "ChgOfOwnerId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_promotion_batch",
                schema: "truth_pacs",
                table: "sale",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_salebatch_chgofowner",
                schema: "truth_pacs",
                table: "sale",
                columns: new[] { "SaleLoadBatchId", "ChgOfOwnerId" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_sl_dt",
                schema: "truth_pacs",
                table: "sale",
                column: "SlDt");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_source_sale_landed",
                schema: "truth_pacs",
                table: "sale",
                column: "SourceSaleLandedRowId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sale",
                schema: "truth_pacs");
        }
    }
}

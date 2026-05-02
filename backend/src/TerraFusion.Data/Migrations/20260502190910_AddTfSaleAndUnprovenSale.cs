using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTfSaleAndUnprovenSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "legacy_tf_unproven");

            migrationBuilder.CreateTable(
                name: "sale",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChgOfOwnerId = table.Column<long>(type: "bigint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    SlDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AdjSlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceTruthSaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sale", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_sale",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfSaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChgOfOwnerId = table.Column<long>(type: "bigint", nullable: false),
                    SlDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AdjSlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SaleQualified = table.Column<bool>(type: "boolean", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_sale", x => x.TfSaleId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_sale_promotionbatch",
                schema: "legacy_tf_unproven",
                table: "sale",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_sale_propid",
                schema: "legacy_tf_unproven",
                table: "sale",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_sale_reason",
                schema: "legacy_tf_unproven",
                table: "sale",
                column: "QuarantineReason");

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_chgofowner",
                schema: "canonical_tf",
                table: "tf_sale",
                column: "ChgOfOwnerId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_county_sl_dt",
                schema: "canonical_tf",
                table: "tf_sale",
                columns: new[] { "CountyId", "SlDt" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_parcel",
                schema: "canonical_tf",
                table: "tf_sale",
                column: "TfParcelId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_promotionbatch_chgofowner",
                schema: "canonical_tf",
                table: "tf_sale",
                columns: new[] { "PromotionLoadBatchId", "ChgOfOwnerId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sale",
                schema: "legacy_tf_unproven");

            migrationBuilder.DropTable(
                name: "tf_sale",
                schema: "canonical_tf");
        }
    }
}

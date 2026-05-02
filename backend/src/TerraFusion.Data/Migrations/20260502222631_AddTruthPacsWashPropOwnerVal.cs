using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsWashPropOwnerVal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wash_prop_owner_val",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthWpovId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandTaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandTaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvTaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvTaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    StateValueClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    StateValueNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    BoeStatus = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    DisasterProrationPct = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    SnrFrzImprvHs = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SnrFrzLandHs = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceWpovLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSuppAssocLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    WpovLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuppAssocLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wash_prop_owner_val", x => x.TruthWpovId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_wpov_boe_status",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                column: "BoeStatus");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_wpov_promotion_batch",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_wpov_prop_year",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                columns: new[] { "PropId", "PropValYr" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_wpov_wpovbatch_propowner",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                columns: new[] { "WpovLoadBatchId", "PropId", "OwnerId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wash_prop_owner_val",
                schema: "truth_pacs");
        }
    }
}

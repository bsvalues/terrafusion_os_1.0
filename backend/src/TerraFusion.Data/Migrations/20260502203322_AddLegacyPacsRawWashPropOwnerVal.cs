using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawWashPropOwnerVal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wash_prop_owner_val",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wash_prop_owner_val", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_wpov_4key",
                schema: "legacy_pacs_raw",
                table: "wash_prop_owner_val",
                columns: new[] { "PropId", "PropValYr", "SupNum", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_wpov_boe_status",
                schema: "legacy_pacs_raw",
                table: "wash_prop_owner_val",
                column: "BoeStatus");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_wpov_loadbatch",
                schema: "legacy_pacs_raw",
                table: "wash_prop_owner_val",
                column: "LoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wash_prop_owner_val",
                schema: "legacy_pacs_raw");
        }
    }
}

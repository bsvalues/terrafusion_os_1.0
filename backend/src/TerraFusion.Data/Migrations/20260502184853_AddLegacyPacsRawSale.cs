using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "legacy_pacs_raw");

            migrationBuilder.CreateTable(
                name: "sale",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChgOfOwnerId = table.Column<long>(type: "bigint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    SlCountyRatioCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    WacCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    SlRatioTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    SlDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AdjSlPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sale", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_sale_chgofowner",
                schema: "legacy_pacs_raw",
                table: "sale",
                column: "ChgOfOwnerId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_sale_county_ratio_cd",
                schema: "legacy_pacs_raw",
                table: "sale",
                column: "SlCountyRatioCd");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_sale_loadbatch",
                schema: "legacy_pacs_raw",
                table: "sale",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_sale_sl_dt",
                schema: "legacy_pacs_raw",
                table: "sale",
                column: "SlDt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sale",
                schema: "legacy_pacs_raw");
        }
    }
}

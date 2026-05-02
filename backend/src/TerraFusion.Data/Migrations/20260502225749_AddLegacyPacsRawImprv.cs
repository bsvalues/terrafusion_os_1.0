using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawImprv : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "imprv",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imprv", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_4key",
                schema: "legacy_pacs_raw",
                table: "imprv",
                columns: new[] { "PropId", "PropValYr", "SupNum", "ImprvId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_loadbatch",
                schema: "legacy_pacs_raw",
                table: "imprv",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_type",
                schema: "legacy_pacs_raw",
                table: "imprv",
                column: "ImprvTypeCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imprv",
                schema: "legacy_pacs_raw");
        }
    }
}

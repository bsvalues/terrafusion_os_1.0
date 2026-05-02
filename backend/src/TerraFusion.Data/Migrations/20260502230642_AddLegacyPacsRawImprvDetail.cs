using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawImprvDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "imprv_detail",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    ImprvId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvDetId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvDetTypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ImprvDetMethCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ImprvDetClassCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ImprvDetSubClassCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ConditionCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvDetArea = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvDetVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    NumUnits = table.Column<int>(type: "integer", nullable: true),
                    YrBuilt = table.Column<short>(type: "smallint", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imprv_detail", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_detail_5key",
                schema: "legacy_pacs_raw",
                table: "imprv_detail",
                columns: new[] { "PropId", "PropValYr", "SupNum", "ImprvId", "ImprvDetId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_detail_loadbatch",
                schema: "legacy_pacs_raw",
                table: "imprv_detail",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_detail_type",
                schema: "legacy_pacs_raw",
                table: "imprv_detail",
                column: "ImprvDetTypeCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imprv_detail",
                schema: "legacy_pacs_raw");
        }
    }
}

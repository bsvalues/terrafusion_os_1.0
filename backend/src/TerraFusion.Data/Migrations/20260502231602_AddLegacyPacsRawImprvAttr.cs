using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawImprvAttr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "imprv_attr",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    ImprvId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvDetId = table.Column<long>(type: "bigint", nullable: false),
                    IAttrValId = table.Column<long>(type: "bigint", nullable: false),
                    IAttrValCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AttrValueText = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AttrValueNumeric = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imprv_attr", x => x.LandedRowId);
                });

            migrationBuilder.CreateTable(
                name: "unresolved_imprv_attr",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    ImprvId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvDetId = table.Column<long>(type: "bigint", nullable: false),
                    IAttrValId = table.Column<long>(type: "bigint", nullable: false),
                    IAttrValCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AttrValueText = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AttrValueNumeric = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    LandingLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unresolved_imprv_attr", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_attr_6key",
                schema: "legacy_pacs_raw",
                table: "imprv_attr",
                columns: new[] { "PropId", "PropValYr", "SupNum", "ImprvId", "ImprvDetId", "IAttrValId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_attr_code",
                schema: "legacy_pacs_raw",
                table: "imprv_attr",
                column: "IAttrValCd");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_imprv_attr_loadbatch",
                schema: "legacy_pacs_raw",
                table: "imprv_attr",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_code",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                column: "IAttrValCd");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_landingbatch",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                column: "LandingLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_reason",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                column: "QuarantineReason");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imprv_attr",
                schema: "legacy_pacs_raw");

            migrationBuilder.DropTable(
                name: "unresolved_imprv_attr",
                schema: "legacy_tf_unproven");
        }
    }
}

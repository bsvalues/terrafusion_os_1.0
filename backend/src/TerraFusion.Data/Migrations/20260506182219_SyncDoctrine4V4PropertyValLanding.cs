using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine4V4PropertyValLanding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "property_val",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropertyUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    PropInactiveDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_val", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_val_3key",
                schema: "legacy_pacs_raw",
                table: "property_val",
                columns: new[] { "PropId", "PropValYr", "SupNum" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_val_loadbatch",
                schema: "legacy_pacs_raw",
                table: "property_val",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_val_use_cd",
                schema: "legacy_pacs_raw",
                table: "property_val",
                column: "PropertyUseCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "property_val",
                schema: "legacy_pacs_raw");
        }
    }
}

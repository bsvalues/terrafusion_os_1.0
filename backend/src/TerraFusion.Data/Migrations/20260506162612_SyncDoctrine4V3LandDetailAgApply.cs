using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine4V3LandDetailAgApply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgApply",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                type: "character varying(4)",
                maxLength: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgUseCd",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_land_detail_prop_year_agapply",
                schema: "legacy_pacs_raw",
                table: "land_detail",
                columns: new[] { "PropId", "PropValYr", "AgApply" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_legacy_pacs_raw_land_detail_prop_year_agapply",
                schema: "legacy_pacs_raw",
                table: "land_detail");

            migrationBuilder.DropColumn(
                name: "AgApply",
                schema: "legacy_pacs_raw",
                table: "land_detail");

            migrationBuilder.DropColumn(
                name: "AgUseCd",
                schema: "legacy_pacs_raw",
                table: "land_detail");
        }
    }
}

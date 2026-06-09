using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConversionEraToTruthPacs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "sale",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "owner_current",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "land_current",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "imprv_current",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_wpov_conversion_era",
                schema: "truth_pacs",
                table: "wash_prop_owner_val",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_conversion_era",
                schema: "truth_pacs",
                table: "sale",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_owner_conversion_era",
                schema: "truth_pacs",
                table: "owner_current",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_land_conversion_era",
                schema: "truth_pacs",
                table: "land_current",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_conversion_era",
                schema: "truth_pacs",
                table: "imprv_current",
                column: "ConversionEra");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_wpov_conversion_era",
                schema: "truth_pacs",
                table: "wash_prop_owner_val");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_sale_conversion_era",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_owner_conversion_era",
                schema: "truth_pacs",
                table: "owner_current");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_land_conversion_era",
                schema: "truth_pacs",
                table: "land_current");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_imprv_conversion_era",
                schema: "truth_pacs",
                table: "imprv_current");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "wash_prop_owner_val");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "owner_current");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "land_current");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "truth_pacs",
                table: "imprv_current");
        }
    }
}

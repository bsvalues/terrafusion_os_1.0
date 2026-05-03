using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConversionEraToCanonicalTf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_owner",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_land",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_improvement",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_conversion_era",
                schema: "canonical_tf",
                table: "tf_sale",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_owner_conversion_era",
                schema: "canonical_tf",
                table: "tf_owner",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_conversion_era",
                schema: "canonical_tf",
                table: "tf_land",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_feature_conversion_era",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_conversion_era",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_conversion_era",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                column: "ConversionEra");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tf_sale_conversion_era",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropIndex(
                name: "ix_tf_owner_conversion_era",
                schema: "canonical_tf",
                table: "tf_owner");

            migrationBuilder.DropIndex(
                name: "ix_tf_land_conversion_era",
                schema: "canonical_tf",
                table: "tf_land");

            migrationBuilder.DropIndex(
                name: "ix_tf_improvement_feature_conversion_era",
                schema: "canonical_tf",
                table: "tf_improvement_feature");

            migrationBuilder.DropIndex(
                name: "ix_tf_improvement_conversion_era",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropIndex(
                name: "ix_tf_assessment_wsdor_conversion_era",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_owner");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_land");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_improvement_feature");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor");
        }
    }
}

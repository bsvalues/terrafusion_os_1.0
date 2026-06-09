using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine2DualSurfaceSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "SaleQualified",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<string>(
                name: "CountyRatioCode",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountyRatioDescription",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CountyRatioQualified",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CountyRatioReviewed",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DorRatioQualified",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "SlCountyRatioCd",
                schema: "truth_pacs",
                table: "sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8);

            migrationBuilder.AddColumn<string>(
                name: "CountyRatioCode",
                schema: "truth_pacs",
                table: "sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountyRatioDescription",
                schema: "truth_pacs",
                table: "sale",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CountyRatioQualified",
                schema: "truth_pacs",
                table: "sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CountyRatioReviewed",
                schema: "truth_pacs",
                table: "sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DorRatioQualified",
                schema: "truth_pacs",
                table: "sale",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_county_review_qual",
                schema: "canonical_tf",
                table: "tf_sale",
                columns: new[] { "CountyRatioReviewed", "CountyRatioQualified" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_sale_dor_qualified",
                schema: "canonical_tf",
                table: "tf_sale",
                column: "DorRatioQualified");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_county_review_qual",
                schema: "truth_pacs",
                table: "sale",
                columns: new[] { "CountyRatioReviewed", "CountyRatioQualified" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_sale_dor_qualified",
                schema: "truth_pacs",
                table: "sale",
                column: "DorRatioQualified");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tf_sale_county_review_qual",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropIndex(
                name: "ix_tf_sale_dor_qualified",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_sale_county_review_qual",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_sale_dor_qualified",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioCode",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioDescription",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioQualified",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioReviewed",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "DorRatioQualified",
                schema: "canonical_tf",
                table: "tf_sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioCode",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioDescription",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioQualified",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "CountyRatioReviewed",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "DorRatioQualified",
                schema: "truth_pacs",
                table: "sale");

            migrationBuilder.AlterColumn<bool>(
                name: "SaleQualified",
                schema: "canonical_tf",
                table: "tf_sale",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "SlCountyRatioCd",
                schema: "truth_pacs",
                table: "sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8,
                oldNullable: true);
        }
    }
}

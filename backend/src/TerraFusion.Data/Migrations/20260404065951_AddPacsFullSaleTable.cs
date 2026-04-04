using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsFullSaleTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AdjustedSalePrice",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ContinueCurrentUse",
                table: "ComparableSales",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExciseNumber",
                table: "ComparableSales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeNoCalc",
                table: "ComparableSales",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LandOnlySale",
                table: "ComparableSales",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PacsChgOfOwnerId",
                table: "ComparableSales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PacsComputedRatio",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawAdjCode",
                table: "ComparableSales",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawAdjReason",
                table: "ComparableSales",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawComment",
                table: "ComparableSales",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawFinancingCode",
                table: "ComparableSales",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawRatioCd",
                table: "ComparableSales",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawRatioCdReason",
                table: "ComparableSales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawRatioTypeCd",
                table: "ComparableSales",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawSaleTypeCode",
                table: "ComparableSales",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SaleAdjustmentAmount",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SaleExemptionAmount",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SalesYear",
                table: "ComparableSales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SlLandAcres",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SlLandSqft",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SlLivingArea",
                table: "ComparableSales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SlYearBuilt",
                table: "ComparableSales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuppressOnRatioReason",
                table: "ComparableSales",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuppressOnRatioRptCd",
                table: "ComparableSales",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdjustedSalePrice",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "ContinueCurrentUse",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "ExciseNumber",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "IncludeNoCalc",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "LandOnlySale",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "PacsChgOfOwnerId",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "PacsComputedRatio",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawAdjCode",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawAdjReason",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawComment",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawFinancingCode",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawRatioCd",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawRatioCdReason",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawRatioTypeCd",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawSaleTypeCode",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SaleAdjustmentAmount",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SaleExemptionAmount",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SalesYear",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SlLandAcres",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SlLandSqft",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SlLivingArea",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SlYearBuilt",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SuppressOnRatioReason",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "SuppressOnRatioRptCd",
                table: "ComparableSales");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyAssessmentAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PropertyAssessments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "PropertyAssessments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PropertyAssessments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "PropertyAssessments",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "MarketValue",
                table: "Properties",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "LandValue",
                table: "Properties",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "ImprovementValue",
                table: "Properties",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<string>(
                name: "LegalDescription",
                table: "Properties",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LotDepth",
                table: "Properties",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LotWidthFront",
                table: "Properties",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Properties",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyUseCode",
                table: "Properties",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SitusCity",
                table: "Properties",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SitusState",
                table: "Properties",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SitusZip",
                table: "Properties",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxDistrictCode",
                table: "Properties",
                type: "character varying(23)",
                maxLength: 23,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxDistrictName",
                table: "Properties",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Zoning",
                table: "Properties",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FundId",
                table: "pacs_levy_tax_area_assocs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EndYear",
                table: "pacs_levy_rates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrimaryFundNumber",
                table: "pacs_levy_rates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VotedLevyAmount",
                table: "pacs_levy_rates",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VotedLevyRate",
                table: "pacs_levy_rates",
                type: "numeric(14,10)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SecondaryFeaturePctOfBiv",
                table: "CostMatrices",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PacsPropId",
                table: "ComparableSales",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "pacs_levy_cert_agg_limits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LevyCertRunId = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaNumber = table.Column<string>(type: "character varying(23)", maxLength: 23, nullable: true),
                    TaxAreaDescription = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OriginalLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    LevyReduction = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    FinalLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_cert_agg_limits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacs_levy_cert_const_limits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LevyCertRunId = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<bool>(type: "boolean", nullable: false),
                    OriginalLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    LevyReduction = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    FinalLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    OriginalSeniorLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    SeniorLevyReduction = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    FinalSeniorLevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_cert_const_limits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacs_levy_cert_data",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LevyCertRunId = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LevyCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LevyDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LevyTypeCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    LevyTypeDescription = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Voted = table.Column<bool>(type: "boolean", nullable: false),
                    TimberAssessedFull = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberAssessedHalf = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberAssessedRoll = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BudgetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TaxBase = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: true),
                    OutstandingItemCount = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_cert_data", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacs_levy_cert_highest_lawful",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LevyCertRunId = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LevyYear = table.Column<int>(type: "integer", nullable: false),
                    HighestLawfulLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_cert_highest_lawful", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyCertAggLimits_YearTaxArea",
                table: "pacs_levy_cert_agg_limits",
                columns: new[] { "Year", "TaxAreaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyCertConstLimits_YearDistrictCode",
                table: "pacs_levy_cert_const_limits",
                columns: new[] { "Year", "TaxDistrictId", "LevyCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyCertData_YearDistrictCode",
                table: "pacs_levy_cert_data",
                columns: new[] { "Year", "TaxDistrictId", "LevyCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyCertHighestLawful_YearDistrictCodeLevyYear",
                table: "pacs_levy_cert_highest_lawful",
                columns: new[] { "Year", "TaxDistrictId", "LevyCd", "LevyYear" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pacs_levy_cert_agg_limits");

            migrationBuilder.DropTable(
                name: "pacs_levy_cert_const_limits");

            migrationBuilder.DropTable(
                name: "pacs_levy_cert_data");

            migrationBuilder.DropTable(
                name: "pacs_levy_cert_highest_lawful");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PropertyAssessments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "PropertyAssessments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PropertyAssessments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PropertyAssessments");

            migrationBuilder.DropColumn(
                name: "LegalDescription",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LotDepth",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LotWidthFront",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "PropertyUseCode",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SitusCity",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SitusState",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SitusZip",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "TaxDistrictCode",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "TaxDistrictName",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Zoning",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FundId",
                table: "pacs_levy_tax_area_assocs");

            migrationBuilder.DropColumn(
                name: "EndYear",
                table: "pacs_levy_rates");

            migrationBuilder.DropColumn(
                name: "PrimaryFundNumber",
                table: "pacs_levy_rates");

            migrationBuilder.DropColumn(
                name: "VotedLevyAmount",
                table: "pacs_levy_rates");

            migrationBuilder.DropColumn(
                name: "VotedLevyRate",
                table: "pacs_levy_rates");

            migrationBuilder.DropColumn(
                name: "SecondaryFeaturePctOfBiv",
                table: "CostMatrices");

            migrationBuilder.DropColumn(
                name: "PacsPropId",
                table: "ComparableSales");

            migrationBuilder.AlterColumn<decimal>(
                name: "MarketValue",
                table: "Properties",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "LandValue",
                table: "Properties",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "ImprovementValue",
                table: "Properties",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsLevyTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pacs_levy_rates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LevyRate = table.Column<decimal>(type: "numeric(14,10)", nullable: false),
                    LevyTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LevyDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IncludeInCertification = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_rates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacs_levy_tax_area_assocs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaNumber = table.Column<string>(type: "character varying(23)", maxLength: 23, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_levy_tax_area_assocs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyRate_Year",
                table: "pacs_levy_rates",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "UQ_PacsLevyRate_YearDistrictCode",
                table: "pacs_levy_rates",
                columns: new[] { "Year", "TaxDistrictId", "LevyCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLevyTaxAreaAssoc_YearArea",
                table: "pacs_levy_tax_area_assocs",
                columns: new[] { "Year", "TaxAreaNumber" });

            migrationBuilder.CreateIndex(
                name: "UQ_PacsLevyTaxAreaAssoc_Composite",
                table: "pacs_levy_tax_area_assocs",
                columns: new[] { "Year", "TaxDistrictId", "LevyCd", "TaxAreaId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pacs_levy_rates");

            migrationBuilder.DropTable(
                name: "pacs_levy_tax_area_assocs");
        }
    }
}

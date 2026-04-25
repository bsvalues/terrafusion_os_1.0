using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCityAndStratumToCama : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "CamaCharacteristics",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyUseStratum",
                table: "CamaCharacteristics",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CamaChar_County_Year_City",
                table: "CamaCharacteristics",
                columns: new[] { "CountyId", "TaxYear", "City" });

            migrationBuilder.CreateIndex(
                name: "IX_CamaChar_County_Year_Hood",
                table: "CamaCharacteristics",
                columns: new[] { "CountyId", "TaxYear", "NeighborhoodCode" });

            migrationBuilder.CreateIndex(
                name: "IX_CamaChar_County_Year_Stratum",
                table: "CamaCharacteristics",
                columns: new[] { "CountyId", "TaxYear", "PropertyUseStratum" });

            migrationBuilder.CreateIndex(
                name: "IX_CamaChar_County_Year_Vintage",
                table: "CamaCharacteristics",
                columns: new[] { "CountyId", "TaxYear", "YearBuilt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CamaChar_County_Year_City",
                table: "CamaCharacteristics");

            migrationBuilder.DropIndex(
                name: "IX_CamaChar_County_Year_Hood",
                table: "CamaCharacteristics");

            migrationBuilder.DropIndex(
                name: "IX_CamaChar_County_Year_Stratum",
                table: "CamaCharacteristics");

            migrationBuilder.DropIndex(
                name: "IX_CamaChar_County_Year_Vintage",
                table: "CamaCharacteristics");

            migrationBuilder.DropColumn(
                name: "City",
                table: "CamaCharacteristics");

            migrationBuilder.DropColumn(
                name: "PropertyUseStratum",
                table: "CamaCharacteristics");
        }
    }
}

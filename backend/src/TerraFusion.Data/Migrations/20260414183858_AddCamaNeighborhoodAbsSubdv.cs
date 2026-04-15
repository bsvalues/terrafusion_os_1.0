using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCamaNeighborhoodAbsSubdv : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SaleQualification",
                table: "ComparableSales",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AbsSubdv",
                table: "CamaCharacteristics",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NeighborhoodCode",
                table: "CamaCharacteristics",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SaleQualification",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "AbsSubdv",
                table: "CamaCharacteristics");

            migrationBuilder.DropColumn(
                name: "NeighborhoodCode",
                table: "CamaCharacteristics");
        }
    }
}

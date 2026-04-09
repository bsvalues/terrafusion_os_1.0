using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddComparableSalesYearDateIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ComparableSales_CountyId_SalesYear_SaleDate",
                table: "ComparableSales",
                columns: new[] { "CountyId", "SalesYear", "SaleDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ComparableSales_CountyId_SalesYear_SaleDate",
                table: "ComparableSales");
        }
    }
}

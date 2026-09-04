using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260904023000_WALComparableSalePacsSourceIdentity")]
public partial class WALComparableSalePacsSourceIdentity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "PacsPropId",
            table: "ComparableSales",
            type: "integer",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ComparableSales_CountyId_PacsChgOfOwnerId_PacsPropId",
            table: "ComparableSales",
            columns: new[] { "CountyId", "PacsChgOfOwnerId", "PacsPropId" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ComparableSales_CountyId_PacsChgOfOwnerId_PacsPropId",
            table: "ComparableSales");

        migrationBuilder.DropColumn(
            name: "PacsPropId",
            table: "ComparableSales");
    }
}

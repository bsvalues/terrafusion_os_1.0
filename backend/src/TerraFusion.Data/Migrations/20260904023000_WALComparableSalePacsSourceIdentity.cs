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
        migrationBuilder.CreateIndex(
            name: "IX_ComparableSales_County_PacsSourceIdentity",
            table: "ComparableSales",
            columns: new[] { "CountyId", "PacsChgOfOwnerId", "PacsPropId", "ParcelId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ComparableSales_County_PacsSourceIdentity",
            table: "ComparableSales");
    }
}

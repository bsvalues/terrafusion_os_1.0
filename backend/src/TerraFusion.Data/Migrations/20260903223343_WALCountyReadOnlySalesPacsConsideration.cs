using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260903223343_WALCountyReadOnlySalesPacsConsideration")]
public partial class WALCountyReadOnlySalesPacsConsideration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PacsConsideration",
            table: "ComparableSales",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PacsConsideration",
            table: "ComparableSales");
    }
}

using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260827090000_WOSR011G_DossierMutationVersions")]
public partial class WOSR011G_DossierMutationVersions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(name: "Version", table: "DossierDocuments", type: "bigint", nullable: false, defaultValue: 1L);
        migrationBuilder.AddColumn<long>(name: "Version", table: "DossierEvidenceItems", type: "bigint", nullable: false, defaultValue: 1L);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Version", table: "DossierDocuments");
        migrationBuilder.DropColumn(name: "Version", table: "DossierEvidenceItems");
    }
}

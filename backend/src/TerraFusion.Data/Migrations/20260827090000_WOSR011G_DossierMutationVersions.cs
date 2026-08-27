using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

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

using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260907090000_CountyContextWorkflowSnapshots")]
public sealed class CountyContextWorkflowSnapshots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(name: "TaxYear", table: "DossierPackets", nullable: true);
        // SQLite can add a nullable reference directly; avoid rebuilding an existing packet table.
        if (ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
            migrationBuilder.Sql("ALTER TABLE \"DossierPackets\" ADD COLUMN \"AppealId\" TEXT NULL REFERENCES \"Appeals\" (\"Id\") ON DELETE RESTRICT;");
        else
        {
            migrationBuilder.AddColumn<Guid>(name: "AppealId", table: "DossierPackets", nullable: true);
            migrationBuilder.AddForeignKey(name: "FK_DossierPackets_Appeals_AppealId", table: "DossierPackets", column: "AppealId",
                principalTable: "Appeals", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        }
        migrationBuilder.CreateIndex(name: "IX_DossierPackets_AppealId", table: "DossierPackets", column: "AppealId");
        migrationBuilder.CreateIndex(name: "IX_DossierPackets_CountyId_AppealId", table: "DossierPackets", columns: new[] { "CountyId", "AppealId" });
        migrationBuilder.CreateIndex(name: "IX_DossierPackets_CountyId_TaxYear", table: "DossierPackets", columns: new[] { "CountyId", "TaxYear" });
        migrationBuilder.CreateTable(name: "DossierWorkflowRecords", columns: table => new
        {
            Id = table.Column<Guid>(nullable: false), CountyId = table.Column<Guid>(nullable: false),
            Kind = table.Column<string>(maxLength: 30, nullable: false), TaxYear = table.Column<int>(nullable: false),
            StudyId = table.Column<Guid>(nullable: true), DraftId = table.Column<Guid>(nullable: true),
            RequestId = table.Column<string>(maxLength: 200, nullable: false), RequestHash = table.Column<string>(maxLength: 64, nullable: false),
            Revision = table.Column<string>(maxLength: 64, nullable: false), ContentHash = table.Column<string>(maxLength: 64, nullable: false),
            PayloadJson = table.Column<string>(nullable: false), CreatedBy = table.Column<string>(maxLength: 200, nullable: false),
            CreatedAt = table.Column<DateTime>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_DossierWorkflowRecords", x => x.Id);
            table.ForeignKey("FK_DossierWorkflowRecords_Counties_CountyId", x => x.CountyId, "Counties", "Id", onDelete: ReferentialAction.Restrict);
            table.ForeignKey("FK_DossierWorkflowRecords_CountyStudySessions_StudyId", x => x.StudyId, "CountyStudySessions", "StudyId", onDelete: ReferentialAction.Restrict);
            table.ForeignKey("FK_DossierWorkflowRecords_DossierWorkflowRecords_DraftId", x => x.DraftId, "DossierWorkflowRecords", "Id", onDelete: ReferentialAction.Restrict);
        });
        migrationBuilder.CreateIndex("IX_DossierWorkflowRecords_CountyId_RequestId", "DossierWorkflowRecords", new[] { "CountyId", "RequestId" }, unique: true);
        migrationBuilder.CreateIndex("IX_DossierWorkflowRecords_CountyId_TaxYear_Kind", "DossierWorkflowRecords", new[] { "CountyId", "TaxYear", "Kind" });
        migrationBuilder.CreateIndex("IX_DossierWorkflowRecords_StudyId", "DossierWorkflowRecords", "StudyId");
        migrationBuilder.CreateIndex("IX_DossierWorkflowRecords_DraftId", "DossierWorkflowRecords", "DraftId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("DossierWorkflowRecords");
        if (ActiveProvider != "Microsoft.EntityFrameworkCore.Sqlite")
            migrationBuilder.DropForeignKey("FK_DossierPackets_Appeals_AppealId", "DossierPackets");
        migrationBuilder.DropIndex("IX_DossierPackets_AppealId", "DossierPackets");
        migrationBuilder.DropIndex("IX_DossierPackets_CountyId_AppealId", "DossierPackets");
        migrationBuilder.DropIndex("IX_DossierPackets_CountyId_TaxYear", "DossierPackets");
        if (ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
        {
            migrationBuilder.Sql("ALTER TABLE \"DossierPackets\" DROP COLUMN \"TaxYear\";");
            migrationBuilder.Sql("ALTER TABLE \"DossierPackets\" DROP COLUMN \"AppealId\";");
        }
        else
        {
            migrationBuilder.DropColumn("TaxYear", "DossierPackets");
            migrationBuilder.DropColumn("AppealId", "DossierPackets");
        }
    }
}

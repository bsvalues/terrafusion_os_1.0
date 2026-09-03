using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260903000000_WAL002JCountyCsvRowStaging")]
public partial class WAL002JCountyCsvRowStaging : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CountyCsvUploadRowStages",
            columns: table => new
            {
                BatchId = table.Column<Guid>(type: "uuid", nullable: false),
                CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                Dataset = table.Column<string>(
                    type: "character varying(16)",
                    maxLength: 16,
                    nullable: false),
                ContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                SchemaVersion = table.Column<string>(
                    type: "character varying(64)",
                    maxLength: 64,
                    nullable: false),
                TotalRowCount = table.Column<int>(type: "integer", nullable: false),
                StagedRowCount = table.Column<int>(type: "integer", nullable: false),
                QuarantinedRowCount = table.Column<int>(type: "integer", nullable: false),
                StagedRowsJson = table.Column<string>(type: "TEXT", nullable: false),
                QuarantinedRowsJson = table.Column<string>(type: "TEXT", nullable: false),
                ReasonCountsJson = table.Column<string>(type: "TEXT", nullable: false),
                ValidatedAtUtc = table.Column<DateTimeOffset>(
                    type: "timestamp with time zone",
                    nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CountyCsvUploadRowStages", stage => stage.BatchId);
                table.ForeignKey(
                    name: "FK_CountyCsvUploadRowStages_Counties_CountyId",
                    column: stage => stage.CountyId,
                    principalTable: "Counties",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_CountyCsvUploadRowStages_CountyCsvUploadBatches_BatchId",
                    column: stage => stage.BatchId,
                    principalTable: "CountyCsvUploadBatches",
                    principalColumn: "BatchId",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CountyCsvUploadRowStages_CountyId_ValidatedAtUtc",
            table: "CountyCsvUploadRowStages",
            columns: new[] { "CountyId", "ValidatedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CountyCsvUploadRowStages");
    }
}

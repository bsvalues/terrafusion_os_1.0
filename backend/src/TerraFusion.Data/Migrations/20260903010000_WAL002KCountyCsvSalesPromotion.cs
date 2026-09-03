using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260903010000_WAL002KCountyCsvSalesPromotion")]
public partial class WAL002KCountyCsvSalesPromotion : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CountyCsvUploadPromotions",
            columns: table => new
            {
                BatchId = table.Column<Guid>(type: "uuid", nullable: false),
                CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                PromotedByActorId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ContractId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                PromotedRowCount = table.Column<int>(type: "integer", nullable: false),
                ComparableSaleIdsJson = table.Column<string>(type: "TEXT", nullable: false),
                LatestSaleDate = table.Column<string>(type: "character(10)", fixedLength: true, maxLength: 10, nullable: false),
                PromotedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CountyCsvUploadPromotions", x => x.BatchId);
                table.ForeignKey(
                    name: "FK_CountyCsvUploadPromotions_Counties_CountyId",
                    column: x => x.CountyId,
                    principalTable: "Counties",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_CountyCsvUploadPromotions_CountyCsvUploadBatches_BatchId",
                    column: x => x.BatchId,
                    principalTable: "CountyCsvUploadBatches",
                    principalColumn: "BatchId",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CountyCsvUploadPromotions_CountyId_PromotedAtUtc",
            table: "CountyCsvUploadPromotions",
            columns: new[] { "CountyId", "PromotedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "CountyCsvUploadPromotions");
}

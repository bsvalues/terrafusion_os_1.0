using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonicalSaleQualifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CanonicalSaleQualifications",
                columns: table => new
                {
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChgOfOwnerId = table.Column<int>(type: "integer", nullable: false),
                    ComputedDecision = table.Column<int>(type: "integer", nullable: false),
                    WacCdSourceValue = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    WacCdCanonicalValue = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    WacCdAxisDecision = table.Column<int>(type: "integer", nullable: false),
                    SlRatioTypeCdSourceValue = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SlRatioTypeCdCanonicalValue = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SlRatioTypeCdAxisDecision = table.Column<int>(type: "integer", nullable: false),
                    SourceWorkbookId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceWorkbookLockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SalePrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CanonicalSaleQualifications", x => new { x.CountyId, x.ChgOfOwnerId });
                });

            migrationBuilder.CreateIndex(
                name: "IX_CanonSaleQual_County_Decision",
                table: "CanonicalSaleQualifications",
                columns: new[] { "CountyId", "ComputedDecision" });

            migrationBuilder.CreateIndex(
                name: "IX_CanonSaleQual_Workbook_Decision",
                table: "CanonicalSaleQualifications",
                columns: new[] { "SourceWorkbookId", "ComputedDecision" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CanonicalSaleQualifications");
        }
    }
}

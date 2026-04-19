using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesAuditEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PacsPropId",
                table: "ComparableSales");

            migrationBuilder.CreateTable(
                name: "SaleAuditDiagnoses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    StratumKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PrimaryDiagnosis = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    FindingsJson = table.Column<string>(type: "text", nullable: false),
                    SimulationResultJson = table.Column<string>(type: "text", nullable: true),
                    RecommendedAction = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RecommendedSaleIdsJson = table.Column<string>(type: "text", nullable: true),
                    RecommendedFactor = table.Column<decimal>(type: "decimal(6,4)", nullable: true),
                    DiagnosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsStale = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaleAuditDiagnoses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SalesAuditAdjustmentProposals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    StratumKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProposedFactor = table.Column<decimal>(type: "decimal(6,4)", nullable: false),
                    ProjectedCod = table.Column<decimal>(type: "decimal(8,4)", nullable: false),
                    ProjectedMedianRatio = table.Column<decimal>(type: "decimal(6,4)", nullable: false),
                    ProjectedPrd = table.Column<decimal>(type: "decimal(6,4)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesAuditAdjustmentProposals", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SaleAuditDiagnoses_CountyYearStrat",
                table: "SaleAuditDiagnoses",
                columns: new[] { "CountyId", "TaxYear", "StratumKey" });

            migrationBuilder.CreateIndex(
                name: "IX_SaleAuditDiagnoses_IsStale",
                table: "SaleAuditDiagnoses",
                column: "IsStale");

            migrationBuilder.CreateIndex(
                name: "IX_SalesAuditAdjProposals_CountyYearStatus",
                table: "SalesAuditAdjustmentProposals",
                columns: new[] { "CountyId", "TaxYear", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SalesAuditAdjustmentProposals");

            migrationBuilder.DropTable(
                name: "SaleAuditDiagnoses");

            migrationBuilder.AddColumn<int>(
                name: "PacsPropId",
                table: "ComparableSales",
                type: "integer",
                nullable: true);
        }
    }
}

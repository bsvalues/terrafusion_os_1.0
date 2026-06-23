using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddForgeCostReference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CapRateSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveYear = table.Column<int>(type: "integer", nullable: false),
                    RevalCycle = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "text", nullable: false),
                    Origin = table.Column<int>(type: "integer", nullable: false),
                    ProvenanceAuthor = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapRateSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CostFactorSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveYear = table.Column<int>(type: "integer", nullable: false),
                    RevalCycle = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "text", nullable: false),
                    Origin = table.Column<int>(type: "integer", nullable: false),
                    ProvenanceAuthor = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostFactorSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DepreciationSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveYear = table.Column<int>(type: "integer", nullable: false),
                    RevalCycle = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "text", nullable: false),
                    Origin = table.Column<int>(type: "integer", nullable: false),
                    ProvenanceAuthor = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepreciationSchedules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LandScheduleSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveYear = table.Column<int>(type: "integer", nullable: false),
                    RevalCycle = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "text", nullable: false),
                    Origin = table.Column<int>(type: "integer", nullable: false),
                    ProvenanceAuthor = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LandScheduleSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ParcelValuations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    PropertyType = table.Column<string>(type: "text", nullable: false),
                    Found = table.Column<bool>(type: "boolean", nullable: false),
                    IndicatedValue = table.Column<decimal>(type: "numeric", nullable: false),
                    BreakdownJson = table.Column<string>(type: "text", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    CalibrationStatus = table.Column<string>(type: "text", nullable: false),
                    EngineVersion = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParcelValuations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CapRates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CapRateSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    IncomePropertyClass = table.Column<string>(type: "text", nullable: false),
                    CapitalizationRate = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CapRates_CapRateSets_CapRateSetId",
                        column: x => x.CapRateSetId,
                        principalTable: "CapRateSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CostFactors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CostFactorSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprovementClassCode = table.Column<string>(type: "text", nullable: false),
                    SizeBandMinSqFt = table.Column<int>(type: "integer", nullable: true),
                    SizeBandMaxSqFt = table.Column<int>(type: "integer", nullable: true),
                    UnitCostPerSqFt = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostFactors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CostFactors_CostFactorSets_CostFactorSetId",
                        column: x => x.CostFactorSetId,
                        principalTable: "CostFactorSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DepreciationFactors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DepreciationScheduleId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgeMinYears = table.Column<int>(type: "integer", nullable: false),
                    AgeMaxYears = table.Column<int>(type: "integer", nullable: false),
                    DepreciationFraction = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepreciationFactors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepreciationFactors_DepreciationSchedules_DepreciationSched~",
                        column: x => x.DepreciationScheduleId,
                        principalTable: "DepreciationSchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LandRates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LandScheduleSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    Neighborhood = table.Column<string>(type: "text", nullable: false),
                    MarketUnitValue = table.Column<decimal>(type: "numeric", nullable: false),
                    CurrentUseUnitValue = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LandRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LandRates_LandScheduleSets_LandScheduleSetId",
                        column: x => x.LandScheduleSetId,
                        principalTable: "LandScheduleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CapRates_CapRateSetId",
                table: "CapRates",
                column: "CapRateSetId");

            migrationBuilder.CreateIndex(
                name: "IX_CostFactors_CostFactorSetId",
                table: "CostFactors",
                column: "CostFactorSetId");

            migrationBuilder.CreateIndex(
                name: "IX_DepreciationFactors_DepreciationScheduleId",
                table: "DepreciationFactors",
                column: "DepreciationScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_LandRates_LandScheduleSetId",
                table: "LandRates",
                column: "LandScheduleSetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CapRates");

            migrationBuilder.DropTable(
                name: "CostFactors");

            migrationBuilder.DropTable(
                name: "DepreciationFactors");

            migrationBuilder.DropTable(
                name: "LandRates");

            migrationBuilder.DropTable(
                name: "ParcelValuations");

            migrationBuilder.DropTable(
                name: "CapRateSets");

            migrationBuilder.DropTable(
                name: "CostFactorSets");

            migrationBuilder.DropTable(
                name: "DepreciationSchedules");

            migrationBuilder.DropTable(
                name: "LandScheduleSets");
        }
    }
}

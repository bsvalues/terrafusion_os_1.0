using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Levy.Migrations
{
    /// <inheritdoc />
    public partial class InitialLevy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Districts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DistrictType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Boundaries = table.Column<string>(type: "jsonb", nullable: true),
                    TotalAssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ParcelCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Districts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LevyMeasures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    LevyYear = table.Column<int>(type: "integer", nullable: false),
                    LevyType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TargetAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CalculatedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumRate = table.Column<decimal>(type: "numeric(10,6)", precision: 10, scale: 6, nullable: true),
                    CalculatedRate = table.Column<decimal>(type: "numeric(10,6)", precision: 10, scale: 6, nullable: false),
                    ApprovedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SubjectToLimit = table.Column<bool>(type: "boolean", nullable: false),
                    TotalAssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    QuantumOptimized = table.Column<bool>(type: "boolean", nullable: false),
                    AiConfidenceScore = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyMeasures", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DistrictParcels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    AddedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RemovedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistrictParcels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DistrictParcels_Districts_DistrictId",
                        column: x => x.DistrictId,
                        principalTable: "Districts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LevyMeasureDistricts",
                columns: table => new
                {
                    DistrictsId = table.Column<Guid>(type: "uuid", nullable: false),
                    LevyMeasuresId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyMeasureDistricts", x => new { x.DistrictsId, x.LevyMeasuresId });
                    table.ForeignKey(
                        name: "FK_LevyMeasureDistricts_Districts_DistrictsId",
                        column: x => x.DistrictsId,
                        principalTable: "Districts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LevyMeasureDistricts_LevyMeasures_LevyMeasuresId",
                        column: x => x.LevyMeasuresId,
                        principalTable: "LevyMeasures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LevyRates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LevyMeasureId = table.Column<Guid>(type: "uuid", nullable: false),
                    DistrictId = table.Column<Guid>(type: "uuid", nullable: true),
                    Rate = table.Column<decimal>(type: "numeric(10,6)", precision: 10, scale: 6, nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    LevyAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AiOptimalRate = table.Column<decimal>(type: "numeric(10,6)", precision: 10, scale: 6, nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LevyRates_Districts_DistrictId",
                        column: x => x.DistrictId,
                        principalTable: "Districts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LevyRates_LevyMeasures_LevyMeasureId",
                        column: x => x.LevyMeasureId,
                        principalTable: "LevyMeasures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LevyScenarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LevyMeasureId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ScenarioType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    LevyRate = table.Column<decimal>(type: "numeric(10,6)", precision: 10, scale: 6, nullable: false),
                    CalculatedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ProjectedRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CollectionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Assumptions = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AiInsights = table.Column<string>(type: "jsonb", nullable: true),
                    QuantumOptimized = table.Column<bool>(type: "boolean", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyScenarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LevyScenarios_LevyMeasures_LevyMeasureId",
                        column: x => x.LevyMeasureId,
                        principalTable: "LevyMeasures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RevenueProjections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LevyScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    FiscalYear = table.Column<int>(type: "integer", nullable: false),
                    ProjectedAssessedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ProjectedLevyAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ProjectedCollectionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    ProjectedNetRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    GrowthRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    ConfidenceLevel = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AiProjectedRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    RiskFactors = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevenueProjections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RevenueProjections_LevyScenarios_LevyScenarioId",
                        column: x => x.LevyScenarioId,
                        principalTable: "LevyScenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DistrictParcels_CountyId",
                table: "DistrictParcels",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_DistrictParcels_CountyId_DistrictId_ParcelNumber",
                table: "DistrictParcels",
                columns: new[] { "CountyId", "DistrictId", "ParcelNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DistrictParcels_DistrictId",
                table: "DistrictParcels",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_DistrictParcels_ParcelNumber",
                table: "DistrictParcels",
                column: "ParcelNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_CountyId",
                table: "Districts",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_CountyId_DistrictCode",
                table: "Districts",
                columns: new[] { "CountyId", "DistrictCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Districts_DistrictType",
                table: "Districts",
                column: "DistrictType");

            migrationBuilder.CreateIndex(
                name: "IX_LevyMeasureDistricts_LevyMeasuresId",
                table: "LevyMeasureDistricts",
                column: "LevyMeasuresId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyMeasures_CountyId",
                table: "LevyMeasures",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyMeasures_CountyId_LevyYear",
                table: "LevyMeasures",
                columns: new[] { "CountyId", "LevyYear" });

            migrationBuilder.CreateIndex(
                name: "IX_LevyMeasures_Status",
                table: "LevyMeasures",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_LevyRates_CountyId",
                table: "LevyRates",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyRates_DistrictId",
                table: "LevyRates",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyRates_LevyMeasureId",
                table: "LevyRates",
                column: "LevyMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyScenarios_CountyId",
                table: "LevyScenarios",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyScenarios_IsActive",
                table: "LevyScenarios",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_LevyScenarios_LevyMeasureId",
                table: "LevyScenarios",
                column: "LevyMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueProjections_CountyId",
                table: "RevenueProjections",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueProjections_FiscalYear",
                table: "RevenueProjections",
                column: "FiscalYear");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueProjections_LevyScenarioId",
                table: "RevenueProjections",
                column: "LevyScenarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DistrictParcels");

            migrationBuilder.DropTable(
                name: "LevyMeasureDistricts");

            migrationBuilder.DropTable(
                name: "LevyRates");

            migrationBuilder.DropTable(
                name: "RevenueProjections");

            migrationBuilder.DropTable(
                name: "Districts");

            migrationBuilder.DropTable(
                name: "LevyScenarios");

            migrationBuilder.DropTable(
                name: "LevyMeasures");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCountyStudioEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountyStudySessions",
                columns: table => new
                {
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    StudyType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BaselineVersion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ActiveSegmentSetId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyStudySessions", x => x.StudyId);
                });

            migrationBuilder.CreateTable(
                name: "CountyCohorts",
                columns: table => new
                {
                    CohortId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SelectionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    ParcelCount = table.Column<int>(type: "integer", nullable: false),
                    IsHybrid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyCohorts", x => x.CohortId);
                    table.ForeignKey(
                        name: "FK_CountyCohorts_CountyStudySessions_StudyId",
                        column: x => x.StudyId,
                        principalTable: "CountyStudySessions",
                        principalColumn: "StudyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CountySegmentSets",
                columns: table => new
                {
                    SegmentSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    IsBaseline = table.Column<bool>(type: "boolean", nullable: false),
                    DerivedFrom = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountySegmentSets", x => x.SegmentSetId);
                    table.ForeignKey(
                        name: "FK_CountySegmentSets_CountyStudySessions_StudyId",
                        column: x => x.StudyId,
                        principalTable: "CountyStudySessions",
                        principalColumn: "StudyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CountyScenarios",
                columns: table => new
                {
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CohortId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustmentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Parameters = table.Column<string>(type: "text", nullable: false),
                    Rationale = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CompareTargetId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImpactPreviewJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyScenarios", x => x.ScenarioId);
                    table.ForeignKey(
                        name: "FK_CountyScenarios_CountyCohorts_CohortId",
                        column: x => x.CohortId,
                        principalTable: "CountyCohorts",
                        principalColumn: "CohortId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CountyScenarios_CountyStudySessions_StudyId",
                        column: x => x.StudyId,
                        principalTable: "CountyStudySessions",
                        principalColumn: "StudyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CountySegments",
                columns: table => new
                {
                    SegmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    SegmentSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SegmentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RuleDefinition = table.Column<string>(type: "text", nullable: true),
                    GeographyRef = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ParcelCount = table.Column<int>(type: "integer", nullable: false),
                    MedianRatio = table.Column<decimal>(type: "numeric(6,4)", nullable: true),
                    CoefficientOfDispersion = table.Column<decimal>(type: "numeric(8,4)", nullable: true),
                    PriceRelatedDifferential = table.Column<decimal>(type: "numeric(6,4)", nullable: true),
                    StabilityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RiskScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ExceptionCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountySegments", x => x.SegmentId);
                    table.ForeignKey(
                        name: "FK_CountySegments_CountySegmentSets_SegmentSetId",
                        column: x => x.SegmentSetId,
                        principalTable: "CountySegmentSets",
                        principalColumn: "SegmentSetId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CountyAdjustmentSets",
                columns: table => new
                {
                    AdjustmentSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveScope = table.Column<string>(type: "text", nullable: false),
                    ApprovalState = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ApprovedBy = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RollbackToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyAdjustmentSets", x => x.AdjustmentSetId);
                    table.ForeignKey(
                        name: "FK_CountyAdjustmentSets_CountyScenarios_ScenarioId",
                        column: x => x.ScenarioId,
                        principalTable: "CountyScenarios",
                        principalColumn: "ScenarioId");
                });

            migrationBuilder.CreateTable(
                name: "CountyExceptionSets",
                columns: table => new
                {
                    ExceptionSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReasonCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelIdsJson = table.Column<string>(type: "text", nullable: false),
                    ParcelCount = table.Column<int>(type: "integer", nullable: false),
                    Destination = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyExceptionSets", x => x.ExceptionSetId);
                    table.ForeignKey(
                        name: "FK_CountyExceptionSets_CountyScenarios_SourceScenarioId",
                        column: x => x.SourceScenarioId,
                        principalTable: "CountyScenarios",
                        principalColumn: "ScenarioId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CountySpatialArtifacts",
                columns: table => new
                {
                    ArtifactId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArtifactType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AtlasLayerId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    PublishedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GeometryJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountySpatialArtifacts", x => x.ArtifactId);
                    table.ForeignKey(
                        name: "FK_CountySpatialArtifacts_CountyScenarios_SourceScenarioId",
                        column: x => x.SourceScenarioId,
                        principalTable: "CountyScenarios",
                        principalColumn: "ScenarioId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CountyAdjustmentSets_ScenarioId",
                table: "CountyAdjustmentSets",
                column: "ScenarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CountyAdjustmentSets_StudyState",
                table: "CountyAdjustmentSets",
                columns: new[] { "StudyId", "ApprovalState" });

            migrationBuilder.CreateIndex(
                name: "IX_CountyCohorts_Study",
                table: "CountyCohorts",
                column: "StudyId");

            migrationBuilder.CreateIndex(
                name: "IX_CountyExceptionSets_SourceScenarioId",
                table: "CountyExceptionSets",
                column: "SourceScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_CountyExceptionSets_StudyStatus",
                table: "CountyExceptionSets",
                columns: new[] { "StudyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CountyScenarios_CohortId",
                table: "CountyScenarios",
                column: "CohortId");

            migrationBuilder.CreateIndex(
                name: "IX_CountyScenarios_StudyStatus",
                table: "CountyScenarios",
                columns: new[] { "StudyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CountySegments_SetType",
                table: "CountySegments",
                columns: new[] { "SegmentSetId", "SegmentType" });

            migrationBuilder.CreateIndex(
                name: "IX_CountySegmentSets_StudyBaseline",
                table: "CountySegmentSets",
                columns: new[] { "StudyId", "IsBaseline" });

            migrationBuilder.CreateIndex(
                name: "IX_CountySpatialArtifacts_SourceScenarioId",
                table: "CountySpatialArtifacts",
                column: "SourceScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_CountySpatialArtifacts_StudyStatus",
                table: "CountySpatialArtifacts",
                columns: new[] { "StudyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CountyStudySessions_CountyYearStatus",
                table: "CountyStudySessions",
                columns: new[] { "CountyId", "TaxYear", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountyAdjustmentSets");

            migrationBuilder.DropTable(
                name: "CountyExceptionSets");

            migrationBuilder.DropTable(
                name: "CountySegments");

            migrationBuilder.DropTable(
                name: "CountySpatialArtifacts");

            migrationBuilder.DropTable(
                name: "CountySegmentSets");

            migrationBuilder.DropTable(
                name: "CountyScenarios");

            migrationBuilder.DropTable(
                name: "CountyCohorts");

            migrationBuilder.DropTable(
                name: "CountyStudySessions");
        }
    }
}

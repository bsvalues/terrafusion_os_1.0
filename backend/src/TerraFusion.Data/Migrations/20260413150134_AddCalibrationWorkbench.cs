using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCalibrationWorkbench : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalibrationMemos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Section1Purpose = table.Column<string>(type: "text", nullable: true),
                    Section2DataUsed = table.Column<string>(type: "text", nullable: true),
                    Section3Diagnostics = table.Column<string>(type: "text", nullable: true),
                    Section4ChangeMade = table.Column<string>(type: "text", nullable: true),
                    Section5Impact = table.Column<string>(type: "text", nullable: true),
                    Section6Verification = table.Column<string>(type: "text", nullable: true),
                    Section7SignOff = table.Column<string>(type: "text", nullable: true),
                    Section8Notes = table.Column<string>(type: "text", nullable: true),
                    CompletenessScore = table.Column<int>(type: "integer", nullable: false),
                    SignedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalibrationMemos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MatrixVersions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VersionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RateSnapshot = table.Column<string>(type: "text", nullable: false),
                    TriggeringEvent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SalesWindowStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SalesWindowEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SalesExclusionRules = table.Column<string>(type: "text", nullable: false),
                    PrdBefore = table.Column<decimal>(type: "numeric", nullable: true),
                    PrdAfter = table.Column<decimal>(type: "numeric", nullable: true),
                    PrbBefore = table.Column<decimal>(type: "numeric", nullable: true),
                    PrbAfter = table.Column<decimal>(type: "numeric", nullable: true),
                    CodBefore = table.Column<decimal>(type: "numeric", nullable: true),
                    CodAfter = table.Column<decimal>(type: "numeric", nullable: true),
                    CountyAvImpact = table.Column<decimal>(type: "numeric", nullable: true),
                    SignOffChain = table.Column<string>(type: "text", nullable: false),
                    CalibrationMemoId = table.Column<int>(type: "integer", nullable: true),
                    NextReviewDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentVersionId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatrixVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatrixVersions_CalibrationMemos_CalibrationMemoId",
                        column: x => x.CalibrationMemoId,
                        principalTable: "CalibrationMemos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MatrixVersions_MatrixVersions_ParentVersionId",
                        column: x => x.ParentVersionId,
                        principalTable: "MatrixVersions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CalibrationFindings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatrixVersionId = table.Column<int>(type: "integer", nullable: false),
                    Classification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BuildingType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RevalArea = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PrdValue = table.Column<decimal>(type: "numeric", nullable: true),
                    PrbValue = table.Column<decimal>(type: "numeric", nullable: true),
                    CodValue = table.Column<decimal>(type: "numeric", nullable: true),
                    ConfidenceLevel = table.Column<decimal>(type: "numeric", nullable: true),
                    ProposedAdjustmentPct = table.Column<decimal>(type: "numeric", nullable: true),
                    ProposedRateNew = table.Column<decimal>(type: "numeric", nullable: true),
                    EstimatedAvImpact = table.Column<decimal>(type: "numeric", nullable: true),
                    OutlierParcelIds = table.Column<string>(type: "text", nullable: true),
                    EvidenceSummary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ResolutionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AppraiserNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalibrationFindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalibrationFindings_MatrixVersions_MatrixVersionId",
                        column: x => x.MatrixVersionId,
                        principalTable: "MatrixVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RevalAreaEvidenceAges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatrixVersionId = table.Column<int>(type: "integer", nullable: false),
                    RevalArea = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Factor = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastRatioStudyDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SaleCount = table.Column<int>(type: "integer", nullable: false),
                    MedianRatio = table.Column<decimal>(type: "numeric", nullable: true),
                    EvidenceAgeMonths = table.Column<int>(type: "integer", nullable: false),
                    EvidenceStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevalAreaEvidenceAges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RevalAreaEvidenceAges_MatrixVersions_MatrixVersionId",
                        column: x => x.MatrixVersionId,
                        principalTable: "MatrixVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PropertyWorkbenchFlags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CalibrationFindingId = table.Column<int>(type: "integer", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyWorkbenchFlags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyWorkbenchFlags_CalibrationFindings_CalibrationFindi~",
                        column: x => x.CalibrationFindingId,
                        principalTable: "CalibrationFindings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalibrationFindings_MatrixVersionId",
                table: "CalibrationFindings",
                column: "MatrixVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_MatrixVersions_CalibrationMemoId",
                table: "MatrixVersions",
                column: "CalibrationMemoId");

            migrationBuilder.CreateIndex(
                name: "IX_MatrixVersions_ParentVersionId",
                table: "MatrixVersions",
                column: "ParentVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyWorkbenchFlags_CalibrationFindingId",
                table: "PropertyWorkbenchFlags",
                column: "CalibrationFindingId");

            migrationBuilder.CreateIndex(
                name: "IX_RevalAreaEvidenceAges_MatrixVersionId",
                table: "RevalAreaEvidenceAges",
                column: "MatrixVersionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyWorkbenchFlags");

            migrationBuilder.DropTable(
                name: "RevalAreaEvidenceAges");

            migrationBuilder.DropTable(
                name: "CalibrationFindings");

            migrationBuilder.DropTable(
                name: "MatrixVersions");

            migrationBuilder.DropTable(
                name: "CalibrationMemos");
        }
    }
}

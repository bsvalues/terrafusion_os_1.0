using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class ForgeValuationReferenceData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_dry_run_log_is_preview",
                schema: "sync_bridge",
                table: "dry_run_log");

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
                name: "CompSetCandidateReviews",
                columns: table => new
                {
                    CompSetCandidateReviewId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompSetCandidateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Disposition = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReviewerNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AcknowledgedFlagsJson = table.Column<string>(type: "text", nullable: true),
                    QualificationOverride = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    OverrideReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReviewedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompSetCandidateReviews", x => x.CompSetCandidateReviewId);
                });

            migrationBuilder.CreateTable(
                name: "CompSets",
                columns: table => new
                {
                    CompSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Mode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OfficialStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SubjectParcelId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SourceSystem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FederationStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProvenanceSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProvenanceRuntime = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProvenanceMutation = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProvenancePersistence = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceCompSetId = table.Column<Guid>(type: "uuid", nullable: true),
                    PromotionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PromotedFromMode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    PromotedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PromotedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CertifiedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CertifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompSets", x => x.CompSetId);
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
                name: "CompSetCandidates",
                columns: table => new
                {
                    CompSetCandidateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SalePrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PricePerSqft = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Qualification = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    IncludeReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProvenanceSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProvenanceRuntime = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProvenanceMutation = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProvenancePersistence = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    QualificationStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    DiagnosisStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    ReviewRequired = table.Column<bool>(type: "boolean", nullable: true),
                    DiagnosticFlagsJson = table.Column<string>(type: "text", nullable: true),
                    SupportSummary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DiagnosedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DiagnosedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DiagnosisVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompSetCandidates", x => x.CompSetCandidateId);
                    table.ForeignKey(
                        name: "FK_CompSetCandidates_CompSets_CompSetId",
                        column: x => x.CompSetId,
                        principalTable: "CompSets",
                        principalColumn: "CompSetId",
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

            migrationBuilder.AddCheckConstraint(
                name: "ck_dry_run_log_is_preview",
                schema: "sync_bridge",
                table: "dry_run_log",
                sql: "\"IsPreview\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_CapRates_CapRateSetId",
                table: "CapRates",
                column: "CapRateSetId");

            migrationBuilder.CreateIndex(
                name: "IX_CompSetCandidateReviews_CountyId_CompSetCandidateId",
                table: "CompSetCandidateReviews",
                columns: new[] { "CountyId", "CompSetCandidateId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompSetCandidateReviews_CountyId_CompSetId",
                table: "CompSetCandidateReviews",
                columns: new[] { "CountyId", "CompSetId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompSetCandidates_CompSetId",
                table: "CompSetCandidates",
                column: "CompSetId");

            migrationBuilder.CreateIndex(
                name: "IX_CompSetCandidates_CountyId_CompSetId",
                table: "CompSetCandidates",
                columns: new[] { "CountyId", "CompSetId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompSetCandidates_CountyId_ParcelId",
                table: "CompSetCandidates",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompSets_CountyId_CompSetId",
                table: "CompSets",
                columns: new[] { "CountyId", "CompSetId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompSets_CountyId_Mode_Status",
                table: "CompSets",
                columns: new[] { "CountyId", "Mode", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CompSets_CountyId_SourceCompSetId",
                table: "CompSets",
                columns: new[] { "CountyId", "SourceCompSetId" });

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
                name: "CompSetCandidateReviews");

            migrationBuilder.DropTable(
                name: "CompSetCandidates");

            migrationBuilder.DropTable(
                name: "CostFactors");

            migrationBuilder.DropTable(
                name: "DepreciationFactors");

            migrationBuilder.DropTable(
                name: "LandRates");

            migrationBuilder.DropTable(
                name: "CapRateSets");

            migrationBuilder.DropTable(
                name: "CompSets");

            migrationBuilder.DropTable(
                name: "CostFactorSets");

            migrationBuilder.DropTable(
                name: "DepreciationSchedules");

            migrationBuilder.DropTable(
                name: "LandScheduleSets");

            migrationBuilder.DropCheckConstraint(
                name: "ck_dry_run_log_is_preview",
                schema: "sync_bridge",
                table: "dry_run_log");

            migrationBuilder.AddCheckConstraint(
                name: "ck_dry_run_log_is_preview",
                schema: "sync_bridge",
                table: "dry_run_log",
                sql: "\"is_preview\" = true");
        }
    }
}

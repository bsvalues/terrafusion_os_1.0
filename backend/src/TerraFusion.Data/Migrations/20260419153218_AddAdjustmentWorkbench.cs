using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdjustmentWorkbench : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdjustmentSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppliedRunId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdjustmentSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdjustmentProposals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Magnitude = table.Column<decimal>(type: "numeric", nullable: false),
                    TargetNeighborhoodCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TargetFeatureCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TargetCityCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TargetQuintile = table.Column<int>(type: "integer", nullable: true),
                    ParcelListJson = table.Column<string>(type: "text", nullable: true),
                    Rationale = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ProposedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AdjustmentSetId = table.Column<Guid>(type: "uuid", nullable: true),
                    SimulationResultJson = table.Column<string>(type: "text", nullable: true),
                    SimulatedParcelsAffected = table.Column<int>(type: "integer", nullable: true),
                    SimulatedTotalDeltaAV = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdjustmentProposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdjustmentProposals_AdjustmentSets_AdjustmentSetId",
                        column: x => x.AdjustmentSetId,
                        principalTable: "AdjustmentSets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AdjustmentRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustmentSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    AppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AppliedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreStatsSnapshot = table.Column<string>(type: "text", nullable: false),
                    PostStatsSnapshot = table.Column<string>(type: "text", nullable: false),
                    ParcelsAffected = table.Column<int>(type: "integer", nullable: false),
                    TotalDeltaAV = table.Column<decimal>(type: "numeric", nullable: false),
                    IsReversion = table.Column<bool>(type: "boolean", nullable: false),
                    RevertedRunId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdjustmentRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdjustmentRuns_AdjustmentSets_AdjustmentSetId",
                        column: x => x.AdjustmentSetId,
                        principalTable: "AdjustmentSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ParcelAdjustmentRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustmentRunId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreAV = table.Column<decimal>(type: "numeric", nullable: false),
                    PostAV = table.Column<decimal>(type: "numeric", nullable: false),
                    DeltaAV = table.Column<decimal>(type: "numeric", nullable: false),
                    SourceProposalId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParcelAdjustmentRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParcelAdjustmentRecords_AdjustmentRuns_AdjustmentRunId",
                        column: x => x.AdjustmentRunId,
                        principalTable: "AdjustmentRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdjustmentProposals_AdjustmentSetId",
                table: "AdjustmentProposals",
                column: "AdjustmentSetId");

            migrationBuilder.CreateIndex(
                name: "IX_AdjustmentRuns_AdjustmentSetId",
                table: "AdjustmentRuns",
                column: "AdjustmentSetId");

            migrationBuilder.CreateIndex(
                name: "IX_ParcelAdjustmentRecords_AdjustmentRunId",
                table: "ParcelAdjustmentRecords",
                column: "AdjustmentRunId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdjustmentProposals");

            migrationBuilder.DropTable(
                name: "ParcelAdjustmentRecords");

            migrationBuilder.DropTable(
                name: "AdjustmentRuns");

            migrationBuilder.DropTable(
                name: "AdjustmentSets");
        }
    }
}

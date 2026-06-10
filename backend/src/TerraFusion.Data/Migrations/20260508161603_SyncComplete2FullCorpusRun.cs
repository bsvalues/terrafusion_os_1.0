using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncComplete2FullCorpusRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "full_corpus_lane_result",
                schema: "tf_workbench",
                columns: table => new
                {
                    LaneResultId = table.Column<Guid>(type: "uuid", nullable: false),
                    RunId = table.Column<Guid>(type: "uuid", nullable: false),
                    Lane = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BatchIdsJson = table.Column<string>(type: "text", nullable: true),
                    CountsJson = table.Column<string>(type: "text", nullable: true),
                    GateSummaryJson = table.Column<string>(type: "text", nullable: true),
                    QuarantineDeltaJson = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_full_corpus_lane_result", x => x.LaneResultId);
                });

            migrationBuilder.CreateTable(
                name: "full_corpus_reconciliation",
                schema: "tf_workbench",
                columns: table => new
                {
                    ReconciliationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RunId = table.Column<Guid>(type: "uuid", nullable: false),
                    Lane = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExpectedBasis = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PacsSourceCount = table.Column<long>(type: "bigint", nullable: false),
                    TfCanonicalCount = table.Column<long>(type: "bigint", nullable: false),
                    Delta = table.Column<long>(type: "bigint", nullable: false),
                    DeltaPct = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: false),
                    TolerancePct = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: false),
                    ReconciliationStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ComputedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_full_corpus_reconciliation", x => x.ReconciliationId);
                });

            migrationBuilder.CreateTable(
                name: "full_corpus_run",
                schema: "tf_workbench",
                columns: table => new
                {
                    RunId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    WorkingYear = table.Column<short>(type: "smallint", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CurrentLane = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    NextLaneOnResume = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_full_corpus_run", x => x.RunId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_full_corpus_lane_result_run_id",
                schema: "tf_workbench",
                table: "full_corpus_lane_result",
                column: "RunId");

            migrationBuilder.CreateIndex(
                name: "ux_full_corpus_lane_result_run_lane",
                schema: "tf_workbench",
                table: "full_corpus_lane_result",
                columns: new[] { "RunId", "Lane" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_full_corpus_reconciliation_run_id",
                schema: "tf_workbench",
                table: "full_corpus_reconciliation",
                column: "RunId");

            migrationBuilder.CreateIndex(
                name: "ux_full_corpus_reconciliation_run_lane",
                schema: "tf_workbench",
                table: "full_corpus_reconciliation",
                columns: new[] { "RunId", "Lane" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_full_corpus_run_started_at_desc",
                schema: "tf_workbench",
                table: "full_corpus_run",
                column: "StartedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_full_corpus_run_status",
                schema: "tf_workbench",
                table: "full_corpus_run",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "full_corpus_lane_result",
                schema: "tf_workbench");

            migrationBuilder.DropTable(
                name: "full_corpus_reconciliation",
                schema: "tf_workbench");

            migrationBuilder.DropTable(
                name: "full_corpus_run",
                schema: "tf_workbench");
        }
    }
}

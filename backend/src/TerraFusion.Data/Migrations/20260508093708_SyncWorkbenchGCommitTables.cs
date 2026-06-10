using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncWorkbenchGCommitTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "tf_workbench");

            migrationBuilder.CreateTable(
                name: "workbench_commit",
                schema: "tf_workbench",
                columns: table => new
                {
                    CommitId = table.Column<Guid>(type: "uuid", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OperatorId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CommitNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RoutedDecisionsApplied = table.Column<int>(type: "integer", nullable: false),
                    DismissedDecisionsApplied = table.Column<int>(type: "integer", nullable: false),
                    UniverseDistributionJson = table.Column<string>(type: "text", nullable: false),
                    RatioDistributionJson = table.Column<string>(type: "text", nullable: false),
                    CommittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workbench_commit", x => x.CommitId);
                });

            migrationBuilder.CreateTable(
                name: "workbench_commit_decision_link",
                schema: "tf_workbench",
                columns: table => new
                {
                    LinkId = table.Column<Guid>(type: "uuid", nullable: false),
                    CommitId = table.Column<Guid>(type: "uuid", nullable: false),
                    TriageId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    DecisionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RoutedToUniverse = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RoutedToIAttrValCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    DismissalReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workbench_commit_decision_link", x => x.LinkId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workbench_commit_committed_at_desc",
                schema: "tf_workbench",
                table: "workbench_commit",
                column: "CommittedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ux_workbench_commit_idempotency_key",
                schema: "tf_workbench",
                table: "workbench_commit",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_workbench_commit_decision_link_commit",
                schema: "tf_workbench",
                table: "workbench_commit_decision_link",
                column: "CommitId");

            migrationBuilder.CreateIndex(
                name: "ux_workbench_commit_decision_link_triage",
                schema: "tf_workbench",
                table: "workbench_commit_decision_link",
                column: "TriageId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "workbench_commit",
                schema: "tf_workbench");

            migrationBuilder.DropTable(
                name: "workbench_commit_decision_link",
                schema: "tf_workbench");
        }
    }
}

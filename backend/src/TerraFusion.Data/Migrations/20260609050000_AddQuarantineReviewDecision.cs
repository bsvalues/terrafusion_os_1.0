using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuarantineReviewDecision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SLICE-I (Workbench v0.2): append-only operator disposition log.
            // Additive-only: no existing table is dropped, modified, or truncated.
            // Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.
            migrationBuilder.CreateTable(
                name: "quarantine_review_decision",
                schema: "sync_bridge",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QuarantineId = table.Column<long>(type: "bigint", nullable: false),
                    Lane = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Disposition = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OperatorNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    OperatorIdentity = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quarantine_review_decision", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_qrd_created_at",
                schema: "sync_bridge",
                table: "quarantine_review_decision",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "ix_qrd_lane",
                schema: "sync_bridge",
                table: "quarantine_review_decision",
                column: "Lane");

            migrationBuilder.CreateIndex(
                name: "ix_qrd_quarantine_id_lane",
                schema: "sync_bridge",
                table: "quarantine_review_decision",
                columns: new[] { "QuarantineId", "Lane" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "quarantine_review_decision",
                schema: "sync_bridge");
        }
    }
}

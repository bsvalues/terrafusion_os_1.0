using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuarantineReviewDecisionRowRef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Additive: adds QuarantineRowRef for UUID-keyed quarantine lanes.
            // unresolved_imprv_attr uses UnprovenRowId uuid (not bigint) as PK.
            // QuarantineRowRef stores the string form of the source row PK.
            // Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §7.
            migrationBuilder.AddColumn<string>(
                name: "QuarantineRowRef",
                schema: "sync_bridge",
                table: "quarantine_review_decision",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_qrd_quarantine_row_ref_lane",
                schema: "sync_bridge",
                table: "quarantine_review_decision",
                columns: new[] { "QuarantineRowRef", "Lane" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_qrd_quarantine_row_ref_lane",
                schema: "sync_bridge",
                table: "quarantine_review_decision");

            migrationBuilder.DropColumn(
                name: "QuarantineRowRef",
                schema: "sync_bridge",
                table: "quarantine_review_decision");
        }
    }
}

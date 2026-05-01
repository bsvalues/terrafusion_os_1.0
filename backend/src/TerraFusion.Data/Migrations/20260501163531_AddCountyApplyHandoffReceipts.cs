using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCountyApplyHandoffReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountyApplyHandoffReceipts",
                columns: table => new
                {
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustmentSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Template = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreparedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EvidenceRef = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyApplyHandoffReceipts", x => x.ReceiptId);
                    table.ForeignKey(
                        name: "FK_CountyApplyHandoffReceipts_CountyAdjustmentSets_AdjustmentS~",
                        column: x => x.AdjustmentSetId,
                        principalTable: "CountyAdjustmentSets",
                        principalColumn: "AdjustmentSetId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CountyApplyHandoffReceipts_AdjustmentSet",
                table: "CountyApplyHandoffReceipts",
                column: "AdjustmentSetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CountyApplyHandoffReceipts_StudyStatus",
                table: "CountyApplyHandoffReceipts",
                columns: new[] { "StudyId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountyApplyHandoffReceipts");
        }
    }
}

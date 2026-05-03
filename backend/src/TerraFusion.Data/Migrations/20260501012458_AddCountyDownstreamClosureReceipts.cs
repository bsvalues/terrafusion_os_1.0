using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCountyDownstreamClosureReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountyDownstreamClosureReceipts",
                columns: table => new
                {
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExceptionSetId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Destination = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Template = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SegmentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SegmentLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DraftedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyDownstreamClosureReceipts", x => x.ReceiptId);
                    table.ForeignKey(
                        name: "FK_CountyDownstreamClosureReceipts_CountyExceptionSets_Excepti~",
                        column: x => x.ExceptionSetId,
                        principalTable: "CountyExceptionSets",
                        principalColumn: "ExceptionSetId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CountyDownstreamClosureReceipts_ExceptionSet",
                table: "CountyDownstreamClosureReceipts",
                column: "ExceptionSetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CountyDownstreamClosureReceipts_StudyStatus",
                table: "CountyDownstreamClosureReceipts",
                columns: new[] { "StudyId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountyDownstreamClosureReceipts");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsOwnerCurrent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "owner_current",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthOwnerCurrentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    AcctId = table.Column<long>(type: "bigint", nullable: false),
                    FileAsName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConfidentialFlag = table.Column<bool>(type: "boolean", nullable: false),
                    WebSuppression = table.Column<bool>(type: "boolean", nullable: false),
                    PctOwnership = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    TypeOfOwner = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    UdiStatus = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    BirthDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SourceOwnerLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceAccountLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSuppAssocLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuppAssocLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_owner_current", x => x.TruthOwnerCurrentId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_owner_current_owner",
                schema: "truth_pacs",
                table: "owner_current",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_owner_current_ownerbatch_propyr",
                schema: "truth_pacs",
                table: "owner_current",
                columns: new[] { "OwnerLoadBatchId", "PropId", "OwnerTaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_owner_current_promotion_batch",
                schema: "truth_pacs",
                table: "owner_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_owner_current_prop_year",
                schema: "truth_pacs",
                table: "owner_current",
                columns: new[] { "PropId", "OwnerTaxYr" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "owner_current",
                schema: "truth_pacs");
        }
    }
}

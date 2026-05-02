using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "owner",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    PctOwnership = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    TypeOfOwner = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    UdiStatus = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    BirthDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_owner", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_owner_4key",
                schema: "legacy_pacs_raw",
                table: "owner",
                columns: new[] { "PropId", "OwnerTaxYr", "SupNum", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_owner_loadbatch",
                schema: "legacy_pacs_raw",
                table: "owner",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_owner_ownerid",
                schema: "legacy_pacs_raw",
                table: "owner",
                column: "OwnerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "owner",
                schema: "legacy_pacs_raw");
        }
    }
}

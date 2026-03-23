using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsTaxAreaAssoc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pacs_tax_area_assocs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    PacsOwnerId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_tax_area_assocs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_tax_area_assocs_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PacsTaxAreaAssoc_ParcelId",
                table: "pacs_tax_area_assocs",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsTaxAreaAssoc_PropYearSupOwnerArea",
                table: "pacs_tax_area_assocs",
                columns: new[] { "PacsPropId", "PropValYear", "SupNum", "PacsOwnerId", "TaxAreaId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pacs_tax_area_assocs");
        }
    }
}

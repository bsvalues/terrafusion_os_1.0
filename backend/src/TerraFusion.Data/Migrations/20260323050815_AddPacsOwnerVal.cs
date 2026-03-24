using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsOwnerVal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pacs_owner_vals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    PacsOwnerId = table.Column<int>(type: "integer", nullable: false),
                    ImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberHsMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgHsMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValHs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValNhs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValP = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AppraisedClassified = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AppraisedNonClassified = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgHsUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberHsUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TaxableClassified = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_owner_vals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_owner_vals_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PacsOwnerVal_ParcelId",
                table: "pacs_owner_vals",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsOwnerVal_PropYearSupOwner",
                table: "pacs_owner_vals",
                columns: new[] { "PacsPropId", "PropValYear", "SupNum", "PacsOwnerId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pacs_owner_vals");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTruthPacsParcelSpineTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "parcel_spine",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    GeoId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    RefId1 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    RefId2 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    DbaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    AltDbaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    PropCreateDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SourcePropertyLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parcel_spine", x => x.TruthParcelId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_parcel_spine_promotion_batch",
                schema: "truth_pacs",
                table: "parcel_spine",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_parcel_spine_prop_id",
                schema: "truth_pacs",
                table: "parcel_spine",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_parcel_spine_property_batch",
                schema: "truth_pacs",
                table: "parcel_spine",
                column: "PropertyLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_parcel_spine_source_landed",
                schema: "truth_pacs",
                table: "parcel_spine",
                column: "SourcePropertyLandedRowId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parcel_spine",
                schema: "truth_pacs");
        }
    }
}

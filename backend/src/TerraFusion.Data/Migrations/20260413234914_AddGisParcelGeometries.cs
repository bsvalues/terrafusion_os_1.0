using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGisParcelGeometries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyWorkbenchFlags_CalibrationFindings_CalibrationFindi~",
                table: "PropertyWorkbenchFlags");

            migrationBuilder.AlterColumn<int>(
                name: "CalibrationFindingId",
                table: "PropertyWorkbenchFlags",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "GisParcelGeometries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParcelId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CentroidLat = table.Column<double>(type: "double precision", nullable: true),
                    CentroidLng = table.Column<double>(type: "double precision", nullable: true),
                    RingJson = table.Column<string>(type: "character varying(65535)", maxLength: 65535, nullable: true),
                    AreaSqFt = table.Column<double>(type: "double precision", nullable: true),
                    AreaAcres = table.Column<double>(type: "double precision", nullable: true),
                    OwnerName = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    LegalDescription = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SitusAddress = table.Column<string>(type: "character varying(173)", maxLength: 173, nullable: true),
                    TaxCodeArea = table.Column<string>(type: "character varying(23)", maxLength: 23, nullable: true),
                    NeighborhoodName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NeighborhoodCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    AppraisedValue = table.Column<double>(type: "double precision", nullable: true),
                    LandValue = table.Column<double>(type: "double precision", nullable: true),
                    ImprovementValue = table.Column<double>(type: "double precision", nullable: true),
                    AgUseValue = table.Column<double>(type: "double precision", nullable: true),
                    YearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    PrimaryUse = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ExemptTypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SketchUrl = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DocumentNumber = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    BaseCorrected = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ArcGisGlobalId = table.Column<string>(type: "character varying(38)", maxLength: 38, nullable: true),
                    ArcGisObjectId = table.Column<int>(type: "integer", nullable: true),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SourceVersionMs = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GisParcelGeometries", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyWorkbenchFlags_CalibrationFindings_CalibrationFindi~",
                table: "PropertyWorkbenchFlags",
                column: "CalibrationFindingId",
                principalTable: "CalibrationFindings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyWorkbenchFlags_CalibrationFindings_CalibrationFindi~",
                table: "PropertyWorkbenchFlags");

            migrationBuilder.DropTable(
                name: "GisParcelGeometries");

            migrationBuilder.AlterColumn<int>(
                name: "CalibrationFindingId",
                table: "PropertyWorkbenchFlags",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyWorkbenchFlags_CalibrationFindings_CalibrationFindi~",
                table: "PropertyWorkbenchFlags",
                column: "CalibrationFindingId",
                principalTable: "CalibrationFindings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

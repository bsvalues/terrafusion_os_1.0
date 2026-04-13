using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSaleRecordOutlierExclusion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SaleComparableRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatrixVersionId = table.Column<int>(type: "integer", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RevalArea = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BuildingType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric", nullable: false),
                    Ratio = table.Column<decimal>(type: "numeric", nullable: false),
                    IsOutlierIqr = table.Column<bool>(type: "boolean", nullable: false),
                    AiClassification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PacsFlags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ValueQuintile = table.Column<int>(type: "integer", nullable: false),
                    AgeBand = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaleComparableRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SaleComparableRecords_MatrixVersions_MatrixVersionId",
                        column: x => x.MatrixVersionId,
                        principalTable: "MatrixVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SaleRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatrixVersionId = table.Column<int>(type: "integer", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RevalArea = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BuildingType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric", nullable: false),
                    Ratio = table.Column<decimal>(type: "numeric", nullable: false),
                    IsOutlierIqr = table.Column<bool>(type: "boolean", nullable: false),
                    AiClassification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PacsFlags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ValueQuintile = table.Column<int>(type: "integer", nullable: false),
                    AgeBand = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaleRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SaleRecords_MatrixVersions_MatrixVersionId",
                        column: x => x.MatrixVersionId,
                        principalTable: "MatrixVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OutlierExclusions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatrixVersionId = table.Column<int>(type: "integer", nullable: false),
                    SaleRecordId = table.Column<int>(type: "integer", nullable: false),
                    DispositionType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AppraiserNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataProblemFlagged = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutlierExclusions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OutlierExclusions_SaleRecords_SaleRecordId",
                        column: x => x.SaleRecordId,
                        principalTable: "SaleRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OutlierExclusions_SaleRecordId",
                table: "OutlierExclusions",
                column: "SaleRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_SaleComparableRecords_MatrixVersionId",
                table: "SaleComparableRecords",
                column: "MatrixVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_SaleRecords_MatrixVersionId",
                table: "SaleRecords",
                column: "MatrixVersionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OutlierExclusions");

            migrationBuilder.DropTable(
                name: "SaleComparableRecords");

            migrationBuilder.DropTable(
                name: "SaleRecords");
        }
    }
}

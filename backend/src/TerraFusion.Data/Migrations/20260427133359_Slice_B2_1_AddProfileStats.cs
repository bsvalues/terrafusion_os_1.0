using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class Slice_B2_1_AddProfileStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SyncProfileCodeCandidates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ColumnName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DistinctCount = table.Column<int>(type: "integer", nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    DistinctRatio = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    Reason = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CandidateCodesJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileCodeCandidates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileCodeCandidates_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileCodeCandidates_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileColumnStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ColumnName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ParentRowCount = table.Column<int>(type: "integer", nullable: false),
                    NullCount = table.Column<long>(type: "bigint", nullable: false),
                    NullPct = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    DistinctCount = table.Column<int>(type: "integer", nullable: false),
                    DistinctCountIsExact = table.Column<bool>(type: "boolean", nullable: false),
                    MinValue = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    MaxValue = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    SampleValuesJson = table.Column<string>(type: "text", nullable: true),
                    TopValuesJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileColumnStats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileColumnStats_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileColumnStats_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileTableStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    RowCount = table.Column<long>(type: "bigint", nullable: false),
                    RowCountIsExact = table.Column<bool>(type: "boolean", nullable: false),
                    SampleRowCount = table.Column<int>(type: "integer", nullable: false),
                    SamplingMethod = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileTableStats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileTableStats_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileTableStats_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileCodeCandidates_CountyId_SourceSystem_TableName_C~",
                table: "SyncProfileCodeCandidates",
                columns: new[] { "CountyId", "SourceSystem", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileCodeCandidates_SyncBatchId_SchemaName_TableName_~",
                table: "SyncProfileCodeCandidates",
                columns: new[] { "SyncBatchId", "SchemaName", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileColumnStats_CountyId_SourceSystem_TableName_Colu~",
                table: "SyncProfileColumnStats",
                columns: new[] { "CountyId", "SourceSystem", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileColumnStats_SyncBatchId_SchemaName_TableName_Col~",
                table: "SyncProfileColumnStats",
                columns: new[] { "SyncBatchId", "SchemaName", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTableStats_CountyId_SourceSystem_SchemaName_Tabl~",
                table: "SyncProfileTableStats",
                columns: new[] { "CountyId", "SourceSystem", "SchemaName", "TableName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTableStats_SyncBatchId_SchemaName_TableName",
                table: "SyncProfileTableStats",
                columns: new[] { "SyncBatchId", "SchemaName", "TableName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncProfileCodeCandidates");

            migrationBuilder.DropTable(
                name: "SyncProfileColumnStats");

            migrationBuilder.DropTable(
                name: "SyncProfileTableStats");
        }
    }
}

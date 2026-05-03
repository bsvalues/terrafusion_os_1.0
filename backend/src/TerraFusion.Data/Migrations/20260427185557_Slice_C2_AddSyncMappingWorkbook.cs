using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class Slice_C2_AddSyncMappingWorkbook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SyncMappingWorkbooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceConnectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfileBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncMappingWorkbooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncMappingWorkbooks_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SyncMappingColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkbookId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeCandidateId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceSchema = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SourceTable = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    SourceColumn = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    MappingLane = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CanonicalTarget = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DistinctCount = table.Column<int>(type: "integer", nullable: true),
                    DistinctRatio = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    ReviewStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncMappingColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncMappingColumns_SyncMappingWorkbooks_WorkbookId",
                        column: x => x.WorkbookId,
                        principalTable: "SyncMappingWorkbooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncMappingCodeValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    MappingColumnId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceValue = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    SourceLabel = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    ObservedCount = table.Column<long>(type: "bigint", nullable: true),
                    CanonicalValue = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReviewStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsExcluded = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncMappingCodeValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncMappingCodeValues_SyncMappingColumns_MappingColumnId",
                        column: x => x.MappingColumnId,
                        principalTable: "SyncMappingColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingCodeValues_CountyId_IsExcluded",
                table: "SyncMappingCodeValues",
                columns: new[] { "CountyId", "IsExcluded" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingCodeValues_CountyId_ReviewStatus",
                table: "SyncMappingCodeValues",
                columns: new[] { "CountyId", "ReviewStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingCodeValues_MappingColumnId_SourceValue",
                table: "SyncMappingCodeValues",
                columns: new[] { "MappingColumnId", "SourceValue" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingColumns_CountyId_MappingLane_ReviewStatus",
                table: "SyncMappingColumns",
                columns: new[] { "CountyId", "MappingLane", "ReviewStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingColumns_CountyId_SourceSchema_SourceTable_Source~",
                table: "SyncMappingColumns",
                columns: new[] { "CountyId", "SourceSchema", "SourceTable", "SourceColumn" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingColumns_WorkbookId_SourceSchema_SourceTable_Sour~",
                table: "SyncMappingColumns",
                columns: new[] { "WorkbookId", "SourceSchema", "SourceTable", "SourceColumn" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingWorkbooks_CountyId_Name",
                table: "SyncMappingWorkbooks",
                columns: new[] { "CountyId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingWorkbooks_CountyId_Status",
                table: "SyncMappingWorkbooks",
                columns: new[] { "CountyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncMappingWorkbooks_ProfileBatchId",
                table: "SyncMappingWorkbooks",
                column: "ProfileBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncMappingCodeValues");

            migrationBuilder.DropTable(
                name: "SyncMappingColumns");

            migrationBuilder.DropTable(
                name: "SyncMappingWorkbooks");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncCountyActiveWorkbook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SyncCountyActiveWorkbooks",
                columns: table => new
                {
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActiveWorkbookId = table.Column<Guid>(type: "uuid", nullable: false),
                    SetAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SetBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SetReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncCountyActiveWorkbooks", x => x.CountyId);
                    table.ForeignKey(
                        name: "FK_SyncCountyActiveWorkbooks_SyncMappingWorkbooks_ActiveWorkbo~",
                        column: x => x.ActiveWorkbookId,
                        principalTable: "SyncMappingWorkbooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SyncCountyActiveWorkbooks_ActiveWorkbookId",
                table: "SyncCountyActiveWorkbooks",
                column: "ActiveWorkbookId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncCountyActiveWorkbooks");
        }
    }
}

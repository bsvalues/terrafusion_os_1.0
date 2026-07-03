using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AU2_2_AuditEventsCountyIdAndTrailIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CountyId",
                table: "AuditEvents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_EntityId_Timestamp",
                table: "AuditEvents",
                columns: new[] { "EntityId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditEvents_EntityId_Timestamp",
                table: "AuditEvents");

            migrationBuilder.DropColumn(
                name: "CountyId",
                table: "AuditEvents");
        }
    }
}

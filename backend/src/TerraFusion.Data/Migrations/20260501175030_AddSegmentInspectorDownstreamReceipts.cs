using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSegmentInspectorDownstreamReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CountyDownstreamClosureReceipts_ExceptionSet",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.AlterColumn<Guid>(
                name: "ExceptionSetId",
                table: "CountyDownstreamClosureReceipts",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "DownstreamEntityId",
                table: "CountyDownstreamClosureReceipts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvidenceRef",
                table: "CountyDownstreamClosureReceipts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "CountyDownstreamClosureReceipts",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceType",
                table: "CountyDownstreamClosureReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ExceptionQueue");

            migrationBuilder.CreateIndex(
                name: "IX_CountyDownstreamClosureReceipts_ExceptionSet",
                table: "CountyDownstreamClosureReceipts",
                column: "ExceptionSetId",
                unique: true,
                filter: "\"ExceptionSetId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CountyDownstreamClosureReceipts_SourceSegment",
                table: "CountyDownstreamClosureReceipts",
                columns: new[] { "SourceType", "StudyId", "SegmentId", "Destination" },
                unique: true,
                filter: "\"SourceType\" = 'SegmentInspector'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CountyDownstreamClosureReceipts_ExceptionSet",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.DropIndex(
                name: "IX_CountyDownstreamClosureReceipts_SourceSegment",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.DropColumn(
                name: "DownstreamEntityId",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.DropColumn(
                name: "EvidenceRef",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "CountyDownstreamClosureReceipts");

            migrationBuilder.AlterColumn<Guid>(
                name: "ExceptionSetId",
                table: "CountyDownstreamClosureReceipts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CountyDownstreamClosureReceipts_ExceptionSet",
                table: "CountyDownstreamClosureReceipts",
                column: "ExceptionSetId",
                unique: true);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncSourceConnection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SyncSourceConnections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ConnectionType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Server = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Database = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AuthMode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AdditionalOptions = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastSuccessfulConnectionAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastConnectionErrorAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastConnectionErrorMessage = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncSourceConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncSourceConnections_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SyncSourceConnections_CountyId_IsActive",
                table: "SyncSourceConnections",
                columns: new[] { "CountyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncSourceConnections_CountyId_Name",
                table: "SyncSourceConnections",
                columns: new[] { "CountyId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncSourceConnections_CountyId_SourceSystem",
                table: "SyncSourceConnections",
                columns: new[] { "CountyId", "SourceSystem" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncSourceConnections");
        }
    }
}

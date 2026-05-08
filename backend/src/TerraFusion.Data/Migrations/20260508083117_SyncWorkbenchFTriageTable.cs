using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncWorkbenchFTriageTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "unproven_imprv_attr_triage",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    TriageId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RoutedToUniverse = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RoutedToIAttrValCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    DismissalReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OperatorNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unproven_imprv_attr_triage", x => x.TriageId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_unproven_imprv_attr_triage_status",
                schema: "legacy_tf_unproven",
                table: "unproven_imprv_attr_triage",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ux_unproven_imprv_attr_triage_unproven_row",
                schema: "legacy_tf_unproven",
                table: "unproven_imprv_attr_triage",
                column: "UnprovenRowId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "unproven_imprv_attr_triage",
                schema: "legacy_tf_unproven");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPacsRawAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "account",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcctId = table.Column<long>(type: "bigint", nullable: false),
                    FileAsName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DlNum = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DlState = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    EmailAddr = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    WebSuppression = table.Column<bool>(type: "boolean", nullable: false),
                    ConfidentialFlag = table.Column<bool>(type: "boolean", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_account_acctid",
                schema: "legacy_pacs_raw",
                table: "account",
                column: "AcctId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_account_confidential",
                schema: "legacy_pacs_raw",
                table: "account",
                column: "ConfidentialFlag");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_account_loadbatch",
                schema: "legacy_pacs_raw",
                table: "account",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_account_websupp",
                schema: "legacy_pacs_raw",
                table: "account",
                column: "WebSuppression");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account",
                schema: "legacy_pacs_raw");
        }
    }
}

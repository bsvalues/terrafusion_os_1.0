using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine5SalesQualificationCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tf_doctrine_sales_qualification_codes",
                schema: "doctrine_tf",
                columns: table => new
                {
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    SurfaceCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceField = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EffectiveStartYear = table.Column<short>(type: "smallint", nullable: false),
                    EffectiveEndYear = table.Column<short>(type: "smallint", nullable: true),
                    QualifiedCodesJson = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false, defaultValue: "[]"),
                    EvidenceSource = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false, defaultValue: ""),
                    Confidence = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "MEDIUM"),
                    ActiveFlag = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_doctrine_sales_qualification_codes", x => x.RuleId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_sales_qualification_codes_active",
                schema: "doctrine_tf",
                table: "tf_doctrine_sales_qualification_codes",
                column: "ActiveFlag");

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_sales_qualification_codes_source_field",
                schema: "doctrine_tf",
                table: "tf_doctrine_sales_qualification_codes",
                column: "SourceField");

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_sales_qualification_codes_surface_start",
                schema: "doctrine_tf",
                table: "tf_doctrine_sales_qualification_codes",
                columns: new[] { "SurfaceCode", "EffectiveStartYear" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tf_doctrine_sales_qualification_codes",
                schema: "doctrine_tf");
        }
    }
}

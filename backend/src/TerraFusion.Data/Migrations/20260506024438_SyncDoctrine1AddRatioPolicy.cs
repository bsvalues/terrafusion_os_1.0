using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine1AddRatioPolicy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "doctrine_tf");

            migrationBuilder.CreateTable(
                name: "tf_doctrine_ratio_policy",
                schema: "doctrine_tf",
                columns: table => new
                {
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    County = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EffectiveStartYear = table.Column<int>(type: "integer", nullable: false),
                    EffectiveEndYear = table.Column<int>(type: "integer", nullable: true),
                    StudyName = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceField = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    QualifiedCodesCsv = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false, defaultValue: ""),
                    ExcludedCodesCsv = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false, defaultValue: ""),
                    SqlFragment = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    EvidenceSource = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Confidence = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "MED"),
                    ApprovedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_doctrine_ratio_policy", x => x.RuleId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_ratio_policy_county_study_start",
                schema: "doctrine_tf",
                table: "tf_doctrine_ratio_policy",
                columns: new[] { "County", "StudyName", "EffectiveStartYear" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tf_doctrine_ratio_policy",
                schema: "doctrine_tf");
        }
    }
}

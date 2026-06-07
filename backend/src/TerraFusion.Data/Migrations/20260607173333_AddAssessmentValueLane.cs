using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAssessmentValueLane : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SubClassCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MethodCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FeatureCode",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "ClassCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AgMarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AgUseVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AppraisedVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AssessedVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HsCapNewVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HsCapPrevVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ImprvHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ImprvNonHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LandHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LandNonHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TimberMarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TimberUseVal",
                schema: "legacy_pacs_raw",
                table: "property_val",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "assessment_current",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthAssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentYear = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AgUseVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AgMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TimberUseVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TimberMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    HsCapNewVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    HsCapPrevVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PropertyUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SourcePropertyValLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyValLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversionEra = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_current", x => x.TruthAssessmentId);
                });

            migrationBuilder.CreateTable(
                name: "tf_assessment",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfAssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentYear = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AgUseVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AgMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TimberUseVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TimberMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    HsCapNewVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    HsCapPrevVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PropertyUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversionEra = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_assessment", x => x.TfAssessmentId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_assessment_conversion_era",
                schema: "truth_pacs",
                table: "assessment_current",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_assessment_promotion_batch",
                schema: "truth_pacs",
                table: "assessment_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_assessment_prop_year",
                schema: "truth_pacs",
                table: "assessment_current",
                columns: new[] { "PropId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_conversion_era",
                schema: "canonical_tf",
                table: "tf_assessment",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_county_year",
                schema: "canonical_tf",
                table: "tf_assessment",
                columns: new[] { "CountyId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_parcel_year",
                schema: "canonical_tf",
                table: "tf_assessment",
                columns: new[] { "TfParcelId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_promotion_batch",
                schema: "canonical_tf",
                table: "tf_assessment",
                column: "PromotionLoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assessment_current",
                schema: "truth_pacs");

            migrationBuilder.DropTable(
                name: "tf_assessment",
                schema: "canonical_tf");

            migrationBuilder.DropColumn(
                name: "AgMarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "AgUseVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "AppraisedVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "AssessedVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "HsCapNewVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "HsCapPrevVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "ImprvHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "ImprvNonHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "LandHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "LandNonHstdVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "MarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "TimberMarketVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.DropColumn(
                name: "TimberUseVal",
                schema: "legacy_pacs_raw",
                table: "property_val");

            migrationBuilder.AlterColumn<string>(
                name: "SubClassCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MethodCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FeatureCode",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128);

            migrationBuilder.AlterColumn<string>(
                name: "ClassCd",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128,
                oldNullable: true);
        }
    }
}
